/**
 * Recording a deposit.
 *
 * It creates a PENDING row and nothing else. There is no payment provider
 * behind this, so the balance deliberately does not move: a deposit that
 * credits an account before any money arrives is how a platform gives itself
 * away. The row is the record that someone asked; crediting it is a decision
 * for whoever reconciles the payment, in the admin's cashier.
 *
 * Everything the operator configured under Limits & fees is enforced here,
 * not only on the page: the page is a courtesy a client can skip.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { parseAmount } from "@/lib/cabinet/money";
import { formatMoney } from "@/lib/cabinet/format";
import { checkDepositPromo } from "@/lib/cabinet/promo";
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
  const method = settings.methods.find((candidate) => candidate.deposit && candidate.id === body.method);
  if (!method) return NextResponse.json({ error: t.unknownMethod, errors: { form: [t.unknownMethod] } }, { status: 400 });

  /*
   * The real wallet, named rather than taken as the first of the list. Practice
   * money is not money: it cannot be paid out and a deposit does not land in
   * it, and leaving the choice to an ordering means the day a third wallet is
   * added the cashier quietly starts moving the wrong one.
   */
  const wallet = await prisma.balance.findFirst({ where: { userId, type: REAL } });
  if (!wallet) return NextResponse.json({ error: t.noRealWallet, errors: { form: [t.noRealWallet] } }, { status: 400 });

  const money = (n: number) => formatMoney(n, wallet.currency, locale);
  const errors: Record<string, string[]> = {};
  const amount = parseAmount(body.amount);

  if (amount === null) errors.amount = [t.amountRequired];
  else if (amount < settings.minDeposit) errors.amount = [t.belowMinDeposit(money(settings.minDeposit))];
  else if (settings.maxDeposit > 0 && amount > settings.maxDeposit) errors.amount = [t.aboveMaxDeposit(money(settings.maxDeposit))];
  if (body.acceptedTerms !== true) errors.acceptedTerms = [t.acceptTerms];

  // A code that does not apply is refused rather than dropped, so nobody
  // deposits believing a bonus is coming that is not.
  const promoCode = typeof body.promo === "string" ? body.promo.trim() : "";
  let promo: { promoCodeId: number; bonus: number } | null = null;
  if (promoCode && amount !== null && !errors.amount) {
    const check = await checkDepositPromo(promoCode, userId, amount);
    if (check.ok) promo = check;
    else {
      errors.promo = [
        check.reason === "used"
          ? t.promoUsed
          : check.reason === "pending"
            ? t.promoPending
            : check.reason === "minimum"
              ? t.promoMinimum(money(check.minimum ?? 0))
              : t.promoUnknown,
      ];
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  /*
   * Every pending deposit is a row somebody reconciles by hand. Counted inside
   * nothing stronger than a read, so two requests at the same instant can both
   * pass — which costs one extra row in a queue, not money.
   */
  if (settings.maxPendingDeposits > 0) {
    const waiting = await prisma.transaction.count({ where: { userId, kind: "DEPOSIT", status: "PENDING" } });
    if (waiting >= settings.maxPendingDeposits) {
      const message = t.tooManyPending(waiting);
      return NextResponse.json({ error: message, errors: { form: [message] } }, { status: 409 });
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      balanceId: wallet.id,
      kind: "DEPOSIT",
      status: "PENDING",
      amount: new Prisma.Decimal(amount!),
      bonus: new Prisma.Decimal(promo?.bonus ?? 0),
      promoCodeId: promo?.promoCodeId ?? null,
      currency: wallet.currency,
      method: method.name,
      note: "Recorded by the cashier. No payment provider is connected.",
    },
    select: { id: true, amount: true, bonus: true, status: true, method: true },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
