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
export type Brand = { name: string; supportEmail: string; countryId: number; countryFlag: string };
export type EngineSession = { userId: number };
export type DemoBalance = { amount: number; currency: string };

const DEFAULTS = {
  "engine.resource": { host: "/engine", version: 1788361536 } satisfies EngineResource,
  "engine.feed": { wsUrl: "ws://localhost:3100/echo/websocket" } satisfies EngineFeed,
  "engine.session": { userId: 100000001 } satisfies EngineSession,
  brand: {
    name: "Avalon",
    supportEmail: "support@localhost",
    countryId: 30,
    countryFlag: "BR",
  } satisfies Brand,
  "trading.demoBalance": { amount: 10000, currency: "USD" } satisfies DemoBalance,
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
