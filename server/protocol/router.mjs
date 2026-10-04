/**
 * Request routing for the socket protocol.
 *
 * Every frame is JSON with a `name` discriminator. Two envelopes carry
 * everything that matters: `sendMessage` is a call to a named service and
 * `subscribeMessage` opens an event stream filtered by `routingFilters`. The
 * handlers below answer the calls the chart makes; anything unknown comes back
 * as a 4040 rather than silence, so a client sees what is missing.
 */

import { ACTIVES, ACTIVE_GROUPS, activeById, groupIdFor } from "../market/actives.mjs";
import {
  balanceChangedFrame,
  balancesFrame,
  marginalBalanceFrame,
  profileFrame,
  saveBalance,
} from "../accounts.mjs";
import { featureRows } from "../data/features.mjs";
import { defaultUserConfig } from "../data/user-settings.mjs";
import { halfSpread, priceAt, round } from "../market/prices.mjs";
import {
  closedPositions,
  openOption,
  openPositions,
  optionReply,
  portfolioEvent,
  positionState,
} from "../market/positions.mjs";
import { optionActive } from "./active.mjs";

/** Status codes, mirroring the ones the live feed uses. */
export const STATUS = { OK: 2000, BAD_REQUEST: 4000, NOT_FOUND: 4040 };

/** Hard cap on one history page, so a bad `count` cannot stall the loop. */
const MAX_CANDLES = 1_000;

/**
 * The candle sizes the client asks about, in seconds.
 *
 * Taken from the keys of a recorded `first-candles` frame: 1s up to 30 days.
 */
/**
 * How far back a series of this bucket size reaches, in seconds.
 *
 * The live feed keeps roughly one day of history per second of bucket size,
 * with a floor of a week for the fastest series and a ceiling where the series
 * simply begins. Measured off a recording: size 1 and 5 reach back 7 days,
 * size 60 reaches 60 days and size 300 reaches 300.
 */
function historyDepth(size) {
  const DAY = 86_400;
  return Math.min(Math.max(size, 7), 600) * DAY;
}

/** The account's own wallet record, which the balance events report on. */
function walletOf(account, balanceId) {
  return (
    account.balances.find((balance) => balance.id === Number(balanceId)) ??
    account.balances.find((balance) => balance.id === account.activeBalanceId)
  );
}

/** How long the client may treat a `positions-state` frame as current. */
const STATE_TTL_SECONDS = 60;

let nextPositionSubscription = 1;

/**
 * Registers interest in a set of deals and hands back the id that names it.
 *
 * `subscribe-positions` is answered with a frame called `subscription`, not
 * with the state itself — the client prints the one it wanted when the answer
 * is wrong: `{"name":"subscription", ...}`. Every `positions-state` event then
 * has to carry the same `subscription_id`, which the client treats as
 * mandatory.
 */
function nextSubscriptionId(account, ids) {
  if (!account.positionSubscriptions) account.positionSubscriptions = new Map();
  const id = (nextPositionSubscription += 1);
  account.positionSubscriptions.set(id, ids);
  return id;
}

/** The rate between two currencies, as `exchange-rate` reports it. */
function exchangeRate(body, feed) {
  const base = String(body?.base_currency ?? "");
  const quote = String(body?.quote_currency ?? "USD");
  const active = ACTIVES.find((candidate) => candidate.ticker === base);
  return {
    base_currency: base,
    quote_currency: quote,
    rate: active ? priceAt(active, feed.now()) : 1,
    at: feed.now() * 1_000_000_000,
  };
}

/** The expiries an option instrument offers, in seconds. */
const EXPIRATION_TIMES = [5, 10, 15, 30, 45, 60, 120, 180, 300];

const CANDLE_SIZES = [
  1, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 28800,
  43200, 86400, 604800, 2592000,
];

/**
 * @typedef {object} CallContext
 * @property {import("../market/feed.mjs").MarketFeed} feed
 * @property {object} account
 * @property {(frame: object) => void} send
 * @property {(name: string, filters: object) => () => void} watch
 */

/**
 * The instrument families the client asks for underlyings from.
 *
 * `CInstrument::isActivesReceived()` walks every option type and demands
 * actives for each one available to the user **and** for every marginal
 * instrument, whatever its feature flag says. Leaving a family unanswered
 * holds the login gate shut with nothing reported, so all four are served.
 */
const UNDERLYING_SERVICES = {
  "digital-option-instruments": () => ACTIVES,
  "marginal-forex-instruments": () => ACTIVES.filter((a) => a.kind === "forex"),
  "marginal-crypto-instruments": () => ACTIVES.filter((a) => a.kind === "crypto"),
  "marginal-cfd-instruments": () =>
    ACTIVES.filter((a) => a.kind === "index" || a.kind === "stock" || a.kind === "commodity"),
};

/**
 * The instrument family, as `IQOptionType` spells it.
 *
 * It follows the service rather than the active: the same EURUSD is
 * `marginal-forex` under `marginal-forex-instruments` and `digital-option`
 * under `digital-option-instruments`. A recording of the live feed shows
 * exactly that — `"active_type": "marginal-forex"`, not the bare `forex` the
 * enum also offers.
 */
function activeTypeOf(service) {
  return service.replace(/-instruments$/, "");
}

/** The asset-selector category, spelled as `assetSortConfig` keys it. */
function categoryOf(active) {
  if (active.kind === "commodity") return "Commodity";
  if (active.kind === "stock") return "Stock";
  if (active.kind === "index") return "Index";
  return "";
}

/**
 * Trading windows, one per day.
 *
 * The live feed never sends an empty `schedule`; it sends a run of
 * `{open, close}` pairs in seconds. An instrument with no window never trades.
 *
 * The run has to reach backwards as well as forwards. The chart hatches any
 * stretch outside a window as closed, and it looks weeks into the past, so a
 * schedule that starts at today's midnight leaves all of the history greyed out.
 */
function scheduleFrom(now) {
  const DAY = 86_400;
  const BACK = 30;
  const AHEAD = 7;
  const start = Math.floor(now / DAY) * DAY - BACK * DAY;
  return Array.from({ length: BACK + AHEAD }, (_, i) => ({
    open: start + i * DAY + 1,
    close: start + (i + 1) * DAY,
  }));
}

