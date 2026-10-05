/**
 * Everything the platform holds about the person asking, as a file.
 *
 * What "Access My Data" on the Personal Data page means: not a page that shows
 * some of it, but the whole record, in a form they can keep. The password hash
 * is the one field left out — it is about them, but it is not information to
 * them, and a file people download and forward is the wrong place for it.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const id = session.user.platformId;
  const [user, balances, transactions, positions, sessions, referral, affiliate] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        citizenship: true,
        isUsPerson: true,
        kycStatus: true,
        phone: true,
        phoneCountry: true,
        phoneVerified: true,
        locale: true,
        publicProfile: true,
        displayName: true,
        notifications: true,
        avatarUrl: true,
        createdAt: true,
        closedAt: true,
        deletionRequestedAt: true,
      },
    }),
    prisma.balance.findMany({ where: { userId: id }, select: { id: true, type: true, amount: true, currency: true } }),
    prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, kind: true, status: true, amount: true, fee: true, bonus: true, currency: true, method: true, destination: true, createdAt: true, settledAt: true },
    }),
    prisma.position.findMany({
      where: { userId: id },
      orderBy: { openTime: "desc" },
      take: 5000,
      select: { id: true, activeId: true, direction: true, invest: true, profitPercent: true, closeProfit: true, currency: true, openTime: true, closedAt: true, status: true },
    }),
    prisma.tradingSession.findMany({ where: { userId: id }, select: { createdAt: true, lastSeenAt: true, userAgent: true, ip: true } }),
    prisma.referral.findUnique({ where: { userId: id }, select: { createdAt: true, subId: true, affiliate: { select: { code: true } } } }),
    prisma.affiliate.findUnique({ where: { userId: id }, select: { code: true, status: true, createdAt: true, postbackUrl: true } }),
  ]);

  const body = JSON.stringify(
    { exportedAt: new Date(), account: user, wallets: balances, transactions, deals: positions, tradingSessions: sessions, referredBy: referral, affiliate },
    // Decimals and big integers become plain numbers and strings.
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );

  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="my-data-${id}.json"`,
      "cache-control": "no-store",
    },
  });
}
