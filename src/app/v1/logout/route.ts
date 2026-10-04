/**
 * The logout the engine already asks for.
 *
 * The traderoom's "Log Out" is drawn by the engine, not by React, and it ends a
 * session the way the broker's own backend expects: `POST /v1/logout`, and then
 * a navigation to `/traderoom/` — the engine's single idea of where a person
 * belongs. It never asks where to go next, so the only way to land them on the
 * login page is to make that navigation arrive without a session; the
 * middleware then turns it away like any other anonymous request.
 *
 * So this does the real work and answers quickly. `signOut` clears the session
 * cookie on this response and fires the `signOut` event in src/auth.ts, which
 * deletes the trading sessions — without that the ssid the engine was handed
 * would keep opening deals on the account for another twelve hours.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { signOut } from "@/auth";
import { isLocale } from "@/i18n/avalon";
import { LOCALE_COOKIE } from "@/i18n/negotiate";

export async function POST() {
  // `redirect: false` because the caller is the engine's HTTP client, which
  // wants a body; a 302 to a login page reads to it as a successful logout with
  // a strange answer, and it would follow it in the background for nothing.
  await signOut({ redirect: false });
  const response = NextResponse.json({ isSuccessful: true, result: true });

  /*
   * Remember the language they were reading.
   *
   * The engine navigates to `/traderoom/` with no locale in it, so without this
   * the negotiation starts over from the browser's headers and someone who was
   * in the English traderoom is shown a Portuguese login. The referer is the
   * traderoom they just left, and its first segment is the only record of the
   * language they were actually in.
   */
  const referer = (await headers()).get("referer");
  const from = referer ? new URL(referer).pathname.split("/")[1] : undefined;
  if (from && isLocale(from)) {
    response.cookies.set(LOCALE_COOKIE, from, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  return response;
}
