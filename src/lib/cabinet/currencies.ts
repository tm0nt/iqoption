/**
 * Which currencies this platform lets a person hold money in.
 *
 * The engine carries a catalogue of ninety-three and marks twenty-three as
 * ones money can move in; which of those *this* platform offers is a separate
 * decision, and an administrator's. The row is `cashier.currencies`, and the
 * first entry is the default a new account opens in.
 *
 * The catalogue itself lives with the feed, in `server/data/currencies.mjs`,
 * because that is who has to answer the engine's `get-currencies-list`. What
 * is here is the narrower question the web app asks: what may somebody pick.
 */
import { setting } from "@/lib/engine/settings";

/** Offered currency codes, in the order an administrator put them. */
export async function offeredCurrencyNames(): Promise<string[]> {
  const row = await setting("cashier.currencies");
  const offered = Array.isArray(row.offered) ? row.offered.filter((name) => typeof name === "string") : [];
  /*
   * A platform that has emptied the list still has to be able to open an
   * account, so it falls back rather than refusing every registration.
   */
  return offered.length ? offered : ["USD"];
}

/**
 * The currency an account should open in.
 *
 * A request may ask for one; anything not on the offered list is ignored
 * rather than refused, because the currency is a preference and a sign-up is
 * not worth failing over a stale dropdown.
 */
export async function currencyForNewAccount(wanted?: string): Promise<string> {
  const offered = await offeredCurrencyNames();
  const asked = wanted?.trim().toUpperCase();
  return asked && offered.includes(asked) ? asked : offered[0];
}
