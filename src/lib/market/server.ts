/**
 * Reaching the market server from the web app.
 *
 * They are separate processes, and the only thing that says where the feed
 * lives is the WebSocket URL the engine is pointed at — so the HTTP side is
 * derived from it rather than configured twice and allowed to disagree.
 */
import type { TopAsset } from "./top-assets-type";

const DEFAULT_WS = "ws://localhost:3100/echo/websocket";

export function marketServerUrl(path: string, params?: Record<string, string | number>) {
  const url = new URL(process.env.AVALON_WS_URL ?? DEFAULT_WS);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = path;
  url.search = "";
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, String(value));
  return url.toString();
}

/**
 * Instruments ranked by this week's move.
 *
 * Returns an empty list rather than throwing when the feed is down: the
 * portfolio page is mostly about the account, and a stopped feed should cost
 * one section rather than the whole page.
 */
export async function fetchTopAssets(points = 32): Promise<TopAsset[]> {
  try {
    const response = await fetch(marketServerUrl("/top-assets", { points }), {
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { assets?: TopAsset[] };
    return body.assets ?? [];
  } catch {
    return [];
  }
}
