/*
 * One instrument as the deal panel and the portfolio describe it.
 *
 * It lives apart from the router because a position carries the descriptor
 * inline, and the router already depends on the position book.
 */
import { groupIdFor } from "../market/actives.mjs";

export function optionActive(active) {
  const commission = 100 - active.profit;
  return {
    id: active.id,
    name: active.ticker,
    ticker: active.ticker,
    description: active.name,
    group_name: active.ticker,
    image: active.image,
    // Mirrors the fields a recorded `active` frame carries. `is_visible`,
    // `is_paused` and the `time_from`/`time_to` pair decide whether the
    // instrument can be picked at all; equal times mean around the clock, and
    // `expiration_days` opens it on all seven.
    is_visible: active.isVisible,
    is_paused: active.isPaused,
    is_otc: active.isOtc,
    active_group_id: groupIdFor(active),
    priority: active.priority,
    precision: active.precision,
    pip_scale: active.pipScale,
    spread_plus: active.spreadPlus,
    spread_minus: active.spreadMinus,
    time_from: active.timeFrom,
    time_to: active.timeTo,
    expiration_days: active.expirationDays,
    start_time: 0,
    exchange: active.exchange,
    type: active.kind,
    currency_left_side: active.currencyLeft,
    currency_right_side: active.currencyRight,
    min_qty: active.minQty,
    qty_step: active.qtyStep,
    enabled: true,
    is_suspended: active.isSuspended,
    deadtime: active.deadtime,
    option: {
      profit: { commission },
      count: 2,
      exp: active.expirations,
      special: {},
    },
    profit: { commission },
    schedule: [],
    group_id: active.groupId,
  };
}
