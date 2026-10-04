/**
 * Whether the market feed is answering, and what it is serving.
 *
 * The admin panel and the feed are different processes; this is the only way
 * the panel can say "the catalogue has eleven instruments here and the feed is
 * serving nine" instead of showing a number that may be stale.
 *
 * Administrator-only, like everything under /api/admin.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Where the market server answers, derived from the feed URL. */
function marketServerUrl(path: string) {
  const ws = process.env.AVALON_WS_URL ?? "ws://localhost:3100/echo/websocket";
  const url = new URL(ws);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = path;
  url.search = "";
  return url.toString();
}

export async function GET() {
  const target = marketServerUrl("/health");
  try {
    const response = await fetch(target, { signal: AbortSignal.timeout(5_000), cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ reachable: false, error: `HTTP ${response.status}`, target });
    }
    const body = (await response.json()) as { actives?: number; time?: number };
    return NextResponse.json({ reachable: true, instruments: body.actives ?? 0, target });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ reachable: false, error: message, target });
  }
}
