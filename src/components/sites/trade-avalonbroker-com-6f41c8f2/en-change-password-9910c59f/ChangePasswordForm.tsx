"use client";

import type { FormEvent } from "react";
import { AuthField } from "../shared/AuthField";
import { AuthSubmitButton } from "../shared/AuthSubmitButton";
import type { AvalonChangePasswordCopy } from "@/types/avalon-login";

/** Recovery form. Submission is out of scope, so the handler only blocks navigation. */
export function ChangePasswordForm({
  copy,
}: {
  copy: AvalonChangePasswordCopy;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative block w-full">
      <AuthField
        name="identifier"
        type="text"
        placeholder={copy.emailPlaceholder}
        autoComplete="new-password"
        autoFocus
        surface="muted"
        wrapperClassName="mb-4"
      />
      <AuthSubmitButton data-test-id="login-submit-button" className="mb-4">
        {copy.submit}
      </AuthSubmitButton>
    </form>
  );
}
