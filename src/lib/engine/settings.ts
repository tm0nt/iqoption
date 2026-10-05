/**
 * Platform settings, read from the database with the defaults the code needs.
 *
 * Every getter falls back rather than throwing: a platform whose settings table
 * is empty still boots, and an administrator who clears a row gets the default
 * back instead of a blank traderoom. The fallbacks are the same values the seed
 * writes, so a fresh database and a wiped one behave alike.
 */
import { prisma } from "@/lib/db";

export type EngineResource = { host: string; version: number };
export type EngineFeed = { wsUrl: string };
/**
 * Everything that makes the platform this platform rather than another one.
 *
 * All of it is a row, so rebranding is an edit and not a deploy. The two logos
 * are the engine's own file names — it loads `logo.png` in the corner and
 * `logo-big.png` where it needs a larger one — and an empty string means "use
 * the one in the mirrored build".
 */
export type Brand = {
  name: string;
  supportEmail: string;
  countryId: number;
  countryFlag: string;
  /** Shown in the header and the auth pages. Empty falls back to the build's. */
  logoUrl: string;
  /** The larger mark, for splash and wide headers. */
  logoBigUrl: string;
  /**
   * Which of the engine's four themes the traderoom opens in.
   *
   * `black`, `white`, `blue` and `grey` are the ones its bundle carries — see
   * `/styles/themes/*.css` inside the build — and the value reaches it through
   * the `traderoom_gl_common` user settings.
   */
  theme: "black" | "white" | "blue" | "grey";
  /** The accent, as a CSS colour. Drives the cabinet's buttons and links. */
  primary: string;
  /** The square mark for the browser tab. Empty falls back to the build's. */
  iconUrl: string;
  /**
   * The headline a link preview shows.
   *
   * Separate from `name` because they are different sentences: the tab says
   * the platform's name, and a card shared into a chat says what it is for.
   */
  tagline: string;
  /** The sentence under that headline, and the page's meta description. */
  description: string;
  /**
   * The platform's own address, for the canonical and `og:url` tags.
   *
   * Empty leaves both out, which is right until a platform knows where it
   * lives: a link preview pointing at the wrong host is worse than none.
   */
  siteUrl: string;
};
export type EngineSession = { userId: number };
export type DemoBalance = { amount: number; currency: string };

/**
 * Which currencies a person may hold money in.
 *
 * The engine carries a catalogue of ninety-three and marks twenty-three as
 * ones money can move in. Which of those *this* platform offers is a separate
 * decision and this is it — the live brand it was recorded from offers two.
 *
 * The first is the default: a new account opens in it, and anything asked for
 * a currency that does not exist falls back to it.
 */
export type Currencies = { offered: string[] };

const DEFAULTS = {
  "engine.resource": { host: "/engine", version: 1788361536 } satisfies EngineResource,
  "engine.feed": { wsUrl: "ws://localhost:3100/echo/websocket" } satisfies EngineFeed,
  "engine.session": { userId: 100000001 } satisfies EngineSession,
  brand: {
    name: "Avalon",
    supportEmail: "support@localhost",
    countryId: 30,
    countryFlag: "BR",
    logoUrl: "",
    logoBigUrl: "",
    theme: "black",
    primary: "#00b17a",
    iconUrl: "",
    tagline: "Online trading platform",
    description: "Trade forex, stocks, ETFs and options.",
    siteUrl: "",
  } satisfies Brand,
  "trading.demoBalance": { amount: 10000, currency: "USD" } satisfies DemoBalance,
  "cashier.currencies": { offered: ["USD", "BRL", "EUR"] } satisfies Currencies,
};

type SettingKey = keyof typeof DEFAULTS;

/**
 * One setting, merged over its default.
 *
 * Merged rather than replaced so a row that carries only the field an
 * administrator changed still answers for the rest.
 */
export async function setting<K extends SettingKey>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  if (!row || row.value === null || typeof row.value !== "object" || Array.isArray(row.value)) {
    return DEFAULTS[key];
  }
  return { ...DEFAULTS[key], ...row.value } as (typeof DEFAULTS)[K];
}

/** Everything the traderoom page needs, in one round trip. */
export async function engineConfig() {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: Object.keys(DEFAULTS) } },
  });

  const found = new Map(rows.map((row) => [row.key, row.value]));
  const read = <K extends SettingKey>(key: K): (typeof DEFAULTS)[K] => {
    const value = found.get(key);
    if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULTS[key];
    return { ...DEFAULTS[key], ...value } as (typeof DEFAULTS)[K];
  };

  return {
    resource: read("engine.resource"),
    feed: read("engine.feed"),
    session: read("engine.session"),
    brand: read("brand"),
  };
}
