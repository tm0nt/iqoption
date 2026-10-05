"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { FormError } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/shared/FormError";
import { CloseIcon } from "./icons";

/**
 * Changing the address an account signs in with.
 *
 * Opened by `?act=changeemail`, like the photo dialog. The current password is
 * asked for because the address is the account: whoever can change it can
 * reset everything else, and an unattended open tab should not be enough.
 */
export function ChangeEmailModal({ closeHref, current, locale }: { closeHref: string; current: string; locale: string }) {
  const t = cabinetExtra(locale).profile;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password"), locale }),
      });
      const said = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(said?.errors ?? { form: said?.error ?? t.unreachable });
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setErrors({ form: t.unreachable });
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-[46px] w-full rounded-[2px] border border-avalon-border-muted px-3 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10 sm:py-[80px]">
      <div role="dialog" aria-modal="true" aria-label={t.changeEmailTitle} className="relative w-full max-w-[460px] bg-white px-6 py-8">
        <button
          type="button"
          onClick={() => router.push(closeHref)}
          aria-label={t.cancel}
          className="absolute right-5 top-5 text-avalon-text transition-colors hover:text-avalon-text-strong"
        >
          <CloseIcon width={14} height={14} />
        </button>

        <h2 className="text-[20px] font-semibold text-avalon-text-strong">{t.changeEmailTitle}</h2>

        {done ? (
          <>
            <p className="mt-4 text-[14px] leading-[22px] text-avalon-text">{t.emailChanged}</p>
            <button
              type="button"
              onClick={() => router.push(closeHref)}
              className="mt-6 h-[46px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
            >
              OK
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-4">
            <p className="text-[13px] leading-[20px] text-avalon-text">{t.changeEmailBody}</p>

            <label className="block">
              <span className="mb-1.5 block text-[12px] text-avalon-text">{t.newEmail}</span>
              <input name="email" type="email" required autoComplete="email" placeholder={current} disabled={busy} className={field} />
              <FormError>{errors.email}</FormError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] text-avalon-text">{t.currentPassword}</span>
              <input name="password" type="password" required autoComplete="current-password" disabled={busy} className={field} />
              <FormError>{errors.password}</FormError>
            </label>

            <FormError>{errors.form}</FormError>

            <button
              type="submit"
              disabled={busy}
              className="h-[46px] w-full rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover disabled:opacity-60"
            >
              {t.changeEmailSubmit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
