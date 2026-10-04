/*
 * Promo codes, as the Promo panel asks for them.
 *
 * Four calls, three of which are lists and one a detail. Shapes from a
 * recording; see docs/avalon-panels.md. `conditions` and `restrictions` are
 * key/parameter pairs rather than plain fields — the platform renders them
 * generically, so an expiry is `{key: "eol", parameters: [{key: "end", value}]}`
 * rather than an `ends_at`.
 */
import { pool } from "../db/pool.mjs";

const TTL_MS = 60_000;
let cache = null;

async function allCodes() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const rows = await pool().query(
    `SELECT id, code, title, description, description_short, type, params,
            instructions, information, ends_at
       FROM promo_codes
      WHERE enabled = 1
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY id DESC`,
  );
  cache = { at: Date.now(), rows };
  return rows;
}

export function forgetPromo() {
  cache = null;
}

function readJson(value, fallback) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** `2026-10-10 23:22:19`, which is the spelling the recording carries. */
function stamp(date) {
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
}

function listEntry(row) {
  return {
    id: Number(row.id),
    code: row.code,
    title: row.title,
    description: row.description ?? "",
    description_short: row.description_short ?? "",
    type: row.type,
    params: readJson(row.params, {}),
    conditions: [],
    // An expiry is a restriction keyed `eol`, not a field of its own.
    restrictions: row.ends_at
      ? [{ key: "eol", parameters: [{ key: "end", value: stamp(row.ends_at) }] }]
      : [],
  };
}

/** The codes on offer that this person has not used. */
export async function availablePromoCodes(userId, limit = 100, offset = 0) {
  const [rows, used] = await Promise.all([
    allCodes(),
    pool().query("SELECT promo_code_id FROM promo_code_uses WHERE user_id = ?", [userId]),
  ]);

  const spent = new Set(used.map((row) => Number(row.promo_code_id)));
  return rows
    .filter((row) => !spent.has(Number(row.id)))
    .slice(offset, offset + limit)
    .map(listEntry);
}

/** The ones already used, which the panel lists on its own tab. */
export async function usedPromoCodes(userId, limit = 100, offset = 0) {
  const rows = await pool().query(
    `SELECT p.id, p.code, p.title, p.description, p.description_short, p.type,
            p.params, p.ends_at, u.used_at
       FROM promo_code_uses u
       JOIN promo_codes p ON p.id = u.promo_code_id
      WHERE u.user_id = ?
      ORDER BY u.used_at DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  );
  return rows.map((row) => ({ ...listEntry(row), used_at: Math.floor(new Date(row.used_at).getTime() / 1000) }));
}

/**
 * The strip inside the traderoom, which asks for one kind at a time.
 *
 * It sends `{types: ["higher_payouts"]}`, so a deposit bonus is not what it
 * wants and an empty list is the right answer when nothing of that kind exists.
 */
export async function traderoomPromoCodes(userId, types) {
  const wanted = Array.isArray(types) && types.length ? new Set(types) : null;
  const codes = await availablePromoCodes(userId, 100, 0);
  return wanted ? codes.filter((code) => wanted.has(code.type)) : codes;
}

/** Everything the detail page shows for one code. */
export async function promoCodeDetails(id) {
  const rows = await allCodes();
  const row = rows.find((candidate) => Number(candidate.id) === Number(id));
  if (!row) return null;

  return {
    ...listEntry(row),
    instructions: readJson(row.instructions, { title: "", steps: [] }),
    information: readJson(row.information, { details: "" }),
  };
}

/**
 * Records that someone used a code.
 *
 * It does not pay anything out. A promo code's reward is a deposit bonus, and
 * nothing here credits a deposit yet — see the cashier note in
 * docs/engine-host-pendencias.md. Marking it used is the half that is true.
 */
export async function applyPromoCode(code, userId) {
  const rows = await allCodes();
  const match = rows.find((row) => String(row.code).toUpperCase() === String(code ?? "").trim().toUpperCase());
  if (!match) return { error: "no such promo code" };

  try {
    await pool().query(
      "INSERT INTO promo_code_uses (promo_code_id, user_id, used_at) VALUES (?, ?, NOW(3))",
      [Number(match.id), userId],
    );
  } catch (error) {
    // The unique key is the check: a second use is a duplicate, not a race.
    if (error.code === "ER_DUP_ENTRY") return { error: "this code has already been used" };
    throw error;
  }

  return listEntry(match);
}
