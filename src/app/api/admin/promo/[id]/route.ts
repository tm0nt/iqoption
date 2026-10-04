/** One promo code: change or remove. */
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { promoInput } from "@/lib/admin/promo-input";

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

  const parsed = promoInput(await request.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no code ${id}` }, { status: 404 });

  const code = await prisma.promoCode.update({
    where: { id },
    data: parsed.data as Prisma.PromoCodeUpdateInput,
  });
  return NextResponse.json({ code });
}

export async function DELETE(_request: Request, context: Context) {
  const id = await readId(context);
  if (id === null) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: `no code ${id}` }, { status: 404 });

  // The uses go with it: a record that someone used a code that no longer
  // exists is not a record of anything.
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
