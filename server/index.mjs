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

import "dotenv/config";
import { createServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import { Connection } from "./connection.mjs";
import { MarketFeed } from "./market/feed.mjs";
import { ACTIVES, activeById, loadCatalog } from "./market/actives.mjs";
import * as binance from "./market/binance.mjs";
import * as twelvedata from "./market/twelvedata.mjs";
import { loadNextPositionId } from "./market/position-store.mjs";
import { startSettlement, stopSettlement } from "./market/settlement.mjs";
import { openSession } from "./accounts.mjs";
import { priceAt, round } from "./market/prices.mjs";

/**
 * Warms every feed and reports them as one.
 *
 * Both are asked, always: an instrument is pointed at a source from the admin
 * screen, so which sources are in use is a question about the database rather
 * than about this file, and a feed that is only warmed on the boot path and
 * not on `/reload` is a feed that goes stale the first time the catalogue is
 * edited.
 */
async function warmFeeds(log) {
  const results = await Promise.all([binance.warmUp(ACTIVES, log), twelvedata.warmUp(ACTIVES, log)]);
  const ready = results.flatMap((result) => result.ready);
  const failed = results.flatMap((result) => result.failed);
  for (const symbol of twelvedata.unavailable()) {
    failed.push(`${symbol} (not on this Twelve Data plan)`);
  }
  return { ready, failed };
}

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

  /*
   * Re-reads the instrument catalogue without a restart.
   *
   * The admin API lives in the web app and writes to the same database, but
   * this process holds the catalogue in memory — an edit over there is invisible
   * here until something asks. A reload also warms any feed that is new, so an
   * instrument switched to BINANCE starts serving real prices immediately.
   */
  if (url.pathname === "/reload" && request.method === "POST") {
    loadCatalog()
      .then(async ({ assets, groups }) => {
        const { ready, failed } = await warmFeeds(log);
        binance.disconnect();
        twelvedata.disconnect();
        binance.connect(ACTIVES, WebSocket, log);
        twelvedata.connect(ACTIVES, WebSocket, log, console.log);

  /*
   * One settlement loop for the process, not one per connection. A deal reaches
   * its expiry whether or not its owner is watching, and the first sweep picks
   * up anything that expired while this was down.
   */
  startSettlement(feed, log);
        console.log(`reloaded: ${assets} instruments in ${groups} groups`);
        json(response, 200, { assets, groups, feedsReady: ready, feedsFailed: failed });
      })
      .catch((error) => json(response, 500, { error: error.message }));
    return;
  }

  /**
   * Instruments ranked by how far they have moved this week, with a sparkline.
   *
   * Sampled through `priceAt` rather than read off a series, because that one
   * function answers for both price sources: an instrument with a live feed
   * returns real bars, and one still on the deterministic curve returns the
   * curve. The portfolio page draws them the same way either way.
   */
  if (url.pathname === "/top-assets") {
    const DAY = 86_400;
    const now = Math.floor(feed.now());
    const points = Number(url.searchParams.get("points")) || 32;
    const span = (Number(url.searchParams.get("days")) || 7) * DAY;

    const rows = ACTIVES.map((active) => {
      const series = [];
      for (let i = 0; i < points; i += 1) {
        series.push(priceAt(active, now - span + (span * i) / (points - 1)));
      }
      const first = series[0];
      const last = series[series.length - 1];
      return {
        id: active.id,
        ticker: active.ticker,
        name: active.name,
        kind: active.kind,
        precision: active.precision,
        source: active.source,
        price: last,
        // Percent, signed. A flat instrument reports zero rather than NaN.
        change: first ? round(((last - first) / first) * 100, 2) : 0,
        series,
      };
    });

    return json(response, 200, { assets: rows });
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

/**
 * Nothing is served until the catalogue is in memory and the feeds are warm.
 *
 * Listening first would answer `get-initialization-data` with an empty
 * instrument list, and the client treats that as a platform with nothing to
 * trade: it stalls on its login view and never asks again.
 */
async function start() {
  const { assets, groups } = await loadCatalog();
  console.log(`catalogue: ${assets} instruments in ${groups} groups`);

  // Deals carry ids allocated here; without the high-water mark the first write
  // after a restart collides on the primary key.
  const nextDeal = await loadNextPositionId();
  console.log(`deals: next id ${nextDeal}`);

  const { ready, failed } = await warmFeeds(log);
  if (ready.length) console.log(`feeds: warmed ${ready.join(", ")}`);
  for (const miss of failed) console.log(`feeds: NO FEED for ${miss} — falling back to the curve`);

  /*
   * An instrument with a feed has no `sim_base`, so the fallback curve would
   * oscillate around zero on the one occasion it is needed. Seeding it from the
   * first real price keeps that fallback in the right neighbourhood.
   */
  for (const active of ACTIVES) {
    if (active.source === "SIMULATED" || active.base) continue;
    const feed = active.source === "TWELVEDATA" ? twelvedata : binance;
    const price = feed.priceAt(active, Date.now() / 1000);
    if (price) {
      active.base = price;
      active.volatility = active.volatility || 0.02;
    }
  }

  binance.connect(ACTIVES, WebSocket, log);
  twelvedata.connect(ACTIVES, WebSocket, log, console.log);

  /*
   * One settlement loop for the process, not one per connection. A deal reaches
   * its expiry whether or not its owner is watching, and the first sweep picks
   * up anything that expired while this was down.
   */
  startSettlement(feed, log);

  http.listen(PORT, () => {
    console.log(`avalon back end listening on http://localhost:${PORT}`);
    console.log(`  websocket  ws://localhost:${PORT}${WS_PATH}`);
    console.log(`  instruments ${ACTIVES.map((a) => a.ticker).join(", ")}`);
  });
}

start().catch((error) => {
  console.error("could not start:", error.message);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    feed.stop();
    stopSettlement();
    binance.disconnect();
    twelvedata.disconnect();
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
