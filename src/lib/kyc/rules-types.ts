/**
 * Which identity documents are accepted, country by country — with no server
 * in it, because the upload form needs the same rules the route enforces.
 *
 * Brazil is the platform's home and is treated as such: any of its documents,
 * keyed on the CPF that all of them carry. Every other country the platform
 * operates in gets the documents that country actually issues as identity —
 * an EU national ID card, a Mexican INE, an Argentine DNI — and a passport,
 * which works everywhere. An administrator can narrow or widen any of it.
 */

export const DOCUMENT_TYPES = ["ID_CARD", "DRIVERS_LICENSE", "PASSPORT", "RESIDENCE_PERMIT"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** A passport's back carries nothing; every other document has one worth reading. */
export const NEEDS_BACK: Record<DocumentType, boolean> = {
  ID_CARD: true,
  DRIVERS_LICENSE: true,
  PASSPORT: false,
  RESIDENCE_PERMIT: true,
};

export type CountryRule = { code: string; documents: DocumentType[] };
export type KycRules = { countries: CountryRule[] };

const EVERYWHERE: DocumentType[] = ["ID_CARD", "PASSPORT", "DRIVERS_LICENSE"];
/** In the EU a driving licence is not proof of identity for this purpose; a residence permit is. */
const EUROPE: DocumentType[] = ["ID_CARD", "PASSPORT", "RESIDENCE_PERMIT"];

export const KYC_DEFAULTS: KycRules = {
  countries: [
    { code: "BR", documents: ["ID_CARD", "DRIVERS_LICENSE", "PASSPORT"] },
    { code: "PT", documents: EUROPE },
    { code: "ES", documents: EUROPE },
    { code: "IT", documents: EUROPE },
    { code: "FR", documents: EUROPE },
    { code: "DE", documents: EUROPE },
    { code: "GB", documents: ["PASSPORT", "DRIVERS_LICENSE", "RESIDENCE_PERMIT"] },
    { code: "AR", documents: EVERYWHERE },
    { code: "MX", documents: EVERYWHERE },
    { code: "CL", documents: EVERYWHERE },
    { code: "CO", documents: EVERYWHERE },
    { code: "PE", documents: EVERYWHERE },
    { code: "ZA", documents: EVERYWHERE },
    { code: "IN", documents: EVERYWHERE },
    { code: "ID", documents: EVERYWHERE },
    { code: "TH", documents: EVERYWHERE },
  ],
};

export function documentsFor(rules: KycRules, country: string): DocumentType[] {
  return rules.countries.find((rule) => rule.code === country)?.documents ?? [];
}

/** A CPF: eleven digits whose last two are check digits of the first nine. */
export function isValidCpf(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

/**
 * The number as it will be stored, or null when it cannot be one.
 *
 * Brazil asks for the CPF and checks its digits. Elsewhere numbers take too
 * many shapes to check honestly, so this only insists on something that could
 * be a document number: four to thirty-two letters, digits and separators.
 */
export function normalizeDocumentNumber(country: string, raw: string): string | null {
  if (country === "BR") {
    const digits = raw.replace(/\D/g, "");
    return isValidCpf(digits) ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}` : null;
  }
  const text = raw.trim().toUpperCase().replace(/\s+/g, " ");
  return /^[A-Z0-9][A-Z0-9 .\-/]{2,30}[A-Z0-9]$/.test(text) ? text : null;
}
