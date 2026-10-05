/**
 * Saving a card.
 *
 * What arrives is the one-time token the processor's card fields made — never
 * the number or the security code, which only ever went to the processor. The
 * processor turns it into a card that can be charged again, and what it says
 * about the card (brand, last four, expiry, name, fingerprint) is stored next
 * to the reusable token.
 *
 * Limits, because a form that accepts cards is a form card testers find:
 * five saved cards at once, ten added a day, and the same card (by the
 * processor's fingerprint) only once per person.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cardProvider } from "@/lib/payments/cards/provider";
import { DAILY_ADDS, MAX_CARDS, savedCards } from "@/lib/payments/cards/saved";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });
  const provider = cardProvider();
  return NextResponse.json({ cards: provider ? await savedCards(session.user.platformId, provider.id) : [] });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });
  const userId = session.user.platformId;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const t = cabinetExtra(typeof body?.locale === "string" ? body.locale : "en").cards;

  const provider = cardProvider();
  if (!provider) return NextResponse.json({ error: t.unavailable }, { status: 503 });
  if (body?.provider !== provider.id || typeof body.token !== "string") {
    return NextResponse.json({ error: t.failed }, { status: 400 });
  }

  const [active, today] = await Promise.all([
    prisma.paymentCard.count({ where: { userId, removedAt: null } }),
    prisma.paymentCard.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  if (active >= MAX_CARDS) return NextResponse.json({ error: t.tooMany(MAX_CARDS) }, { status: 409 });
  if (today >= DAILY_ADDS) return NextResponse.json({ error: t.tooManyToday }, { status: 429 });

  const details = await provider.saveCard(body.token);
  if (!details) return NextResponse.json({ error: t.refused }, { status: 422 });

  const duplicate = await prisma.paymentCard.findFirst({
    where: { userId, provider: provider.id, fingerprint: details.fingerprint, removedAt: null },
    select: { id: true },
  });
  if (duplicate) {
    await provider.forget(details);
    return NextResponse.json({ error: t.duplicate }, { status: 409 });
  }

  const card = await prisma.paymentCard.create({
    data: { userId, provider: provider.id, ...details },
    select: { id: true, brand: true, last4: true, expMonth: true, expYear: true, holder: true },
  });
  return NextResponse.json({ card }, { status: 201 });
}
