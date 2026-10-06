/**
 * Real forex prices, from fastforex.
 *
 * Same contract as `binance.mjs` and `twelvedata.mjs` — `warmUp`, `connect`,
 * `priceAt`, `candleAt`, the last two synchronous and served out of memory,
 * because the router calls them once per candle while answering a request.
 *
 * It exists because Twelve Data's free plan streams **one** symbol, and only
 * EUR/USD, which left four of the five forex pairs drawn from a synthetic
 * curve. Measured against the same five pairs over thirty seconds:
 *
 *   Twelve Data     14 ticks, one pair, mid price only
 *   fastforex     1736 ticks, five pairs, bid and ask
 *
 * Five pairs fit in one connection here, which is the whole difference.
 *
 * What is the same as Twelve Data, and worth not rediscovering: the REST side
 * stops at one minute. The API says so itself — `Options are [P1D, PT1H,
 * PT1M]` — so the one-second series is still this server's own, folded out of
 * the tick stream. That is what makes the five-second timeframe true, since
 * `candleAt` builds a bucket from the finest series whose bars divide it and
 * a minute does not divide five seconds.
 *
 * Three resolutions per instrument, finest first:
 *
 *   1s   ours, from the stream   — what the 5s and 15s charts are drawn from
 *   1m   REST, paged backwards   — the working range of most timeframes
 *   1h   REST, paged backwards   — deep enough for the history the client asks
 */
import { round } from "./prices.mjs";

const REST = "https://api.fastforex.io/fx/ohlc/time-series";
/*
 * The key travels in the query string, which the service requires, and is why
 * no URL in this module is ever logged.
 */
const STREAM = "wss://fastforex.wsdx.io";

/** The most bars one request returns. The API refuses anything above it. */
const PAGE = 100;
/** How many bars each REST series is filled to, by paging backwards. */
const DEPTH = 1_000;
/** ...and the most buckets a series keeps once the stream is running. */
const LIMIT = 1_000;

/** Finest first. `interval` null means this server fills it. */
const SERIES = [
  { interval: null, seconds: 1 },
  { interval: "PT1M", seconds: 60 },
  { interval: "PT1H", seconds: 3_600 },
];

/** symbol -> { bars: Map<seconds, Map<bucketStart, Bar>>, last, lastAt, bid, ask } */
const books = new Map();

let socket = null;
let reconnectTimer = null;
let fillTimer = null;
let refreshTimer = null;
let streaming = false;
/** Set by `disconnect()` so a close in flight does not schedule a reconnect. */
let closing = false;
let log = () => {};

/** Symbols the plan refused, so they are reported rather than left silent. */
const refused = new Set();

function bookOf(symbol) {
  let book = books.get(symbol);
  if (!book) {
    book = { bars: new Map(SERIES.map((s) => [s.seconds, new Map()])), last: 0, lastAt: 0, bid: 0, ask: 0 };
    books.set(symbol, book);
  }
  return book;
}

/**
 * Whether this feed will speak for an instrument at all.
 *
 * A pair the stream refused is served entirely from the curve rather than
 * half from REST and half from the curve: `candleAt` would answer a minute
 * bucket from the feed and a five-second one from the curve, and the chart
 * lets you switch between those two timeframes and compare them. Consistency
 * across timeframes is worth more than realism on one of them.
 */
function serves(symbol) {
  return !refused.has(symbol);
}

/** True once an instrument has prices to serve. */
export function isReady(asset) {
  const book = books.get(asset.sourceSymbol);
  return Boolean(book && book.last > 0 && serves(asset.sourceSymbol));
}

/** Symbols this plan would not stream, for the caller to report honestly. */
export function unavailable() {
  return [...refused];
}

/**
 * The market's own spread, when the stream has quoted one.
 *
 * Every other source here reports a mid price and the platform adds a spread
 * it was configured with. This one delivers both sides, so the spread can be
 * the market's instead of a setting.
 *
 * @returns {{bid: number, ask: number}|null}
 */
export function quoteAt(asset) {
  const book = books.get(asset.sourceSymbol);
  if (!book || !serves(asset.sourceSymbol) || !book.bid || !book.ask) return null;
  return { bid: round(book.bid, asset.precision + 2), ask: round(book.ask, asset.precision + 2) };
}

/**
 * One page of bars.
 *
 * `limit` caps at a hundred, so depth comes from paging backwards with `end`
 * rather than from asking for more. Times are ISO and UTC throughout, which
 * is the one thing about this API that needs no care — unlike the last one,
 * where the default timezone silently moved every bar.
 */
