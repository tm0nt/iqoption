/**
 * Settling deals, whether or not anyone is watching.
 *
 * This used to run on a timer owned by each connection, which meant a deal only
 * reached its expiry if its owner happened to be connected at that moment.
 * Close the tab a second before expiry and the deal sat open: the wallet was
 * never credited, the admin screen showed it running hours later, and the only
 * thing that moved it along was signing back in.
 *
 * A deal's outcome is decided by the quote at its expiry, which is a fact about
 * the market and not about anyone's browser. So the loop belongs to the process:
 * one timer, every account, connected or not.
 *
 * Connections register here so that someone who *is* watching still gets the
 * events the portfolio needs — the client only learns a deal is over from
 * `position-changed`, and the balance in the corner only moves when both of the
 * wallet events arrive.
 */
import { accountsInMemory, loadAccountById, saveBalances } from "../accounts.mjs";
import { pool } from "../db/pool.mjs";
import { portfolioEvent, settleDue } from "./positions.mjs";
import { fireDueAlerts } from "../data/alerts.mjs";

/** How often expiries are checked. */
const TICK_MS = 1_000;

/**
 * How often the database is swept for deals whose owner is not in memory.
 *
 * Rarer than the tick: it is a query, and the only deals it finds are ones
 * nobody is waiting on. A few seconds late costs nothing — the outcome is
 * computed from the quote at the expiry, not from when the sweep noticed.
 */
const SWEEP_MS = 15_000;

/** userId -> the connections currently watching it. */
const watchers = new Map();

let ticker = null;
let sweeper = null;

export function watch(userId, connection) {
  if (!watchers.has(userId)) watchers.set(userId, new Set());
  watchers.get(userId).add(connection);
}

export function unwatch(userId, connection) {
  const set = watchers.get(userId);
  if (!set) return;
  set.delete(connection);
  if (set.size === 0) watchers.delete(userId);
}

/**
 * Settles everything due on one account and tells anyone watching.
 *
 * @returns the number of deals closed.
 */
function settleAccount(account, feed) {
  const closed = settleDue(account, feed);
  if (!closed.length) return 0;

  // The wallet moved for every outcome: a loss took its stake at open, and that
  // write may still be in flight.
  saveBalances(account);

  const credited = new Set();
  for (const position of closed) {
    if (position.profit_amount > 0) credited.add(position.user_balance_id);
  }

  for (const connection of watchers.get(account.userId) ?? []) {
    connection.announceSettlement(closed, credited);
  }

  return closed.length;
}

/**
 * Finds accounts with a deal past its expiry that are not in memory.
 *
 * Loading the account is enough: it is cached from then on, and the next tick
 * settles it like any other.
 */
async function sweep(feed, log) {
  const live = new Set(accountsInMemory().map((account) => account.userId));

  const rows = await pool().query(
    `SELECT DISTINCT user_id FROM positions
      WHERE closed_at = 0 AND expiration_time <= UNIX_TIMESTAMP()
      LIMIT 200`,
  );

  for (const row of rows) {
    const userId = Number(row.user_id);
    if (live.has(userId)) continue;
    const account = await loadAccountById(userId);
    if (!account) continue;
    const closed = settleAccount(account, feed);
    if (closed) log(`settled ${closed} deal(s) for ${userId}, who is not connected`);
  }
}

export function startSettlement(feed, log = () => {}) {
  stopSettlement();

  ticker = setInterval(() => {
    for (const account of accountsInMemory()) {
      try {
        settleAccount(account, feed);
      } catch (error) {
        console.error(`[avalon] settling ${account.userId} failed:`, error.message);
      }
    }

    /*
     * Price alerts ride the same tick.
     *
     * They are the same kind of promise a deal's expiry is — about the market,
     * not about anyone's browser — so they are checked for everyone rather
     * than for whoever happens to be connected. Being *told* is what needs a
     * connection, and that is what the watchers below are for.
     *
     * Unawaited and caught: an alert that fails to fire must not stop a deal
     * from settling.
     */
    fireDueAlerts(feed)
      .then((fired) => {
        for (const trigger of fired) {
          for (const connection of watchers.get(trigger.userId) ?? []) {
            connection.announceAlert(trigger);
          }
        }
      })
      .catch((error) => console.error("[avalon] firing alerts failed:", error.message));
  }, TICK_MS);

  sweeper = setInterval(() => {
    sweep(feed, log).catch((error) => console.error("[avalon] settlement sweep failed:", error.message));
  }, SWEEP_MS);

  // Anything that expired while the process was down is due immediately.
  sweep(feed, log).catch((error) => console.error("[avalon] first settlement sweep failed:", error.message));
}

export function stopSettlement() {
  clearInterval(ticker);
  clearInterval(sweeper);
  ticker = null;
  sweeper = null;
}

export { portfolioEvent };
