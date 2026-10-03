#!/usr/bin/env node
/**
 * The market data back end.
 *
 * Speaks the same frame protocol as the Avalon feed on the same path, so the
 * browser client in `src/lib/avalon/` points at either one by URL alone:
 *
 *   ws://localhost:3100/echo/websocket
 *
 * It also answers two plain HTTP routes, which are useful from curl and from
 * the Next.js route handler:
 *
 *   GET /health
 *   GET /actives
 *   GET /candles?activeId=1&size=60&count=300[&to=<unix seconds>]
 *   POST /session            -> { ssid, userId }
 *
 * Start it with `npm run server`. Set `AVALON_TRANSCRIPT=<file>` to record
 * every frame a client sends, which is how the engine's needs get mapped.
 */

import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Connection } from "./connection.mjs";
import { MarketFeed } from "./market/feed.mjs";
import { ACTIVES, activeById } from "./market/actives.mjs";
import { openSession } from "./accounts.mjs";

const PORT = Number(process.env.AVALON_SERVER_PORT ?? 3100);
const WS_PATH = "/echo/websocket";
const VERBOSE = process.env.AVALON_SERVER_VERBOSE === "1";

const feed = new MarketFeed();
feed.start();

const log = (...args) => {
  if (VERBOSE) console.log("[avalon]", ...args);
};

const http = createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  // The Next.js dev server is a different origin, so the browser preflights.
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "content-type");

  if (request.method === "OPTIONS") {
    response.writeHead(204).end();
    return;
  }

  if (url.pathname === "/health") {
    return json(response, 200, { ok: true, actives: ACTIVES.length, time: Date.now() });
  }

  if (url.pathname === "/actives") {
    return json(response, 200, { actives: ACTIVES });
  }

  if (url.pathname === "/session" && request.method === "POST") {
    const { sessionId, account } = openSession();
    return json(response, 200, { ssid: sessionId, userId: account.userId });
  }

  if (url.pathname === "/candles") {
    const activeId = Number(url.searchParams.get("activeId"));
    const size = Number(url.searchParams.get("size"));
    const count = Number(url.searchParams.get("count") ?? 300);
    const to = url.searchParams.get("to") ? Number(url.searchParams.get("to")) : undefined;

    if (!activeById(activeId)) return json(response, 404, { error: `unknown activeId ${activeId}` });
    if (!Number.isFinite(size) || size <= 0) return json(response, 400, { error: "invalid size" });

    return json(response, 200, {
      activeId,
      size,
      candles: feed.history(activeId, size, Math.min(count, 1_000), to),
    });
  }

  json(response, 404, { error: "not found" });
});

const wss = new WebSocketServer({ server: http, path: WS_PATH });
wss.on("connection", (socket, request) => {
  log("connection from", request.socket.remoteAddress);
  new Connection(socket, { feed, log });
});

http.listen(PORT, () => {
  console.log(`avalon back end listening on http://localhost:${PORT}`);
  console.log(`  websocket  ws://localhost:${PORT}${WS_PATH}`);
  console.log(`  instruments ${ACTIVES.map((a) => a.ticker).join(", ")}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    feed.stop();
    wss.close();
    http.close(() => process.exit(0));
  });
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  response.end(payload);
}