async function fetchPage(symbol, interval, apiKey, end) {
  const url = new URL(REST);
  url.searchParams.set("pair", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(PAGE));
  if (end) url.searchParams.set("end", end);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => null);
  if (body?.error) throw new Error(`${symbol} ${interval}: ${body.error}`);
  if (!response.ok) throw new Error(`${symbol} ${interval}: HTTP ${response.status}`);
  if (!Array.isArray(body?.results)) throw new Error(`${symbol} ${interval}: no results`);
  return body.results;
}

/** Fills one series by paging backwards until it is deep enough. */
async function fetchSeries(symbol, interval, seconds, apiKey, depth = DEPTH, skipFrom = Infinity) {
  const book = bookOf(symbol);
  const series = book.bars.get(seconds);
  let end;
  let fetched = 0;

  while (fetched < depth) {
    /*
     * A refusal part-way through is the end of the series, not a failure of
     * it. Every plan has a depth limit somewhere — this one answers
     * "Historical data limited during trial" past a few hundred hours — and
     * losing the thousand bars already fetched because the thousand-and-first
     * was refused would be the wrong trade. Only an empty first page is a
     * real failure, and that is reported by the caller.
     */
    let rows;
    try {
      rows = await fetchPage(symbol, interval, apiKey, end);
    } catch (error) {
      if (fetched === 0) throw error;
      log(`fastforex: ${symbol} ${interval} stops at ${fetched} bars (${error.message})`);
      break;
    }
    if (rows.length === 0) break;

    for (const row of rows) {
      const at = Math.floor(Date.parse(row.dtm) / 1000);
      if (!Number.isFinite(at)) continue;
      /*
       * A repair must not touch the bar still forming: the vendor's copy of it
       * is a snapshot from whenever the request was served, and writing that
       * over ours would step the live bar backwards until the next tick.
       */
      if (at >= skipFrom) continue;
      series.set(at, { open: row.o, high: row.h, low: row.l, close: row.c, volume: 0 });
    }

    // Results arrive newest first, so the oldest is where the next page ends.
    const oldest = rows.at(-1);
    const newest = rows[0];
    if (newest && !end) {
      const at = Math.floor(Date.parse(newest.dtm) / 1000);
      if (at >= book.lastAt && Number(newest.c) > 0) {
        book.last = Number(newest.c);
        book.lastAt = at;
      }
    }
    fetched += rows.length;
    if (rows.length < PAGE || !oldest) break;
    end = oldest.dtm;
    // Gentle on the quota and on the service; the budget is a million a month.
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return fetched;
}

/**
 * Fills the minute and hour series for every fastforex instrument.
 *
 * Serialised rather than parallel, and failures are survived: an instrument
 * without a feed falls back to the deterministic curve, which is better than a
 * platform that will not start because a data vendor is unreachable.
 *
 * @returns {Promise<{ready: string[], failed: string[]}>}
 */
export async function warmUp(assets, logger = () => {}) {
  log = logger;
  const apiKey = process.env.FASTFOREX_API_KEY;
  const wanted = assets.filter((asset) => asset.source === "FASTFOREX" && asset.sourceSymbol);
  const ready = [];
  const failed = [];

  if (!wanted.length) return { ready, failed };
  if (!apiKey) {
    return { ready, failed: wanted.map((asset) => `${asset.ticker} (no FASTFOREX_API_KEY)`) };
  }

  for (const asset of wanted) {
    /*
     * Each series is tried on its own. One that cannot be filled does not cost
     * the instrument the others: with minute bars and the tick stream an
     * instrument is perfectly usable, and failing it outright for want of the
     * hour series sent all five pairs back to the synthetic curve the first
     * time this ran.
     */
    const problems = [];
    let filled = 0;
    for (const { interval, seconds } of SERIES) {
      if (!interval) continue; // the one-second series is ours to fill
      try {
        const bars = await fetchSeries(asset.sourceSymbol, interval, seconds, apiKey);
        if (bars > 0) filled += 1;
      } catch (error) {
        problems.push(error.message);
      }
    }
    if (filled > 0) {
      ready.push(asset.ticker);
      for (const problem of problems) log(`fastforex: ${problem}`);
    } else {
      failed.push(`${asset.ticker} (${problems.join("; ") || "no bars"})`);
    }
  }

  return { ready, failed };
}

/** Folds one quote into every series. */
function record(symbol, at, bid, ask) {
  const book = bookOf(symbol);
  const price = (bid + ask) / 2;
  book.bid = bid;
  book.ask = ask;

  const second = book.bars.get(1);
  const existing = second.get(at);
  if (!existing) {
    second.set(at, { open: price, high: price, low: price, close: price, volume: 0 });
  } else {
    existing.close = price;
    if (price > existing.high) existing.high = price;
    if (price < existing.low) existing.low = price;
  }

  // The coarser series' newest bucket has to follow too, or a minute chart
  // lags a minute behind the price beside it.
  for (const { seconds } of SERIES.slice(1)) {
    const coarse = book.bars.get(seconds);
    const start = Math.floor(at / seconds) * seconds;
    const bar = coarse.get(start);
    if (!bar) {
      coarse.set(start, { open: price, high: price, low: price, close: price, volume: 0 });
    } else {
      bar.close = price;
      if (price > bar.high) bar.high = price;
      if (price < bar.low) bar.low = price;
    }
  }

  if (at >= book.lastAt) {
    book.last = price;
    book.lastAt = at;
  }
  trim(book);
}

/**
 * Re-reads the recent minute bars, to close holes the stream leaves.
 *
 * REST answers up to the last *complete* minute and the stream begins after
 * it, so the minute the process booted in belongs to neither series and would
 * stay synthetic for the life of the process. This closes that, repairs any
 * gap a dropped stream leaves, and replaces minute bars this server assembled
 * from its own tick sample with the vendor's authoritative ones.
 *
 * Ten minutes, and the arithmetic is the reason: one page per instrument, five
 * instruments, six times an hour is 720 requests a day against a budget of a
 * million a month.
 */
const REFRESH_MS = 10 * 60 * 1_000;

async function refresh(symbols, apiKey) {
  for (const symbol of symbols) {
    if (refused.has(symbol)) continue;
    try {
      const currentMinute = Math.floor(Date.now() / 1000 / 60) * 60;
      await fetchSeries(symbol, "PT1M", 60, apiKey, PAGE, currentMinute);
    } catch (error) {
      log(`fastforex: could not refresh ${symbol}: ${error.message}`);
    }
  }
}

/**
 * Opens the stream and keeps the one-second series continuous.
 *
 * Two things happen here. The socket folds each quote into its bucket; a timer
 * then makes sure the bucket for the current second exists at all. Measured,
 * the five pairs together cover twenty-nine seconds out of thirty, so the
 * filler rarely has work — but a second with no tick is a second in which the
 * price did not move, and recording it flat keeps `candleAt` from falling
 * through to the curve for that bucket.
 *
 * It fills only while the socket is open. A stream that died quietly would
 * otherwise manufacture flat bars for as long as the process lived, and a flat
 * line is indistinguishable from a calm market.
 */
export function connect(assets, WebSocketImpl, logger = () => {}, notify = () => {}) {
  log = logger;
  const apiKey = process.env.FASTFOREX_API_KEY;
  const symbols = assets
    .filter((asset) => asset.source === "FASTFOREX" && asset.sourceSymbol)
    .map((asset) => asset.sourceSymbol);
  if (!symbols.length || !apiKey) return;
  closing = false;

  /*
   * Five pairs per connection is the documented limit and the measured one.
   * Asking for more earns a 429 rather than a partial subscription, so the
   * excess is reported instead of silently dropped.
   */
  const PER_CONNECTION = 5;
  const taken = symbols.slice(0, PER_CONNECTION);
  const over = symbols.slice(PER_CONNECTION);
  for (const symbol of over) refused.add(symbol);
  if (over.length) {
    notify(`fastforex: only ${PER_CONNECTION} pairs per connection — ${over.join(", ")} stay on the curve`);
  }

  const open = () => {
    /*
     * The instance, not the module's `socket`, and every handler below talks
     * to `ws`. The shared variable crashed the feed once: `/reload`
     * disconnects and reconnects, the old socket's close arrives after
     * `disconnect()` cancelled the reconnect it then schedules, and a third
     * socket gets assigned while a second one's `open` is still in flight.
     */
    const ws = new WebSocketImpl(STREAM);
    socket = ws;
    const retired = () => closing || socket !== ws;

    ws.on("open", () => {
      if (retired()) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ op: "auth", key: apiKey }));
    });

    ws.on("message", (raw) => {
      let frame;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (frame.op === "auth") {
        if (frame.status === 200) {
          ws.send(JSON.stringify({ op: "subscribe", stream: "fx", pairs: taken }));
        } else {
          notify(`fastforex: authentication refused (${frame.msg ?? frame.status})`);
        }
        return;
      }

      if (frame.op === "subscribe") {
        streaming = frame.status === 200;
        if (streaming) {
          for (const symbol of taken) refused.delete(symbol);
          log(`fastforex: streaming ${taken.join(", ")}`);
        } else {
          for (const symbol of taken) refused.add(symbol);
          /*
           * Said through `notify`, not `log`: the feed's logger is gated behind
           * AVALON_SERVER_VERBOSE, and "this plan will not carry the
           * instruments you configured" is not debug output.
           */
          notify(`fastforex: subscription refused (${frame.msg ?? frame.status}) — those stay on the curve`);
        }
        return;
      }

      if (frame.op === "price" && frame.sym && Number(frame.bid) > 0 && Number(frame.ask) > 0) {
        // The second of arrival. The vendor's `tsp` is milliseconds and agrees,
        // but arrival is what the one-second buckets are keyed by everywhere
        // else in this server.
        record(String(frame.sym), Math.floor(Date.now() / 1000), Number(frame.bid), Number(frame.ask));
      }
    });

    ws.on("close", () => {
      if (retired()) return;
      streaming = false;
      log("fastforex: stream closed, reconnecting in 5s");
      reconnectTimer = setTimeout(open, 5_000);
    });

    ws.on("error", (error) => log(`fastforex: ${error.message}`));
  };

  open();

  clearInterval(refreshTimer);
  // Once shortly after the stream is up, which closes the boot minute, and
  // then on the interval.
  setTimeout(() => void refresh(taken, apiKey), 90_000);
  refreshTimer = setInterval(() => void refresh(taken, apiKey), REFRESH_MS);

  clearInterval(fillTimer);
  fillTimer = setInterval(() => {
    if (!streaming || socket?.readyState !== 1) return;
    const now = Math.floor(Date.now() / 1000);
    for (const [symbol, book] of books) {
      if (book.last <= 0 || refused.has(symbol)) continue;
      if (!book.bars.get(1).has(now)) record(symbol, now, book.bid, book.ask);
    }
  }, 1_000);
}

