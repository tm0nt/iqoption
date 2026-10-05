import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { adminCopy } from "@/i18n/admin";
import { adminMoneyCopy } from "@/i18n/admin-money";
import { balancesFor } from "@/lib/affiliate/ledger";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { PayoutQueue, type PayoutRow } from "@/components/admin/PayoutQueue";
import { Badge, Card, EmptyState, PageHeader, TableShell, statusTone, td, th } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[lang]/admin/affiliates/payouts">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: `${adminMoneyCopy(lang).payouts.heading} · ${adminCopy(lang).shell.title}` };
}

export default async function AdminPayoutsPage(props: PageProps<"/[lang]/admin/affiliates/payouts">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  const t = adminMoneyCopy(lang).payouts;
  const c = adminMoneyCopy(lang).common;

  const [pending, settled] = await Promise.all([
    prisma.affiliatePayout.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { affiliate: { select: { code: true, user: { select: { email: true } } } } },
      take: 200,
    }),
    prisma.affiliatePayout.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      include: { affiliate: { select: { id: true, code: true, user: { select: { email: true } } } } },
      take: 100,
    }),
  ]);

  // A pending payout already counts against the balance, so this is what is left after it.
  const balances = await balancesFor([...new Set(pending.map((row) => row.affiliateId))]);

  const rows: PayoutRow[] = pending.map((row) => ({
    id: row.id,
    affiliateId: row.affiliateId,
    email: row.affiliate.user.email,
    code: row.affiliate.code,
    amount: formatMoney(Number(row.amount), row.currency, lang),
    method: row.method,
    destination: row.destination,
    requested: formatDateTime(row.createdAt, lang),
    availableAfter: balances.has(row.affiliateId) ? formatMoney(balances.get(row.affiliateId)!.available, row.currency, lang) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={t.heading} lead={t.lead} />

      <Card title={t.waiting(pending.length)} padded={false}>
        <PayoutQueue rows={rows} locale={lang} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">{t.settled}</h2>
        {settled.length === 0 ? (
          <Card>
            <EmptyState>{t.nothingSettled}</EmptyState>
          </Card>
        ) : (
          <TableShell>
            <thead>
              <tr>
                {[t.affiliate, t.amount, t.method, t.destination, t.status, t.requested, t.note].map((head) => (
                  <th key={head} className={th}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settled.map((row) => (
                <tr key={row.id}>
                  <td className={td}>
                    <Link href={`/${lang}/admin/affiliates/${row.affiliate.id}`} className="text-white hover:text-[var(--accent)]">
                      {row.affiliate.user.email}
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap font-medium`}>{formatMoney(Number(row.amount), row.currency, lang)}</td>
                  <td className={td}>{row.method}</td>
                  <td className={`${td} max-w-[220px] truncate font-mono text-[12px] text-[#a0a1a6]`} title={row.destination}>
                    {row.destination}
                  </td>
                  <td className={td}>
                    <Badge tone={statusTone(row.status)}>{c.status[row.status]}</Badge>
                  </td>
                  <td className={`${td} whitespace-nowrap text-[#a0a1a6]`}>{formatDateTime(row.createdAt, lang)}</td>
                  <td className={`${td} text-[#6f7076]`}>{row.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </section>
    </div>
  );
}
