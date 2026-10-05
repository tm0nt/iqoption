/**
 * Settling one cashier request.
 *
 * The money moves here, so the four cases are spelled out rather than folded
 * into one update. They are not symmetrical, because the two kinds debit at
 * different moments:
 *
 *   deposit  + approve -> credit the wallet, with the promo bonus if it earned
 *                         one. Nothing was credited when it was requested, on
 *                         purpose: a deposit that credits before any money
 *                         arrives is how a platform gives itself away.
 *   deposit  + reject  -> nothing to undo.
 *   withdraw + approve -> nothing to move. The balance left when it was asked
 *                         for, so that the same money cannot be asked for
 *                         twice. The person is paid `amount - fee`.
 *   withdraw + reject  -> give back all of it, fee included.
 *
 * Only a PENDING row is acted on, and the status change is part of the same
 * database transaction as the money. Two administrators clicking at once leave
 * one of them with nothing to settle rather than paying twice.
 *
 * An approved deposit is also the moment an affiliate's referral becomes a
 * first-time depositor, which is recorded in the same transaction and followed
 * — after the response — by the affiliate's postback and a pass of the
 * commission accrual, so a CPA it qualifies for appears straight away.
 */
import { NextResponse, after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";
import { recordFirstDeposit } from "@/lib/affiliate/tracking";
import { firePostback } from "@/lib/affiliate/postback";
import { accrueQuietly } from "@/lib/affiliate/accrual";

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

  const session = await auth();
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  const status = action === "approve" ? "APPROVED" : "REJECTED";
  const now = new Date();

  try {
    const { row, firstDeposit } = await prisma.$transaction(async (tx) => {
      /*
       * The status change is the lock. `updateMany` with `status: PENDING` in
       * the filter either matches a row nobody has settled yet or matches
       * nothing; reading first and writing second would let two approvals
       * both pass the read.
       */
      const claimed = await tx.transaction.updateMany({
        where: { id, status: "PENDING" },
        data: { status, note, settledAt: now, settledById: session?.user?.platformId ?? null },
      });
      if (claimed.count === 0) throw new Error("NOT_PENDING");

      const row = await tx.transaction.findUniqueOrThrow({ where: { id } });

      const credits = row.kind === "DEPOSIT" && action === "approve";
      const refunds = row.kind === "WITHDRAWAL" && action === "reject";
      let firstDeposit = false;

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

        let credit = row.amount;

        /*
         * A promo bonus is paid with the deposit that earned it, and only once
         * per person per code: the use is recorded here, and `skipDuplicates`
         * turning the insert into nothing means the code was already spent —
         * by another deposit approved first — so this one pays no bonus.
         */
        if (credits && row.promoCodeId && row.bonus.gt(0)) {
          const used = await tx.promoCodeUse.createMany({
            data: [{ promoCodeId: row.promoCodeId, userId: row.userId }],
            skipDuplicates: true,
          });
          if (used.count > 0) credit = credit.plus(row.bonus);
          else await tx.transaction.update({ where: { id }, data: { bonus: new Prisma.Decimal(0) } });
        }

        await tx.balance.update({
          where: { id: row.balanceId },
          data: { amount: { increment: credit } },
        });

        if (credits) firstDeposit = await recordFirstDeposit(tx, row.userId, row.amount, now);
      }

      return { row, firstDeposit };
    });

    if (firstDeposit) {
      after(async () => {
        const referral = await prisma.referral.findUnique({ where: { userId: row.userId } });
        if (!referral) return;
        await firePostback(referral.affiliateId, "ftd", {
          userId: row.userId,
          clickId: referral.clickId,
          subId: referral.subId,
          amount: Number(row.amount),
          currency: row.currency,
        });
        await accrueQuietly(referral.affiliateId);
      });
    } else if (row.kind === "DEPOSIT" && action === "approve") {
      // A later deposit can be the one that crosses the CPA's qualifying line.
      after(async () => {
        const referral = await prisma.referral.findUnique({ where: { userId: row.userId }, select: { affiliateId: true } });
        if (referral) await accrueQuietly(referral.affiliateId);
      });
    }

    return NextResponse.json({ transaction: row });
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
