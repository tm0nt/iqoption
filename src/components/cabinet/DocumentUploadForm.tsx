"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { NEEDS_BACK, type DocumentType } from "@/lib/kyc/rules-types";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";

type Part = "front" | "back" | "selfie";

/** Longest side, in pixels, of a photo as it is sent. Plenty to read a document by. */
const MAX_SIDE = 2000;

/**
 * A phone photo is 4–12 MB; three of them would pass the 10 MB the proxy in
 * front of every route buffers, and nobody needs 48 megapixels to read a
 * passport. Anything large is redrawn at 2000px as a JPEG before it is sent.
 * A file the browser cannot decode is sent as it is, for the server to refuse
 * with a reason.
 */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= 1_500_000 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * The document step: which document, its number, and three photos.
 *
 * The country decides the documents offered and what the number field asks
 * for — Brazil asks for the CPF, which every Brazilian document carries and
 * which the route checks digit by digit.
 */
export function DocumentUploadForm({
  countries,
  defaultCountry,
  locale,
}: {
  /** Names already in the page's language. */
  countries: { code: string; name: string; documents: DocumentType[] }[];
  defaultCountry: string;
  locale: string;
}) {
  const t = cabinetExtra(locale).kyc;
  const router = useRouter();
  const initial = countries.find((country) => country.code === defaultCountry) ?? countries[0];
  const [country, setCountry] = useState(initial?.code ?? "");
  const [documentType, setDocumentType] = useState<DocumentType | "">(initial?.documents[0] ?? "");
  const [files, setFiles] = useState<Partial<Record<Part, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Part, string>>>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const offered = countries.find((candidate) => candidate.code === country)?.documents ?? [];
  const needsBack = documentType ? NEEDS_BACK[documentType] : true;

  /*
   * Previews are object URLs, which hold memory until they are let go: the one
   * a new photo replaces is released at once, the rest when the form goes.
   */
  const live = useRef<Partial<Record<Part, string>>>({});
  useEffect(() => () => Object.values(live.current).forEach((url) => url && URL.revokeObjectURL(url)), []);

  function pick(part: Part, file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (live.current[part]) URL.revokeObjectURL(live.current[part]!);
    live.current[part] = url;
    setFiles((current) => ({ ...current, [part]: file }));
    setPreviews((current) => ({ ...current, [part]: url }));
    setErrors((current) => ({ ...current, [part]: [] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});

    try {
      const body = new FormData();
      body.set("locale", locale);
      body.set("country", country);
      body.set("documentType", documentType);
      body.set("documentNumber", String(form.get("documentNumber") ?? ""));
      for (const part of ["front", "back", "selfie"] as const) {
        if (part === "back" && !needsBack) continue;
        const file = files[part];
        if (file) body.set(part, await shrink(file), `${part}.jpg`);
      }

      const response = await fetch("/api/profile/kyc", { method: "POST", body });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(said?.errors ?? { form: [said?.error ?? t.failed] });
        return;
      }
      router.refresh();
    } catch {
      setErrors({ form: [t.failed] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");
  const field =
    "h-[50px] w-full rounded-[4px] border border-avalon-border bg-white px-4 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

  const tile = (part: Part, title: string, hint: string) => (
    <div className="flex flex-col rounded-[4px] border border-avalon-surface-hover p-4">
      <p className="text-[14px] font-semibold text-avalon-text-strong">{title}</p>
      <p className="mt-1 text-[12px] leading-[17px] text-avalon-text">{hint}</p>
      <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2px] bg-avalon-surface">
        {previews[part] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previews[part]} alt={title} className="size-full object-contain" />
        ) : (
          <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="#acabac" strokeWidth="1.5" aria-hidden>
            {part === "selfie" ? (
              <>
                <circle cx="15" cy="12" r="6" />
                <path d="M4 30c1-6 5.5-9 11-9s10 3 11 9" />
                <rect x="25" y="14" width="13" height="9" rx="1.5" />
              </>
            ) : (
              <>
                <rect x="2" y="4" width="36" height="24" rx="3" />
                <circle cx="13" cy="15" r="4" />
                <path d="M7 24c1-3 3.3-4.5 6-4.5s5 1.5 6 4.5M23 11h11M23 16h11M23 21h7" />
              </>
            )}
          </svg>
        )}
      </div>
      <label className="mt-3 flex h-[40px] cursor-pointer items-center justify-center rounded-[2px] border border-dashed border-avalon-border-muted text-[13px] text-avalon-text transition-colors hover:border-avalon-primary hover:text-avalon-primary">
        {files[part] ? t.change : t.choose}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          {...(part === "selfie" ? { capture: "user" as const } : {})}
          className="sr-only"
          disabled={busy}
          onChange={(event) => pick(part, event.target.files?.[0])}
        />
      </label>
      <FormError className="mb-0 mt-2">{error(part)}</FormError>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="text-[14px] leading-[22px] text-avalon-text">{t.lead}</p>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-avalon-text">{t.country}</span>
          <select
            value={country}
            onChange={(event) => {
              const next = countries.find((candidate) => candidate.code === event.target.value);
              setCountry(event.target.value);
              setDocumentType(next?.documents[0] ?? "");
            }}
            disabled={busy}
            className={field}
          >
            {countries.map((candidate) => (
              <option key={candidate.code} value={candidate.code}>
                {candidate.name}
              </option>
            ))}
          </select>
          <FormError className="mb-0 mt-1">{error("country")}</FormError>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-avalon-text">{country === "BR" ? t.cpf : t.number}</span>
          <input
            name="documentNumber"
            key={country === "BR" ? "cpf" : "number"}
            inputMode={country === "BR" ? "numeric" : "text"}
            placeholder={country === "BR" ? "000.000.000-00" : ""}
            autoComplete="off"
            disabled={busy}
            className={field}
          />
          <span className="mt-1 block text-[12px] text-avalon-text">{country === "BR" ? t.cpfHint : t.numberHint}</span>
          <FormError className="mb-0 mt-1">{error("documentNumber")}</FormError>
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-avalon-text">{t.documentType}</legend>
        <div className="flex flex-wrap gap-2">
          {offered.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={documentType === type}
              onClick={() => setDocumentType(type)}
              disabled={busy}
              className={`rounded-[2px] border px-4 py-2.5 text-[14px] transition-colors ${
                documentType === type
                  ? "border-avalon-primary bg-avalon-primary/5 text-avalon-text-strong"
                  : "border-avalon-surface-hover bg-avalon-surface text-avalon-text hover:border-avalon-border-muted"
              }`}
            >
              {t.docTypes[type]}
            </button>
          ))}
        </div>
        <FormError className="mb-0 mt-2">{error("documentType")}</FormError>
      </fieldset>

      <div className={`grid gap-4 ${needsBack ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {tile("front", t.front, t.frontHint)}
        {needsBack && tile("back", t.back, t.backHint)}
        {tile("selfie", t.selfie, t.selfieHint)}
      </div>
      <p className="text-[12px] text-avalon-text">{t.formats}</p>

      <FormError>{error("form")}</FormError>
      <button
        type="submit"
        disabled={busy || !documentType}
        className="h-[50px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60 md:w-auto md:px-10"
      >
        {busy ? t.sending : t.submit}
      </button>
    </form>
  );
}
