/*
 * Open binary options and settle them when they expire.
 *
 * The field set is `F2::DealBinary::parseAsPortfolioResponse`'s: the client
 * reads `status`, `open`, `closed`, `user_balance_id`, `external_id`,
 * `active_id`, `instrument_type`, `option_type_id`, `invest`, `profit_percent`,
 * `expiration_time`, `expiration_size`, `result`, `open_time`, `open_quote`,
 * `close_quote`, `close_reason`, `direction`, `currency`, `close_profit`,
 * `invest_enrolled`, `option_type`, `buyback_state` and `profit_amount` off
 * each entry, and `parsePositionsResponse` wraps the list in
 * `{positions, total, limit}`.
 */
import { activeById } from "./actives.mjs";
import { optionActive } from "../protocol/active.mjs";
import { closePosition, savePosition, takePositionId } from "./position-store.mjs";
import { priceAt, round } from "./prices.mjs";

/** A binary option expires on a boundary, not a fixed span from now. */
function expiryAfter(now, size) {
  // The deal panel will not sell an option that expires within its deadtime,
  // so the first reachable boundary is the one at least a few seconds out.
  return Math.ceil((now + 5) / size) * size;
}

/**
 * The instrument family an option belongs to, from the id the panel sends.
 *
 * `instrument_type` and `option_type` are both read through
 * `enum<F2::IQOptionType>`, whose members are bare — `turbo`, not
 * `turbo-option`. A value outside the table reads back as zero, and
 * `DealBinary::isValid()` rejects a position whose instrument is zero, so the
 * portfolio drops it with "Bad binary received."
 *
 * The ids are the live panel's: a recorded `open-option` for a five-second deal
 * carries `option_type_id: 12`, and its events come back as `blitz`.
 */
const OPTION_TYPES = { 1: "binary", 3: "turbo", 12: "blitz" };

function instrumentTypeOf(optionTypeId) {
  return OPTION_TYPES[Number(optionTypeId)] ?? "turbo";
}

/**
 * The same family as the portfolio spells it, with the `-option` suffix.
 *
 * The two vocabularies coexist and are not interchangeable. A recorded
 * `position-changed` carries `instrument_type: "blitz-option"` at the top level
 * while its own `raw_event` says `option_type: "blitz"` — so the portfolio's
 * events use the suffixed form and the deal enum does not.
 */
export function portfolioTypeOf(optionTypeId) {
  return `${instrumentTypeOf(optionTypeId)}-option`;
}

/** Quotes travel as integers scaled by a million in the deal frames. */
const QUOTE_SCALE = 1_000_000;

/** Every portfolio event carries a version; the client keeps the highest. */
let nextVersion = 45_000_000_000;
let nextEventIndex = 14_000_000_000;

function walletOf(account, balanceId) {
  return (
    account.balances.find((balance) => balance.id === Number(balanceId)) ??
    account.balances.find((balance) => balance.id === account.activeBalanceId)
  );
}

/**
 * Opens an option against the account's wallet.
 *
 * @returns the position, or `{ error }` when it cannot be opened.
 */
export function openOption(account, body, feed) {
  const active = activeById(Number(body?.active_id));
  if (!active) return { error: `unknown active_id ${body?.active_id}` };

  const wallet = walletOf(account, body?.user_balance_id);
  const invest = Number(body?.price) || 0;
  if (invest <= 0) return { error: `invalid stake ${body?.price}` };
  if (wallet.amount < invest) return { error: "not enough funds" };

  /*
   * Whole seconds: `feed.now()` carries milliseconds as a fraction, and the
   * client reads these through `getInteger`, which has no use for one. A
   * fractional `open_time` leaves `DealBinary::isValid()` looking at a time it
   * cannot read and the portfolio drops the deal.
   */
  const now = Math.floor(feed.now());
  const size = Number(body?.expiration_size) || 60;
  const direction = body?.direction === "put" ? "put" : "call";
  const profitPercent = Number(body?.profit_percent) || active.profit;

  wallet.amount = round(wallet.amount - invest, 2);

  const openedAt = now * 1_000;
  // Allocated from the high-water mark the store read at boot, so a restart
  // does not start handing out ids that already exist.
  const id = takePositionId();
  const position = {
    id,
    /*
     * The broker's own id for the option, which is what `raw_event` reports and
     * what the `option` reply hands back. The portfolio's `id` is a separate,
     * string-shaped identifier.
     */
    option_id: id,
    /*
     * This is what `DealBinary::getId()` reads: the parser stores `external_id`
     * as a 64-bit integer at the offset `isValid()` checks for a non-zero id.
     * A string reads back as zero and the deal is rejected.
     */
    external_id: id,
    user_id: account.userId,
    user_balance_id: wallet.id,
    active_id: active.id,
    instrument_type: instrumentTypeOf(body?.option_type_id),
    option_type: instrumentTypeOf(body?.option_type_id),
    option_type_id: Number(body?.option_type_id) || 3,
    direction,
    status: "open",
    /*
     * These are times, not flags. They sit between `status` and
     * `user_balance_id` in the set `parseAsPortfolioResponse` reads, and
     * `DealBinary::isValid()` wants a real instant there — a `true` reads back
     * as nothing and the portfolio drops the deal.
     */
    open: now,
    closed: 0,
    invest,
    invest_enrolled: invest,
    profit_percent: profitPercent,
    profit_amount: 0,
    close_profit: 0,
    currency: wallet.currency,
    open_time: now,
    open_quote: priceAt(active, now),
    close_quote: 0,
    close_reason: "default",
    expiration_time: expiryAfter(now, size),
    expiration_size: size,
    // `IQDealStatus` while the deal runs; `IQPositionCloseReason` has its own
    // "nothing happened yet" member, which is `default`.
    result: "open",
    buyback_state: "open",
    buyback_time: 0,
    client_platform_id: 190,
    /*
     * Milliseconds. The portfolio's events timestamp in them — `open_time`
     * there is `open_time_millisecond` here — while the deal enum's fields stay
     * in whole seconds.
     */
    open_time_ms: openedAt,
    requested_at: openedAt,
    created_at: openedAt + 1,
    updated_at: openedAt + 1,
    close_time_ms: 0,
    /*
     * `DealBinary::isValid()` rejects a position with a zero id, a zero
     * instrument, an epoch expiry or an empty instrument descriptor, and the
     * portfolio drops anything invalid with "Bad binary received." The
     * remaining fields round out the set `parseAsPortfolioResponse` reads.
     */
    active: optionActive(active),
    raw_event: {},
    params: {},
    amount_multiplier: 1,
    win_enrolled_amount: 0,
    deadtime: 0,
    max_count: 0,
    offset: 0,
  };

  if (!account.positions) account.positions = [];
  account.positions.push(position);
  savePosition(position);
  return position;
}

