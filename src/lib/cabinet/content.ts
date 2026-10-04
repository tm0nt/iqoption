/**
 * Editorial content, as the traderoom asks for it.
 *
 * The panels in the engine's left bar — webinars, tutorials, news, help, the
 * promo banners — are all lists of dated items an administrator writes. This
 * reads them, and the per-panel shaping lives beside each caller, because the
 * engine describes the same item differently in each place.
 */
import { prisma } from "@/lib/db";
import type { ContentKind } from "@/generated/prisma/enums";

export type ContentQuery = {
  kind: ContentKind;
  /** The language the traderoom is in. Items with no locale answer every one. */
  locale?: string | null;
  limit?: number;
  /** Past webinars belong under HISTORY, so a caller can ask for either side. */
  when?: "upcoming" | "past" | "any";
};

/**
 * The items a panel should show.
 *
 * Disabled rows and expired ones never come back — an editor unticking
 * "enabled" is the one control that has to work without thinking about it.
 */
export async function contentItems({ kind, locale, limit = 50, when = "any" }: ContentQuery) {
  const now = new Date();

  return prisma.contentItem.findMany({
    where: {
      kind,
      enabled: true,
      // Null means every language; a row with one answers only its own.
      ...(locale ? { OR: [{ locale: null }, { locale }] } : {}),
      ...(when === "upcoming" ? { startsAt: { gte: now } } : {}),
      ...(when === "past" ? { startsAt: { lt: now } } : {}),
      // An expiry is optional, so "not expired" has to admit a null.
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ priority: "desc" }, { startsAt: "desc" }, { id: "desc" }],
    take: Math.min(limit, 200),
  });
}

export type ContentRow = Awaited<ReturnType<typeof contentItems>>[number];

/** Seconds since the epoch, which is how every engine frame carries a time. */
export function epoch(date: Date | null | undefined) {
  return date ? Math.floor(date.getTime() / 1000) : 0;
}
