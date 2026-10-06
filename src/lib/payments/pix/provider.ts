/**
 * Which PIX rail is in use, if any.
 *
 * Read from the environment rather than from a settings row, for the same
 * reason the card processor is: a rail comes with a credential that moves
 * money, and that does not belong somewhere an administrator can read it off
 * a screen.
 *
 * No key means no rail, and no rail means the cashier behaves exactly as it
 * did before any of this existed — a PIX deposit records a PENDING row and
 * waits for somebody to reconcile it by hand. That is the honest fallback: a
 * platform with no provider must not pretend to have one.
 */
import { dubaiCashProvider } from "./dubai-cash";
import type { PixProvider } from "./pix-types";

let cached: PixProvider | null | undefined;

export function pixProvider(): PixProvider | null {
  if (cached !== undefined) return cached;

  const apiKey = process.env.DUBAI_CASH_API_KEY?.trim();
  cached = apiKey ? dubaiCashProvider(apiKey) : null;
  return cached;
}

/** Forgets the cached provider. For tests, and for a key changed at runtime. */
export function resetPixProvider() {
  cached = undefined;
}

/**
 * The credentials the provider uses to prove a callback is theirs.
 *
 * Dubai Cash authenticates itself to us with HTTP Basic, using an id and
 * secret we chose and registered with their webhook manager. They are checked
 * on every callback: an endpoint that credits a wallet and believes whoever
 * posts to it is an open till.
 */
export function pixWebhookCredentials(): { id: string; secret: string } | null {
  const id = process.env.DUBAI_CASH_WEBHOOK_ID?.trim();
  const secret = process.env.DUBAI_CASH_WEBHOOK_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}
