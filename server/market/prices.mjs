/**
 * The price curve every instrument is derived from.
 *
 * It is a pure function of (active, time): `priceAt()` for the same second
 * always returns the same number, on this process or the next. That is what
 * lets history and the live stream come from one source — a client asking for
 * candles from last hour gets exactly the bars it would have seen had it been
 * connected, with no stored series and no drift between the two paths.
 *
 * The shape is fractal brownian motion over interpolated value noise: a few
 * octaves of increasing frequency and halving amplitude, which gives slow
 * trends with believable chop on top instead of white noise.
 */

const OCTAVES = 6;
/** Each octave is this much faster than the one before. */
const LACUNARITY = 2.37;
/** ...and this much quieter. */
const GAIN = 0.5;

/** Deterministic 0..1 from an integer lattice point. */
function hash(seed, index) {
  let h = (seed ^ Math.imul(index, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** Smoothstep-interpolated noise, so the curve has no corners. */
function valueNoise(seed, x) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(seed, i);
  const b = hash(seed, i + 1);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/** @returns {number} roughly -1..1 */
function fbm(seed, x) {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;
  for (let octave = 0; octave < OCTAVES; octave += 1) {
    sum += (valueNoise(seed + octave * 7919, x * frequency) - 0.5) * 2 * amplitude;
    norm += amplitude;
    amplitude *= GAIN;
    frequency *= LACUNARITY;
  }
  return sum / norm;
}

/**
 * Mid price of an instrument at a moment in time.
 *
 * @param {import("./actives.mjs").Active} active
 * @param {number} timeSeconds unix seconds, fractional is fine
 */
export function priceAt(active, timeSeconds) {
  const wave = fbm(active.id * 2654435761, timeSeconds / active.period);
  const price = active.base * (1 + wave * active.volatility);
  return round(price, active.precision);
}

/** Half the bid/ask spread, as a price delta. */
export function halfSpread(active) {
  return round(Math.max(active.base * 0.00004, 10 ** -active.precision), active.precision + 2) / 2;
}

export function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

/**
 * OHLC for one bucket, by sampling the curve across it.
 *
 * `open` is the price at the bucket's first instant and `close` at its last, so
 * consecutive candles join up; the extremes come from the samples in between.
 *
 * @param {import("./actives.mjs").Active} active
 * @param {number} from bucket start, unix seconds
 * @param {number} size bucket length, seconds
 * @param {number} [until] clamp the right edge here, for the bucket still open
 */
export function candleAt(active, from, size, until) {
  const end = Math.min(from + size, until ?? from + size);
  // Enough samples that a wick is not missed, few enough to stay cheap.
  const samples = Math.max(Math.min(Math.round(size / 2), 24), 4);
  const stepSeconds = (end - from) / samples;

  const open = priceAt(active, from);
  let high = open;
  let low = open;
  let close = open;

  for (let i = 1; i <= samples; i += 1) {
    const value = priceAt(active, from + stepSeconds * i);
    if (value > high) high = value;
    if (value < low) low = value;
    close = value;
  }

  // Volume tracks the move, with a deterministic jitter so bars are not uniform.
  const travel = Math.abs(close - open) / (active.base * active.volatility || 1);
  const jitter = hash(active.id, Math.floor(from / size));
  const volume = Math.round(60 + travel * 4_000 + jitter * 180);

  /*
   * The history shape, which is the narrow one.
   *
   * A recording of the live feed shows two different candle shapes. History —
   * `candles` and `first-candles` — carries exactly these eight fields:
   *
   *   {"id":10069640,"from":1791040560,"to":1791040565,"open":...,"close":...,
   *    "min":...,"max":...,"volume":0}
   *
   * The live push `candle-generated` carries the same eight plus `active_id`,
   * `size`, `at`, `ask`, `bid` and `phase`. Those belong to a subscription, not
   * to a stored bar, so the feed adds them on the way out rather than here.
   */
  return {
    id: Math.floor(from / size),
    from,
    to: from + size,
    open,
    close,
    min: low,
    max: high,
    volume,
  };
}

/**
 * A candle dressed for the `candle-generated` stream.
 *
 * `from` and `to` are seconds while `at` is nanoseconds — the two are not the
 * same unit, which is easy to miss.
 */
export function liveCandle(candle, active, activeId, size, phase, atSeconds) {
  const spread = halfSpread(active);
  return {
    ...candle,
    active_id: activeId,
    size,
    at: atSeconds * 1_000_000_000,
    ask: round(candle.close + spread, active.precision),
    bid: round(candle.close - spread, active.precision),
    phase,
  };
}

/** Start of the bucket a timestamp falls into. */
export function bucketStart(timeSeconds, size) {
  return Math.floor(timeSeconds / size) * size;
}
