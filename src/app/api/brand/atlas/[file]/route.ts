/**
 * The engine's sprite atlas, with this platform's logo in it when there is one.
 *
 * The traderoom draws its own wordmark from inside the atlas rather than from
 * a file it requests, so replacing `logo.png` never reached it. A branded copy
 * is built by `scripts/brand-engine-atlas.mjs` into `public/storage/brand-atlas`
 * and served here; a platform that has uploaded no logo has no copy, and the
 * mirrored original is served instead.
 *
 * Serving it through a route rather than writing over the mirror is
 * deliberate: the mirror is somebody else's build, refetched on demand, and
 * editing it means the next refetch silently throws the branding away.
 *
 * No administrator check — this is the platform's own mark, drawn for anyone
 * who can see the traderoom.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { png: "image/png", webp: "image/webp" };

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;

  /*
   * The name is checked rather than trusted. It arrives in the path and is
   * joined onto a directory, so anything but a known atlas filename is a way
   * to read a file that is none of the engine's business.
   */
  if (!/^atlas_[a-z0-9_]+\.(png|webp)$/.test(file)) {
    return NextResponse.json({ error: "no such atlas" }, { status: 404 });
  }

  const extension = file.split(".").pop() ?? "png";
  const branded = path.join(process.cwd(), "public", "storage", "brand-atlas", file);
  const original = path.join(process.cwd(), "public", "engine", file);

  const body = (await readFile(branded).catch(() => null)) ?? (await readFile(original).catch(() => null));
  if (!body) return NextResponse.json({ error: "no such atlas" }, { status: 404 });

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "content-type": TYPES[extension] ?? "application/octet-stream",
      /*
       * Short, because the branding changes when somebody uploads a logo and a
       * traderoom showing the old mark for an hour is the complaint this whole
       * route exists to answer.
       */
      "cache-control": "public, max-age=60",
    },
  });
}
