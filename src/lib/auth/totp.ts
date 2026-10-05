/**
 * Time-based one-time passwords, RFC 6238 — what Google Authenticator, Authy,
 * 1Password and every other authenticator app produce.
 *
 * Written out rather than pulled in: it is an HMAC over a counter and a
 * dynamic truncation, about forty lines, and the one place a dependency's
 * defaults (SHA-1, six digits, thirty seconds) have to match the apps'
 * exactly. Those defaults are the only ones every app supports, so they are
 * fixed here rather than configurable.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const PERIOD = 30;
const DIGITS = 6;

export function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  const clean = text.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("not base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** 160 random bits, the length RFC 4226 recommends for HMAC-SHA1. */
export function generateSecret() {
  return base32Encode(randomBytes(20));
}

/** The code for one 30-second step. */
export function codeAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function currentStep(now = Date.now()) {
  return Math.floor(now / 1000 / PERIOD);
}

/**
 * The step a code belongs to, or null.
 *
 * One step either side is accepted, because a phone's clock drifts and a person
 * types slowly. A step at or before `notAfter` is refused even when the code is
 * right — that is the replay guard: a code already used, or an older one.
 */
export function matchStep(secret: string, code: string, notAfter: number | null, now = Date.now()) {
  const typed = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(typed)) return null;
  const step = currentStep(now);
  for (const candidate of [step, step - 1, step + 1]) {
    if (notAfter !== null && candidate <= notAfter) continue;
    const expected = Buffer.from(codeAt(secret, candidate));
    if (timingSafeEqual(expected, Buffer.from(typed))) return candidate;
  }
  return null;
}

/** What the QR code carries: `otpauth://totp/Issuer:account?secret=…&issuer=…`. */
export function otpauthUri(issuer: string, account: string, secret: string) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: String(DIGITS), period: String(PERIOD) });
  return `otpauth://totp/${label}?${params.toString()}`;
}
