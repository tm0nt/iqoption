"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { type CashierMethod, DEFAULT_DAYS, withdrawalFee, CASHIER_DEFAULTS } from "@/lib/cabinet/cashier-types";
import { MethodMark } from "@/components/cabinet/MethodMark";
import { parseAmount } from "@/lib/cabinet/money";
import { formatMoney } from "@/lib/cabinet/format";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";

/**
 * The rail list and the panel beside it.
 *
 * One component rather than two, because choosing a rail is the only thing the
 * list does and the panel is the whole of what it chooses — splitting them
 * would mean lifting the selection into a parent that has nothing else to do.
 *
 * `balance` is the real wallet's, always. The page used to pass whichever
 * wallet was active in the traderoom, so someone trading on practice money was
 * shown ten thousand available, filled in the form, and was refused by the
 * server — which, correctly, only ever pays out of the real one.
 */
export function WithdrawalPanel({
  methods,
  balance,
  currency,
  minimum,
  maximum,
  freeLeft,
  feePercent,
  feeFixed,
  kycBlocked,
  locale,
}: {
  methods: CashierMethod[];
  balance: number;
  currency: string;
  minimum: number;
  maximum: number;
  freeLeft: number;
  feePercent: number;
  feeFixed: number;
  /** The operator requires verification and this account does not have it. */
  kycBlocked: boolean;
  locale: string;
}) {
  const c = cabinetCopy(locale).cashier;
  const x = cabinetExtra(locale).cashier;
  const router = useRouter();
  const [selected, setSelected] = useState(methods[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);

  const method = methods.find((candidate) => candidate.id === selected) ?? methods[0];
  const canWithdraw = balance >= minimum && balance > 0;
  const money = (n: number) => formatMoney(n, currency, locale);

  // The same function the server charges with, so the preview is the charge.
  const typed = parseAmount(amount);
  const fee = typed ? withdrawalFee({ ...CASHIER_DEFAULTS, withdrawalFeePercent: feePercent, withdrawalFeeFixed: feeFixed }, typed, freeLeft) : 0;
  const charges = feePercent > 0 || feeFixed > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !method) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});

    try {
      const response = await fetch("/api/cashier/withdrawal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: method.id, amount, destination: String(form.get("destination") ?? ""), locale }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(body?.errors ?? { form: [body?.error ?? c.requestRefused] });
        return;
      }
      setSent(true);
      setAmount("");
      router.refresh();
    } catch (reason) {
      setErrors({ form: [reason instanceof Error ? reason.message : c.unreachable] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");
  const field =
    "h-[50px] w-full rounded-[4px] border border-avalon-border-muted bg-avalon-surface px-4 text-[14px] font-medium text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

  let panel: React.ReactNode;
  if (!method) {
    panel = <p className="text-[14px] text-avalon-text">{c.noWithdrawMethods}</p>;
  } else if (kycBlocked) {
    panel = (
      <>
        <p className="mt-3 text-[14px] text-avalon-text">{x.kycRequired}</p>
        <Link
          href={`/${locale}/verification`}
          className="mt-7 flex h-[50px] w-full items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
        >
          {x.verifyNow}
        </Link>
      </>
    );
  } else if (!canWithdraw) {
    panel = (
      <>
        <p className="mt-3 text-[14px] text-avalon-text">
          {balance <= 0 ? c.emptyBalance : x.belowMinWithdrawal(money(minimum))}
        </p>
        <Link
          href={`/${locale}/counting`}
          className="mt-7 flex h-[50px] w-full items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
        >
          {c.deposit}
        </Link>
      </>
    );
  } else if (sent) {
    panel = (
      <>
        <p className="mt-6 rounded-[2px] bg-avalon-surface px-5 py-4 text-[14px] leading-[22px] text-avalon-text">{x.requestSent}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 h-[46px] w-full rounded-[2px] border border-avalon-border-muted text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
        >
          {x.another}
        </button>
      </>
    );
  } else {
    panel = (
      <form onSubmit={handleSubmit} className="mt-6 text-left">
        <label className="mb-2 block text-[13px] font-medium text-avalon-text">{cabinetCopy(locale).personal.amountIn(currency)}</label>
        <input
          name="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder={money(minimum)}
          disabled={busy}
          className={field}
        />
        <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-[12px] text-avalon-text">
          <span>
            {x.available}: {money(balance)}
          </span>
          <span>{x.limits(money(minimum), maximum > 0 ? money(maximum) : null)}</span>
        </p>
        <FormError>{error("amount")}</FormError>

        {charges && typed !== null && (
          <dl className="mt-3 space-y-1 rounded-[2px] bg-avalon-surface px-4 py-3 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-avalon-text">{x.fee}</dt>
              <dd className="text-avalon-text-strong">{fee > 0 ? money(fee) : x.free}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt className="text-avalon-text">{x.youReceive}</dt>
              <dd className="text-avalon-text-strong">{money(Math.max(0, typed - fee))}</dd>
            </div>
          </dl>
        )}

        <label className="mb-2 mt-4 block text-[13px] font-medium text-avalon-text">
          {method.kind === "bank" ? x.pixKey : c.walletAddress}
        </label>
        <input name="destination" disabled={busy} autoComplete="off" className={field} />
        <p className="mt-1.5 text-[12px] text-avalon-text">{method.kind === "bank" ? x.pixHint : x.walletHint}</p>
        <FormError>{error("destination")}</FormError>
        <FormError>{error("form")}</FormError>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 h-[50px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
        >
          {busy ? c.sending : c.requestWithdrawal}
        </button>
        <p className="mt-3 text-center text-[12px] text-avalon-text">{x.realOnly}</p>
      </form>
    );
  }

  return (
    <div className="overflow-hidden rounded-[4px] bg-white shadow-avalon md:flex">
      <ul className="flex gap-2 overflow-x-auto border-b border-avalon-surface-hover p-3 md:block md:max-h-[520px] md:w-[260px] md:shrink-0 md:gap-0 md:overflow-y-auto md:border-b-0 md:border-r md:p-0">
        {methods.map((candidate) => {
          const active = candidate.id === method?.id;
          return (
            <li key={candidate.id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelected(candidate.id);
                  setSent(false);
                  setErrors({});
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-[2px] px-3 py-2.5 text-left transition-colors md:rounded-none md:px-5 md:py-3 ${
                  active ? "bg-white ring-1 ring-avalon-primary md:ring-0" : "bg-avalon-surface hover:bg-avalon-surface-hover"
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

      <div className="flex grow items-center justify-center px-5 py-8 sm:px-10 sm:py-10 md:min-h-[450px]">
        <div className="w-full max-w-[400px] text-center">
          {method && (
            <>
              <span className="mx-auto block">
                <MethodMark method={method} size={60} />
              </span>
              <h2 className="mt-5 text-[20px] font-semibold text-avalon-text-strong">{method.name}</h2>
            </>
          )}
          {panel}
        </div>
      </div>
    </div>
  );
}
