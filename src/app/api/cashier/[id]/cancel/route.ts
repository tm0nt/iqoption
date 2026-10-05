/**
 * Withdrawing a request one made oneself, while nobody has acted on it.
 *
 * A pending deposit has moved no money, so cancelling it only changes its
 * status. A pending withdrawal took its amount out of the balance when it was
 * asked for, so cancelling it gives that back — in the same database
 * transaction as the status change, and only if the status change happened.
 *
 * `status: PENDING` and the owner's id in the update's filter are the whole of
 * the check: an administrator settling the same row at the same moment leaves
 * one of the two with nothing to update, and nobody can cancel a row that is
 * not theirs.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  try {
    const row = await prisma.$transaction(async (tx) => {
      const claimed = await tx.transaction.updateMany({
        where: { id, userId: session.user.platformId, status: "PENDING" },
        data: { status: "CANCELLED", settledAt: new Date(), note: "Cancelled by the account holder." },
      });
      if (claimed.count === 0) throw new Error("NOT_PENDING");

      const row = await tx.transaction.findUniqueOrThrow({ where: { id } });
      if (row.kind === "WITHDRAWAL") {
        const wallet = await tx.balance.findUnique({ where: { id: row.balanceId }, select: { type: true } });
        if (!wallet || wallet.type !== REAL) throw new Error("NO_WALLET");
        await tx.balance.update({ where: { id: row.balanceId }, data: { amount: { increment: row.amount } } });
      }
      return row;
    });

    return NextResponse.json({ transaction: { id: row.id, status: row.status } });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_PENDING") {
      return NextResponse.json({ error: "that request is not pending" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "NO_WALLET") {
      return NextResponse.json({ error: "that wallet no longer exists" }, { status: 409 });
    }
    throw error;
  }
}
