/*
 * Price alerts, as `get-alerts` and `create-alert` carry them.
 *
 * Shapes from a recording (docs/avalon-panels.md): the list is
 * `{total, records}` and a created alert comes back on its own under `alert`.
 * Not cached — an alert is written by the person looking at the list, and a
 * stale list is one they just added to and cannot see.
 */
import { pool } from "../db/pool.mjs";

const seconds = (value) => (value ? Math.floor(new Date(value).getTime() / 1000) : 0);

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
    `SELECT id, user_id, asset_id, instrument_types, type, activations, value, created_at
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
export async function createAlert(body, userId) {
  const assetId = Number(body?.asset_id);
  const value = Number(body?.value);
  if (!Number.isInteger(assetId) || assetId <= 0) return { error: "unknown asset" };
  if (!Number.isFinite(value)) return { error: "an alert needs a price" };

  const types = Array.isArray(body?.instrument_types) ? body.instrument_types : [];
  const type = String(body?.type ?? "price");
  const activations = Number(body?.activations) || 1;

  const result = await pool().query(
    `INSERT INTO price_alerts (user_id, asset_id, instrument_types, type, activations, value, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(3))`,
    [userId, assetId, JSON.stringify(types), type, activations, value],
  );

  const id = Number(result.insertId);
  const rows = await pool().query(
    `SELECT id, user_id, asset_id, instrument_types, type, activations, value, created_at
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
