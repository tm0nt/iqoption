"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AffiliateProgram } from "@/lib/affiliate/program-types";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { adminCopy } from "@/i18n/admin";
import { Card, Field, buttonClass, hintClass, inputClass, textareaClass } from "./ui";

const NUMBERS = ["cpaAmount", "cpaMinDeposit", "cpaMinTurnover", "revsharePercent", "holdDays", "minPayout", "cookieDays"] as const;
type NumberKey = (typeof NUMBERS)[number];
type Draft = Omit<AffiliateProgram, NumberKey> & Record<NumberKey, string>;

/**
 * The affiliate programme's terms as a form.
 *
 * Grouped the way an operator thinks about a deal: whether the programme is
 * open, what it pays per person, what share it pays, and when and how
 * affiliates get their money.
 */
export function ProgramEditor({ program, locale }: { program: AffiliateProgram; locale: string }) {
  const t = adminMoneyCopy(locale).program;
  const plans = adminMoneyCopy(locale).affiliates.plans;
  const c = adminMoneyCopy(locale).common;
  const shared = adminCopy(locale).common;
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(() => ({
    ...program,
    ...(Object.fromEntries(NUMBERS.map((key) => [key, String(program[key])])) as Record<NumberKey, string>),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const body = { ...draft, ...Object.fromEntries(NUMBERS.map((key) => [key, Number(draft[key].replace(",", "."))])) };
      const response = await fetch("/api/admin/affiliates/program", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setError(said?.error ?? t.saveFailed);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(shared.unreachable);
    } finally {
      setBusy(false);
    }
  }

  const number = (key: NumberKey, step = "0.01") => (
    <input type="number" min="0" step={step} value={draft[key]} onChange={(event) => set(key, event.target.value)} className={inputClass} />
  );
  const toggle = (key: "enabled" | "autoApprove", label: string, hint: string) => (
    <label className="flex items-start gap-2.5">
      <input type="checkbox" checked={draft[key]} onChange={(event) => set(key, event.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
      <span>
        <span className="block text-[13px] text-white">{label}</span>
        <span className={`block ${hintClass} !mt-0.5`}>{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-5">
      <Card title={t.general}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            {toggle("enabled", t.enabled, t.enabledHint)}
            {toggle("autoApprove", t.autoApprove, t.autoApproveHint)}
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label={t.plan} hint={t.planHint}>
              <select value={draft.plan} onChange={(event) => set("plan", event.target.value as Draft["plan"])} className={inputClass}>
                {(["CPA", "REVSHARE", "HYBRID"] as const).map((plan) => (
                  <option key={plan} value={plan}>
                    {plans[plan]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.currency}>
              <input value={draft.currency} onChange={(event) => set("currency", event.target.value.toUpperCase())} maxLength={5} className={inputClass} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title={t.cpa}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`${t.cpaAmount} (${draft.currency})`}>{number("cpaAmount")}</Field>
            <Field label={`${t.cpaMinDeposit} (${draft.currency})`} hint={t.cpaMinDepositHint}>
              {number("cpaMinDeposit")}
            </Field>
            <Field label={`${t.cpaMinTurnover} (${draft.currency})`} hint={t.cpaMinTurnoverHint}>
              {number("cpaMinTurnover")}
            </Field>
          </div>
        </Card>
        <Card title={t.revshare}>
          <Field label={t.revsharePercent} hint={t.revshareHint}>
            {number("revsharePercent")}
          </Field>
        </Card>
      </div>

      <Card title={t.payouts}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`${t.minPayout} (${draft.currency})`} hint={t.minPayoutHint}>
            {number("minPayout")}
          </Field>
          <Field label={t.holdDays} hint={t.holdDaysHint}>
            {number("holdDays", "1")}
          </Field>
          <Field label={t.cookieDays} hint={t.cookieDaysHint}>
            {number("cookieDays", "1")}
          </Field>
        </div>
      </Card>

      <Card title={t.terms}>
        <Field label={t.terms} hint={t.termsHint}>
          <textarea value={draft.terms} onChange={(event) => set("terms", event.target.value)} rows={6} className={textareaClass} />
        </Field>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-white/[0.06] bg-[#0b0c0f]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <button type="button" onClick={save} disabled={busy} className={buttonClass("primary")}>
          {busy ? c.saving : shared.save}
        </button>
        {error && <span className="text-[13px] text-[#ff8a99]">{error}</span>}
        {saved && !error && <span className="text-[13px] text-[var(--accent)]">{t.saved}</span>}
      </div>
    </div>
  );
}
