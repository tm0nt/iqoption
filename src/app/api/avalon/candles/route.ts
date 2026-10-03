import { AvalonClient } from "@/lib/avalon/client";
import { fetchCandleHistory } from "@/lib/avalon/candles";
import { isCandleSize } from "@/lib/avalon/types";

/**
 * Candle history without putting the session id in the browser.
 *
 * `GET /api/avalon/candles?activeId=1&size=60&count=300[&to=1790000000]`
 *
 * The socket is opened per request and closed again: this is the history path
 * only. Live updates stay on the client's own socket, because proxying a tick
 * stream through a route handler would add a hop for no benefit.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const ssid = process.env.AVALON_SSID;
  if (!ssid) {
    return Response.json(
      { error: "AVALON_SSID is not set. See docs/avalon-feed.md." },
      { status: 503 },
    );
  }

  const params = new URL(request.url).searchParams;
  const activeId = Number(params.get("activeId"));
  const size = Number(params.get("size"));
  const count = Number(params.get("count") ?? 300);
  const to = params.get("to") ? Number(params.get("to")) : undefined;

  if (!Number.isInteger(activeId) || activeId <= 0) {
    return Response.json({ error: "activeId must be a positive integer" }, { status: 400 });
  }
  if (!isCandleSize(size)) {
    return Response.json({ error: `size ${size} is not a supported candle size` }, { status: 400 });
  }
  if (!Number.isInteger(count) || count <= 0 || count > 5_000) {
    return Response.json({ error: "count must be between 1 and 5000" }, { status: 400 });
  }

  const client = new AvalonClient({ ssid, autoReconnect: false });
  try {
    await client.connect();
    const candles = await fetchCandleHistory(client, { activeId, size, count, to });
    return Response.json({ activeId, size, candles });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return Response.json({ error: message }, { status: 502 });
  } finally {
    client.close();
  }
}
