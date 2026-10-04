/**
 * Recording a deposit.
 *
 * It creates a PENDING row and nothing else. There is no payment provider
 * behind this, so the balance deliberately does not move: a deposit that
 * credits an account before any money arrives is how a platform gives itself
 * away. The row is the record that someone asked; crediting it is a decision
 * for whoever reconciles the payment.
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
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const settings = await cashierSettings();
  const method = settings.methods.find((candidate) => candidate.deposit && candidate.id === body.method);
  if (!method) return NextResponse.json({ error: "unknown deposit method" }, { status: 400 });

  const errors: Record<string, string[]> = {};
  const amount = parseAmount(typeof body.amount === "string" ? body.amount : "");

  if (amount === null) errors.amount = ["Enter an amount."];
  else if (amount < settings.minDeposit) errors.amount = [`The smallest deposit is ${settings.minDeposit}.`];
  if (body.acceptedTerms !== true) errors.acceptedTerms = ["Accept the terms to continue."];

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  const wallet = await prisma.balance.findFirst({
    where: { userId: session.user.platformId },
    orderBy: { type: "asc" },
  });
  if (!wallet) return NextResponse.json({ error: "no wallet" }, { status: 400 });

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.platformId,
      balanceId: wallet.id,
      kind: "DEPOSIT",
      status: "PENDING",
      amount: new Prisma.Decimal(amount!),
      currency: wallet.currency,
      method: method.name,
      note: "Recorded by the cashier. No payment provider is connected.",
    },
    select: { id: true, amount: true, status: true, method: true },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
