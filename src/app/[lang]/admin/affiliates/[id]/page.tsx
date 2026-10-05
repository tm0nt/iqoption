import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { affiliateProgram, termsFor } from "@/lib/affiliate/program";
import { accrueQuietly } from "@/lib/affiliate/accrual";
import { affiliateBalance } from "@/lib/affiliate/ledger";
import { PERIODS, conversion, periodStart, readPeriod, referralsOf, statsOf, subIdReport } from "@/lib/affiliate/stats";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdjustmentForm, AffiliateTermsEditor } from "@/components/admin/AffiliateEditors";
import { Badge, Card, EmptyState, LinkTabs, PageHeader, StatCard, TableShell, buttonClass, statusTone, td, th } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/affiliates/[id]">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).affiliates.heading} · ${adminCopy(lang).shell.title}` };
}

const TABS = ["referrals", "commissions", "payouts", "clicks", "subIds", "postbacks"] as const;
type Tab = (typeof TABS)[number];
const ROWS = 200;

export default async function AdminAffiliatePage(props: PageProps<"/[lang]/admin/affiliates/[id]">) {
  const { lang, id: raw } = await props.params;
  if (!isLocale(lang)) notFound();
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const t = adminMoneyCopy(lang).affiliates;
  const c = adminMoneyCopy(lang).common;
  const query = await props.searchParams;
  const tab: Tab = TABS.includes(query.tab as Tab) ? (query.tab as Tab) : "referrals";
  const period = readPeriod(query.period);

  const affiliate = await prisma.affiliate.findUnique({ where: { id }, include: { user: { select: { email: true, id: true } } } });
  if (!affiliate) notFound();

  await accrueQuietly(affiliate.id);
  const from = periodStart(period);
  const [program, stats, balance] = await Promise.all([affiliateProgram(), statsOf(id, from), affiliateBalance(id)]);
  const terms = termsFor(program, affiliate);
  const money = (n: number) => formatMoney(n, program.currency, lang);
  const rate = conversion(stats);

  const base = `/${lang}/admin/affiliates/${id}`;
  const href = (patch: { tab?: Tab; period?: string }) => {
    const params = new URLSearchParams();
    const nextTab = patch.tab ?? tab;
    const nextPeriod = patch.period ?? period;
    if (nextTab !== "referrals") params.set("tab", nextTab);
    if (nextPeriod !== "30d") params.set("period", nextPeriod);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  let body: React.ReactNode;

  if (tab === "referrals") {
    const rows = await referralsOf(id, ROWS, 0);
    body =
      rows.length === 0 ? (
        <Card>
          <EmptyState>{t.nothingYet}</EmptyState>
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              {[t.user, t.registered, t.sub, t.ip, t.ftd, t.deposits, t.turnover, t.result, t.earned].map((head) => (
                <th key={head} className={th}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId}>
                <td className={td}>
                  <Link href={`/${lang}/admin/users?q=${row.userId}`} className="text-white hover:text-[var(--accent)]">
                    {row.email}
                  </Link>
                  <span className="block text-[11px] text-[#6f7076]">#{row.userId}</span>
                </td>
                <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(row.createdAt, lang)}</td>
                <td className={`${td} font-mono text-[12px] text-[#a0a1a6]`}>{row.subId ?? "—"}</td>
                <td className={`${td} font-mono text-[12px] text-[#a0a1a6]`}>{row.ip ?? "—"}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {row.ftdAt ? (
                    <>
                      {money(row.ftdAmount ?? 0)}
                      <span className="block text-[11px] text-[#6f7076]">{formatDateTime(row.ftdAt, lang)}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${td} whitespace-nowrap`}>{money(row.deposits)}</td>
                <td className={`${td} whitespace-nowrap`}>{money(row.turnover)}</td>
                <td className={`${td} whitespace-nowrap ${row.platformResult < 0 ? "text-[#ff8a99]" : "text-emerald-300"}`}>{money(row.platformResult)}</td>
                <td className={`${td} whitespace-nowrap font-medium`}>{money(row.earned)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      );
  } else if (tab === "commissions") {
    const lines = await prisma.affiliateCommission.findMany({
      where: { affiliateId: id, NOT: { amount: 0 } },
      orderBy: { earnedAt: "desc" },
      take: ROWS,
    });
    const now = new Date();
    body = (
      <div className="space-y-4">
        <Card title={t.adjustTitle}>
          <AdjustmentForm id={id} locale={lang} currency={program.currency} />
        </Card>
        {lines.length === 0 ? (
          <Card>
            <EmptyState>{t.nothingYet}</EmptyState>
          </Card>
        ) : (
          <TableShell>
            <thead>
              <tr>
                {[t.when, t.kind, t.user, t.base, t.rate, t.amount, t.availableAt, t.state, ""].map((head, index) => (
                  <th key={index} className={th}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const state = line.reversedAt ? "reversed" : line.availableAt > now ? "held" : "available";
                return (
                  <tr key={line.id} className={line.reversedAt ? "opacity-60" : ""}>
                    <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(line.earnedAt, lang)}</td>
                    <td className={td}>
                      {t.kinds[line.kind]}
                      {line.note && <span className="block max-w-[240px] truncate text-[11px] text-[#6f7076]" title={line.note}>{line.note}</span>}
                    </td>
                    <td className={`${td} text-[#a0a1a6]`}>{line.referredUserId ? `#${line.referredUserId}` : "—"}</td>
                    <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{line.base !== null ? money(Number(line.base)) : "—"}</td>
                    <td className={`${td} text-[#a0a1a6]`}>{line.rate !== null ? `${Number(line.rate)}%` : "—"}</td>
                    <td className={`${td} whitespace-nowrap font-medium ${Number(line.amount) < 0 ? "text-[#ff8a99]" : "text-white"}`}>{money(Number(line.amount))}</td>
                    <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(line.availableAt, lang)}</td>
                    <td className={td}>
                      <Badge tone={state === "available" ? "success" : state === "held" ? "warning" : "danger"}>{t.states[state]}</Badge>
                    </td>
                    <td className={td}>
                      <ActionButton
                        url={`/api/admin/affiliates/commissions/${line.id}`}
                        body={{ action: line.reversedAt ? "restore" : "reverse" }}
                        label={line.reversedAt ? t.restore : t.reverse}
                        variant={line.reversedAt ? "secondary" : "danger"}
                        failed={c.actionFailed}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </div>
    );
  } else if (tab === "payouts") {
    const payouts = await prisma.affiliatePayout.findMany({ where: { affiliateId: id }, orderBy: { createdAt: "desc" }, take: ROWS });
    body =
      payouts.length === 0 ? (
        <Card>
          <EmptyState>{t.nothingYet}</EmptyState>
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              {[t.when, t.amount, adminMoneyCopy(lang).payouts.method, adminMoneyCopy(lang).payouts.destination, adminMoneyCopy(lang).payouts.status, adminMoneyCopy(lang).payouts.note].map(
                (head) => (
                  <th key={head} className={th}>
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(payout.createdAt, lang)}</td>
                <td className={`${td} whitespace-nowrap font-medium`}>{formatMoney(Number(payout.amount), payout.currency, lang)}</td>
                <td className={td}>{payout.method}</td>
                <td className={`${td} break-all font-mono text-[12px] text-[#a0a1a6]`}>{payout.destination}</td>
                <td className={td}>
                  <Badge tone={statusTone(payout.status)}>{c.status[payout.status]}</Badge>
                </td>
                <td className={`${td} text-[#6f7076]`}>{payout.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      );
  } else if (tab === "clicks") {
    const clicks = await prisma.affiliateClick.findMany({
      where: { affiliateId: id, ...(from ? { createdAt: { gte: from } } : {}) },
      orderBy: { id: "desc" },
      take: ROWS,
    });
    body =
      clicks.length === 0 ? (
        <Card>
          <EmptyState>{t.nothingYet}</EmptyState>
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              {[t.when, t.sub, t.source, t.landing, t.referer, t.ip, t.country, t.browser].map((head) => (
                <th key={head} className={th}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clicks.map((click) => (
              <tr key={click.id}>
                <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(click.createdAt, lang)}</td>
                <td className={`${td} font-mono text-[12px]`}>{click.subId ?? "—"}</td>
                <td className={`${td} text-[12px] text-[#a0a1a6]`}>
                  {[click.utmSource, click.utmMedium, click.utmCampaign].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className={`${td} max-w-[180px] truncate font-mono text-[12px] text-[#a0a1a6]`} title={click.landing ?? ""}>
                  {click.landing ?? "—"}
                </td>
                <td className={`${td} max-w-[200px] truncate text-[12px] text-[#a0a1a6]`} title={click.referer ?? ""}>
                  {click.referer ?? "—"}
                </td>
                <td className={`${td} font-mono text-[12px] text-[#a0a1a6]`}>{click.ip ?? "—"}</td>
                <td className={`${td} text-[#a0a1a6]`}>{click.country ?? "—"}</td>
                <td className={`${td} max-w-[200px] truncate text-[12px] text-[#6f7076]`} title={click.userAgent ?? ""}>
                  {click.userAgent ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      );
  } else if (tab === "subIds") {
    const subs = await subIdReport(id, from);
    body =
      subs.length === 0 ? (
        <Card>
          <EmptyState>{t.nothingYet}</EmptyState>
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              {[t.sub, t.clicks, t.signups, t.ftds, t.ftdAmount, t.earned].map((head) => (
                <th key={head} className={th}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.map((row) => (
              <tr key={row.sub}>
                <td className={`${td} font-mono text-[12px]`}>{row.sub || t.noSub}</td>
                <td className={td}>{row.clicks}</td>
                <td className={td}>{row.signups}</td>
                <td className={td}>{row.ftds}</td>
                <td className={`${td} whitespace-nowrap`}>{money(row.ftdAmount)}</td>
                <td className={`${td} whitespace-nowrap font-medium`}>{money(row.earned)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      );
  } else {
    const log = await prisma.affiliatePostback.findMany({ where: { affiliateId: id }, orderBy: { id: "desc" }, take: ROWS });
    body = (
      <div className="space-y-3">
        {!affiliate.postbackUrl && <p className="text-[13px] text-[#a0a1a6]">{t.noPostbackUrl}</p>}
        {log.length === 0 ? (
          <Card>
            <EmptyState>{t.nothingYet}</EmptyState>
          </Card>
        ) : (
          <TableShell>
            <thead>
              <tr>
                {[t.when, t.event, t.httpStatus, t.url, t.error].map((head) => (
                  <th key={head} className={th}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id}>
                  <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(entry.createdAt, lang)}</td>
                  <td className={td}>{entry.event}</td>
                  <td className={td}>
                    <Badge tone={entry.status && entry.status < 400 ? "success" : "danger"}>{entry.status ?? "—"}</Badge>
                  </td>
                  <td className={`${td} max-w-[360px] truncate font-mono text-[12px] text-[#a0a1a6]`} title={entry.url}>
                    {entry.url}
                  </td>
                  <td className={`${td} text-[12px] text-[#ff8a99]`}>{entry.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/${lang}/admin/affiliates`} className="text-[13px] text-[#a0a1a6] hover:text-white">
        ← {t.back}
      </Link>

      <PageHeader
        title={affiliate.user.email}
        lead={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-white">{affiliate.code}</span>
            <Badge tone={statusTone(affiliate.status)}>{t.status[affiliate.status]}</Badge>
            <span>
              {t.plans[terms.plan]}
              {(terms.plan === "CPA" || terms.plan === "HYBRID") && ` · CPA ${money(terms.cpaAmount)}`}
              {(terms.plan === "REVSHARE" || terms.plan === "HYBRID") && ` · RevShare ${terms.revsharePercent}%`}
            </span>
          </span>
        }
        actions={
          <>
            {affiliate.status !== "ACTIVE" && (
              <ActionButton
                url={`/api/admin/affiliates/${id}`}
                method="PATCH"
                body={{ status: "ACTIVE" }}
                label={affiliate.status === "PENDING" ? t.approve : t.reactivate}
                variant="primary"
                size="md"
                failed={c.actionFailed}
              />
            )}
            {affiliate.status !== "SUSPENDED" && (
              <ActionButton
                url={`/api/admin/affiliates/${id}`}
                method="PATCH"
                body={{ status: "SUSPENDED" }}
                label={t.suspend}
                variant="danger"
                size="md"
                failed={c.actionFailed}
              />
            )}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((value) => (
          <Link key={value} href={href({ period: value })} className={buttonClass(value === period ? "primary" : "secondary", "sm")}>
            {value === "today" ? c.today : value === "7d" ? c.last7 : value === "30d" ? c.last30 : c.allTime}
          </Link>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label={t.clicks} value={stats.clicks} hint={`${t.uniqueClicks}: ${stats.uniqueClicks}`} />
        <StatCard label={t.signups} value={stats.signups} hint={rate === null ? undefined : `${t.conversion}: ${rate}%`} />
        <StatCard label={t.ftds} value={stats.ftds} hint={money(stats.ftdAmount)} />
        <StatCard label={t.deposits} value={money(stats.deposits)} hint={`${t.withdrawals}: ${money(stats.withdrawals)}`} />
        <StatCard label={t.turnover} value={money(stats.turnover)} />
        <StatCard
          label={t.platformResult}
          value={money(stats.platformResult)}
          tone={stats.platformResult > 0 ? "up" : stats.platformResult < 0 ? "down" : undefined}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Card title={t.earned}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            {[
              [t.cpa, stats.cpa],
              [t.revshare, stats.revshare],
              [t.adjustments, stats.adjustments],
              [t.earned, stats.earned],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[#a0a1a6]">{label}</dt>
                <dd className={`mt-0.5 text-[16px] font-semibold ${(value as number) < 0 ? "text-[#ff8a99]" : "text-white"}`}>{money(value as number)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/[0.06] pt-4 text-[13px]">
            {[
              [t.available, balance.available],
              [t.held, balance.held],
              [t.pendingPayouts, balance.pending],
              [t.paid, balance.paid],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[#a0a1a6]">{label}</dt>
                <dd className="mt-0.5 text-[16px] font-semibold text-white">{money(value as number)}</dd>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t.terms}>
          <AffiliateTermsEditor
            id={id}
            locale={lang}
            initial={{
              code: affiliate.code,
              plan: affiliate.plan,
              cpaAmount: affiliate.cpaAmount !== null ? String(Number(affiliate.cpaAmount)) : "",
              revsharePercent: affiliate.revsharePercent !== null ? String(Number(affiliate.revsharePercent)) : "",
              postbackUrl: affiliate.postbackUrl ?? "",
              note: affiliate.note ?? "",
            }}
            defaults={{ plan: program.plan, cpaAmount: String(program.cpaAmount), revsharePercent: String(program.revsharePercent) }}
          />
        </Card>
      </div>

      <div className="space-y-4">
        <LinkTabs items={TABS.map((value) => ({ href: href({ tab: value }), label: t.tabs[value], current: value === tab }))} />
        {body}
        <p className="text-[12px] text-[#6f7076]">{t.rows(ROWS)}</p>
      </div>
    </div>
  );
}
