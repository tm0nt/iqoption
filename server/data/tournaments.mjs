/*
 * Tournaments, in the shape `get-tournaments-info` answers with.
 *
 * The reply is not a list: it is an object keyed by the status numbers the
 * request asked about, each holding `{list, count}` — so a panel that asked
 * about three statuses gets three buckets back whether or not any is filled.
 * Taken from a recording; see docs/avalon-panels.md.
 */
import { pool } from "../db/pool.mjs";
import { REAL, TOURNAMENT } from "../accounts.mjs";
import { round } from "../market/prices.mjs";

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

/**
 * Entering a tournament.
 *
 * `register-in-tournament-new` is what the engine sends — the name came from
 * the feed's own log the first time the button was pressed, not from guessing.
 *
 * Three things happen together or not at all: the fee leaves the real wallet,
 * a wallet of tournament money is opened at the tournament's starting amount,
 * and the entry is recorded. Doing any one without the others leaves somebody
 * either playing for free or paying for nothing.
 */
export async function registerInTournament(tournamentId, account, force = false) {
  const id = Number(tournamentId);
  if (!Number.isInteger(id) || id <= 0) return { error: "unknown tournament" };

  const rows = await pool().query(
    `SELECT id, name, status, cost, starting_balance, currency, ends_at
       FROM tournaments WHERE id = ? AND enabled = 1 LIMIT 1`,
    [id],
  );
  const tournament = rows[0];
  if (!tournament) return { error: "unknown tournament" };
  if (tournament.status === "FINISHED") return { error: "that tournament is over" };
  if (new Date(tournament.ends_at).getTime() < Date.now()) return { error: "that tournament is over" };

  /*
   * Registering twice is not an error, it is the same answer again.
   *
   * The engine retries a call whose reply it did not understand, and a second
   * attempt that comes back as a failure turns one misunderstood frame into a
   * visible one. Handing back the entry that already exists is both true and
   * harmless — and it charges nothing a second time.
   */
  const already = await pool().query(
    "SELECT id, balance_id FROM tournament_entries WHERE tournament_id = ? AND user_id = ? LIMIT 1",
    [id, account.userId],
  );
  if (already[0]) {
    const balanceId = Number(already[0].balance_id);
    return {
      tournament,
      balanceId,
      existing: true,
      real: account.balances.find((balance) => balance.type === REAL),
      created: account.balances.find((balance) => balance.id === balanceId),
    };
  }

  const real = account.balances.find((balance) => balance.type === REAL);
  if (!real) return { error: "no real wallet" };

  const cost = Number(tournament.cost);

  /*
   * `force: false` is a question, not an order.
   *
   * The engine asks first and then shows "Confirm your participation"; only
   * the confirmation carries `force: true`. Charging on the question meant
   * someone who pressed Cancel had already paid — money moved without consent,
   * which is the one kind of bug worth being loud about.
   */
  if (!force) {
    return {
      quote: true,
      tournament,
      cost,
      real,
      enough: real.amount >= cost,
    };
  }

  if (real.amount < cost) return { error: "not enough funds for the entry fee" };

  const db = pool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    /*
     * The debit is conditional on the money still being there. Two clicks in
     * the same instant both read the same balance; only one can pass this.
     */
    const debited = await connection.query(
      "UPDATE balances SET amount = amount - ? WHERE id = ? AND amount >= ?",
      [cost, real.id, cost],
    );
    if (!Number(debited.affectedRows)) {
      await connection.rollback();
      return { error: "not enough funds for the entry fee" };
    }

    const wallet = await connection.query(
      `INSERT INTO balances (user_id, type, tournament_id, amount, currency, is_fiat, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW(3), NOW(3))`,
      [account.userId, TOURNAMENT, id, Number(tournament.starting_balance), tournament.currency],
    );
    const balanceId = Number(wallet.insertId);

    await connection.query(
      `INSERT INTO tournament_entries (tournament_id, user_id, balance_id, pnl, registered_at)
       VALUES (?, ?, ?, 0, NOW(3))`,
      [id, account.userId, balanceId],
    );

    await connection.commit();

    // The in-memory account is what every frame is built from, so it has to
    // learn about both wallets now rather than on the next reconnect.
    real.amount = round(real.amount - cost, 2);
    const created = {
      id: balanceId,
      type: TOURNAMENT,
      amount: Number(tournament.starting_balance),
      currency: tournament.currency,
      is_fiat: false,
      tournamentId: id,
      tournamentName: tournament.name,
    };
    account.balances.push(created);

    return { tournament, real, created, balanceId };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Keeps a standing current as deals on a tournament wallet settle. */
export async function recordTournamentPnl(balanceId, delta) {
  if (!delta) return;
  await pool()
    .query("UPDATE tournament_entries SET pnl = pnl + ? WHERE balance_id = ?", [delta, Number(balanceId)])
    .catch((error) => console.error("[avalon] could not record tournament pnl:", error.message));
}
