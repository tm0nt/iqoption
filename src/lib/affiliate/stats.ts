/**
 * What an affiliate's traffic did, counted.
 *
 * Read from the records themselves — clicks, referrals, transactions, deals,
 * the ledger — rather than from counters kept alongside them, so a number on
 * the dashboard can always be taken apart into the rows behind it.
 *
 * Every query groups by affiliate and takes a list, so the admin's table of
 * fifty affiliates is six queries and not three hundred.
 *
 * Dates go into raw SQL as UTC text. Prisma stores DateTime in UTC, but a JS
 * Date handed to a raw query is converted by the driver in the process's own
 * zone, which on a server not set to UTC moves every period boundary by hours.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/cabinet/money";

export const PERIODS = ["today", "7d", "30d", "all"] as const;
export type Period = (typeof PERIODS)[number];

export function readPeriod(value: unknown, fallback: Period = "30d"): Period {
  return PERIODS.includes(value as Period) ? (value as Period) : fallback;
}

/** The first moment a period covers, or null for all of time. */
export function periodStart(period: Period, now = new Date()): Date | null {
  if (period === "all") return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "7d") start.setDate(start.getDate() - 6);
  if (period === "30d") start.setDate(start.getDate() - 29);
  return start;
}

const utc = (date: Date) => date.toISOString().slice(0, 23).replace("T", " ");
const n = (value: unknown) => Number(value ?? 0) || 0;

export type AffiliateStats = {
  clicks: number;
  uniqueClicks: number;
  signups: number;
  ftds: number;
  ftdAmount: number;
  deposits: number;
  withdrawals: number;
  turnover: number;
  /** The platform's result on referred people's real trades. Positive is the platform's. */
  platformResult: number;
  cpa: number;
  revshare: number;
  adjustments: number;
  earned: number;
};

export const EMPTY_STATS: AffiliateStats = {
  clicks: 0,
  uniqueClicks: 0,
  signups: 0,
  ftds: 0,
  ftdAmount: 0,
  deposits: 0,
  withdrawals: 0,
  turnover: 0,
  platformResult: 0,
  cpa: 0,
  revshare: 0,
  adjustments: 0,
  earned: 0,
};

/** Conversion from click to account, as a percentage, or null with no clicks. */
export function conversion(stats: Pick<AffiliateStats, "clicks" | "signups">) {
  return stats.clicks > 0 ? round2((stats.signups / stats.clicks) * 100) : null;
}

export async function statsFor(affiliateIds: number[], from: Date | null): Promise<Map<number, AffiliateStats>> {
  const out = new Map<number, AffiliateStats>();
  if (affiliateIds.length === 0) return out;
  for (const id of affiliateIds) out.set(id, { ...EMPTY_STATS });

  const ids = Prisma.join(affiliateIds);
  const since = (column: Prisma.Sql) => (from ? Prisma.sql`AND ${column} >= ${utc(from)}` : Prisma.empty);
  const sinceUnix = from ? Prisma.sql`AND p.closed_at >= ${Math.floor(from.getTime() / 1000)}` : Prisma.empty;

  const [clicks, signups, ftds, money, trades, ledger] = await Promise.all([
    prisma.$queryRaw<{ affiliate_id: number; clicks: unknown; uniq: unknown }[]>`
      SELECT affiliate_id, COUNT(*) AS clicks, COUNT(DISTINCT ip) AS uniq
        FROM affiliate_clicks
       WHERE affiliate_id IN (${ids}) ${since(Prisma.sql`created_at`)}
       GROUP BY affiliate_id`,
    prisma.$queryRaw<{ affiliate_id: number; signups: unknown }[]>`
      SELECT affiliate_id, COUNT(*) AS signups
        FROM referrals
       WHERE affiliate_id IN (${ids}) ${since(Prisma.sql`created_at`)}
       GROUP BY affiliate_id`,
    prisma.$queryRaw<{ affiliate_id: number; ftds: unknown; amount: unknown }[]>`
      SELECT affiliate_id, COUNT(*) AS ftds, COALESCE(SUM(ftd_amount), 0) AS amount
        FROM referrals
       WHERE affiliate_id IN (${ids}) AND ftd_at IS NOT NULL ${since(Prisma.sql`ftd_at`)}
       GROUP BY affiliate_id`,
    prisma.$queryRaw<{ affiliate_id: number; kind: string; total: unknown }[]>`
      SELECT r.affiliate_id, t.kind, COALESCE(SUM(t.amount), 0) AS total
        FROM transactions t
        JOIN referrals r ON r.user_id = t.user_id
       WHERE r.affiliate_id IN (${ids}) AND t.status = 'APPROVED' ${since(Prisma.sql`t.settled_at`)}
       GROUP BY r.affiliate_id, t.kind`,
    prisma.$queryRaw<{ affiliate_id: number; turnover: unknown; result: unknown }[]>`
      SELECT r.affiliate_id, COALESCE(SUM(p.invest), 0) AS turnover, COALESCE(SUM(-p.close_profit), 0) AS result
        FROM positions p
        JOIN referrals r ON r.user_id = p.user_id
        JOIN balances b ON b.id = p.balance_id AND b.type = 1
       WHERE r.affiliate_id IN (${ids}) AND p.closed_at > 0 ${sinceUnix}
       GROUP BY r.affiliate_id`,
    prisma.affiliateCommission.groupBy({
      by: ["affiliateId", "kind"],
      where: { affiliateId: { in: affiliateIds }, reversedAt: null, ...(from ? { earnedAt: { gte: from } } : {}) },
      _sum: { amount: true },
    }),
  ]);

  const at = (id: unknown) => out.get(Number(id));

  for (const row of clicks) {
    const s = at(row.affiliate_id);
    if (s) {
      s.clicks = n(row.clicks);
      s.uniqueClicks = n(row.uniq);
    }
  }
  for (const row of signups) {
    const s = at(row.affiliate_id);
    if (s) s.signups = n(row.signups);
  }
  for (const row of ftds) {
    const s = at(row.affiliate_id);
    if (s) {
      s.ftds = n(row.ftds);
      s.ftdAmount = round2(n(row.amount));
    }
  }
  for (const row of money) {
    const s = at(row.affiliate_id);
    if (!s) continue;
    if (row.kind === "DEPOSIT") s.deposits = round2(n(row.total));
    if (row.kind === "WITHDRAWAL") s.withdrawals = round2(n(row.total));
  }
  for (const row of trades) {
    const s = at(row.affiliate_id);
    if (s) {
      s.turnover = round2(n(row.turnover));
      s.platformResult = round2(n(row.result));
    }
  }
  for (const row of ledger) {
    const s = at(row.affiliateId);
    if (!s) continue;
    const amount = round2(n(row._sum.amount));
    if (row.kind === "CPA") s.cpa = amount;
    if (row.kind === "REVSHARE") s.revshare = amount;
    if (row.kind === "ADJUSTMENT") s.adjustments = amount;
    s.earned = round2(s.earned + amount);
  }

  return out;
}

