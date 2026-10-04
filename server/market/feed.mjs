/**
 * Turns the price curve into the two streams a chart needs: ticks and candles.
 *
 * Only series somebody is watching are computed. Subscriptions are reference
 * counted, so twenty clients on EURUSD/1m cost one series, and a series stops
 * being evaluated the moment the last watcher leaves.
 */

import { EventEmitter } from "node:events";
import { activeById } from "./actives.mjs";
import { bucketStart, candleAt, halfSpread, liveCandle, priceAt, round } from "./prices.mjs";

/** How often the curve is sampled for live output. */
const DEFAULT_TICK_MS = 200;

export class MarketFeed extends EventEmitter {
  /** @param {{ tickIntervalMs?: number }} [options] */
  constructor(options = {}) {
    super();
    this.tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_MS;
    this.timer = null;
    /** activeId -> watcher count */
    this.quoteWatchers = new Map();
    /** `${activeId}:${size}` -> { activeId, size, watchers, openBucket } */
    this.candleSeries = new Map();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
    // Node should be free to exit while only the simulator is pending.
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Server clock, unix seconds with millisecond resolution. */
  now() {
    return Date.now() / 1000;
  }

  /** @returns {() => void} the matching unsubscribe */
  watchQuotes(activeId) {
    this.quoteWatchers.set(activeId, (this.quoteWatchers.get(activeId) ?? 0) + 1);
    return () => {
      const next = (this.quoteWatchers.get(activeId) ?? 1) - 1;
      if (next <= 0) this.quoteWatchers.delete(activeId);
      else this.quoteWatchers.set(activeId, next);
    };
  }

  /** @returns {() => void} the matching unsubscribe */
  watchCandles(activeId, size) {
    const key = `${activeId}:${size}`;
    const series = this.candleSeries.get(key) ?? {
      activeId,
      size,
      watchers: 0,
      openBucket: bucketStart(this.now(), size),
    };
    series.watchers += 1;
    this.candleSeries.set(key, series);
    return () => {
      series.watchers -= 1;
      if (series.watchers <= 0) this.candleSeries.delete(key);
    };
  }

  /**
   * Closed history ending at `to`, oldest first. The bucket containing `to` is
   * included and marked open, matching what the live stream is emitting.
   */
  history(activeId, size, count, to = this.now()) {
    const active = activeById(activeId);
    if (!active) return [];

    const newest = bucketStart(to, size);
    const out = [];
    for (let i = count - 1; i >= 0; i -= 1) {
      const from = newest - i * size;
      const isOpen = from + size > this.now();
      // History is the narrow shape: no `active_id`, `size`, `at`, `ask`, `bid`
      // or `phase`. Those belong to the live stream, not to a stored bar.
      out.push(candleAt(active, from, size, isOpen ? this.now() : undefined));
    }
    return out;
  }

  quote(activeId) {
    const active = activeById(activeId);
    if (!active) return null;
    const time = this.now();
    const value = priceAt(active, time);
    const spread = halfSpread(active);
    return {
      active_id: activeId,
      time,
      value,
      ask: round(value + spread, active.precision + 2),
      bid: round(value - spread, active.precision + 2),
      phase: "T",
    };
  }

  tick() {
    const time = this.now();

    for (const activeId of this.quoteWatchers.keys()) {
      const quote = this.quote(activeId);
      if (quote) this.emit("quote", quote);
    }

    for (const series of this.candleSeries.values()) {
      const active = activeById(series.activeId);
      if (!active) continue;
      const current = bucketStart(time, series.size);

      // A rollover publishes the finished bucket before opening the next one,
      // so a client never has to infer the close itself.
      if (current > series.openBucket) {
        const closed = candleAt(active, series.openBucket, series.size);
        this.emit("candle", liveCandle(closed, active, series.activeId, series.size, "C", time));
        series.openBucket = current;
      }

      const open = candleAt(active, current, series.size, time);
      this.emit("candle", liveCandle(open, active, series.activeId, series.size, "T", time));
    }
  }
}
