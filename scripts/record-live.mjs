/*
 * Records the live platform's protocol while a person drives it.
 *
 * Opens a visible Chrome on a throwaway profile and attaches a debugger. The
 * person signs in themselves; this never sees a credential, because it records
 * only socket frames and the bodies of a named set of read endpoints — never a
 * request body, and nothing from the sign-in paths.
 *
 * Everything lands in the scratchpad. What eventually reaches the repository is
 * the *shape*: field names with neutral values. The identity in a real capture
 * — the account id, the email, the ssid, the balances — is the person's own and
 * has no business in a fixture.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, createWriteStream, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

// Somewhere outside the repository: a capture carries the account that made it.
const S = process.env.CAPTURE_DIR ?? process.argv[2];
if (!S) throw new Error("say where to record: CAPTURE_DIR=… or argv[2]");
const OUT = `${S}/live-capture.jsonl`;
const PORT = 9500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Paths whose response bodies are worth keeping. Reads only. */
const WANTED = /\/(v1|api)\/(webinars|news|videos|education|tournaments|leaderboard|help|faq|alerts|promo)/i;
/** Never recorded, whatever else matches. */
const FORBIDDEN = /login|password|signin|sign-in|token|oauth|session|auth|register|2fa|otp/i;

const out = createWriteStream(OUT, { flags: "a" });
const write = (row) => out.write(JSON.stringify(row) + "\n");

const profile = mkdtempSync(join(tmpdir(), "avalon-record-"));
const chrome = spawn("/usr/bin/google-chrome", [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1600,950",
  "https://trade.avalonbroker.com/en/login",
], { stdio: ["ignore", "ignore", "ignore"] });

async function devtools() {
  for (let i = 0; i < 120; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* ainda subindo */ }
    await sleep(500);
  }
  throw new Error("devtools never came up");
}

const ws = new WebSocket(await devtools(), { maxPayload: 256 * 1024 * 1024 });
await new Promise((r, j) => { ws.once("open", r); ws.once("error", j); });

let nextId = 1;
const pending = new Map();
const send = (method, params = {}, sessionId) => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

let frames = 0;
let bodies = 0;
const seenCalls = new Set();

ws.on("message", async (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
    return;
  }

  const sessionId = m.sessionId;

  // Socket frames, both ways. This is the protocol itself.
  if (m.method === "Network.webSocketFrameReceived" || m.method === "Network.webSocketFrameSent") {
    const payload = m.params.response?.payloadData ?? "";
    if (!payload || payload.length > 4_000_000) return;
    let parsed;
    try { parsed = JSON.parse(payload); } catch { return; }

    const direction = m.method.endsWith("Sent") ? "out" : "in";
    const name = parsed?.msg?.name ?? parsed?.name;
    if (name) seenCalls.add(`${direction} ${name}`);
    frames += 1;
    write({ t: Date.now(), kind: "ws", direction, frame: parsed });
    return;
  }

  // Response bodies, for the read endpoints named above.
  if (m.method === "Network.responseReceived") {
    const url = m.params.response?.url ?? "";
    if (FORBIDDEN.test(url) || !WANTED.test(url)) return;
    try {
      const { body, base64Encoded } = await send("Network.getResponseBody", { requestId: m.params.requestId }, sessionId);
      if (base64Encoded || !body || body.length > 4_000_000) return;
      bodies += 1;
      write({ t: Date.now(), kind: "http", url, body });
    } catch { /* o corpo pode já ter sido descartado */ }
    return;
  }

  // Every tab and worker, including the ones opened later.
  if (m.method === "Target.attachedToTarget") {
    const sid = m.params.sessionId;
    await send("Network.enable", {}, sid).catch(() => {});
    await send("Runtime.runIfWaitingForDebugger", {}, sid).catch(() => {});
  }
});

await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });

console.log("Chrome aberto em https://trade.avalonbroker.com/en/login");
console.log("Gravando em", OUT);

// Relata o progresso enquanto a pessoa navega.
const started = Date.now();
const ticker = setInterval(() => {
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`[${mins} min] quadros=${frames} corpos=${bodies} nomes=${seenCalls.size}`);
}, 20_000);

const stop = async () => {
  clearInterval(ticker);
  console.log(`\nfim: quadros=${frames} corpos=${bodies}`);
  console.log([...seenCalls].sort().join("\n"));
  out.end();
  try { ws.close(); } catch {}
  try { chrome.kill("SIGTERM"); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
