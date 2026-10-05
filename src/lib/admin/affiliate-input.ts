/**
 * What an administrator may submit about the affiliate programme and about one
 * affiliate. Strict, for the same reason as the cashier's: a value this cannot
 * use is refused rather than replaced.
 */
import type { AffiliateProgram, CommissionPlanName } from "@/lib/affiliate/program-types";

const PLANS: CommissionPlanName[] = ["CPA", "REVSHARE", "HYBRID"];

function amount(value: unknown, name: string, errors: string[], max = 1_000_000) {
  const n = typeof value === "string" && value.trim() ? Number(value.replace(",", ".")) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > max) {
    errors.push(`${name} must be a number from 0 to ${max}`);
    return 0;
  }
  return Math.round(n * 100) / 100;
}

function whole(value: unknown, name: string, errors: string[], min: number, max: number) {
  const n = typeof value === "string" && value.trim() ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    errors.push(`${name} must be a whole number from ${min} to ${max}`);
    return min;
  }
  return n;
}

export function programInput(body: unknown): { data: AffiliateProgram } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "expected a JSON object" };
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  const plan = PLANS.includes(input.plan as CommissionPlanName) ? (input.plan as CommissionPlanName) : null;
  if (!plan) errors.push(`the plan must be one of ${PLANS.join(", ")}`);

  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  if (!/^[A-Z]{3,5}$/.test(currency)) errors.push("the currency is a 3 to 5 letter code");

  const data: AffiliateProgram = {
    enabled: input.enabled === true,
    autoApprove: input.autoApprove === true,
    plan: plan ?? "REVSHARE",
    cpaAmount: amount(input.cpaAmount, "the CPA amount", errors),
    cpaMinDeposit: amount(input.cpaMinDeposit, "the CPA qualifying deposit", errors),
    cpaMinTurnover: amount(input.cpaMinTurnover, "the CPA qualifying turnover", errors, 100_000_000),
    revsharePercent: amount(input.revsharePercent, "the revenue share", errors, 100),
    holdDays: whole(input.holdDays, "the hold period", errors, 0, 365),
    minPayout: amount(input.minPayout, "the minimum payout", errors),
    cookieDays: whole(input.cookieDays, "the cookie lifetime", errors, 1, 365),
    currency,
    terms: typeof input.terms === "string" ? input.terms.trim().slice(0, 8000) : "",
  };

  return errors.length ? { error: errors.join("; ") } : { data };
}

export type AffiliateUpdate = {
  status?: "PENDING" | "ACTIVE" | "SUSPENDED";
  code?: string;
  plan?: CommissionPlanName | null;
  cpaAmount?: number | null;
  revsharePercent?: number | null;
  postbackUrl?: string | null;
  note?: string | null;
};

/** Only the fields present are changed; `null` (or an empty string) puts a term back on the default. */
export function affiliateUpdateInput(body: unknown): { data: AffiliateUpdate } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "expected a JSON object" };
  const input = body as Record<string, unknown>;
  const errors: string[] = [];
  const data: AffiliateUpdate = {};

  if ("status" in input) {
    if (input.status === "PENDING" || input.status === "ACTIVE" || input.status === "SUSPENDED") data.status = input.status;
    else errors.push("status must be PENDING, ACTIVE or SUSPENDED");
  }
  if ("code" in input) {
    const code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
    if (!/^[A-Z0-9]{4,32}$/.test(code)) errors.push("a code is 4 to 32 letters and digits");
    else data.code = code;
  }
  const blank = (value: unknown) => value === null || value === "" || value === undefined;
  if ("plan" in input) {
    if (blank(input.plan)) data.plan = null;
    else if (PLANS.includes(input.plan as CommissionPlanName)) data.plan = input.plan as CommissionPlanName;
    else errors.push(`the plan must be one of ${PLANS.join(", ")}, or empty for the default`);
  }
  if ("cpaAmount" in input) data.cpaAmount = blank(input.cpaAmount) ? null : amount(input.cpaAmount, "the CPA amount", errors);
  if ("revsharePercent" in input) {
    data.revsharePercent = blank(input.revsharePercent) ? null : amount(input.revsharePercent, "the revenue share", errors, 100);
  }
  if ("postbackUrl" in input) {
    data.postbackUrl = blank(input.postbackUrl) ? null : String(input.postbackUrl).trim().slice(0, 1024);
  }
  if ("note" in input) data.note = blank(input.note) ? null : String(input.note).slice(0, 4000);

  return errors.length ? { error: errors.join("; ") } : { data };
}
