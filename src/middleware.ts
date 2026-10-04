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

/** `/pt/traderoom` -> `pt`, falling back when the path carries no locale. */
function localeOf(pathname: string) {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

const PROTECTED = new Set(["traderoom"]);
const GUEST_ONLY = new Set(["login", "register", "change-password"]);

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const signedIn = Boolean(request.auth?.user);

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
