/**
 * The affiliate programme's terms, with no server in them.
 *
 * Separate from the module that reads them for the same reason as the
 * cashier's: client components show these figures, and the reader imports
 * Prisma.
 */

export type CommissionPlanName = "CPA" | "REVSHARE" | "HYBRID";

export type AffiliateProgram = {
  /** Off closes sign-ups and stops new clicks being tracked. Earned money stays. */
  enabled: boolean;
  /** On, a request to join is active at once; off, an administrator approves it. */
  autoApprove: boolean;

  /** What an affiliate with no deal of their own is paid on. */
  plan: CommissionPlanName;

  /** Paid once per referred person who qualifies. */
  cpaAmount: number;
  /**
   * What a referred person has to have deposited, in approved deposits, before
   * the CPA is paid. The usual guard against paying for sign-ups that never
   * fund an account.
   */
  cpaMinDeposit: number;
  /** And traded, in stakes on the real wallet. 0 does not ask. */
  cpaMinTurnover: number;

  /**
   * The share of the platform's result on a referred person's real trades.
   *
   * Signed both ways: when they lose, the platform makes money and the
   * affiliate earns this share of it; when they win, the share is taken back.
   */
  revsharePercent: number;

  /** Days a commission is held before it can be paid out. */
  holdDays: number;
  /** The smallest payout an affiliate may ask for. */
  minPayout: number;
  /** How long a click is remembered in the visitor's browser. */
  cookieDays: number;

  currency: string;
  /** Shown on the join page. Plain text; blank lines separate paragraphs. */
  terms: string;
};

export const PROGRAM_DEFAULTS: AffiliateProgram = {
  enabled: true,
  autoApprove: false,
  plan: "REVSHARE",
  cpaAmount: 50,
  cpaMinDeposit: 100,
  cpaMinTurnover: 0,
  revsharePercent: 30,
  holdDays: 7,
  minPayout: 50,
  cookieDays: 30,
  currency: "USD",
  terms: "",
};

/** The terms one affiliate is actually on: their own where set, the programme's otherwise. */
export type EffectiveTerms = { plan: CommissionPlanName; cpaAmount: number; revsharePercent: number };

export function termsFor(
  program: AffiliateProgram,
  affiliate: { plan: CommissionPlanName | null; cpaAmount: unknown; revsharePercent: unknown },
): EffectiveTerms {
  return {
    plan: affiliate.plan ?? program.plan,
    cpaAmount: affiliate.cpaAmount != null ? Number(affiliate.cpaAmount) : program.cpaAmount,
    revsharePercent: affiliate.revsharePercent != null ? Number(affiliate.revsharePercent) : program.revsharePercent,
  };
}

export const paysCpa = (plan: CommissionPlanName) => plan === "CPA" || plan === "HYBRID";
export const paysRevshare = (plan: CommissionPlanName) => plan === "REVSHARE" || plan === "HYBRID";
