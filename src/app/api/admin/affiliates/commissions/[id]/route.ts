/**
 * Taking a commission back, or restoring one.
 *
 * A reversed line stays on the ledger and stops counting, so the history
 * still explains the balance. A line already paid out can be reversed too: the
 * balance goes negative and the next commissions pay it back, which is what a
 * clawback is.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.action !== "reverse" && body?.action !== "restore") {
    return NextResponse.json({ error: "action must be reverse or restore" }, { status: 400 });
  }

  const changed = await prisma.affiliateCommission.updateMany({
    where: { id, reversedAt: body.action === "reverse" ? null : { not: null } },
    data: body.action === "reverse" ? { reversedAt: new Date() } : { reversedAt: null },
  });
  if (changed.count === 0) return NextResponse.json({ error: "nothing to change" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
