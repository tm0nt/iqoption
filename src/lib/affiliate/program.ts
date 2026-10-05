/**
 * The affiliate programme's terms, read from settings.
 *
 * One row, merged over the defaults, so a programme nobody has configured yet
 * still has terms — and an administrator who clears a field gets the default
 * back rather than a programme that pays zero by accident.
 */
import { prisma } from "@/lib/db";
import { PROGRAM_DEFAULTS, type AffiliateProgram } from "./program-types";

export type { AffiliateProgram } from "./program-types";
export { PROGRAM_DEFAULTS, termsFor, paysCpa, paysRevshare } from "./program-types";

export const PROGRAM_KEY = "affiliate.program";

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;

export function readProgram(value: unknown): AffiliateProgram {
  if (!value || typeof value !== "object" || Array.isArray(value)) return PROGRAM_DEFAULTS;
  const raw = value as Record<string, unknown>;
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : PROGRAM_DEFAULTS.enabled,
    autoApprove: typeof raw.autoApprove === "boolean" ? raw.autoApprove : PROGRAM_DEFAULTS.autoApprove,
    plan: raw.plan === "CPA" || raw.plan === "REVSHARE" || raw.plan === "HYBRID" ? raw.plan : PROGRAM_DEFAULTS.plan,
    cpaAmount: num(raw.cpaAmount, PROGRAM_DEFAULTS.cpaAmount),
    cpaMinDeposit: num(raw.cpaMinDeposit, PROGRAM_DEFAULTS.cpaMinDeposit),
    cpaMinTurnover: num(raw.cpaMinTurnover, PROGRAM_DEFAULTS.cpaMinTurnover),
    revsharePercent: Math.min(num(raw.revsharePercent, PROGRAM_DEFAULTS.revsharePercent), 100),
    holdDays: num(raw.holdDays, PROGRAM_DEFAULTS.holdDays),
    minPayout: num(raw.minPayout, PROGRAM_DEFAULTS.minPayout),
    cookieDays: Math.max(1, num(raw.cookieDays, PROGRAM_DEFAULTS.cookieDays)),
    currency: typeof raw.currency === "string" && raw.currency ? raw.currency : PROGRAM_DEFAULTS.currency,
    terms: typeof raw.terms === "string" ? raw.terms : PROGRAM_DEFAULTS.terms,
  };
}

export async function affiliateProgram(): Promise<AffiliateProgram> {
  const row = await prisma.platformSetting.findUnique({ where: { key: PROGRAM_KEY } });
  return readProgram(row?.value);
}
