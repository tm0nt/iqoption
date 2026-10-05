/**
 * Settling an affiliate's payout request.
 *
 * Approving says the money was sent — nothing here sends it. Rejecting puts
 * the amount back, which needs no write: the balance is computed from the
 * ledger, and a rejected request no longer counts against it.
 *
 * `status: PENDING` in the filter is the lock, as in the cashier: two
 * administrators deciding at once leave one with nothing to settle.
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
  if (body?.action !== "approve" && body?.action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 2000) : null;
  const session = await auth();

  const settled = await prisma.affiliatePayout.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: body.action === "approve" ? "APPROVED" : "REJECTED",
      note,
      settledAt: new Date(),
      settledById: session?.user?.platformId ?? null,
    },
  });
  if (settled.count === 0) return NextResponse.json({ error: "that request is not pending" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
