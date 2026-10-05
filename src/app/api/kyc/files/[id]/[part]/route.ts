/**
 * One photo from an identity submission.
 *
 * Only to its owner or to an administrator, checked here on every request —
 * this route is the only way a document leaves the disk. Never cached by
 * anything in between, and never sniffed by the browser into something other
 * than the image it is.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { readImage } from "@/lib/kyc/files";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; part: string }> };

export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user) return new NextResponse("not found", { status: 404 });

  const { id: raw, part } = await context.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0 || !["front", "back", "selfie"].includes(part)) {
    return new NextResponse("not found", { status: 404 });
  }

  const submission = await prisma.kycSubmission.findUnique({
    where: { id },
    select: { userId: true, frontFile: true, backFile: true, selfieFile: true },
  });
  // A 404 either way: whether a submission exists is not anyone else's business.
  if (!submission || (submission.userId !== session.user.platformId && !session.user.isAdmin)) {
    return new NextResponse("not found", { status: 404 });
  }

  const name = part === "front" ? submission.frontFile : part === "back" ? submission.backFile : submission.selfieFile;
  const image = name ? await readImage(name) : null;
  if (!image) return new NextResponse("not found", { status: 404 });

  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "content-type": image.type,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}
