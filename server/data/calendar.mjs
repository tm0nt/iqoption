/*
 * The economic calendar, read from the database.
 *
 * This is what "Market Analysis" shows on this platform — not a news feed; see
 * docs/avalon-panels.md. Three calls, and the shapes come from a recording of
 * the live feed:
 *
 *   get-economic-calendar-filters     -> the choices the filter panel offers
 *   get-economic-calendar-events      -> the list, filtered and windowed
 *   get-economic-calendar-events-info -> the detail for the ids it asks about
 */
import { pool } from "../db/pool.mjs";

const TTL_MS = 60_000;
let cache = null;

/** Every enabled release, oldest first. Cached: an editor saves, a chart ticks. */
async function allEvents() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const rows = await pool().query(
    `SELECT id, country, name, ticker, period, importance, category_group,
            UNIX_TIMESTAMP(released_at) AS released_at, actual, forecast, previous,
            description, asset_ids
       FROM calendar_events
      WHERE enabled = 1
      ORDER BY released_at ASC`,
  );
  cache = { at: Date.now(), rows };
  return rows;
}

export function forgetCalendar() {
  cache = null;
}

/** Already seconds: the query asks for `UNIX_TIMESTAMP`. See db/pool.mjs. */
const seconds = (value) => Number(value) || 0;

function readAssets(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * The list, as the panel asks for it.
 *
 * `offset` is not a page: the request sends `{offset: -20, limit: 60}`, which
 * is a window *around now* — twenty releases already out, then the ones still
 * to come. So the window is cut from the first release that has not happened
 * yet, not from the start of the list.
 */
export async function calendarEvents(body) {
  const rows = await allEvents();

  const countries = Array.isArray(body?.countries) && body.countries.length ? new Set(body.countries) : null;
  const groups = Array.isArray(body?.category_groups) && body.category_groups.length ? new Set(body.category_groups) : null;
  const importances = Array.isArray(body?.importances) && body.importances.length ? new Set(body.importances.map(Number)) : null;

  const matching = rows.filter((row) => {
    if (countries && !countries.has(row.country)) return false;
    if (importances && !importances.has(Number(row.importance))) return false;
    if (groups && row.category_group && !groups.has(row.category_group)) return false;
    return true;
  });

  const now = Date.now();
  const firstAhead = matching.findIndex((row) => seconds(row.released_at) * 1000 >= now);
  const anchor = firstAhead === -1 ? matching.length : firstAhead;

  const offset = Number.isFinite(Number(body?.offset)) ? Number(body.offset) : 0;
  const limit = Math.min(Number(body?.limit) || 60, 300);
  const from = Math.max(0, anchor + offset);

  return matching.slice(from, from + limit).map((row) => ({
    id: Number(row.id),
    name: row.name,
    country: row.country,
    datetime: seconds(row.released_at),
    importance: Number(row.importance),
    actual: row.actual ?? "",
    forecast: row.forecast ?? "",
    previous: row.previous ?? "",
  }));
}

/** The detail behind the ids the panel names when someone opens a release. */
export async function calendarEventsInfo(ids) {
  const wanted = new Set((Array.isArray(ids) ? ids : []).map(Number));
  if (wanted.size === 0) return [];

  const rows = await allEvents();
  return rows
    .filter((row) => wanted.has(Number(row.id)))
    .map((row) => ({
      id: Number(row.id),
      country: row.country,
      ticker: row.ticker ?? "",
      period: row.period ?? "",
      previous: row.previous ?? "",
      actual: row.actual ?? "",
      forecast: row.forecast ?? "",
      description: row.description ?? "",
      // The live feed sends the source's own wording beside the translated
      // one, and the panel offers "Show Original" between them. Ours are the
      // same text, which is honest: there is one wording to show.
      original_description: row.description ?? "",
      assets: readAssets(row.asset_ids),
      historical_values: [],
    }));
}

/** The choices the filter panel offers, built from what is actually stored. */
export async function calendarFilters() {
  const rows = await allEvents();

  const groups = [...new Set(rows.map((row) => row.category_group).filter(Boolean))].sort();
  const countries = [...new Set(rows.map((row) => row.country))].sort();
  const importances = [...new Set(rows.map((row) => Number(row.importance)))].sort();

  return {
    category_groups: groups,
    // The panel shows a currency beside each country; it is a label, so an
    // unknown country gets an empty one rather than a guess.
    countries: countries.map((short_name) => ({ short_name, currency: CURRENCY_OF[short_name] ?? "" })),
    importances,
  };
}

/** The currency the panel labels each country with. */
const CURRENCY_OF = {
  au: "AUD", br: "BRL", ca: "CAD", ch: "CHF", cn: "CNH", cz: "CZK", de: "EUR",
  es: "EUR", eu: "EUR", fr: "EUR", gb: "GBP", hk: "HKD", hu: "HUF", il: "ILS",
  in: "INR", it: "EUR", jp: "JPY", mx: "MXN", no: "NOK", nz: "NZD", pl: "PLN",
  ru: "RUB", sa: "SAR", se: "SEK", sg: "SGD", th: "THB", tr: "TRY", us: "USD",
  za: "ZAR",
};
