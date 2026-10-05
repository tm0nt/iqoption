import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { DepositPanel } from "@/components/cabinet/DepositPanel";
import { RequestHistory, type RequestRow } from "@/components/cabinet/RequestHistory";
import { cashierSettings, withinLimits } from "@/lib/cabinet/cashier";
import { loadCabinet } from "@/lib/cabinet/profile";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { prisma } from "@/lib/db";
import { cardProviderInfo } from "@/lib/payments/cards/provider";
import { savedCards } from "@/lib/payments/cards/saved";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export async function generateMetadata(props: PageProps<"/[lang]/counting">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.deposit };
}
export const dynamic = "force-dynamic";

/**
 * The deposit page.
 *
 * The currency is the real wallet's, because that is where a deposit lands —
 * not the wallet being traded on, which for most people is the practice one.
 *
 * The FAQ below the form is rewritten for what is true here rather than copied:
 * the live answers describe bank timings and a support desk that this platform
 * does not have, and an FAQ that answers for someone else is worse than none.
 */
export default async function DepositPage(props: PageProps<"/[lang]/counting">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const f = cabinetCopy(lang).faq;
  const x = cabinetExtra(lang).cashier;

  const { user, account, brand, real, wallet } = await loadCabinet(lang, `/${lang}/counting`);
  const provider = cardProviderInfo();
  const [settings, requests, cards] = await Promise.all([
    cashierSettings(),
    prisma.transaction.findMany({
      where: { userId: user.id, kind: "DEPOSIT" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    provider ? savedCards(user.id, provider.id) : [],
  ]);

  const currency = real?.currency ?? wallet?.currency ?? "USD";
  const methods = settings.methods.filter((method) => method.deposit && (method.kind !== "card" || provider));
  const k = cabinetExtra(lang).cards;
  // The answers below describe the rails a person settles by hand; a card is charged on the spot, and says so.
  const faq = methods.some((method) => method.kind === "card") ? [{ q: k.faqQ, a: k.faqA }, ...f.items] : f.items;
  // A button for an amount the route would refuse is a button that only fails.
  const presets = settings.depositPresets.filter((preset) => withinLimits(preset, settings.minDeposit, settings.maxDeposit));

  const rows: RequestRow[] = requests.map((row) => ({
    id: row.id,
    when: formatDateTime(row.createdAt, lang),
    method: row.method,
    amount: formatMoney(Number(row.amount), row.currency, lang),
    extra: Number(row.bonus) > 0 ? `+ ${x.bonus} ${formatMoney(Number(row.bonus), row.currency, lang)}` : null,
    status: row.status,
  }));

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <h1 className="pt-8 text-[28px] font-normal leading-[40px] text-avalon-text sm:pt-16 sm:text-[34px] sm:leading-[52px]">
        {cabinetCopy(lang).nav.deposit}
      </h1>

      <div className="mt-5">
        <DepositPanel
          // A card rail with no processor behind it could only fail, so it is not offered.
          methods={methods}
          presets={presets}
          currency={currency}
          minimum={settings.minDeposit}
          maximum={settings.maxDeposit}
          termsUrl={settings.termsUrl}
          locale={lang}
          cards={cards}
          cardProvider={provider}
          holder={[user.firstName, user.lastName].filter(Boolean).join(" ")}
        />
      </div>

      <div className="mt-8">
        <RequestHistory title={x.yourDeposits} rows={rows} locale={lang} />
      </div>

      <section className="mt-16 pb-16">
        <h2 className="text-center text-[20px] font-bold text-avalon-text">{f.heading}</h2>

        <dl className="mx-auto mt-8 max-w-[968px]">
          {faq.map((item) => (
            <div key={item.q} className="border-b border-avalon-surface-hover py-5">
              <dt className="text-[15px] font-medium text-avalon-text-strong">{item.q}</dt>
              <dd className="mt-2 text-[14px] leading-[22px] text-avalon-text">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </CabinetShell>
  );
}
