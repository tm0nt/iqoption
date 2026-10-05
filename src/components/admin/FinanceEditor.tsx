"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CashierMethod, CashierSettings } from "@/lib/cabinet/cashier-types";
import { withdrawalFee } from "@/lib/cabinet/cashier-types";
import { formatMoney } from "@/lib/cabinet/format";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { adminCopy } from "@/i18n/admin";
import { Card, Field, buttonClass, hintClass, inputClass } from "./ui";

const NUMBER_FIELDS = [
  "minDeposit",
  "maxDeposit",
  "maxPendingDeposits",
  "minWithdrawal",
  "maxWithdrawal",
  "freeWithdrawalsPerMonth",
  "withdrawalFeePercent",
  "withdrawalFeeFixed",
] as const;

type NumberField = (typeof NUMBER_FIELDS)[number];

/** Numbers held as typed, so a half-typed "1," is not turned into 1 under the cursor. */
type Draft = Record<NumberField, string> & {
  presets: string;
  methods: CashierMethod[];
  requireKycForWithdrawal: boolean;
  termsUrl: string;
};

function draftOf(settings: CashierSettings): Draft {
  const numbers = Object.fromEntries(NUMBER_FIELDS.map((key) => [key, String(settings[key])])) as Record<NumberField, string>;
  return {
    ...numbers,
    presets: settings.depositPresets.join(", "),
    methods: settings.methods,
    requireKycForWithdrawal: settings.requireKycForWithdrawal,
    termsUrl: settings.termsUrl,
  };
}

/**
 * The cashier's settings as a form.
 *
 * They used to be a JSON document in the generic settings screen, which is how
 * a minimum deposit of "10" (a string) ends up silently ignored. Every field
 * here is typed, and the server validates the whole document again before it
 * is stored.
 */
