/**
 * Where deals are kept between restarts.
 *
 * The deal book itself stays in memory: `settleDue` runs on a one-second timer
 * and `positions-state` is answered from it, and neither can wait on a query.
 * This is the other half — every change is written through, and a session that
 * reconnects reads its open deals back instead of finding them gone.
 *
 * Writes do not block the frame that caused them. The client learns the outcome
 * from the event it is already waiting for; a write that fails has to be visible
 * in the log, not as a traderoom that stopped responding.
 *
 * Ids are allocated in this process, seeded from the table's high-water mark at
 * boot. That assumes one market server per database — two would hand out the
 * same id. The alternative is letting the database allocate, which would make
 * opening a deal asynchronous all the way up through the router.
 */
import { pool } from "../db/pool.mjs";
import { activeById } from "./actives.mjs";
import { optionActive } from "../protocol/active.mjs";

/** Matches the `AUTO_INCREMENT` the migration sets, for an empty table. */
const FIRST_POSITION_ID = 7_000_001;

let nextId = FIRST_POSITION_ID;

/** How much of a person's closed history is read back at sign-in. */
const HISTORY_LIMIT = 300;

/**
 * Picks up where the last run left off.
 *
 * Without this a restart starts handing out ids that already exist, and the
 * first write collides on the primary key.
 */
export async function loadNextPositionId() {
  const rows = await pool().query("SELECT MAX(id) AS top FROM positions");
  const top = Number(rows[0]?.top ?? 0);
  nextId = Math.max(top + 1, FIRST_POSITION_ID);
  return nextId;
}

/** The id the next deal will carry. */
export function takePositionId() {
  return nextId++;
}

/** Inserts a deal the moment it is bought. */
export function savePosition(position) {
  pool()
    .query(
      `INSERT INTO positions
         (id, user_id, balance_id, active_id, option_type_id, direction, invest,
          profit_percent, currency, open_quote, open_time, open_time_ms,
          expiration_time, expiration_size, closed_at, status, close_reason,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'open', 'default', NOW(), NOW())`,
      [
        position.external_id,
        position.user_id,
        position.user_balance_id,
        position.active_id,
        position.option_type_id,
        position.direction,
        position.invest,
        position.profit_percent,
        position.currency,
        position.open_quote,
        position.open_time,
        position.open_time_ms,
        position.expiration_time,
        position.expiration_size,
      ],
    )
    .catch((error) => console.error(`[avalon] could not save deal ${position.external_id}:`, error.message));
}

/** Writes a settled deal's outcome. */
export function closePosition(position) {
  pool()
    .query(
      `UPDATE positions
          SET closed_at = ?, status = ?, close_reason = ?, close_quote = ?,
              profit_amount = ?, close_profit = ?, updated_at = NOW()
        WHERE id = ?`,
      [
        position.closed,
        position.status,
        position.close_reason,
        position.close_quote,
        position.profit_amount,
        position.close_profit,
        position.external_id,
      ],
    )
    .catch((error) => console.error(`[avalon] could not close deal ${position.external_id}:`, error.message));
}

/**
 * Rebuilds the in-memory deal from its row.
 *
 * The instrument descriptor is not stored: it comes from the catalogue, which
 * an administrator can change between a deal opening and closing. Taking it
 * from the catalogue means a renamed instrument shows its new name everywhere
 * rather than two different names in two panels.
 */
function hydrate(row) {
  const active = activeById(Number(row.active_id));
  const closed = Number(row.closed_at);

  return {
    id: Number(row.id),
    option_id: Number(row.id),
    external_id: Number(row.id),
    user_id: Number(row.user_id),
    user_balance_id: Number(row.balance_id),
    active_id: Number(row.active_id),
    instrument_type: row.option_type_id === 1 ? "binary" : row.option_type_id === 12 ? "blitz" : "turbo",
    option_type: row.option_type_id === 1 ? "binary" : row.option_type_id === 12 ? "blitz" : "turbo",
    option_type_id: Number(row.option_type_id),
    direction: row.direction,
    status: row.status,
    open: Number(row.open_time),
    closed,
    invest: Number(row.invest),
    invest_enrolled: Number(row.invest),
    profit_percent: Number(row.profit_percent),
    profit_amount: Number(row.profit_amount ?? 0),
    close_profit: Number(row.close_profit ?? 0),
    currency: row.currency,
    open_time: Number(row.open_time),
    open_quote: Number(row.open_quote),
    close_quote: Number(row.close_quote ?? 0),
    close_reason: row.close_reason,
    expiration_time: Number(row.expiration_time),
    expiration_size: Number(row.expiration_size),
    result: closed ? row.close_reason : "open",
    buyback_state: "open",
    buyback_time: 0,
    client_platform_id: 190,
    active: active ? optionActive(active) : {},
    raw_event: {},
    params: {},
    amount_multiplier: 1,
    win_enrolled_amount: 0,
    deadtime: 0,
    max_count: 0,
    offset: 0,
    open_time_ms: Number(row.open_time_ms),
    requested_at: Number(row.open_time_ms),
    created_at: Number(row.open_time_ms) + 1,
    updated_at: Number(row.open_time_ms) + 1,
    close_time_ms: closed * 1_000,
  };
}

/**
 * A person's deals: everything still running, plus recent history.
 *
 * Both, in one list, because that is how the book is held in memory —
 * `openPositions` filters on `closed` and the history panel reads the rest. A
 * deal that expired while nobody was connected comes back open and settles on
 * the next tick, which is what should happen: the expiry already passed, and
 * the quote at that moment is what decides it.
 */
export async function loadPositions(userId) {
  const rows = await pool().query(
    `SELECT * FROM positions
      WHERE user_id = ?
        AND (closed_at = 0 OR id IN (
              SELECT id FROM (
                SELECT id FROM positions WHERE user_id = ? AND closed_at > 0
                 ORDER BY closed_at DESC LIMIT ?
              ) AS recent))
      ORDER BY open_time ASC`,
    [userId, userId, HISTORY_LIMIT],
  );
  return rows.map(hydrate);
}
