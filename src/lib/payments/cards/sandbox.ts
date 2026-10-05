/**
 * The test processor.
 *
 * Its card fields run in the browser and refuse anything but the test cards,
 * so no real card number reaches the server even here. What arrives is the
 * token they make (see sandbox-token.ts); this checks it field by field and
 * turns it into a stored card whose token remembers which test card it was,
 * because that decides what charging it does:
 *
 *   approve  — approved at once
 *   decline  — declined by the bank
 *   funds    — declined for insufficient funds
 *   review   — held for review, as a 3-D Secure step or a fraud check would
 */
import { randomBytes } from "node:crypto";
import { SANDBOX_OUTCOMES, isExpired, type SandboxOutcome } from "./card-types";
import { decodeSandboxToken } from "./sandbox-token";
import type { CardProvider } from "./provider";

const CARD = /^sbx_card_(approve|decline|funds|review)_[0-9a-f]{24}$/;

export const sandboxProvider: CardProvider = {
  id: "sandbox",
  test: true,

  async saveCard(oneTimeToken) {
    const card = decodeSandboxToken(oneTimeToken);
    if (!card || isExpired(card.expMonth, card.expYear)) return null;
    return {
      token: `sbx_card_${card.outcome}_${randomBytes(12).toString("hex")}`,
      fingerprint: card.fingerprint,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      holder: card.holder.toUpperCase(),
    };
  },

  async charge(card) {
    const match = CARD.exec(card.token);
    const outcome = (match?.[1] ?? "") as SandboxOutcome;
    if (!SANDBOX_OUTCOMES.includes(outcome)) return { status: "declined", reference: null, reason: "error" };
    const reference = `sbx_ch_${randomBytes(12).toString("hex")}`;
    if (outcome === "approve") return { status: "approved", reference };
    if (outcome === "review") return { status: "pending", reference };
    return { status: "declined", reference, reason: outcome === "funds" ? "funds" : "declined" };
  },

  async forget() {},
};
