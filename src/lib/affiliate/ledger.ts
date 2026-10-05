/**
 * What an affiliate has, and taking it out.
 *
 * The balance is not stored. It is what the ledger says has become available,
 * minus what has been paid or is waiting to be:
 *
 *   available = Σ commissions past their hold, not reversed
 *             − Σ payouts approved − Σ payouts pending
 *
 * A stored balance would be a second record of the same thing, and the first
 * time the two disagreed there would be no way to say which was right. A
 * computed one cannot drift; it can only be recomputed.
 *
 * The price of computing it is that two payout requests racing for the same
 * money would both see it. `requestPayout` closes that by locking the
 * affiliate's row for the length of the check and the write, so the second
 * request waits for the first and then sees what is left.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { round2 } from "@/lib/cabinet/money";

export type AffiliateBalance = {
  /** Everything earned and not reversed, held or not. */
  earned: number;
  /** Earned, still inside its hold period. */
  held: number;
  paid: number;
  pending: number;
  /** What can be asked for now. Can be negative after a losing month of revenue share. */
  available: number;
};

type Client = Prisma.TransactionClient | typeof prisma;

export async function affiliateBalance(affiliateId: number, client: Client = prisma, now = new Date()): Promise<AffiliateBalance> {
  const [ready, held, payouts] = await Promise.all([
    client.affiliateCommission.aggregate({
      where: { affiliateId, reversedAt: null, availableAt: { lte: now } },
      _sum: { amount: true },
    }),
    client.affiliateCommission.aggregate({
      where: { affiliateId, reversedAt: null, availableAt: { gt: now } },
      _sum: { amount: true },
    }),
    client.affiliatePayout.groupBy({
      by: ["status"],
      where: { affiliateId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
  ]);

  const sumOf = (status: string) => Number(payouts.find((row) => row.status === status)?._sum.amount ?? 0);
  const readyAmount = Number(ready._sum.amount ?? 0);
  const heldAmount = Number(held._sum.amount ?? 0);
  const paid = sumOf("APPROVED");
  const pending = sumOf("PENDING");

  return {
    earned: round2(readyAmount + heldAmount),
    held: round2(heldAmount),
    paid: round2(paid),
    pending: round2(pending),
    available: round2(readyAmount - paid - pending),
  };
}

export class PayoutRefused extends Error {
  constructor(
    public readonly reason: "inactive" | "below-minimum" | "insufficient",
    public readonly available = 0,
  ) {
    super(reason);
  }
}

/**
 * Records a payout request, if the money is there.
 *
 * @throws PayoutRefused with the reason, for the route to put into words.
 */
export async function requestPayout(input: {
  affiliateId: number;
  amount: number;
  minimum: number;
  currency: string;
  method: string;
  destination: string;
}) {
  if (input.amount < input.minimum) throw new PayoutRefused("below-minimum");

  return prisma.$transaction(async (tx) => {
    /*
     * The lock. Every payout request for this affiliate queues behind it, so
     * the balance read below is the balance at the moment of the write.
     */
    const locked = await tx.$queryRaw<{ id: number; status: string }[]>`
      SELECT id, status FROM affiliates WHERE id = ${input.affiliateId} FOR UPDATE`;
    if (!locked[0] || locked[0].status !== "ACTIVE") throw new PayoutRefused("inactive");

    const balance = await affiliateBalance(input.affiliateId, tx);
    if (input.amount > balance.available) throw new PayoutRefused("insufficient", balance.available);

    return tx.affiliatePayout.create({
      data: {
        affiliateId: input.affiliateId,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        method: input.method,
        destination: input.destination,
      },
    });
  });
}

/** The same figures for many affiliates at once, for the admin's table. */
export async function balancesFor(affiliateIds: number[], now = new Date()): Promise<Map<number, AffiliateBalance>> {
  const out = new Map<number, AffiliateBalance>();
  if (affiliateIds.length === 0) return out;

  const [ready, held, payouts] = await Promise.all([
    prisma.affiliateCommission.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: affiliateIds }, reversedAt: null, availableAt: { lte: now } },
      _sum: { amount: true },
    }),
    prisma.affiliateCommission.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: affiliateIds }, reversedAt: null, availableAt: { gt: now } },
      _sum: { amount: true },
    }),
    prisma.affiliatePayout.groupBy({
      by: ["affiliateId", "status"],
      where: { affiliateId: { in: affiliateIds }, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    }),
  ]);

  for (const id of affiliateIds) {
    const r = Number(ready.find((row) => row.affiliateId === id)?._sum.amount ?? 0);
    const h = Number(held.find((row) => row.affiliateId === id)?._sum.amount ?? 0);
    const paid = Number(payouts.find((row) => row.affiliateId === id && row.status === "APPROVED")?._sum.amount ?? 0);
    const pending = Number(payouts.find((row) => row.affiliateId === id && row.status === "PENDING")?._sum.amount ?? 0);
    out.set(id, {
      earned: round2(r + h),
      held: round2(h),
      paid: round2(paid),
      pending: round2(pending),
      available: round2(r - paid - pending),
    });
  }
  return out;
}