/** Keeps each series near its thousand buckets, oldest dropped first. */
function trim(book) {
  for (const series of book.bars.values()) {
    if (series.size <= LIMIT * 1.5) continue;
    const cutoff = [...series.keys()].sort((a, b) => a - b)[series.size - LIMIT];
    for (const key of series.keys()) if (key < cutoff) series.delete(key);
  }
}

export function disconnect() {
  closing = true;
  clearTimeout(reconnectTimer);
  clearInterval(fillTimer);
  clearInterval(refreshTimer);
  streaming = false;
  if (socket) socket.close();
  socket = null;
}

/** The finest series that actually has a bar covering this instant. */
function barAt(book, timeSeconds) {
  for (const { seconds } of SERIES) {
    const start = Math.floor(timeSeconds / seconds) * seconds;
    const bar = book.bars.get(seconds).get(start);
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
  if (!book || !serves(asset.sourceSymbol)) return null;

  const bar = barAt(book, timeSeconds);
  if (bar) return round(bar.close, asset.precision);
  return book.last > 0 ? round(book.last, asset.precision) : null;
}

/**
 * OHLC for one bucket, aggregated from the finest series that covers it.
 *
 * @returns {{open,close,min,max,volume}|null}
 */
export function candleAt(asset, from, size) {
  const book = books.get(asset.sourceSymbol);
  if (!book || !serves(asset.sourceSymbol)) return null;

  for (const { seconds } of SERIES) {
    if (seconds > size) continue;
    const series = book.bars.get(seconds);
    let open = null;
    let close = null;
    let high = -Infinity;
    let low = Infinity;

    for (let at = from; at < from + size; at += seconds) {
      const bar = series.get(at);
      if (!bar) continue;
      if (open === null) open = bar.open;
      close = bar.close;
      if (bar.high > high) high = bar.high;
      if (bar.low < low) low = bar.low;
    }

    if (open === null) continue;
    return {
      open: round(open, asset.precision),
      close: round(close, asset.precision),
      min: round(low, asset.precision),
      max: round(high, asset.precision),
      volume: 0,
    };
  }

  /*
   * The bar at the live edge, in the gap before the filler reaches it. The
   * same claim `priceAt` makes: no tick has arrived since, so the price has
   * not moved. Buckets older than what we hold are left to the curve — those
   * are genuinely unknown.
   */
  if (book.last > 0 && from + size > book.lastAt) {
    const price = round(book.last, asset.precision);
    return { open: price, close: price, min: price, max: price, volume: 0 };
  }

  return null;
}
