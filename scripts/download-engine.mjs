#!/usr/bin/env node
/**
 * Mirrors the traderoom's WebGL engine into `public/engine/`.
 *
 * The engine is a 103 MB Emscripten build plus the shell that hosts it. None of
 * it is ours and none of it is committed — `public/engine/` is gitignored and
 * this script refetches it on demand.
 *
 *   node scripts/download-engine.mjs [--force]
 *
 * The file list comes from the traderoom's own `toLoad.js` manifest, read at
 * the version pinned in `RES_VERSION` below. Bump that when the site ships a
 * new build; the engine filenames carry its content hash (`aa60ee59`).
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ORIGIN = "https://trade.avalonbroker.com";
const BASE = `${ORIGIN}/traderoom`;
const OUT = new URL("../public/engine/", import.meta.url).pathname;
const RES_VERSION = "1788361536";
const ENGINE = "glengineaa60ee59";
const FORCE = process.argv.includes("--force");

/** The shell: manifest, app bundle, styles, font loader. */
const SHELL = [
  "toLoad.js",
  "bundle.js",
  "bundle.css",
  "style.css",
  "webfont.js",
  "translations.json",
  "logo.png",
  "logo-big.png",
  "saas.svg",
  "appcrash.svg",
];

/** Referenced by url() in style.css and bundle.css. */
const STYLE_ASSETS = [
  "Roboto-Regular.ttf",
  "Roboto-Bold.ttf",
  "Roboto-Light.ttf",
  "map.png",
];

/** The engine itself. `.data` is the virtual filesystem, `.wasm` the build. */
const ENGINE_FILES = [`${ENGINE}.js`, `${ENGINE}.data`, `${ENGINE}.wasm`];

/** Texture atlases, as listed by `cacheImagesList` in toLoad.js. */
const ATLASES = [
  "atlas_emoji§1",
  "atlas_huge_and_rare§_gs1",
  "atlas_huge_and_rare§1",
  "atlas_generic§1",
  "atlas_generic§2",
  "atlas_generic§3",
  "atlas_generic§_gs1",
  "atlas_generic§_gs2",
  "atlas_generic§_gs3",
  "atlas_generic§_gs4",
  "atlas_generic§_gs5",
  "atlas_generic§_gs6",
  "atlas_generic§_gs7",
].flatMap((name) => {
  const stem = name.replace("§", "aa60ee59");
  return [`${stem}.png`, `${stem}.webp`];
});

/** Interface sounds, as listed by `soundNames`. */
const SOUNDS = [
  "sound_click", "sound_welcome", "sound_deal_loose_notification", "sound_deal_win",
  "sound_tab_switch", "sound_deal_win_notification", "sound_error", "sound_make_deal",
  "sound_tournament_finish", "sound_alert", "sound_deal_loose", "sound_todo_check",
  "sound_option_expiration_time", "sound_tournament_win", "sound_chat_message",
  "sound_tournament_start",
].flatMap((name) => [`${name}.ogg`, `${name}.mp3`]);

const FILES = [...SHELL, ...STYLE_ASSETS, ...ENGINE_FILES, ...ATLASES, ...SOUNDS];

/** Fetches one file unless it is already there at the expected size. */
async function mirror(name) {
  const target = join(OUT, name);
  const url = `${BASE}/${name}?v=${RES_VERSION}`;

  if (!FORCE) {
    const existing = await stat(target).catch(() => null);
    if (existing?.size > 0) return { name, skipped: true, size: existing.size };
  }

  const response = await fetch(url);
  if (!response.ok) return { name, error: `HTTP ${response.status}` };

  const body = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
  return { name, size: body.byteLength };
}

const results = [];
// Sequential on purpose: the 103 MB wasm should not race 70 small files.
for (const name of FILES) {
  const result = await mirror(name);
  results.push(result);
  const note = result.error
    ? `FAILED ${result.error}`
    : `${(result.size / 1024).toFixed(0)} KB${result.skipped ? " (cached)" : ""}`;
  console.log(`${name.padEnd(42)} ${note}`);
}

const failed = results.filter((r) => r.error);
const bytes = results.reduce((sum, r) => sum + (r.size ?? 0), 0);
console.log(`\n${results.length - failed.length}/${results.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
if (failed.length) {
  console.log(`failed: ${failed.map((r) => r.name).join(", ")}`);
  process.exitCode = 1;
}
