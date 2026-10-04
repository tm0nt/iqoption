/**
 * Settling one cashier request.
 *
 * The money moves here, so the four cases are spelled out rather than folded
 * into one update. They are not symmetrical, because the two kinds debit at
 * different moments:
 *
 *   deposit  + approve -> credit the wallet. Nothing was credited when it was
 *                         requested, on purpose: a deposit that credits before
 *                         any money arrives is how a platform gives itself away.
 *   deposit  + reject  -> nothing to undo.
 *   withdraw + approve -> nothing to move. The balance left when it was asked
 *                         for, so that the same money cannot be asked for twice.
 *   withdraw + reject  -> give it back.
 *
 * Only a PENDING row is acted on, and the status change is part of the same
 * database transaction as the money. Two administrators clicking at once leave
 * one of them with nothing to settle rather than paying twice.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id: raw } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  const status = action === "approve" ? "APPROVED" : "REJECTED";

  try {
    const settled = await prisma.$transaction(async (tx) => {
      /*
       * The status change is the lock. `updateMany` with `status: PENDING` in
       * the filter either matches a row nobody has settled yet or matches
       * nothing; reading first and writing second would let two approvals
       * both pass the read.
       */
      const claimed = await tx.transaction.updateMany({
        where: { id, status: "PENDING" },
        data: { status, note, settledAt: new Date() },
      });
      if (claimed.count === 0) throw new Error("NOT_PENDING");

      const row = await tx.transaction.findUniqueOrThrow({ where: { id } });

      const credits = row.kind === "DEPOSIT" && action === "approve";
      const refunds = row.kind === "WITHDRAWAL" && action === "reject";

      if (credits || refunds) {
        /*
         * Only ever a real wallet.
         *
         * Practice money is not money: a deposit paid into it is value created
         * from nothing, and a withdrawal out of it should never have been
         * taken. The cashier names the real wallet when it writes a request,
         * so a row pointing anywhere else is either older than that rule or
         * wrong — and both are reasons to stop rather than to pay.
         *
         * Checked here and not at the request, because this is where the money
         * actually moves, and a check that is not where the money is is a
         * check that can be routed around.
         */
        const wallet = await tx.balance.findUnique({
          where: { id: row.balanceId },
          select: { type: true },
        });
        if (!wallet) throw new Error("NO_WALLET");
        if (wallet.type !== REAL) throw new Error("NOT_REAL");

        await tx.balance.update({
          where: { id: row.balanceId },
          data: { amount: { increment: row.amount } },
        });
      }

      return row;
    });

    return NextResponse.json({ transaction: settled });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_PENDING") {
      return NextResponse.json({ error: "that request is not pending" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "NOT_REAL") {
      return NextResponse.json(
        { error: "that request points at a practice wallet, and money does not move through one" },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "NO_WALLET") {
      return NextResponse.json({ error: "that wallet no longer exists" }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      // The wallet is gone but the record of the request is not; see the note
      // on `balanceId` in the schema.
      return NextResponse.json({ error: "that wallet no longer exists" }, { status: 409 });
    }
    throw error;
  }
}
