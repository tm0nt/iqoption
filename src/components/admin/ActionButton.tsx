"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";

/**
 * One request behind one button, then a refresh.
 *
 * Most admin actions are exactly this — approve, suspend, reverse, enable —
 * and each used to be its own little component with its own fetch and its
 * own forgotten error state. The failure is shown beside the button, because
 * an action that fails silently looks like an action that worked.
 */
export function ActionButton({
  url,
  method = "POST",
  body,
  label,
  confirm,
  variant = "secondary",
  size = "sm",
  failed = "That did not work.",
}: {
  url: string;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  label: string;
  confirm?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  failed?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    start(async () => {
      const response = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }).catch(() => null);
      if (!response?.ok) {
        const said = await response?.json().catch(() => null);
        setError(said?.error ?? failed);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={busy} className={buttonClass(variant, size)}>
        {label}
      </button>
      {error && <span className="max-w-[260px] text-[11px] leading-tight text-[#ff8a99]">{error}</span>}
    </span>
  );
}
