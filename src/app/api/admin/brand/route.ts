/**
 * The platform's identity: read and change.
 *
 * One row in `platform_settings`, because the alternative is the brand being
 * spread across a dozen files and a deploy. The middleware refuses anyone who
 * is not an administrator before this runs.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { setting, type Brand } from "@/lib/engine/settings";

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
    const { brandAtlas } = await import("../../../../../scripts/brand-engine-atlas.mjs");
    await brandAtlas(brand, () => {});
  } catch (reason) {
    console.error("[brand] could not rebuild the engine atlas:", reason);
  }
}

const THEMES = ["black", "white", "blue", "grey"];

export async function GET() {
  return NextResponse.json({ brand: await setting("brand") });
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "expected a JSON object" }, { status: 400 });

  const current = await setting("brand");
  const next: Brand = { ...current };

  const name = text(body.name, 64);
  if (name !== null) {
    if (!name) return NextResponse.json({ error: "the platform needs a name" }, { status: 400 });
    next.name = name;
  }

  const email = text(body.supportEmail, 160);
  if (email !== null) {
    // Loose on purpose: this is displayed, not authenticated against.
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "that support address is not an address" }, { status: 400 });
    }
    next.supportEmail = email;
  }

  const theme = text(body.theme, 8);
  if (theme !== null) {
    if (!THEMES.includes(theme)) {
      return NextResponse.json({ error: `theme must be one of ${THEMES.join(", ")}` }, { status: 400 });
    }
    next.theme = theme as Brand["theme"];
  }

  const primary = text(body.primary, 32);
  if (primary !== null) {
    /*
     * A CSS colour, checked rather than trusted: it is written into a style
     * attribute, and an unchecked value there is a way into the page.
     */
    if (!/^#[0-9a-fA-F]{3,8}$/.test(primary)) {
      return NextResponse.json({ error: "the accent must be a hex colour, like #00b17a" }, { status: 400 });
    }
    next.primary = primary;
  }

  /*
   * The three sentences a link preview and a browser tab are made of. Each is
   * allowed to be empty: a platform that has not written a tagline should show
   * none rather than ours.
   */
  for (const [field, max] of [["tagline", 160], ["description", 320]] as const) {
    const value = text(body[field], max);
    if (value !== null) next[field] = value;
  }

  const siteUrl = text(body.siteUrl, 256);
  if (siteUrl !== null) {
    /*
     * Checked rather than trusted: it becomes an `og:url` and a canonical, and
     * a `javascript:` there is a link anyone following the card would run.
     */
    if (siteUrl && !/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(siteUrl)) {
      return NextResponse.json({ error: "the address has to start with http:// or https://" }, { status: 400 });
    }
    next.siteUrl = siteUrl.replace(/\/+$/, "");
  }

  // An empty string clears a logo, which is how you go back to the build's own.
  for (const slot of ["logoUrl", "logoBigUrl", "iconUrl"] as const) {
    const value = text(body[slot], 512);
    if (value === null) continue;
    if (value && !value.startsWith("/api/admin/brand/logo/")) {
      return NextResponse.json({ error: "a logo has to be one this platform stored" }, { status: 400 });
    }
    next[slot] = value;
  }

  await prisma.platformSetting.upsert({
    where: { key: "brand" },
    update: { value: next },
    create: { key: "brand", value: next },
  });

  /*
   * The name is in the root layout's metadata, and the auth pages under it are
   * prerendered — so without this they keep serving the name they were built
   * with. Measured, not assumed: the login page answered with the old name
   * while the row already held the new one.
   *
   * `"layout"` on `/` reaches every page beneath it, which is all of them.
   * From a route handler this marks the paths rather than rebuilding them now,
   * so the cost falls on the first visit to each after a rename.
   */
  await rebuildEngineAtlas(next);
  revalidatePath("/", "layout");

  return NextResponse.json({ brand: next });
}
