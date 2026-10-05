"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCopy, type AdminCopy } from "@/i18n/admin";

export type AdminSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
};

/**
 * Platform settings, edited as JSON.
 *
 * Each setting configures a different thing and the shapes have nothing in
 * common — a feed URL, an engine build number, a brand — so there is no form to
 * generate. The document is shown as it is stored, and the parse happens here
 * so a typo is caught before it is written rather than after.
 *
 * A row is merged over its defaults when it is read, so deleting a field from
 * the document falls back rather than breaking.
 */
export function SettingsEditor({ settings, locale }: { settings: AdminSetting[]; locale: string }) {
  const copy = adminCopy(locale);
  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <SettingCard key={setting.key} setting={setting} t={copy.settings} c={copy.common} />
      ))}
    </div>
  );
}

function SettingCard({
  setting,
  t,
  c,
}: {
  setting: AdminSetting;
  t: AdminCopy["settings"];
  c: AdminCopy["common"];
}) {
  const router = useRouter();
  const stored = JSON.stringify(setting.value, null, 2);
  const [text, setText] = useState(stored);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const changed = text !== stored;

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.badJson);
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: setting.key, value: parsed }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? c.refused);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : c.unreachable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#15161a] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-[13px] font-medium">{setting.key}</h3>
        <span className="text-[12px] text-[#6f7076]">
          {t.changedAt(new Date(setting.updatedAt).toLocaleString())}
        </span>
      </div>

      {setting.description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#a0a1a6]">{setting.description}</p>
      )}

      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaved(false);
        }}
        spellCheck={false}
        rows={Math.min(text.split("\n").length + 1, 14)}
        className="mt-3 w-full resize-y rounded border border-white/15 bg-[#0f1013] px-3 py-2 font-mono text-[12px] leading-relaxed text-white outline-none focus:border-[var(--accent)]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !changed}
          className="rounded bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? t.saving : c.save}
        </button>

        {changed && (
          <button
            type="button"
            onClick={() => {
              setText(stored);
              setError(null);
            }}
            className="text-[13px] text-[#a0a1a6] hover:text-white"
          >
            {t.revert}
          </button>
        )}

        {error && <span className="text-[13px] text-avalon-danger">{error}</span>}
        {saved && !changed && <span className="text-[13px] text-[var(--accent)]">{c.saved}</span>}
      </div>
    </div>
  );
}
