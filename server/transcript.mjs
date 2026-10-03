/**
 * Records what a client sends us, to a file.
 *
 * Working out what the engine needs means reading every frame it sends. Asking
 * whoever is driving the browser to copy a terminal back and forth loses most
 * of it, so the server keeps its own record: one JSON object per line, ready
 * for `jq` or a quick script.
 *
 * Off unless `AVALON_TRANSCRIPT` names a file.
 */

import { appendFileSync, writeFileSync } from "node:fs";

const PATH = process.env.AVALON_TRANSCRIPT ?? null;
/** Stops a reconnect loop from filling the disk. */
const MAX_LINES = 20_000;

let lines = 0;
let truncated = false;

if (PATH) {
  writeFileSync(PATH, "");
  console.log(`[avalon] transcript -> ${PATH}`);
}

export const transcriptEnabled = Boolean(PATH);

/**
 * @param {"in"|"out"|"note"} direction
 * @param {unknown} payload
 * @param {number} [connection] which socket this belongs to
 */
export function record(direction, payload, connection) {
  if (!PATH || truncated) return;
  if (lines >= MAX_LINES) {
    truncated = true;
    appendFileSync(PATH, JSON.stringify({ t: Date.now(), direction: "note", payload: "truncated" }) + "\n");
    return;
  }
  lines += 1;
  try {
    appendFileSync(PATH, JSON.stringify({ t: Date.now(), connection, direction, payload }) + "\n");
  } catch {
    // A full disk should not take the feed down.
  }
}
