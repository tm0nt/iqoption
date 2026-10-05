/**
 * Real forex prices, from Twelve Data.
 *
 * Same contract as `binance.mjs` — `priceAt(asset, seconds)` and
 * `candleAt(asset, from, size)`, both **synchronous**, served out of memory —
 * because the router calls them once per candle while answering a request and
 * making them async would turn it inside out.
 *
 * Where this differs from Binance is the reason it needs explaining.
 *
 * Binance publishes one-second klines, so history and the live tip come from
 * the same place. Twelve Data's REST stops at one minute — the API says so
 * itself, listing its intervals in the error for anything finer — and the plan
 * this runs on allows eight requests a minute and eight hundred a day. Polling
 * cannot build a one-second series out of that: five pairs once a second would
 * be thirteen million calls a month against a budget of eight hundred a day.
 *
 * So the second-by-second series is **ours**. The stream delivers ticks, and
 * every tick is folded into a one-second bucket here, exactly as a broker
 * records its own ticks. That matters for more than tidiness: the chart asks
 * this server for five-second candles, and `candleAt` builds a bucket from the
 * finest series whose bars divide it — so with nothing below a minute, a
 * five-second candle has no real bar to come from and falls back to the
 * synthetic curve. The one-second series is what makes the 5s timeframe true.
 *
 * Three resolutions per instrument, finest first:
 *
 *   1s   ours, from the stream   — what the 5s and 15s charts are drawn from
 *   1m   REST, ~3.5 days         — the working range of most timeframes
 *   1h   REST, ~208 days         — deep enough for the history the client asks
 *
 * A one-second bucket older than this process is not something we can ever
 * have: the data did not exist to be recorded. Those fall back to the curve,
 * which is the same honest degradation `binance.mjs` describes for a
 * one-second candle from last week.
 */
import { round } from "./prices.mjs";

const REST = "https://api.twelvedata.com/time_series";
/*
 * The key travels in the query string, which the service requires, and is why
 * no URL in this module is ever logged. A stream URL in a log file is a
 * credential in a log file.
 */
const STREAM = "wss://ws.twelvedata.com/v1/quotes/price";

/** The most rows one request will return, and the most buckets a series keeps. */
const OUTPUT_SIZE = 5_000;
const LIMIT = 1_000;

/** Finest first, as in binance.mjs. `null` means this server fills it. */
const SERIES = [
  { interval: null, seconds: 1 },
  { interval: "1min", seconds: 60 },
  { interval: "1h", seconds: 3_600 },
];

/** symbol -> { bars: Map<seconds, Map<bucketStart, Bar>>, last, lastAt } */
const books = new Map();

let socket = null;
let reconnectTimer = null;
let fillTimer = null;
let heartbeatTimer = null;
let streaming = false;
let log = () => {};

/** Symbols the plan refused, so they are not reported as merely unlucky. */
const refused = new Set();

function bookOf(symbol) {
  let book = books.get(symbol);
  if (!book) {
    book = { bars: new Map(SERIES.map((s) => [s.seconds, new Map()])), last: 0, lastAt: 0 };
    books.set(symbol, book);
  }
  return book;
}

/**
 * Whether this feed will speak for an instrument at all.
 *
 * REST and the stream do not carry the same pairs. On the free plan every one
 * of EUR/USD, GBP/USD, USD/JPY, AUD/USD and USD/CAD answers over REST at one
 * minute, but only EUR/USD streams — the others are refused even when asked
 * for alone.
 *
 * So a pair could be served with real minute bars and no second bars, and that
 * is the one arrangement worth refusing. `candleAt` would answer a one-minute
 * bucket from the feed and a five-second bucket from the synthetic curve, and
 * the chart lets you switch between those two timeframes and compare them: one
 * instrument would be showing two different markets. Consistency across
 * timeframes is worth more than realism on one of them.
 *
 * A pair the stream refused is therefore served entirely from the curve. The
 * fix is a plan that streams it, after which the same instrument needs no code
 * change — only its source set on the Instruments screen.
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
 * One series, from REST.
 *
 * `timezone=UTC` is not optional. Without it the service answers in some other
 * zone and the bars land hours away from the bucket they belong to — the same
 * class of bug that put every market-server date three hours out until the
 * reads were changed to `UNIX_TIMESTAMP`. Asked for in UTC, parsed as UTC.
 */
