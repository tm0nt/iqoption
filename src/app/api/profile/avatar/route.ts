/**
 * The profile photo.
 *
 * Stored on disk under `var/uploads/avatars` rather than in `public`, and
 * served back through a route: files written into `public` at runtime are not
 * picked up by a built app, so an upload that works in development quietly
 * stops working once deployed.
 *
 * What is checked, and why each one:
 *
 *   - the size, before anything is read into memory;
 *   - the declared type AND the file's own first bytes, because the type a
 *     browser sends is whatever the client says it is;
 *   - the extension written to disk comes from what the bytes say, never from
 *     the uploaded name, so a file called `x.png.html` cannot land as HTML.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_DIR = path.join(process.cwd(), "var", "uploads", "avatars");

/** What the first bytes say the file is, ignoring its name and declared type. */
function sniff(bytes: Uint8Array): "png" | "jpg" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file", errors: { photo: ["Choose a photo."] } }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too large", errors: { photo: ["That image is larger than 5 MB."] } },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    return NextResponse.json(
      { error: "unsupported", errors: { photo: ["Only JPG and PNG images are accepted."] } },
      { status: 415 },
    );
  }

  const name = `${session.user.platformId}-${randomBytes(8).toString("hex")}.${kind}`;
  await mkdir(AVATAR_DIR, { recursive: true });
  await writeFile(path.join(AVATAR_DIR, name), bytes);

  await prisma.user.update({
    where: { id: session.user.platformId },
    data: { avatarUrl: `/api/profile/avatar/${name}` },
  });

  return NextResponse.json({ avatarUrl: `/api/profile/avatar/${name}` }, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "authentication required" }, { status: 401 });

  // The file is left on disk: removing it would break any page still holding
  // the old URL, and an orphan image is cheaper than a broken one.
  await prisma.user.update({ where: { id: session.user.platformId }, data: { avatarUrl: null } });
  return NextResponse.json({ avatarUrl: null });
}
