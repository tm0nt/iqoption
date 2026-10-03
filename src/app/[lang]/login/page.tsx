import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginPage } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/LoginPage";
import { getDictionary, isLocale } from "@/i18n/avalon";

export async function generateMetadata(
  props: PageProps<"/[lang]/login">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).login.title };
}

export default async function Page(props: PageProps<"/[lang]/login">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return <LoginPage locale={lang} />;
}
