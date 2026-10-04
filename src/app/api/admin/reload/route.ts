/**
 * Tells the market server to re-read the catalogue.
 *
 * The admin API and the market feed share a database but not a process: an
 * instrument edited here is invisible there until the feed is asked to look
 * again. This forwards that ask, so changing an instrument and seeing it in the
 * traderoom is two calls rather than a restart.
 *
 * **No authentication yet.** See the note in the assets route.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Where the market server answers. Same value the engine's feed is built from. */
function marketServerOrigin() {
  const ws = process.env.AVALON_WS_URL ?? "ws://localhost:3100/echo/websocket";
  const url = new URL(ws);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/reload";
  url.search = "";
  return url.toString();
}

export async function POST() {
  const target = marketServerOrigin();
  try {
    const response = await fetch(target, {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `could not reach the market server at ${target}: ${message}` },
      { status: 502 },
    );
  }
}
