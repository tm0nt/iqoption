"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AuthField } from "../shared/AuthField";
import { AuthSubmitButton } from "../shared/AuthSubmitButton";
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

/** Registration form. Account creation is out of scope, so the submit is inert. */
export function RegisterForm({ copy, locale }: RegisterFormProps) {
  const countries = useMemo(() => localizedCountries(locale), [locale]);
  const dialCodes = useMemo(() => localizedDialCodes(locale), [locale]);

  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  // Tracked by `iso|dial`, since one ISO can carry several codes.
  const [selectedDial, setSelectedDial] = useState(DEFAULT_DIAL_KEY);

  const country = countries.find((c) => c.iso === countryIso) ?? countries[0];
  const dial =
    dialCodes.find((d) => dialKey(d) === selectedDial) ?? dialCodes[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

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
        autoComplete="new-password"
      />
      <AuthField
        testId="register-password2-input"
        name="password"
        type="password"
        placeholder={copy.passwordPlaceholder}
        autoComplete="new-password"
      />

      <PhoneField
        dial={dial}
        dialCodes={dialCodes}
        onDialChange={(next) => setSelectedDial(dialKey(next))}
        placeholder={copy.phonePlaceholder}
        searchPlaceholder={copy.countrySearchPlaceholder}
      />

      <div className="mb-[18px] block w-full">
        <TermsNotice copy={copy} />
      </div>

      <AuthSubmitButton
        data-test-id="register-submit-button"
        className="mb-5 min-h-[50px] px-5 py-2 leading-[22px]"
      >
        {copy.submit}
      </AuthSubmitButton>
    </form>
  );
}
