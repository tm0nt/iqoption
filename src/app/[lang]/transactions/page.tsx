import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { HistoryFilters } from "@/components/cabinet/HistoryFilters";
import { balanceHistory, type HistoryFilter } from "@/lib/cabinet/balance-history";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

export async function generateMetadata(props: PageProps<"/[lang]/transactions">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.balanceHistory };
}
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });



const TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-avalon-primary/10 text-avalon-primary",
  settled: "bg-avalon-surface-hover text-avalon-text",
  open: "bg-avalon-primary/10 text-avalon-primary",
  rejected: "bg-avalon-danger/10 text-avalon-danger",
  cancelled: "bg-avalon-surface-hover text-avalon-text",
};

export default async function TransactionsPage(props: PageProps<"/[lang]/transactions">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const h = cabinetCopy(lang).history;
  const d = cabinetCopy(lang).personal;
  const types = [
    { value: "all", label: h.allTypes },
    { value: "deposit", label: h.deposits },
    { value: "withdrawal", label: h.withdrawals },
    { value: "trade", label: h.trades },
  ];
  const statuses = [
    { value: "all", label: h.allStatuses },
    { value: "pending", label: h.pending },
    { value: "approved", label: h.approved },
    { value: "rejected", label: h.rejected },
    { value: "settled", label: h.settled },
    { value: "open", label: h.open },
  ];

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/transactions`);

  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : undefined);

  const filter: HistoryFilter = {
    type: (read("type") as HistoryFilter["type"]) ?? "all",
    status: read("status") ?? "all",
    // A date with no time means the whole of that day, not its first instant.
    from: read("from") ? new Date(`${read("from")}T00:00:00`) : undefined,
  };

  const [user, entries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.platformId },
      select: {
        email: true,
        kycStatus: true,
        activeBalanceId: true,
        balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
      },
    }),
    balanceHistory(session.user.platformId, filter),
  ]);
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const currency = wallet?.currency ?? "USD";

  const current: Record<string, string> = {};
  for (const key of ["type", "status", "from"]) {
    const value = read(key);
    if (value) current[key] = value;
  }

  return (
    <CabinetShell
      locale={lang}
      account={{
        email: user.email,
        balance: `${MONEY.format(Number(wallet?.amount ?? 0))} ${currency}`,
        balanceLabel: wallet?.type === 4 ? cabinetCopy(lang).account.practice : cabinetCopy(lang).account.real,
        verified: user.kycStatus === "APPROVED",
      }}
    >
      <h1 className="pt-10 text-[30px] font-semibold leading-10 text-avalon-text">{cabinetCopy(lang).nav.balanceHistory}</h1>

      <div className="mt-7">
        <HistoryFilters
          locale={lang}
          basePath={`/${lang}/transactions`}
          current={current}
          groups={[
            { name: "type", label: h.transactionType, options: types },
            {
              name: "currency",
              label: h.currency,
              options: [{ value: "all", label: h.allCurrencies }, { value: currency, label: currency }],
            },
            { name: "status", label: h.status, options: statuses },
          ]}
        />
      </div>

      <div className="mt-9 border-t border-avalon-surface-hover">
        {entries.length === 0 ? (
          <p className="py-24 text-center text-[16px] font-light text-avalon-text">{h.noData}</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
              <tr>
                {[d.when, d.what, d.reference, h.status, d.amount].map((head) => (
                  <th key={head} className="py-4 font-medium last:text-right">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-avalon-surface-hover">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3.5 whitespace-nowrap text-avalon-text">{entry.at.toLocaleString()}</td>
                  <td className="py-3.5 text-avalon-text-strong">{d.entryOf(entry.label)}</td>
                  <td className="py-3.5 font-mono text-[12px] text-avalon-text">{entry.reference}</td>
                  <td className="py-3.5">
                    <span className={`rounded px-2 py-0.5 text-[12px] ${TONE[entry.status] ?? ""}`}>
                      {h.statusOf(entry.status)}
                    </span>
                  </td>
                  <td
                    className={`py-3.5 text-right font-medium ${
                      entry.amount >= 0 ? "text-avalon-primary" : "text-avalon-text-strong"
                    }`}
                  >
                    {entry.amount >= 0 ? "+" : "−"}
                    {MONEY.format(Math.abs(entry.amount))} {entry.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-avalon-surface-hover pt-4 text-[12px] text-avalon-text">
        {entries.length > 0 && (
          <>
            {cabinetCopy(lang).personal.entries(entries.length)}{" "}
            {cabinetCopy(lang).personal.settledTwice}
          </>
        )}
      </div>
    </CabinetShell>
  );
}
