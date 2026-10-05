/**
 * Validation for instrument writes.
 *
 * The protocol is unforgiving about these values and says nothing useful when
 * one is wrong: a client drops an instrument it cannot parse and the asset
 * simply never appears, with no error anywhere. So the checks here are about
 * what the wire requires, not about taste —
 *
 *   - `id` is the `active_id` and cannot change once deals reference it.
 *   - `precision` beyond what the source quotes quantises the chart into steps.
 *   - `expirations` must be whole positive seconds; the deal panel builds its
 *     expiry menu straight from them.
 *   - An instrument with a feed but no `sourceSymbol` has no feed at all and
 *     silently falls back to a synthetic curve, which looks like real data and
 *     is not. The spelling is the source's own: `BTCUSDT` for Binance,
 *     `EUR/USD` for Twelve Data.
 *
 * Unknown fields are dropped rather than passed through, so a typo cannot
 * quietly write a column nobody meant to change.
 */

const KINDS = new Set(["forex", "crypto", "index", "stock", "commodity"]);
const SOURCES = new Set(["BINANCE", "TWELVEDATA", "SIMULATED"]);

export type AssetInput = Record<string, unknown>;

type Result = { data: AssetInput } | { error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wholeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function assetInput(body: unknown, { requireId = false } = {}): Result {
  if (!isPlainObject(body)) return { error: "expected a JSON object" };

  const data: AssetInput = {};

  if (requireId || body.id !== undefined) {
    const id = wholeNumber(body.id);
    if (id === null || id <= 0) return { error: "id must be a positive whole number" };
    data.id = id;
  }

  for (const key of ["ticker", "name", "currencyLeft", "currencyRight", "exchange", "timeFrom", "timeTo", "image", "sourceSymbol"]) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") return { error: `${key} must be a string` };
    data[key] = body[key];
  }

  if (body.kind !== undefined) {
    if (typeof body.kind !== "string" || !KINDS.has(body.kind)) {
      return { error: `kind must be one of ${[...KINDS].join(", ")}` };
    }
    data.kind = body.kind;
  }

  if (body.source !== undefined) {
    if (typeof body.source !== "string" || !SOURCES.has(body.source)) {
      return { error: `source must be one of ${[...SOURCES].join(", ")}` };
    }
    data.source = body.source;
  }

  for (const key of ["groupId", "precision", "pipScale", "profit", "deadtime", "priority"]) {
    if (body[key] === undefined) continue;
    const n = wholeNumber(body[key]);
    if (n === null || n < 0) return { error: `${key} must be a whole number of zero or more` };
    data[key] = n;
  }

  for (const key of ["spreadPlus", "spreadMinus", "minQty", "qtyStep", "simBase", "simVolatility"]) {
    if (body[key] === undefined) continue;
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) return { error: `${key} must be a number of zero or more` };
    data[key] = n;
  }

  if (body.simPeriod !== undefined) {
    const n = wholeNumber(body.simPeriod);
    if (n === null || n <= 0) return { error: "simPeriod must be a positive whole number of seconds" };
    data.simPeriod = n;
  }

  for (const key of ["isOtc", "isVisible", "isPaused", "isSuspended", "enabled"]) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "boolean") return { error: `${key} must be true or false` };
    data[key] = body[key];
  }

  if (body.expirations !== undefined) {
    const list = body.expirations;
    if (!Array.isArray(list) || list.length === 0) return { error: "expirations must be a non-empty array" };
    const seconds = list.map(wholeNumber);
    if (seconds.some((n) => n === null || n <= 0)) {
      return { error: "every expiration must be a positive whole number of seconds" };
    }
    data.expirations = seconds;
  }

  if (body.expirationDays !== undefined) {
    const days = body.expirationDays;
    if (!Array.isArray(days) || days.length !== 7) {
      return { error: "expirationDays must be seven flags, Monday first" };
    }
    data.expirationDays = days.map((day) => (day ? 1 : 0));
  }

  // A feed-backed instrument with nothing to subscribe to looks like it works
  // and silently serves a synthetic curve instead.
  if (data.source === "BINANCE" && data.sourceSymbol !== undefined && !data.sourceSymbol) {
    return { error: "a BINANCE instrument needs a sourceSymbol, e.g. BTCUSDT" };
  }

  if (Object.keys(data).length === 0) return { error: "nothing to change" };
  return { data };
}
