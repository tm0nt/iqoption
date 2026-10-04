/**
 * One editorial item: change or remove.
 *
 * Removing is a real delete. `enabled` is what takes an item off the traderoom
 * while keeping it, so a delete here means the row should not have existed —
 * the same rule the instrument catalogue follows.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contentInput } from "@/lib/admin/content-input";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function readId(context: Context) {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const parsed = contentInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no item ${id}` }, { status: 404 });

  const item = await prisma.contentItem.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no item ${id}` }, { status: 404 });

  await prisma.contentItem.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
