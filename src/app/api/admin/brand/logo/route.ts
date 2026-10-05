/**
 * The platform's logo, uploaded.
 *
 * Kept on disk under `var/uploads/brand` and served through a route, for the
 * same reason the profile photo is: a file written into `public` at runtime is
 * not picked up by a built app, so an upload that works in development stops
 * working once deployed.
 *
 * SVG is accepted here and nowhere else in the app. A logo is a drawing and
 * SVG is how a brand delivers one, but SVG is also a document that can carry
 * script — so it is sniffed, refused if it contains a script or an event
 * handler, and served with a content type and `Content-Disposition` that stop
 * a browser treating it as a page.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { setting } from "@/lib/engine/settings";

export const dynamic = "force-dynamic";


/**
 * Rebuilds the engine's branded atlas, without letting it break the save.
 *
 * The traderoom draws its own wordmark from inside a sprite sheet, so a logo
 * that only reaches `logo.png` leaves the chart still showing the old mark.
 * This is a best-effort step: the brand row is already written by the time it
 * runs, and a platform whose atlas failed to rebuild is a platform with an old
 * logo in one place, not a platform that lost the upload.
 */
async function rebuildEngineAtlas(brand: unknown) {
  try {
    const { brandAtlas } = await import("../../../../../../scripts/brand-engine-atlas.mjs");
    await brandAtlas(brand, () => {});
  } catch (reason) {
    console.error("[brand] could not rebuild the engine atlas:", reason);
  }
}

const MAX_BYTES = 2 * 1024 * 1024;
export const BRAND_DIR = path.join(process.cwd(), "var", "uploads", "brand");

/** What the first bytes say the file is, ignoring its name and declared type. */
function sniff(bytes: Uint8Array): "png" | "jpg" | "svg" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";

  // An SVG is text; look for the tag rather than a magic number.
  const head = new TextDecoder().decode(bytes.slice(0, 1024)).toLowerCase();
  if (head.includes("<svg")) return "svg";
  return null;
}

/**
 * Whether an SVG is only a drawing.
 *
 * Crude on purpose: anything that looks like script or a link out is refused
 * rather than stripped, because a sanitiser that gets it wrong is worse than a
 * refusal somebody can act on.
 */
function svgIsSafe(bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes).toLowerCase();
  return !/<script|<foreignobject|\son\w+\s*=|javascript:|<!entity|<iframe/.test(text);
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  const slot = String(form?.get("slot") ?? "logoUrl");
  if (slot !== "logoUrl" && slot !== "logoBigUrl" && slot !== "iconUrl") {
    return NextResponse.json({ error: "unknown slot" }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "choose a file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "that image is larger than 2 MB" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) return NextResponse.json({ error: "only PNG, JPG and SVG are accepted" }, { status: 415 });
  if (kind === "svg" && !svgIsSafe(bytes)) {
    return NextResponse.json({ error: "that SVG contains script and was refused" }, { status: 415 });
  }

  // The name is random and the extension comes from the bytes, never from the
  // uploaded name, so a file called `x.svg.html` cannot land as HTML.
  const name = `${randomBytes(16).toString("hex")}.${kind}`;
  await mkdir(BRAND_DIR, { recursive: true });
  await writeFile(path.join(BRAND_DIR, name), bytes);

  const url = `/api/admin/brand/logo/${name}`;
  const brand = await setting("brand");
  await prisma.platformSetting.upsert({
    where: { key: "brand" },
    update: { value: { ...brand, [slot]: url } },
    create: { key: "brand", value: { ...brand, [slot]: url } },
  });

  // The engine keeps its own copy of the mark inside a sprite sheet, which no
  // amount of replacing `logo.png` reaches.
  await rebuildEngineAtlas({ ...brand, [slot]: url });

  // The tab icon is in the root layout's metadata, so the prerendered pages
  // under it have to be told. Same reason as the rename next door.
  revalidatePath("/", "layout");

  return NextResponse.json({ url });
}
