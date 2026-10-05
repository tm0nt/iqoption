/**
 * Turning what referred people did into lines on their affiliate's ledger.
 *
 * Two kinds of line come from here:
 *
 *   - REVSHARE, one per settled deal on a referred person's *real* wallet. The
 *     platform's result on that deal is minus the trader's `close_profit`: a
 *     losing deal is the stake, a winning one the payout over the stake taken
 *     back. The affiliate's line is their percentage of it, signed the same way.
 *   - CPA, once per referred person, when their approved deposits (and, if the
 *     programme asks, their real turnover) cross the qualifying line.
 *
 * Nothing calls this at the moment money moves. Deals are settled by the market
 * server, a separate process that does not know affiliates exist, and coupling
 * it to them would put a commission write in the one loop that must never
 * stall. Instead this reads what has happened and writes what is missing. It is
 * safe to run at any time and any number of times at once: every line is keyed
 * by its source in a unique index, so a second run finds nothing to add and two
 * concurrent runs cannot both add the same line.
 *
 * A line is written even when the affiliate's plan does not pay that kind —
 * with an amount of zero. That is what stops a later change of plan from paying
 * retroactively for deals that happened under the old one; the zero line is the
 * record that the deal was looked at and earned nothing. Lists hide them.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/cabinet/money";
import { affiliateProgram, paysCpa, paysRevshare, termsFor } from "./program";
import type { AffiliateProgram, CommissionPlanName } from "./program-types";
import { firePostback } from "./postback";

/** How many deals one pass picks up. The rest wait for the next pass. */
const BATCH = 2_000;

type DealRow = {
  id: number;
  user_id: number;
  close_profit: unknown;
  currency: string;
  closed_at: number;
  affiliate_id: number;
  status: string;
  plan: CommissionPlanName | null;
  cpa_amount: unknown;
  revshare_percent: unknown;
};

type CpaRow = {
  user_id: number;
  affiliate_id: number;
  status: string;
  plan: CommissionPlanName | null;
  cpa_amount: unknown;
  revshare_percent: unknown;
  deposits: unknown;
  turnover: unknown;
};

const days = (n: number) => n * 86_400_000;

/** The affiliate's own terms, from a raw row's column names. */
const own = (row: { plan: CommissionPlanName | null; cpa_amount: unknown; revshare_percent: unknown }) => ({
  plan: row.plan,
  cpaAmount: row.cpa_amount,
  revsharePercent: row.revshare_percent,
});

async function accrueRevshare(program: AffiliateProgram, affiliateId?: number) {
  const scope = affiliateId ? Prisma.sql`AND r.affiliate_id = ${affiliateId}` : Prisma.empty;

  /*
   * Only deals opened after the person was referred, and only on a real
   * wallet: practice money is not money, and a tournament is played with
   * tournament money.
   */
  const deals = await prisma.$queryRaw<DealRow[]>`
    SELECT p.id, p.user_id, p.close_profit, p.currency, p.closed_at,
           r.affiliate_id, a.status, a.plan, a.cpa_amount, a.revshare_percent
      FROM positions p
      JOIN referrals r ON r.user_id = p.user_id
      JOIN affiliates a ON a.id = r.affiliate_id
      JOIN balances b ON b.id = p.balance_id AND b.type = 1
      LEFT JOIN affiliate_commissions c ON c.kind = 'REVSHARE' AND c.source_id = p.id
     WHERE p.closed_at > 0
       AND c.id IS NULL
       AND p.created_at >= r.created_at
       ${scope}
     ORDER BY p.id
     LIMIT ${BATCH}`;

  if (deals.length === 0) return 0;

  const now = new Date();
  const rows: Prisma.AffiliateCommissionCreateManyInput[] = deals.map((deal) => {
    const terms = termsFor(program, own(deal));
    const rate = paysRevshare(terms.plan) ? terms.revsharePercent : 0;
    const platform = round2(-Number(deal.close_profit ?? 0));
    const earnedAt = new Date(Number(deal.closed_at) * 1000);
    return {
      affiliateId: Number(deal.affiliate_id),
      referredUserId: Number(deal.user_id),
      kind: "REVSHARE",
      amount: new Prisma.Decimal(round2((platform * rate) / 100)),
      base: new Prisma.Decimal(platform),
      rate: new Prisma.Decimal(rate),
      currency: deal.currency,
      sourceId: Number(deal.id),
      earnedAt,
      availableAt: new Date(earnedAt.getTime() + days(program.holdDays)),
      /*
       * A suspended affiliate's line is written already reversed. It still
       * marks the deal as looked at — so reactivating them does not pay out
       * for the time they were suspended — and an administrator who decides
       * otherwise can restore it line by line.
       */
      reversedAt: deal.status === "SUSPENDED" ? now : null,
      note: deal.status === "SUSPENDED" ? "affiliate suspended" : null,
    };
  });

  const written = await prisma.affiliateCommission.createMany({ data: rows, skipDuplicates: true });
  return written.count;
}

