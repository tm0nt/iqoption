"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export type SessionRow = {
  id: string;
  browser: string;
  ip: string | null;
  when: string;
  current: boolean;
};

/**
 * The trading sessions open on an account, each with a way to end it.
 *
 * Ending one is not cosmetic: the id is what the engine presents to the market
 * feed, so removing the row stops that tab trading. The current session is
 * shown but cannot be ended from here — a button that logs you out while you
 * are reading the page is a trap, and Log Out already does that deliberately.
 */
export function SessionList({ sessions, locale }: { sessions: SessionRow[]; locale: string }) {
  const copy = cabinetCopy(locale).security;
  const x = cabinetExtra(locale).profile;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function end(id: string) {
    setError(null);
    start(async () => {
      const response = await fetch("/api/profile/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => null);

      if (!response?.ok) {
        setError(copy.endFailed);
        return;
      }
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return <p className="text-[14px] text-avalon-text">{copy.noSessions}</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-[13px] text-avalon-danger">{error}</p>}

      {sessions.map((session) => (
        <div key={session.id} className="flex items-center gap-3 bg-avalon-surface-hover/60 px-4 py-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[13px] font-semibold text-white">
            {session.browser.slice(0, 1)}
          </span>

          <div className="min-w-0">
            <p className="break-words text-[13px] text-avalon-text-strong">
              {x.browser(session.browser)}
              {session.ip ? ` · ${x.ipAddress(session.ip)}` : ""}
              {session.current ? ` · ${copy.thisDevice}` : ""}
            </p>
            <p className="text-[13px] text-avalon-text">{session.when}</p>
          </div>

          {!session.current && (
            <button
              type="button"
              disabled={busy}
              onClick={() => end(session.id)}
              aria-label={copy.endSession}
              className="ml-auto text-avalon-text transition-colors hover:text-avalon-danger disabled:opacity-50"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