/**
 * Closes everything whose expiry has passed and pays out the winners.
 *
 * A call wins when the closing quote is above the opening one and a put when it
 * is below; an unchanged quote refunds the stake, which is how the live feed
 * settles a tie.
 *
 * @returns the positions closed by this call.
 */
export function settleDue(account, feed) {
  const now = Math.floor(feed.now());
  const closed = [];

  for (const position of account.positions ?? []) {
    if (position.closed || position.expiration_time > now) continue;

    const active = activeById(position.active_id);
    const quote = priceAt(active, position.expiration_time);
    const moved = quote - position.open_quote;
    const won = position.direction === "call" ? moved > 0 : moved < 0;
    const tied = moved === 0;

    position.close_quote = quote;
    position.open = position.open_time;
    position.closed = position.expiration_time;
    position.close_time_ms = position.expiration_time * 1_000;
    position.updated_at = position.close_time_ms + 36;
    position.close_reason = tied ? "equal" : won ? "win" : "loose";
    position.result = position.close_reason;
    // `status` carries the same `IQDealStatus` member; there is no "closed".
    position.status = position.close_reason;
    position.profit_amount = tied
      ? position.invest
      : won
        ? round(position.invest * (1 + position.profit_percent / 100), 2)
        : 0;
    position.close_profit = round(position.profit_amount - position.invest, 2);

    const wallet = walletOf(account, position.user_balance_id);
    wallet.amount = round(wallet.amount + position.profit_amount, 2);
    closePosition(position);
    closed.push(position);
  }

  return closed;
}

/**
 * A running deal's live numbers, for the `positions-state` stream.
 *
 * The shape is `F2::services::json_io<...TickingPortfolioDeal>`. A recording of
 * the live stream settles two things the build could not: every money field is a
 * plain number — not a `BigDecimal` string, the way `markup` and `min_qty` are
 * elsewhere in this protocol — while `id` alone is a string. A running binary
 * deal reports `expected_profit: 0` and leaves `pnl` at the open stake's
 * distance from zero; `margin` carries the stake and `currency_conversion` is
 * present and zero.
 */
export function positionState(position, feed) {
  const active = activeById(position.active_id);
  const quote = priceAt(active, feed.now());
  const moved = quote - position.open_quote;
  const winning = position.direction === "call" ? moved > 0 : moved < 0;
  const payout = winning ? round(position.invest * (position.profit_percent / 100), 2) : -position.invest;

  return {
    id: String(position.external_id),
    instrument_type: portfolioTypeOf(position.option_type_id),
    sell_profit: 0,
    margin: position.invest,
    current_price: quote,
    quote_timestamp: Math.floor(feed.now()) * 1_000,
    pnl: payout,
    pnl_net: payout,
    open_price: position.open_quote,
    expected_profit: winning ? round(position.invest + payout, 2) : 0,
    currency_conversion: 0,
  };
}

/** The positions still running, newest first, as the portfolio lists them. */
export function openPositions(account) {
  return (account.positions ?? []).filter((position) => !position.closed).reverse();
}

/**
 * The settled ones, most recently closed first.
 *
 * Read from the same list rather than from the database: the account's deals
 * were loaded when the session opened, and anything that settled since is
 * already here. The history panel asks for a page at a time, so the limit is
 * applied where it is asked for rather than here.
 */
