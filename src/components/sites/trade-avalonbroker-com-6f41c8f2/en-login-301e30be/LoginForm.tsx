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
 * One message for every failure, deliberately: "email or password is wrong"
 * rather than which of the two. Saying which turns the form into a way of
 * discovering who has an account here.
 */
export function LoginForm({ copy, locale = "en" }: { copy: AvalonLoginCopy; locale?: AvalonLocale }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setError(null);
    setBusy(true);

    try {
      const result = await signIn("credentials", {
        email: String(form.get("identifier") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
      });

      if (!result || result.error) {
        setError(copy.invalidCredentials);
        return;
      }

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
    } catch {
      setError(copy.invalidCredentials);
    } finally {
      setBusy(false);
    }
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
