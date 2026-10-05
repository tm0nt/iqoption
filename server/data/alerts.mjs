/*
 * Price alerts, as `get-alerts` and `create-alert` carry them.
 *
 * Shapes from a recording (docs/avalon-panels.md): the list is
 * `{total, records}` and a created alert comes back on its own under `alert`.
 * Not cached — an alert is written by the person looking at the list, and a
 * stale list is one they just added to and cannot see.
 */
import { pool } from "../db/pool.mjs";
import { activeById } from "../market/actives.mjs";
import { priceAt } from "../market/prices.mjs";

/*
 * Already a count of seconds: every query below asks the database for
 * `UNIX_TIMESTAMP(column)` rather than a DATETIME, because the driver reads a
 * DATETIME back in the wrong zone. See server/db/pool.mjs.
 */
const seconds = (value) => Number(value) || 0;

function readTypes(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function frame(row) {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    asset_id: Number(row.asset_id),
    instrument_types: readTypes(row.instrument_types),
    type: row.type,
    activations: Number(row.activations),
    created_at: seconds(row.created_at),
    value: Number(row.value),
  };
}

/**
 * The alerts on one account.
 *
 * `asset_id` of 0 means every instrument, which is how the panel asks when it
 * is listing rather than drawing one chart's lines.
 */
export async function listAlerts(body, userId) {
  const assetId = Number(body?.asset_id) || 0;
  const types = Array.isArray(body?.type) && body.type.length ? body.type : null;

  const where = ["user_id = ?"];
  const args = [userId];
  if (assetId) {
    where.push("asset_id = ?");
    args.push(assetId);
  }
  if (types) {
    where.push(`type IN (${types.map(() => "?").join(", ")})`);
    args.push(...types);
  }

  const rows = await pool().query(
    `SELECT id, user_id, asset_id, instrument_types, type, activations, value,
              UNIX_TIMESTAMP(created_at) AS created_at
         FROM price_alerts
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT 500`,
    args,
  );

  const records = rows.map(frame);
  return { total: records.length, records };
}

/** Writes one, and hands back the row the panel will draw. */
export async function createAlert(body, userId, feed) {
  const assetId = Number(body?.asset_id);
  const value = Number(body?.value);
  if (!Number.isInteger(assetId) || assetId <= 0) return { error: "unknown asset" };
  if (!Number.isFinite(value)) return { error: "an alert needs a price" };

  const types = Array.isArray(body?.instrument_types) ? body.instrument_types : [];
  const type = String(body?.type ?? "price");
  const activations = Number(body?.activations) || 1;

  /*
   * The quote now is what gives the alert a direction. Without it, an alert
   * set below a rising market and one set above it are the same row, and the
   * first tick cannot tell which way it was meant to be crossed.
   */
  const active = activeById(assetId);
  const createdQuote = active && feed ? priceAt(active, feed.now()) : value;

  const result = await pool().query(
    `INSERT INTO price_alerts (user_id, asset_id, instrument_types, type, activations, value, created_quote, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3))`,
    [userId, assetId, JSON.stringify(types), type, activations, value, createdQuote],
  );

  const id = Number(result.insertId);
  const rows = await pool().query(
    `SELECT id, user_id, asset_id, instrument_types, type, activations, value,
              UNIX_TIMESTAMP(created_at) AS created_at
         FROM price_alerts WHERE id = ?`,
    [id],
  );
  return rows[0] ? frame(rows[0]) : { error: "could not read the alert back" };
}

/** Removes one, and only if it belongs to the person asking. */
export async function deleteAlert(body, userId) {
  const id = Number(body?.id ?? body?.alert_id);
  if (!Number.isInteger(id) || id <= 0) return { error: "unknown alert" };

  const result = await pool().query("DELETE FROM price_alerts WHERE id = ? AND user_id = ?", [id, userId]);
  if (!Number(result.affectedRows)) return { error: "unknown alert" };
  return { id };
}


