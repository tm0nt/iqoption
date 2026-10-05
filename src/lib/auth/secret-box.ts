/**
 * Sealing a small secret before it is stored.
 *
 * AES-256-GCM, with the key derived from AUTH_SECRET by HKDF and a purpose
 * label, so the key that seals a two-factor secret is not the key that signs a
 * session cookie even though both come from the one environment variable. A
 * copy of the database without the environment is then a copy without the
 * second factors in it.
 *
 * The output is versioned (`v1:`) so the scheme can change without a guess
 * about which rows were written under the old one.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

function keyFor(purpose: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set; secrets cannot be sealed");
  return Buffer.from(hkdfSync("sha256", secret, "avalon-secret-box", purpose, 32));
}

export function seal(plain: string, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFor(purpose), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${body.toString("base64url")}`;
}

/** The plain text, or null when the value is not one this key sealed. */
export function unseal(sealed: string, purpose: string): string | null {
  const [version, iv, tag, body] = sealed.split(":");
  if (version !== "v1" || !iv || !tag || body === undefined) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", keyFor(purpose), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
