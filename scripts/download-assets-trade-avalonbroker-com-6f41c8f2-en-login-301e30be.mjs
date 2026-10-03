#!/usr/bin/env node
/**
 * Asset downloader for https://trade.avalonbroker.com/en/login
 * site-key: trade-avalonbroker-com-6f41c8f2
 * page-key: en-login-301e30be
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const OUT = "public/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be";

const ASSETS = [
  {
    url: "https://fsms.trade.avalonbroker.com/storage/public/ck/vm/in12talmn2lfjb70.svg",
    file: `${OUT}/images/avalon-logo.svg`,
  },
  {
    url: "https://fsms.trade.avalonbroker.com/storage/public/cl/5l/8q2u2llnmkj1ke4g.png",
    file: `${OUT}/seo/favicon.png`,
  },
];

const BATCH = 4;

async function download({ url, file }) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, buf);
  return `${file} (${buf.length} bytes)`;
}

for (let i = 0; i < ASSETS.length; i += BATCH) {
  const results = await Promise.allSettled(ASSETS.slice(i, i + BATCH).map(download));
  for (const r of results) {
    if (r.status === "fulfilled") console.log("ok  ", r.value);
    else console.error("fail", r.reason.message);
  }
}
