import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Clock, Handshake, Scale, UserPlus, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { engineConfig, setting } from "@/lib/engine/settings";
import { formatMoney } from "@/lib/cabinet/format";
import { ReloadFeedButton } from "@/components/admin/ReloadFeedButton";
import { FeedStatus } from "@/components/admin/FeedStatus";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";

export async function generateMetadata(props: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.overview.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

const n = (value: unknown) => Number(value ?? 0) || 0;

/**
 * The first screen: is money moving, is anything waiting, is the feed up.
 *
 * Money first, because that is what an operator opens the admin to check;
 * the platform's plumbing last, because it is either fine or the feed card
 * says so in red.
 */
export default async function AdminOverview(props: PageProps<"/[lang]/admin">) {
  const { lang } = await props.params;
  const t = adminCopy(lang).overview;
  const m = adminMoneyCopy(lang).overview;
  const base = `/${lang}/admin`;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() - 6);
  const month = new Date(today);
  month.setDate(month.getDate() - 29);

  const approvedSince = (kind: "DEPOSIT" | "WITHDRAWAL", since: Date) =>
    prisma.transaction.aggregate({ where: { kind, status: "APPROVED", settledAt: { gte: since } }, _sum: { amount: true }, _count: { _all: true } });

  const [
    instruments,
    live,
    users,
    openDeals,
    settledDeals,
    config,
    demo,
    depositsToday,
    deposits30,
    withdrawals30,
    waitingCashier,
    waitingPayouts,
    newToday,
    new7,
    kycPending,
    activeAffiliates,
    pendingAffiliates,
    referred,
    result30,
  ] = await Promise.all([
    prisma.asset.count({ where: { enabled: true } }),
    prisma.asset.count({ where: { enabled: true, source: { not: "SIMULATED" } } }),
    prisma.user.count(),
    prisma.position.count({ where: { closedAt: 0 } }),
    prisma.position.count({ where: { closedAt: { gt: 0 } } }),
    engineConfig(),
    setting("trading.demoBalance"),
    approvedSince("DEPOSIT", today),
    approvedSince("DEPOSIT", month),
    approvedSince("WITHDRAWAL", month),
    prisma.transaction.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.affiliatePayout.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.affiliate.count({ where: { status: "ACTIVE" } }),
    prisma.affiliate.count({ where: { status: "PENDING" } }),
    prisma.referral.count(),
    /*
     * The platform's side of real trades: minus what traders made. Real
     * wallets only — practice and tournament money is not the platform's.
     */
    prisma.$queryRaw<{ result: unknown }[]>`
      SELECT COALESCE(SUM(-p.close_profit), 0) AS result
        FROM positions p JOIN balances b ON b.id = p.balance_id AND b.type = 1
       WHERE p.closed_at >= ${Math.floor(month.getTime() / 1000)}`,
  ]);

  const currency = demo.currency;
  const money = (value: unknown) => formatMoney(n(value), currency, lang);
  const net30 = n(deposits30._sum.amount) - n(withdrawals30._sum.amount);
  const result = n(result30[0]?.result);

  return (
    <div className="space-y-8">
      <PageHeader title={t.heading} lead={t.lead} />

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#6f7076]">{m.money}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={m.depositsToday}
            value={money(depositsToday._sum.amount)}
            hint={m.requests(depositsToday._count._all)}
            icon={<ArrowDownToLine size={16} />}
            href={`${base}/cashier?status=APPROVED&kind=DEPOSIT`}
          />
          <StatCard label={m.deposits30} value={money(deposits30._sum.amount)} hint={m.requests(deposits30._count._all)} icon={<Wallet size={16} />} />
          <StatCard
            label={m.withdrawals30}
            value={money(withdrawals30._sum.amount)}
            hint={m.requests(withdrawals30._count._all)}
            icon={<ArrowUpFromLine size={16} />}
          />
          <StatCard label={m.net30} value={money(net30)} tone={net30 > 0 ? "up" : net30 < 0 ? "down" : undefined} icon={<Scale size={16} />} />
          <StatCard
            label={m.waitingCashier}
            value={waitingCashier._count._all}
            hint={money(waitingCashier._sum.amount)}
            icon={<Clock size={16} />}
            href={`${base}/cashier`}
          />
          <StatCard
            label={m.waitingPayouts}
            value={waitingPayouts._count._all}
            hint={money(waitingPayouts._sum.amount)}
            icon={<Handshake size={16} />}
            href={`${base}/affiliates/payouts`}
          />
          <StatCard
            label={m.platformResult30}
            value={money(result)}
            hint={m.platformResultHint}
            tone={result > 0 ? "up" : result < 0 ? "down" : undefined}
          />
          <StatCard label={t.deals} value={`${openDeals} / ${settledDeals}`} hint={t.dealsNote} href={`${base}/positions`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#6f7076]">{m.people}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.accounts} value={users} hint={m.awaitingReview(kycPending)} icon={<Users size={16} />} href={`${base}/users`} />
          <StatCard label={m.newToday} value={newToday} hint={`${m.new7}: ${new7}`} icon={<UserPlus size={16} />} />
          <StatCard
            label={m.activeAffiliates}
            value={activeAffiliates}
            hint={m.awaitingReview(pendingAffiliates)}
            icon={<Handshake size={16} />}
            href={`${base}/affiliates`}
          />
          <StatCard label={m.referred} value={referred} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#6f7076]">{m.platform}</h2>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title={t.marketFeed}>
            <FeedStatus locale={lang} />
            <p className="mt-4 text-[13px] leading-relaxed text-[#a0a1a6]">{t.feedNote}</p>
            <div className="mt-4">
              <ReloadFeedButton locale={lang} />
            </div>
          </Card>

          <Card title={t.engine} description={t.instrumentsNote(live, instruments - live)}>
            <dl className="grid gap-px overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.06] text-[13px] sm:grid-cols-2">
              {[
                [t.instrumentsEnabled, String(instruments)],
                [t.feed, config.feed.wsUrl],
                [t.engineBuild, `${config.resource.host} @ ${config.resource.version}`],
                [t.brand, config.brand.name],
                [t.countryReported, `${config.brand.countryFlag} (${config.brand.countryId})`],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#15161a] px-4 py-3 last:odd:sm:col-span-2">
                  <dt className="text-[#a0a1a6]">{label}</dt>
                  <dd className="mt-0.5 break-all font-mono text-[12px]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-[#a0a1a6]">
              {t.theseLiveIn}{" "}
              <Link href={`${base}/settings`} className="text-[var(--accent)] hover:underline">
                {t.settingsLink}
              </Link>
              .
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