/*
 * The field set is the live feed's own, read off a recorded `underlying-list`.
 * `F2::IQModelCacheInstruments::parseMarginInstrument` reads `active_id`,
 * `active_type`, `regulation_mode`, `ticker`, `precision`, `category`, `image`,
 * `localization_key`, `currency_left_side` and `schedule` out of it.
 *
 * `regulation_mode` is an integer, not a string.
 */
function underlyingItem(active, service) {
  return {
    active_id: active.id,
    active_group_id: groupIdFor(active),
    active_type: activeTypeOf(service),
    // Never empty: see the note in prisma/seed.ts.
    image: active.image,
    image_prefix: "",
    is_suspended: false,
    localization_key: `front.${active.ticker}`,
    name: active.ticker,
    ticker: active.ticker,
    precision: active.precision,
    display_precision: active.precision,
    calculation_precision: active.precision + 1,
    regulation_mode: 1,
    schedule: scheduleFrom(Math.floor(Date.now() / 1000)),
    tags: [],
    max_leverages: [{ leverage: 20 }],
    currency_left_side: active.ticker,
    currency_right_side: "USD",
    pip_scale: 2,
    category: categoryOf(active),
    min_qty: "0.1",
    type_qty: "lot",
    type_qty_localization_key: "front.lot",
    qty_step: "0.1",
    qty_presets: [],
    display_name: active.name,
    enabled: true,
  };
}

/** One `get-underlying-list` handler per family, all answering `underlying-list`. */
function underlyingListHandlers() {
  return Object.fromEntries(
    Object.entries(UNDERLYING_SERVICES).map(([service, pick]) => [
      `${service}.get-underlying-list`,
      () => ({
        name: "underlying-list",
        payload: { items: pick().map((a) => underlyingItem(a, service)) },
      }),
    ]),
  );
}

/**
 * The leverage and overnight-fee calls each family answers.
 *
 * A recording of the live feed shows the client asking
 * `<service>.get-instruments-list` and `<service>.get-overnight-fee` alongside
 * `get-underlying-list`, and the replies drop the service prefix the way
 * `core.get-profile` answers as `profile`.
 */
function instrumentCallHandlers() {
  return Object.fromEntries(
    Object.entries(UNDERLYING_SERVICES).flatMap(([service, pick]) => [
      [`${service}.get-instruments-list`, () => ({
        name: "instruments-list",
        payload: instrumentsList(service),
      })],
      [`${service}.get-overnight-fee`, () => ({
        name: "overnight-fee",
        payload: { items: pick().map((active) => overnightFee(active)) },
      })],
    ]),
  );
}

/**
 * A week of swap rates for one instrument.
 *
 * The amounts are strings in the live feed, and every weekday carries its own
 * entry with the rollover time; Wednesday is the triple-charge day here the
 * way Friday is in the recording.
 */
function overnightFee(active) {
  const day = (longRate, shortRate) => ({
    long: longRate,
    short: shortRate,
    yearly_long: "-0.0525",
    yearly_short: "-0.0475",
    time: "22:00",
  });
  const plain = day("-0.0001438356164384", "-0.0001301369863014");
  const triple = day("-0.0004315068493151", "-0.0003904109589041");
  return {
    active_id: active.id,
    user_group_id: 1,
    yearly_fee_long: "-0.0525",
    yearly_fee_short: "-0.0475",
    fee: { mon: plain, tue: plain, wed: triple, thu: plain, fri: plain },
  };
}