export async function statsOf(affiliateId: number, from: Date | null) {
  return (await statsFor([affiliateId], from)).get(affiliateId) ?? { ...EMPTY_STATS };
}

export type SubIdRow = { sub: string; clicks: number; signups: number; ftds: number; ftdAmount: number; earned: number };

/** The same numbers, split by the affiliate's own sub-id label. */
export async function subIdReport(affiliateId: number, from: Date | null): Promise<SubIdRow[]> {
  const since = (column: Prisma.Sql) => (from ? Prisma.sql`AND ${column} >= ${utc(from)}` : Prisma.empty);

  const [clicks, signups, earned] = await Promise.all([
    prisma.$queryRaw<{ sub: string; clicks: unknown }[]>`
      SELECT COALESCE(sub_id, '') AS sub, COUNT(*) AS clicks
        FROM affiliate_clicks
       WHERE affiliate_id = ${affiliateId} ${since(Prisma.sql`created_at`)}
       GROUP BY COALESCE(sub_id, '')`,
    prisma.$queryRaw<{ sub: string; signups: unknown; ftds: unknown; amount: unknown }[]>`
      SELECT COALESCE(sub_id, '') AS sub, COUNT(*) AS signups,
             SUM(CASE WHEN ftd_at IS NULL THEN 0 ELSE 1 END) AS ftds,
             COALESCE(SUM(ftd_amount), 0) AS amount
        FROM referrals
       WHERE affiliate_id = ${affiliateId} ${since(Prisma.sql`created_at`)}
       GROUP BY COALESCE(sub_id, '')`,
    prisma.$queryRaw<{ sub: string; earned: unknown }[]>`
      SELECT COALESCE(r.sub_id, '') AS sub, COALESCE(SUM(c.amount), 0) AS earned
        FROM affiliate_commissions c
        JOIN referrals r ON r.user_id = c.referred_user_id
       WHERE c.affiliate_id = ${affiliateId} AND c.reversed_at IS NULL ${since(Prisma.sql`c.earned_at`)}
       GROUP BY COALESCE(r.sub_id, '')`,
  ]);

  const rows = new Map<string, SubIdRow>();
  const row = (sub: string) => {
    if (!rows.has(sub)) rows.set(sub, { sub, clicks: 0, signups: 0, ftds: 0, ftdAmount: 0, earned: 0 });
    return rows.get(sub)!;
  };
  for (const r of clicks) row(r.sub).clicks = n(r.clicks);
  for (const r of signups) {
    const target = row(r.sub);
    target.signups = n(r.signups);
    target.ftds = n(r.ftds);
    target.ftdAmount = round2(n(r.amount));
  }
  for (const r of earned) row(r.sub).earned = round2(n(r.earned));

  return [...rows.values()].sort((a, b) => b.clicks - a.clicks || b.signups - a.signups);
}

