/**
 * Real prices, from Binance.
 *
 * The rest of the server reads a price with `priceAt(asset, seconds)` and a bar
 * with `candleAt(...)`, both **synchronous** — they are called once per candle
 * while answering a request, and making them async would turn the whole router
 * inside out. So this module keeps the data in memory and the network out of
 * the request path: three REST calls per instrument at boot, then a WebSocket
 * that keeps the newest end fresh.
 *
 * Three resolutions are held per instrument, each a thousand buckets, because
 * one is never enough on its own:
 *
 *   1s   the last ~16 minutes   — what a five-second chart is drawn from
 *   1m   the last ~17 hours     — the working range of most timeframes
 *   1h   the last ~41 days      — deep enough for the history the client asks
 *
 * A read picks the finest series that covers the instant asked for. That is why
 * a one-second candle from last week comes back flat: the hour bar is all there
 * is that far back, and inventing detail would be a lie the chart would draw.
 *
 * An instrument whose feed never arrived is reported as not ready, and the
 * caller falls back to the deterministic curve rather than serving zeros.
 */
import { round } from "./prices.mjs";

const REST = "https://api.binance.com/api/v3/klines";
const STREAM = "wss://stream.binance.com:9443/stream";
const LIMIT = 1000;

/** Finest first. The seconds each Binance interval covers. */
const SERIES = [
  { interval: "1s", seconds: 1 },
  { interval: "1m", seconds: 60 },
  { interval: "1h", seconds: 3600 },
];

/**
 * @typedef {object} Bar
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} volume
 */

/** symbol -> { bars: Map<interval, Map<bucketStart, Bar>>, last: number } */
const books = new Map();

let socket = null;
let reconnectTimer = null;
/** Set by `disconnect()` so a close in flight does not schedule a reconnect. */
let closing = false;
let log = () => {};

function bookOf(symbol) {
  let book = books.get(symbol);
  if (!book) {
    book = { bars: new Map(SERIES.map((s) => [s.seconds, new Map()])), last: 0, lastAt: 0 };
    books.set(symbol, book);
  }
  return book;
}

/** True once an instrument has prices to serve. */
export function isReady(asset) {
  const book = books.get(asset.sourceSymbol);
  return Boolean(book && book.last > 0);
}

