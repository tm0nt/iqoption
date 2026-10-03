import { AuthShell } from "../shared/AuthShell";
import { RegisterCard } from "./RegisterCard";
import { getDictionary } from "@/i18n/avalon";
import type { AvalonLocale } from "@/types/avalon-login";

/** Pixel clone of https://trade.avalonbroker.com/<locale>/register. */
export function RegisterPage({ locale }: { locale: AvalonLocale }) {
  const dict = getDictionary(locale);
  return (
    <AuthShell locale={locale} page="register" dict={dict} headerAction="logIn">
      <RegisterCard locale={locale} dict={dict} />
    </AuthShell>
  );
}
