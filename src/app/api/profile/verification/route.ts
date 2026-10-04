/**
 * The details step of identity verification.
 *
 * Nothing here decides whether someone is who they say they are — that is what
 * the document step is for. This records what they claim, so the document can
 * be read against it, and moves the account to PENDING.
 *
 * The date arrives as `dd.mm.yyyy`, which is what the form shows and what a
 * European identity document prints. Parsing it by hand rather than with
 * `new Date(string)` is deliberate: that constructor reads an ambiguous
 * `03.04.2001` as whichever order the runtime's locale prefers, and silently
 * swapping day for month in a date of birth is the kind of error nobody
 * notices until a document is rejected.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isKnownCountry } from "@/lib/cabinet/countries";

export const dynamic = "force-dynamic";

/** Someone old enough to open an account, and not impossibly old. */
const MIN_AGE = 18;
const MAX_AGE = 120;

function parseBirthDate(raw: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw.trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects the dates that look valid and are not: 31.02, 00.01, month 13.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function yearsSince(date: Date) {
  const now = new Date();
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  const month = now.getUTCMonth() - date.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < date.getUTCDate())) years -= 1;
  return years;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const errors: Record<string, string[]> = {};
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");

  const firstName = text("firstName");
  const lastName = text("lastName");
  const citizenship = text("citizenship").toUpperCase();

  if (firstName.length < 2) errors.firstName = ["Enter your first name as it appears on your ID."];
  if (lastName.length < 2) errors.lastName = ["Enter your last name as it appears on your ID."];
  // Against the list, not against a shape: `XX` is two letters and no country.
  if (!isKnownCountry(citizenship)) errors.citizenship = ["Choose a country."];

  const dateOfBirth = parseBirthDate(text("dateOfBirth"));
  if (!dateOfBirth) {
    errors.dateOfBirth = ["Enter the date as dd.mm.yyyy."];
  } else {
    const age = yearsSince(dateOfBirth);
    if (age < MIN_AGE) errors.dateOfBirth = [`You have to be at least ${MIN_AGE} to open an account.`];
    else if (age > MAX_AGE) errors.dateOfBirth = ["Check the year."];
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.platformId },
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      dateOfBirth,
      citizenship,
      isUsPerson: body.isUsPerson === true,
      kycStatus: "PENDING",
    },
    select: { id: true, firstName: true, lastName: true, kycStatus: true },
  });

  return NextResponse.json({ user });
}
