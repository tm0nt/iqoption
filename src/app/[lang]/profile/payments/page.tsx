import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { loadProfile, longDate } from "@/lib/cabinet/profile";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Payment Methods" };
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

  const { user, account } = await loadProfile(lang, "payments");

  /*
   * "Recently used" is not a stored list: it is what the cashier has actually
   * moved. Grouping the transactions by method gives the same answer without a
   * second table that could disagree with the first.
   */
  const recent = await prisma.transaction.groupBy({
    by: ["method", "currency"],
    where: { userId: user.id },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 10,
  });

  return (
    <CabinetShell locale={lang} account={account}>
      <p className="pt-7 text-right text-[12px] leading-5 text-avalon-text">
        Date registered: {longDate(user.createdAt)}
        <br />
        Profile ID: {user.id}
      </p>

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />

        <div className="min-w-0 grow">
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">Payment Methods</h1>

          <section className="pt-7">
            <h2 className="border-b border-avalon-surface-hover pb-3 text-[16px] font-semibold text-avalon-text-strong">
              Linked Bank Cards
            </h2>

            {/* Always empty: no card network is connected, so nothing can be
                stored and nothing should pretend to be. */}
            <Nothing
              icon={
                <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <rect x="1" y="4" width="30" height="22" rx="3" />
                  <path d="M1 11h30" />
                  <circle cx="32" cy="24" r="6.5" />
                  <path d="M30 22l4 4M34 22l-4 4" />
                </svg>
              }
              title="No cards"
              line="You don't have any linked cards yet"
            />
          </section>

          <section className="pt-6">
            <h2 className="pb-3 text-[16px] font-semibold text-avalon-text-strong">Recently Used Methods</h2>

            {recent.length === 0 ? (
              <div className="border border-avalon-surface-hover">
                <Nothing
                  icon={
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <circle cx="16" cy="16" r="12" />
                      <path d="M25 25l11 11M12 12l8 8M20 12l-8 8" />
                    </svg>
                  }
                  title="No data found"
                  line="You haven't made any payments yet."
                />
              </div>
            ) : (
              <ul className="border border-avalon-surface-hover">
                {recent.map((row) => (
                  <li
                    key={`${row.method}-${row.currency}`}
                    className="flex items-center justify-between gap-6 border-b border-avalon-surface-hover px-5 py-4 last:border-b-0"
                  >
                    <span className="text-[14px] text-avalon-text-strong">{row.method}</span>
                    <span className="text-[13px] text-avalon-text">
                      {row._count._all} payment{row._count._all === 1 ? "" : "s"} · {row.currency}
                    </span>
                    <span className="text-[13px] text-avalon-text">
                      {row._max.createdAt ? longDate(row._max.createdAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="max-w-[640px] pt-6 text-[13px] leading-5 text-avalon-text">
            Deposits and withdrawals are reviewed by hand. No card network is connected, so nothing
            is charged and no card details are held.
          </p>
        </div>
      </div>
    </CabinetShell>
  );
}
