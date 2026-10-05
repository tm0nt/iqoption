"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { type CashierMethod, DEFAULT_DAYS } from "@/lib/cabinet/cashier-types";
import { MethodMark } from "@/components/cabinet/MethodMark";
import { formatMoney, localeTag } from "@/lib/cabinet/format";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";

/**
 * Choosing a rail, an amount, a promo code, and agreeing to the terms.
 *
 * The amount is one value with two ways in: the preset buttons write into the
 * field, and typing clears the selection. Keeping them as separate pieces of
 * state is how a page ends up charging the preset someone stopped choosing.
 *
 * A promo code that has been checked is tied to the amount it was checked
 * against — its bonus is a percentage of it — so changing the amount takes the
 * check back rather than leaving a bonus on screen that no longer applies.
 */
export function DepositPanel({
  methods,
  presets,
  currency,
  minimum,
  maximum,
  termsUrl,
  locale,
}: {
  methods: CashierMethod[];
  presets: number[];
  currency: string;
  minimum: number;
  /** 0 is no ceiling. */
  maximum: number;
  termsUrl: string;
  locale: string;
}) {
  const c = cabinetCopy(locale).cashier;
  const x = cabinetExtra(locale).cashier;
  const router = useRouter();
  const [selected, setSelected] = useState(methods[0]?.id ?? "");
  const [amount, setAmount] = useState(String(presets[presets.length - 1] ?? minimum));
  const [accepted, setAccepted] = useState(false);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<{ code: string; message: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState<string | null>(null);

  const method = methods.find((candidate) => candidate.id === selected) ?? methods[0];
  const whole = new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 0 });
  const money = (n: number) => formatMoney(n, currency, locale);

  function changeAmount(value: string) {
    setAmount(value);
    if (applied) setApplied(null);
  }

  async function checkPromo() {
    if (!promo.trim() || checking) return;
    setChecking(true);
    setPromoError(null);
    setApplied(null);
    try {
      const response = await fetch("/api/cashier/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: promo, amount, locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) setPromoError(said?.error ?? x.promoUnknown);
      else setApplied({ code: said.code, message: said.message });
    } catch {
      setPromoError(c.unreachable);
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    if (busy || !method) return;
    setBusy(true);
    setErrors({});

    try {
      const response = await fetch("/api/cashier/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: method.id, amount, acceptedTerms: accepted, promo: promo.trim(), locale }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(body?.errors ?? { form: [body?.error ?? c.refused] });
        return;
      }
      setDone(body?.transaction?.id ? `#${body.transaction.id}` : "");
      setPromo("");
      setApplied(null);
      router.refresh();
    } catch (reason) {
      setErrors({ form: [reason instanceof Error ? reason.message : c.unreachable] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");
  const termsLink = termsUrl ? (
    <a href={termsUrl} target="_blank" rel="noreferrer" className="text-avalon-primary hover:underline">
      {c.terms}
    </a>
  ) : (
    <span className="text-avalon-text-strong">{c.terms}</span>
  );

  return (
    <div className="overflow-hidden rounded-[4px] bg-white shadow-avalon md:flex">
      {/* A row of chips on a phone, the live site's column from `md`. */}
      <ul className="flex gap-2 overflow-x-auto border-b border-avalon-surface-hover p-3 md:block md:w-[220px] md:shrink-0 md:gap-0 md:overflow-visible md:border-b-0 md:border-r md:p-0">
        {methods.map((candidate) => {
          const active = candidate.id === method?.id;
          return (
            <li key={candidate.id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelected(candidate.id);
                  setDone(null);
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-[2px] px-3 py-2.5 text-left transition-colors md:rounded-none md:px-4 md:py-3 ${
                  active
                    ? "bg-white ring-1 ring-avalon-primary md:ring-0"
                    : "bg-avalon-surface hover:bg-avalon-surface-hover"
                }`}
              >
                <MethodMark method={candidate} size={28} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-avalon-text-strong">{candidate.name}</span>
                  <span className="block text-[11px] text-avalon-text">
                    {candidate.days === DEFAULT_DAYS ? cabinetCopy(locale).faq.businessDays : candidate.days}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="grow p-5 sm:p-8">
        {!method ? (
          <p className="text-[14px] text-avalon-text">{c.noMethods}</p>
        ) : done !== null ? (
          <div className="py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-avalon-primary/10 text-[22px] text-avalon-primary">✓</span>
            <h2 className="mt-4 text-[20px] font-semibold text-avalon-text-strong">{x.depositRecorded(done)}</h2>
            <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-[22px] text-avalon-text">{x.depositPendingBody}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setDone(null)}
                className="h-[42px] rounded-[2px] bg-avalon-primary px-5 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
              >
                {x.another}
              </button>
              <Link
                href={`/${locale}/transactions?type=deposit`}
                className="flex h-[42px] items-center rounded-[2px] border border-avalon-border-muted px-5 text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
              >
                {x.viewHistory}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <MethodMark method={method} size={32} />
              <h2 className="text-[16px] font-semibold text-avalon-text-strong">{method.name}</h2>
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
              {presets.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:w-[270px] lg:shrink-0 lg:grid-cols-2 lg:self-start">
                  {presets.map((preset) => {
                    const active = amount === String(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => changeAmount(String(preset))}
                        className={`h-[45px] rounded-[2px] border text-[14px] transition-colors ${
                          active
                            ? "border-avalon-primary text-avalon-text-strong"
                            : "border-avalon-surface-hover bg-avalon-surface text-avalon-text hover:border-avalon-border-muted"
                        }`}
                      >
                        {whole.format(preset)}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="w-full lg:max-w-[320px]">
                <div className="flex gap-3">
                  <label className="grow">
                    <span className="mb-1.5 block text-[12px] text-avalon-text">{c.depositAmount}</span>
                    <input
                      value={amount}
                      onChange={(event) => changeAmount(event.target.value)}
                      inputMode="decimal"
                      disabled={busy}
                      className="h-[46px] w-full rounded-[2px] border border-avalon-border-muted px-3 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary"
                    />
                  </label>
                  <label className="w-[86px] shrink-0">
                    <span className="mb-1.5 block text-[12px] text-avalon-text">{c.currency}</span>
                    <span className="flex h-[46px] items-center rounded-[2px] border border-avalon-border-muted px-3 text-[14px] font-medium text-avalon-text-strong">
                      {currency}
                    </span>
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] text-avalon-text">{x.limits(money(minimum), maximum > 0 ? money(maximum) : null)}</p>
                <FormError className="mt-2">{error("amount")}</FormError>

                <p className="mt-5 text-[12px] text-avalon-text">{c.promotion}</p>
                {applied ? (
                  <div className="mt-1.5 flex items-start justify-between gap-3 rounded-[2px] bg-avalon-primary/10 px-3 py-2.5">
                    <p className="text-[13px] leading-[18px] text-avalon-text-strong">
                      <span className="font-semibold">{applied.code}</span> — {applied.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setApplied(null);
                        setPromo("");
                      }}
                      className="shrink-0 text-[12px] text-avalon-text hover:text-avalon-danger"
                    >
                      {x.promoRemove}
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 flex">
                    <input
                      value={promo}
                      onChange={(event) => {
                        setPromo(event.target.value);
                        setPromoError(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void checkPromo();
                        }
                      }}
                      placeholder={c.promoPlaceholder}
                      className="h-[42px] min-w-0 grow rounded-l-[2px] border border-r-0 border-avalon-border-muted px-3 text-[14px] uppercase outline-none transition-colors placeholder:normal-case focus:border-avalon-primary"
                    />
                    <button
                      type="button"
                      onClick={() => void checkPromo()}
                      disabled={checking || !promo.trim()}
                      className="h-[42px] shrink-0 rounded-r-[2px] bg-[#f58a73] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {c.apply}
                    </button>
                  </div>
                )}
                <p className={`mt-1.5 text-[11px] ${promoError || error("promo") ? "text-avalon-danger" : "text-avalon-text"}`}>
                  {promoError ?? error("promo") ?? c.onePerDeposit}
                </p>

                <label className="mt-5 flex items-start gap-2 text-[13px] text-avalon-text">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-avalon-primary"
                  />
                  <span>
                    {c.acceptTerms} {termsLink}.
                  </span>
                </label>
                <FormError className="mt-2">{error("acceptedTerms") ?? error("form")}</FormError>

                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !accepted}
                  className="mt-5 h-[46px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? c.sending : c.proceed}
                </button>
              </div>
            </div>

            {/*
              The live page lines up the card networks' logos here. Those are
              their trademarks and showing them would claim a payment
              relationship that does not exist, so this says what is true
              instead.
            */}
            <p className="mt-8 border-t border-avalon-surface-hover pt-5 text-[11px] text-avalon-text">{c.encrypted}</p>
          </>
        )}
      </div>
    </div>
  );
}
