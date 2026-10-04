"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { methodInitials, type CashierMethod } from "@/lib/cabinet/cashier-types";

const MONEY = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * Choosing a rail, an amount, and agreeing to the terms.
 *
 * The amount is one value with two ways in: the preset buttons write into the
 * field, and typing clears the selection. Keeping them as separate pieces of
 * state is how a page ends up charging the preset someone stopped choosing.
 */
export function DepositPanel({
  methods,
  presets,
  currency,
  minimum,
  locale,
}: {
  methods: CashierMethod[];
  presets: number[];
  currency: string;
  minimum: number;
  locale: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(methods[0]?.id ?? "");
  const [amount, setAmount] = useState(String(presets[presets.length - 1] ?? minimum));
  const [accepted, setAccepted] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState<string | null>(null);

  const method = methods.find((candidate) => candidate.id === selected) ?? methods[0];

  async function submit() {
    if (busy || !method) return;
    setBusy(true);
    setErrors({});

    try {
      const response = await fetch("/api/cashier/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: method.id, amount, acceptedTerms: accepted }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? { form: [body.error ?? "The deposit was refused."] });
        return;
      }
      setDone(body.transaction?.id ? `#${body.transaction.id}` : "recorded");
      router.refresh();
    } catch (reason) {
      setErrors({ form: [reason instanceof Error ? reason.message : "Could not reach the server."] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");

  return (
    <div className="flex overflow-hidden rounded-[4px] bg-white shadow-avalon">
      <ul className="w-[196px] shrink-0 border-r border-avalon-surface-hover">
        {methods.map((candidate) => {
          const active = candidate.id === method?.id;
          return (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(candidate.id);
                  setDone(null);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  active ? "bg-white" : "bg-avalon-surface hover:bg-avalon-surface-hover"
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-avalon-surface-hover text-[9px] font-semibold text-avalon-text">
                  {methodInitials(candidate)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-avalon-text-strong">{candidate.name}</span>
                  <span className="block text-[11px] text-avalon-text">{candidate.days}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="grow p-8">
        {!method ? (
          <p className="text-[14px] text-avalon-text">No deposit methods are configured.</p>
        ) : done ? (
          <div className="py-16 text-center">
            <h2 className="text-[20px] font-semibold text-avalon-text-strong">Deposit {done} recorded</h2>
            <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-[22px] text-avalon-text">
              It is pending. There is no payment provider behind this yet, so nothing has been charged and the
              balance will not move until someone approves it.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-avalon-surface text-[10px] font-semibold text-avalon-text">
                {methodInitials(method)}
              </span>
              <h2 className="text-[16px] font-semibold text-avalon-text-strong">{method.name}</h2>
            </div>

            <div className="mt-6 flex gap-8">
              <div className="grid w-[270px] shrink-0 grid-cols-2 gap-2.5">
                {presets.map((preset) => {
                  const active = amount === String(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`h-[45px] rounded-[2px] border text-[14px] transition-colors ${
                        active
                          ? "border-avalon-primary text-avalon-text-strong"
                          : "border-avalon-surface-hover bg-avalon-surface text-avalon-text hover:border-avalon-border-muted"
                      }`}
                    >
                      {MONEY.format(preset)}
                    </button>
                  );
                })}
              </div>

              <div className="w-[300px] shrink-0">
                <div className="flex gap-3">
                  <label className="grow">
                    <span className="mb-1.5 block text-[12px] text-avalon-text">Deposit amount</span>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      inputMode="decimal"
                      disabled={busy}
                      className="h-[46px] w-full rounded-[2px] border border-avalon-border-muted px-3 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary"
                    />
                  </label>
                  <label className="w-[86px] shrink-0">
                    <span className="mb-1.5 block text-[12px] text-avalon-text">Currency</span>
                    <span className="flex h-[46px] items-center rounded-[2px] border border-avalon-border-muted px-3 text-[14px] font-medium text-avalon-text-strong">
                      {currency}
                    </span>
                  </label>
                </div>
                <FormError className="mt-2">{error("amount")}</FormError>

                <p className="mt-5 text-[12px] text-avalon-text">Promotion</p>
                <div className="mt-1.5 flex">
                  <input
                    value={promo}
                    onChange={(event) => {
                      setPromo(event.target.value);
                      setPromoNote(null);
                    }}
                    placeholder="Your promo code"
                    className="h-[42px] grow rounded-l-[2px] border border-r-0 border-avalon-border-muted px-3 text-[14px] outline-none transition-colors focus:border-avalon-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setPromoNote("No promotions are running.")}
                    className="h-[42px] shrink-0 rounded-r-[2px] bg-[#f58a73] px-5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-avalon-text">
                  {promoNote ?? "One promo code per deposit"}
                </p>

                <label className="mt-5 flex items-start gap-2 text-[13px] text-avalon-text">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-avalon-primary"
                  />
                  <span>
                    I hereby accept the{" "}
                    <a href={`/${locale}/profile/personal`} className="text-avalon-primary hover:underline">
                      Terms &amp; Conditions
                    </a>
                    .
                  </span>
                </label>
                <FormError className="mt-2">{error("acceptedTerms") ?? error("form")}</FormError>

                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || !accepted}
                  className="mt-5 h-[46px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Proceed to Payment"}
                </button>
              </div>
            </div>

            {/*
              The live page lines up the card networks' logos here. Those are
              their trademarks and showing them would claim a payment
              relationship that does not exist, so this says what is true
              instead.
            */}
            <p className="mt-8 border-t border-avalon-surface-hover pt-5 text-[11px] text-avalon-text">
              Connections to this site are encrypted. No card network is connected yet, and no payment is taken.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
