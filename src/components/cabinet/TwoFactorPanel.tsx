"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";

type Stage =
  | { name: "idle" }
  | { name: "setup"; qr: string; secret: string }
  | { name: "codes"; codes: string[] }
  | { name: "disable" }
  | { name: "regenerate" };

const FIELD =
  "h-[44px] w-full rounded-[2px] border border-avalon-border-muted bg-white px-3 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";
const PRIMARY =
  "inline-flex h-[42px] items-center justify-center rounded-[2px] bg-avalon-primary px-5 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60";
const SECONDARY =
  "inline-flex h-[42px] items-center justify-center rounded-[2px] border border-avalon-border-muted px-5 text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary disabled:opacity-60";

/**
 * Turning two-step sign-in on and off.
 *
 * The recovery codes are the one thing here that cannot be shown twice — the
 * server keeps only their hashes — so the stage that shows them stays until
 * the person says they have saved them, and offers both a copy and a file.
 */
export function TwoFactorPanel({
  enabled,
  since,
  recoveryLeft,
  brand,
  locale,
}: {
  enabled: boolean;
  /** Already written out in the page's language. */
  since: string | null;
  recoveryLeft: number;
  brand: string;
  locale: string;
}) {
  const t = cabinetExtra(locale).twoFactor;
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/two-factor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setError(said?.error ?? t.failed);
        return null;
      }
      return said;
    } catch {
      setError(t.failed);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const said = await call({ action: "setup" });
    if (said) setStage({ name: "setup", qr: said.qr, secret: said.secret });
  }

  async function submit(event: FormEvent<HTMLFormElement>, action: "enable" | "disable" | "recovery") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const said = await call({ action, code: form.get("code"), password: form.get("password") });
    if (!said) return;
    if (said.recoveryCodes) setStage({ name: "codes", codes: said.recoveryCodes });
    else setStage({ name: "idle" });
    router.refresh();
  }

  function download(codes: string[]) {
    const blob = new Blob([`${brand}\n\n${codes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-recovery-codes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const codeInput = (
    <input
      name="code"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="123 456"
      required
      autoFocus
      disabled={busy}
      className={`${FIELD} max-w-[200px] font-mono tracking-widest`}
    />
  );

  if (stage.name === "setup") {
    return (
      <div className="mt-2 rounded-[4px] border border-avalon-surface-hover p-5">
        <p className="text-[15px] font-semibold text-avalon-text-strong">{t.setupTitle}</p>
        <ol className="mt-3 space-y-4 text-[14px] text-avalon-text">
          <li>1. {t.step1}</li>
          <li>
            2. {t.step2}
            <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stage.qr} alt="QR" width={168} height={168} className="size-[168px] rounded-[4px] border border-avalon-surface-hover bg-white p-1" />
              <div className="min-w-0">
                <p className="text-[12px] uppercase tracking-wide">{t.manualKey}</p>
                <p className="mt-1 break-all font-mono text-[14px] text-avalon-text-strong">{stage.secret}</p>
              </div>
            </div>
          </li>
          <li>
            3. {t.step3}
            <form onSubmit={(event) => void submit(event, "enable")} className="mt-3 flex flex-wrap items-center gap-3">
              {codeInput}
              <button type="submit" disabled={busy} className={PRIMARY}>
                {t.confirm}
              </button>
              <button type="button" onClick={() => setStage({ name: "idle" })} className={SECONDARY}>
                {t.cancel}
              </button>
            </form>
          </li>
        </ol>
        <FormError className="mt-3">{error}</FormError>
      </div>
    );
  }

  if (stage.name === "codes") {
    return (
      <div className="mt-2 rounded-[4px] border border-avalon-primary/40 bg-avalon-primary/5 p-5">
        <p className="text-[15px] font-semibold text-avalon-text-strong">{t.codesTitle}</p>
        <p className="mt-1 text-[13px] leading-[20px] text-avalon-text">{t.codesBody}</p>
        <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-[14px] text-avalon-text-strong sm:grid-cols-5">
          {stage.codes.map((code) => (
            <li key={code} className="rounded-[2px] bg-white px-2 py-1.5 text-center">
              {code}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(stage.codes.join("\n"));
                setCopied(true);
              } catch {
                // Selecting the list by hand still works.
              }
            }}
            className={SECONDARY}
          >
            {copied ? t.copied : t.copy}
          </button>
          <button type="button" onClick={() => download(stage.codes)} className={SECONDARY}>
            {t.download}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage({ name: "idle" });
              setCopied(false);
            }}
            className={PRIMARY}
          >
            {t.done}
          </button>
        </div>
      </div>
    );
  }

  if (stage.name === "disable" || stage.name === "regenerate") {
    const disabling = stage.name === "disable";
    return (
      <form
        onSubmit={(event) => void submit(event, disabling ? "disable" : "recovery")}
        className="mt-2 space-y-3 rounded-[4px] border border-avalon-surface-hover p-5"
      >
        <p className="text-[15px] font-semibold text-avalon-text-strong">{disabling ? t.disableTitle : t.regenerate}</p>
        <p className="text-[13px] text-avalon-text">{disabling ? t.disableBody : t.regenerateBody}</p>
        {disabling && (
          <label className="block max-w-[320px]">
            <span className="mb-1.5 block text-[12px] text-avalon-text">{t.password}</span>
            <input name="password" type="password" autoComplete="current-password" required disabled={busy} className={FIELD} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-avalon-text">{t.code}</span>
          {codeInput}
        </label>
        <FormError>{error}</FormError>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy} className={disabling ? SECONDARY : PRIMARY}>
            {disabling ? t.disable : t.regenerate}
          </button>
          <button type="button" onClick={() => setStage({ name: "idle" })} className={SECONDARY}>
            {t.cancel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-[14px]">
        <span
          className={`rounded px-2 py-0.5 text-[12px] font-medium ${
            enabled ? "bg-avalon-primary/10 text-avalon-primary" : "bg-avalon-surface-hover text-avalon-text"
          }`}
        >
          {enabled ? t.on : t.off}
        </span>
        {enabled && since && <span className="text-avalon-text">{t.onSince(since)}</span>}
        {enabled && <span className="text-avalon-text">{t.recoveryLeft(recoveryLeft)}</span>}
      </p>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-3">
        {enabled ? (
          <>
            <button type="button" onClick={() => setStage({ name: "regenerate" })} className={SECONDARY}>
              {t.regenerate}
            </button>
            <button type="button" onClick={() => setStage({ name: "disable" })} className={SECONDARY}>
              {t.disable}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void start()} disabled={busy} className={PRIMARY}>
            {t.enable}
          </button>
        )}
      </div>
    </div>
  );
}
