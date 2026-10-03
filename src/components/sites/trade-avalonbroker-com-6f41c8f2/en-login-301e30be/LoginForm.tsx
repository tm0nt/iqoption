"use client";

import type { FormEvent } from "react";
import { AuthField } from "../shared/AuthField";
import { AuthSubmitButton } from "../shared/AuthSubmitButton";
import type { AvalonLoginCopy } from "@/types/avalon-login";

/**
 * Visual clone of the Avalon login form. Authentication is out of scope, so the
 * submit is inert — it only prevents the browser's default navigation.
 */
export function LoginForm({ copy }: { copy: AvalonLoginCopy }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AuthField
        testId="login-email-input"
        name="identifier"
        type="text"
        placeholder={copy.emailPlaceholder}
        autoComplete="new-password"
        autoFocus
      />
      <AuthField
        testId="login-password-input"
        name="password"
        type="password"
        placeholder={copy.passwordPlaceholder}
        autoComplete="new-password"
      />
      <AuthSubmitButton
        data-test-id="login-submit-button"
        className="mb-5"
      >
        {copy.submit}
      </AuthSubmitButton>
    </form>
  );
}
