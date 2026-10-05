/**
 * An affiliate taking back a payout request nobody has settled yet.
 *
 * Nothing to refund: the balance is computed from the ledger, and a cancelled
 * request simply stops counting against it.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  // The owner and the status are both in the filter: no read, no race.
  const cancelled = await prisma.affiliatePayout.updateMany({
    where: { id, status: "PENDING", affiliate: { userId: session.user.platformId } },
    data: { status: "CANCELLED", settledAt: new Date(), note: "Cancelled by the affiliate." },
  });
  if (cancelled.count === 0) return NextResponse.json({ error: "that request is not pending" }, { status: 409 });

  return NextResponse.json({ payout: { id, status: "CANCELLED" } });
}
