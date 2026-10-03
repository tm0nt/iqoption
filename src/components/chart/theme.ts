/** Palette and metrics for the candle chart, measured from the traderoom. */
export interface ChartTheme {
  background: string;
  grid: string;
  axisText: string;
  up: string;
  down: string;
  wickWidth: number;
  priceLine: string;
  pillBackground: string;
  pillText: string;
  crosshair: string;
  crosshairLabelBackground: string;
  crosshairLabelText: string;
  watermark: string;
  font: string;
  axisFontSize: number;
  /** Width of the right-hand price gutter, in CSS pixels. */
  priceAxisWidth: number;
  /** Height of the bottom time gutter, in CSS pixels. */
  timeAxisHeight: number;
}

export const AVALON_CHART_THEME: ChartTheme = {
  background: "#000000",
  grid: "#1b1c1e",
  axisText: "#6a6b6d",
  up: "#09af8e",
  down: "#f6465d",
  wickWidth: 1,
  priceLine: "#4a4b4d",
  pillBackground: "#e8e9eb",
  pillText: "#000000",
  crosshair: "#5a5b5d",
  crosshairLabelBackground: "#2a2b2d",
  crosshairLabelText: "#e8e9eb",
  watermark: "rgba(255,255,255,0.035)",
  font: "var(--font-avalon), system-ui, sans-serif",
  axisFontSize: 12,
  priceAxisWidth: 72,
  timeAxisHeight: 24,
};
