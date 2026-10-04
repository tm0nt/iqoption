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
    image: "",
    // Mirrors the fields a recorded `active` frame carries. `is_visible`,
    // `is_paused` and the `time_from`/`time_to` pair decide whether the
    // instrument can be picked at all; equal times mean around the clock, and
    // `expiration_days` opens it on all seven.
    is_visible: true,
    is_paused: false,
    is_otc: false,
    active_group_id: groupIdFor(active),
    priority: 100,
    precision: active.precision,
    pip_scale: 2,
    spread_plus: 0.4,
    spread_minus: 0.1,
    time_from: "00:00:00",
    time_to: "00:00:00",
    expiration_days: [1, 1, 1, 1, 1, 1, 1],
    start_time: 0,
    exchange: "na",
    type: active.kind,
    currency_left_side: active.ticker,
    currency_right_side: "USD",
    min_qty: 1,
    qty_step: 1,
    enabled: true,
    is_suspended: false,
    deadtime: 2,
    option: {
      profit: { commission },
      count: 2,
      exp: [60, 120, 300],
      special: {},
    },
    profit: { commission },
    schedule: [],
    group_id: 1,
  };
}
