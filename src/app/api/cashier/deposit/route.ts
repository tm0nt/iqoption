/**
 * Recording a deposit.
 *
 * On a bank or crypto rail it creates a PENDING row and nothing else. No
 * payment provider stands behind those, so the balance deliberately does not
 * move: a deposit that credits an account before any money arrives is how a
 * platform gives itself away. The row is the record that someone asked;
 * crediting it is a decision for whoever reconciles the payment, in the
 * admin's cashier.
 *
 * On a card rail the processor is behind it, and its answer is the decision.
 * The row is written PENDING first — so a charge always has a record, even
 * one the processor never answers — then the saved card is charged:
 *
 *   approved -> settled as approved, through the same code an administrator's
 *               approval runs, so the wallet, the promo bonus and the
 *               affiliate's first deposit move exactly as they would by hand;
 *   declined -> settled as rejected, and the person is told why;
 *   pending  -> left in the cashier queue, for the processor's review or a
 *               person's — as is a charge whose answer never came, because
 *               "we do not know" must never be reported as "not charged".
 *
 * Card deposits are also where card testing happens, so five declines in a
 * day close the card rail for that account until the next.
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
import { settleTransaction } from "@/lib/cabinet/settle";
import { cardProvider, type ChargeResult } from "@/lib/payments/cards/provider";
import { cardLabel, isExpired } from "@/lib/payments/cards/card-types";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

const DAILY_DECLINES = 5;

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
  // A card rail without a processor behind it is hidden from the page, and refused here the same way.
  const provider = method?.kind === "card" ? cardProvider() : null;
  if (!method || (method.kind === "card" && !provider)) {
    return NextResponse.json({ error: t.unknownMethod, errors: { form: [t.unknownMethod] } }, { status: 400 });
  }
  const k = cabinetExtra(locale).cards;

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

  const cardId = Number(body.cardId);
  const card =
    provider && Number.isInteger(cardId) && cardId > 0
      ? await prisma.paymentCard.findFirst({ where: { id: cardId, userId, provider: provider.id, removedAt: null } })
      : null;
  if (provider) {
    if (!card) errors.card = [k.chooseCard];
    else if (isExpired(card.expMonth, card.expYear)) errors.card = [k.cardExpired];
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  if (provider) {
    const [user, declines] = await Promise.all([
      settings.requireKycForCard ? prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } }) : null,
      prisma.transaction.count({
        where: {
          userId,
          kind: "DEPOSIT",
          status: "REJECTED",
          cardId: { not: null },
          settledById: null,
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
      }),
    ]);
    if (settings.requireKycForCard && user?.kycStatus !== "APPROVED") {
      return NextResponse.json({ error: k.needKyc, errors: { form: [k.needKyc] }, needKyc: true }, { status: 403 });
    }
    if (declines >= DAILY_DECLINES) {
      return NextResponse.json({ error: k.tooManyDeclines, errors: { form: [k.tooManyDeclines] } }, { status: 429 });
    }
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
      ...(provider && card
        ? { cardId: card.id, destination: cardLabel(card), note: `Card charge via ${provider.id}.` }
        : { note: "Recorded by the cashier. No payment provider is connected." }),
    },
    select: { id: true, amount: true, bonus: true, status: true, method: true },
  });

  if (!provider || !card) return NextResponse.json({ transaction }, { status: 201 });

  let charge: ChargeResult | null;
  try {
    charge = await provider.charge(card, amount!, wallet.currency, `deposit-${transaction.id}`);
  } catch {
    charge = null;
  }

  if (charge?.status === "approved") {
    const settled = await settleTransaction(transaction.id, "approve", {
      by: null,
      note: `Charged to ${cardLabel(card)} via ${provider.id}.`,
      providerRef: charge.reference,
    });
    if (settled.ok) {
      return NextResponse.json({ transaction: { ...transaction, status: settled.row.status }, outcome: "approved" }, { status: 201 });
    }
    // Charged, but the wallet could not take it. Money arrived and nothing was credited: a person has to look.
    await prisma.transaction.updateMany({
      where: { id: transaction.id, status: "PENDING" },
      data: { providerRef: charge.reference, note: `Charged via ${provider.id} but not credited (${settled.reason}). Settle by hand.` },
    });
    return NextResponse.json({ transaction, outcome: "pending" }, { status: 202 });
  }

  if (charge?.status === "declined") {
    await settleTransaction(transaction.id, "reject", {
      by: null,
      note: `Declined by ${provider.id}: ${charge.reason}.`,
      providerRef: charge.reference,
    });
    const message = k.declined[charge.reason];
    return NextResponse.json({ error: message, errors: { form: [message] }, outcome: "declined" }, { status: 402 });
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      providerRef: charge?.reference ?? null,
      note: charge
        ? `Held for review by ${provider.id}.`
        : `${provider.id} did not answer. Check with the processor before settling this by hand.`,
    },
  });
  return NextResponse.json({ transaction, outcome: "pending" }, { status: 202 });
}
