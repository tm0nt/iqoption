"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { adminCopy } from "@/i18n/admin";
import { Field, buttonClass, inputClass, textareaClass } from "./ui";

type Plan = "CPA" | "REVSHARE" | "HYBRID";

/** Sends a JSON body and refreshes, keeping one error message. */
function useSubmit(locale: string) {
  const router = useRouter();
  const unreachable = adminCopy(locale).common.unreachable;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function send(url: string, method: string, body: unknown) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setError(said?.error ?? unreachable);
        return false;
      }
      setSaved(true);
      router.refresh();
      return true;
    } catch {
      setError(unreachable);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, saved, send };
}

/** Making an existing account an affiliate, by its email address. */
export function AddAffiliateForm({ locale }: { locale: string }) {
  const t = adminMoneyCopy(locale).affiliates;
  const { busy, error, send } = useSubmit(locale);
  const [email, setEmail] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await send("/api/admin/affiliates", "POST", { email })) setEmail("");
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-start gap-2">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t.addPlaceholder}
        required
        className={`${inputClass} w-[240px]`}
      />
      <button type="submit" disabled={busy} className={buttonClass("primary")}>
        {t.add}
      </button>
      {error && <p className="basis-full text-[12px] text-[#ff8a99]">{error}</p>}
    </form>
  );
}

/** One affiliate's own terms, code, postback and note. Empty terms follow the programme. */
export function AffiliateTermsEditor({
  id,
  locale,
  initial,
  defaults,
}: {
  id: number;
  locale: string;
  initial: { code: string; plan: Plan | null; cpaAmount: string; revsharePercent: string; postbackUrl: string; note: string };
  defaults: { plan: Plan; cpaAmount: string; revsharePercent: string };
}) {
  const t = adminMoneyCopy(locale).affiliates;
  const c = adminCopy(locale).common;
  const { busy, error, saved, send } = useSubmit(locale);
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    await send(`/api/admin/affiliates/${id}`, "PATCH", {
      code: draft.code,
      plan: draft.plan ?? "",
      cpaAmount: draft.cpaAmount,
      revsharePercent: draft.revsharePercent,
      postbackUrl: draft.postbackUrl,
      note: draft.note,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.code}>
          <input value={draft.code} onChange={(event) => set("code", event.target.value.toUpperCase())} className={`${inputClass} font-mono`} />
        </Field>
        <Field label={t.plan} hint={t.defaultHint}>
          <select value={draft.plan ?? ""} onChange={(event) => set("plan", (event.target.value || null) as Plan | null)} className={inputClass}>
            <option value="">{t.programDefault(t.plans[defaults.plan])}</option>
            {(["CPA", "REVSHARE", "HYBRID"] as const).map((plan) => (
              <option key={plan} value={plan}>
                {t.plans[plan]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.cpaAmount} hint={t.defaultHint}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.cpaAmount}
            placeholder={defaults.cpaAmount}
            onChange={(event) => set("cpaAmount", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t.revsharePercent} hint={t.defaultHint}>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={draft.revsharePercent}
            placeholder={defaults.revsharePercent}
            onChange={(event) => set("revsharePercent", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label={t.postbackUrl}>
        <input value={draft.postbackUrl} onChange={(event) => set("postbackUrl", event.target.value)} placeholder="https://" className={`${inputClass} font-mono`} />
      </Field>
      <Field label={t.note} hint={t.noteHint}>
        <textarea value={draft.note} onChange={(event) => set("note", event.target.value)} rows={3} className={textareaClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={buttonClass("primary")}>
          {c.save}
        </button>
        {error && <span className="text-[13px] text-[#ff8a99]">{error}</span>}
        {saved && !error && <span className="text-[13px] text-[var(--accent)]">{c.saved}</span>}
      </div>
    </form>
  );
}

/** A hand-written ledger line. */
export function AdjustmentForm({ id, locale, currency }: { id: number; locale: string; currency: string }) {
  const t = adminMoneyCopy(locale).affiliates;
  const { busy, error, send } = useSubmit(locale);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await send(`/api/admin/affiliates/${id}/adjust`, "POST", { amount, note })) {
      setAmount("");
      setNote("");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <Field label={`${t.adjustAmount} (${currency})`}>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="-25.00" required className={inputClass} />
      </Field>
      <Field label={t.adjustNote}>
        <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={255} required className={inputClass} />
      </Field>
      <button type="submit" disabled={busy} className={buttonClass("secondary")}>
        {t.adjustAdd}
      </button>
      {error && <p className="text-[12px] text-[#ff8a99] sm:col-span-3">{error}</p>}
    </form>
  );
}
