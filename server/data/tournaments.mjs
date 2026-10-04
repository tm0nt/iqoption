/*
 * Tournaments, in the shape `get-tournaments-info` answers with.
 *
 * The reply is not a list: it is an object keyed by the status numbers the
 * request asked about, each holding `{list, count}` — so a panel that asked
 * about three statuses gets three buckets back whether or not any is filled.
 * Taken from a recording; see docs/avalon-panels.md.
 */
import { pool } from "../db/pool.mjs";

/** The platform's own status numbers, which the reply is keyed by. */
export const STATUS = { REGISTERING: 2, RUNNING: 3, FINISHED: 5 };
const STATUS_OF = { REGISTERING: 2, RUNNING: 3, FINISHED: 5 };

const seconds = (value) => (value ? Math.floor(new Date(value).getTime() / 1000) : 0);

function readList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Every enabled tournament, with this person's entry folded in.
 *
 * `registered`, `position` and `balance_id` are per person — the same
 * tournament reads differently to someone who entered it — so they are read
 * here rather than cached with the tournament.
 */
export async function tournamentsInfo(body, userId) {
  const wanted = Array.isArray(body?.status) && body.status.length
    ? body.status.map(Number)
    : [STATUS.REGISTERING, STATUS.RUNNING, STATUS.FINISHED];

  const [rows, entries] = await Promise.all([
    pool().query(
      `SELECT t.id, t.name, t.description, t.image_url, t.status, t.cost, t.rebuy,
              t.rebuy_cost, t.starting_balance, t.prize_pool, t.prize_type,
              t.currency, t.countries, t.starts_at, t.ends_at,
              (SELECT COUNT(*) FROM tournament_entries e WHERE e.tournament_id = t.id) AS users_count
         FROM tournaments t
        WHERE t.enabled = 1
        ORDER BY t.starts_at DESC`,
    ),
    pool().query(
      `SELECT e.tournament_id, e.balance_id, e.pnl,
              (SELECT COUNT(*) + 1 FROM tournament_entries o
                WHERE o.tournament_id = e.tournament_id AND o.pnl > e.pnl) AS position
         FROM tournament_entries e
        WHERE e.user_id = ?`,
      [userId],
    ),
  ]);

  const mine = new Map(entries.map((row) => [Number(row.tournament_id), row]));

  // A bucket per status asked about, empty or not: the panel allocates a tab
  // for each and a status it did not ask about has nowhere to go.
  const buckets = {};
  for (const status of wanted) buckets[String(status)] = { list: [], count: 0 };

  for (const row of rows) {
    const status = STATUS_OF[row.status] ?? STATUS.REGISTERING;
    const bucket = buckets[String(status)];
    if (!bucket) continue;

    const entry = mine.get(Number(row.id));
    bucket.list.push({
      id: Number(row.id),
      name: row.name,
      description: row.description ?? "",
      image_url: row.image_url,
      status,
      type: 2,
      cost: Number(row.cost),
      rebuy: Boolean(row.rebuy),
      rebuy_cost: Number(row.rebuy_cost),
      currency: row.currency,
      prize_pool: Number(row.prize_pool),
      prize_type: row.prize_type,
      win_amount: Number(row.prize_pool),
      flags: readList(row.countries) ?? [],
      parent: {},
      start_date: seconds(row.starts_at),
      end_date: seconds(row.ends_at),
      /*
       * Six fields the panel reads that our first attempt left out, and it
       * drew nothing at all rather than drawing a tournament without them —
       * the list arrived, was parsed, and produced no card. Taken from the
       * recording: what can be traded, how many have entered, and what each
       * of them starts with.
       */
      instruments: ["binary-options", "digital-options", "blitz-options"],
      option_type: "binary",
      start_amount: Number(row.starting_balance),
      users_count: Number(row.users_count) || 0,
      rebuy_count: 0,
      illustration: null,
      // The server's own clock, which the panel counts down from.
      time: Math.floor(Date.now() / 1000),
      registered: Boolean(entry),
      position: entry ? Number(entry.position) : null,
      balance_id: entry?.balance_id ? Number(entry.balance_id) : null,
      is_winner: false,
    });
    bucket.count += 1;
  }

  return buckets;
}

/** The standings of one tournament, best first. */
export async function tournamentWinners(tournamentId, limit = 50) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id <= 0) return [];

  const rows = await pool().query(
    `SELECT e.user_id, e.pnl,
            COALESCE(NULLIF(TRIM(u.name), ''), SUBSTRING_INDEX(u.email, '@', 1)) AS user_name
       FROM tournament_entries e
       JOIN users u ON u.id = e.user_id
      WHERE e.tournament_id = ?
      ORDER BY e.pnl DESC
      LIMIT ?`,
    [id, limit],
  );

  return rows.map((row, index) => ({
    user_id: Number(row.user_id),
    user_name: row.user_name ?? "Trader",
    position: index + 1,
    pnl: Number(row.pnl),
    score: Number(row.pnl),
  }));
}
