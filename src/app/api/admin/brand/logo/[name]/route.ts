/**
 * Serving an uploaded logo back.
 *
 * Read from `var/uploads/brand`, which is outside `public` on purpose — see
 * the note on the upload route. The name is checked against the shape the
 * upload writes rather than sanitised, because a check that only admits
 * known-good names cannot be walked out of.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { BRAND_DIR } from "../route";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
};

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[a-f0-9]{32}\.(png|jpg|svg)$/.test(name)) {
    return NextResponse.json({ error: "no such file" }, { status: 404 });
  }

  const extension = name.split(".").pop() ?? "";
  const body = await readFile(path.join(BRAND_DIR, name)).catch(() => null);
  if (!body) return NextResponse.json({ error: "no such file" }, { status: 404 });

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "content-type": TYPES[extension],
      // An SVG is a document as much as an image; this stops a browser from
      // ever rendering one as a page on this origin.
      "content-disposition": "inline",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      "cache-control": "public, max-age=300",
    },
  });
}
