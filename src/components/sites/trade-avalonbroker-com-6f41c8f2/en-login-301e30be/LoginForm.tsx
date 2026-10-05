"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthField } from "../shared/AuthField";
import { AuthSubmitButton } from "../shared/AuthSubmitButton";
import { FormError } from "../shared/FormError";
import type { AvalonLoginCopy, AvalonLocale } from "@/types/avalon-login";

/**
 * The Avalon login form, signing in for real.
 *
 * One message for every failure of the first step, deliberately: "email or
 * password is wrong" rather than which of the two. Saying which turns the
 * form into a way of discovering who has an account here.
 *
 * An account with two-step sign-in answers the right password with
 * `2fa_required`, and the form asks for the code without asking for the
 * password again: both are sent together on the second try, because the
 * server keeps no half-signed-in state between the two — there is nothing to
 * steal in the gap.
 */
export function LoginForm({ copy, locale = "en" }: { copy: AvalonLoginCopy; locale?: AvalonLocale }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);

  function finish() {
    /*
     * Where the middleware was taking them before it turned them away, and
     * only when it is a path on this site — an open redirect is a phishing
     * primitive, and `next` arrives in the URL.
     *
     * Read from `location` rather than through `useSearchParams`, which opts
     * the whole page out of static rendering; this page is prerendered per
     * locale and the value is only needed once the form is submitted.
     */
    const next = new URLSearchParams(window.location.search).get("next");
    const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/traderoom`;
    router.push(destination);
    router.refresh();
  }

  async function attempt(email: string, password: string, code?: string) {
    setError(null);
    setBusy(true);
    try {
      const result = await signIn("credentials", { email, password, ...(code ? { code } : {}), redirect: false });

      if (result && !result.error) {
        finish();
        return;
      }
      if (result?.code === "2fa_required") {
        setPending({ email, password });
        return;
      }
      if (result?.code === "2fa_invalid") {
        setError(copy.twoFactorInvalid);
        return;
      }
      if (result?.code === "2fa_locked") {
        setError(copy.twoFactorLocked);
        return;
      }
      setPending(null);
      setError(copy.invalidCredentials);
    } catch {
      setError(copy.invalidCredentials);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    await attempt(String(form.get("identifier") ?? ""), String(form.get("password") ?? ""));
  }

  async function handleCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !pending) return;
    const form = new FormData(event.currentTarget);
    await attempt(pending.email, pending.password, String(form.get("code") ?? ""));
  }

  if (pending) {
    return (
      <form onSubmit={handleCode} noValidate>
        <p className="mb-2 font-avalon text-[16px] font-semibold text-avalon-text-strong">{copy.twoFactorHeading}</p>
        <p className="mb-5 font-avalon text-[14px] leading-[20px] text-avalon-text">{copy.twoFactorBody}</p>
        <AuthField
          testId="login-2fa-input"
          name="code"
          type="text"
          placeholder={copy.twoFactorPlaceholder}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          disabled={busy}
        />
        <p className="-mt-2 mb-4 font-avalon text-[12px] leading-[17px] text-avalon-text">{copy.twoFactorRecoveryHint}</p>
        <FormError>{error}</FormError>
        <AuthSubmitButton data-test-id="login-2fa-submit" className="mb-4" disabled={busy}>
          {busy ? copy.submitting : copy.twoFactorVerify}
        </AuthSubmitButton>
        <button
          type="button"
          onClick={() => {
            setPending(null);
            setError(null);
          }}
          className="mb-5 w-full font-avalon text-[14px] text-avalon-primary hover:underline"
        >
          {copy.twoFactorBack}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthField
        testId="login-email-input"
        name="identifier"
        type="text"
        placeholder={copy.emailPlaceholder}
        autoComplete="username"
        autoFocus
        disabled={busy}
      />
      <AuthField
        testId="login-password-input"
        name="password"
        type="password"
        placeholder={copy.passwordPlaceholder}
        autoComplete="current-password"
        disabled={busy}
      />
      <FormError>{error}</FormError>
      <AuthSubmitButton data-test-id="login-submit-button" className="mb-5" disabled={busy}>
        {busy ? copy.submitting : copy.submit}
      </AuthSubmitButton>
    </form>
  );
}
