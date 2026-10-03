import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/avalon";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LocaleLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return props.children;
}
