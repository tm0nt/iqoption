/**
 * What an administrator may submit for the cashier's limits and rails.
 *
 * Strict where the read path is lenient: `readCashier` accepts whatever it
 * finds and falls back, because a cashier that is down costs money; this
 * refuses anything it would have to fall back on, because a form that saves a
 * value and then quietly uses another is a form nobody trusts.
 */
import type { CashierMethod, CashierSettings } from "@/lib/cabinet/cashier-types";

function amount(value: unknown, name: string, errors: string[], { max = 10_000_000 } = {}) {
  const n = typeof value === "string" && value.trim() ? Number(value.replace(",", ".")) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    errors.push(`${name} must be a number of 0 or more`);
    return 0;
  }
  if (n > max) errors.push(`${name} must be at most ${max}`);
  return Math.round(n * 100) / 100;
}

function whole(value: unknown, name: string, errors: string[], max = 1000) {
  const n = typeof value === "string" && value.trim() ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > max) {
    errors.push(`${name} must be a whole number from 0 to ${max}`);
    return 0;
  }
  return n;
}

function method(value: unknown, index: number, errors: string[]): CashierMethod | null {
  if (!value || typeof value !== "object") {
    errors.push(`method ${index + 1} is not an object`);
    return null;
  }
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id.trim().toLowerCase() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!/^[a-z0-9-]{2,32}$/.test(id)) errors.push(`method ${index + 1}: the id is 2–32 lower-case letters, digits or dashes`);
  if (!name || name.length > 64) errors.push(`method ${index + 1}: a name of up to 64 characters is required`);
  return {
    id,
    name,
    days: typeof raw.days === "string" && raw.days.trim() ? raw.days.trim().slice(0, 48) : "1 - 3 business days",
    deposit: raw.deposit === true,
    withdrawal: raw.withdrawal === true,
    kind: raw.kind === "crypto" ? "crypto" : "bank",
  };
}

export function financeInput(body: unknown): { data: CashierSettings } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "expected a JSON object" };
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  const methods = Array.isArray(input.methods)
    ? input.methods.map((value, index) => method(value, index, errors)).filter((m): m is CashierMethod => m !== null)
    : [];
  if (methods.length === 0) errors.push("at least one method is required");
  const ids = new Set<string>();
  for (const m of methods) {
    if (ids.has(m.id)) errors.push(`the method id "${m.id}" is used twice`);
    ids.add(m.id);
  }

  const presets = Array.isArray(input.depositPresets)
    ? input.depositPresets.map((value) => amount(value, "a deposit preset", errors))
    : [];

  const data: CashierSettings = {
    methods,
    minDeposit: amount(input.minDeposit, "the minimum deposit", errors),
    maxDeposit: amount(input.maxDeposit, "the maximum deposit", errors),
    depositPresets: [...new Set(presets.filter((p) => p > 0))].sort((a, b) => b - a).slice(0, 12),
    maxPendingDeposits: whole(input.maxPendingDeposits, "pending deposits per person", errors, 100),
    minWithdrawal: amount(input.minWithdrawal, "the minimum withdrawal", errors),
    maxWithdrawal: amount(input.maxWithdrawal, "the maximum withdrawal", errors),
    freeWithdrawalsPerMonth: whole(input.freeWithdrawalsPerMonth, "free withdrawals per month", errors, 100),
    withdrawalFeePercent: amount(input.withdrawalFeePercent, "the withdrawal fee percent", errors, { max: 100 }),
    withdrawalFeeFixed: amount(input.withdrawalFeeFixed, "the fixed withdrawal fee", errors),
    requireKycForWithdrawal: input.requireKycForWithdrawal === true,
    termsUrl: typeof input.termsUrl === "string" ? input.termsUrl.trim().slice(0, 512) : "",
  };

  if (data.maxDeposit > 0 && data.maxDeposit < data.minDeposit) {
    errors.push("the maximum deposit is below the minimum");
  }
  if (data.maxWithdrawal > 0 && data.maxWithdrawal < data.minWithdrawal) {
    errors.push("the maximum withdrawal is below the minimum");
  }
  if (data.termsUrl && !/^(https?:\/\/|\/)/.test(data.termsUrl)) {
    errors.push("the terms link must start with http://, https:// or /");
  }

  return errors.length ? { error: errors.join("; ") } : { data };
}
