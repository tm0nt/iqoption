"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvalonClient, type ConnectionState } from "@/lib/avalon/client";
import { CandleFeed } from "@/lib/avalon/candles";
import type { Candle, CandleSize, Quote } from "@/lib/avalon/types";

export interface UseAvalonCandlesOptions {
  /**
   * Session id for the feed. Without one the hook stays idle so the caller can
   * fall back to demo data rather than render an empty chart.
   */
  ssid: string | null | undefined;
  activeId: number;
  size: CandleSize;
  /** Candles to load before going live. */
  history?: number;
}

export interface UseAvalonCandlesResult {
  candles: readonly Candle[];
  quote: Quote | null;
  state: ConnectionState;
  error: Error | null;
  loadOlder: () => void;
}

const EMPTY: readonly Candle[] = [];

/** Identifies the series a snapshot belongs to, so a stale feed cannot paint. */
function seriesKey(activeId: number, size: CandleSize): string {
  return `${activeId}:${size}`;
}

interface Series {
  key: string;
  candles: readonly Candle[];
  quote: Quote | null;
}

/**
 * Connects to the Avalon feed and keeps one (active, size) series live.
 *
 * The connection is torn down and rebuilt when the session changes; switching
 * instrument or timeframe only swaps the feed, so the socket survives.
 */
export function useAvalonCandles({
  ssid,
  activeId,
  size,
  history = 300,
}: UseAvalonCandlesOptions): UseAvalonCandlesResult {
  const [series, setSeries] = useState<Series>({ key: "", candles: EMPTY, quote: null });
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<AvalonClient | null>(null);
  const feedRef = useRef<CandleFeed | null>(null);

  useEffect(() => {
    if (!ssid) return;
    const client = new AvalonClient({
      ssid,
      onStateChange: setConnection,
      onError: setError,
    });
    clientRef.current = client;
    client.connect().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    });

    return () => {
      client.close();
      clientRef.current = null;
      setConnection("idle");
    };
  }, [ssid]);

  useEffect(() => {
    const client = clientRef.current;
    if (!client || connection !== "ready") return;

    const key = seriesKey(activeId, size);
    let cancelled = false;
    const feed = new CandleFeed(client, { activeId, size });
    feedRef.current = feed;

    const off = feed.subscribe((next) => {
      if (cancelled) return;
      // The feed mutates its buffer in place, so copy before handing it to
      // React or the reference comparison skips the re-render.
      setSeries({ key, candles: [...next], quote: feed.getLastQuote() });
    });

    feed.start(history).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause : new Error(String(cause)));
    });

    return () => {
      cancelled = true;
      off();
      feed.stop();
      feedRef.current = null;
    };
  }, [connection, activeId, size, history]);

  const loadOlder = useCallback(() => {
    void feedRef.current?.loadOlder().catch(() => {
      // Running out of history is expected at the start of an instrument.
    });
  }, []);

  const current = series.key === seriesKey(activeId, size) ? series : null;

  return {
    candles: current?.candles ?? EMPTY,
    quote: current?.quote ?? null,
    state: ssid ? connection : "idle",
    error,
    loadOlder,
  };
}
