import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { HistoryFilters } from "@/components/cabinet/HistoryFilters";
import { balanceHistory, type HistoryFilter } from "@/lib/cabinet/balance-history";
import { loadCabinet } from "@/lib/cabinet/profile";
import { formatDateTime, formatMoney } from "@/lib/cabinet/format";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

export async function generateMetadata(props: PageProps<"/[lang]/transactions">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.balanceHistory };
}
export const dynamic = "force-dynamic";

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
    { value: "cancelled", label: h.statusOf("cancelled") },
    { value: "settled", label: h.settled },
    { value: "open", label: h.open },
  ];

  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : undefined);

  const fromDay = read("from");
  const fromDate = fromDay && /^\d{4}-\d{2}-\d{2}$/.test(fromDay) ? new Date(`${fromDay}T00:00:00`) : undefined;
  const filter: HistoryFilter = {
    type: (read("type") as HistoryFilter["type"]) ?? "all",
    status: read("status") ?? "all",
    // A date with no time means the whole of that day, not its first instant.
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
  };

  const { user, account, brand, wallet, real } = await loadCabinet(lang, `/${lang}/transactions`);
  const all = await balanceHistory(user.id, filter);

  /*
   * The currency filter was drawn and never applied. Every wallet a person has
   * shares one currency today, but the filter is offered, so it filters.
   */
  const currencies = [...new Set([real?.currency, wallet?.currency].filter((c): c is string => Boolean(c)))];
  const currencyFilter = read("currency");
  const entries = currencyFilter ? all.filter((entry) => entry.currency === currencyFilter) : all;

  const current: Record<string, string> = {};
  for (const key of ["type", "status", "from", "currency"]) {
    const value = read(key);
    if (value) current[key] = value;
  }

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <h1 className="pt-8 text-[26px] font-semibold leading-10 text-avalon-text sm:pt-10 sm:text-[30px]">{cabinetCopy(lang).nav.balanceHistory}</h1>

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
              options: [{ value: "all", label: h.allCurrencies }, ...currencies.map((c) => ({ value: c, label: c }))],
            },
            { name: "status", label: h.status, options: statuses },
          ]}
        />
      </div>

      <div className="-mx-4 mt-9 overflow-x-auto border-t border-avalon-surface-hover px-4 sm:mx-0 sm:px-0">
        {entries.length === 0 ? (
          <p className="py-24 text-center text-[16px] font-light text-avalon-text">{h.noData}</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-[13px]">
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
                  <td className="py-3.5 pr-3 whitespace-nowrap text-avalon-text">{formatDateTime(entry.at, lang)}</td>
                  <td className="py-3.5 text-avalon-text-strong">{d.entryOf(entry.label)}</td>
                  <td className="py-3.5 font-mono text-[12px] text-avalon-text">{entry.reference}</td>
                  <td className="py-3.5">
                    <span className={`rounded px-2 py-0.5 text-[12px] ${TONE[entry.status] ?? ""}`}>
                      {h.statusOf(entry.status)}
                    </span>
                  </td>
                  {/* A refused or withdrawn request never moved the balance, or gave it back. */}
                  <td
                    className={`py-3.5 text-right font-medium ${
                      entry.status === "rejected" || entry.status === "cancelled"
                        ? "text-avalon-border-muted line-through"
                        : entry.amount >= 0
                          ? "text-avalon-primary"
                          : "text-avalon-text-strong"
                    }`}
                  >
                    {entry.amount >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(entry.amount), entry.currency, lang)}
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
