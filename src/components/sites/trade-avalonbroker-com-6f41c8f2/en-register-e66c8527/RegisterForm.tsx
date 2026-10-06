"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthField } from "../shared/AuthField";
import { AuthSubmitButton } from "../shared/AuthSubmitButton";
import { FormError } from "../shared/FormError";
import { PasswordStrength } from "../shared/PasswordStrength";
import { CountrySelect } from "./CountrySelect";
import { PhoneField } from "./PhoneField";
import { TermsNotice } from "./TermsNotice";
import {
  DEFAULT_COUNTRY_ISO,
  DEFAULT_DIAL_KEY,
  dialKey,
  localizedCountries,
  localizedDialCodes,
} from "../shared/countries";
import type { AvalonLocale, AvalonRegisterCopy } from "@/types/avalon-login";

interface RegisterFormProps {
  copy: AvalonRegisterCopy;
  locale: AvalonLocale;
}

/**
 * Registration.
 *
 * Validation runs on the server — `src/lib/auth/validation.ts` — and the errors
 * it returns are shown against the field that caused them. The password meter
 * is the only check that also runs here, because a meter that waits for a round
 * trip is not a meter.
 */
export function RegisterForm({ copy, locale }: RegisterFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const countries = useMemo(() => localizedCountries(locale), [locale]);
  const dialCodes = useMemo(() => localizedDialCodes(locale), [locale]);

  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  // Tracked by `iso|dial`, since one ISO can carry several codes.
  const [selectedDial, setSelectedDial] = useState(DEFAULT_DIAL_KEY);

  const country = countries.find((c) => c.iso === countryIso) ?? countries[0];
  const dial =
    dialCodes.find((d) => dialKey(d) === selectedDial) ?? dialCodes[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const first = String(form.get("first_name") ?? "").trim();
    const last = String(form.get("last_name") ?? "").trim();
    const email = String(form.get("identifier") ?? "");
    const secret = String(form.get("password") ?? "");

    setErrors({});
    setBusy(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password: secret,
          name: [first, last].filter(Boolean).join(" ") || undefined,
          // The dial code and the number, which the server parses together
          // against the chosen country rather than trusting either alone.
          phone: `${dial.dial}${phone.replace(/\D/g, "")}`,
          phoneCountry: dial.iso.toUpperCase(),
          acceptedTerms: true,
        }),
      });

      const body = (await response.json()) as { errors?: Record<string, string[]>; error?: string };

      if (!response.ok) {
        setErrors(body.errors ?? { form: [body.error ?? "Could not create the account."] });
        return;
      }

      // Straight into the traderoom: making someone type the same password
      // again on a login page is a step with nothing behind it.
      const signedIn = await signIn("credentials", { email, password: secret, redirect: false });
      router.push(signedIn && !signedIn.error ? `/${locale}/traderoom` : `/${locale}/login`);
      router.refresh();
    } catch {
      setErrors({ form: ["Could not reach the server. Try again."] });
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name: string) => errors[name]?.join(" ");

  return (
    <form onSubmit={handleSubmit} noValidate data-test-id="register-form">
      <AuthField
        testId="register-form-name-input"
        name="first_name"
        type="text"
        placeholder={copy.firstNamePlaceholder}
        autoComplete="new-password"
      />
      <AuthField
        testId="register-last-name-input"
        name="last_name"
        type="text"
        placeholder={copy.lastNamePlaceholder}
        autoComplete="new-password"
      />

      <div
        data-test-id="register-form-country-wrapper"
        className="mb-[18px] block w-full bg-white"
      >
        <CountrySelect
          value={country}
          countries={countries}
          onChange={(next) => {
            setCountryIso(next.iso);
            // Selecting a country also moves the dial code, as on the live site.
            // Countries with several codes fall back to their first one.
            const match = dialCodes.find((d) => d.iso === next.iso);
            if (match) setSelectedDial(dialKey(match));
          }}
          searchPlaceholder={copy.countrySearchPlaceholder}
        />
        <div className="mt-2 block w-full font-avalon text-[12px] font-medium leading-5 text-avalon-text">
          <span>{copy.countryHint}</span>
        </div>
      </div>

      <AuthField
        testId="register-email-input"
        name="identifier"
        type="text"
        placeholder={copy.emailPlaceholder}
        autoComplete="email"
        disabled={busy}
      />
      <FormError>{fieldError("email")}</FormError>

      <AuthField
        testId="register-password2-input"
        name="password"
        type="password"
        placeholder={copy.passwordPlaceholder}
        autoComplete="new-password"
        disabled={busy}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordStrength password={password} />
      <FormError>{fieldError("password")}</FormError>

      <PhoneField
        dial={dial}
        dialCodes={dialCodes}
        onDialChange={(next) => setSelectedDial(dialKey(next))}
        value={phone}
        onChange={setPhone}
        placeholder={copy.phonePlaceholder}
        searchPlaceholder={copy.countrySearchPlaceholder}
      />
      <FormError>{fieldError("phone")}</FormError>

      <div className="mb-[18px] block w-full">
        <TermsNotice copy={copy} />
      </div>

      <FormError>{fieldError("form")}</FormError>

      <AuthSubmitButton
        data-test-id="register-submit-button"
        className="mb-5 min-h-[50px] px-5 py-2 leading-[22px]"
        disabled={busy}
      >
        {busy ? copy.submitting : copy.submit}
      </AuthSubmitButton>
    </form>
  );
}
