import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileFrame } from "@/components/cabinet/ProfileFrame";
import { loadProfile } from "@/lib/cabinet/profile";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import { formatLongDate } from "@/lib/cabinet/format";
import { cardProviderInfo } from "@/lib/payments/cards/provider";
import { savedCards } from "@/lib/payments/cards/saved";
import { SavedCardsPanel } from "@/components/cabinet/SavedCardsPanel";

/*
 * The tab title follows the page's language, which a static `metadata` cannot
 * do: it is evaluated once, before anyone has asked for a locale.
 */
export async function generateMetadata(props: PageProps<"/[lang]/profile/payments">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).profile.paymentMethods };
}
export const dynamic = "force-dynamic";


/** An empty panel, drawn the way the live page draws one. */
function Nothing({ icon, title, line }: { icon: React.ReactNode; title: string; line: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="text-avalon-border-muted">{icon}</span>
      <p className="pt-4 text-[14px] font-semibold text-avalon-text-strong">{title}</p>
      <p className="pt-1 text-[13px] text-avalon-text">{line}</p>
    </div>
  );
}

export default async function PaymentMethodsPage(props: PageProps<"/[lang]/profile/payments">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const x = cabinetExtra(lang).profile;
  const { user, account, brand } = await loadProfile(lang, "payments");

  /*
   * "Recently used" is not a stored list: it is what the cashier has actually
   * moved. Grouping the transactions by method gives the same answer without a
   * second table that could disagree with the first.
   */
  const provider = cardProviderInfo();
  const cards = provider ? await savedCards(user.id, provider.id) : [];
  const recent = await prisma.transaction.groupBy({
    by: ["method", "currency"],
    where: { userId: user.id },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 10,
  });

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <ProfileFrame locale={lang} createdAt={user.createdAt} id={user.id} title={copy.profile.paymentMethods}>
        <div className="flex flex-wrap gap-3 pt-3">
          <Link
            href={`/${lang}/counting`}
            className="flex h-[42px] items-center rounded-[2px] bg-avalon-primary px-5 text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
          >
            {x.deposit}
          </Link>
          <Link
            href={`/${lang}/withdrawal`}
            className="flex h-[42px] items-center rounded-[2px] border border-avalon-border-muted px-5 text-[14px] font-medium text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
          >
            {x.withdraw}
          </Link>
        </div>

        <section className="pt-7">
          <h2 className="border-b border-avalon-surface-hover pb-3 text-[16px] font-semibold text-avalon-text-strong">
            {copy.payments.linkedCards}
          </h2>

          {provider ? (
            <SavedCardsPanel
              cards={cards}
              provider={provider}
              holder={[user.firstName, user.lastName].filter(Boolean).join(" ")}
              locale={lang}
            />
          ) : (
          /* Without a processor nothing can be stored, and nothing should pretend to be. */
          <Nothing
            icon={
              <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="1" y="4" width="30" height="22" rx="3" />
                <path d="M1 11h30" />
                <circle cx="32" cy="24" r="6.5" />
                <path d="M30 22l4 4M34 22l-4 4" />
              </svg>
            }
            title={copy.payments.noCards}
            line={copy.payments.noCardsBody}
          />
          )}
        </section>

        <section className="pt-6">
          <h2 className="pb-3 text-[16px] font-semibold text-avalon-text-strong">{copy.payments.recent}</h2>

          {recent.length === 0 ? (
            <div className="border border-avalon-surface-hover">
              <Nothing
                icon={
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <circle cx="16" cy="16" r="12" />
                    <path d="M25 25l11 11M12 12l8 8M20 12l-8 8" />
                  </svg>
                }
                title={copy.payments.noData}
                line={copy.payments.noDataBody}
              />
            </div>
          ) : (
            <ul className="border border-avalon-surface-hover">
              {recent.map((row) => (
                <li
                  key={`${row.method}-${row.currency}`}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-avalon-surface-hover px-4 py-4 last:border-b-0 sm:px-5"
                >
                  <span className="text-[14px] text-avalon-text-strong">{row.method}</span>
                  <span className="text-[13px] text-avalon-text">
                    {copy.payments.payments(row._count._all)} · {row.currency}
                  </span>
                  <span className="text-[13px] text-avalon-text">
                    {row._max.createdAt ? formatLongDate(row._max.createdAt, lang) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!provider && (
          <p className="max-w-[640px] pt-6 text-[13px] leading-5 text-avalon-text">
            {copy.payments.byHand}
          </p>
        )}
      </ProfileFrame>
    </CabinetShell>
  );
}
