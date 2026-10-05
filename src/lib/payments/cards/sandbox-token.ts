/**
 * The sandbox's one-time token: what its card fields hand the server in place
 * of the card, the way a real processor's fields hand back theirs.
 *
 * It carries only what a processor would tell us anyway — brand, last four,
 * expiry, name, a fingerprint — plus which test card it was, which decides
 * what charging it does. Shared by the browser, which makes it, and the
 * server, which reads it and checks every field rather than trusting it.
 */
import { SANDBOX_OUTCOMES, isBrand, type CardBrand, type SandboxOutcome } from "./card-types";

export type SandboxCard = {
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  fingerprint: string;
  outcome: SandboxOutcome;
};

const PREFIX = "sbx_tok_";

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeSandboxToken(card: SandboxCard) {
  return PREFIX + toBase64Url(JSON.stringify(card));
}

export function decodeSandboxToken(token: string): SandboxCard | null {
  if (typeof token !== "string" || !token.startsWith(PREFIX) || token.length > 1024) return null;
  try {
    const raw = JSON.parse(fromBase64Url(token.slice(PREFIX.length))) as Record<string, unknown>;
    const card = {
      brand: raw.brand,
      last4: raw.last4,
      expMonth: raw.expMonth,
      expYear: raw.expYear,
      holder: typeof raw.holder === "string" ? raw.holder.trim().replace(/\s+/g, " ") : "",
      fingerprint: raw.fingerprint,
      outcome: raw.outcome,
    };
    if (
      !isBrand(card.brand) ||
      typeof card.last4 !== "string" ||
      !/^\d{4}$/.test(card.last4) ||
      !Number.isInteger(card.expMonth) ||
      (card.expMonth as number) < 1 ||
      (card.expMonth as number) > 12 ||
      !Number.isInteger(card.expYear) ||
      (card.expYear as number) < 2000 ||
      (card.expYear as number) > 2100 ||
      card.holder.length < 2 ||
      card.holder.length > 64 ||
      typeof card.fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(card.fingerprint) ||
      !SANDBOX_OUTCOMES.includes(card.outcome as SandboxOutcome)
    ) {
      return null;
    }
    return card as SandboxCard;
  } catch {
    return null;
  }
}
