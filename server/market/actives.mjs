/**
 * Instrument catalog, loaded from the database.
 *
 * The ids follow the ones the Avalon/Quadcode feed uses so a client can be
 * repointed between this server and the real one by changing a URL and nothing
 * else — which only works if the instrument ids agree. See
 * docs/avalon-backend.md.
 *
 * `ACTIVES` and `ACTIVE_GROUPS` are filled in place by `loadCatalog()` rather
 * than replaced, because the router, the feed and the position book all hold a
 * reference to them from their own imports. Reassigning the binding would leave
 * every one of them looking at the empty array this module starts with.
 *
 * This reads MySQL directly instead of through Prisma. Prisma owns the schema
 * and the admin API, but its generated client is TypeScript and this server is
 * plain ESM that starts with no build step; one read query is not worth a
 * compiler in front of the market feed.
 */
import { pool, readJson } from "../db/pool.mjs";

/**
 * @typedef {object} Active
 * @property {number} id
 * @property {string} ticker
 * @property {string} name
 * @property {number} precision     price decimals
 * @property {number} profit        payout percent for a binary option
 * @property {"BINANCE"|"SIMULATED"} source
 * @property {string|null} sourceSymbol
 * @property {"forex"|"crypto"|"index"|"stock"|"commodity"} kind
 * @property {number} groupId
 * @property {number} base          simulator only: centre of the curve
 * @property {number} volatility    simulator only: swing as a fraction of base
 * @property {number} period        simulator only: seconds per slow swing
 */

/** @type {Active[]} */
export const ACTIVES = [];

/**
 * Asset groups, by id.
 *
 * The client reads these as localization keys and builds its asset selector
 * from them. An empty map leaves it with nowhere to list an instrument, which
 * stalls the `login_step_assets` stage and holds the whole interface on its
 * login view.
 */
export const ACTIVE_GROUPS = {};

/** Settings rows, by key — whatever the admin has set. */
export const SETTINGS = {};

/**
 * Reads the catalogue and fills the exported collections in place.
 *
 * Safe to call again: an administrator changing an instrument takes effect on
 * the next refresh without restarting the feed.
 *
 * @returns {Promise<{assets: number, groups: number}>}
 */
export async function loadCatalog() {
  const db = pool();
  const [groups, assets, settings] = await Promise.all([
    db.query("SELECT id, `key`, name, priority FROM asset_groups WHERE enabled = 1 ORDER BY priority"),
    db.query("SELECT * FROM assets WHERE enabled = 1 ORDER BY priority, id"),
    db.query("SELECT `key`, value FROM platform_settings"),
  ]);

  for (const key of Object.keys(ACTIVE_GROUPS)) delete ACTIVE_GROUPS[key];
  for (const group of groups) ACTIVE_GROUPS[Number(group.id)] = group.key;

  ACTIVES.length = 0;
  for (const row of assets) {
    ACTIVES.push({
      id: Number(row.id),
      ticker: row.ticker,
      name: row.name,
      kind: row.kind,
      groupId: Number(row.group_id),
      precision: Number(row.precision),
      profit: Number(row.profit),
      source: row.source,
      sourceSymbol: row.source_symbol,
      pipScale: Number(row.pip_scale),
      spreadPlus: Number(row.spread_plus),
      spreadMinus: Number(row.spread_minus),
      deadtime: Number(row.deadtime),
      expirations: readJson(row.expirations, [60, 120, 300]),
      expirationDays: readJson(row.expiration_days, [1, 1, 1, 1, 1, 1, 1]),
      minQty: Number(row.min_qty),
      qtyStep: Number(row.qty_step),
      currencyLeft: row.currency_left,
      currencyRight: row.currency_right,
      timeFrom: row.time_from,
      timeTo: row.time_to,
      exchange: row.exchange,
      image: row.image,
      priority: Number(row.priority),
      isOtc: Boolean(row.is_otc),
      isVisible: Boolean(row.is_visible),
      isPaused: Boolean(row.is_paused),
      isSuspended: Boolean(row.is_suspended),
      // Simulator inputs. Null for an instrument with a feed; `priceAt` only
      // reads them when the feed has nothing, and `index.mjs` fills `base` from
      // the first real price so even that fallback lands near the truth.
      base: row.sim_base === null ? 0 : Number(row.sim_base),
      volatility: row.sim_volatility === null ? 0.01 : Number(row.sim_volatility),
      period: row.sim_period === null ? 900 : Number(row.sim_period),
    });
  }

  for (const key of Object.keys(SETTINGS)) delete SETTINGS[key];
  for (const row of settings) SETTINGS[row.key] = readJson(row.value, null);

  BY_ID.clear();
  for (const active of ACTIVES) BY_ID.set(active.id, active);

  return { assets: ACTIVES.length, groups: Object.keys(ACTIVE_GROUPS).length };
}

export function groupIdFor(active) {
  return active.groupId ?? 1;
}

const BY_ID = new Map();

/** @returns {Active | undefined} */
export function activeById(id) {
  return BY_ID.get(id);
}

export function activeIds() {
  return ACTIVES.map((active) => active.id);
}
