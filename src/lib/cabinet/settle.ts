/**
 * Settling one cashier request — the one place money moves for a deposit or
 * a withdrawal.
 *
 * Used by the admin's cashier, where a person decides, and by a card deposit,
 * where the processor's answer decides. Both go through here so that an
 * approved card charge credits the wallet, pays the promo bonus and counts as
 * a first deposit for the affiliate exactly as a deposit approved by hand
 * does. The four cases, and why they are not symmetrical:
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
 * database transaction as the money. Two settlements at once leave one of
 * them with nothing to settle rather than paying twice.
 *
 * An approved deposit is also the moment an affiliate's referral becomes a
 * first-time depositor, which is recorded in the same transaction and followed
 * — after the response — by the affiliate's postback and a pass of the
 * commission accrual, so a CPA it qualifies for appears straight away.
 */
import { after } from "next/server";
import { Prisma, type Transaction } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { REAL } from "@/lib/cabinet/wallet";
import { recordFirstDeposit } from "@/lib/affiliate/tracking";
import { firePostback } from "@/lib/affiliate/postback";
import { accrueQuietly } from "@/lib/affiliate/accrual";

export type SettleFailure = "NOT_PENDING" | "NOT_REAL" | "NO_WALLET";
export type SettleResult = { ok: true; row: Transaction } | { ok: false; reason: SettleFailure };

export async function settleTransaction(
  id: number,
  action: "approve" | "reject",
  { by, note, providerRef }: { by: number | null; note: string | null; providerRef?: string | null },
): Promise<SettleResult> {
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
        data: { status, note, settledAt: now, settledById: by, ...(providerRef ? { providerRef } : {}) },
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

    return { ok: true, row };
  } catch (error) {
    if (error instanceof Error && (error.message === "NOT_PENDING" || error.message === "NOT_REAL" || error.message === "NO_WALLET")) {
      return { ok: false, reason: error.message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      // The wallet is gone but the record of the request is not; see the note
      // on `balanceId` in the schema.
      return { ok: false, reason: "NO_WALLET" };
    }
    throw error;
  }
}
