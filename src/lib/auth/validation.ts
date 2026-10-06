/**
 * What a registration form accepts.
 *
 * Validation errors carry a message meant to be shown beside the field.
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

/** bcrypt only reads the first 72 bytes of a password. */
const BCRYPT_LIMIT = 72;

export type PasswordProblem =
  | "too-short"
  | "too-long";

const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
  "too-short": "Use at least 8 characters.",
  "too-long": `Use at most ${BCRYPT_LIMIT} characters.`,
};

/** Enforce an eight-character minimum and bcrypt's input limit. */
export function passwordProblems(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];

  if (password.length < 8) problems.push("too-short");
  // bcrypt silently ignores anything past 72 bytes, so a longer password is
  // not the password the user thinks it is.
  if (Buffer.byteLength(password, "utf8") > BCRYPT_LIMIT) problems.push("too-long");
  return problems;
}

export function passwordMessage(problem: PasswordProblem) {
  return PASSWORD_MESSAGES[problem];
}

/**
 * A coarse 0–4 score, for a strength meter.
 *
 * It is a visual length indicator, not an entropy estimate.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (passwordProblems(password).length > 0) return 0;
  let score = 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
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
    return { ...value, phone: phone.e164, phoneCountry: phone.country };
  });

export type RegisterInput = z.infer<typeof registerSchema>;
