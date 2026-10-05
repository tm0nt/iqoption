/**
 * An affiliate asking to be paid.
 *
 * The amount is checked against the ledger inside a lock on the affiliate's
 * row — see src/lib/affiliate/ledger.ts — so two requests sent together cannot
 * both spend the same balance. The rails are the cashier's withdrawal methods:
 * an affiliate is paid the way anyone else is.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { affiliateProgram } from "@/lib/affiliate/program";
import { PayoutRefused, requestPayout } from "@/lib/affiliate/ledger";
import { accrueQuietly } from "@/lib/affiliate/accrual";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { parseAmount } from "@/lib/cabinet/money";
import { formatMoney } from "@/lib/cabinet/format";
import { affiliateCopy } from "@/i18n/affiliate";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const locale = typeof body?.locale === "string" ? body.locale : "en";
  const t = affiliateCopy(locale);
  const x = cabinetExtra(locale).cashier;

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.user.platformId }, select: { id: true, status: true } });
  if (!affiliate || affiliate.status !== "ACTIVE") {
    return NextResponse.json({ error: t.inactive, errors: { form: [t.inactive] } }, { status: 403 });
  }

  const [program, settings] = await Promise.all([affiliateProgram(), cashierSettings()]);
  const money = (n: number) => formatMoney(n, program.currency, locale);

  const method = settings.methods.find((candidate) => candidate.withdrawal && candidate.id === body?.method);
  const amount = parseAmount(body?.amount);
  const destination = typeof body?.destination === "string" ? body.destination.trim().slice(0, 255) : "";

  const errors: Record<string, string[]> = {};
  if (!method) errors.form = [x.unknownMethod];
  if (amount === null) errors.amount = [x.amountRequired];
  if (destination.length < 6) errors.destination = [method?.kind === "crypto" ? x.walletRequired : x.pixKeyRequired];
  if (Object.keys(errors).length > 0) return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });

  // The ledger may be a minute behind the deals; bring it up to date first.
  await accrueQuietly(affiliate.id);

  try {
    const payout = await requestPayout({
      affiliateId: affiliate.id,
      amount: amount!,
      minimum: program.minPayout,
      currency: program.currency,
      method: method!.name,
      destination,
    });
    return NextResponse.json({ payout: { id: payout.id, status: payout.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof PayoutRefused) {
      const message =
        error.reason === "below-minimum"
          ? t.belowMin(money(program.minPayout))
          : error.reason === "insufficient"
            ? t.insufficient(money(Math.max(0, error.available)))
            : t.inactive;
      return NextResponse.json({ error: message, errors: { amount: [message] } }, { status: 409 });
    }
    throw error;
  }
}
