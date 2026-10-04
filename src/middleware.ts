/**
 * What needs a session, and what needs to be kept out of one.
 *
 * Two jobs, and they pull in opposite directions:
 *
 *   - The traderoom requires a signed-in person. Without one it is a 103 MB
 *     engine booting against an account that does not exist.
 *   - The admin surface requires an administrator, which is a different thing
 *     from a session: anyone can register, and registering must not be a way to
 *     change what the platform trades.
 *   - Login and register redirect away when a session already exists, so a
 *     signed-in person is never shown a form they have no use for.
 *
 * The engine's own traffic is deliberately not matched: `/api/engine/*` and
 * `/engine/*` are read by the WASM build before any React has run, and a
 * redirect there is not a login page, it is a parse failure.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/avalon";
import { COUNTRY_HEADERS, LOCALE_COOKIE, negotiateLocale } from "@/i18n/negotiate";

/** `/pt/traderoom` -> `pt`, falling back when the path carries no locale. */
function localeOf(pathname: string) {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/*
 * Everything behind a session. The pages check again for themselves — they need
 * the account anyway — but turning someone away here saves rendering a page
 * that is only going to redirect, and keeps the list of what is private in one
 * readable place.
 */
const PROTECTED = new Set([
  "traderoom",
  "profile",
  "verification",
  "portfolio",
  "withdrawal",
  "transactions",
  "trading",
  "counting",
]);
/**
 * Paths the engine calls by a fixed, locale-free URL built into the WASM.
 * They are real routes of this app, but they are not pages and must not be
 * given a language prefix.
 */
const ENGINE_PATHS = new Set(["/v1/logout"]);

/** Pages that need an administrator, not merely a session. */
const ADMIN_ONLY = new Set(["admin"]);
const GUEST_ONLY = new Set(["login", "register", "change-password"]);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(request.auth?.user);

  /*
   * A path with no locale gets one, chosen from what we can see of the person:
   * their own earlier choice first, then what their browser asks for, then the
   * country the request appears to come from. See src/i18n/negotiate.ts for why
   * the country is last.
   *
   * The API, the engine's own files and the endpoints the engine calls by a
   * fixed path are not locale-prefixed and must never be redirected —
   * `/api/engine/stubs/...` answering a 307 is a parse failure to the WASM
   * build, not a redirect it follows, and `/v1/logout` sent to `/pt/v1/logout`
   * is a session ending one request later than the engine believes it did.
   */
  const first = pathname.split("/")[1];
  const localised =
    pathname.startsWith("/api/") || pathname.startsWith("/engine") || ENGINE_PATHS.has(pathname);
  if (!localised && !isLocale(first)) {
    const country = COUNTRY_HEADERS.map((header) => request.headers.get(header)).find(Boolean);
    const { locale: picked } = negotiateLocale({
      chosen: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get("accept-language"),
      country,
    });

    const url = request.nextUrl.clone();
    url.pathname = `/${picked}${pathname === "/" ? "/login" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api/admin")) {
    // JSON, not a redirect: this is called by tools, not by browsers, and a
    // 302 to a login page reads as a successful request with a strange body.
    if (!signedIn) {
      return NextResponse.json({ error: "authentication required" }, { status: 401 });
    }
    /*
     * 403, not 404. Hiding the route from someone who is signed in but not an
     * administrator buys nothing — they can read the source — and it turns a
     * permissions bug into a routing mystery.
     */
    if (!request.auth?.user?.isAdmin) {
      return NextResponse.json({ error: "administrator access required" }, { status: 403 });
    }
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const locale = localeOf(pathname);
  const page = isLocale(segments[0]) ? segments[1] : segments[0];

  if (page && ADMIN_ONLY.has(page)) {
    if (!signedIn) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    /*
     * Back to the traderoom rather than to a wall. Someone who is signed in and
     * not an administrator has somewhere to be, and a bare 403 page in a
     * browser reads as the site being broken.
     */
    if (!request.auth?.user?.isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/traderoom`;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (page && PROTECTED.has(page) && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    // So the login page can send them where they were going.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (page && GUEST_ONLY.has(page) && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/traderoom`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  /*
   * Everything except Next's own assets, the mirrored engine build and the
   * endpoints the engine reads. `/api/auth` is excluded because Auth.js has to
   * answer its own sign-in requests without being asked for a session first.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|engine/|engine-host/|api/auth|api/engine|sites/|storage/).*)",
  ],
};

/*
 * Node, not the edge runtime: the session is verified with `auth()`, which
 * reaches for Node crypto, and bcrypt is nowhere near the edge.
 */
export const runtime = "nodejs";
