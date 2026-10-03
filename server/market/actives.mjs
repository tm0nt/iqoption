/**
 * Instrument catalog.
 *
 * The ids follow the ones the Avalon/Quadcode feed uses so a client can be
 * repointed between this server and the real one by changing a URL and nothing
 * else. They are provisional until `get-initialization-data` is read from a
 * live session — see docs/avalon-backend.md.
 *
 * `base` and `volatility` only drive the simulator: `base` is the price the
 * random walk oscillates around, `volatility` the fraction of it the walk
 * covers over one `period`.
 */

/**
 * @typedef {object} Active
 * @property {number} id
 * @property {string} ticker
 * @property {string} name
 * @property {number} precision     price decimals
 * @property {number} base          starting price
 * @property {number} volatility    peak-to-peak swing as a fraction of `base`
 * @property {number} period        seconds for one full swing of the slowest octave
 * @property {number} profit        payout percent for a binary option
 * @property {"forex"|"crypto"|"index"|"stock"} kind
 */

/** @type {Active[]} */
export const ACTIVES = [
  { id: 1, ticker: "EURUSD", name: "EUR/USD", precision: 5, base: 1.0842, volatility: 0.004, period: 900, profit: 82, kind: "forex" },
  { id: 2, ticker: "GBPUSD", name: "GBP/USD", precision: 5, base: 1.2671, volatility: 0.005, period: 900, profit: 80, kind: "forex" },
  { id: 3, ticker: "USDJPY", name: "USD/JPY", precision: 3, base: 151.420, volatility: 0.006, period: 900, profit: 80, kind: "forex" },
  { id: 4, ticker: "AUDUSD", name: "AUD/USD", precision: 5, base: 0.6584, volatility: 0.005, period: 900, profit: 78, kind: "forex" },
  { id: 5, ticker: "USDCAD", name: "USD/CAD", precision: 5, base: 1.3612, volatility: 0.004, period: 900, profit: 78, kind: "forex" },
  { id: 816, ticker: "BTCUSD", name: "Bitcoin", precision: 2, base: 82500, volatility: 0.035, period: 1200, profit: 85, kind: "crypto" },
  { id: 817, ticker: "ETHUSD", name: "Ethereum", precision: 2, base: 3180, volatility: 0.045, period: 1200, profit: 85, kind: "crypto" },
  { id: 959, ticker: "US100", name: "US 100", precision: 2, base: 20480, volatility: 0.02, period: 1800, profit: 83, kind: "index" },
  { id: 183, ticker: "SSNLF", name: "Samsung-Pe…", precision: 2, base: 1486, volatility: 0.025, period: 1800, profit: 75, kind: "stock" },
];

/**
 * Asset groups, by id.
 *
 * The client reads these as localization keys and builds its asset selector
 * from them. An empty map leaves it with nowhere to list an instrument, which
 * stalls the `login_step_assets` stage and holds the whole interface on its
 * login view.
 */
export const ACTIVE_GROUPS = {
  1: "front.forex",
  2: "front.crypto",
  3: "front.index",
  4: "front.stock",
  5: "front.commodity",
};

/** Which group each instrument family belongs to. */
const GROUP_BY_KIND = { forex: 1, crypto: 2, index: 3, stock: 4, commodity: 5 };

export function groupIdFor(active) {
  return GROUP_BY_KIND[active.kind] ?? 1;
}

const BY_ID = new Map(ACTIVES.map((active) => [active.id, active]));

/** @returns {Active | undefined} */
export function activeById(id) {
  return BY_ID.get(id);
}

export function activeIds() {
  return ACTIVES.map((active) => active.id);
}
