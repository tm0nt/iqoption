/**
 * Where an affiliate link lands.
 *
 * The middleware sends any page carrying `?ref=CODE` here with the tracking
 * parameters and the page it was going to. This records the visit, hands the
 * browser the signed click cookie, and sends it on. A code that does not track
 * — unknown, not approved, suspended, programme closed — still sends the
 * visitor on; they came to see the site, not to be told about our books.
 *
 * The redirect is relative and only to a path inside this site: `to` arrives
 * in the query string, and taking it as given would make this an open
 * redirect anyone could put our domain in front of.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CLICK_COOKIE, recordClick, safeReturnPath } from "@/lib/affiliate/tracking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const to = safeReturnPath(query.get("to"), "/");

  const result = await recordClick({
    code: query.get("ref") ?? "",
    sub: query.get("sub"),
    utmSource: query.get("utm_source"),
    utmMedium: query.get("utm_medium"),
    utmCampaign: query.get("utm_campaign"),
    landing: to,
    headers: request.headers,
  }).catch((error) => {
    console.error("could not record an affiliate click:", error);
    return null;
  });

  const response = new NextResponse(null, { status: 302, headers: { location: to, "cache-control": "no-store" } });
  if (result) {
    response.cookies.set(CLICK_COOKIE, result.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: result.maxAge,
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}
