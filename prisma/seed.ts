/**
 * The catalogue an empty database starts from.
 *
 * Every row here is editable afterwards through the admin API; this is a
 * starting point, not a fixture the code depends on. Re-running it is safe —
 * each row is upserted by its id — and it never deletes anything an
 * administrator added.
 *
 * The crypto ids follow the feed's own numbering where it is known (816 is
 * Bitcoin, 817 Ethereum) and continue from 860 where it is not. See
 * docs/avalon-backend.md on why the ids matter: a client can be repointed
 * between this server and the live one by changing a URL, and only if the
 * instrument ids agree.
 *
 * Precisions are Binance's own `PRICE_FILTER` tick sizes, read from
 * `/api/v3/exchangeInfo` rather than guessed — a chart drawn with the wrong
 * number of decimals quantises the curve into steps.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { PriceSource } from "../src/generated/prisma/enums";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 3,
});
const prisma = new PrismaClient({ adapter });

const GROUPS = [
  { id: 1, key: "front.forex", name: "Forex", priority: 10 },
  { id: 2, key: "front.crypto", name: "Crypto", priority: 20 },
  { id: 3, key: "front.index", name: "Indices", priority: 30 },
  { id: 4, key: "front.stock", name: "Stocks", priority: 40 },
  { id: 5, key: "front.commodity", name: "Commodities", priority: 50 },
];

/** The expiries the deal panel offers, in seconds. */
const EXPIRIES = [60, 120, 300];
const EVERY_DAY = [1, 1, 1, 1, 1, 1, 1];

type Seed = {
  id: number;
  ticker: string;
  name: string;
  kind: string;
  groupId: number;
  precision: number;
  profit: number;
  source: PriceSource;
  sourceSymbol?: string;
  currencyLeft: string;
  simBase?: number;
  simVolatility?: number;
  simPeriod?: number;
};