export function FinanceEditor({ settings, currency, locale }: { settings: CashierSettings; currency: string; locale: string }) {
  const t = adminMoneyCopy(locale).finance;
  const c = adminMoneyCopy(locale).common;
  const shared = adminCopy(locale).common;
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(() => draftOf(settings));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const setMethod = (index: number, patch: Partial<CashierMethod>) =>
    set(
      "methods",
      draft.methods.map((method, i) => (i === index ? { ...method, ...patch } : method)),
    );

  const move = (index: number, by: -1 | 1) => {
    const next = [...draft.methods];
    const [taken] = next.splice(index, 1);
    next.splice(index + by, 0, taken);
    set("methods", next);
  };

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const body = {
        ...Object.fromEntries(NUMBER_FIELDS.map((key) => [key, Number(draft[key].replace(",", "."))])),
        methods: draft.methods,
        depositPresets: draft.presets
          .split(/[,;\s]+/)
          .filter(Boolean)
          .map((value) => Number(value.replace(",", "."))),
        requireKycForWithdrawal: draft.requireKycForWithdrawal,
        termsUrl: draft.termsUrl,
      };
      const response = await fetch("/api/admin/finance", {
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

  const numberInput = (key: NumberField, step = "0.01") => (
    <input
      type="number"
      min="0"
      step={step}
      value={draft[key]}
      onChange={(event) => set(key, event.target.value)}
      className={inputClass}
    />
  );

  // A worked example under the fee fields, so the two numbers mean something.
  const example = 100;
  const exampleFee = withdrawalFee(
    {
      ...settings,
      withdrawalFeeFixed: Number(draft.withdrawalFeeFixed) || 0,
      withdrawalFeePercent: Number(draft.withdrawalFeePercent) || 0,
    },
    example,
    0,
  );
  const fmt = (n: number) => formatMoney(n, currency, locale);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title={t.deposits} description={t.depositsHint}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t.minDeposit} (${currency})`}>{numberInput("minDeposit")}</Field>
            <Field label={`${t.maxDeposit} (${currency})`} hint={c.noLimit}>
              {numberInput("maxDeposit")}
            </Field>
            <Field label={t.maxPending} hint={t.maxPendingHint}>
              {numberInput("maxPendingDeposits", "1")}
            </Field>
            <Field label={t.presets} hint={t.presetsHint}>
              <input value={draft.presets} onChange={(event) => set("presets", event.target.value)} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title={t.withdrawals} description={t.withdrawalsHint}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`${t.minWithdrawal} (${currency})`}>{numberInput("minWithdrawal")}</Field>
            <Field label={`${t.maxWithdrawal} (${currency})`} hint={c.noLimit}>
              {numberInput("maxWithdrawal")}
            </Field>
            <Field label={t.freeWithdrawals} hint={t.freeWithdrawalsHint}>
              {numberInput("freeWithdrawalsPerMonth", "1")}
            </Field>
            <div className="hidden sm:block" />
            <Field label={t.feePercent}>{numberInput("withdrawalFeePercent")}</Field>
            <Field label={`${t.feeFixed} (${currency})`}>{numberInput("withdrawalFeeFixed")}</Field>
          </div>
          <p className={hintClass}>{t.feeExample(fmt(example), fmt(exampleFee), fmt(example - exampleFee))}</p>

          <label className="mt-4 flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={draft.requireKycForWithdrawal}
              onChange={(event) => set("requireKycForWithdrawal", event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-[13px] text-white">{t.requireKyc}</span>
              <span className={`block ${hintClass} !mt-0.5`}>{t.requireKycHint}</span>
            </span>
          </label>
        </Card>
      </div>

      <Card
        title={t.methods}
        description={t.methodsHint}
        padded={false}
        actions={
          <button
            type="button"
            onClick={() =>
              set("methods", [
                ...draft.methods,
                { id: `method-${draft.methods.length + 1}`, name: "", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "bank" },
              ])
            }
            className={buttonClass("secondary", "sm")}
          >
            <Plus size={14} />
            {t.add}
          </button>
        }
      >
        <ul className="divide-y divide-white/[0.05]">
          {draft.methods.map((method, index) => (
            <li key={index} className="grid gap-3 px-5 py-3.5 md:grid-cols-[120px_minmax(0,1fr)_150px_120px_auto] md:items-end">
              <Field label={t.id}>
                <input
                  value={method.id}
                  onChange={(event) => setMethod(index, { id: event.target.value.toLowerCase() })}
                  className={`${inputClass} font-mono`}
                />
              </Field>
              <Field label={t.name}>
                <input value={method.name} onChange={(event) => setMethod(index, { name: event.target.value })} className={inputClass} />
              </Field>
              <Field label={t.days}>
                <input value={method.days} onChange={(event) => setMethod(index, { days: event.target.value })} className={inputClass} />
              </Field>
              <Field label={t.kind}>
                <select
                  value={method.kind}
                  onChange={(event) => setMethod(index, { kind: event.target.value === "crypto" ? "crypto" : "bank" })}
                  className={inputClass}
                >
                  <option value="bank">{t.bank}</option>
                  <option value="crypto">{t.crypto}</option>
                </select>
              </Field>
              <div className="flex flex-wrap items-center gap-3 md:pb-1.5">
                <label className="flex items-center gap-1.5 text-[12px] text-[#c4c5ca]">
                  <input
                    type="checkbox"
                    checked={method.deposit}
                    onChange={(event) => setMethod(index, { deposit: event.target.checked })}
                    className="size-3.5 accent-[var(--accent)]"
                  />
                  {t.deposit}
                </label>
                <label className="flex items-center gap-1.5 text-[12px] text-[#c4c5ca]">
                  <input
                    type="checkbox"
                    checked={method.withdrawal}
                    onChange={(event) => setMethod(index, { withdrawal: event.target.checked })}
                    className="size-3.5 accent-[var(--accent)]"
                  />
                  {t.withdrawal}
                </label>
                <span className="ml-auto flex gap-1">
                  <button type="button" title={t.up} aria-label={t.up} disabled={index === 0} onClick={() => move(index, -1)} className={buttonClass("ghost", "sm")}>
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    title={t.down}
                    aria-label={t.down}
                    disabled={index === draft.methods.length - 1}
                    onClick={() => move(index, 1)}
                    className={buttonClass("ghost", "sm")}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    title={t.remove}
                    aria-label={t.remove}
                    disabled={draft.methods.length === 1}
                    onClick={() => set("methods", draft.methods.filter((_, i) => i !== index))}
                    className={buttonClass("ghost", "sm")}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t.terms}>
        <Field label={t.termsUrl} hint={t.termsUrlHint}>
          <input
            value={draft.termsUrl}
            onChange={(event) => set("termsUrl", event.target.value)}
            placeholder="https://"
            className={inputClass}
          />
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