/**
 * Fires the alerts the market has reached, and records that it did.
 *
 * Called from the settlement tick, which already runs once a second and
 * already has the feed. An alert is crossed when the quote has moved from the
 * side it was set on to the other — `created_quote` is what says which side
 * that was.
 *
 * Every alert is checked, not only those of connected people: an alert is a
 * promise about the market, and the market does not wait for a browser. What
 * needs a connection is being *told*, and that is the caller's job.
 *
 * @returns the triggers created, each with the alert's owner.
 */
export async function fireDueAlerts(feed) {
  const rows = await pool().query(
    `SELECT id, user_id, asset_id, type, activations, value, created_quote
       FROM price_alerts
      WHERE type = 'price'`,
  );
  if (rows.length === 0) return [];

  // One price per instrument per tick, however many alerts watch it.
  const quotes = new Map();
  const quoteOf = (assetId) => {
    if (quotes.has(assetId)) return quotes.get(assetId);
    const active = activeById(assetId);
    const quote = active ? priceAt(active, feed.now()) : null;
    quotes.set(assetId, quote);
    return quote;
  };

  const fired = [];
  for (const row of rows) {
    const quote = quoteOf(Number(row.asset_id));
    if (quote === null) continue;

    const value = Number(row.value);
    const from = Number(row.created_quote);
    const crossed = from <= value ? quote >= value : quote <= value;
    if (!crossed) continue;

    fired.push({
      alertId: Number(row.id),
      userId: Number(row.user_id),
      assetId: Number(row.asset_id),
      type: row.type,
      value,
      quote,
      activationsLeft: Number(row.activations) - 1,
    });
  }
  if (fired.length === 0) return [];

  const db = pool();
  await Promise.all(
    fired.map((trigger) =>
      db.query(
        `INSERT INTO price_alert_triggers (alert_id, user_id, asset_id, type, value, quote, fired_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(3))`,
        [trigger.alertId, trigger.userId, trigger.assetId, trigger.type, trigger.value, trigger.quote],
      ),
    ),
  );

  /*
   * An alert with activations left goes back to watching from where the
   * market is now, so it fires again on the next crossing rather than on
   * every tick while the price sits past it. One with none left is done.
   */
  const spent = fired.filter((trigger) => trigger.activationsLeft <= 0).map((trigger) => trigger.alertId);
  const renewed = fired.filter((trigger) => trigger.activationsLeft > 0);

  if (spent.length) {
    await db.query(`DELETE FROM price_alerts WHERE id IN (${spent.map(() => "?").join(",")})`, spent);
  }
  await Promise.all(
    renewed.map((trigger) =>
      db.query("UPDATE price_alerts SET activations = ?, created_quote = ? WHERE id = ?", [
        trigger.activationsLeft,
        trigger.quote,
        trigger.alertId,
      ]),
    ),
  );

  return fired;
}

/** The alerts that have gone off, which is what the history tab lists. */
export async function listTriggers(body, userId) {
  const assetId = Number(body?.asset_id) || 0;
  const limit = Math.min(Number(body?.limit) || 30, 200);
  const offset = Number(body?.offset) || 0;

  const where = ["user_id = ?"];
  const args = [userId];
  if (assetId) {
    where.push("asset_id = ?");
    args.push(assetId);
  }

  const rows = await pool().query(
    `SELECT id, alert_id, user_id, asset_id, type, value, quote,
              UNIX_TIMESTAMP(fired_at) AS fired_at
         FROM price_alert_triggers
      WHERE ${where.join(" AND ")}
      ORDER BY fired_at DESC
      LIMIT ? OFFSET ?`,
    [...args, limit, offset],
  );

  const records = rows.map((row) => ({
    id: Number(row.id),
    alert_id: row.alert_id === null ? null : Number(row.alert_id),
    user_id: Number(row.user_id),
    asset_id: Number(row.asset_id),
    type: row.type,
    value: Number(row.value),
    // What the market was when it went off, beside what was asked for.
    quote: Number(row.quote),
    activated_at: seconds(row.fired_at),
    created_at: seconds(row.fired_at),
  }));

  return { total: records.length, records };
}
