"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/lib/engine/settings";
import { adminCopy } from "@/i18n/admin";

/**
 * The four themes the engine's bundle carries, with what each one does to the
 * traderoom so the choice is not made blind.
 */
const THEMES = [
  { value: "black", swatch: "#0e0f12", ink: "#e8e8ea" },
  { value: "white", swatch: "#ffffff", ink: "#1b1d22" },
  { value: "blue", swatch: "#0b1f3a", ink: "#dce7f7" },
  { value: "grey", swatch: "#2a2d33", ink: "#e4e5e8" },
] as const;

const field =
  "w-full rounded border border-white/10 bg-[#0f1013] px-3 py-2 text-[13px] text-white outline-none focus:border-[var(--accent)]";
const label = "mb-1.5 block text-[11px] uppercase tracking-wide text-[#73747a]";

/**
 * Everything that makes the platform this platform.
 *
 * The logos go to the engine too: the traderoom loads `logo.png` from the
 * mirrored build, and the host redirects that request here when one has been
 * uploaded. So a logo changed on this screen changes the corner of the chart,
 * not only the cabinet.
 */
export function BrandEditor({ brand, locale }: { brand: Brand; locale: string }) {
  const t = adminCopy(locale).brand;
  const router = useRouter();
  const [draft, setDraft] = useState<Brand>(brand);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, start] = useTransition();

  function save(changes: Partial<Brand>) {
    const next = { ...draft, ...changes };
    setDraft(next);
    setError(null);
    setSaved(false);

    start(async () => {
      const response = await fetch("/api/admin/brand", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      }).catch(() => null);

      if (!response?.ok) {
        const said = await response?.json().catch(() => null);
        setError(said?.error ?? t.saveFailed);
        setDraft(draft);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  async function upload(slot: "logoUrl" | "logoBigUrl", file: File) {
    setError(null);
    const form = new FormData();
    form.set("logo", file);
    form.set("slot", slot);

    const response = await fetch("/api/admin/brand/logo", { method: "POST", body: form }).catch(() => null);
    const said = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(said?.error ?? t.uploadFailed);
      return;
    }
    setDraft({ ...draft, [slot]: said.url });
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-8" style={{ "--accent": draft.primary } as React.CSSProperties}>
      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</p>
      )}
      {saved && !error && <p className="text-[13px] text-[var(--accent)]">{t.saved}</p>}

      <section className="grid gap-5 sm:grid-cols-2">
        <div>
          <span className={label}>{t.name}</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            onBlur={() => draft.name !== brand.name && save({ name: draft.name })}
            className={field}
          />
          <p className="mt-1.5 text-[12px] text-[#73747a]">{t.nameHint}</p>
        </div>

        <div>
          <span className={label}>{t.supportEmail}</span>
          <input
            value={draft.supportEmail}
            onChange={(e) => setDraft({ ...draft, supportEmail: e.target.value })}
            onBlur={() => draft.supportEmail !== brand.supportEmail && save({ supportEmail: draft.supportEmail })}
            className={field}
          />
        </div>
      </section>

      <section>
        <span className={label}>{t.accent}</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(draft.primary) ? draft.primary : "#00b17a"}
            onChange={(e) => setDraft({ ...draft, primary: e.target.value })}
            onBlur={() => draft.primary !== brand.primary && save({ primary: draft.primary })}
            className="h-10 w-16 cursor-pointer rounded border border-white/10 bg-transparent"
          />
          <input
            value={draft.primary}
            onChange={(e) => setDraft({ ...draft, primary: e.target.value })}
            onBlur={() => draft.primary !== brand.primary && save({ primary: draft.primary })}
            className={`${field} w-40 font-mono`}
          />
          <span
            className="rounded px-4 py-2 text-[13px] font-medium text-white"
            style={{ background: draft.primary }}
          >
            {t.accentSample}
          </span>
        </div>
        <p className="mt-1.5 text-[12px] text-[#73747a]">{t.accentHint}</p>
      </section>

      <section>
        <span className={label}>{t.theme}</span>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              disabled={busy}
              onClick={() => save({ theme: theme.value })}
              className={`w-[132px] overflow-hidden rounded border text-left transition-colors disabled:opacity-50 ${
                draft.theme === theme.value ? "border-[var(--accent)]" : "border-white/10 hover:border-white/25"
              }`}
            >
              {/* A sliver of the theme rather than its name: the choice is
                  about how the chart looks, so it is shown. */}
              <span className="flex h-16 items-end gap-0.5 px-3 pb-3" style={{ background: theme.swatch }}>
                {[40, 22, 56, 34, 48].map((h, i) => (
                  <span key={i} className="w-2 rounded-sm" style={{ height: `${h}%`, background: draft.primary }} />
                ))}
              </span>
              <span className="block px-3 py-2 text-[13px]" style={{ color: theme.ink, background: theme.swatch }}>
                {t.themes[theme.value]}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[#73747a]">{t.themeHint}</p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {(["logoUrl", "logoBigUrl"] as const).map((slot) => (
          <div key={slot}>
            <span className={label}>{slot === "logoUrl" ? t.logo : t.logoBig}</span>

            <div className="flex h-24 items-center justify-center rounded border border-dashed border-white/15 bg-[#0f1013] px-4">
              {draft[slot] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft[slot]} alt="" className="max-h-16 max-w-full object-contain" />
              ) : (
                <span className="text-[12px] text-[#73747a]">{t.usingBuilt}</span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer text-[13px] text-[var(--accent)] hover:underline">
                {t.chooseFile}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(slot, file);
                  }}
                />
              </label>

              {draft[slot] && (
                <button type="button" onClick={() => save({ [slot]: "" })} className="text-[13px] text-red-400 hover:underline">
                  {t.revert}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <p className="border-t border-white/10 pt-5 text-[12px] leading-5 text-[#73747a]">{t.reachNote}</p>
    </div>
  );
}
