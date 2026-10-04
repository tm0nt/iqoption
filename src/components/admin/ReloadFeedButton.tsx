"use client";

import { useState } from "react";

type Result = { assets: number; groups: number; feedsReady?: string[]; feedsFailed?: string[] };

/** Tells the market server to re-read the catalogue. */
export function ReloadFeedButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/reload", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The feed refused the reload.");
        return;
      }
      setResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reach the feed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={reload}
        disabled={busy}
        className="rounded bg-avalon-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-50"
      >
        {busy ? "Reloading…" : "Reload the catalogue"}
      </button>

      {error && <p className="text-[13px] text-avalon-danger">{error}</p>}

      {result && (
        <div className="text-[13px] text-[#a0a1a6]">
          <p>
            {result.assets} instruments in {result.groups} groups.
          </p>
          {result.feedsReady && result.feedsReady.length > 0 && (
            <p className="mt-0.5">Live feeds: {result.feedsReady.join(", ")}.</p>
          )}
          {result.feedsFailed && result.feedsFailed.length > 0 && (
            <p className="mt-0.5 text-avalon-danger">No feed: {result.feedsFailed.join(", ")}.</p>
          )}
        </div>
      )}
    </div>
  );
}
