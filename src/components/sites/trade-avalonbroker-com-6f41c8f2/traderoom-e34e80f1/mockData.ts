import type {
  AvalonAssetCard,
  AvalonAssetTab,
  AvalonCalendarEvent,
  AvalonCandle,
  AvalonLeader,
  AvalonPosition,
  AvalonPromo,
  AvalonTournament,
} from "@/types/avalon-login";

/**
 * Demo data for the traderoom clone.
 *
 * Everything here is invented. The live traderoom shows the signed-in account's
 * real balance, positions, display name, e-mail and user id; none of that is
 * reproduced. Figures were chosen to match the *shape* of the original's
 * numbers (column widths, digit counts) so the layout behaves identically.
 */

export const DEMO_BALANCE = "$10,000.00";
export const DEMO_REAL_BALANCE = "R$ 0.00";
export const DEMO_AVAILABLE = "$10,000.00";
export const DEMO_INVESTMENT = "$0.00";
export const DEMO_EMAIL = "trader@example.com";
export const DEMO_USER_ID = "100000000";
export const DEMO_REGISTERED = "2 Oct 2026";
export const DEMO_COUNTRY = "Brazil";
export const DEMO_DISPLAY_NAME = "Alex T.";
export const DEMO_TOUR_PROGRESS = 80;

export const ASSET_TABS: AvalonAssetTab[] = [
  { id: "btc", name: "Bitcoin", kind: "Up to 5 min", badge: "₿", badgeClass: "bg-[#f29423] text-black" },
  { id: "us100", name: "US 100", kind: "Up to 15 min", badge: "US", badgeClass: "bg-[#2d4a8a] text-white" },
  { id: "ssnlf", name: "Samsung-Pe…", kind: "Stock", badge: "SA", badgeClass: "bg-[#1428a0] text-white" },
];

export const TRADE_DEFAULTS = {
  invest: 513,
  expiration: "5 sec",
  profitPercent: 85,
  profitAmount: "+$436.05",
};

export const DEMO_POSITIONS: AvalonPosition[] = [
  {
    time: "20:23",
    date: "2 Oct",
    asset: "Bitcoin",
    kind: "Up to 5 min",
    direction: "up",
    amount: "$1",
    result: "+$0.85 (+85%)",
  },
];

export const DEMO_TOURNAMENTS: AvalonTournament[] = [
  {
    name: "Torneio Avalon",
    status: "COMPLETED",
    prizePool: "$1,000",
    entryFee: "$3",
    participants: "911",
    instruments: "BO, FO, Up to 5 min",
  },
  {
    name: "$1000 Tournament",
    status: "COMPLETED",
    prizePool: "$1,000",
    entryFee: "$4",
    participants: "52",
    instruments: "BO, FO, Up to 5 min",
  },
];

export const DEMO_LEADERS: AvalonLeader[] = [
  { rank: 1, name: "Angel G.", amount: "$51,125" },
  { rank: 2, name: "Michael R.", amount: "$20,038" },
  { rank: 3, name: "Zachary S.", amount: "$16,445" },
  { rank: 4, name: "Jace E.", amount: "$15,579" },
  { rank: 5, name: "Thomas J.", amount: "$15,262" },
  { rank: 6, name: "Oliver W.", amount: "$13,965" },
  { rank: 7, name: "Anthony A.", amount: "$12,215" },
  { rank: 8, name: "Cooper P.", amount: "$9,925" },
  { rank: 9, name: "Brayden A.", amount: "$9,460" },
  { rank: 10, name: "Lucas M.", amount: "$8,730" },
];

export const DEMO_PROMOS: AvalonPromo[] = [
  {
    kind: "Promo code",
    tag: "Exclusive",
    title: "How to get a Profit Boost with a promo code?",
    meta: "1 day left",
    isNew: true,
  },
  {
    kind: "Promo code",
    tag: "Exclusive",
    title: "Bonus up to 100%",
    meta: "Until 10 Oct 2026",
    isNew: true,
  },
];

export const DEMO_CALENDAR: { date: string; events: AvalonCalendarEvent[] }[] = [
  {
    date: "3 OCTOBER",
    events: [
      { flag: "🇺🇸", name: "Baker Hughes Oil Rig Count", time: "14:00", impact: "low" },
      { flag: "🇩🇪", name: "German Unity Day", time: "21:00", impact: "low" },
    ],
  },
  {
    date: "4 OCTOBER",
    events: [
      { flag: "🇦🇺", name: "S&P Global Services PMI Final", time: "19:00", impact: "low" },
      { flag: "🇦🇺", name: "S&P Global Composite PMI Final", time: "19:00", impact: "low" },
      { flag: "🇦🇺", name: "TD-MI Inflation Gauge MoM", time: "21:00", impact: "low" },
      { flag: "🇯🇵", name: "S&P Global Composite PMI Final", time: "21:30", impact: "low" },
      { flag: "🇯🇵", name: "S&P Global Services PMI Final", time: "21:30", impact: "low" },
      { flag: "🇸🇬", name: "S&P Global PMI", time: "21:30", impact: "low" },
    ],
  },
  {
    date: "5 OCTOBER",
    events: [
      { flag: "🇨🇳", name: "Caixin Services PMI", time: "22:45", impact: "medium" },
      { flag: "🇮🇳", name: "HSBC Composite PMI Final", time: "01:30", impact: "low" },
    ],
  },
];

export const DEMO_TRADERS_CHOICE: AvalonAssetCard[] = [
  { name: "EUR/USD (OTC)", profit: "85%", price: "1.124925", change: "−0.04%", up: false },
  { name: "USD/HKD (OTC)", profit: "85%", price: "7.894725", change: "+0.01%", up: true },
  { name: "AUD/CAD (OTC)", profit: "85%", price: "0.986335", change: "−0.08%", up: false },
];

export const DEMO_GAINERS: AvalonAssetCard[] = [
  { name: "USD/BRL (OTC)", profit: "87%", price: "5.504865", change: "+0.01%", up: true },
  { name: "PEN/USD (OTC)", profit: "87%", price: "0.334815", change: "+1.41%", up: true },
  { name: "USD/COP (OTC)", profit: "87%", price: "3580.401", change: "+0.34%", up: true },
];

export const DEMO_LOSERS: AvalonAssetCard[] = [
  { name: "USD/SGD (OTC)", profit: "85%", price: "1.287450", change: "−0.21%", up: false },
  { name: "AUD/NZD (OTC)", profit: "85%", price: "1.098720", change: "−0.33%", up: false },
  { name: "EUR/NZD (OTC)", profit: "85%", price: "1.942310", change: "−0.47%", up: false },
];

/**
 * Deterministic pseudo-random candle series.
 *
 * The real chart streams live quotes over a WebSocket, which is out of scope.
 * A seeded generator keeps the server and client renders identical (no
 * hydration mismatch) while still looking like a real market.
 */
export function buildCandles(count: number, seed = 20261002): AvalonCandle[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const out: AvalonCandle[] = [];
  let price = 82500;
  for (let i = 0; i < count; i += 1) {
    // Body ~17 units, wick ~9, so the series spans roughly 150 units and the
    // 50-unit price grid shows three to four lines, as in the original.
    const drift = (rnd() - 0.47) * 34;
    const o = price;
    const c = o + drift;
    const hi = Math.max(o, c) + rnd() * 9;
    const lo = Math.min(o, c) - rnd() * 9;
    out.push({ t: i, o, h: hi, l: lo, c });
    price = c;
  }
  return out;
}

export const DEMO_SENTIMENT = { buy: 33, sell: 67 };
