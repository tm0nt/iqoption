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
import { priceAt, round } from "./prices.mjs";

let nextId = 7_000_000;

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
 * `enum<F2::IQOptionType>`, whose members are `turbo` and `binary` — not
 * `turbo-option`. A value outside the table reads back as zero, and
 * `DealBinary::isValid()` rejects a position whose instrument is zero, so the
 * portfolio drops it with "Bad binary received."
 *
 * The subscription filter spells the same family `turbo-option`, but that is
 * the server's routing vocabulary; the payload has to use the enum's.
 */
function instrumentTypeOf(optionTypeId) {
  return Number(optionTypeId) === 1 ? "binary" : "turbo";
}

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

  const position = {
    id: (nextId += 1),
    /*
     * This is what `DealBinary::getId()` reads: the parser stores `external_id`
     * as a 64-bit integer at the offset `isValid()` checks for a non-zero id.
     * A string reads back as zero and the deal is rejected.
     */
    external_id: nextId,
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
    closed.push(position);
  }

  return closed;
}

/**
 * A running deal's live numbers, for the `positions-state` stream.
 *
 * The shape is `F2::services::json_io<...TickingPortfolioDeal>`: `id`,
 * `expected_profit`, `pnl`, `pnl_net` and `current_price` are mandatory, and
 * every money field is a `qcalc::BigDecimal`, which travels as a string the way
 * `markup` and `min_qty` do elsewhere in this protocol. `id` is a string too.
 */
export function positionState(position, feed) {
  const active = activeById(position.active_id);
  const quote = priceAt(active, feed.now());
  const moved = quote - position.open_quote;
  const winning = position.direction === "call" ? moved > 0 : moved < 0;
  const payout = winning ? round(position.invest * (position.profit_percent / 100), 2) : -position.invest;

  return {
    id: String(position.external_id),
    instrument_type: position.instrument_type,
    expected_profit: String(winning ? round(position.invest + payout, 2) : 0),
    pnl: String(payout),
    pnl_net: String(payout),
    sell_profit: "0",
    open_price: position.open_quote,
    current_price: quote,
    quote_timestamp: Math.floor(feed.now()),
  };
}

/** The positions still running, newest first, as the portfolio lists them. */
export function openPositions(account) {
  return (account.positions ?? []).filter((position) => !position.closed).reverse();
}
