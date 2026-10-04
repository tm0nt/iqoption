/**
 * Choosing a language for someone who has not chosen one.
 *
 * Three signals, in the order they deserve to be trusted:
 *
 *   1. A choice they made here, kept in a cookie. Nothing overrides it — a
 *      person who picked Portuguese on an English-configured laptop meant it.
 *   2. `Accept-Language`, which is the browser reporting what its owner reads.
 *   3. The country the request appears to come from, which is a guess about a
 *      person from a fact about a network.
 *
 * Country is last on purpose. Plenty of people read English in Brazil and
 * Portuguese in Japan, and a VPN makes the signal meaningless; it is here to
 * break a tie when the browser says nothing useful, not to overrule it.
 */
import { DEFAULT_LOCALE, isLocale } from "./avalon";
import type { AvalonLocale } from "@/types/avalon-login";

/** Where an explicit choice is remembered. */
export const LOCALE_COOKIE = "locale";

/**
 * Countries whose common language is one this site speaks.
 *
 * Only the unambiguous ones. A country that reads something we do not offer is
 * left out, so it falls through to the default rather than being guessed at.
 */
const COUNTRY_LOCALE: Record<string, AvalonLocale> = {
  BR: "pt",
  PT: "pt",
  AO: "pt",
  MZ: "pt",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  BO: "es",
  PY: "es",
  UY: "es",
  CR: "es",
  GT: "es",
  DO: "es",
};

/**
 * The locales an `Accept-Language` header asks for, best first.
 *
 * Quality values decide the order, and a tag's language subtag is what is
 * matched — `pt-BR` and `pt-PT` are both Portuguese here, because the site has
 * one Portuguese.
 */
export function preferredLocales(header: string | null | undefined): AvalonLocale[] {
  if (!header) return [];

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      // A tag with no q is q=1, which is what the specification says and what
      // every browser relies on.
      const quality = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  const out: AvalonLocale[] = [];
  for (const { tag } of ranked) {
    const language = tag.split("-")[0];
    if (isLocale(language) && !out.includes(language)) out.push(language);
  }
  return out;
}

/** The locale a country code suggests, if the site speaks it. */
export function localeForCountry(country: string | null | undefined): AvalonLocale | null {
  if (!country) return null;
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null;
}

export type LocaleSignals = {
  /** The cookie holding an explicit choice, if there is one. */
  chosen?: string | null;
  acceptLanguage?: string | null;
  /** A two-letter country code, from whatever the host puts in front. */
  country?: string | null;
};

/** The locale to use, and why — the reason is for logging, not for display. */
export function negotiateLocale(signals: LocaleSignals): { locale: AvalonLocale; from: string } {
  if (signals.chosen && isLocale(signals.chosen)) return { locale: signals.chosen, from: "cookie" };

  const [preferred] = preferredLocales(signals.acceptLanguage);
  if (preferred) return { locale: preferred, from: "accept-language" };

  const byCountry = localeForCountry(signals.country);
  if (byCountry) return { locale: byCountry, from: "country" };

  return { locale: DEFAULT_LOCALE, from: "default" };
}

/** The headers a CDN might use to report the caller's country. */
export const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-geo-country",
  "x-country-code",
  "fastly-client-country",
];
