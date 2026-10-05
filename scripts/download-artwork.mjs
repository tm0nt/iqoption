#!/usr/bin/env node
/**
 * Mirrors the artwork the engine draws from the broker's CDN.
 *
 *   node scripts/download-artwork.mjs <capture.jsonl> [--force]
 *
 * The engine asks for instrument icons and indicator thumbnails at
 * `/storage/public/<hashed path>.png`. None of those paths is derivable — they
 * are content hashes — so the list comes from a recording of the live
 * platform, where every `image` field carries one.
 *
 * `next.config.ts` rewrites `/storage/public/*` to a transparent pixel so the
 * engine's image loader is satisfied when nothing is mirrored. That rewrite is
 * an `afterFiles` one, which Next checks *after* `public/`, so a file mirrored
 * here is served and only the gaps fall through to the pixel. Nothing in the
 * config has to change for this to take effect.
 *
 * As with the engine itself: none of this is ours, none of it is committed,
 * and `public/storage/` is gitignored.
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const CDN = "https://fsms.trade.avalonbroker.com";
const OUT = new URL("../public/storage/public/", import.meta.url).pathname;

const capture = process.argv[2];
const force = process.argv.includes("--force");
if (!capture) {
  console.error("say which recording to read: node scripts/download-artwork.mjs <capture.jsonl>");
  process.exit(1);
}

/*
 * Every `/storage/public/...` path the recording mentions, wherever it sits.
 * A regular expression rather than a walk of the parsed frames: the paths turn
 * up in several different shapes and all that matters is the path itself.
 */
const text = readFileSync(capture, "utf8");
const paths = [...new Set([...text.matchAll(/\/storage\/public\/[A-Za-z0-9/_-]+\.(?:png|jpg|svg|webp)/g)].map((m) => m[0]))];
console.log(`${paths.length} imagem(ns) na gravação`);

let fetched = 0;
let skipped = 0;
let failed = 0;
let bytes = 0;

for (const path of paths) {
  const target = join(OUT, path.replace("/storage/public/", ""));
  if (!force) {
    const existing = await stat(target).catch(() => null);
    if (existing?.size) { skipped += 1; continue; }
  }
  const response = await fetch(`${CDN}${path}`, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
  if (!response?.ok) { failed += 1; continue; }

  const type = response.headers.get("content-type") ?? "";
  // The CDN answers a miss with an HTML page rather than a 404, and an HTML
  // file written as a .png is worse than no file at all.
  if (!type.startsWith("image/")) { failed += 1; continue; }

  const body = new Uint8Array(await response.arrayBuffer());
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
  fetched += 1;
  bytes += body.byteLength;
}

console.log(`baixadas ${fetched}, já existiam ${skipped}, falharam ${failed}, ${(bytes / 1024).toFixed(0)} KiB`);