async function fetchSeries(symbol, interval, seconds) {
  const url = `${REST}?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${LIMIT}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`${symbol} ${interval}: HTTP ${response.status}`);

  const rows = await response.json();
  const book = bookOf(symbol);
  const series = book.bars.get(seconds);

  for (const row of rows) {
    // [openTime(ms), open, high, low, close, volume, closeTime, ...]
    const bucket = Math.floor(Number(row[0]) / 1000);
    series.set(bucket, {
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    });
  }

  const newest = rows[rows.length - 1];
  if (newest && Number(newest[4]) > 0) {
    const at = Math.floor(Number(newest[0]) / 1000);
    if (at >= book.lastAt) {
      book.last = Number(newest[4]);
      book.lastAt = at;
    }
  }
  return rows.length;
}

/**
 * Fills the three series for every Binance-sourced instrument.
 *
 * Failures are reported and survived: an instrument without a feed falls back
 * to the deterministic curve, which is better than a platform that will not
 * start because an exchange is unreachable.
 *
 * @returns {Promise<{ready: string[], failed: string[]}>}
 */
export async function warmUp(assets, logger = () => {}) {
  log = logger;
  const wanted = assets.filter((asset) => asset.source === "BINANCE" && asset.sourceSymbol);
  const ready = [];
  const failed = [];

  await Promise.all(
    wanted.map(async (asset) => {
      try {
        for (const { interval, seconds } of SERIES) {
          await fetchSeries(asset.sourceSymbol, interval, seconds);
        }
        ready.push(asset.ticker);
      } catch (error) {
        failed.push(`${asset.ticker} (${error.message})`);
      }
    }),
  );

  return { ready, failed };
}

/**
 * Opens the combined stream that keeps the newest end of each series current.
 *
 * One socket carries every instrument; Binance closes a combined stream after
 * 24 hours, and an unannounced drop is normal, so a close always schedules a
 * reconnect rather than being treated as an error.
 */
export function connect(assets, WebSocketImpl, logger = () => {}) {
  log = logger;
  const symbols = assets
    .filter((asset) => asset.source === "BINANCE" && asset.sourceSymbol)
    .map((asset) => asset.sourceSymbol.toLowerCase());
  if (!symbols.length) return;
  closing = false;

  const url = `${STREAM}?streams=${symbols.map((s) => `${s}@kline_1s`).join("/")}`;

  const open = () => {
    /*
     * The instance, not the module's `socket`, for the same reason the Twelve
     * Data stream holds one: `/reload` disconnects and reconnects, and the old
     * socket's `close` arrives after `disconnect()` has already cancelled the
     * reconnect it then schedules. There the shared variable produced a crash;
     * here it only leaked a socket per reload, each one still writing the same
     * bars into the same books. Quiet rather than harmless.
     */
    const ws = new WebSocketImpl(url);
    socket = ws;
    const retired = () => closing || socket !== ws;

    ws.on("open", () => {
      if (retired()) {
        ws.close();
        return;
      }
      log(`binance: streaming ${symbols.length} instruments`);
    });

    ws.on("message", (raw) => {
      let frame;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const kline = frame?.data?.k;
      if (!kline) return;

      const book = bookOf(String(frame.data.s));
      const bucket = Math.floor(Number(kline.t) / 1000);
      const close = Number(kline.c);

      // Written on every tick, not only on a closed bucket: the bar still open
      // is what the live chart draws, and waiting for `x` would freeze it for a
      // whole second at a time.
      book.bars.get(1).set(bucket, {
        open: Number(kline.o),
        high: Number(kline.h),
        low: Number(kline.l),
        close,
        volume: Number(kline.v),
      });
      book.last = close;
      book.lastAt = bucket;

      // The coarser series' newest bucket has to follow too, or a minute chart
      // lags a minute behind the price beside it.
      for (const { seconds } of SERIES.slice(1)) {
        const coarse = book.bars.get(seconds);
        const start = Math.floor(bucket / seconds) * seconds;
        const existing = coarse.get(start);
        if (!existing) {
          coarse.set(start, { open: close, high: close, low: close, close, volume: 0 });
        } else {
          existing.close = close;
          if (close > existing.high) existing.high = close;
          if (close < existing.low) existing.low = close;
        }
      }

      trim(book);
    });

    ws.on("close", () => {
      if (retired()) return;
      log("binance: stream closed, reconnecting in 5s");
      reconnectTimer = setTimeout(open, 5_000);
    });

    ws.on("error", (error) => log(`binance: ${error.message}`));
  };

  open();
}

/** Keeps each series near its thousand buckets, oldest dropped first. */
function trim(book) {
  for (const [seconds, series] of book.bars) {
    if (series.size <= LIMIT * 1.5) continue;
    const cutoff = [...series.keys()].sort((a, b) => a - b)[series.size - LIMIT];
    for (const key of series.keys()) if (key < cutoff) series.delete(key);
    void seconds;
  }
}

export function disconnect() {
  closing = true;
  clearTimeout(reconnectTimer);
  if (socket) socket.close();
  socket = null;
}

/** The finest series that actually has a bar covering this instant. */
function barAt(book, timeSeconds) {
  for (const { seconds } of SERIES) {
    const series = book.bars.get(seconds);
    const start = Math.floor(timeSeconds / seconds) * seconds;
    const bar = series.get(start);
    if (bar) return bar;
  }
  return null;
}

/**
 * Mid price at an instant.
 *
 * @returns {number|null} null when nothing covers it, so the caller can fall
 *   back rather than serve a zero.
 */
export function priceAt(asset, timeSeconds) {
  const book = books.get(asset.sourceSymbol);
  if (!book) return null;

  const bar = barAt(book, timeSeconds);
  if (bar) return round(bar.close, asset.precision);
  // Ahead of the newest bucket — the live price is the best answer there is.
  return book.last > 0 ? round(book.last, asset.precision) : null;
}

/**
 * OHLC for one bucket, aggregated from the finest series that covers it.
 *
 * @returns {{open,close,min,max,volume}|null}
 */
export function candleAt(asset, from, size) {
  const book = books.get(asset.sourceSymbol);
  if (!book) return null;

  // The finest series whose bars divide this bucket and that holds any of it.
  for (const { seconds } of SERIES) {
    if (seconds > size) continue;
    const series = book.bars.get(seconds);
    let open = null;
    let close = null;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    for (let at = from; at < from + size; at += seconds) {
      const bar = series.get(at);
      if (!bar) continue;
      if (open === null) open = bar.open;
      close = bar.close;
      if (bar.high > high) high = bar.high;
      if (bar.low < low) low = bar.low;
      volume += bar.volume;
    }

    if (open === null) continue;
    return {
      open: round(open, asset.precision),
      close: round(close, asset.precision),
      min: round(low, asset.precision),
      max: round(high, asset.precision),
      volume: Math.round(volume),
    };
  }

  return null;
}
