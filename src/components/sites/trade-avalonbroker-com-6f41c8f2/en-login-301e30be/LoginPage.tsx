import { AuthShell } from "../shared/AuthShell";
import { LoginCard } from "./LoginCard";
import { getDictionary } from "@/i18n/avalon";
import type { AvalonLocale } from "@/types/avalon-login";

/** Pixel clone of https://trade.avalonbroker.com/<locale>/login. */
export function LoginPage({ locale }: { locale: AvalonLocale }) {
  const dict = getDictionary(locale);
  return (
    <AuthShell locale={locale} page="login" dict={dict} headerAction="signUp">
      <LoginCard locale={locale} dict={dict} />
    </AuthShell>
  );
}
