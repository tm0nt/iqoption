import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChangePasswordPage } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/en-change-password-9910c59f/ChangePasswordPage";
import { getDictionary, isLocale } from "@/i18n/avalon";

export async function generateMetadata(
  props: PageProps<"/[lang]/change-password">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).changePassword.title };
}

export default async function Page(props: PageProps<"/[lang]/change-password">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return <ChangePasswordPage locale={lang} />;
}
