"use client";

import { useState, type FormEvent } from "react";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import {
  SANDBOX_CARDS,
  detectBrand,
  isExpired,
  passesLuhn,
  type CardProviderInfo,
  type SavedCard,
} from "@/lib/payments/cards/card-types";
import { encodeSandboxToken } from "@/lib/payments/cards/sandbox-token";
import { CardChip } from "./CardChip";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";

const FIELD =
  "h-[46px] w-full rounded-[2px] border border-avalon-border-muted bg-white px-3 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

/** `4242 4242 4242 4242`, and Amex's `3782 822463 10005`. */
function groupDigits(digits: string) {
  if (/^3[47]/.test(digits)) return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * A stand-in for the processor's fingerprint: the same card always gives the
 * same value, and the value does not give the card back.
 */
async function fingerprintOf(digits: string) {
  if (globalThis.crypto?.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`card:${digits}`));
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // An insecure context has no SubtleCrypto; eight seeded FNV-1a rounds fill the same 64 characters.
  let out = "";
  for (let seed = 0; seed < 8; seed += 1) {
    let hash = 0x811c9dc5 ^ seed;
    for (const char of `card:${digits}`) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193);
    out += (hash >>> 0).toString(16).padStart(8, "0");
  }
  return out;
}

/**
 * Adding a card.
 *
 * These fields are the processor's, not the platform's: what leaves them is a
 * token, never the number or the security code. With the sandbox processor
 * they also run here, in the browser — they check the number, keep only test
 * cards, and make the token the server will read — so even in test mode a
 * real card typed by mistake goes nowhere. A real processor's fields replace
 * this component and post their own token to the same route.
 */
export function CardForm({
  provider,
  locale,
  holder: defaultHolder,
  onSaved,
  onCancel,
}: {
  provider: CardProviderInfo;
  locale: string;
  holder: string;
  onSaved: (card: SavedCard) => void;
  onCancel?: () => void;
}) {
  const t = cabinetExtra(locale).cards;
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState(defaultHolder);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const digits = number.replace(/\D/g, "");
  const brand = detectBrand(digits);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const found: Record<string, string> = {};
    const [mm, yy] = expiry.split("/").map((part) => Number(part));
    const expMonth = mm;
    const expYear = 2000 + (yy ?? -2000);
    const test = SANDBOX_CARDS.find((card) => card.number === digits);

    if (!passesLuhn(digits)) found.number = t.invalidNumber;
    else if (provider.test && !test) found.number = t.notTestCard;
    if (!/^\d{2}\/\d{2}$/.test(expiry) || !(expMonth >= 1 && expMonth <= 12)) found.expiry = t.invalidExpiry;
    else if (isExpired(expMonth, expYear)) found.expiry = t.expiredCard;
    if (!(brand === "amex" ? /^\d{4}$/ : /^\d{3}$/).test(cvc)) found.cvc = t.invalidCvc;
    if (holder.trim().length < 2) found.holder = t.invalidHolder;
    setErrors(found);
    if (Object.keys(found).length > 0 || !test) return;

    setBusy(true);
    try {
      const token = encodeSandboxToken({
        brand,
        last4: digits.slice(-4),
        expMonth,
        expYear,
        holder: holder.trim(),
        fingerprint: await fingerprintOf(digits),
        outcome: test.outcome,
      });
      const response = await fetch("/api/profile/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: provider.id, token, locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok || !said?.card) {
        setErrors({ form: said?.error ?? t.failed });
        return;
      }
      setNumber("");
      setCvc("");
      onSaved({ ...said.card, expired: false });
    } catch {
      setErrors({ form: t.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[4px] border border-avalon-surface-hover p-4 sm:p-5" noValidate>
      {provider.test && (
        <div className="rounded-[2px] bg-[#fff7e6] px-3 py-2.5 text-[12px] leading-[18px] text-[#7a5a12]">
          <p className="font-semibold">{t.testMode}</p>
          <p className="mt-0.5">{t.testModeBody}</p>
          <ul className="mt-1.5 space-y-1">
            {SANDBOX_CARDS.map((card) => (
              <li key={card.number} className="flex flex-wrap items-center gap-x-2">
                <span className="font-mono">{groupDigits(card.number)}</span>
                <span>— {t.outcomes[card.outcome]}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNumber(groupDigits(card.number));
                    setErrors({});
                  }}
                  className="text-avalon-primary hover:underline"
                >
                  {t.use}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-[12px] text-avalon-text">{t.number}</span>
        <span className="relative block">
          <input
            value={number}
            onChange={(event) => setNumber(groupDigits(event.target.value.replace(/\D/g, "").slice(0, 19)))}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            disabled={busy}
            className={`${FIELD} pr-[60px] font-mono tracking-wide`}
          />
          {digits.length >= 2 && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <CardChip brand={brand} />
            </span>
          )}
        </span>
        <FormError className="mb-0 mt-1">{errors.number}</FormError>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.expiry}</span>
          <input
            value={expiry}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, "").slice(0, 4);
              setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
            }}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            disabled={busy}
            className={`${FIELD} font-mono`}
          />
          <FormError className="mb-0 mt-1">{errors.expiry}</FormError>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.cvc}</span>
          <input
            value={cvc}
            onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "amex" ? "0000" : "000"}
            disabled={busy}
            className={`${FIELD} font-mono`}
          />
          <FormError className="mb-0 mt-1">{errors.cvc}</FormError>
        </label>
      </div>
      <p className="-mt-2 text-[11px] text-avalon-text">{t.cvcHint}</p>

      <label className="block">
        <span className="mb-1.5 block text-[12px] text-avalon-text">{t.holder}</span>
        <input
          value={holder}
          onChange={(event) => setHolder(event.target.value.slice(0, 64))}
          autoComplete="cc-name"
          disabled={busy}
          className={`${FIELD} uppercase`}
        />
        <FormError className="mb-0 mt-1">{errors.holder}</FormError>
      </label>

      <p className="text-[11px] leading-[16px] text-avalon-text">{t.secure}</p>
      <FormError>{errors.form}</FormError>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-[42px] rounded-[2px] bg-avalon-primary px-5 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
        >
          {busy ? t.saving : t.save}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-[42px] rounded-[2px] border border-avalon-border-muted px-5 text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