async function fetchSeries(symbol, interval, seconds, apiKey, outputSize = OUTPUT_SIZE, skipFrom = Infinity) {
  const url = new URL(REST);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputSize));
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const body = await response.json().catch(() => null);

  /*
   * The service answers 200 with an error body as readily as it answers 4xx,
   * and its messages are the useful kind — "you have run out of API credits
   * for the current minute" names the limit that was hit. Passing it through
   * beats translating it into something vaguer.
   */
  if (body?.status === "error") throw new Error(`${symbol} ${interval}: ${body.message ?? "refused"}`);
  if (!response.ok) throw new Error(`${symbol} ${interval}: HTTP ${response.status}`);
  if (!Array.isArray(body?.values)) throw new Error(`${symbol} ${interval}: no values`);

  const book = bookOf(symbol);
  const series = book.bars.get(seconds);

  for (const row of body.values) {
    const at = Math.floor(Date.parse(`${row.datetime.replace(" ", "T")}Z`) / 1000);
    if (!Number.isFinite(at)) continue;
    /*
     * A repair must not touch the bar still forming. The vendor's copy of it
     * is a snapshot from whenever the request was served, and writing that
     * over ours would step the live minute backwards until the next tick
     * caught it up.
     */
    if (at >= skipFrom) continue;
    series.set(at, {
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      // Forex has no volume on this feed, and a recording of the live platform
      // shows it sending zero for these instruments too.
      volume: 0,
    });
  }

  // `values` arrives newest first.
  const newest = body.values[0];
  if (newest) {
    const at = Math.floor(Date.parse(`${newest.datetime.replace(" ", "T")}Z`) / 1000);
    if (at >= book.lastAt && Number(newest.close) > 0) {
      book.last = Number(newest.close);
      book.lastAt = at;
    }
  }
  return body.values.length;
}

/**
 * Fills the minute and hour series for every Twelve Data instrument.
 *
 * Serialised, not parallel: the plan allows eight requests a minute, and
 * firing a dozen at once spends the whole budget on 429s. Two requests per
 * instrument at a quarter-second apart stays well inside it.
 *
 * Failures are reported and survived — an instrument without a feed falls back
 * to the deterministic curve, which is better than a platform that will not
 * start because a data vendor is unreachable.
 *
 * @returns {Promise<{ready: string[], failed: string[]}>}
 */
