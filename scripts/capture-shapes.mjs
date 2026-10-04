/*
 * Turns a live capture into a shape reference.
 *
 * What goes into the repository is the structure — which keys exist and what
 * kind of value each holds — never the capture itself. A real recording names
 * the person who made it and the people on the leaderboard beside them, and
 * none of that belongs in a fixture.
 */
import { readFileSync, writeFileSync } from "node:fs";

const S = process.env.CAPTURE_DIR ?? process.argv[2];
if (!S) throw new Error("say where the capture is: CAPTURE_DIR=… or argv[2]");
const rows = readFileSync(`${S}/live-capture.jsonl`, "utf8").trim().split("\n")
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

/**
 * Keys whose value identifies a person. Replaced, never printed.
 *
 * A content row's own `id` is not here: the id of a help article or a video
 * category is part of the shape and identifies nobody. What is here is the
 * account, the people on the leaderboard beside it, and the session keys.
 */
const IDENTITY = /^(user_id|users_id|user_name|email|ssid|skey|phone|nickname|first_name|last_name|avatar|balance_id|user_balance_id)$/;

/** A value reduced to its kind, with identity blanked. */
function shape(value, key = "", depth = 0) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    // One representative element is the shape of the list.
    return [shape(value[0], key, depth + 1), `… ${value.length} items`];
  }
  if (typeof value === "object") {
    if (depth > 4) return "{…}";
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = shape(v, k, depth + 1);
    return out;
  }
  if (IDENTITY.test(key)) {
    return typeof value === "number" ? "<number: identity>" : "<string: identity>";
  }
  if (typeof value === "string") {
    // Short enums and status words are the information; long prose is not.
    return value.length <= 24 ? `"${value}"` : `<string, ${value.length} chars>`;
  }
  return typeof value === "number" ? (Number.isInteger(value) ? "<int>" : "<float>") : String(value);
}

/** The biggest example of each reply, and the request that asked for it. */
const replies = new Map();
const requests = new Map();
for (const row of rows) {
  if (row.kind !== "ws") continue;
  if (row.direction === "in" && row.frame?.name) {
    const size = JSON.stringify(row.frame.msg ?? "").length;
    const seen = replies.get(row.frame.name);
    if (!seen || size > seen.size) replies.set(row.frame.name, { msg: row.frame.msg, size });
  }
  if (row.direction === "out" && row.frame?.msg?.name) {
    if (!requests.has(row.frame.msg.name)) requests.set(row.frame.msg.name, row.frame.msg.body ?? {});
  }
}

const PANELS = [
  ["Help", "get-faq", "faq"],
  ["Video Tutorials — categories", "get-video-categories", "video-categories"],
  ["Video Tutorials — tags", "get-video-tags", "video-tags"],
  ["Video Tutorials — videos", "get-videos", "videos"],
  ["Alerts", "get-alerts", "alerts"],
  ["Leaderboard — top", "get-leaderboard-top", "leaderboard-top"],
  ["Leaderboard — your place", "get-leaderboard-position", "leaderboard-position"],
  ["Tournaments", "get-tournaments-info", "tournaments-info"],
  ["Tournaments — winners", "get-tournament-winners", "tournament-winners"],
  ["Market Analysis — calendar", "get-economic-calendar-events", "economic-calendar-events"],
  ["Market Analysis — filters", "get-economic-calendar-filters", "economic-calendar-filters"],
  ["Market Analysis — one event", "get-economic-calendar-events-info", "economic-calendar-events-info"],
  ["Promo — available codes", "promo-codes.get-available-promo-codes", "available-promo-codes"],
  ["Promo — one code", "promo-codes.get-promo-code-details", "promo-code-details"],
];

const lines = [];
for (const [label, call, reply] of PANELS) {
  lines.push(`\n## ${label}\n`);
  lines.push("```jsonc");
  lines.push(`// -> sendMessage ${call}`);
  lines.push(JSON.stringify(shape(requests.get(call) ?? {}), null, 1));
  const got = replies.get(reply);
  lines.push(`\n// <- ${reply}${got ? "" : "   (not captured)"}`);
  lines.push(got ? JSON.stringify(shape(got.msg), null, 1) : "null");
  lines.push("```");
}

writeFileSync(`${S}/shapes.md`, lines.join("\n"));
console.log(lines.join("\n").slice(0, 3000));
