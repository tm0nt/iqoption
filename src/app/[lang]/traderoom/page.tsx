import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TraderoomPage } from "@/components/sites/trade-avalonbroker-com-6f41c8f2/traderoom-e34e80f1/TraderoomPage";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Avalon" };

export default async function Page(props: PageProps<"/[lang]/traderoom">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return <TraderoomPage locale={lang} />;
}
