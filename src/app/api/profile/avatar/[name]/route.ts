/**
 * Serves a stored profile photo.
 *
 * The name comes from the URL, so it decides which file is read: anything with
 * a separator in it is refused rather than normalised, and the name has to
 * match the shape this app writes — `<userId>-<hex>.png`. A loose check here is
 * a path traversal.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AVATAR_DIR } from "../route";

export const dynamic = "force-dynamic";

const NAME = /^\d+-[0-9a-f]{16}\.(png|jpg)$/;

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!NAME.test(name)) return new NextResponse("not found", { status: 404 });

  try {
    const bytes = await readFile(path.join(AVATAR_DIR, name));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": name.endsWith(".png") ? "image/png" : "image/jpeg",
        // The name carries random bytes, so a given URL is one image for ever.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
