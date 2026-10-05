/**
 * Reading amounts people type, and rounding the ones the server computes.
 *
 * Shared by every route that takes money from a form — the deposit, the
 * withdrawal, the affiliate payout and the admin's own adjustments — because
 * they used to carry a copy each, and two copies of a parser are two answers to
 * "how much did they ask for".
 */

/** Two decimal places, the precision every wallet and ledger column holds. */
export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Accepts "1234.5", "1.234,50", "1,234.50" and "1234,5"; refuses anything that
 * is not a positive number.
 *
 * The last separator is the decimal one when it is followed by one or two
 * digits — that is the only reading under which both Brazilian and English
 * spellings of the same amount agree. Every other separator is grouping.
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? round2(raw) : null;
  if (typeof raw !== "string") return null;

  const compact = raw.trim().replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(compact)) return null;

  const decimal = /[.,](\d{1,2})$/.exec(compact);
  const whole = decimal ? compact.slice(0, decimal.index) : compact;
  const digits = whole.replace(/[.,]/g, "");
  if (!digits && !decimal) return null;

  const value = Number(`${digits || "0"}${decimal ? `.${decimal[1]}` : ""}`);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Money has two decimal places; more is a typo, not a precision requirement.
  return round2(value);
}
