/**
 * Sending identity documents for review.
 *
 * Multipart: the issuing country, the document type, its number (the CPF for
 * Brazil), and three photos — front, back where the document has one, and a
 * selfie holding it. Every rule the form shows is enforced here again,
 * because the form is a courtesy a client can skip:
 *
 *   - the personal details step comes first, and a verified account or one
 *     already waiting on a review cannot send another set;
 *   - the country and document must be ones the platform accepts, and the
 *     number has to look like one (a CPF has to check out);
 *   - each photo is at most 8 MB and has to *be* a JPEG, PNG or WebP by its
 *     own bytes, whatever it claims;
 *   - five attempts a day, so the review queue cannot be flooded.
 *
 * Files are written before the row; if the row cannot be written they are
 * removed again, so a failed attempt leaves nothing on disk.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { kycRules } from "@/lib/kyc/rules";
import { DOCUMENT_TYPES, NEEDS_BACK, documentsFor, normalizeDocumentNumber, type DocumentType } from "@/lib/kyc/rules-types";
import { MAX_FILE_BYTES, removeImages, sniff, storeImage, type ImageKind } from "@/lib/kyc/files";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 5;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });
  const userId = session.user.platformId;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected a multipart form" }, { status: 400 });
  const t = cabinetExtra(String(form.get("locale") ?? "en")).kyc;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, firstName: true, lastName: true, dateOfBirth: true },
  });
  if (!user) return NextResponse.json({ error: "no such account" }, { status: 404 });
  if (user.kycStatus === "APPROVED") return NextResponse.json({ error: t.alreadyVerified }, { status: 409 });
  if (user.kycStatus === "NONE" || !user.firstName || !user.lastName || !user.dateOfBirth) {
    return NextResponse.json({ error: t.needDetails }, { status: 409 });
  }

  const [pending, recent] = await Promise.all([
    prisma.kycSubmission.count({ where: { userId, status: "PENDING" } }),
    prisma.kycSubmission.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  if (pending > 0) return NextResponse.json({ error: t.alreadyPending }, { status: 409 });
  if (recent >= DAILY_LIMIT) return NextResponse.json({ error: t.tooMany }, { status: 429 });

  const errors: Record<string, string[]> = {};
  const rules = await kycRules();
  const country = String(form.get("country") ?? "").toUpperCase();
  const accepted = documentsFor(rules, country);
  const documentType = String(form.get("documentType") ?? "") as DocumentType;

  if (accepted.length === 0) errors.country = [t.countryInvalid];
  else if (!(DOCUMENT_TYPES as readonly string[]).includes(documentType) || !accepted.includes(documentType)) {
    errors.documentType = [t.docTypeInvalid];
  }
  const documentNumber = normalizeDocumentNumber(country, String(form.get("documentNumber") ?? ""));
  if (!documentNumber) errors.documentNumber = [country === "BR" ? t.cpfInvalid : t.numberInvalid];

  /** A photo from the form, checked, or a reason it was refused. */
  async function photo(name: "front" | "back" | "selfie", required: boolean, missing: string) {
    const file = form!.get(name);
    if (!(file instanceof File) || file.size === 0) {
      if (required) errors[name] = [missing];
      return null;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors[name] = [t.fileSize];
      return null;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) {
      errors[name] = [t.fileType];
      return null;
    }
    return { bytes, kind } as { bytes: Uint8Array; kind: ImageKind };
  }

  const needsBack = (DOCUMENT_TYPES as readonly string[]).includes(documentType) ? NEEDS_BACK[documentType] : true;
  const front = await photo("front", true, t.frontRequired);
  const back = await photo("back", needsBack, t.backRequired);
  const selfie = await photo("selfie", true, t.selfieRequired);

  if (Object.keys(errors).length > 0 || !front || !selfie || (needsBack && !back)) {
    return NextResponse.json({ error: "invalid submission", errors }, { status: 400 });
  }

  const written: string[] = [];
  try {
    const frontFile = await storeImage(userId, front.bytes, front.kind);
    written.push(frontFile);
    const backFile = needsBack && back ? await storeImage(userId, back.bytes, back.kind) : null;
    if (backFile) written.push(backFile);
    const selfieFile = await storeImage(userId, selfie.bytes, selfie.kind);
    written.push(selfieFile);

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.kycSubmission.create({
        data: { userId, country, documentType, documentNumber: documentNumber!, frontFile, backFile, selfieFile },
        select: { id: true, status: true, createdAt: true },
      });
      await tx.user.update({ where: { id: userId }, data: { kycStatus: "PENDING" } });
      return created;
    });
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    await removeImages(written);
    console.error("could not store a KYC submission:", error);
    return NextResponse.json({ error: t.failed }, { status: 500 });
  }
}
