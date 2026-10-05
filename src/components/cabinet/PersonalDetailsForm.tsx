"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { VERIFICATION_COUNTRIES } from "@/lib/cabinet/countries";
import { cabinetCopy } from "@/i18n/cabinet";

export type DetailsDefaults = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  citizenship: string;
  isUsPerson: boolean;
  residenceCountry: string;
  residenceFlag: string;
};

/** The field frame the live form uses: a 50px filled box with a hairline. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[14px] font-medium text-avalon-text">{label}</label>
      {children}
      {hint && <p className="mt-2 text-[12px] font-medium leading-[17px] text-avalon-text">{hint}</p>}
    </div>
  );
}

const BOX =
  "h-[50px] w-full rounded-[4px] border border-avalon-border-muted bg-avalon-surface px-4 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

/**
 * The details step of verification.
 *
 * The names are asked separately and the hint says why: they have to match an
 * identity document, and a document has two fields, not one. Nothing here is
 * validated into a shape the document cannot have — the check that matters
 * happens when a person reads the document against these values.
 */
export function PersonalDetailsForm({ defaults, locale }: { defaults: DetailsDefaults; locale: string }) {
  const v = cabinetCopy(locale).verification;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile/verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          dateOfBirth: String(form.get("dateOfBirth") ?? ""),
          citizenship: String(form.get("citizenship") ?? ""),
          isUsPerson: form.get("isUsPerson") === "on",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? { form: [body.error ?? "Could not save your details."] });
        return;
      }
      setDone(true);
      router.refresh();
    } catch (reason) {
      setErrors({ form: [reason instanceof Error ? reason.message : "Could not reach the server."] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-[34px] border-b border-avalon-surface-hover pb-8">
        <div className="w-[220px] shrink-0">
          <p className="text-[16px] font-semibold text-avalon-text">{v.personalInfo}</p>
          <p className="mt-4 text-[13px] leading-[22px] text-avalon-text">{v.exactlyAsId}</p>
        </div>

        <div className="ml-auto w-[440px] shrink-0">
          <Field label="First Name">
            <input name="firstName" defaultValue={defaults.firstName} disabled={busy} className={BOX} autoComplete="given-name" />
          </Field>
          <FormError>{error("firstName")}</FormError>

          <Field
            label="Last Name"
            hint="Enter your first and last name exactly as they appear on your identification document."
          >
            <input name="lastName" defaultValue={defaults.lastName} disabled={busy} className={BOX} autoComplete="family-name" />
          </Field>
          <FormError>{error("lastName")}</FormError>

          <Field label="Date of Birth">
            <input
              name="dateOfBirth"
              defaultValue={defaults.dateOfBirth}
              placeholder={v.datePlaceholder}
              disabled={busy}
              className={`${BOX} placeholder:text-avalon-placeholder`}
              inputMode="numeric"
            />
          </Field>
          <FormError>{error("dateOfBirth")}</FormError>

          <Field label="Country of citizenship">
            <select name="citizenship" defaultValue={defaults.citizenship} disabled={busy} className={`${BOX} appearance-none`}>
              {VERIFICATION_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>
          <FormError>{error("citizenship")}</FormError>

          <label className="flex items-start gap-2.5 text-[14px] text-avalon-text">
            <input
              type="checkbox"
              name="isUsPerson"
              defaultChecked={defaults.isUsPerson}
              disabled={busy}
              className="mt-0.5 size-4 shrink-0 accent-avalon-primary"
            />{v.usPerson}</label>
        </div>
      </div>

      <div className="flex gap-[34px] pt-8">
        <div className="w-[220px] shrink-0">
          <p className="text-[16px] font-semibold text-avalon-text">{v.residenceInfo}</p>
          <p className="mt-4 text-[13px] leading-[22px] text-avalon-text">{v.checkResidence}</p>
        </div>

        <div className="ml-auto w-[440px] shrink-0">
          <p className="flex items-center gap-2 text-[14px] text-avalon-text-strong">
            {defaults.residenceCountry}
            <span aria-hidden className="text-[16px] leading-none">
              {defaults.residenceFlag}
            </span>
          </p>
          <p className="mt-3 text-[12px] leading-[18px] text-avalon-text">
            If this is not your country of permanent residence, please email us at{" "}
            <a href="mailto:support@avalonbroker.com" className="text-avalon-primary hover:underline">
              support@avalonbroker.com
            </a>
          </p>

          <FormError className="mt-4">{error("form")}</FormError>

          {done ? (
            <p className="mt-6 rounded-[2px] bg-avalon-surface px-4 py-3 text-center text-[14px] text-avalon-primary">
              Your details were saved. The next step is a proof of identity.{" "}
              <a href={`/${locale}/verification`} className="underline">
                Refresh
              </a>
            </p>
          ) : (
            <button
              type="submit"
              disabled={busy}
              className="mt-6 h-11 w-full rounded-[2px] border border-avalon-primary bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
            >
              {busy ? "Saving…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
