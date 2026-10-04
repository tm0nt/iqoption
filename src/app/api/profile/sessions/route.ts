/**
 * Ending one trading session.
 *
 * The id is a bearer token for trading, so the only check that matters is that
 * the row belongs to the person asking — `deleteMany` with both the id and the
 * user does that in the write, rather than reading first and trusting what
 * came back.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[a-f0-9]{64}$/.test(id)) return NextResponse.json({ error: "bad session id" }, { status: 400 });

  const gone = await prisma.tradingSession.deleteMany({
    where: { id, userId: session.user.platformId },
  });
  if (gone.count === 0) return NextResponse.json({ error: "no such session" }, { status: 404 });

  return NextResponse.json({ ended: id });
}
