import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegisterPage } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/RegisterPage";
import { getDictionary, isLocale } from "@/i18n/avalon";

export async function generateMetadata(
  props: PageProps<"/[lang]/register">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).register.title };
}

export default async function Page(props: PageProps<"/[lang]/register">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return <RegisterPage locale={lang} />;
}
