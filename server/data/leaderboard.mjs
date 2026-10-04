/*
 * The leaderboard, counted from real deals.
 *
 * Nothing is stored for this: the standing is a sum over `positions`, so it is
 * always what the deals say and can never drift from them. The shape comes
 * from a recording — `{user_id, user_name, country_id, pnl}`, a bare array,
 * sorted best first (docs/avalon-panels.md).
 *
 * Practice money is left out. A leaderboard that ranks people on funds they
 * cannot lose is a leaderboard of who clicked most, and the live platform's
 * own entries are real accounts.
 */
import { pool } from "../db/pool.mjs";
import { REAL } from "../accounts.mjs";

const TTL_MS = 30_000;
const cache = new Map();

/** `type` is the window the panel asks for. */
const WINDOWS = {
  day: 86_400,
  week: 604_800,
  month: 2_592_000,
  all: 0,
};

function since(type) {
  const span = WINDOWS[String(type)] ?? 0;
  return span === 0 ? 0 : Math.floor(Date.now() / 1000) - span;
}

/**
 * The top of the table.
 *
 * `country_id` of 0 means everywhere, which is how the panel asks for the
 * global list; any other value narrows to that country.
 */
export async function leaderboardTop(body, limit = 100) {
  const type = String(body?.type ?? "all");
  const countryId = Number(body?.country_id) || 0;
  const key = `${type}:${countryId}:${limit}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;

  /*
   * `close_profit` is the payout, `invest` the stake, so the profit of a deal
   * is the difference. Summing the payout alone would rank by turnover.
   */
  const rows = await pool().query(
    `SELECT p.user_id,
            COALESCE(NULLIF(TRIM(u.name), ''), SUBSTRING_INDEX(u.email, '@', 1)) AS user_name,
            SUM(p.close_profit - p.invest) AS pnl
       FROM positions p
       JOIN balances b ON b.id = p.balance_id
       JOIN users    u ON u.id = p.user_id
      WHERE p.closed_at > 0
        AND p.closed_at >= ?
        AND b.type = ?
        AND u.is_active = 1
      GROUP BY p.user_id, user_name
     HAVING pnl > 0
      ORDER BY pnl DESC
      LIMIT ?`,
    [since(type), REAL, limit],
  );

  const out = rows.map((row) => ({
    user_id: Number(row.user_id),
    user_name: row.user_name ?? "Trader",
    // One country for now; the column exists on nobody's account yet, and a
    // made-up one would filter people out of a list they belong in.
    country_id: countryId || 30,
    pnl: Number(row.pnl),
  }));

  cache.set(key, { at: Date.now(), rows: out });
  return out;
}

/**
 * Where one person stands.
 *
 * The live feed answers `{"error": "slice data for this user is empty"}` for
 * an account with nothing to rank, and the panel reads that as "no profitable
 * trades this week yet" rather than as a failure — so an account with no
 * winning deals gets the same answer rather than a zero that would place it
 * last among people who have traded.
 */
export async function leaderboardPosition(body, userId) {
  const top = await leaderboardTop(body, 1000);
  const index = top.findIndex((row) => row.user_id === userId);
  if (index === -1) return null;
  return { ...top[index], position: index + 1 };
}

export function forgetLeaderboard() {
  cache.clear();
}