/** name -> (body, context) => payload, for `sendMessage`. */
export const CALLS = {
  /**
   * Historical candles for one series.
   *
   * The client asks by bucket id, not by time: a recorded request reads
   * `{active_id, size, from_id, to_id, split_normalization, only_closed}`.
   * Answering the newest `count` candles instead left the chart with only the
   * handful of bars `first-candles` had seeded, stacked at one instant rather
   * than spread along the axis. A bucket id is `floor(from / size)`, so the
   * range converts straight back into a time span.
   */
  "get-candles": (body, { feed }) => {
    const activeId = Number(body?.active_id);
    const size = Number(body?.size);

    if (!activeById(activeId)) {
      return { error: `unknown active_id ${activeId}`, status: STATUS.NOT_FOUND };
    }
    if (!Number.isFinite(size) || size <= 0) {
      return { error: `invalid size ${size}`, status: STATUS.BAD_REQUEST };
    }

    const fromId = Number(body?.from_id);
    const toId = Number(body?.to_id);
    const byId = Number.isFinite(fromId) && Number.isFinite(toId) && toId >= fromId;

    const count = byId
      ? Math.min(toId - fromId + 1, MAX_CANDLES)
      : Math.min(Number(body?.count) || 100, MAX_CANDLES);
    let to = byId ? toId * size : body?.to ? Number(body.to) : feed.now();
    /*
     * `only_closed` asks for settled buckets. It has to move the window back
     * rather than filter the result: the client often asks for exactly one
     * candle ending now, and dropping the open bucket from that answer returns
     * an empty list instead of the previous, closed one.
     */
    if (body?.only_closed) to = Math.min(to, feed.now() - size);

    return { name: "candles", payload: { candles: feed.history(activeId, size, count, to) } };
  },

  /**
   * The instrument catalog for option trading.
   *
   * The container is what a recording of the live feed shows: one block per
   * option family, each with an ordered `list` of ids and an `actives` map
   * keyed by the same ids. A flat `{actives: …}` — which is what this returned
   * before — leaves the client with no instruments at all, so it never opens a
   * chart and never asks for a candle.
   */
  "get-initialization-data": () => {
    const now = Math.floor(Date.now() / 1000);
    const list = ACTIVES.map((active) => active.id);
    const actives = Object.fromEntries(
      ACTIVES.map((active) => [active.id, binaryActive(active, now)]),
    );
    return {
      name: "initialization-data",
      payload: {
        // Every family whose feature is on has to report actives, or
        // `isActivesReceived()` keeps the login gate shut. Blitz is enabled,
        // so it is served the same instruments rather than left empty.
        turbo: { list, actives },
        binary: { list, actives },
        blitz: { list, actives },
        currency: "USD",
        is_buyback: 0,
        groups: ACTIVE_GROUPS,
      },
    };
  },

  "get-active-list": () => ({
    name: "active-list",
    payload: { actives: ACTIVES.map((active) => active.id) },
  }),

  "get-profile": (_body, { account }) => ({
    name: "profile",
    payload: profileFrame(account),
  }),

  "get-balances": (_body, { account }) => ({
    name: "balances",
    payload: balancesFrame(account),
  }),

  // --- what the WebGL engine asks for during boot -------------------------
  //
  // Names were taken from a recorded session (`npm run server:trace`). The
  // feed answers a call with the request name minus its `get-` prefix, which
  // holds for `get-candles` -> `candles` and is confirmed for
  // `get-forget-user-status` -> `forget-user-status` in the binary's string
  // table. The payloads are the narrowest thing that satisfies each caller;
  // a wrong one shows up as the engine asking again.

  /**
   * The only answer we have a live recording of, and it arrives wrapped in
   * `{isSuccessful, message, result}`. Without the wrapper the client reads the
   * call as failed and restarts the session (`profile_false`, on a doubling
   * interval); with the wrapper applied to *every* answer it stops progressing
   * past the wallets. So the wrapper is opt-in, and set only where a recording
   * shows it.
   */
  "core.get-profile": (_body, { account }) => ({
    name: "profile",
    payload: profileFrame(account),
    envelope: true,
  }),

  "internal-billing.get-balances": (body, { account }) => {
    const wanted = Array.isArray(body?.types_ids) ? body.types_ids : null;
    const balances = balancesFrame(account).filter(
      (balance) => !wanted || wanted.includes(balance.type),
    );
    return { name: "balances", payload: balances };
  },

  /**
   * Account-deletion state, in the shape the profile embeds as `forget_status`.
   */
  "get-forget-user-status": () => ({ name: "forget-user-status", payload: { status: "none" } }),

  /** Extra promotional panels in the traderoom; each is named and toggled. */
  "get-additional-blocks": (_body, { account }) => ({
    name: "additional-blocks",
    payload: { user_id: account.userId, additional_blocks: [] },
  }),

  /**
   * Localised copy and artwork bundles.
   *
   * The client logs the payload back as an error, so the shape is still wrong.
   * A bare list is the next candidate — `get-balances` answers with one and is
   * accepted — and whether the echoed error changes from `{"resources":[]}` to
   * `[]` says whether the container or the emptiness is the problem.
   */
  "resources.get-resources": () => ({ name: "resources", payload: [] }),

  /**
   * The indicator library. The engine ships its own copy in the WASM package
   * (`/indicators/lib.json.gz`), so echoing the version it asked with tells it
   * that what it already has is current.
   */
  "tech-instruments.get-standard-library": (body) => ({
    name: "standard-library",
    payload: {
      version: body?.version ?? 0,
      runtime_version: body?.runtime_version ?? 0,
      instruments: [],
    },
  }),

  /**
   * User-authored indicators. A development account has none.
   *
   * The answer is `script-indicators`. The binary's string table also carries
   * `user-script-indicators`, which is a different frame — answering with it
   * leaves this request to time out.
   */
  "tech-instruments.get-script-indicators": () => ({
    name: "script-indicators",
    payload: { indicators: [] },
  }),

  /**
   * Stored UI preferences, asked for by name and version. Echoing the versions
   * back with empty values says "nothing newer here", which leaves the engine
   * on its own defaults instead of making it ask again.
   */
  "get-user-settings": (body, { account }) => ({
    name: "user-settings",
    payload: {
      configs: (body?.configs ?? []).map((config) => ({
        name: config.name,
        version: config.version,
        config:
          account.settings.get(config.name)?.config ?? defaultUserConfig(config.name, account),
      })),
    },
  }),

  "get-currencies-list": () => ({ name: "currencies-list", payload: { currencies: CURRENCIES } }),

  /**
   * Push-notification topics the account is subscribed to. Asked once during
   * boot with `{platform, locale, transport: "push"}` and blocked for eight
   * seconds unanswered, which is how it showed up:
   * `Request 'get-subscriptions' (0) timed out after 8.0155 sec`.
   *
   * Nothing is subscribed, so the list is empty.
   */
  /**
   * The *oldest* candle of every size, keyed by size in seconds.
   *
   * The name is literal: these are the first candles of each series, not the
   * latest ones. A recording of the live feed makes that plain — at a capture
   * taken on day D, the size-1 entry is from D-7, the size-60 entry from D-60
   * and the size-300 entry from D-300.
   *
   * This is how the client learns how far back each series reaches, and it is
   * what lets it then ask `get-candles` for an id range. Answering with the
   * newest candle instead tells it every series begins now, so it concludes
   * there is no history to fetch and the chart stays empty.
   */
  "get-first-candles": (body, { feed }) => {
    const activeId = Number(body?.active_id);
    if (!activeById(activeId)) {
      return { error: `unknown active_id ${activeId}`, status: STATUS.NOT_FOUND };
    }
    const now = feed.now();
    const candles_by_size = {};
    for (const size of CANDLE_SIZES) {
      const [candle] = feed.history(activeId, size, 1, now - historyDepth(size));
      if (candle) candles_by_size[String(size)] = candle;
    }
    return { name: "first-candles", payload: { candles_by_size } };
  },

  /** One instrument's full descriptor, asked as `{"id": 2516}`. */
  "get-active": (body) => {
    const active = activeById(Number(body?.id));
    if (!active) return { error: `unknown active ${body?.id}`, status: STATUS.NOT_FOUND };
    return { name: "active", payload: optionActive(active) };
  },

  /*
   * Everything below answers a call the live feed was recorded making. The
   * reply names and payload shapes are that recording's, not a guess: an empty
   * collection is sent as the live feed sends it, which is sometimes `[]`,
   * sometimes `{"records": []}` and once an `error` string.
   */

  /** Cashback insurance. `undefined` is the recorded status for a fresh account. */
  "cashback.get-option-insurance": () => ({
    name: "option-insurance",
    payload: { status: "undefined" },
  }),

  "deposit-bonuses.get-bonus": (_body, { account }) => ({
    name: "bonus",
    payload: { user_id: account.userId, status: "unknown", currency: "", splitted: false },
  }),

  /** Deposit presets. The live feed answers a bare array. */
  "deposit-bonuses.get-presets": () => ({ name: "presets", payload: [] }),

  /** Price alerts, asked as `{asset_id, type: ["price", "market_open"]}`. */
  "get-alerts": () => ({ name: "alerts", payload: { total: 0, records: [] } }),

  /**
   * Deposit and withdrawal limits per currency.
   *
   * This is not `get-currencies-list`, which answers `currencies-list` with the
   * trading currencies; the two calls and their two replies are distinct.
   */
  "get-currency-list": () => ({
    name: "currency-list",
    payload: {
      currencies: CURRENCIES.map((currency) => ({
        id: currency.id,
        name: currency.name,
        symbol: currency.symbol,
        mask: currency.mask,
        min_dep: 10,
        max_dep: 1_000_000,
        min_withdrawal: 2,
        max_withdrawal: 1_000_000,
      })),
    },
  }),

  /**
   * The account's leaderboard slice.
   *
   * The live feed answers an `error` string rather than an empty list when the
   * account has no slice yet, and the client treats that as "nothing to show".
   */
  "get-leaderboard-position": (_body, { account }) => ({
    name: "leaderboard-position",
    /*
     * The live feed answers an `error` string when the account has no slice
     * yet, but the client parses the frame regardless and then complains that
     * `pnl` is missing. An empty standing is the same information without the
     * noise, so this deliberately departs from the recording.
     */
    payload: { user_id: account.userId, position: 0, pnl: 0, total: 0, user_name: "" },
  }),

  "get-popups": (_body, { account }) => ({
    name: "popups",
    payload: { user_id: account.userId },
  }),

  /** Countries the brand promotes, as `{id, name_short}` pairs. */
  "get-profitable-countries": () => ({
    name: "profitable-countries",
    // Only countries the `countries` stub also lists; the client resolves each
    // id back to a short name and logs `Cannot get country short name by id`
    // for any it cannot find.
    payload: [
      { id: 30, name_short: "BR" },
      { id: 76, name_short: "GB" },
      { id: 212, name_short: "US" },
    ],
  }),

  /**
   * The share of traders holding a long position, as a number in 0..1.
   *
   * It is deterministic per asset so the gauge does not jitter between calls.
   */
  "get-traders-mood": (body) => {
    const assetId = Number(body?.asset_id);
    const active = activeById(assetId);
    const value = active ? 0.35 + ((active.id * 37) % 55) / 100 : 0.5;
    return {
      name: "traders-mood",
      payload: { instrument: body?.instrument ?? "turbo-option", asset_id: assetId, value },
    };
  },

  "get-user-profile-client": (_body, { account }) => ({
    name: "user-profile-client",
    payload: {
      balances: [],
      client_category_id: 1,
      country_id: 30,
      flag: "BR",
      img_url: "",
      is_demo_account: false,
      is_vip: false,
      vip_badge: false,
      isSuccessful: true,
      registration_time: Math.floor(Date.now() / 1000) - 86_400,
      selected_asset_id: -1,
      selected_balance_type: -1,
      selected_option_type: -1,
      user_id: account.userId,
      user_name: "",
    },
  }),

  /**
   * Widgets the traderoom opens once it is running.
   *
   * None of these appear in the recording, so the payloads are the emptiest
   * thing their parsers accept: every attribute of `F2::TopAssetParser` is
   * optional, so an empty collection carries no risk of a missing-attribute
   * rejection. If a shape is wrong the client names the frame it wanted.
   */
  /*
   * Calls the traderoom only makes once it is running and the user can reach
   * its panels. Request shapes are the client's own, read off a recording of
   * this server's traffic; the replies are the emptiest thing each one accepts.
   */

  /**
   * A price alert. The client sends `{asset_id, instrument_types, type,
   * activations, value}` and the answer echoes the stored alert back under the
   * same name its change stream uses.
   */
  "create-alert": (body, { feed }) => ({
    name: "alert-changed",
    payload: {
      id: Math.floor(feed.now()),
      asset_id: Number(body?.asset_id) || 0,
      instrument_types: body?.instrument_types ?? [],
      type: body?.type ?? "price",
      value: Number(body?.value) || 0,
      activations: Number(body?.activations) || 1,
      status: "active",
      created: feed.now(),
    },
  }),

  "get-news-feed": () => ({ name: "news-feed", payload: { news: [] } }),

  /**
   * Opening a binary option.
   *
   * The deal panel sends `{user_balance_id, active_id, option_type_id,
   * direction, expired, refund_value, price, value, profit_percent}`, where
   * `price` is the stake. The answer carries the position back, and the
   * portfolio then learns about it the same way it learns about any other
   * change — through `portfolio.position-changed` — while the wallet it was
   * paid from is re-sent so the header balance follows.
   */
  "binary-options.open-option": (body, { feed, account, pushEvent, send }) => {
    const position = openOption(account, body, feed);
    if (position.error) return { error: position.error, status: STATUS.BAD_REQUEST };

    pushEvent("portfolio.position-changed", portfolioEvent(position));
    /*
     * The header balance follows `internal-billing.balance-changed`, which is
     * what the client subscribes to; a whole `balances` frame is the snapshot
     * it reads once at login and does not treat as an update. A recording of
     * the live feed confirms the order: the `option` reply, then the position,
     * then the debited wallet — the stake leaves the balance when the deal
     * opens, not when it settles.
     */
    const wallet = walletOf(account, position.user_balance_id);
    // The stake has already left the wallet in memory; this is what makes it
    // survive a restart.
    saveBalance(wallet);
    pushEvent("internal-billing.balance-changed", balanceChangedFrame(account, wallet));
    // The header reads the margin view, not the billing one: a recorded stake
    // moves both, and pushing only the first leaves the corner balance stale.
    pushEvent("marginal-portfolio.balance-changed", marginalBalanceFrame(account, wallet));
    // The incremental event is what the deal panel listens on; the snapshot is
    // what the header read at login, and re-sending it keeps the two agreeing.
    send({ name: "balances", msg: balancesFrame(account) });
    return { name: "option", payload: optionReply(position) };
  },

  /**
   * Live tracking for the deals the portfolio is showing.
   *
   * `TickingPortfolioManager::subscribePositions` sends `{frequency, ids}` and
   * then listens on the `positions-state` stream for the running numbers.
   */
  "subscribe-positions": (body, { account }) => {
    const wanted = (body?.ids ?? []).map(String);
    const id = nextSubscriptionId(account, wanted);
    return { name: "subscription", payload: { subscription_id: id } };
  },

  /** Drops a position subscription opened by `subscribe-positions`. */
  "unsubscribe-positions": (body, { account }) => {
    account.positionSubscriptions?.delete(Number(body?.subscription_id));
    return { name: "subscription", payload: { subscription_id: body?.subscription_id } };
  },

  "get-top-assets": () => ({ name: "top-assets", payload: [] }),
  "get-leaderboard-top": () => ({ name: "leaderboard-top", payload: [] }),
  "get-videos": () => ({ name: "videos", payload: [] }),

  "get-video-categories": () => ({ name: "video-categories", payload: [] }),
  "get-video-tags": () => ({ name: "video-tags", payload: [] }),

  /**
   * Settled deals, for the history panel.
   *
   * The envelope is `{positions, limit}` — narrower than `get-positions`, which
   * also carries `total` and `offset`. Recorded from the live feed, where every
   * answer happened to be empty, so the entries are sent in the same shape
   * `positions` uses; both are portfolio reads of the same deal.
   */
  "portfolio.get-history-positions": (body, { account }) => {
    const limit = Number(body?.limit) || 300;
    const offset = Number(body?.offset) || 0;
    return {
      name: "history-positions",
      payload: { positions: closedPositions(account).slice(offset, offset + limit), limit },
    };
  },

  "request-chat-message": () => ({
    name: "chat-message",
    payload: { isSuccessful: true, data: [] },
  }),

  /** Saved indicator templates. A bare array, like `presets`. */
  "tech-instruments.get-templates": () => ({ name: "templates", payload: [] }),

  /** An idle-time heartbeat the client sends while the traderoom is open. */
  "update-user-availability": () => ({
    name: "user-availability",
    payload: { status: "online" },
  }),

  /**
   * Digital option strikes for one asset.
   *
   * Each instrument is one expiry, and `data` carries the strike ladder as
   * `{strike, symbol, direction}` with the price as a string. The symbol encodes
   * asset, expiry and strike the way the live feed spells it, so the client can
   * round-trip it back on a trade.
   */
  "digital-option-instruments.get-instruments": (body, { feed }) => {
    const assetId = Number(body?.asset_id);
    const active = activeById(assetId);
    if (!active) return { error: `unknown asset_id ${assetId}`, status: STATUS.NOT_FOUND };

    const now = feed.now();
    const period = 60;
    const expiration = Math.ceil((now + 1) / period) * period;
    const quote = priceAt(active, now);
    const step = Math.max(quote * 0.0005, 10 ** -active.precision);
    const data = [];
    for (let i = -5; i <= 5; i += 1) {
      const strike = round(quote + i * step, active.precision);
      const text = strike.toFixed(active.precision).replace(".", "F");
      for (const direction of ["call", "put"]) {
        data.push({
          strike: String(strike),
          symbol: `do${active.id}E${expiration}T${period}S${text}${direction[0].toUpperCase()}`,
          direction,
        });
      }
    }
    return {
      name: "instruments",
      payload: {
        instruments: [
          {
            index: expiration,
            instrument_type: "digital-option",
            asset_id: active.id,
            digital_option_trading_group_id: "1_1",
            expiration,
            period,
            quote,
            volatility: active.volatility * 100,
            generated_at: now,
            data,
          },
        ],
      },
    };
  },

  "get-subscriptions": () => ({ name: "subscriptions", payload: { subscriptions: [] } }),

  /**
   * Help-centre articles for the FAQ panel. The `FAQ` entry of
   * `leftPanelButtonsStates` is off, so the panel is never opened, but the call
   * still runs at boot and still blocks:
   * `Request 'get-faq' (3) timed out after 8.0289 sec`.
   */
  "get-faq": () => ({ name: "faq", payload: { items: [] } }),

  /**
   * Feature flags. The live feed answers with 377 of them; none enabled keeps
   * the traderoom on its base behaviour, but `identity` has to be there.
   */
  "get-features": (body, { account }) => ({
    name: "features",
    payload: {
      identity: String(account.userId),
      features: featureRows(body?.category ?? "platform-4"),
    },
  }),

  /** Onboarding checklist. Nothing outstanding on a development account. */
  /**
   * Onboarding steps. `step_id` and `state` are the `KYCStep` and `KYCStepState`
   * enums, whose members are upper case; `user_id` rides alongside `steps`.
   */
  "get-customer-steps": (_body, { account }) => ({
    name: "customer-steps",
    payload: {
      steps: [
        {
          step_id: "EMAIL",
          state: "PASSED",
          is_skip_allowed: true,
          title: "Email confirmation",
          reason: null,
        },
      ],
      user_id: account.userId,
    },
  }),

  /** KYC. Nothing outstanding, but the client reads each block by name. */
  /**
   * KYC state, as the verification service reads it on connect.
   *
   * `level` and `level_indicator` are enums read as strings, and their members
   * are upper case: `F2::MVEnum<F2::KYCLevel>::mapper()` offers `ENHANCED`,
   * `BASIC`, `NEW` and `NONE`, while `F2::MVEnum<F2::KYCLevelIndicator>` offers
   * `OK`, `NEED_ACTION`, `WAIT` and `REQUIRED`.
   *
   * A lower-case `none` matches neither — it is not the `NONE` member, and the
   * indicator has no `none` member at all. This is the same shape of mistake as
   * spelling an option type `turbo-option` where the enum says `turbo`.
   *
   * `BASIC` with an `OK` indicator is the state of an account with nothing
   * pending, so the traderoom opens without a verification prompt.
   */
  "get-verification-init-data": (_body, { account }) => ({
    name: "verification-init-data",
    payload: {
      user_id: account.userId,
      requirements_data: { user_id: account.userId, requirements: null },
      restrictions_data: { user_id: account.userId, restrictions: [] },
      verification_level_data: {
        user_id: account.userId,
        level: "BASIC",
        level_indicator: "OK",
        required_steps: [],
        need_action_steps: null,
        show_level_indicator: false,
      },
      steps_summary: { steps_count: 0 },
    },
  }),

  "get-feed-languages": () => ({
    name: "feed-languages",
    payload: {
      type: "news",
      available_settings: [
        {
          id: 2,
          name: "English",
          locale: "en_US",
          auto_translate: false,
          icon_url: "",
          hot_sources: 0,
          hot_news: 0,
          is_selected: true,
          updated_at: 0,
        },
      ],
    },
  }),

  /**
   * The client writing a preference back. Kept per account so a later
   * `get-user-settings` returns what was stored instead of defaults again.
   */
  "set-user-settings": (body, { account }) => {
    if (body?.name) {
      account.settings.set(body.name, { version: body.version, config: body.config ?? {} });
    }
    // A write is acknowledged under its own name, not the one a read uses.
    return {
      name: "set-user-settings-reply",
      payload: { name: body?.name, version: body?.version, config: body?.config ?? {} },
    };
  },

  "get-currency": (body) => {
    const currency = CURRENCIES.find((item) => item.name === body?.name) ?? CURRENCIES[0];
    return { name: "currency", payload: currency };
  },

  /** Open trades. A development account starts flat. */
  "portfolio.get-positions": (body, { account }) => {
    const positions = openPositions(account);
    return {
      name: "positions",
      payload: {
        positions,
        total: positions.length,
        limit: body?.limit ?? 30,
        offset: body?.offset ?? 0,
      },
    };
  },

  /**
   * Margin balance updates. Despite the name this arrives as a call, not a
   * `subscribeMessage`: the client asks the margin service to start pushing for
   * one wallet, and the pushes then come as `marginal-portfolio.balance-changed`
   * — which is already accepted as a passive stream.
   */
  "marginal-portfolio.subscribe-balance-changed": (body) => ({
    // `subscription-balance-changed`, not an invented name: the string table
    // carries it directly beside `subscribe-balance-changed`, and the pair
    // repeats for `subscribe-prop-trading-balance-changed`. Answering with
    // anything else leaves the client waiting and retrying — it reports
    // `Request 'subscribe-balance-changed' timed out ... (Attempt: 3)`.
    name: "subscription-balance-changed",
    payload: { id: body?.user_balance_id ?? 0 },
  }),

  /** Margin state for one wallet; the shape lives with the other wallet frames. */
  "marginal-portfolio.get-marginal-balance": (body, { account }) => {
    const id = Number(body?.user_balance_id ?? account.activeBalanceId);
    const wallet = account.balances.find((balance) => balance.id === id) ?? account.balances[0];
    return { name: "marginal-balance", payload: marginalBalanceFrame(account, wallet) };
  },

  /** Pending orders, as opposed to open positions. Also empty here. */
  "portfolio.get-orders": (body) => ({
    name: "orders",
    payload: { orders: [], total: 0, kind: body?.kind ?? "deferred" },
  }),

  "user-activity.get-trading-volume": () => ({
    name: "trading-volume",
    payload: { volume: 0, currency: "USD" },
  }),

  // Chat is a whole subsystem we do not reproduce. These answer the status
  // probes so the engine stops asking and simply shows no chat.
  "chat.get-chat-ban-status": () => ({
    name: "chat-ban-status",
    payload: { is_banned: false, expires_at: null },
  }),

  "chat.get-chat-moderator-status": () => ({
    name: "chat-moderator-status",
    payload: { is_moderator: false },
  }),

  "request-chat-room": () => ({ name: "chat-room", payload: { rooms: [] } }),

  /**
   * Personal-manager contact card. Enabled by the `personal-manager` and
   * `chat-support` flags, and retried hard when unanswered.
   */
  "chat.get-client-manager-contact-info": () => ({
    name: "client-manager-contact-info",
    payload: { phone: "", email: "", name: "", photo: "", is_available: false },
  }),

  /**
   * Per-instrument-type trading limits, asked once for each option family the
   * `trading-settings-cluster-*` flags turn on. The amounts are what the deal
   * panel validates against.
   */
  /**
   * Commission per instrument, asked once for each option family.
   *
   * Both the name and the payload are confirmed: the client's own timeout line
   * prints the frame it was waiting for —
   * `WS:get-trading-group-params -> {"name":"trading-params"…}` — and a
   * recording of the live feed shows that frame carrying `commissions`.
   *
   * Deriving a name from `instrument_type` looked right, because the matching
   * change streams *are* `turbo-option-trading-group-params-changed`. They are
   * not the same name.
   */
  "trading-settings.get-trading-group-params": () => ({
    name: "trading-params",
    payload: {
      commissions: ACTIVES.map((active) => ({
        active_id: active.id,
        value: 100 - active.profit,
      })),
    },
  }),

  // Promo codes. The `promo-codes`, `promo-centre` and `cashier-promo-codes`
  // flags are on, so all four are asked for during boot and each blocks for ten
  // seconds when unanswered. The calls carry the `promo-codes.` service prefix
  // while the answers drop it, which is the same split as `core.get-profile`
  // answering as `profile`.
  "promo-codes.get-available-promo-codes": () => ({ name: "available-promo-codes", payload: [] }),
  "promo-codes.get-active-promo-codes": () => ({ name: "active-promo-codes", payload: [] }),
  "promo-codes.get-traderoom-promo-codes": () => ({ name: "traderoom-promo-codes", payload: [] }),
  "promo-codes.get-used-promo-codes": () => ({ name: "used-promo-codes", payload: [] }),

  ...underlyingListHandlers(),
  ...instrumentCallHandlers(),

  /**
   * Instrument ids grouped by asset class, as the asset selector lists them.
   *
   * The grouping follows a recording of the live feed: most classes are a flat
   * array of ids, `forex` splits into `major`/`minor`/`exotic`, and `stock`
   * carries objects rather than bare ids.
   */
  "get-actives-index": () => {
    const idsOf = (kind) => ACTIVES.filter((a) => a.kind === kind).map((a) => a.id);
    return {
      name: "actives-index",
      payload: {
        commodity: idsOf("commodity"),
        crypto: idsOf("crypto"),
        etf: [],
        forex: { major: idsOf("forex"), minor: [], exotic: [] },
        index: idsOf("index"),
        stock: idsOf("stock").map((id) => ({ id, sub_industry: [] })),
      },
    };
  },

};