export function closedPositions(account) {
  return (account.positions ?? [])
    .filter((position) => position.closed)
    .sort((a, b) => b.closed - a.closed);
}

/**
 * A deal as `portfolio.position-changed` announces it.
 *
 * This is not the deal-enum field set that `get-positions` answers with. A
 * recording of the live feed shows the portfolio's event carrying its own
 * normalised numbers at the top level — milliseconds, `pnl`, `invest` — and
 * putting everything specific to a binary option inside
 * `raw_event.binary_options_option_changed1`: the direction, the expiry, the
 * option type id and the currency all live there and nowhere else. Our earlier
 * `raw_event: {}` only worked because those fields were duplicated at the top,
 * which the live feed never does.
 *
 * The open and closed forms are different field sets, not one set with empty
 * slots: a closed deal drops `sell_profit`, `expected_profit`, `current_price`
 * and `quote_timestamp`, and gains `close_*`, `pnl_realized` and `actual_expire`.
 *
 * `profit_percent` inside the event is the whole multiplier — 185 for an 85%
 * payout — while the panel's request sends the 85.
 */
export function portfolioEvent(position) {
  const closed = Boolean(position.closed);
  const payout = position.profit_amount;

  const rawEvent = {
    index: (nextEventIndex += 1),
    option_id: position.option_id,
    user_id: position.user_id,
    balance_id: position.user_balance_id,
    option_type_id: position.option_type_id,
    option_type: instrumentTypeOf(position.option_type_id),
    active_id: position.active_id,
    platform_id: position.client_platform_id,
    profit_percent: 100 + position.profit_percent,
    user_balance_type: 4,
    currency: position.currency,
    direction: position.direction,
    result: closed ? position.result : "opened",
    amount: position.invest,
    enrolled_amount: position.invest_enrolled,
    profit_amount: closed ? payout : null,
    win_enrolled_amount: closed ? payout : null,
    value: position.open_quote,
    expiration_value: closed ? position.close_quote : null,
    open_time: position.open_time,
    open_time_millisecond: position.open_time_ms,
    expiration_time: position.expiration_time,
    expiration_size: position.expiration_size,
    actual_expire: closed ? position.expiration_time : null,
    user_group_id: 270,
    requested_at: position.requested_at,
    created_at: position.created_at,
    updated_at: position.updated_at,
  };

  const common = {
    raw_event: { binary_options_option_changed1: rawEvent },
    version: (nextVersion += 1),
    id: String(position.external_id),
    user_id: position.user_id,
    user_balance_id: position.user_balance_id,
    platform_id: position.client_platform_id,
    // An integer, unlike `id`: the portfolio reads it through `getInteger`, and
    // a string reads back as zero, which `DealBinary::isValid()` rejects.
    external_id: position.external_id,
    active_id: position.active_id,
    instrument_id: String(position.active_id),
    source: "binary-options",
    instrument_type: portfolioTypeOf(position.option_type_id),
    open_time: position.open_time_ms,
    open_quote: position.open_quote,
    invest: position.invest,
    invest_enrolled: position.invest_enrolled,
    swap: 0,
  };

  if (!closed) {
    return {
      ...common,
      status: "open",
      sell_profit: 0,
      sell_profit_enrolled: 0,
      // Mirrors the live feed, which reports the stake here while the deal runs
      // rather than the payout it would pay out.
      expected_profit: position.invest,
      expected_profit_enrolled: position.invest,
      pnl: 0,
      pnl_net: 0,
      current_price: position.open_quote,
      // Milliseconds truncated to the second, which is how the live feed stamps
      // a quote: 1791076852000 beside an `open_time` of 1791076852013.
      quote_timestamp: position.open_time * 1_000,
    };
  }

  // Gross on `close_profit`, net on `pnl`: a 513 stake returning 949.05 reports
  // both, and the client shows the difference.
  const net = round(payout - position.invest, 2);
  return {
    ...common,
    status: "closed",
    close_quote: position.close_quote,
    close_reason: position.close_reason,
    close_time: position.close_time_ms,
    close_profit: payout,
    close_profit_enrolled: payout,
    pnl: net,
    pnl_realized: net,
    pnl_net: net,
  };
}

/**
 * The `option` frame that answers `binary-options.open-option`.
 *
 * Recorded from the live feed, which answers with the broker's own view of the
 * order rather than with the portfolio position: `act` is the instrument,
 * `exp` the expiry in whole seconds, `value` the quote and `exp_value` the same
 * quote scaled by a million, as the request's own `value` is.
 */
export function optionReply(position) {
  return {
    user_id: position.user_id,
    id: position.option_id,
    refund_value: 0,
    price: position.invest,
    exp: position.expiration_time,
    created: position.open_time,
    created_millisecond: position.open_time_ms,
    time_rate: position.open_time,
    type: instrumentTypeOf(position.option_type_id),
    act: position.active_id,
    direction: position.direction,
    exp_value: Math.round(position.open_quote * QUOTE_SCALE),
    value: position.open_quote,
    profit_income: 100 + position.profit_percent,
    profit_return: 0,
    robot_id: null,
    client_platform_id: position.client_platform_id,
  };
}
