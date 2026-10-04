/**
 * The market server's connection to the database.
 *
 * It reads MySQL directly rather than through Prisma. Prisma owns the schema
 * and the admin API, but its generated client is TypeScript and this server is
 * plain ESM that starts with no build step; a handful of queries is not worth a
 * compiler in front of the market feed.
 *
 * One pool for the whole process, so the catalogue, the accounts and the
 * wallets do not each open their own.
 */
import mariadb from "mariadb";

let shared = null;

export function pool() {
  if (shared) return shared;
  shared = mariadb.createPool({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
    /*
     * The driver hands back BigInt for MySQL's 64-bit integers and a Decimal
     * object for DECIMAL columns, and neither survives `JSON.stringify` on the
     * way to the client. Every id and every amount here fits a double.
     */
    insertIdAsNumber: true,
    decimalAsNumber: true,
    bigIntAsNumber: true,
  });
  return shared;
}

export async function closePool() {
  if (shared) await shared.end();
  shared = null;
}

/** MySQL hands JSON columns back as text on some driver versions. */
export function readJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}
