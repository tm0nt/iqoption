"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import type { CashierMethod } from "@/lib/cabinet/cashier-types";
import { formatMoney } from "@/lib/cabinet/format";
import { affiliateCopy } from "@/i18n/affiliate";

const BUTTON =
  "inline-flex h-[44px] items-center justify-center rounded-[2px] bg-avalon-primary px-6 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
const FIELD =
  "h-[44px] w-full rounded-[2px] border border-avalon-border-muted bg-white px-3 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

/** Joining the programme: one button, and the page redraws in whatever state it lands in. */
export function JoinButton({ locale }: { locale: string }) {
  const t = affiliateCopy(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/affiliate/join", { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setError(t.joinFailed);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button type="button" onClick={join} disabled={busy} className={BUTTON}>
        {busy ? t.joining : t.join}
      </button>
      {error && <p className="mt-3 text-[13px] text-avalon-danger">{error}</p>}
    </div>
  );
}

/** A read-only value with a button that puts it on the clipboard. */
export function CopyField({ value, locale, mono = false }: { value: string; locale: string; mono?: boolean }) {
  const t = affiliateCopy(locale);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard refused (an insecure origin, a denied permission): the
      // field is selectable, which is the fallback.
    }
  }

  return (
    <div className="flex">
      <input
        readOnly
        value={value}
        onFocus={(event) => event.currentTarget.select()}
        className={`${FIELD} min-w-0 rounded-r-none border-r-0 bg-avalon-surface ${mono ? "font-mono text-[13px]" : ""}`}
      />
      <button
        type="button"
        onClick={copy}
        className="h-[44px] shrink-0 rounded-r-[2px] bg-avalon-primary px-4 text-[13px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
      >
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

/**
 * Building a tracking link with a sub-id.
 *
 * The link is a page of this site with `?ref=` on it, so there is nothing to
 * register in advance: any sub-id typed here works the moment it is shared.
 */
export function LinkBuilder({ origin, code, locale }: { origin: string; code: string; locale: string }) {
  const t = affiliateCopy(locale);
  const [landing, setLanding] = useState<"register" | "login">("register");
  const [sub, setSub] = useState("");

  const params = new URLSearchParams({ ref: code });
  const cleanSub = sub.trim().slice(0, 64);
  if (cleanSub) params.set("sub", cleanSub);
  const link = `${origin}/${locale}/${landing}?${params.toString()}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.landing}</span>
          <select value={landing} onChange={(event) => setLanding(event.target.value === "login" ? "login" : "register")} className={FIELD}>
            <option value="register">{t.landings.register}</option>
            <option value="login">{t.landings.login}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.sub}</span>
          <input value={sub} onChange={(event) => setSub(event.target.value)} placeholder="instagram-bio" maxLength={64} className={FIELD} />
        </label>
      </div>
      <p className="text-[12px] leading-[18px] text-avalon-text">
        {t.subHint} {t.utmHint}
      </p>
      <CopyField value={link} locale={locale} mono />
    </div>
  );
}

/** Asking to be paid out of the affiliate balance. */
export function PayoutForm({
  methods,
  available,
  minimum,
  currency,
  locale,
}: {
  methods: CashierMethod[];
  available: number;
  minimum: number;
  currency: string;
  locale: string;
}) {
  const t = affiliateCopy(locale);
  const router = useRouter();
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);

  const method = methods.find((candidate) => candidate.id === methodId) ?? methods[0];
  const money = (n: number) => formatMoney(n, currency, locale);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !method) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});
    setSent(false);
    try {
      const response = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: method.id, amount: form.get("amount"), destination: form.get("destination"), locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(said?.errors ?? { form: [said?.error ?? t.unreachable] });
        return;
      }
      setSent(true);
      (event.target as HTMLFormElement).reset();
      router.refresh();
    } catch {
      setErrors({ form: [t.unreachable] });
    } finally {
      setBusy(false);
    }
  }

  const error = (name: string) => errors[name]?.join(" ");

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.method}</span>
          <select value={method?.id ?? ""} onChange={(event) => setMethodId(event.target.value)} className={FIELD}>
            {methods.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">
            {t.amount} ({currency})
          </span>
          <input name="amount" inputMode="decimal" placeholder={money(minimum)} disabled={busy} className={FIELD} />
        </label>
      </div>
      <p className="text-[12px] text-avalon-text">
        {t.available}: <span className="font-medium text-avalon-text-strong">{money(Math.max(0, available))}</span> ·{" "}
        {t.minPayoutTerm(money(minimum))}
      </p>
      <FormError>{error("amount")}</FormError>

      <label className="block">
        <span className="mb-1.5 block text-[12px] text-avalon-text">{t.destination}</span>
        <input name="destination" autoComplete="off" disabled={busy} className={FIELD} />
      </label>
      <FormError>{error("destination")}</FormError>
      <FormError>{error("form")}</FormError>

      <button type="submit" disabled={busy || available < minimum} className={BUTTON}>
        {busy ? t.sending : t.request}
      </button>
      {sent && <p className="text-[13px] text-avalon-primary">{t.requested}</p>}
    </form>
  );
}

/** The affiliate's postback address. */
export function PostbackForm({ current, locale }: { current: string; locale: string }) {
  const t = affiliateCopy(locale);
  const router = useRouter();
  const [url, setUrl] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/affiliate/postback", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setError(said?.error ?? t.unreachable);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t.unreachable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[12px] text-avalon-text">{t.postbackUrl}</span>
        <input
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setSaved(false);
          }}
          placeholder="https://tracker.example/postback?click={sub_id}&event={event}&amount={amount}"
          className={`${FIELD} font-mono text-[13px]`}
        />
      </label>
      {error && <p className="text-[13px] text-avalon-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={BUTTON}>
          {t.save}
        </button>
        {saved && <span className="text-[13px] text-avalon-primary">{t.saved}</span>}
      </div>
    </form>
  );
}
