/**
 * The handover between the web session and the market feed.
 *
 * The engine reads an opaque id out of `document.cookie` and sends it in
 * `authenticate`. The market server is a separate process with no access to the
 * web app's session cookie, so it cannot verify a JWT; what it can do is look an
 * id up in a table both sides share. This mints those rows.
 *
 * The id is random and carries nothing about the person: it is a bearer token
 * for a trading session, and anything derived from the user would leak.
 */
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/** Long enough that an abandoned tab keeps working, short enough to expire. */
const LIFETIME_MS = 12 * 60 * 60 * 1000;

/**
 * Issues an ssid for a signed-in person — one per browser, not per page load.
 *
 * This used to mint a fresh row every time the traderoom was opened, on the
 * reasoning that two tabs sharing a row means ending either ends both. That is
 * true, and it is also what "end this session on that device" is supposed to
 * mean. What the old rule actually produced was a Safety & Security page
 * listing twenty "active sessions" for one person reloading a page, each alive
 * for twelve hours — wrong information presented as a security feature, which
 * is the worst kind.
 *
 * So an unexpired row for the same browser is reused and its clock pushed
 * forward. One row per browser is what the page claims to show, and ending one
 * now ends that browser's trading, which is what someone pressing the cross
 * means to do.
 */
export async function mintTradingSession(userId: number): Promise<string> {
  const id = randomBytes(32).toString("hex");

  /*
   * Where it was opened from, so the Safety & Security page can show a session
   * someone might not recognise. Both are claims the client makes — a user
   * agent is a string anyone can set, and an address behind a proxy is
   * whichever one the proxy chose to forward — so neither decides anything.
   */
  const head = await headers();
  const forwarded = head.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || head.get("x-real-ip") || null;

  const userAgent = head.get("user-agent")?.slice(0, 255) ?? null;
  const expiresAt = new Date(Date.now() + LIFETIME_MS);

  /*
   * Same person, same browser, still alive. A null user agent never matches
   * another null: two callers that did not say who they are are not known to
   * be the same caller.
   */
  const existing = userAgent
    ? await prisma.tradingSession.findFirst({
        where: { userId, userAgent, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;

  if (existing) {
    await prisma.tradingSession.update({
      where: { id: existing.id },
      data: { expiresAt, ip: ip?.slice(0, 45) ?? null },
    });
    return existing.id;
  }

  await prisma.tradingSession.create({
    data: { id, userId, expiresAt, userAgent, ip: ip?.slice(0, 45) ?? null },
  });

  /*
   * Opportunistic cleanup, unawaited: expired rows are dead weight, and a
   * sweep that fails must not stop someone reaching their traderoom.
   */
  prisma.tradingSession
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});

  return id;
}
