/**
 * Ending the web session of an account that is no longer active.
 *
 * The cabinet sends someone here when the row behind their session says the
 * account was closed or disabled. A GET that signs people out is normally a
 * gift to anyone who can embed an image, so this one checks first and only
 * ends a session whose account is actually gone; for an active account it is
 * a redirect to the traderoom and nothing else.
 */
import { NextResponse, type NextRequest } from "next/server";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/avalon";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get("locale");
  const locale = asked && isLocale(asked) ? asked : DEFAULT_LOCALE;

  const session = await auth();
  if (session?.user) {
    const user = await prisma.user.findUnique({ where: { id: session.user.platformId }, select: { isActive: true } });
    if (user?.isActive) {
      return new NextResponse(null, { status: 302, headers: { location: `/${locale}/traderoom` } });
    }
    await signOut({ redirect: false });
  }

  return new NextResponse(null, { status: 302, headers: { location: `/${locale}/login`, "cache-control": "no-store" } });
}
