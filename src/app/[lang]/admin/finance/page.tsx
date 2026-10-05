import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { setting } from "@/lib/engine/settings";
import { cardProviderInfo } from "@/lib/payments/cards/provider";
import { FinanceEditor } from "@/components/admin/FinanceEditor";
import { Badge, Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/finance">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).finance.heading} · ${adminCopy(lang).shell.title}` };
}

export default async function AdminFinancePage(props: PageProps<"/[lang]/admin/finance">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const t = adminMoneyCopy(lang).finance;
  // Wallets open in the demo balance's currency; the limits are in the same one.
  const [settings, demo] = await Promise.all([cashierSettings(), setting("trading.demoBalance")]);
  const provider = cardProviderInfo();

  return (
    <div className="space-y-6">
      <PageHeader title={t.heading} lead={t.lead} />
      {/*
        The processor is read from the environment, where its credentials are,
        so this says which one is in use rather than offering to change it.
      */}
      <Card
        title={
          <span className="flex items-center gap-2">
            {t.cardProvider}
            <Badge tone={provider ? (provider.test ? "warning" : "success") : "neutral"}>{provider ? provider.id : "—"}</Badge>
          </span>
        }
        description={provider ? (provider.test ? t.cardProviderSandbox : null) : t.cardProviderNone}
      />
      <FinanceEditor settings={settings} currency={demo.currency} locale={lang} />
    </div>
  );
}
