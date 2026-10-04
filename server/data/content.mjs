/*
 * Editorial content the traderoom shows, read straight from the database.
 *
 * The same `content_items` the admin screen writes. This server has no Prisma
 * client — it talks SQL through the shared pool — so the rows are shaped here
 * rather than imported from the web app.
 *
 * Cached for a minute. These lists change when an editor saves, not when a
 * chart ticks, and the news panel asks again every time it is opened.
 */
import { pool } from "../db/pool.mjs";

const TTL_MS = 60_000;
/** `${kind}:${locale}` -> { at, rows } */
const cache = new Map();

/**
 * Enabled, unexpired items of one kind, for one language.
 *
 * A row with no locale answers every language, which is what lets one editor
 * serve three without writing everything three times.
 */
export async function contentItems(kind, locale, limit = 50) {
  const key = `${kind}:${locale ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;

  const rows = await pool().query(
    `SELECT id, title, summary, body, image_url, link_url, author, starts_at, duration_mins, priority
       FROM content_items
      WHERE kind = ?
        AND enabled = 1
        AND (locale IS NULL OR locale = ?)
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY priority DESC, starts_at DESC, id DESC
      LIMIT ?`,
    [kind, locale ?? "", limit],
  );

  cache.set(key, { at: Date.now(), rows });
  return rows;
}

/** Called when an administrator saves, so the next read is not a minute stale. */
export function forgetContent() {
  cache.clear();
}

/** Seconds since the epoch, which is how every frame here carries a time. */
export function epoch(value) {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
}
