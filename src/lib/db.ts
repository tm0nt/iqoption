/**
 * The Prisma client the web app shares.
 *
 * Next's dev server re-evaluates modules on every edit, so a client created at
 * module scope would open a new connection pool each time until MySQL refuses
 * them. Holding it on `globalThis` survives the reload; in production the
 * module is evaluated once and the global is simply unused.
 *
 * Prisma 7 talks to MySQL through a driver adapter rather than its own engine,
 * and the adapter takes its pool settings separately from the CLI's
 * `DATABASE_URL` — they have to address the same database, which is why both
 * come from the same `.env`.
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
