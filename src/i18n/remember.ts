"use client";

import { LOCALE_COOKIE } from "./negotiate";

/**
 * Remembers that someone picked a language.
 *
 * Written from the browser rather than by a server action, because the choice
 * is made by following an ordinary link — the navigation would be over before
 * a round trip to record it came back. A year is long enough that nobody is
 * asked twice, and it is a preference, not a credential.
 */
export function rememberLocale(locale: string) {
  try {
    const year = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${year}; samesite=lax`;
  } catch {
    // Storage can be blocked; the language still changes for this navigation.
  }
}