/**
 * One instrument as the option families describe it.
 *
 * `profit.commission` is the house edge in percent, so a payout of 82 is
 * reported as 18 — the client subtracts it rather than reading a payout.
 */
/**
 * One instrument as `initialization-data` carries it.
 *
 * This is not the shape `get-active` answers with — the two frames describe the
 * same instrument with different field sets, and `F2::IQModelCacheInstruments::
 * parseBinary` reads this one. That parser is also where `login_step_assets` is
 * reported, so a mismatch here keeps the login gate's `assets` condition shut.
 *
 * Three details are easy to get wrong, and a recording of the live feed settles
 * all three: `name` and `description` are localization keys rather than text,
 * the expiries live in `option.expiration_times` (not `exp`), and `schedule` is
 * a list of `[open, close]` pairs — arrays, not objects, unlike the `schedule`
 * in `underlying-list`.
 */
function binaryActive(active, now) {
  const commission = 100 - active.profit;
  const DAY = 86_400;
  const midnight = Math.floor(now / DAY) * DAY;
  return {
    id: active.id,
    name: `front.${active.ticker}`,
    ticker: active.ticker,
    description: `front.${active.ticker} ${active.name}`,
    group_id: groupIdFor(active),
    // Never empty: an empty path makes the engine ask its resources endpoint
    // for nothing and report the icon as a failed 0x0 image. See the note in
    // prisma/seed.ts.
    image: active.image,
    exchange: "",
    provider: "",
    precision: active.precision,
    minimal_bet: 1,
    maximal_bet: 20_000,
    minmax: { min: 1, max: 20_000 },
    sum: 1,
    top_traders_enabled: true,
    enabled: true,
    is_suspended: false,
    is_buyback: 1,
    deadtime: 0,
    buyback_deadtime: 0,
    start_time: midnight,
    option: {
      profit: { commission, refund_min: 0, refund_max: 0 },
      expiration_times: EXPIRATION_TIMES,
      default_expiration: 60,
      exp_time: 0,
      count: 0,
      special: {},
      start_time: now,
      /*
       * The option carries its own schedule, separate from the active's.
       *
       * `F2::IQOptionData::isEnabledNow` walks this vector and asks whether the
       * instant falls inside one of its windows; the chart hatches every
       * stretch where it does not. An option with no schedule is closed at
       * every instant, which greys out the whole plot.
       */
      schedule: scheduleFrom(now).map(({ open, close }) => ({ open, close })),
    },
    // Pairs, not objects — and reaching back, so the chart does not hatch its
    // own history as closed.
    schedule: Array.from({ length: 37 }, (_, i) => [
      midnight - 30 * DAY + i * DAY + 1,
      midnight - 30 * DAY + (i + 1) * DAY,
    ]),
    rollovers: EXPIRATION_TIMES.map((size) => ({
      expiration_size: size,
      offset: 0,
      offset_from_expiration: size,
      deadtime: 7,
      limit: 5,
    })),
  };
}

