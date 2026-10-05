import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { affiliateProgram, termsFor } from "@/lib/affiliate/program";
import { accrueQuietly } from "@/lib/affiliate/accrual";
import { balancesFor } from "@/lib/affiliate/ledger";
import { PERIODS, periodStart, readPeriod, statsFor } from "@/lib/affiliate/stats";
import { formatLongDate, formatMoney } from "@/lib/cabinet/format";
import { AddAffiliateForm } from "@/components/admin/AffiliateEditors";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, Card, EmptyState, LinkTabs, PageHeader, Pager, StatCard, TableShell, buttonClass, inputClass, statusTone, td, th } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/affiliates">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).affiliates.heading} · ${adminCopy(lang).shell.title}` };
}

const PAGE = 50;
const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;

export default async function AdminAffiliatesPage(props: PageProps<"/[lang]/admin/affiliates">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const t = adminMoneyCopy(lang).affiliates;
  const c = adminMoneyCopy(lang).common;
  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : "");

  const status = STATUSES.find((value) => value === read("status"));
  const q = read("q").trim();
  const period = readPeriod(read("period"));
  const page = Math.max(1, Number(read("page")) || 1);

  // The numbers below come from the ledger; bring it up to date first.
  await accrueQuietly();

  const where: Prisma.AffiliateWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { user: { email: { contains: q.toLowerCase() } } }] } : {}),
  };

  const [program, rows, counts] = await Promise.all([
    affiliateProgram(),
    prisma.affiliate.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: [{ status: "asc" }, { id: "desc" }],
      take: PAGE + 1,
      skip: (page - 1) * PAGE,
    }),
    prisma.affiliate.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const hasNext = rows.length > PAGE;
  const affiliates = rows.slice(0, PAGE);
  const ids = affiliates.map((affiliate) => affiliate.id);
  const [stats, balances] = await Promise.all([statsFor(ids, periodStart(period)), balancesFor(ids)]);

  const money = (n: number) => formatMoney(n, program.currency, lang);
  const count = (value?: string) =>
    value ? counts.find((row) => row.status === value)?._count._all ?? 0 : counts.reduce((sum, row) => sum + row._count._all, 0);
  const totals = [...stats.values()].reduce(
    (sum, s) => ({ clicks: sum.clicks + s.clicks, signups: sum.signups + s.signups, ftds: sum.ftds + s.ftds, earned: sum.earned + s.earned }),
    { clicks: 0, signups: 0, ftds: 0, earned: 0 },
  );

  const base = `/${lang}/admin/affiliates`;
  const keep = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { status: status ?? "", q, period: period === "30d" ? "" : period, ...patch };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.heading}
        lead={t.lead}
        actions={
          <>
            <Link href={`${base}/program`} className={buttonClass("secondary")}>
              {t.programLink}
            </Link>
            <Link href={`${base}/payouts`} className={buttonClass("secondary")}>
              {t.payoutsLink}
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={keep({ period: value === "30d" ? "" : value, page: "" })}
            className={buttonClass(value === period ? "primary" : "secondary", "sm")}
          >
            {value === "today" ? c.today : value === "7d" ? c.last7 : value === "30d" ? c.last30 : c.allTime}
          </Link>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.clicks} value={totals.clicks} />
        <StatCard label={t.signups} value={totals.signups} />
        <StatCard label={t.ftds} value={totals.ftds} />
        <StatCard label={t.earned} value={money(totals.earned)} />
      </section>

      <Card title={t.add} description={t.addHint}>
        <AddAffiliateForm locale={lang} />
      </Card>

      <div className="space-y-3">
        <LinkTabs
          items={[
            { href: keep({ status: "", page: "" }), label: c.all, current: !status, count: count() },
            ...STATUSES.map((value) => ({
              href: keep({ status: value, page: "" }),
              label: t.status[value],
              current: status === value,
              count: count(value),
            })),
          ]}
        />

        <form method="get" className="flex flex-wrap gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          {period !== "30d" && <input type="hidden" name="period" value={period} />}
          <input name="q" defaultValue={q} placeholder={t.searchPlaceholder} className={`${inputClass} max-w-[320px]`} />
          <button type="submit" className={buttonClass("secondary")}>
            {c.search}
          </button>
        </form>

        {affiliates.length === 0 ? (
          <Card>
            <EmptyState>{t.none}</EmptyState>
          </Card>
        ) : (
          <TableShell>
            <thead>
              <tr>
                {[t.affiliate, t.plan, t.clicks, t.signups, t.ftds, t.deposits, t.earned, t.balance, t.joined, ""].map((head, index) => (
                  <th key={index} className={th}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => {
                const s = stats.get(affiliate.id)!;
                const b = balances.get(affiliate.id)!;
                const terms = termsFor(program, affiliate);
                return (
                  <tr key={affiliate.id}>
                    <td className={td}>
                      <Link href={`${base}/${affiliate.id}`} className="block font-medium text-white hover:text-[var(--accent)]">
                        {affiliate.user.email}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#a0a1a6]">{affiliate.code}</span>
                        <Badge tone={statusTone(affiliate.status)}>{t.status[affiliate.status]}</Badge>
                      </span>
                    </td>
                    <td className={`${td} text-[#a0a1a6]`}>
                      {t.plans[terms.plan]}
                      {!affiliate.plan && <span className="block text-[11px] text-[#6f7076]">{t.followsProgram}</span>}
                    </td>
                    <td className={td}>{s.clicks}</td>
                    <td className={td}>{s.signups}</td>
                    <td className={td}>{s.ftds}</td>
                    <td className={`${td} whitespace-nowrap`}>{money(s.deposits)}</td>
                    <td className={`${td} whitespace-nowrap ${s.earned < 0 ? "text-[#ff8a99]" : ""}`}>{money(s.earned)}</td>
                    <td className={`${td} whitespace-nowrap font-medium`}>{money(b.available)}</td>
                    <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatLongDate(affiliate.createdAt, lang)}</td>
                    <td className={td}>
                      {affiliate.status === "PENDING" && (
                        <ActionButton
                          url={`/api/admin/affiliates/${affiliate.id}`}
                          method="PATCH"
                          body={{ status: "ACTIVE" }}
                          label={t.approve}
                          variant="primary"
                          failed={c.actionFailed}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}

        <Pager
          basePath={base}
          query={Object.fromEntries(Object.entries({ status: status ?? "", q, period: period === "30d" ? "" : period }).filter(([, v]) => v))}
          page={page}
          hasNext={hasNext}
          labels={{ previous: c.previous, next: c.next, page: c.page }}
        />
      </div>
    </div>
  );
}
