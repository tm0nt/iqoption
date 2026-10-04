/**
 * The instrument catalogue, for an administrator.
 *
 * GET lists every instrument with its group; POST creates one. Editing and
 * deleting a single instrument live at `[id]/route.ts`.
 *
 * A change here does not reach a running market feed on its own: that process
 * reads the catalogue when it starts. Call `POST /api/admin/reload` afterwards,
 * or restart it. See docs/engine-host-pendencias.md.
 *
 * **This surface has no authentication yet.** It must not be exposed publicly
 * before it does — anyone who can reach it can change what the platform trades
 * and at what payout.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assetInput } from "@/lib/admin/asset-input";

export const dynamic = "force-dynamic";

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: { group: true },
    orderBy: [{ groupId: "asc" }, { priority: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const parsed = assetInput(await request.json().catch(() => null), { requireId: true });
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await prisma.asset.findUnique({ where: { id: parsed.data.id as number } });
  if (existing) {
    return NextResponse.json({ error: `instrument ${parsed.data.id} already exists` }, { status: 409 });
  }

  const asset = await prisma.asset.create({ data: parsed.data as Parameters<typeof prisma.asset.create>[0]["data"] });
  return NextResponse.json({ asset }, { status: 201 });
}
