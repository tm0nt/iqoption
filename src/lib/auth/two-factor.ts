/**
 * The second step of signing in, and the codes that stand in for it.
 *
 * Every check of a code — at sign-in, when turning the feature off, when
 * replacing the recovery codes — goes through `verifySecondFactor`, so the
 * replay guard and the lockout cannot be skipped by finding the one caller
 * that forgot them. The check runs with the account's row locked, which is
 * what stops two requests carrying the same code (or the same recovery code)
 * from both being accepted.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { seal, unseal } from "./secret-box";
import { generateSecret, matchStep, otpauthUri } from "./totp";

const PURPOSE = "two-factor";

/** Failures in a row before the second step is locked, and for how long. */
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60_000;

const RECOVERY_COUNT = 10;
const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function hash(code: string) {
  return createHash("sha256").update(normalizeRecovery(code)).digest("hex");
}

function normalizeRecovery(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** `abcde-fghij`: ten characters with no 0/o or 1/l, easy to read off paper. */
export function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_COUNT }, () => {
    const bytes = randomBytes(10);
    const chars = Array.from(bytes, (byte) => RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]).join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

export function hashRecoveryCodes(codes: string[]) {
  return codes.map(hash);
}

/** Starts setup: a new secret, sealed and stored, not yet in force. */
export async function beginSetup(userId: number, issuer: string, account: string) {
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: seal(secret, PURPOSE), twoFactorEnabledAt: null, twoFactorLastStep: null },
  });
  return { secret, uri: otpauthUri(issuer, account, secret) };
}

export type SecondFactorResult = "ok" | "invalid" | "locked" | "not-enabled";

/**
 * Checks a code against an account, counting failures.
 *
 * A six-digit code from the app, or one of the recovery codes; a recovery code
 * is spent by using it. `pending` checks against a secret whose setup has not
 * been confirmed yet, which is how setup is confirmed.
 */
export async function verifySecondFactor(userId: number, code: string, { pending = false } = {}): Promise<SecondFactorResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabledAt: true,
        twoFactorLastStep: true,
        twoFactorRecovery: true,
        twoFactorFailures: true,
        twoFactorLockedUntil: true,
      },
    });
    if (!user?.twoFactorSecret) return "not-enabled";
    if (!pending && !user.twoFactorEnabledAt) return "not-enabled";
    if (pending && user.twoFactorEnabledAt) return "not-enabled";
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) return "locked";

    const secret = unseal(user.twoFactorSecret, PURPOSE);
    if (!secret) return "not-enabled";

    const step = matchStep(secret, code, user.twoFactorLastStep);
    if (step !== null) {
      await tx.user.update({
        where: { id: userId },
        data: { twoFactorLastStep: step, twoFactorFailures: 0, twoFactorLockedUntil: null },
      });
      return "ok";
    }

    // Recovery codes only stand in for a factor that is already on.
    const hashes = Array.isArray(user.twoFactorRecovery) ? (user.twoFactorRecovery as string[]) : [];
    if (!pending && normalizeRecovery(code).length === 10) {
      const index = hashes.indexOf(hash(code));
      if (index >= 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            twoFactorRecovery: hashes.filter((_, i) => i !== index),
            twoFactorFailures: 0,
            twoFactorLockedUntil: null,
          },
        });
        return "ok";
      }
    }

    const failures = user.twoFactorFailures + 1;
    await tx.user.update({
      where: { id: userId },
      data: {
        twoFactorFailures: failures >= MAX_FAILURES ? 0 : failures,
        twoFactorLockedUntil: failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    return failures >= MAX_FAILURES ? "locked" : "invalid";
  });
}

/** Turns it on, once the app has produced a valid code. Returns the recovery codes, shown once. */
export async function confirmSetup(userId: number, code: string) {
  const result = await verifySecondFactor(userId, code, { pending: true });
  if (result !== "ok") return { result } as const;
  const codes = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabledAt: new Date(), twoFactorRecovery: hashRecoveryCodes(codes) },
  });
  return { result, codes } as const;
}

export async function replaceRecoveryCodes(userId: number) {
  const codes = generateRecoveryCodes();
  await prisma.user.update({ where: { id: userId }, data: { twoFactorRecovery: hashRecoveryCodes(codes) } });
  return codes;
}

/** Everything about the second factor, gone. */
export const TWO_FACTOR_OFF = {
  twoFactorSecret: null,
  twoFactorEnabledAt: null,
  twoFactorLastStep: null,
  twoFactorRecovery: [] as string[],
  twoFactorFailures: 0,
  twoFactorLockedUntil: null,
};
