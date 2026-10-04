"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileAction, ProfileSection } from "./ProfileSection";
import { Toggle } from "./Toggle";

async function save(key: string, value: boolean) {
  const response = await fetch("/api/profile/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  }).catch(() => null);
  if (!response?.ok) return { error: "could not save that" };
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
}: {
  publicProfile: boolean;
  displayName: string;
  deletionRequested: boolean;
}) {
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
      if (action === "reset") setDone("Your platform settings are back to their defaults.");
      if (action === "close") setDone("Your account is closed. Contact support to reopen it.");
      if (action === "delete") setDone("Your deletion request has been recorded.");
      router.refresh();
    });
  }

  return (
    <>
      <ProfileSection
        title="Using Public Profile"
        aside={<Toggle checked={publicProfile} label="Public profile" onSave={(v) => save("publicProfile", v)} />}
      >
        <p>You can pick a generated name that will be displayed in the trading statistics on the platform.</p>
        <div className="flex items-center gap-3 pt-1">
          <span>Name on the platform: {name}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("reroll")}
            aria-label="Pick another name"
            title="Pick another name"
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

      <p className="pt-7 text-[14px] text-avalon-text">Additional settings</p>

      <ProfileSection title="Reset">
        <p>
          If you have problems using our trading platform, please try resetting your settings. After
          resetting, <strong className="font-semibold text-avalon-text-strong">all settings</strong>{" "}
          will have default values.
        </p>
        <ProfileAction
          disabled={busy}
          onClick={() => run("reset", "Reset every platform setting to its default?")}
        >
          Reset settings
        </ProfileAction>
      </ProfileSection>

      <ProfileSection title="Temporary Closing of Account">
        <p>
          You can temporarily close your account. Once your account is closed, you will not be able
          to log in or make transactions. You can reopen your account by contacting our Support Team.
        </p>
        <ProfileAction
          disabled={busy}
          onClick={() => run("close", "Close your account? You will be signed out and cannot log back in without support.")}
        >
          Close account
        </ProfileAction>
      </ProfileSection>

      <ProfileSection title="Deletion of Account and Personal Data" last>
        <p>
          Deletion of your account and all personal data is permanent. You will not be able to
          access your account, trade, or make use of any of the Avalon services.
          <br />
          NOTE: Prior to submitting your personal data deletion request, you need to{" "}
          <strong className="font-semibold text-avalon-text-strong">
            close any remaining open positions and pending orders
          </strong>
          .
        </p>
        {deletionRequested ? (
          <p className="text-avalon-text-strong">A deletion request is already on file.</p>
        ) : (
          <ProfileAction
            disabled={busy}
            onClick={() => run("delete", "Request deletion of your account and personal data?")}
          >
            Request Deletion
          </ProfileAction>
        )}
      </ProfileSection>
    </>
  );
}
