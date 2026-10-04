/**
 * Asking to take money out.
 *
 * A withdrawal is a request, not a transfer: it is recorded as PENDING and the
 * amount leaves the balance immediately. Holding the money at request time
 * rather than at approval is deliberate — otherwise the same balance can be
 * requested twice, and the second request is discovered only when someone tries
 * to pay it.
 *
 * Nothing here pays anybody. There is no payment rail behind it, and the
 * account that approves these does not exist yet; see
 * docs/engine-host-pendencias.md.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cashierSettings } from "@/lib/cabinet/cashier";

export const dynamic = "force-dynamic";

/** Accepts "1234.5" and "1.234,50"; refuses anything that is not a number. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Money has two decimal places; more is a typo, not a precision requirement.
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const settings = await cashierSettings();
  const method = settings.methods.find(
    (candidate) => candidate.withdrawal && candidate.id === body.method,
  );
  if (!method) return NextResponse.json({ error: "unknown withdrawal method" }, { status: 400 });

  const errors: Record<string, string[]> = {};
  const amount = parseAmount(typeof body.amount === "string" ? body.amount : "");
  const destination = typeof body.destination === "string" ? body.destination.trim() : "";

  if (amount === null) errors.amount = ["Enter an amount."];
  else if (amount < settings.minWithdrawal) {
    errors.amount = [`The smallest withdrawal is ${settings.minWithdrawal}.`];
  }
  if (destination.length < 6) {
    errors.destination = [method.kind === "bank" ? "Enter your PIX key." : "Enter a wallet address."];
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  const wallet = await prisma.balance.findFirst({
    where: { userId: session.user.platformId },
    orderBy: { type: "asc" },
  });
  if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 400 });

  /*
   * The debit and the record are one transaction, and the debit is conditional
   * on the balance still being there. Two requests racing for the same money
   * both read the same balance; only one of them can pass `gte` at write time.
   */
  try {
    const result = await prisma.$transaction(async (tx) => {
      const debited = await tx.balance.updateMany({
        where: { id: wallet.id, amount: { gte: new Prisma.Decimal(amount!) } },
        data: { amount: { decrement: new Prisma.Decimal(amount!) } },
      });
      if (debited.count === 0) throw new Error("INSUFFICIENT");

      return tx.transaction.create({
        data: {
          userId: session.user.platformId,
          balanceId: wallet.id,
          kind: "WITHDRAWAL",
          status: "PENDING",
          amount: new Prisma.Decimal(amount!),
          currency: wallet.currency,
          method: method.name,
          destination,
        },
        select: { id: true, amount: true, status: true, method: true },
      });
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT") {
      return NextResponse.json(
        { error: "insufficient funds", errors: { amount: ["That is more than your balance."] } },
        { status: 409 },
      );
    }
    throw error;
  }
}
