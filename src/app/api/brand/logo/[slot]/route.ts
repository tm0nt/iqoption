/**
 * The logo the engine asks for, which may or may not be the build's.
 *
 * The traderoom's shell loads `/engine/logo.png` and `/engine/logo-big.png`
 * with an `<img src>`, which goes through neither `fetch` nor
 * `XMLHttpRequest` — so the host's rewrite table cannot reach it. The
 * middleware sends those two paths here instead, which works however the
 * browser asks for them.
 *
 * No administrator check: this is the platform's own mark, shown to anyone
 * who can see the login page.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { setting } from "@/lib/engine/settings";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml" };

/**
 * What the mirrored build carries, for a platform that has uploaded nothing.
 *
 * The icon has no counterpart in the engine build — the tab icon came from the
 * site's SEO folder — so it falls back there instead.
 */
const BUILT_IN: Record<string, string> = { main: "engine/logo.png", big: "engine/logo-big.png" };
const BUILT_IN_ICON = "sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/seo/favicon.png";

/** Which brand field holds each slot's upload. */
const FIELD = { main: "logoUrl", big: "logoBigUrl", icon: "iconUrl" } as const;

export async function GET(_request: Request, context: { params: Promise<{ slot: string }> }) {
  const { slot } = await context.params;
  if (slot !== "main" && slot !== "big" && slot !== "icon") {
    return NextResponse.json({ error: "no such logo" }, { status: 404 });
  }

  const brand = await setting("brand");
  const uploaded = brand[FIELD[slot]];

  /*
   * The stored value is the URL of this platform's own upload route, so the
   * file name is taken from it rather than trusted whole — a value that has
   * been edited in the database cannot name a path outside the upload folder.
   */
  const name = uploaded.split("/").pop() ?? "";
  if (uploaded && /^[a-f0-9]{32}\.(png|jpg|svg)$/.test(name)) {
    const body = await readFile(path.join(process.cwd(), "var", "uploads", "brand", name)).catch(() => null);
    if (body) {
      return new NextResponse(new Uint8Array(body), {
        headers: {
          "content-type": TYPES[name.split(".").pop() ?? "png"],
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
          "cache-control": "public, max-age=60",
        },
      });
    }
  }

  // Nothing uploaded, or the file is gone: the build's own.
  const builtIn = slot === "icon" ? BUILT_IN_ICON : BUILT_IN[slot];
  const body = await readFile(path.join(process.cwd(), "public", builtIn)).catch(() => null);
  if (!body) return NextResponse.json({ error: "no logo" }, { status: 404 });

  return new NextResponse(new Uint8Array(body), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=60" },
  });
}
