/**
 * Candle history and the live series on top of it.
 *
 * `CandleFeed` owns one (active, size) series: it pulls history once, then
 * folds `candle-generated` events into the tail. If the feed is quiet it falls
 * back to aggregating `quote-generated` ticks into the open bucket, so the last
 * candle keeps breathing the way the WASM chart's does.
 */

import type { AvalonClient } from "./client";
import { candleFilter, quoteFilter, type GetCandlesBody } from "./protocol";
import type { Candle, CandleSize, Quote, WireCandle } from "./types";

/** The feed caps a single `get-candles` window; page larger histories. */
export const MAX_CANDLES_PER_REQUEST = 1_000;

export function toCandle(wire: WireCandle): Candle {
  return {
    t: wire.from,
    o: wire.open,
    h: wire.max,
    l: wire.min,
    c: wire.close,
    v: wire.volume ?? 0,
    open: wire.phase === "T",
  };
}

/** Start of the bucket a timestamp falls into, unix seconds. */
export function bucketStart(timeSeconds: number, size: CandleSize): number {
  return Math.floor(timeSeconds / size) * size;
}

export interface FetchCandlesParams {
  activeId: number;
  size: CandleSize;
  count: number;
  /** Right edge of the window, unix seconds. Defaults to the server's now. */
  to?: number;
}

/** One history page, oldest first. */
export async function fetchCandles(
  client: AvalonClient,
  { activeId, size, count, to }: FetchCandlesParams,
): Promise<Candle[]> {
  const body: GetCandlesBody = {
    active_id: activeId,
    size,
    to: to ?? Math.floor(client.now() / 1000),
    count: Math.min(count, MAX_CANDLES_PER_REQUEST),
  };
  const msg = await client.rpc<{ candles?: WireCandle[] }>("get-candles", "2.0", body);
  const candles = (msg.candles ?? []).map(toCandle);
  candles.sort((a, b) => a.t - b.t);
  return candles;
}

/** Walks back through as many pages as `count` needs. */
export async function fetchCandleHistory(
  client: AvalonClient,
  { activeId, size, count, to }: FetchCandlesParams,
): Promise<Candle[]> {
  const out: Candle[] = [];
  let cursor = to ?? Math.floor(client.now() / 1000);

  while (out.length < count) {
    const page = await fetchCandles(client, {
      activeId,
      size,
      to: cursor,
      count: Math.min(count - out.length, MAX_CANDLES_PER_REQUEST),
    });
    if (page.length === 0) break;
    out.unshift(...page);
    cursor = page[0].t - size;
  }

  return out;
}

export interface CandleFeedOptions {
  activeId: number;
  size: CandleSize;
  /** How many candles to keep in memory. */
  capacity?: number;
  /** Fold `quote-generated` ticks into the open bucket. */
  useQuotes?: boolean;
}

type FeedListener = (candles: readonly Candle[]) => void;

export class CandleFeed {
  private readonly client: AvalonClient;
  private readonly activeId: number;
  private readonly size: CandleSize;
  private readonly capacity: number;
  private readonly useQuotes: boolean;

  private candles: Candle[] = [];
  private lastQuote: Quote | null = null;
  private readonly listeners = new Set<FeedListener>();
  private readonly teardown: Array<() => void> = [];

  constructor(client: AvalonClient, options: CandleFeedOptions) {
    this.client = client;
    this.activeId = options.activeId;
    this.size = options.size;
    this.capacity = options.capacity ?? 1_000;
    this.useQuotes = options.useQuotes ?? true;
  }

  getCandles(): readonly Candle[] {
    return this.candles;
  }

  getLastQuote(): Quote | null {
    return this.lastQuote;
  }

  subscribe(listener: FeedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Loads history, then opens the live streams. */
  async start(historyCount = 200): Promise<void> {
    this.candles = await fetchCandleHistory(this.client, {
      activeId: this.activeId,
      size: this.size,
      count: historyCount,
    });
    this.emit();

    this.teardown.push(
      this.client.subscribe<WireCandle>(
        "candle-generated",
        candleFilter(this.activeId, this.size),
        (wire) => this.applyCandle(toCandle(wire)),
      ),
    );

    if (this.useQuotes) {
      this.teardown.push(
        this.client.subscribe<RawQuote>("quote-generated", quoteFilter(this.activeId), (raw) =>
          this.applyQuote(raw),
        ),
      );
    }
  }

  stop(): void {
    for (const off of this.teardown.splice(0)) off();
    this.listeners.clear();
  }

  /** Prepends an older page, for panning left past the loaded window. */
  async loadOlder(count = 200): Promise<number> {
    const oldest = this.candles[0];
    if (!oldest) return 0;
    const page = await fetchCandleHistory(this.client, {
      activeId: this.activeId,
      size: this.size,
      count,
      to: oldest.t - this.size,
    });
    if (page.length === 0) return 0;
    this.candles = [...page, ...this.candles];
    this.emit();
    return page.length;
  }

  private applyCandle(candle: Candle): void {
    const last = this.candles[this.candles.length - 1];
    if (last && candle.t === last.t) {
      this.candles[this.candles.length - 1] = candle;
    } else if (!last || candle.t > last.t) {
      this.candles.push(candle);
      if (this.candles.length > this.capacity) {
        this.candles.splice(0, this.candles.length - this.capacity);
      }
    } else {
      // A late correction for a bucket already behind the tail.
      const index = this.candles.findIndex((item) => item.t === candle.t);
      if (index === -1) return;
      this.candles[index] = candle;
    }
    this.emit();
  }

  private applyQuote(raw: RawQuote): void {
    const quote: Quote = {
      activeId: raw.active_id,
      time: raw.time ?? raw.at ?? Date.now() / 1000,
      value: raw.value,
      ask: raw.ask ?? raw.value,
      bid: raw.bid ?? raw.value,
    };
    this.lastQuote = quote;

    const t = bucketStart(quote.time, this.size);
    const last = this.candles[this.candles.length - 1];

    if (last && last.t === t) {
      // Only widen the extremes; `candle-generated` stays authoritative on close.
      last.c = quote.value;
      last.h = Math.max(last.h, quote.value);
      last.l = Math.min(last.l, quote.value);
      last.open = true;
    } else if (!last || t > last.t) {
      this.candles.push({ t, o: quote.value, h: quote.value, l: quote.value, c: quote.value, v: 0, open: true });
      if (this.candles.length > this.capacity) {
        this.candles.splice(0, this.candles.length - this.capacity);
      }
    } else {
      return;
    }
    this.emit();
  }

  private emit(): void {
    const snapshot = this.candles;
    for (const listener of [...this.listeners]) listener(snapshot);
  }
}

/** `quote-generated` as it arrives; timestamps vary by instrument family. */
interface RawQuote {
  active_id: number;
  value: number;
  ask?: number;
  bid?: number;
  time?: number;
  at?: number;
}
