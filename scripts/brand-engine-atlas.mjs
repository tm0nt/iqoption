#!/usr/bin/env node
/**
 * Puts this platform's logo inside the engine's sprite atlas.
 *
 *   node scripts/brand-engine-atlas.mjs [--force]
 *
 * The traderoom draws its own logo three times — the wordmark in the header,
 * the big mark behind the chart, and a square icon in a few corners — and none
 * of those is a file the page requests. They are rectangles inside
 * `atlas_genericaa60ee592`, which is why changing `logo.png` never touched
 * them: that file is the shell's logo, not the engine's.
 *
 * The coordinates are not guesswork. The atlas ships its own table as JSON
 * inside `glengineaa60ee59.data`, keyed by atlas name, and this reads the
 * rectangles out of it by sprite name.
 *
 * The original atlas is left alone. A branded copy is written to
 * `public/storage/brand-atlas/` and the middleware serves that instead when it
 * exists — so re-mirroring the engine cannot silently undo the branding, and a
 * platform that has uploaded no logo gets the build's own by having no copy at
 * all.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const ENGINE = path.join(ROOT, "public", "engine");
const OUT = path.join(ROOT, "public", "storage", "brand-atlas");
const UPLOADS = path.join(ROOT, "var", "uploads", "brand");

/**
 * Which brand file belongs in which sprite.
 *
 * `fill` means the logo is fitted to the whole rectangle, which is right for
 * the wordmarks and icons — the rectangle *is* the logo. `map` is different:
 * it is the chart's background, a wide canvas with a small mark floating in
 * the middle, so the logo takes a share of it and the rest stays empty.
 *
 * That sprite is called `map`, which is why searching the atlas for anything
 * logo-shaped never turned it up. The engine's own stylesheet names it —
 * `.plotBackgroundStyle { bg: 'map'; … }` — inside `glengineaa60ee59.data`.
 */
const SLOTS = [
  { sprite: "map", from: "big", share: 0.5 },
  { sprite: "logobig", from: "big" },
  { sprite: "logobig_black", from: "big" },
  { sprite: "logos/logo", from: "main" },
  { sprite: "logos/logo_black", from: "main" },
  { sprite: "logos/icon160", from: "icon" },
  { sprite: "logos/icon64", from: "icon" },
  { sprite: "logos/icon64_white", from: "icon" },
  { sprite: "logo_black_circle", from: "icon" },
  { sprite: "logo_black", from: "icon" },
];

/** The atlas coordinate table, read out of the engine's data file. */
function spriteTable() {
  const text = readFileSync(path.join(ENGINE, "glengineaa60ee59.data")).toString("latin1");
  const sprites = new Map();
  const atlasRe = /"(atlas_[a-z0-9_]+)":\[/gi;
  let atlas;
  while ((atlas = atlasRe.exec(text))) {
    const start = atlas.index + atlas[0].length;
    const chunk = text.slice(start, text.indexOf("]", start));
    const re = /\{"name":"([^"]+)","x":(\d+),"y":(\d+),"w":(\d+),"h":(\d+)\}/g;
    let m;
    while ((m = re.exec(chunk))) {
      sprites.set(m[1], { atlas: atlas[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
    }
  }
  return sprites;
}


/**
 * The file behind a brand slot, or null to leave that sprite alone.
 *
 * An empty row means "the build's own", and the build's own is already in the
 * atlas — so nothing is composited and the original shows through.
 */
async function brandFile(brand, slot) {
  const stored = slot === "big" ? brand.logoBigUrl : slot === "icon" ? brand.iconUrl : brand.logoUrl;
  if (!stored) return null;
  const name = String(stored).split("/").pop() ?? "";
  if (!/^[a-f0-9]{32}\.(png|jpg|svg)$/.test(name)) return null;
  const file = path.join(UPLOADS, name);
  return existsSync(file) ? file : null;
}

export async function brandAtlas(brand, log = console.log) {
  const sprites = spriteTable();
  const work = new Map();

  for (const slot of SLOTS) {
    const rect = sprites.get(slot.sprite);
    if (!rect) continue;
    const file = await brandFile(brand, slot.from);
    if (!file) continue;
    if (!work.has(rect.atlas)) work.set(rect.atlas, []);
    work.get(rect.atlas).push({ ...rect, file, sprite: slot.sprite, share: slot.share });
  }

  if (work.size === 0) {
    log("nenhuma logo enviada — o atlas original continua valendo");
    return { written: [], replaced: 0 };
  }

  await mkdir(OUT, { recursive: true });
  const written = [];
  let replaced = 0;

  for (const [atlas, rects] of work) {
    /*
     * Each sprite becomes two composites: an opaque rectangle that erases what
     * was there, then the logo fitted inside it. Erasing first matters — the
     * old wordmark is wider than most replacements and would otherwise show
     * through around the edges.
     */
    const layers = [];
    for (const rect of rects) {
      /*
       * A share below 1 keeps the logo small inside a large rectangle and
       * centres it; the default fills the rectangle outright.
       */
      const share = rect.share ?? 1;
      const boxW = Math.round(rect.w * share);
      const boxH = Math.round(rect.h * share);
      const logo = await sharp(rect.file)
        .resize(boxW, boxH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
          top: Math.floor((rect.h - boxH) / 2),
          bottom: Math.ceil((rect.h - boxH) / 2),
          left: Math.floor((rect.w - boxW) / 2),
          right: Math.ceil((rect.w - boxW) / 2),
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      /*
       * Opaque, not transparent. `dest-out` removes the destination wherever
       * the source is *opaque*, so an erase layer with alpha 0 erases nothing
       * — which it duly did, leaving the old wordmark showing through the new
       * one. The colour is irrelevant; only the alpha is read.
       */
      layers.push({
        input: { create: { width: rect.w, height: rect.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } },
        left: rect.x,
        top: rect.y,
        blend: "dest-out",
      });
      layers.push({ input: logo, left: rect.x, top: rect.y });
      replaced += 1;
    }

    // Both encodings, because the engine asks for whichever its manifest names.
    for (const ext of ["png", "webp"]) {
      const source = path.join(ENGINE, `${atlas}.${ext}`);
      if (!existsSync(source)) continue;
      const pipeline = sharp(source).composite(layers);
      const body = ext === "webp" ? await pipeline.webp({ lossless: true }).toBuffer() : await pipeline.png().toBuffer();
      const target = path.join(OUT, `${atlas}.${ext}`);
      await writeFile(target, body);
      written.push(path.relative(ROOT, target));
    }
  }

  log(`${replaced} sprite(s) substituído(s) em ${written.length} arquivo(s)`);
  return { written, replaced };
}

/* Run directly: read the brand from the database and rebuild. */
if (process.argv[1] === import.meta.filename) {
  const { pool } = await import("../server/db/pool.mjs");
  const rows = await pool().query("SELECT value FROM platform_settings WHERE `key` = 'brand' LIMIT 1");
  const value = rows[0]?.value;
  const brand = (typeof value === "string" ? JSON.parse(value) : value) ?? {};
  const result = await brandAtlas(brand);
  for (const file of result.written) console.log(`  ${file}`);
  process.exit(0);
}
