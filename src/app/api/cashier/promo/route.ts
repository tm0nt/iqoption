/**
 * Checking a promo code before the deposit is sent.
 *
 * The deposit route checks the code again when the deposit is made — this is
 * what lets the form say what the bonus will be while the person is still
 * deciding, and say why a code does not apply before they have committed.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";
import { parseAmount } from "@/lib/cabinet/money";
import { formatMoney } from "@/lib/cabinet/format";
import { checkDepositPromo } from "@/lib/cabinet/promo";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const t = cabinetExtra(typeof body?.locale === "string" ? body.locale : "en").cashier;
  const locale = typeof body?.locale === "string" ? body.locale : "en";

  const amount = parseAmount(body?.amount);
  if (amount === null) return NextResponse.json({ error: t.promoNeedsAmount }, { status: 400 });

  const wallet = await prisma.balance.findFirst({ where: { userId: session.user.platformId, type: REAL }, select: { currency: true } });
  const currency = wallet?.currency ?? "USD";

  const check = await checkDepositPromo(typeof body?.code === "string" ? body.code : "", session.user.platformId, amount);
  if (!check.ok) {
    const error =
      check.reason === "used"
        ? t.promoUsed
        : check.reason === "pending"
          ? t.promoPending
          : check.reason === "minimum"
            ? t.promoMinimum(formatMoney(check.minimum ?? 0, currency, locale))
            : t.promoUnknown;
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({
    code: check.code,
    bonus: check.bonus,
    percent: check.percent,
    message: t.promoApplied(formatMoney(check.bonus, currency, locale)),
  });
}
