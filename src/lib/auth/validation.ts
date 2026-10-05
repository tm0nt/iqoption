/**
 * What a registration form accepts.
 *
 * The rules are deliberately explicit rather than a regex each: a person who is
 * refused needs to be told which rule they broke, and a single pattern can only
 * say "invalid". Every failure here carries a message meant to be shown.
 */
import { z } from "zod";
/*
 * The `/max` entry point, not the default one. The default ships "min"
 * metadata, which can validate a number but carries no line-type information:
 * `getType()` returns undefined for every number, and a landline passes a
 * mobile-only check unnoticed. `/max` is about 145 KB larger and is the only
 * build that can tell them apart.
 */
import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js/max";

/* --------------------------------------------------------------- password */

/** The longest password a bcrypt hash actually reads. */
const BCRYPT_LIMIT = 72;

/**
 * Passwords people reach for first. A length rule alone passes every one of
 * them, and they are the first thing any credential-stuffing list tries.
 */
const COMMON = new Set([
  "password", "password1", "passw0rd", "12345678", "123456789", "1234567890",
  "qwertyui", "qwerty123", "iloveyou", "princess", "admin123", "welcome1",
  "abc12345", "trustno1", "sunshine", "football", "baseball", "superman",
  "letmein1", "monkey12", "dragon12", "master12", "shadow12", "michael1",
  "senha123", "mudar123", "brasil123", "flamengo", "corinthians",
]);

export type PasswordProblem =
  | "too-short"
  | "too-long"
  | "needs-lowercase"
  | "needs-uppercase"
  | "needs-digit"
  | "needs-symbol"
  | "too-common"
  | "repeats"
  | "sequential";

const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
  "too-short": "Use at least 10 characters.",
  "too-long": `Use at most ${BCRYPT_LIMIT} characters.`,
  "needs-lowercase": "Add a lowercase letter.",
  "needs-uppercase": "Add an uppercase letter.",
  "needs-digit": "Add a digit.",
  "needs-symbol": "Add a symbol, such as ! ? @ or -.",
  "too-common": "This is one of the most guessed passwords. Choose another.",
  repeats: "Avoid repeating one character several times in a row.",
  sequential: "Avoid runs like 1234 or abcd.",
};

/** Four or more of the same character in a row. */
function hasRun(password: string) {
  return /(.)\1{3,}/.test(password);
}

/** Four or more consecutive code points, forwards or backwards. */
function hasSequence(password: string) {
  const lower = password.toLowerCase();
  let ascending = 1;
  let descending = 1;
  for (let i = 1; i < lower.length; i += 1) {
    const step = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    ascending = step === 1 ? ascending + 1 : 1;
    descending = step === -1 ? descending + 1 : 1;
    if (ascending >= 4 || descending >= 4) return true;
  }
  return false;
}

/**
 * Every rule a password breaks, not just the first.
 *
 * Returning all of them lets a form show its whole checklist at once, which is
 * the difference between fixing a password in one edit and in four.
 */
export function passwordProblems(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];

  if (password.length < 10) problems.push("too-short");
  // bcrypt silently ignores anything past 72 bytes, so a longer password is
  // not the password the user thinks it is.
  if (Buffer.byteLength(password, "utf8") > BCRYPT_LIMIT) problems.push("too-long");
  if (!/\p{Ll}/u.test(password)) problems.push("needs-lowercase");
  if (!/\p{Lu}/u.test(password)) problems.push("needs-uppercase");
  if (!/\p{Nd}/u.test(password)) problems.push("needs-digit");
  if (!/[^\p{L}\p{Nd}]/u.test(password)) problems.push("needs-symbol");
  if (COMMON.has(password.toLowerCase())) problems.push("too-common");
  if (hasRun(password)) problems.push("repeats");
  if (hasSequence(password)) problems.push("sequential");

  return problems;
}

export function passwordMessage(problem: PasswordProblem) {
  return PASSWORD_MESSAGES[problem];
}

/**
 * A coarse 0–4 score, for a strength meter.
 *
 * It is not an entropy estimate and should never be presented as one: it counts
 * the variety and length a password has, and anything that breaks a rule above
 * scores zero regardless.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (passwordProblems(password).length > 0) return 0;
  let score = 1;
  if (password.length >= 14) score += 1;
  if (password.length >= 20) score += 1;
  if (new Set(password).size >= password.length * 0.7) score += 1;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

export const passwordSchema = z.string().superRefine((password, ctx) => {
  for (const problem of passwordProblems(password)) {
    ctx.addIssue({ code: "custom", message: passwordMessage(problem), params: { problem } });
  }
});

/* ------------------------------------------------------------------ email */

