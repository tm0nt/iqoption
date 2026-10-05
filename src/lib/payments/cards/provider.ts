/**
 * The card processor, behind one interface.
 *
 * Everything the platform does with a card goes through these three calls —
 * save the card a processor's fields tokenized, charge it, forget it — so
 * plugging in a real processor is writing one more adapter, not touching the
 * cashier. Which one is in use is read from the environment, because a
 * processor comes with credentials and those live there, not in a settings
 * row an administrator can edit.
 *
 * `CARD_PROVIDER=sandbox` is the test processor: it accepts only test cards
 * and charges nothing, and a charge it approves credits the wallet as a real
 * one would. That makes it money from nothing, so a production build ignores
 * it unless `ALLOW_CARD_SANDBOX=1` says otherwise — a staging server can
 * opt in, a live one cannot do it by accident.
 */
import type { CardBrand, CardProviderId, CardProviderInfo } from "./card-types";
import { sandboxProvider } from "./sandbox";

export type SavedCardDetails = {
  token: string;
  fingerprint: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
};

export type ChargeResult =
  | { status: "approved"; reference: string }
  /** Waiting on the processor — a 3-D Secure step, a manual review. The deposit stays pending. */
  | { status: "pending"; reference: string }
  | { status: "declined"; reference: string | null; reason: "declined" | "funds" | "expired" | "error" };

export interface CardProvider {
  id: CardProviderId;
  /** True for a processor that moves no real money. */
  test: boolean;
  /** Turns the one-time token from the processor's fields into a card that can be charged again. */
  saveCard(oneTimeToken: string): Promise<SavedCardDetails | null>;
  charge(card: { token: string }, amount: number, currency: string, reference: string): Promise<ChargeResult>;
  /** Asks the processor to drop the card. Best effort: the card is gone from the platform either way. */
  forget(card: { token: string }): Promise<void>;
}

export function cardProvider(): CardProvider | null {
  switch (process.env.CARD_PROVIDER?.trim()) {
    case "sandbox":
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_CARD_SANDBOX !== "1") return null;
      return sandboxProvider;
    default:
      return null;
  }
}

/** The part of the provider a page may know about. */
export function cardProviderInfo(): CardProviderInfo | null {
  const provider = cardProvider();
  return provider ? { id: provider.id, test: provider.test } : null;
}