/** Shared by `get-currencies-list` and `get-currency`. */
const CURRENCIES = [
  { id: 1, name: "USD", symbol: "$", mask: "$%s", is_crypto: false, is_default: true, minor_units: 2, min_investment: 1 },
  { id: 2, name: "EUR", symbol: "€", mask: "€%s", is_crypto: false, is_default: false, minor_units: 2, min_investment: 1 },
  { id: 3, name: "BRL", symbol: "R$", mask: "R$ %s", is_crypto: false, is_default: false, minor_units: 2, min_investment: 1 },
];

/**
 * Subscriptions the engine opens and we accept but never publish on.
 *
 * Each one reports a change to something a development account cannot change.
 * Acknowledging them matters anyway: an unknown subscription is answered with a
 * 4040, and the engine treats that as a failed boot step and retries.
 */
export const PASSIVE_STREAMS = new Set([
  /*
   * Opened while a deal is running: the live state of the tracked positions and
   * the buyback price for its asset. Neither is needed to hold a position, so
   * both are acknowledged and left silent.
   */
  "price-splitter.client-buyback-generated",
  "top-assets-updated",
  "leaderboard-top-changed",
  // Subscriptions the live feed was recorded opening. They carry no data until
  // something happens on the account, so acknowledging them is the whole job.
  "cashback.insurance-changed",
  "cashback.insurance-status-changed",
  "chat-message-public-generated",
  "deposit-bonuses.bonus-changed",
  "deposit-bonuses.presets-changed",
  "digital-option-instruments.instrument-generated",
  "internal-billing.balance-changed",
  "internal-billing.balance-created",
  "leaderboard-position-move",
  "popup-added",
  "popup-disabled",
  "tech-instruments.modified-templates",
  "tournaments.user-registered-in-tournament",
  "tournaments.user-tournament-position-changed",
  "traders-mood-changed",
  "trading-settings.blitz-option-trading-group-params-changed",
  "trading-settings.digital-option-client-price-generated",
  "trading-settings.digital-option-trading-group-params-changed",
  "user-alerts.alert-changed",
  "user-alerts.alert-triggered",
  ...Object.keys(UNDERLYING_SERVICES).map((service) => `${service}.overnight-fee-changed`),
  "profile-changed",
  "balance-changed",
  "forget-user-status-changed",
  "tech-instruments.standard-library-changed",
  "marginal-portfolio.balance-changed",
  "marginal-portfolio.margin-call",
  "feature-updated",
  "level-updated",
  "restriction-data-changed",
  "customer-steps-data-updated",
  "requirement-added",
  "deposit-completed",
  "one-click-created",
  "currency-updated",
  "portfolio.position-changed",
  "portfolio.order-changed",
  "digital-option-instruments.underlying-list-changed",
  ...Object.keys(UNDERLYING_SERVICES).map((service) => `${service}.underlying-list-changed`),
  "marginal-forex.order-modified",
  "marginal-cfd.order-modified",
  "marginal-crypto.order-modified",
  "chat-room-generated",
  "chat-message-generated",
  "chat-typing",
  "chat-message-liked",
  "user-activity.trading-volume-updated",
  // Only asked for once the client has instruments to watch, so its arrival is
  // the signal that the option catalog was accepted.
  "commission-changed",
  "chat.chat-ban-status-changed",
  "chat.chat-moderator-status-changed",
  "promo-codes.promo-code-status-changed",
  "trading-settings.turbo-option-trading-group-params-changed",
  "trading-settings.binary-option-trading-group-params-changed",
  "video-education.webinar-changed",
]);