async function accrueCpa(program: AffiliateProgram, affiliateId?: number) {
  const scope = affiliateId ? Prisma.sql`AND r.affiliate_id = ${affiliateId}` : Prisma.empty;

  // People with a first deposit and no CPA line yet, with what they have done.
  const candidates = await prisma.$queryRaw<CpaRow[]>`
    SELECT r.user_id, r.affiliate_id, a.status, a.plan, a.cpa_amount, a.revshare_percent,
           (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
             WHERE t.user_id = r.user_id AND t.kind = 'DEPOSIT' AND t.status = 'APPROVED') AS deposits,
           (SELECT COALESCE(SUM(p.invest), 0) FROM positions p
              JOIN balances b ON b.id = p.balance_id AND b.type = 1
             WHERE p.user_id = r.user_id AND p.closed_at > 0) AS turnover
      FROM referrals r
      JOIN affiliates a ON a.id = r.affiliate_id
      LEFT JOIN affiliate_commissions c ON c.kind = 'CPA' AND c.source_id = r.user_id
     WHERE r.ftd_at IS NOT NULL
       AND c.id IS NULL
       ${scope}
     LIMIT ${BATCH}`;

  let written = 0;
  const now = new Date();

  for (const row of candidates) {
    const deposits = Number(row.deposits ?? 0);
    const turnover = Number(row.turnover ?? 0);
    if (deposits < program.cpaMinDeposit || turnover < program.cpaMinTurnover) continue;

    const terms = termsFor(program, own(row));
    const amount = paysCpa(terms.plan) ? terms.cpaAmount : 0;
    const suspended = row.status === "SUSPENDED";

    try {
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: Number(row.affiliate_id),
          referredUserId: Number(row.user_id),
          kind: "CPA",
          amount: new Prisma.Decimal(amount),
          base: new Prisma.Decimal(round2(deposits)),
          currency: program.currency,
          sourceId: Number(row.user_id),
          earnedAt: now,
          availableAt: new Date(now.getTime() + days(program.holdDays)),
          reversedAt: suspended ? now : null,
          note: suspended ? "affiliate suspended" : null,
        },
      });
      written += 1;
      if (amount > 0 && !suspended) {
        await firePostback(Number(row.affiliate_id), "cpa", {
          userId: Number(row.user_id),
          amount,
          currency: program.currency,
        });
      }
    } catch (error) {
      // Another pass wrote it first. That is the unique key doing its job.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }

  return written;
}

/**
 * Brings the ledger up to date. Pass an affiliate to look at theirs alone.
 *
 * @returns how many lines were written.
 */
export async function accrueCommissions(affiliateId?: number) {
  const program = await affiliateProgram();
  const revshare = await accrueRevshare(program, affiliateId);
  const cpa = await accrueCpa(program, affiliateId);
  return revshare + cpa;
}

/** The same, for a page that would rather show slightly old numbers than an error. */
export async function accrueQuietly(affiliateId?: number) {
  try {
    return await accrueCommissions(affiliateId);
  } catch (error) {
    console.error("affiliate accrual failed:", error);
    return 0;
  }
}