const CRYPTO: Seed[] = [
  { id: 816, ticker: "BTCUSD", name: "Bitcoin", precision: 2, profit: 85, sourceSymbol: "BTCUSDT", currencyLeft: "BTC", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
  { id: 817, ticker: "ETHUSD", name: "Ethereum", precision: 2, profit: 85, sourceSymbol: "ETHUSDT", currencyLeft: "ETH", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
  { id: 860, ticker: "SOLUSD", name: "Solana", precision: 2, profit: 84, sourceSymbol: "SOLUSDT", currencyLeft: "SOL", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
  { id: 861, ticker: "BNBUSD", name: "BNB", precision: 2, profit: 83, sourceSymbol: "BNBUSDT", currencyLeft: "BNB", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
  { id: 862, ticker: "XRPUSD", name: "XRP", precision: 4, profit: 83, sourceSymbol: "XRPUSDT", currencyLeft: "XRP", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
  { id: 863, ticker: "DOGEUSD", name: "Dogecoin", precision: 5, profit: 82, sourceSymbol: "DOGEUSDT", currencyLeft: "DOGE", kind: "crypto", groupId: 2, source: PriceSource.BINANCE },
];

/*
 * Forex has no feed yet, so these keep the deterministic curve. They are here
 * rather than omitted because the engine's asset selector is built from the
 * groups it is sent, and a platform that offers only crypto looks like one that
 * is broken. Switching a row to BINANCE later is a column change, not a code
 * change — see docs/engine-host-pendencias.md.
 */
const FOREX: Seed[] = [
  { id: 1, ticker: "EURUSD", name: "EUR/USD", precision: 5, profit: 82, currencyLeft: "EUR", kind: "forex", groupId: 1, source: PriceSource.SIMULATED, simBase: 1.0842, simVolatility: 0.004, simPeriod: 900 },
  { id: 2, ticker: "GBPUSD", name: "GBP/USD", precision: 5, profit: 80, currencyLeft: "GBP", kind: "forex", groupId: 1, source: PriceSource.SIMULATED, simBase: 1.2671, simVolatility: 0.005, simPeriod: 900 },
  { id: 3, ticker: "USDJPY", name: "USD/JPY", precision: 3, profit: 80, currencyLeft: "USD", kind: "forex", groupId: 1, source: PriceSource.SIMULATED, simBase: 151.42, simVolatility: 0.006, simPeriod: 900 },
  { id: 4, ticker: "AUDUSD", name: "AUD/USD", precision: 5, profit: 78, currencyLeft: "AUD", kind: "forex", groupId: 1, source: PriceSource.SIMULATED, simBase: 0.6584, simVolatility: 0.005, simPeriod: 900 },
  { id: 5, ticker: "USDCAD", name: "USD/CAD", precision: 5, profit: 78, currencyLeft: "USD", kind: "forex", groupId: 1, source: PriceSource.SIMULATED, simBase: 1.3612, simVolatility: 0.004, simPeriod: 900 },
];

const SETTINGS = [
  {
    key: "engine.resource",
    description: "Where the mirrored engine build is served from, and its cache-busting version.",
    value: { host: "/engine", version: 1788361536 },
  },
  {
    key: "engine.feed",
    description: "The WebSocket the engine is redirected to. Point it at the live feed to compare behaviour.",
    value: { wsUrl: "ws://localhost:3100/echo/websocket" },
  },
  {
    key: "brand",
    /* Edited in the admin; seeding again must not undo that. */
    keep: true,
    description: "Shown by the engine's shell: company name, support contact and the country it reports.",
    value: { name: "Avalon", supportEmail: "support@localhost", countryId: 30, countryFlag: "BR" },
  },
  {
    key: "engine.session",
    description:
      "The user id the engine's check-session answer reports. It has to match the account the market server hands the first session, or the client stays on its login view.",
    value: { userId: 100000001 },
  },
  {
    key: "cashier.methods",
    keep: true,
    description:
      "The rails the cashier offers, in the order it lists them. `deposit` and `withdrawal` say where each one appears; `days` is the settlement window shown under the name.",
    value: {
      methods: [
        { id: "pix", name: "PIX (CPF)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "bank" },
        { id: "usdc-bsc", name: "USD Coin (BNB Smart Chain)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "bnb", name: "Binance Coin (BNB)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "btc", name: "Bitcoin (BTC)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "ada", name: "Cardano (ADA)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "eth-erc20", name: "Ethereum (ETH) ERC-20", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "ltc", name: "Litecoin (LTC)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "xrp", name: "Ripple (XRP)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
        { id: "usdt-trc20", name: "Tether (USDT) TRC-20", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "crypto" },
      ],
      freeWithdrawalsPerMonth: 1,
      minWithdrawal: 10,
      minDeposit: 10,
      /* The amounts the deposit page offers as buttons, largest first. */
      depositPresets: [5000, 2500, 1000, 500, 250, 100, 50, 25],
    },
  },
  {
    key: "trading.demoBalance",
    description: "What a new practice account starts with.",
    value: { amount: 10000, currency: "USD" },
  },
];

async function main() {
  for (const group of GROUPS) {
    await prisma.assetGroup.upsert({ where: { id: group.id }, create: group, update: group });
  }

  for (const seed of [...CRYPTO, ...FOREX]) {
    const row = {
      ...seed,
      expirations: EXPIRIES,
      expirationDays: EVERY_DAY,
      currencyRight: "USD",
      /*
       * A path, never an empty string. The engine builds an icon URL by
       * appending this to its resources endpoint, so an empty one asks for the
       * bare endpoint — a HEAD of the site root that fails as an image. The
       * live feed sends a real path per instrument for the same reason; ours
       * resolves to the transparent pixel the host serves for
       * `/storage/public/`.
       */
      image: `/storage/public/assets/${seed.id}.png`,
    };
    await prisma.asset.upsert({ where: { id: seed.id }, create: row, update: row });
  }

  /*
   * A setting marked `keep` is only created. The brand and the cashier are
   * edited from the admin's own screens, and a re-seed that overwrote them
   * would quietly put back the minimum deposit, the fees and the logo an
   * operator had changed.
   */
  for (const { keep, ...setting } of SETTINGS as (typeof SETTINGS[number] & { keep?: boolean })[]) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: keep ? { description: setting.description } : { value: setting.value, description: setting.description },
    });
  }

  const [groups, assets, settings] = await Promise.all([
    prisma.assetGroup.count(),
    prisma.asset.count(),
    prisma.platformSetting.count(),
  ]);
  console.log(`semeado: ${groups} grupos, ${assets} ativos, ${settings} configurações`);
}

// Not top-level await: the loader that runs this file can pull it in through
// `require`, which refuses a module that awaits at the top.
main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