/**
 * Email, checked for the shapes that are actually wrong.
 *
 * Zod's own check is the sane subset of RFC 5322; the rest is about addresses
 * that parse and still cannot receive mail. No attempt is made to verify the
 * domain here — that belongs to a confirmation link, not to a form.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Enter an email address.")
  .max(254, "That address is too long.")
  .pipe(z.email("Enter a valid email address."))
  .refine((value) => !value.endsWith("."), "An address cannot end with a dot.")
  .refine((value) => !value.includes(".."), "An address cannot contain two dots in a row.")
  .refine((value) => {
    const domain = value.split("@")[1] ?? "";
    // A domain with no dot is reachable only inside a single network, never
    // from a public mail server.
    return domain.includes(".") && !domain.startsWith("-") && !domain.endsWith("-");
  }, "That domain cannot receive mail.");

/* ------------------------------------------------------------------ phone */

export type PhoneResult =
  | { ok: true; e164: string; country: CountryCode; national: string }
  | { ok: false; message: string };

/**
 * A mobile number, in any country.
 *
 * `libphonenumber-js` carries Google's metadata, so this is a real check per
 * country — length, prefix and line type — rather than a digit count. Two
 * deliberate choices:
 *
 *   - The number is stored as E.164 (`+5511987654321`). It is the only form
 *     that is unambiguous across countries and the only one an SMS gateway
 *     takes without a second argument.
 *   - A fixed line is refused. The field asks for a mobile, and in most
 *     countries the metadata can tell them apart; where it genuinely cannot,
 *     the type comes back as unknown and is allowed through rather than
 *     refusing a valid number.
 */
export function parseMobile(input: string, country?: CountryCode): PhoneResult {
  const raw = input.trim();
  if (!raw) return { ok: false, message: "Enter a phone number." };

  // Without a country, the number has to carry its own prefix.
  if (!country && !raw.startsWith("+")) {
    return { ok: false, message: "Include the country code, for example +55." };
  }

  try {
    const parsed = parsePhoneNumberWithError(raw, country);
    if (!parsed.isValid()) {
      return { ok: false, message: "That number is not valid for the country selected." };
    }

    const type = parsed.getType();
    if (type === "FIXED_LINE" || type === "VOIP" || type === "PAGER") {
      return { ok: false, message: "Enter a mobile number." };
    }

    return {
      ok: true,
      e164: parsed.number,
      country: (parsed.country ?? country) as CountryCode,
      national: parsed.formatNational(),
    };
  } catch {
    return { ok: false, message: "That does not look like a phone number." };
  }
}

export const phoneSchema = z
  .object({ phone: z.string(), phoneCountry: z.string().length(2).optional() })
  .transform((value, ctx) => {
    const result = parseMobile(value.phone, value.phoneCountry as CountryCode | undefined);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.message, path: ["phone"] });
      return z.NEVER;
    }
    return { phone: result.e164, phoneCountry: result.country };
  });

/* --------------------------------------------------------------- register */

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    /*
     * Which currency the account's money is denominated in. Optional, because
     * a form that does not ask should still work; what is offered is an
     * administrator's decision, so it is checked against the platform rather
     * than against a list written here.
     */
    currency: z.string().trim().toUpperCase().max(8).optional(),
    name: z.string().trim().min(1, "Enter your name.").max(120).optional(),
    phone: z.string(),
    phoneCountry: z.string().length(2).optional(),
    acceptedTerms: z.literal(true, { error: "You have to accept the terms." }),
  })
  .transform((value, ctx) => {
    const phone = parseMobile(value.phone, value.phoneCountry as CountryCode | undefined);
    if (!phone.ok) {
      ctx.addIssue({ code: "custom", message: phone.message, path: ["phone"] });
      return z.NEVER;
    }
    // A password that contains the address it protects is the first thing
    // tried against a leaked user list.
    const local = value.email.split("@")[0];
    if (local.length >= 4 && value.password.toLowerCase().includes(local.toLowerCase())) {
      ctx.addIssue({ code: "custom", message: "Your password cannot contain your email.", path: ["password"] });
      return z.NEVER;
    }
    return { ...value, phone: phone.e164, phoneCountry: phone.country };
  });

export type RegisterInput = z.infer<typeof registerSchema>;
