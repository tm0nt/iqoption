/**
 * Wire protocol for `wss://ws.trade.avalonbroker.com/echo/websocket`.
 *
 * The traderoom ships its UI and chart as a 103 MB Emscripten build
 * (`glengineaa60ee59.wasm`); the engine is only a renderer on top of this
 * socket, so talking to the socket directly gives the same data without the
 * WASM. Every frame is JSON with a `name` discriminator.
 *
 * Confirmed against a live session: the handshake (`ssid` -> `profile`,
 * `front`), `timeSync` and `heartbeat`. The request/subscription envelopes and
 * payload shapes below follow the Quadcode wsapi used by this build; run
 * `node scripts/avalon-probe.mjs` to dump real frames and reconcile.
 */

import type { CandleSize } from "./types";

/** The live feed. */
export const AVALON_LIVE_WS_URL = "wss://ws.trade.avalonbroker.com/echo/websocket";

/**
 * Which feed the client talks to.
 *
 * Our own back end (`npm run server`) speaks the same protocol on the same
 * path, so pointing at it is a URL change and nothing else. `AVALON_WS_URL`
 * covers the server, `NEXT_PUBLIC_AVALON_WS_URL` the browser.
 */
export function resolveWsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_AVALON_WS_URL ??
    process.env.AVALON_WS_URL ??
    AVALON_LIVE_WS_URL
  );
}

/** Frames the server pushes without being asked. */
export const SERVER_PUSH = [
  "timeSync",
  "heartbeat",
  "profile",
  "front",
  "balances",
  "candle-generated",
  "quote-generated",
] as const;

/** Any frame coming off the socket. */
export interface InboundFrame<T = unknown> {
  name: string;
  msg: T;
  request_id?: string;
  status?: number;
  microserviceName?: string;
  session_id?: string;
}

/** `sendMessage` wraps a request/response call to a microservice. */
export interface RpcEnvelope {
  name: "sendMessage";
  request_id: string;
  local_time: number;
  msg: { name: string; version: string; body: unknown };
}

/** `subscribeMessage` / `unsubscribeMessage` open and close an event stream. */
export interface SubscribeEnvelope {
  name: "subscribeMessage" | "unsubscribeMessage";
  request_id: string;
  local_time: number;
  msg: { name: string; version: string; params: { routingFilters: Record<string, unknown> } };
}

export function rpcEnvelope(
  requestId: string,
  name: string,
  version: string,
  body: unknown,
): RpcEnvelope {
  return {
    name: "sendMessage",
    request_id: requestId,
    local_time: Date.now(),
    msg: { name, version, body },
  };
}

export function subscribeEnvelope(
  requestId: string,
  name: string,
  routingFilters: Record<string, unknown>,
  unsubscribe = false,
  version = "1.0",
): SubscribeEnvelope {
  return {
    name: unsubscribe ? "unsubscribeMessage" : "subscribeMessage",
    request_id: requestId,
    local_time: Date.now(),
    msg: { name, version, params: { routingFilters } },
  };
}

/** Body of a `get-candles` call. */
export interface GetCandlesBody {
  active_id: number;
  size: CandleSize;
  /** Right edge of the window, unix seconds. */
  to: number;
  /** How many buckets to walk back from `to`. */
  count: number;
  /** Offset in seconds; the feed expects 0 for a plain history fetch. */
  only_closed?: boolean;
}

/**
 * The routing filter a `candle-generated` subscription needs. The feed fans out
 * per (active, size), so one subscription per chart series.
 */
export function candleFilter(activeId: number, size: CandleSize) {
  return { active_id: activeId, size };
}

export function quoteFilter(activeId: number) {
  return { active_id: activeId };
}

/** The server's heartbeat wants the client's clock echoed back. */
export function heartbeatReply(serverTime: number) {
  return { name: "heartbeat", msg: { userTime: Date.now(), heartbeatTime: serverTime } };
}
