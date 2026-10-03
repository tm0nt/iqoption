#!/usr/bin/env node
/**
 * Dumps real frames from the Avalon market socket so the schemas in
 * `src/lib/avalon/` can be checked against the live feed.
 *
 *   AVALON_SSID=<your ssid cookie> node scripts/avalon-probe.mjs
 *   node scripts/avalon-probe.mjs --ssid <value> --active 1 --size 60
 *
 * Read the ssid from the traderoom tab you are already signed in to:
 * DevTools -> Application -> Cookies -> trade.avalonbroker.com -> ssid.
 * It is a session credential: keep it out of commits and shared logs.
 *
 * The script is read-only. It authenticates, asks for candle history, listens
 * to the live streams for a few seconds, prints what came back and exits.
 */

const LIVE_WS = "wss://ws.trade.avalonbroker.com/echo/websocket";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

// Point it at our own back end to check the two speak the same protocol:
//   node scripts/avalon-probe.mjs --url ws://localhost:3100/echo/websocket --ssid dev
const URL_WS = flag("url", process.env.AVALON_WS_URL ?? LIVE_WS);
const ssid = flag("ssid", process.env.AVALON_SSID);
const activeId = Number(flag("active", 1));
const size = Number(flag("size", 60));
const listenMs = Number(flag("listen", 8000));

if (!ssid) {
  console.error("Missing ssid. Pass --ssid <value> or set AVALON_SSID.");
  process.exit(1);
}

const seen = new Map();
let requestSeq = 0;
const nextId = () => String(++requestSeq);

const ws = new WebSocket(URL_WS);
const send = (payload) => ws.send(JSON.stringify(payload));

/** Keeps one example per frame name so the output stays readable. */
function record(frame) {
  if (!seen.has(frame.name)) seen.set(frame.name, { count: 0, sample: frame });
  seen.get(frame.name).count += 1;
}

ws.addEventListener("open", () => {
  console.log("connected, authenticating...");
  send({ name: "ssid", msg: ssid, request_id: nextId() });
});

ws.addEventListener("close", (event) => {
  console.log(`socket closed (code ${event.code})`);
});

ws.addEventListener("message", (event) => {
  let frame;
  try {
    frame = JSON.parse(event.data);
  } catch {
    return;
  }

  if (frame.name === "timeSync") return;
  if (frame.name === "heartbeat") {
    send({ name: "heartbeat", msg: { userTime: Date.now(), heartbeatTime: frame.msg } });
    return;
  }

  record(frame);

  if (frame.name === "profile") {
    console.log("authenticated\n");
    probe();
  }
});

function probe() {
  const rpc = (name, version, body) =>
    send({
      name: "sendMessage",
      request_id: nextId(),
      local_time: Date.now(),
      msg: { name, version, body },
    });

  const subscribe = (name, routingFilters) =>
    send({
      name: "subscribeMessage",
      request_id: nextId(),
      local_time: Date.now(),
      msg: { name, version: "1.0", params: { routingFilters } },
    });

  rpc("get-initialization-data", "3.0", {});
  rpc("get-candles", "2.0", {
    active_id: activeId,
    size,
    to: Math.floor(Date.now() / 1000),
    count: 10,
  });
  subscribe("candle-generated", { active_id: activeId, size });
  subscribe("quote-generated", { active_id: activeId });

  setTimeout(report, listenMs);
}

function report() {
  console.log(`frames received in ${listenMs}ms:\n`);
  for (const [name, { count, sample }] of [...seen].sort((a, b) => b[1].count - a[1].count)) {
    const json = JSON.stringify(sample.msg);
    const body = json.length > 800 ? `${json.slice(0, 800)}... (${json.length} chars)` : json;
    console.log(`${name}  x${count}${sample.status ? `  status=${sample.status}` : ""}`);
    console.log(`  ${body}\n`);
  }
  ws.close();
  process.exit(0);
}
