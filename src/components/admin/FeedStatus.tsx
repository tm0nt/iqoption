"use client";

import { useEffect, useState } from "react";

type Status =
  | { state: "checking" }
  | { state: "up"; instruments: number; target: string }
  | { state: "down"; error: string; target: string };

/**
 * Whether the market server is answering.
 *
 * Polled rather than rendered once: the feed is a separate process that can be
 * restarted under the panel, and a status that was true when the page loaded is
 * worse than no status at all.
 */
export function FeedStatus() {
  const [status, setStatus] = useState<Status>({ state: "checking" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch("/api/admin/feed", { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        setStatus(
          body.reachable
            ? { state: "up", instruments: body.instruments, target: body.target }
            : { state: "down", error: body.error, target: body.target },
        );
      } catch (error) {
        if (!cancelled) {
          setStatus({ state: "down", error: error instanceof Error ? error.message : "unreachable", target: "" });
        }
      }
    }

    check();
    const timer = setInterval(check, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (status.state === "checking") {
    return <p className="text-[13px] text-[#a0a1a6]">Checking…</p>;
  }

  if (status.state === "down") {
    return (
      <div className="flex items-start gap-2.5">
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-avalon-danger" />
        <div className="text-[13px]">
          <p className="font-medium text-avalon-danger">Not answering</p>
          <p className="mt-0.5 text-[#a0a1a6]">
            {status.error}
            {status.target && <> — tried {status.target}</>}
          </p>
          <p className="mt-1 text-[#6f7076]">Start it with <code className="font-mono">npm run server</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-avalon-primary" />
      <div className="text-[13px]">
        <p className="font-medium">Serving {status.instruments} instruments</p>
        <p className="mt-0.5 font-mono text-[12px] text-[#6f7076]">{status.target}</p>
      </div>
    </div>
  );
}
