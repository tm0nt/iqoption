/**
 * The HTTP surface the engine expects, served from the database.
 *
 * The engine calls a fixed set of endpoints while it boots and refuses to
 * continue if one answers in a shape it cannot parse — see
 * docs/avalon-backend.md. Most of those answers are boot fixtures with nothing
 * to configure, and they stay as files under `public/engine-host/stubs`. The
 * few that carry platform identity are built here from `platform_settings`, so
 * changing the brand is a row edit rather than a deploy.
 *
 * Anything not named below is streamed from the static file of the same name.
 * A request for a file that does not exist answers 404 rather than an empty
 * body, because an empty body reads to the engine as a parse failure.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { engineConfig } from "@/lib/engine/settings";

/*
 * Two directories, because `appinit.json` sits beside the host page rather than
 * with the stubs — the engine asks for it on a path of its own.
 */
const STATIC_ROOTS = [
  path.join(process.cwd(), "public", "engine-host", "stubs"),
  path.join(process.cwd(), "public", "engine-host"),
];

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".png": "image/png",
};

/** The answers built from settings rather than read from disk. */
const DYNAMIC = new Set(["company.json", "check-session.json", "geoip.json"]);

async function dynamicBody(file: string) {
  const config = await engineConfig();

  if (file === "check-session.json") {
    /*
     * The signed-in person's own id, not a fixed one. The client compares what
     * this says against the `user_id` the feed reports for the ssid it was
     * given; if they differ it stays on its login view and never builds the
     * traderoom. The setting is the fallback for a request with no session,
     * which is what an engine booted outside the app looks like.
     */
    const session = await auth();
    /*
     * `user_id` has to match the account the market server hands the first
     * session, or the client compares the two, finds them different and stays
     * on its login view with the traderoom never built. Both sides default to
     * the same number; changing one means changing the other.
     */
    return {
      id: "local-development-session",
      data: {
        user_id: session?.user?.platformId ?? config.session.userId,
        brand_id: 1,
        company_id: 1,
        country_id: config.brand.countryId,
        modified: 0,
        platform: 9,
        ip: "127.0.0.1",
        user_agent: "local",
      },
      expires_at: 4102444800,
      expires_cache_at: 4102444800,
    };
  }

  if (file === "geoip.json") {
    // A bare string, not an object: an object here is reported as "Failed to
    // parse geo country" and the boot stops.
    return { isSuccessful: true, message: [], result: config.brand.countryFlag };
  }

  // company.json
  return {
    isSuccessful: true,
    message: [],
    result: {
      id: 1,
      name: config.brand.name,
      email: config.brand.supportEmail,
      country_id: config.brand.countryId,
      is_regulated: false,
    },
  };
}

export async function GET(request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;

  // The name comes from the URL, so it decides which file is read. Anything
  // with a separator in it is refused rather than normalised.
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    return NextResponse.json({ error: "bad stub name" }, { status: 400 });
  }

  if (DYNAMIC.has(file)) {
    return NextResponse.json(await dynamicBody(file), {
      headers: { "cache-control": "no-store" },
    });
  }

  /*
   * The engine's dictionary is per locale, and the file is named for it. A
   * locale we have not captured yet falls back to English rather than 404ing:
   * an empty body reads to the engine as a parse failure, and a traderoom in
   * the wrong language is better than one that will not start.
   */
  if (file === "lang-route-translations.json") {
    const locale = (new URL(request.url).searchParams.get("locale") ?? "en").replace(/[^a-z]/g, "").slice(0, 5);
    const candidates = [`lang-route-translations.${locale}.json`, file];
    for (const root of STATIC_ROOTS) {
      for (const candidate of candidates) {
        try {
          const body = await readFile(path.join(root, candidate));
          return new NextResponse(new Uint8Array(body), {
            headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
          });
        } catch {
          // Next candidate.
        }
      }
    }
  }

  for (const root of STATIC_ROOTS) {
    try {
      const body = await readFile(path.join(root, file));
      const type = CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream";
      return new NextResponse(new Uint8Array(body), {
        headers: { "content-type": type, "cache-control": "public, max-age=300" },
      });
    } catch {
      // Try the next directory; a miss in both is a 404 below.
    }
  }

  return NextResponse.json({ error: `no stub named ${file}` }, { status: 404 });
}
