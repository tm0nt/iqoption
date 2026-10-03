/**
 * Domain types for the Avalon (Quadcode) market data feed.
 *
 * Field names mirror the wire format so a payload can be narrowed with a cast
 * instead of a mapping layer; `toCandle()` in `candles.ts` converts to the
 * compact `Candle` the renderer uses.
 */

/** Candle sizes the feed accepts, in seconds. */
export const CANDLE_SIZES = [
  1, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 14400, 86400,
] as const;

export type CandleSize = (typeof CANDLE_SIZES)[number];

export function isCandleSize(value: number): value is CandleSize {
  return (CANDLE_SIZES as readonly number[]).includes(value);
}

/** A candle as it comes off the wire. */
export interface WireCandle {
  id?: number;
  /** Bucket start, unix seconds. */
  from: number;
  /** Bucket end, unix seconds. */
  to: number;
  /** Timestamp of the last tick folded into the bucket, unix seconds. */
  at?: number;
  open: number;
  close: number;
  /** Low. */
  min: number;
  /** High. */
  max: number;
  volume?: number;
  active_id?: number;
  size?: number;
  /** "T" while the bucket is still open. */
  phase?: string;
}

/** A candle in the shape the chart renderer consumes. */
export interface Candle {
  /** Bucket start, unix seconds. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  /** True while the bucket is still accumulating ticks. */
  open: boolean;
}

/** A single price tick. */
export interface Quote {
  activeId: number;
  /** Unix seconds, fractional. */
  time: number;
  value: number;
  ask: number;
  bid: number;
}

/** A tradable instrument from the initialization payload. */
export interface Active {
  id: number;
  /** e.g. "EURUSD", "BTCUSD". */
  ticker: string;
  name: string;
  /** Price decimals, used to format the axis and the price pill. */
  precision: number;
  enabled: boolean;
  /** Payout in percent for binary/turbo options, when the feed reports one. */
  profit?: number;
  image?: string;
}

/** The subset of the `profile` payload worth surfacing. */
export interface Profile {
  userId: number;
  name: string;
  currency: string;
  balanceId: number;
  balance: number;
  balances: Array<{
    id: number;
    type: number;
    amount: number;
    currency: string;
  }>;
}
