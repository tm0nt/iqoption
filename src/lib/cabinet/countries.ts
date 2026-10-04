/**
 * The countries the verification form offers.
 *
 * Shared between the form and the endpoint that receives it, so the two cannot
 * disagree: a select constrains what a browser sends, and an endpoint that
 * trusts the select accepts `XX` from anything that is not one.
 */
export const VERIFICATION_COUNTRIES: { code: string; name: string }[] = [
  { code: "BR", name: "Brazil" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Spain" },
  { code: "AR", name: "Argentina" },
  { code: "MX", name: "Mexico" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
];

const BY_CODE = new Map(VERIFICATION_COUNTRIES.map((country) => [country.code, country.name]));

export function isKnownCountry(code: string): boolean {
  return BY_CODE.has(code);
}

/** The country's name, or the code itself when it is one we do not list. */
export function countryName(code: string): string {
  return BY_CODE.get(code) ?? code;
}
