/**
 * Numbers and dates, written the way the page's language writes them.
 *
 * The cabinet used to format with `toLocaleString()` and no argument, which is
 * the *server's* locale — so a Brazilian visitor read dates in whatever the
 * container happened to be set to, and the same page rendered differently on
 * the server and in the browser. Every page asks here instead, by the route's
 * own language.
 *
 * No server imports: client components format too.
 */

const TAGS: Record<string, string> = { en: "en-US", pt: "pt-BR", es: "es-ES" };

/** The BCP 47 tag for one of the platform's languages. */
export function localeTag(locale: string) {
  return TAGS[locale] ?? "en-US";
}

/** `1,234.50 USD` in English, `1.234,50 USD` in Portuguese. */
export function formatMoney(amount: number | string, currency: string, locale: string) {
  const value = Number(amount);
  const number = new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
  return `${number} ${currency}`;
}

/** A plain number with two decimals, for a field's placeholder. */
export function formatNumber(amount: number, locale: string, digits = 2) {
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Date and time, to the minute. */
export function formatDateTime(date: Date | string, locale: string) {
  return new Date(date).toLocaleString(localeTag(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "October 2, 2026" in English and the equivalent elsewhere. */
export function formatLongDate(date: Date | string, locale: string) {
  return new Date(date).toLocaleDateString(localeTag(locale), { year: "numeric", month: "long", day: "numeric" });
}

/** `2026-10-05`, the value an `<input type="date">` takes. */
export function isoDay(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Most of a destination hidden, the ends kept.
 *
 * Enough for the person to recognise their own key or address in a list, not
 * enough for anyone reading over their shoulder to copy it.
 */
export function maskDestination(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 10) return value;
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}
