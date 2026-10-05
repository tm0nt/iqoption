/**
 * The accepted-documents rules, read from settings.
 *
 * Merged over the defaults the same way as every other setting: a row that
 * names some countries replaces those countries' rules and leaves the list
 * otherwise as it was would be surprising, so the stored list is taken whole
 * when it is valid and the defaults stand in only when it is missing or
 * broken.
 */
import { prisma } from "@/lib/db";
import { DOCUMENT_TYPES, KYC_DEFAULTS, type CountryRule, type DocumentType, type KycRules } from "./rules-types";

export const KYC_KEY = "kyc.documents";

export function readRules(value: unknown): KycRules {
  if (!value || typeof value !== "object" || !Array.isArray((value as KycRules).countries)) return KYC_DEFAULTS;
  const countries: CountryRule[] = [];
  for (const raw of (value as KycRules).countries) {
    if (!raw || typeof raw.code !== "string" || !/^[A-Z]{2}$/.test(raw.code) || !Array.isArray(raw.documents)) continue;
    const documents = raw.documents.filter((doc): doc is DocumentType => (DOCUMENT_TYPES as readonly string[]).includes(doc));
    if (documents.length > 0 && !countries.some((country) => country.code === raw.code)) {
      countries.push({ code: raw.code, documents: [...new Set(documents)] });
    }
  }
  return countries.length > 0 ? { countries } : KYC_DEFAULTS;
}

export async function kycRules(): Promise<KycRules> {
  const row = await prisma.platformSetting.findUnique({ where: { key: KYC_KEY } });
  return readRules(row?.value);
}
