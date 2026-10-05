/**
 * Which documents are accepted, country by country.
 *
 * Its own route, like the cashier's, so the list is checked before it is
 * written: a country code, at least one known document per country, no
 * country twice. A list with nothing valid in it is refused rather than
 * stored, since the reader would quietly fall back to the defaults and the
 * administrator would never know their change did nothing.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KYC_KEY, kycRules } from "@/lib/kyc/rules";
import { DOCUMENT_TYPES, type CountryRule, type DocumentType } from "@/lib/kyc/rules-types";

export const dynamic = "force-dynamic";

const DESCRIPTION = "Identity verification: the documents accepted for each country. Edited under Verification (KYC).";

export async function GET() {
  return NextResponse.json({ rules: await kycRules() });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as { countries?: unknown } | null;
  if (!body || !Array.isArray(body.countries)) {
    return NextResponse.json({ error: "expected { countries: [{ code, documents }] }" }, { status: 400 });
  }

  const countries: CountryRule[] = [];
  for (const raw of body.countries as { code?: unknown; documents?: unknown }[]) {
    const code = typeof raw?.code === "string" ? raw.code.trim().toUpperCase() : "";
    if (!/^[A-Z]{2}$/.test(code)) return NextResponse.json({ error: `"${String(raw?.code)}" is not a country code` }, { status: 400 });
    if (countries.some((country) => country.code === code)) {
      return NextResponse.json({ error: `${code} is listed twice` }, { status: 400 });
    }
    const documents = Array.isArray(raw.documents)
      ? [...new Set(raw.documents.filter((doc): doc is DocumentType => (DOCUMENT_TYPES as readonly unknown[]).includes(doc)))]
      : [];
    if (documents.length === 0) return NextResponse.json({ error: `${code} needs at least one document` }, { status: 400 });
    countries.push({ code, documents: DOCUMENT_TYPES.filter((doc) => documents.includes(doc)) });
  }
  if (countries.length === 0) return NextResponse.json({ error: "at least one country is needed" }, { status: 400 });

  const value = { countries };
  await prisma.platformSetting.upsert({
    where: { key: KYC_KEY },
    create: { key: KYC_KEY, value, description: DESCRIPTION },
    update: { value },
  });
  return NextResponse.json({ rules: value });
}
