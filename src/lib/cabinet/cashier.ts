/**
 * The cashier's rails, read from settings.
 *
 * In the database rather than in the code because which rails a broker offers
 * is an operational decision that changes without a deploy — and because the
 * deposit page, the withdrawal page and the balance history all have to name
 * them the same way.
 */
import { prisma } from "@/lib/db";
import type { CashierSettings } from "./cashier-types";
import { DEFAULT_DAYS } from "./cashier-types";

export type { CashierMethod, CashierSettings } from "./cashier-types";
export { methodInitials } from "./cashier-types";

const FALLBACK: CashierSettings = {
  methods: [{ id: "pix", name: "PIX (CPF)", days: DEFAULT_DAYS, deposit: true, withdrawal: true, kind: "bank" }],
  freeWithdrawalsPerMonth: 1,
  minWithdrawal: 10,
  minDeposit: 10,
  depositPresets: [5000, 2500, 1000, 500, 250, 100, 50, 25],
};

export async function cashierSettings(): Promise<CashierSettings> {
  const row = await prisma.platformSetting.findUnique({ where: { key: "cashier.methods" } });
  if (!row || typeof row.value !== "object" || row.value === null || Array.isArray(row.value)) return FALLBACK;

  const value = row.value as Partial<CashierSettings>;
  // Merged over the fallback so a row missing a field still answers for it.
  return {
    methods: Array.isArray(value.methods) && value.methods.length > 0 ? value.methods : FALLBACK.methods,
    freeWithdrawalsPerMonth: value.freeWithdrawalsPerMonth ?? FALLBACK.freeWithdrawalsPerMonth,
    minWithdrawal: value.minWithdrawal ?? FALLBACK.minWithdrawal,
    minDeposit: value.minDeposit ?? FALLBACK.minDeposit,
    depositPresets:
      Array.isArray(value.depositPresets) && value.depositPresets.length > 0
        ? value.depositPresets
        : FALLBACK.depositPresets,
  };
}
