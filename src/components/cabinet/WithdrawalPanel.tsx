"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { methodInitials, type CashierMethod } from "@/lib/cabinet/cashier-types";
import { cabinetCopy } from "@/i18n/cabinet";
import { DEFAULT_DAYS } from "@/lib/cabinet/cashier-types";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The rail list and the panel beside it.
 *
 * One component rather than two, because choosing a rail is the only thing the
 * list does and the panel is the whole of what it chooses — splitting them
 * would mean lifting the selection into a parent that has nothing else to do.
 */
export function WithdrawalPanel({
  methods,
  balance,
  currency,
  minimum,
  locale,
}: {
  methods: CashierMethod[];
  balance: number;
  currency: string;
  minimum: number;
  locale: string;
}) {
  const c = cabinetCopy(locale).cashier;
  const router = useRouter();
  const [selected, setSelected] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);

  const method = methods.find((candidate) => candidate.id === selected) ?? methods[0];
  const canWithdraw = balance >= minimum;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});
    setSent(false);

    try {
      const response = await fetch("/api/cashier/withdrawal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method: method.id,
          amount: String(form.get("amount") ?? ""),
          destination: String(form.get("destination") ?? ""),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? { form: [body.error ?? c.requestRefused] });
        return;
      }
      setSent(true);
      router.refresh();
    } catch (reason) {
      setErrors({ form: [reason instanceof Error ? reason.message : c.unreachable] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");

  return (
    <div className="flex overflow-hidden rounded-[4px] bg-white shadow-avalon">
      <ul className="max-h-[450px] w-[260px] shrink-0 overflow-y-auto border-r border-avalon-surface-hover">
        {methods.map((candidate) => {
          const active = candidate.id === method?.id;
          return (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(candidate.id);
                  setSent(false);
                  setErrors({});
                }}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                  active ? "bg-white" : "bg-avalon-surface hover:bg-avalon-surface-hover"
                }`}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-avalon-surface-hover text-[9px] font-semibold text-avalon-text">
                  {methodInitials(candidate)}
                </span>
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

      <div className="flex min-h-[450px] grow items-center justify-center px-10 py-10">
        {!method ? (
          <p className="text-[14px] text-avalon-text">{c.noWithdrawMethods}</p>
        ) : (
          <div className="w-full max-w-[400px] text-center">
            <span className="mx-auto flex size-[60px] items-center justify-center rounded-full bg-avalon-surface text-[13px] font-semibold text-avalon-text">
              {methodInitials(method)}
            </span>
            <h2 className="mt-5 text-[20px] font-semibold text-avalon-text-strong">{method.name}</h2>

            {!canWithdraw ? (
              <>
                <p className="mt-3 text-[14px] text-avalon-text">
                  {balance <= 0
                    ? c.emptyBalance
                    : `The smallest withdrawal is ${MONEY.format(minimum)} ${currency}.`}
                </p>
                <Link
                  href={`/${locale}/counting`}
                  className="mt-7 flex h-[50px] w-full items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
                >
                  {c.deposit}
                </Link>
              </>
            ) : sent ? (
              <p className="mt-6 rounded-[2px] bg-avalon-surface px-5 py-4 text-[14px] leading-[22px] text-avalon-text">
                Your request is with us. It stays pending until someone approves it, and the amount is held out of
                your balance until then.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 text-left">
                <label className="mb-2 block text-[13px] font-medium text-avalon-text">
                  {cabinetCopy(locale).personal.amountIn(currency)}
                </label>
                <input
                  name="amount"
                  inputMode="decimal"
                  placeholder={MONEY.format(minimum)}
                  disabled={busy}
                  className="h-[50px] w-full rounded-[4px] border border-avalon-border-muted bg-avalon-surface px-4 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary"
                />
                <p className="mt-1.5 text-[12px] text-avalon-text">
                  Available: {MONEY.format(balance)} {currency}
                </p>
                <FormError>{error("amount")}</FormError>

                <label className="mb-2 mt-4 block text-[13px] font-medium text-avalon-text">
                  {method.kind === "bank" ? "PIX" : c.walletAddress}
                </label>
                <input
                  name="destination"
                  disabled={busy}
                  autoComplete="off"
                  className="h-[50px] w-full rounded-[4px] border border-avalon-border-muted bg-avalon-surface px-4 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary"
                />
                <FormError>{error("destination")}</FormError>
                <FormError>{error("form")}</FormError>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 h-[50px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
                >
                  {busy ? c.sending : c.requestWithdrawal}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
