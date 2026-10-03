#!/usr/bin/env node
/**
 * Country flag downloader for the trade.avalonbroker.com clone.
 * Flags are shared by /register (country + dial-code selects), so they live in the
 * site-level shared asset namespace rather than under a single page key.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";

const OUT = "public/sites/trade-avalonbroker-com-6f41c8f2/shared/flags";
const PLAN = process.argv[2] ?? "scripts/data/avalon-flag-urls.json";
const BATCH = 8;

const urls = JSON.parse(await readFile(PLAN, "utf8"));
await mkdir(OUT, { recursive: true });

const entries = Object.entries(urls);
let ok = 0;
const failures = [];

async function download([iso, url]) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36" },
  });
  if (!res.ok) throw new Error(`${res.status} ${iso}`);
  await writeFile(`${OUT}/${iso}.svg`, Buffer.from(await res.arrayBuffer()));
}

for (let i = 0; i < entries.length; i += BATCH) {
  const results = await Promise.allSettled(entries.slice(i, i + BATCH).map(download));
  for (const [j, r] of results.entries()) {
    if (r.status === "fulfilled") ok += 1;
    else failures.push(`${entries[i + j][0]}: ${r.reason.message}`);
  }
}

console.log(`downloaded ${ok}/${entries.length} flags into ${OUT}`);
if (failures.length) {
  console.error("failures:\n  " + failures.join("\n  "));
  process.exitCode = 1;
}
