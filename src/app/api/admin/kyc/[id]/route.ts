/**
 * Deciding one identity submission.
 *
 * Approving verifies the account; rejecting needs a reason, because the reason
 * is what the person reads on their verification page and the only thing that
 * tells them what to send next time. "Rejected" alone gets the same blurry
 * photo back.
 *
 * Only a PENDING submission is decided, and the claim on it is the status
 * change itself — an `updateMany` filtered on PENDING — in the same
 * transaction as the account's status. Two administrators deciding at once
 * leave one of them told it was already done, rather than an account approved
 * by one and rejected by the other.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  if (action === "reject" && !reason) {
    return NextResponse.json({ error: "say why, so they know what to send next time" }, { status: 400 });
  }

  const session = await auth();
  const status = action === "approve" ? "APPROVED" : "REJECTED";

  const decided = await prisma.$transaction(async (tx) => {
    const claimed = await tx.kycSubmission.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status,
        reason: action === "reject" ? reason : null,
        reviewedById: session?.user?.platformId ?? null,
        reviewedAt: new Date(),
      },
    });
    if (claimed.count === 0) return null;
    const submission = await tx.kycSubmission.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    await tx.user.update({ where: { id: submission.userId }, data: { kycStatus: status } });
    return submission;
  });

  if (!decided) {
    const exists = await prisma.kycSubmission.findUnique({ where: { id }, select: { status: true } });
    return exists
      ? NextResponse.json({ error: "already decided" }, { status: 409 })
      : NextResponse.json({ error: "no such submission" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, status });
}