/**
 * Leverage and trading limits per instrument, in the shape the live feed sends.
 *
 * The client subscribes to `<family>.instruments-list-changed` and never asks
 * for the list, so the snapshot has to arrive on subscription. Until it does,
 * `isActivesReceived()` stays false for every marginal family and the login
 * gate never opens.
 */
function instrumentsList(service) {
  const actives = UNDERLYING_SERVICES[service]?.() ?? [];
  return {
    dynamic_leverage_profiles: [
      { id: 1, min_leverage: 1, items: [{ equity: 0, leverage: 20 }] },
    ],
    items: actives.map((active) => ({
      active_id: active.id,
      user_group_id: 1,
      expiration_size: 0,
      expiration_time: 0,
      dead_time: 0,
      default_leverage: 20,
      leverage_profile: 1,
      allow_long_position: true,
      allow_short_position: true,
      is_suspended: false,
      event_index: 0,
      lot_size: 1,
      markups: [{ policy: "RELATIVE_PIPS", value: "0.4" }],
      markup: "0.4",
      stop_levels: { tp: 0, sl: 0 },
      commission: { open_fixed: 0, open_percent: 0 },
    })),
  };
}

/** Subscription name -> how to start it. */
export const STREAMS = {
  // One entry per instrument family; each answers with its snapshot at once.
  ...Object.fromEntries(
    Object.keys(UNDERLYING_SERVICES).map((service) => [
      `${service}.instruments-list-changed`,
      () => {
        /*
         * Silent until something actually changes.
         *
         * Answering the subscription with a snapshot looked harmless, but a
         * recording of the live feed never sends this frame during boot: the
         * leverage data arrives only as the reply to `get-instruments-list`,
         * and the instrument descriptors only as the reply to
         * `get-underlying-list`. Pushing a snapshot here delivered the leverage
         * shape before the client had even asked for the underlyings.
         */
        return () => {};
      },
    ]),
  ),

  "candle-generated": (filters, { feed, send }) => {
    const activeId = Number(filters?.active_id);
    const size = Number(filters?.size);
    if (!activeById(activeId) || !Number.isFinite(size) || size <= 0) return null;

    const off = feed.watchCandles(activeId, size);
    const onCandle = (candle) => {
      if (candle.active_id !== activeId || candle.size !== size) return;
      send({ name: "candle-generated", msg: candle });
    };
    feed.on("candle", onCandle);
    return () => {
      feed.off("candle", onCandle);
      off();
    };
  },

  /**
   * Every series of one instrument at once, filtered by `active_id` alone.
   *
   * This is what `AssetQuotesProvider::Private::subscribeAllCandles` opens, and
   * despite the name it is not a candle frame. `onAllCurrentCandlesReceived`
   * reads a quote — `active_id`, `at`, `value`, `bid`, `ask` and a `phase` —
   * and takes the candles from a `candles` object keyed by size, all in one
   * message. Sending a stream of single candles instead gets the frame
   * rejected as an "Improper candles-generated event".
   */
  "candles-generated": (filters, { feed, send }) => {
    const activeId = Number(filters?.active_id);
    const active = activeById(activeId);
    if (!active) return null;

    // One frame a second carries every series, so there is no need to watch
    // each size separately or to rate limit per series.
    const timer = setInterval(() => {
      const now = feed.now();
      const value = priceAt(active, now);
      const spread = halfSpread(active);
      const candles = {};
      for (const size of CANDLE_SIZES) {
        const [candle] = feed.history(activeId, size, 1, now);
        if (candle) candles[String(size)] = candle;
      }
      send({
        name: "candles-generated",
        msg: {
          active_id: activeId,
          at: now * 1_000_000_000,
          value,
          bid: round(value - spread, active.precision),
          ask: round(value + spread, active.precision),
          phase: "T",
          candles,
        },
      });
    }, 1_000);

    return () => clearInterval(timer);
  },

  /** Rate updates for one currency pair, once a second. */
  "exchange-rates.exchange-rate-generated": (filters, { feed, send }) => {
    const timer = setInterval(() => {
      send({ name: "exchange-rates.exchange-rate-generated", msg: exchangeRate(filters, feed) });
    }, 1_000);
    return () => clearInterval(timer);
  },

  /**
   * The running numbers for the deals `subscribe-positions` asked about.
   *
   * Every event carries the `subscription_id` it belongs to; without it the
   * client rejects the frame with "Missing mandatory attribute".
   */
  "positions-state": (_filters, { feed, account, send }) => {
    const timer = setInterval(() => {
      const subscriptions = account.positionSubscriptions;
      if (!subscriptions?.size) return;
      const open = openPositions(account);
      for (const [id, ids] of subscriptions) {
        const positions = open
          .filter((position) => ids.includes(String(position.external_id)))
          .map((position) => positionState(position, feed));
        if (positions.length) {
          /*
           * `F2::services::PositionsStateDTO` takes four mandatory attributes:
           * `subscription_id`, `user_id`, `expires_in` and `positions`. The
           * first three sit on the frame, not on the entries.
           */
          send({
            name: "positions-state",
            msg: {
              subscription_id: id,
              user_id: account.userId,
              expires_in: STATE_TTL_SECONDS,
              positions,
            },
          });
        }
      }
    }, 1_000);
    return () => clearInterval(timer);
  },

  "quote-generated": (filters, { feed, send }) => {
    const activeId = Number(filters?.active_id);
    if (!activeById(activeId)) return null;

    const off = feed.watchQuotes(activeId);
    const onQuote = (quote) => {
      if (quote.active_id !== activeId) return;
      send({ name: "quote-generated", msg: quote });
    };
    feed.on("quote", onQuote);
    return () => {
      feed.off("quote", onQuote);
      off();
    };
  },
};
