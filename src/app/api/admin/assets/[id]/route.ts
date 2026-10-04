/**
 * One instrument: read, change, remove.
 *
 * Removing is a real delete rather than a flag, because `enabled` already
 * exists for taking an instrument off the platform without losing it — that is
 * the one to reach for. A delete is for a row that should never have been here.
 *
 * **No authentication yet.** See the note in the parent route.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assetInput } from "@/lib/admin/asset-input";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function readId(context: Context) {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const asset = await prisma.asset.findUnique({ where: { id }, include: { group: true } });
  if (!asset) return NextResponse.json({ error: `no instrument ${id}` }, { status: 404 });
  return NextResponse.json({ asset });
}

export async function PATCH(request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const parsed = assetInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // The id is the `active_id` on the wire and is referenced by every deal ever
  // opened on it; changing it would orphan them all.
  delete parsed.data.id;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no instrument ${id}` }, { status: 404 });

  const asset = await prisma.asset.update({
    where: { id },
    data: parsed.data as Parameters<typeof prisma.asset.update>[0]["data"],
  });
  return NextResponse.json({ asset });
}

export async function DELETE(_request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no instrument ${id}` }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
