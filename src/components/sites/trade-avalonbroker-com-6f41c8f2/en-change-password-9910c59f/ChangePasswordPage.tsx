import { AuthShell } from "../shared/AuthShell";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { getDictionary } from "@/i18n/avalon";
import type { AvalonLocale } from "@/types/avalon-login";

/** Pixel clone of https://trade.avalonbroker.com/<locale>/change-password. */
export function ChangePasswordPage({ locale }: { locale: AvalonLocale }) {
  const dict = getDictionary(locale);
  return (
    <AuthShell
      locale={locale}
      page="change-password"
      dict={dict}
      headerAction="signUp"
    >
      <ChangePasswordCard locale={locale} dict={dict} />
    </AuthShell>
  );
}
