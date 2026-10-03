"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Where the browser gets a session id for the feed.
 *
 * The traderoom reads its own `ssid` cookie; a clone served from another origin
 * cannot, so the value is supplied once and kept in `sessionStorage` — it dies
 * with the tab and never reaches the bundle. `NEXT_PUBLIC_AVALON_SSID` is a
 * convenience for local development only: anything in a `NEXT_PUBLIC_` variable
 * is compiled into the client build, so never set it for a deployed site.
 */

export const AVALON_SSID_STORAGE_KEY = "avalon.ssid";

const listeners = new Set<() => void>();
/** Cached so `getSnapshot` returns a stable reference between notifications. */
let snapshot: string | null = null;
let snapshotRead = false;

function readSsid(): string | null {
  try {
    return window.sessionStorage.getItem(AVALON_SSID_STORAGE_KEY);
  } catch {
    // Private mode or blocked storage; fall through to the env value.
    return null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", notify);
  };
}

function notify(): void {
  snapshotRead = false;
  for (const listener of [...listeners]) listener();
}

function getSnapshot(): string | null {
  if (!snapshotRead) {
    snapshot = readSsid() ?? process.env.NEXT_PUBLIC_AVALON_SSID ?? null;
    snapshotRead = true;
  }
  return snapshot;
}

/** The server never has a session, so the first paint always shows demo data. */
function getServerSnapshot(): string | null {
  return null;
}

export function storeSsid(ssid: string | null): void {
  try {
    if (ssid) window.sessionStorage.setItem(AVALON_SSID_STORAGE_KEY, ssid);
    else window.sessionStorage.removeItem(AVALON_SSID_STORAGE_KEY);
  } catch {
    // Nothing to persist; the in-memory snapshot below still drives this tab.
  }
  snapshot = ssid;
  snapshotRead = true;
  for (const listener of [...listeners]) listener();
}

export function useAvalonSession(): {
  ssid: string | null;
  setSsid: (next: string | null) => void;
} {
  const ssid = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setSsid = useCallback((next: string | null) => storeSsid(next), []);
  return { ssid, setSsid };
}
