/**
 * A person's saved cards, as the pages show them.
 */
import { prisma } from "@/lib/db";
import { isBrand, isExpired, type SavedCard } from "./card-types";

/** Enough for a few real cards; more than this is what card testing looks like. */
export const MAX_CARDS = 5;
/** Cards added in a day, removed ones included, so remove-and-add cannot get round it. */
export const DAILY_ADDS = 10;

export async function savedCards(userId: number, provider: string): Promise<SavedCard[]> {
  const rows = await prisma.paymentCard.findMany({
    where: { userId, provider, removedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, brand: true, last4: true, expMonth: true, expYear: true, holder: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    brand: isBrand(row.brand) ? row.brand : "other",
    last4: row.last4,
    expMonth: row.expMonth,
    expYear: row.expYear,
    holder: row.holder,
    expired: isExpired(row.expMonth, row.expYear),
  }));
}
