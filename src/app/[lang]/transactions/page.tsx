import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { HistoryFilters } from "@/components/cabinet/HistoryFilters";
import { balanceHistory, type HistoryFilter } from "@/lib/cabinet/balance-history";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Balance History" };
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPES = [
  { value: "all", label: "All types" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "trade", label: "Trades" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "settled", label: "Settled" },
  { value: "open", label: "Open" },
];

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
        balanceLabel: wallet?.type === 4 ? "Practice account" : "Real account",
        verified: user.kycStatus === "APPROVED",
      }}
    >
      <h1 className="pt-10 text-[30px] font-semibold leading-10 text-avalon-text">Balance History</h1>

      <div className="mt-7">
        <HistoryFilters
          basePath={`/${lang}/transactions`}
          current={current}
          groups={[
            { name: "type", label: "Transaction type", options: TYPES },
            {
              name: "currency",
              label: "Currency",
              options: [{ value: "all", label: "All currencies" }, { value: currency, label: currency }],
            },
            { name: "status", label: "Status", options: STATUSES },
          ]}
        />
      </div>

      <div className="mt-9 border-t border-avalon-surface-hover">
        {entries.length === 0 ? (
          <p className="py-24 text-center text-[16px] font-light text-avalon-text">No data found</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
              <tr>
                {["When", "What", "Reference", "Status", "Amount"].map((head) => (
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
                  <td className="py-3.5 text-avalon-text-strong">{entry.label}</td>
                  <td className="py-3.5 font-mono text-[12px] text-avalon-text">{entry.reference}</td>
                  <td className="py-3.5">
                    <span className={`rounded px-2 py-0.5 text-[12px] ${TONE[entry.status] ?? ""}`}>
                      {entry.status}
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
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}. A settled deal appears twice: the stake
            leaving when it opened, and the payout arriving when it closed.
          </>
        )}
      </div>
    </CabinetShell>
  );
}
