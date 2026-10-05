/**
 * Asking to take money out.
 *
 * A withdrawal is a request, not a transfer: it is recorded as PENDING and the
 * amount leaves the balance immediately. Holding the money at request time
 * rather than at approval is deliberate — otherwise the same balance can be
 * requested twice, and the second request is discovered only when someone tries
 * to pay it.
 *
 * The fee, once the month's free withdrawals are used, is part of the amount:
 * the balance moves by what was asked for and the person is paid that minus the
 * fee. A refund then gives back exactly what left.
 *
 * Nothing here pays anybody. There is no payment rail behind it; an
 * administrator settles it in the admin's cashier.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";
import { cashierSettings, freeWithdrawalsLeft, withdrawalFee } from "@/lib/cabinet/cashier";
import { parseAmount } from "@/lib/cabinet/money";
import { formatMoney } from "@/lib/cabinet/format";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const locale = typeof body.locale === "string" ? body.locale : "en";
  const t = cabinetExtra(locale).cashier;
  const userId = session.user.platformId;

  const settings = await cashierSettings();
  const method = settings.methods.find((candidate) => candidate.withdrawal && candidate.id === body.method);
  if (!method) return NextResponse.json({ error: t.unknownMethod, errors: { form: [t.unknownMethod] } }, { status: 400 });

  if (settings.requireKycForWithdrawal) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } });
    if (user?.kycStatus !== "APPROVED") {
      return NextResponse.json({ error: t.kycRequired, errors: { form: [t.kycRequired] } }, { status: 403 });
    }
  }

  /*
   * The real wallet, named rather than taken as the first of the list. Practice
   * money is not money: it cannot be paid out, and leaving the choice to an
   * ordering means the day a third wallet is added the cashier quietly starts
   * moving the wrong one.
   */
  const wallet = await prisma.balance.findFirst({ where: { userId, type: REAL } });
  if (!wallet) return NextResponse.json({ error: t.noRealWallet, errors: { form: [t.noRealWallet] } }, { status: 400 });

  const money = (n: number) => formatMoney(n, wallet.currency, locale);
  const errors: Record<string, string[]> = {};
  const amount = parseAmount(body.amount);
  const destination = typeof body.destination === "string" ? body.destination.trim().slice(0, 255) : "";

  if (amount === null) errors.amount = [t.amountRequired];
  else if (amount < settings.minWithdrawal) errors.amount = [t.belowMinWithdrawal(money(settings.minWithdrawal))];
  else if (settings.maxWithdrawal > 0 && amount > settings.maxWithdrawal) {
    errors.amount = [t.aboveMaxWithdrawal(money(settings.maxWithdrawal))];
  }
  if (destination.length < 6) errors.destination = [method.kind === "bank" ? t.pixKeyRequired : t.walletRequired];

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  /*
   * Counted before the write, so two requests at the same instant could both
   * be free. The cost of that race is one fee not charged, which is the right
   * way round for it to fail.
   */
  const fee = withdrawalFee(settings, amount!, await freeWithdrawalsLeft(userId, settings));

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
          userId,
          balanceId: wallet.id,
          kind: "WITHDRAWAL",
          status: "PENDING",
          amount: new Prisma.Decimal(amount!),
          fee: new Prisma.Decimal(fee),
          currency: wallet.currency,
          method: method.name,
          destination,
        },
        select: { id: true, amount: true, fee: true, status: true, method: true },
      });
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT") {
      return NextResponse.json({ error: "insufficient funds", errors: { amount: [t.insufficient] } }, { status: 409 });
    }
    throw error;
  }
}