export type ReferralRow = {
  userId: number;
  email: string;
  createdAt: Date;
  subId: string | null;
  ip: string | null;
  ftdAt: Date | null;
  ftdAmount: number | null;
  deposits: number;
  turnover: number;
  platformResult: number;
  earned: number;
};

/** One page of an affiliate's referred accounts, newest first, each with its numbers. */
export async function referralsOf(affiliateId: number, take: number, skip: number): Promise<ReferralRow[]> {
  const rows = await prisma.$queryRaw<
    {
      user_id: number;
      email: string;
      created_at: Date;
      sub_id: string | null;
      ip: string | null;
      ftd_at: Date | null;
      ftd_amount: unknown;
      deposits: unknown;
      turnover: unknown;
      result: unknown;
      earned: unknown;
    }[]
  >`
    SELECT r.user_id, u.email, r.created_at, r.sub_id, r.ip, r.ftd_at, r.ftd_amount,
           (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
             WHERE t.user_id = r.user_id AND t.kind = 'DEPOSIT' AND t.status = 'APPROVED') AS deposits,
           (SELECT COALESCE(SUM(p.invest), 0) FROM positions p JOIN balances b ON b.id = p.balance_id AND b.type = 1
             WHERE p.user_id = r.user_id AND p.closed_at > 0) AS turnover,
           (SELECT COALESCE(SUM(-p.close_profit), 0) FROM positions p JOIN balances b ON b.id = p.balance_id AND b.type = 1
             WHERE p.user_id = r.user_id AND p.closed_at > 0) AS result,
           (SELECT COALESCE(SUM(c.amount), 0) FROM affiliate_commissions c
             WHERE c.affiliate_id = r.affiliate_id AND c.referred_user_id = r.user_id AND c.reversed_at IS NULL) AS earned
      FROM referrals r
      JOIN users u ON u.id = r.user_id
     WHERE r.affiliate_id = ${affiliateId}
     ORDER BY r.id DESC
     LIMIT ${take} OFFSET ${skip}`;

  return rows.map((row) => ({
    userId: Number(row.user_id),
    email: row.email,
    createdAt: new Date(row.created_at),
    subId: row.sub_id,
    ip: row.ip,
    ftdAt: row.ftd_at ? new Date(row.ftd_at) : null,
    ftdAmount: row.ftd_amount != null ? round2(n(row.ftd_amount)) : null,
    deposits: round2(n(row.deposits)),
    turnover: round2(n(row.turnover)),
    platformResult: round2(n(row.result)),
    earned: round2(n(row.earned)),
  }));
}

export type DayRow = { day: string; clicks: number; signups: number; ftds: number; earned: number };

/** The last `days` days, one row each, oldest first — for the dashboard's bars. */
export async function dailySeries(affiliateId: number, days = 30): Promise<DayRow[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const from = utc(start);

  const [clicks, signups, ftds, earned] = await Promise.all([
    prisma.$queryRaw<{ day: string; v: unknown }[]>`
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS v FROM affiliate_clicks
       WHERE affiliate_id = ${affiliateId} AND created_at >= ${from} GROUP BY day`,
    prisma.$queryRaw<{ day: string; v: unknown }[]>`
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS v FROM referrals
       WHERE affiliate_id = ${affiliateId} AND created_at >= ${from} GROUP BY day`,
    prisma.$queryRaw<{ day: string; v: unknown }[]>`
      SELECT DATE_FORMAT(ftd_at, '%Y-%m-%d') AS day, COUNT(*) AS v FROM referrals
       WHERE affiliate_id = ${affiliateId} AND ftd_at >= ${from} GROUP BY day`,
    prisma.$queryRaw<{ day: string; v: unknown }[]>`
      SELECT DATE_FORMAT(earned_at, '%Y-%m-%d') AS day, COALESCE(SUM(amount), 0) AS v FROM affiliate_commissions
       WHERE affiliate_id = ${affiliateId} AND reversed_at IS NULL AND earned_at >= ${from} GROUP BY day`,
  ]);

  const index = (rows: { day: string; v: unknown }[]) => new Map(rows.map((row) => [row.day, n(row.v)]));
  const [c, s, f, e] = [index(clicks), index(signups), index(ftds), index(earned)];

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const key = day.toISOString().slice(0, 10);
    return { day: key, clicks: c.get(key) ?? 0, signups: s.get(key) ?? 0, ftds: f.get(key) ?? 0, earned: round2(e.get(key) ?? 0) };
  });
}
