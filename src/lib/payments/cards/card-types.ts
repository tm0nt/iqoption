/**
 * Cards, with no server in them: the brand a number belongs to, whether it
 * passes the Luhn check, how a saved card is written out, and the sandbox's
 * test cards. The card form and the routes both need these.
 */

export const CARD_BRANDS = ["visa", "mastercard", "amex", "elo", "hipercard", "diners", "discover", "other"] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const BRAND_NAMES: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  elo: "Elo",
  hipercard: "Hipercard",
  diners: "Diners Club",
  discover: "Discover",
  other: "Card",
};

/** The processors the platform knows how to talk to. */
export type CardProviderId = "sandbox";

/** What a page needs to know about the processor in use, if there is one. */
export type CardProviderInfo = { id: CardProviderId; test: boolean };

/** A saved card as a page shows it. Nothing here is secret. */
export type SavedCard = {
  id: number;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  expired: boolean;
};

/*
 * Elo is checked before Visa and Mastercard on purpose: several of its ranges
 * start with 4 or 5, and a Brazilian card shown as the wrong brand is the kind
 * of detail that makes someone doubt the whole form.
 */
const ELO = /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|506(699|7[0-6]\d|77[0-8])|509\d{3}|627780|636297|636368|650(0(3[1-3]|3[5-9]|4\d|5[01])|4(0[5-9]|[1-3]\d)|48[5-9]|49\d|5([0-2]\d|3[0-8]|4[1-9]|[5-8]\d|9[0-8])|7(0\d|1[0-8]|2[0-7])|9(0[1-9]|1\d|20))|6516(5[2-9]|[6-7]\d)|6550([0-1]\d|2[1-9]|[3-4]\d|5[0-8]))/;

export function detectBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (ELO.test(digits)) return "elo";
  if (/^(606282|3841)/.test(digits)) return "hipercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^3(0[0-5]|[68])/.test(digits)) return "diners";
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  return "other";
}

export function isBrand(value: unknown): value is CardBrand {
  return typeof value === "string" && (CARD_BRANDS as readonly string[]).includes(value);
}

/** The check digit every card number carries. Catches a mistyped digit before anything is sent. */
export function passesLuhn(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** Valid through the last day of its expiry month. */
export function isExpired(expMonth: number, expYear: number, now = new Date()) {
  return expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1);
}

/** "Visa •••• 4242", the way a saved card is named everywhere. */
export function cardLabel(card: { brand: string; last4: string }) {
  return `${BRAND_NAMES[isBrand(card.brand) ? card.brand : "other"]} •••• ${card.last4}`;
}

export function expiryLabel(card: { expMonth: number; expYear: number }) {
  return `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
}

/** What a charge to a sandbox card does, decided by which test card it is. */
export type SandboxOutcome = "approve" | "decline" | "funds" | "review";
export const SANDBOX_OUTCOMES: readonly SandboxOutcome[] = ["approve", "decline", "funds", "review"];

/**
 * The only numbers the sandbox takes. Anything else is refused in the browser,
 * so a real card typed by mistake is never sent anywhere.
 */
export const SANDBOX_CARDS: { number: string; outcome: SandboxOutcome }[] = [
  { number: "4242424242424242", outcome: "approve" },
  { number: "5555555555554444", outcome: "approve" },
  { number: "378282246310005", outcome: "approve" },
  { number: "4000000000000002", outcome: "decline" },
  { number: "4000000000009995", outcome: "funds" },
  { number: "4000000000003220", outcome: "review" },
];
