/**
 * Canvas candle renderer.
 *
 * The traderoom paints its chart with WebGL out of the Emscripten build; this
 * is the same picture drawn with Canvas 2D — enough for a few thousand candles
 * at 60fps, and it keeps the axes as real text instead of a texture atlas.
 *
 * The engine is framework-free on purpose: it owns the viewport, the scales and
 * the draw loop, and `CandleChart.tsx` only feeds it data and pointer events.
 */

import type { Candle } from "@/lib/avalon/types";
import { AVALON_CHART_THEME, type ChartTheme } from "./theme";

export interface Viewport {
  /**
   * How many candles the right edge sits past the newest one. 0 pins the view
   * to the live candle; a positive value scrolls back in time.
   */
  offset: number;
  /** Horizontal pixels per candle, including the gap. */
  barWidth: number;
}

export interface CrosshairState {
  x: number;
  y: number;
  visible: boolean;
}

export interface ChartEngineOptions {
  theme?: Partial<ChartTheme>;
  /** Price decimals; drives the axis and the price pill. */
  precision?: number;
  watermark?: string;
  /** Called when panning runs off the left edge of the loaded history. */
  onNeedOlder?: () => void;
}

const MIN_BAR_WIDTH = 2;
const MAX_BAR_WIDTH = 60;
/** Fraction of `barWidth` the candle body occupies. */
const BODY_RATIO = 0.62;
/** Extra headroom above and below the visible range, as a fraction of it. */
const PRICE_PADDING = 0.12;

