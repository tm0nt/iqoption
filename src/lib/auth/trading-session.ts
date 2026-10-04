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
import { prisma } from "@/lib/db";

/** Long enough that an abandoned tab keeps working, short enough to expire. */
const LIFETIME_MS = 12 * 60 * 60 * 1000;

/**
 * Issues an ssid for a signed-in person.
 *
 * A fresh one per page load. Reusing an unexpired row would be cheaper, but the
 * engine holds its id for the life of the tab and two tabs sharing one row
 * means closing either ends both.
 */
export async function mintTradingSession(userId: number): Promise<string> {
  const id = randomBytes(32).toString("hex");

  await prisma.tradingSession.create({
    data: { id, userId, expiresAt: new Date(Date.now() + LIFETIME_MS) },
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
