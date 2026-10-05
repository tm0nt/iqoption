"use client";

import { useState } from "react";
import { adminCopy } from "@/i18n/admin";

type Result = { assets: number; groups: number; feedsReady?: string[]; feedsFailed?: string[] };

/** Tells the market server to re-read the catalogue. */
export function ReloadFeedButton({ locale }: { locale: string }) {
  const t = adminCopy(locale).overview;
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
        setError(body.error ?? t.reloadRefused);
        return;
      }
      setResult(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.feedUnreachable);
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
        className="rounded bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t.reloading : t.reload}
      </button>

      {error && <p className="text-[13px] text-avalon-danger">{error}</p>}

      {result && (
        <div className="text-[13px] text-[#a0a1a6]">
          <p>{t.catalogue(result.assets, result.groups)}</p>
          {result.feedsReady && result.feedsReady.length > 0 && (
            <p className="mt-0.5">{t.liveFeeds}: {result.feedsReady.join(", ")}.</p>
          )}
          {result.feedsFailed && result.feedsFailed.length > 0 && (
            <p className="mt-0.5 text-avalon-danger">{t.noFeed}: {result.feedsFailed.join(", ")}.</p>
          )}
        </div>
      )}
    </div>
  );
}
