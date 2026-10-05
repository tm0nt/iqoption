/**
 * The cashier's rails and limits, read from settings.
 *
 * In the database rather than in the code because which rails a broker offers
 * and how much moves through them are operational decisions that change
 * without a deploy — and because the deposit page, the withdrawal page, their
 * two API routes and the admin all have to agree on them.
 */
import { prisma } from "@/lib/db";
import type { CashierMethod, CashierSettings } from "./cashier-types";
import { CASHIER_DEFAULTS } from "./cashier-types";

export type { CashierMethod, CashierSettings } from "./cashier-types";
export { methodInitials, withdrawalFee, withinLimits, CASHIER_DEFAULTS } from "./cashier-types";

/** The row the settings live in. The name predates the limits that joined it. */
export const CASHIER_KEY = "cashier.methods";

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;

function readMethod(value: unknown): CashierMethod | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id || typeof raw.name !== "string" || !raw.name) return null;
  return {
    id: raw.id,
    name: raw.name,
    days: typeof raw.days === "string" ? raw.days : CASHIER_DEFAULTS.methods[0].days,
    deposit: raw.deposit !== false,
    withdrawal: raw.withdrawal !== false,
    kind: raw.kind === "crypto" ? "crypto" : "bank",
  };
}

/**
 * Whatever is stored, merged over the defaults field by field.
 *
 * Lenient on purpose: this is the read path, and a row an older version wrote,
 * or one edited by hand as JSON, should still answer for every field rather
 * than take the cashier down. The admin's write path is the strict one.
 */
export function readCashier(value: unknown): CashierSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return CASHIER_DEFAULTS;
  const raw = value as Record<string, unknown>;

  const methods = Array.isArray(raw.methods)
    ? raw.methods.map(readMethod).filter((method): method is CashierMethod => method !== null)
    : [];
  const presets = Array.isArray(raw.depositPresets)
    ? raw.depositPresets.filter((preset): preset is number => typeof preset === "number" && preset > 0)
    : [];

  return {
    methods: methods.length > 0 ? methods : CASHIER_DEFAULTS.methods,
    minDeposit: num(raw.minDeposit, CASHIER_DEFAULTS.minDeposit),
    maxDeposit: num(raw.maxDeposit, CASHIER_DEFAULTS.maxDeposit),
    depositPresets: presets.length > 0 ? presets : CASHIER_DEFAULTS.depositPresets,
    maxPendingDeposits: num(raw.maxPendingDeposits, CASHIER_DEFAULTS.maxPendingDeposits),
    minWithdrawal: num(raw.minWithdrawal, CASHIER_DEFAULTS.minWithdrawal),
    maxWithdrawal: num(raw.maxWithdrawal, CASHIER_DEFAULTS.maxWithdrawal),
    freeWithdrawalsPerMonth: num(raw.freeWithdrawalsPerMonth, CASHIER_DEFAULTS.freeWithdrawalsPerMonth),
    withdrawalFeePercent: num(raw.withdrawalFeePercent, CASHIER_DEFAULTS.withdrawalFeePercent),
    withdrawalFeeFixed: num(raw.withdrawalFeeFixed, CASHIER_DEFAULTS.withdrawalFeeFixed),
    requireKycForWithdrawal: raw.requireKycForWithdrawal === true,
    termsUrl: typeof raw.termsUrl === "string" ? raw.termsUrl : CASHIER_DEFAULTS.termsUrl,
  };
}

export async function cashierSettings(): Promise<CashierSettings> {
  const row = await prisma.platformSetting.findUnique({ where: { key: CASHIER_KEY } });
  return readCashier(row?.value);
}

/**
 * The first moment of the current calendar month.
 *
 * The free-withdrawal allowance resets here, and the page that announces how
 * many are left and the route that charges for the next one have to agree on
 * when "this month" began.
 */
export function monthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** How many free withdrawals someone has left this month. */
export async function freeWithdrawalsLeft(userId: number, settings: CashierSettings) {
  const used = await prisma.transaction.count({
    where: {
      userId,
      kind: "WITHDRAWAL",
      createdAt: { gte: monthStart() },
      status: { in: ["PENDING", "APPROVED"] },
    },
  });
  return Math.max(0, settings.freeWithdrawalsPerMonth - used);
}