export class CandleChartEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly theme: ChartTheme;
  private readonly onNeedOlder?: () => void;

  private candles: readonly Candle[] = [];
  private precision: number;
  private watermark: string;
  /** Seconds between buckets, inferred from the series; drives the time axis. */
  private interval = 60;

  private viewport: Viewport = { offset: 0, barWidth: 8 };
  private crosshair: CrosshairState = { x: 0, y: 0, visible: false };
  /** Width and height of the drawing surface in CSS pixels. */
  private width = 0;
  private height = 0;
  private frame: number | null = null;

  constructor(canvas: HTMLCanvasElement, options: ChartEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = { ...AVALON_CHART_THEME, ...options.theme };
    this.precision = options.precision ?? 2;
    this.watermark = options.watermark ?? "";
    this.onNeedOlder = options.onNeedOlder;
  }

  setCandles(candles: readonly Candle[]): void {
    this.candles = candles;
    this.interval = inferInterval(candles);
    this.invalidate();
  }

  setPrecision(precision: number): void {
    this.precision = precision;
    this.invalidate();
  }

  setWatermark(text: string): void {
    this.watermark = text;
    this.invalidate();
  }

  /** Call on mount and whenever the container resizes. */
  resize(width: number, height: number, dpr = globalThis.devicePixelRatio || 1): void {
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.invalidate();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  /** Scrolls by a pixel delta; positive moves the view back in time. */
  pan(deltaPx: number): void {
    const next = this.viewport.offset + deltaPx / this.viewport.barWidth;
    this.viewport.offset = this.clampOffset(next);
    this.invalidate();
  }

  /** Zooms around the right edge, the way the traderoom's wheel behaves. */
  zoom(factor: number): void {
    const barWidth = clamp(this.viewport.barWidth * factor, MIN_BAR_WIDTH, MAX_BAR_WIDTH);
    if (barWidth === this.viewport.barWidth) return;
    this.viewport.barWidth = barWidth;
    this.viewport.offset = this.clampOffset(this.viewport.offset);
    this.invalidate();
  }

  /** Snaps the right edge back to the live candle. */
  scrollToLive(): void {
    this.viewport.offset = 0;
    this.invalidate();
  }

  isAtLive(): boolean {
    return this.viewport.offset < 0.5;
  }

  setCrosshair(x: number, y: number, visible: boolean): void {
    this.crosshair = { x, y, visible };
    this.invalidate();
  }

  /** The candle under a canvas x coordinate, or null outside the plot. */
  candleAt(x: number): Candle | null {
    const plotWidth = this.plotWidth();
    if (x < 0 || x > plotWidth) return null;
    const fromRight = (plotWidth - x) / this.viewport.barWidth;
    const index = this.candles.length - 1 - Math.floor(fromRight + this.viewport.offset);
    return this.candles[index] ?? null;
  }

  destroy(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  /** Coalesces repaints into one frame. */
  invalidate(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  private plotWidth(): number {
    return Math.max(this.width - this.theme.priceAxisWidth, 0);
  }

  private plotHeight(): number {
    return Math.max(this.height - this.theme.timeAxisHeight, 0);
  }

  private visibleCount(): number {
    return Math.ceil(this.plotWidth() / this.viewport.barWidth) + 1;
  }

  private clampOffset(offset: number): number {
    const maxOffset = Math.max(this.candles.length - this.visibleCount() * 0.25, 0);
    if (offset > maxOffset - this.visibleCount() * 0.5) this.onNeedOlder?.();
    return clamp(offset, 0, maxOffset);
  }

  /** The slice currently on screen, with its index in the full series. */
  private visibleSlice(): { candles: readonly Candle[]; startIndex: number } {
    const end = Math.max(this.candles.length - Math.floor(this.viewport.offset), 0);
    const start = Math.max(end - this.visibleCount(), 0);
    return { candles: this.candles.slice(start, end), startIndex: start };
  }

  private draw(): void {
    const { ctx, theme } = this;
    const plotWidth = this.plotWidth();
    const plotHeight = this.plotHeight();

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, this.width, this.height);
    if (plotWidth <= 0 || plotHeight <= 0) return;

    const { candles } = this.visibleSlice();
    if (candles.length === 0) {
      this.drawWatermark(plotWidth, plotHeight);
      return;
    }

    const range = priceRange(candles);
    const toY = (price: number) =>
      plotHeight - ((price - range.lo) / (range.hi - range.lo)) * plotHeight;
    // The newest visible candle hugs the right edge of the plot.
    const toX = (index: number) =>
      plotWidth - (candles.length - index - 0.5) * this.viewport.barWidth;

    this.drawWatermark(plotWidth, plotHeight);
    this.drawPriceGrid(range, toY, plotWidth, plotHeight);
    this.drawTimeGrid(candles, toX, plotHeight);
    this.drawCandles(candles, toX, toY);
    this.drawLastPrice(candles[candles.length - 1], toY, plotWidth);
    if (this.crosshair.visible) this.drawCrosshair(range, plotWidth, plotHeight);
  }

  private drawWatermark(plotWidth: number, plotHeight: number): void {
    if (!this.watermark) return;
    const { ctx, theme } = this;
    ctx.save();
    ctx.fillStyle = theme.watermark;
    ctx.font = `700 ${Math.round(plotHeight * 0.2)}px ${theme.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.watermark, plotWidth / 2, plotHeight / 2);
    ctx.restore();
  }

  private drawPriceGrid(
    range: { lo: number; hi: number },
    toY: (price: number) => number,
    plotWidth: number,
    plotHeight: number,
  ): void {
    const { ctx, theme } = this;
    const step = niceStep(range.hi - range.lo, Math.max(Math.floor(plotHeight / 56), 2));

    ctx.save();
    ctx.font = `${theme.axisFontSize}px ${theme.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (let price = Math.ceil(range.lo / step) * step; price < range.hi; price += step) {
      const y = Math.round(toY(price)) + 0.5;
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      ctx.fillStyle = theme.axisText;
      ctx.fillText(price.toFixed(this.precision), plotWidth + 10, y);
    }
    ctx.restore();
  }

  private drawTimeGrid(
    candles: readonly Candle[],
    toX: (index: number) => number,
    plotHeight: number,
  ): void {
    const { ctx, theme } = this;
    // One label roughly every 90px, snapped to a candle so gridlines align.
    const stride = Math.max(Math.round(90 / this.viewport.barWidth), 1);

    ctx.save();
    ctx.font = `${theme.axisFontSize}px ${theme.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let i = candles.length - 1; i >= 0; i -= stride) {
      const x = Math.round(toX(i)) + 0.5;
      if (x < 0) break;
      ctx.strokeStyle = theme.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, plotHeight);
      ctx.stroke();

      ctx.fillStyle = theme.axisText;
      ctx.fillText(formatTime(candles[i].t, this.interval), x, plotHeight + 6);
    }
    ctx.restore();
  }

  private drawCandles(
    candles: readonly Candle[],
    toX: (index: number) => number,
    toY: (price: number) => number,
  ): void {
    const { ctx, theme } = this;
    const body = Math.max(this.viewport.barWidth * BODY_RATIO, 1);

    for (let i = 0; i < candles.length; i += 1) {
      const candle = candles[i];
      const x = toX(i);
      const color = candle.c >= candle.o ? theme.up : theme.down;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      ctx.lineWidth = theme.wickWidth;
      const wickX = Math.round(x) + 0.5;
      ctx.beginPath();
      ctx.moveTo(wickX, toY(candle.h));
      ctx.lineTo(wickX, toY(candle.l));
      ctx.stroke();

      const yOpen = toY(candle.o);
      const yClose = toY(candle.c);
      // A doji still needs a visible line, hence the 1px floor.
      const top = Math.min(yOpen, yClose);
      const height = Math.max(Math.abs(yClose - yOpen), 1);
      ctx.fillRect(Math.round(x - body / 2), Math.round(top), Math.round(body), Math.round(height));
    }
  }

  private drawLastPrice(
    last: Candle,
    toY: (price: number) => number,
    plotWidth: number,
  ): void {
    const { ctx, theme } = this;
    const y = Math.round(toY(last.c)) + 0.5;

    ctx.save();
    ctx.strokeStyle = theme.priceLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotWidth, y);
    ctx.stroke();
    ctx.restore();

    this.drawAxisLabel(
      last.c.toFixed(this.precision),
      plotWidth,
      y,
      theme.pillBackground,
      theme.pillText,
    );
  }

  private drawCrosshair(
    range: { lo: number; hi: number },
    plotWidth: number,
    plotHeight: number,
  ): void {
    const { ctx, theme } = this;
    const { x, y } = this.crosshair;
    if (x > plotWidth || y > plotHeight) return;

    ctx.save();
    ctx.strokeStyle = theme.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, plotHeight);
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(plotWidth, Math.round(y) + 0.5);
    ctx.stroke();
    ctx.restore();

    const price = range.hi - (y / plotHeight) * (range.hi - range.lo);
    this.drawAxisLabel(
      price.toFixed(this.precision),
      plotWidth,
      y,
      theme.crosshairLabelBackground,
      theme.crosshairLabelText,
    );

    const candle = this.candleAt(x);
    if (candle) {
      ctx.save();
      ctx.font = `${theme.axisFontSize}px ${theme.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const label = formatTime(candle.t, this.interval);
      const width = ctx.measureText(label).width + 12;
      ctx.fillStyle = theme.crosshairLabelBackground;
      ctx.fillRect(x - width / 2, plotHeight + 2, width, theme.timeAxisHeight - 4);
      ctx.fillStyle = theme.crosshairLabelText;
      ctx.fillText(label, x, plotHeight + 6);
      ctx.restore();
    }
  }

  /** The pointed tag the traderoom pins to the price gutter. */
  private drawAxisLabel(
    text: string,
    plotWidth: number,
    y: number,
    background: string,
    color: string,
  ): void {
    const { ctx, theme } = this;
    const height = 20;
    const notch = 6;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(plotWidth, y);
    ctx.lineTo(plotWidth + notch, y - height / 2);
    ctx.lineTo(this.width, y - height / 2);
    ctx.lineTo(this.width, y + height / 2);
    ctx.lineTo(plotWidth + notch, y + height / 2);
    ctx.closePath();
    ctx.fillStyle = background;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = `600 ${theme.axisFontSize}px ${theme.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, plotWidth + notch + 5, y);
    ctx.restore();
  }
}

function priceRange(candles: readonly Candle[]): { lo: number; hi: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const candle of candles) {
    if (candle.l < lo) lo = candle.l;
    if (candle.h > hi) hi = candle.h;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1 };
  // A flat series would collapse the scale to a division by zero.
  const span = hi - lo || Math.max(Math.abs(hi), 1) * 0.001;
  return { lo: lo - span * PRICE_PADDING, hi: hi + span * PRICE_PADDING };
}

/** Rounds a raw axis step up to the nearest 1/2/5 x 10^n. */
function niceStep(span: number, targetLines: number): number {
  const raw = span / targetLines;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Picks the coarsest label that still separates two neighbouring buckets:
 * seconds below a minute, hours and minutes below a day, the date above it.
 */
function formatTime(unixSeconds: number, interval: number): string {
  const date = new Date(unixSeconds * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (interval >= 86_400) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
  }
  const hhmm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return interval < 60 ? `${hhmm}:${pad(date.getSeconds())}` : hhmm;
}

/** The median gap between buckets, so one missing candle cannot skew it. */
function inferInterval(candles: readonly Candle[]): number {
  if (candles.length < 2) return 60;
  const gaps: number[] = [];
  for (let i = Math.max(candles.length - 21, 1); i < candles.length; i += 1) {
    const gap = candles[i].t - candles[i - 1].t;
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 60;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
