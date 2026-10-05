/**
 * A promo code typed into the deposit form.
 *
 * The deposit page always had the field and it always answered "no promotions
 * are running", whatever was configured under Promo. This is what makes it
 * real for codes of type `deposit_bonus`, whose `params` say what they pay:
 *
 *   { "percent": 50, "min_deposit": 100, "max_bonus": 500 }
 *
 * `percent` is required; the other two are optional. The bonus is worked out
 * here, stored on the deposit, and paid by the cashier with the deposit when it
 * is approved — never before, for the same reason the deposit itself is not.
 */
import { prisma } from "@/lib/db";
import { round2 } from "./money";

export type PromoCheck =
  | { ok: true; promoCodeId: number; code: string; bonus: number; percent: number }
  | { ok: false; reason: "unknown" | "used" | "pending" | "minimum"; minimum?: number };

function read(params: unknown, ...keys: string[]) {
  if (!params || typeof params !== "object") return 0;
  for (const key of keys) {
    const value = Number((params as Record<string, unknown>)[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

export async function checkDepositPromo(raw: string, userId: number, amount: number): Promise<PromoCheck> {
  const code = raw.trim().toUpperCase();
  if (!code) return { ok: false, reason: "unknown" };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  const live = promo && promo.enabled && promo.type === "deposit_bonus" && (!promo.endsAt || promo.endsAt > new Date());
  if (!promo || !live) return { ok: false, reason: "unknown" };

  const percent = read(promo.params, "percent", "bonus_percent", "bonusPercent");
  if (percent <= 0) return { ok: false, reason: "unknown" };

  const [used, pending] = await Promise.all([
    prisma.promoCodeUse.findUnique({ where: { promoCodeId_userId: { promoCodeId: promo.id, userId } } }),
    prisma.transaction.findFirst({
      where: { userId, kind: "DEPOSIT", status: "PENDING", promoCodeId: promo.id },
      select: { id: true },
    }),
  ]);
  if (used) return { ok: false, reason: "used" };
  if (pending) return { ok: false, reason: "pending" };

  const minimum = read(promo.params, "min_deposit", "minDeposit");
  if (amount < minimum) return { ok: false, reason: "minimum", minimum };

  const cap = read(promo.params, "max_bonus", "maxBonus");
  const bonus = round2((amount * percent) / 100);
  return { ok: true, promoCodeId: promo.id, code: promo.code, bonus: cap > 0 ? Math.min(bonus, cap) : bonus, percent };
}
