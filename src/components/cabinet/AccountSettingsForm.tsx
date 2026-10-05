"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cabinetCopy } from "@/i18n/cabinet";
import { ProfileAction, ProfileSection } from "./ProfileSection";
import { Toggle } from "./Toggle";

async function save(key: string, value: boolean) {
  const response = await fetch("/api/profile/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  }).catch(() => null);
  if (!response?.ok) return { error: "save failed" };
  return {};
}

/** The one-click actions, each of which asks before it does anything. */
async function act(action: string) {
  const response = await fetch("/api/profile/account", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  }).catch(() => null);
  const said = await response?.json().catch(() => null);
  if (!response?.ok) return { error: said?.error ?? "that did not work" } as const;
  return { displayName: typeof said?.displayName === "string" ? said.displayName : undefined } as const;
}

export function AccountSettingsForm({
  publicProfile,
  displayName,
  deletionRequested,
  locale,
}: {
  publicProfile: boolean;
  displayName: string;
  deletionRequested: boolean;
  locale: string;
}) {
  const copy = cabinetCopy(locale).settings;
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, start] = useTransition();

  function run(action: string, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    setDone(null);

    start(async () => {
      const said = await act(action);
      if ("error" in said) {
        setError(said.error);
        return;
      }
      if (said.displayName) setName(said.displayName);
      if (action === "reset") setDone(copy.resetDone);
      if (action === "close") {
        /*
         * A closed account cannot sign in again, so staying signed in after
         * closing it was a session that outlived its account. Shown first so
         * the person reads why they are leaving.
         */
        setDone(copy.closeDone);
        window.setTimeout(() => void signOut({ redirectTo: `/${locale}/login` }), 1500);
        return;
      }
      if (action === "delete") setDone(copy.deleteDone);
      router.refresh();
    });
  }

  return (
    <>
      <ProfileSection
        title={copy.publicTitle}
        aside={<Toggle checked={publicProfile} label={copy.publicTitle} onSave={(v) => save("publicProfile", v)} />}
      >
        <p>{copy.publicBody}</p>
        <div className="flex items-center gap-3 pt-1">
          <span>{copy.nameOnPlatform}: {name}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("reroll")}
            aria-label={copy.pickAnother}
            title={copy.pickAnother}
            className="flex size-[30px] items-center justify-center rounded-full bg-avalon-primary text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </ProfileSection>

      {(error || done) && (
        <p className={`pt-4 text-[13px] ${error ? "text-avalon-danger" : "text-avalon-primary"}`}>
          {error ?? done}
        </p>
      )}

      <p className="pt-7 text-[14px] text-avalon-text">{copy.additional}</p>

      <ProfileSection title={copy.resetTitle}>
        <p>{copy.resetBody}</p>
        <ProfileAction
          disabled={busy}
          onClick={() => run("reset", copy.resetConfirm)}
        >
          {copy.resetAction}
        </ProfileAction>
      </ProfileSection>

      <ProfileSection title={copy.closeTitle}>
        <p>{copy.closeBody}</p>
        <ProfileAction
          disabled={busy}
          onClick={() => run("close", copy.closeConfirm)}
        >
          {copy.closeAction}
        </ProfileAction>
      </ProfileSection>

      <ProfileSection title={copy.deleteTitle} last>
        <p>
          {copy.deleteBody}
          <br />
          {copy.deleteNote}
        </p>
        {deletionRequested ? (
          <p className="text-avalon-text-strong">{copy.deleteOnFile}</p>
        ) : (
          <ProfileAction
            disabled={busy}
            onClick={() => run("delete", copy.deleteConfirm)}
          >
            {copy.deleteAction}
          </ProfileAction>
        )}
      </ProfileSection>
    </>
  );
}