export async function warmUp(assets, logger = () => {}) {
  log = logger;
  const apiKey = process.env.TWELVEDATA_API_KEY;
  const wanted = assets.filter((asset) => asset.source === "TWELVEDATA" && asset.sourceSymbol);
  const ready = [];
  const failed = [];

  if (!wanted.length) return { ready, failed };
  if (!apiKey) {
    return { ready, failed: wanted.map((asset) => `${asset.ticker} (no TWELVEDATA_API_KEY)`) };
  }

  for (const asset of wanted) {
    try {
      for (const { interval, seconds } of SERIES) {
        if (!interval) continue; // the one-second series is ours to fill
        await fetchSeries(asset.sourceSymbol, interval, seconds, apiKey);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      ready.push(asset.ticker);
    } catch (error) {
      failed.push(`${asset.ticker} (${error.message})`);
    }
  }

  return { ready, failed };
}

/**
 * Folds one price into every series.
 *
 * Two different instants, deliberately.
 *
 * `at` is the second this server received the tick, and it is what the
 * one-second bucket is keyed by. The vendor's own `timestamp` field cannot be:
 * measured, it is the minute the tick's bar belongs to, not the second the
 * tick happened — three ticks arriving 3, 6 and 8 seconds apart all carried
 * `1791197460`. Keyed by that, a whole minute of ticks lands in one bucket at
 * the minute boundary, the other fifty-nine seconds stay empty, and the
 * five-second candles they should have fed fall through to the curve. That is
 * exactly what happened the first time this ran.
 *
 * `minuteAt` is that vendor timestamp, and it is right for the coarse series,
 * which is what it describes. Deriving the minute from arrival instead would
 * put a tick that crossed a minute boundary in flight — the lag reaches eight
 * seconds — into the next minute's bar.
 */
function record(symbol, at, price, minuteAt = at) {
  const book = bookOf(symbol);

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
    const start = Math.floor(minuteAt / seconds) * seconds;
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
 * Opens the stream and keeps the one-second series continuous.
 *
 * Two things happen here. The socket folds each tick into its bucket; a timer
 * then makes sure the bucket for the current second exists at all.
 *
 * The timer is the part that is easy to leave out and then wonder about.
 * Measured on this plan, EUR/USD ticks about every two seconds — fourteen
 * ticks covered fourteen of thirty seconds. Without the filler, half the
 * one-second buckets are missing, and a bucket that is missing is a bucket
 * `candleAt` cannot use: the five-second candle built from it would be partly
 * real and partly curve. A second in which no tick arrived is a second in
 * which the price did not change, so it is recorded flat at the last price.
 * That is what the market did, not an invention.
 *
 * It fills only while the socket is actually open. A stream that died quietly
 * would otherwise go on manufacturing flat bars for as long as the process
 * lived, and a flat line is indistinguishable from a calm market.
 */
export function connect(assets, WebSocketImpl, logger = () => {}, notify = () => {}) {
  log = logger;
  const apiKey = process.env.TWELVEDATA_API_KEY;
  const symbols = assets
    .filter((asset) => asset.source === "TWELVEDATA" && asset.sourceSymbol)
    .map((asset) => asset.sourceSymbol);
  if (!symbols.length || !apiKey) return;

  const open = () => {
    socket = new WebSocketImpl(`${STREAM}?apikey=${apiKey}`);

    socket.on("open", () => {
      socket.send(JSON.stringify({ action: "subscribe", params: { symbols: symbols.join(",") } }));
      // The service drops an idle connection; its own docs ask for this.
      heartbeatTimer = setInterval(() => {
        if (socket?.readyState === 1) socket.send(JSON.stringify({ action: "heartbeat" }));
      }, 10_000);
    });

    socket.on("message", (raw) => {
      let frame;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (frame.event === "subscribe-status") {
        const ok = (frame.success ?? []).map((entry) => entry.symbol);
        const no = (frame.fails ?? []).map((entry) => entry.symbol);
        streaming = ok.length > 0;
        for (const symbol of no) refused.add(symbol);
        for (const symbol of ok) refused.delete(symbol);
        if (ok.length) log(`twelvedata: streaming ${ok.join(", ")}`);
        /*
         * A refusal is about the plan, not the network. On the free plan every
         * pair but EUR/USD is refused even when asked for alone, so this is
         * said plainly rather than left looking like a flaky connection.
         */
        /*
         * Said through `notify`, not `log`: the feed's logger is gated behind
         * AVALON_SERVER_VERBOSE, and "this plan will not carry the instrument
         * you configured" is not debug output. It is the reason a chart looks
         * synthetic, and an operator should not have to turn a flag on to be
         * told.
         */
        if (no.length) notify(`twelvedata: plan does not carry ${no.join(", ")} — those stay on the curve`);
        return;
      }

      if (frame.event === "price" && frame.symbol && Number(frame.price) > 0) {
        const arrived = Math.floor(Date.now() / 1000);
        const minuteAt = Number(frame.timestamp) || arrived;
        record(String(frame.symbol), arrived, Number(frame.price), minuteAt);
      }
    });

    socket.on("close", () => {
      streaming = false;
      clearInterval(heartbeatTimer);
      log("twelvedata: stream closed, reconnecting in 5s");
      reconnectTimer = setTimeout(open, 5_000);
    });

    socket.on("error", (error) => log(`twelvedata: ${error.message}`));
  };

  open();

  clearInterval(refreshTimer);
  // Once shortly after the stream is up, which is what closes the boot minute,
  // and then on the interval.
  setTimeout(() => void refresh(symbols, apiKey), 90_000);
  refreshTimer = setInterval(() => void refresh(symbols, apiKey), REFRESH_MS);

  clearInterval(fillTimer);
  fillTimer = setInterval(() => {
    if (!streaming || socket?.readyState !== 1) return;
    const now = Math.floor(Date.now() / 1000);
    for (const [symbol, book] of books) {
      if (book.last <= 0 || refused.has(symbol)) continue;
      if (!book.bars.get(1).has(now)) record(symbol, now, book.last);
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

/**
 * Re-reads the recent minute bars, to close holes the stream leaves.
 *
 * Two of them, both measured rather than imagined.
 *
 * The first is at startup. REST answers with bars up to the last *complete*
 * minute, and the stream begins a second or two later, so the minute the
 * process booted in belongs to neither series — and since nothing re-reads it,
 * that minute stays synthetic for as long as the process lives. It showed up
 * as a one-minute chart that was drawn from the curve while the five-second
 * chart beside it was real.
 *
 * The second is any gap the stream leaves behind: a drop, a reconnect, a
 * network pause. Those minutes are gone from the one-second series forever,
 * but the vendor still has them.
 *
 * It earns its keep a third way, which the cross-check against the vendor's
 * own bars turned up. A minute this server assembled from the stream is built
 * from the ticks it happened to receive — a sample, not every trade — so its
 * open, high and low can sit a tenth of a pip off the vendor's own bar for
 * that minute. The refresh replaces ours with theirs, so a minute's history
 * converges on the authoritative version instead of keeping our sample of it.
 *
 * Ten minutes, and the arithmetic is the reason. Each refresh is one request
 * per instrument; the budget on this plan is eight hundred a day. Six an hour
 * is 144 a day for one instrument and 720 for five — inside it either way,
 * with the boot's two requests per instrument to spare. A shorter interval
 * would not survive a fuller catalogue.
 */
const REFRESH_MS = 10 * 60 * 1_000;
/** An hour of minute bars: enough to cover any plausible gap, one credit. */
const REFRESH_BARS = 70;

let refreshTimer = null;

async function refresh(symbols, apiKey) {
  for (const symbol of symbols) {
    if (refused.has(symbol)) continue;
    try {
      // Everything up to, but not including, the minute still being built.
      const currentMinute = Math.floor(Date.now() / 1000 / 60) * 60;
      await fetchSeries(symbol, "1min", 60, apiKey, REFRESH_BARS, currentMinute);
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (error) {
      log(`twelvedata: could not refresh ${symbol}: ${error.message}`);
    }
  }
}

export function disconnect() {
  clearTimeout(reconnectTimer);
  clearInterval(fillTimer);
  clearInterval(refreshTimer);
  clearInterval(heartbeatTimer);
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
  if (!book || !serves(asset.sourceSymbol)) return null;

  // The finest series whose bars divide this bucket and that holds any of it.
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

  return null;
}
