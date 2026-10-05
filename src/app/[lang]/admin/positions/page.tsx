import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PositionTable, type AdminPosition } from "@/components/admin/PositionTable";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { adminCopy } from "@/i18n/admin";
import { PageHeader } from "@/components/admin/ui";

export async function generateMetadata(props: PageProps<"/[lang]/admin/positions">): Promise<Metadata> {
  const { lang } = await props.params;
  const copy = adminCopy(lang);
  return { title: `${copy.deals.heading} · ${copy.shell.title}` };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Filter = "all" | "open" | "settled";

/** What the chosen filter means to the query. */
function whereFor(filter: Filter, account?: number) {
  const where: { closedAt?: number | { gt: number }; userId?: number } = {};
  if (filter === "open") where.closedAt = 0;
  if (filter === "settled") where.closedAt = { gt: 0 };
  if (account) where.userId = account;
  return where;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#15161a] px-5 py-4">
      <div
        className={`text-[22px] font-semibold leading-tight ${
          tone === "good" ? "text-[var(--accent)]" : tone === "bad" ? "text-avalon-danger" : ""
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[13px] text-[#a0a1a6]">{label}</div>
    </div>
  );
}

export default async function AdminPositions(props: PageProps<"/[lang]/admin/positions">) {
  const { lang } = await props.params;
  const t = adminCopy(lang);
  const query = await props.searchParams;

  const filter: Filter = query.filter === "open" || query.filter === "settled" ? query.filter : "all";
  const account = Number(query.account) || undefined;
  const page = Math.max(1, Number(query.page) || 1);

  const where = whereFor(filter, account);

  const [rows, total, assets, open, settled] = await Promise.all([
    prisma.position.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: [{ openTime: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.position.count({ where }),
    prisma.asset.findMany({ select: { id: true, ticker: true } }),
    /*
     * The two aggregates are over the account filter but not the status one:
     * the summary describes the book, and a summary that changes when you click
     * "open" answers a different question than the one on screen.
     */
    prisma.position.aggregate({
      where: { closedAt: 0, ...(account ? { userId: account } : {}) },
      _count: true,
      _sum: { invest: true },
    }),
    prisma.position.aggregate({
      where: { closedAt: { gt: 0 }, ...(account ? { userId: account } : {}) },
      _count: true,
      _sum: { invest: true, profitAmount: true },
    }),
  ]);

  const tickers = new Map(assets.map((asset) => [asset.id, asset.ticker]));

  const positions: AdminPosition[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.user?.email ?? null,
    activeId: row.activeId,
    // An instrument can be deleted; a deal on it is still a record of what
    // happened, so the id stands in rather than the row vanishing.
    ticker: tickers.get(row.activeId) ?? `#${row.activeId}`,
    direction: row.direction,
    invest: Number(row.invest),
    profitAmount: row.profitAmount === null ? null : Number(row.profitAmount),
    profitPercent: row.profitPercent,
    openQuote: Number(row.openQuote),
    closeQuote: row.closeQuote === null ? null : Number(row.closeQuote),
    openTime: row.openTime,
    expirationTime: row.expirationTime,
    expirationSize: row.expirationSize,
    closedAt: row.closedAt,
    status: row.status,
    closeReason: row.closeReason,
    currency: row.currency,
  }));

  const staked = Number(settled._sum.invest ?? 0);
  const returned = Number(settled._sum.profitAmount ?? 0);
  // Positive means the platform kept money; negative means it paid out more
  // than it took.
  const house = staked - returned;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { filter, account, page, ...next };
    for (const [key, value] of Object.entries(merged)) {
      // The defaults are left out, so the common case has a clean URL.
      if (value === undefined) continue;
      if (key === "filter" && value === "all") continue;
      if (key === "page" && value === 1) continue;
      params.set(key, String(value));
    }
    const search = params.toString();
    return `/${lang}/admin/positions${search ? `?${search}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Running deals change on their own; settled ones never do. */}
      {filter !== "settled" && open._count > 0 && <AutoRefresh seconds={10} />}

      <PageHeader
        title={t.deals.heading}
        lead={
          <>
            {t.deals.lead}
            {account && (
              <>
                {" "}
                {t.deals.filteredTo(account)}{" "}
                <Link href={link({ account: undefined, page: 1 })} className="text-[var(--accent)] hover:underline">
                  {t.deals.showAll}
                </Link>
              </>
            )}
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.deals.running} value={String(open._count)} />
        <Stat label={t.deals.staked} value={`${Number(open._sum.invest ?? 0).toFixed(2)}`} />
        <Stat label={t.deals.settled} value={String(settled._count)} />
        <Stat
          label={house >= 0 ? t.deals.kept : t.deals.paidOut}
          value={Math.abs(house).toFixed(2)}
          tone={house >= 0 ? "good" : "bad"}
        />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {(["all", "open", "settled"] as const).map((option) => (
          <Link
            key={option}
            href={link({ filter: option, page: 1 })}
            className={`rounded px-3 py-1.5 text-[13px] transition-colors ${
              filter === option ? "bg-[var(--accent)] text-white" : "bg-white/5 text-[#a0a1a6] hover:text-white"
            }`}
          >
            {option === "all" ? t.deals.all : option === "open" ? t.deals.running : t.deals.settled}
          </Link>
        ))}
        <span className="ml-auto text-[13px] text-[#6f7076]">{t.deals.count(total)}</span>
      </section>

      <PositionTable positions={positions} lang={lang} />

      {pages > 1 && (
        <nav className="flex items-center justify-between text-[13px]">
          <Link
            href={link({ page: Math.max(1, page - 1) })}
            className={page === 1 ? "pointer-events-none text-[#3c3d42]" : "text-[#a0a1a6] hover:text-white"}
          >
            {t.deals.newer}
          </Link>
          <span className="text-[#6f7076]">{t.deals.pageOf(page, pages)}</span>
          <Link
            href={link({ page: Math.min(pages, page + 1) })}
            className={page === pages ? "pointer-events-none text-[#3c3d42]" : "text-[#a0a1a6] hover:text-white"}
          >
            {t.deals.older}
          </Link>
        </nav>
      )}
    </div>
  );
}
