/**
 * The four buttons on Account Settings.
 *
 * Each is a decision about the account itself rather than a setting, so each
 * is named and handled rather than folded into a generic update:
 *
 *   reroll — pick another public name.
 *   reset  — forget the platform settings, so the traderoom opens as new.
 *   close  — the owner locking themselves out. Reversible by support.
 *   delete — a request, recorded. Erasing someone is a human decision, and a
 *            button that erased an account the moment it was pressed would be
 *            a button that erases accounts by accident.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/*
 * The name is generated, not the person's own: a leaderboard should not
 * publish who someone is. Two short lists make enough combinations that a
 * reroll feels like one.
 */
const FIRST = [
  "Noah", "Ethan", "Mia", "Liam", "Ava", "Lucas", "Nora", "Caleb", "Iris", "Owen",
  "Zara", "Felix", "Luna", "Hugo", "Elsa", "Mateo", "Vera", "Jonas", "Alma", "Theo",
];
const LAST = [
  "Thomas", "Rivers", "Hale", "Brooks", "Vance", "Castro", "Keller", "Moss", "Quinn", "Reyes",
  "Novak", "Ellis", "Prado", "Sato", "Lindt", "Okafor", "Barros", "Nilsen", "Duarte", "Mendes",
];

export function generateName() {
  const first = FIRST[Math.floor(Math.random() * FIRST.length)];
  const last = LAST[Math.floor(Math.random() * LAST.length)];
  return `${first} ${last}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const id = session.user.platformId;

  if (action === "reroll") {
    const displayName = generateName();
    await prisma.user.update({ where: { id }, data: { displayName } });
    return NextResponse.json({ displayName });
  }

  if (action === "reset") {
    /*
     * The traderoom's own settings live on the market server, in memory, keyed
     * by account — there is no table to clear here. What this can do is drop
     * the trading sessions, which is what makes the engine ask for its
     * defaults again the next time it is opened.
     */
    await prisma.tradingSession.deleteMany({ where: { userId: id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "close") {
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { isActive: false, closedAt: new Date() } }),
      // The web session is a signed token and expires on its own; the trading
      // session is a row, and leaving it would let the engine keep trading on
      // an account that is closed.
      prisma.tradingSession.deleteMany({ where: { userId: id } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const open = await prisma.position.count({ where: { userId: id, closedAt: 0 } });
    if (open > 0) {
      return NextResponse.json(
        { error: `close your ${open} open position${open === 1 ? "" : "s"} first` },
        { status: 409 },
      );
    }
    await prisma.user.update({ where: { id }, data: { deletionRequestedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: `unknown action ${action}` }, { status: 400 });
}
