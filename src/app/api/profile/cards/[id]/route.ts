/**
 * Removing a saved card.
 *
 * The row stays, stamped as removed, so the deposits charged to it can still
 * say which card that was; the processor is asked to forget the token.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cardProvider } from "@/lib/payments/cards/provider";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const card = await prisma.paymentCard.findFirst({
    where: { id, userId: session.user.platformId, removedAt: null },
    select: { id: true, token: true, provider: true },
  });
  // Someone else's card and no card at all look the same from here.
  if (!card) return NextResponse.json({ error: "no such card" }, { status: 404 });

  await prisma.paymentCard.update({ where: { id: card.id }, data: { removedAt: new Date() } });
  const provider = cardProvider();
  if (provider?.id === card.provider) await provider.forget(card).catch(() => {});
  return NextResponse.json({ ok: true });
}
