import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { HistoryFilters } from "@/components/cabinet/HistoryFilters";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

export async function generateMetadata(props: PageProps<"/[lang]/trading">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.tradingHistory };
}
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `option_type_id` as the deal panel sends it; see docs/avalon-backend.md. */


const OUTCOME_TONE: Record<string, string> = {
  win: "text-avalon-primary",
  loose: "text-avalon-danger",
  equal: "text-avalon-text",
};

export default async function TradingHistoryPage(props: PageProps<"/[lang]/trading">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const h = cabinetCopy(lang).history;
  const accounts = [
    { value: "all", label: h.allAccounts },
    { value: "1", label: h.real },
    { value: "4", label: h.practice },
  ];
  const instruments = [
    { value: "all", label: h.allInstruments },
    { value: "1", label: h.binary },
    { value: "3", label: h.turbo },
    { value: "12", label: h.blitz },
  ];

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/trading`);

  const query = await props.searchParams;
  const read = (name: string) => (typeof query[name] === "string" ? (query[name] as string) : undefined);

  const instrument = read("instrument");
  const account = read("account");
  const from = read("from") ? new Date(`${read("from")}T00:00:00`) : undefined;

  const [user, assets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.platformId },
      select: {
        email: true,
        kycStatus: true,
        activeBalanceId: true,
        balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
      },
    }),
    prisma.asset.findMany({ select: { id: true, ticker: true, name: true } }),
  ]);
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const currency = wallet?.currency ?? "USD";
  const walletIds = user.balances
    .filter((balance) => !account || account === "all" || balance.type === Number(account))
    .map((balance) => balance.id);

  const deals = await prisma.position.findMany({
    where: {
      userId: session.user.platformId,
      // Settled only: a running deal has no result to report, and the
      // portfolio is where those are shown.
      closedAt: { gt: 0 },
      ...(instrument && instrument !== "all" ? { optionTypeId: Number(instrument) } : {}),
      ...(walletIds.length > 0 ? { balanceId: { in: walletIds } } : {}),
      ...(from ? { openTime: { gte: Math.floor(from.getTime() / 1000) } } : {}),
    },
    orderBy: { closedAt: "desc" },
    take: 300,
  });

  const tickers = new Map(assets.map((asset) => [asset.id, asset.ticker]));

  /*
   * Net, not gross. What someone wants from this page is whether trading made
   * or lost money over the period, which is the payout minus what it cost —
   * reporting the payouts alone would make every losing week look profitable.
   */
  const netProfit = deals.reduce(
    (sum, deal) => sum + (Number(deal.profitAmount ?? 0) - Number(deal.invest)),
    0,
  );

  const current: Record<string, string> = {};
  for (const key of ["instrument", "account", "from"]) {
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
      <h1 className="pt-12 text-[24px] font-semibold leading-8 text-avalon-text">{cabinetCopy(lang).nav.tradingHistory}</h1>

      <div className="mt-6">
        <HistoryFilters
          locale={lang}
          basePath={`/${lang}/trading`}
          current={current}
          groups={[
            { name: "instrument", label: h.instrument, options: instruments },
            { name: "account", label: h.accountType, options: accounts },
          ]}
        />
      </div>

      <div className="mt-7 border-t border-avalon-border-muted pt-4">
        <p className="text-[16px] text-avalon-text">{h.periodData}</p>

        <div className="mt-4 rounded-[2px] bg-avalon-surface px-6 py-4">
          <div
            className={`text-[18px] font-semibold ${
              netProfit > 0 ? "text-avalon-primary" : netProfit < 0 ? "text-avalon-danger" : "text-avalon-text-strong"
            }`}
          >
            {netProfit > 0 ? "+" : netProfit < 0 ? "−" : ""}
            {MONEY.format(Math.abs(netProfit))} {currency}
          </div>
          <div className="mt-1 text-[12px] font-medium text-avalon-text">{h.totalNetProfit}</div>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center py-24">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#acabac" strokeWidth="1.6" aria-hidden>
            <circle cx="28" cy="28" r="16" />
            <path d="M39 39l14 14M23 23l10 10M33 23l-10 10M46 18v6M43 21h6M18 46h.01" strokeLinecap="round" />
          </svg>
          <p className="mt-6 text-[16px] font-bold text-avalon-text">{h.noData}</p>
          <p className="mt-2 text-[14px] text-avalon-text">{h.noDataHint}</p>
        </div>
      ) : (
        <table className="mt-8 w-full text-left text-[13px]">
          <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
            <tr>
              {["Closed", "Instrument", "Side", "Stake", "Quotes", "Outcome", "Net"].map((head) => (
                <th key={head} className="pb-3 font-medium last:text-right">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-avalon-surface-hover">
            {deals.map((deal) => {
              const net = Number(deal.profitAmount ?? 0) - Number(deal.invest);
              return (
                <tr key={deal.id}>
                  <td className="whitespace-nowrap py-3.5 text-avalon-text">
                    {new Date(deal.closedAt * 1000).toLocaleString()}
                  </td>
                  <td className="py-3.5 font-medium text-avalon-text-strong">
                    {tickers.get(deal.activeId) ?? `#${deal.activeId}`}
                  </td>
                  <td className={`py-3.5 ${deal.direction === "call" ? "text-avalon-primary" : "text-avalon-danger"}`}>
                    {deal.direction === "call" ? "▲ call" : "▼ put"}
                  </td>
                  <td className="py-3.5 text-avalon-text">
                    {MONEY.format(Number(deal.invest))} {deal.currency}
                  </td>
                  <td className="py-3.5 font-mono text-[12px] text-avalon-text">
                    {String(deal.openQuote)} → {String(deal.closeQuote ?? "")}
                  </td>
                  <td className={`py-3.5 ${OUTCOME_TONE[deal.closeReason] ?? ""}`}>
                    {deal.closeReason === "equal" ? "refunded" : deal.closeReason}
                  </td>
                  <td
                    className={`py-3.5 text-right font-medium ${
                      net > 0 ? "text-avalon-primary" : net < 0 ? "text-avalon-danger" : "text-avalon-text"
                    }`}
                  >
                    {net > 0 ? "+" : net < 0 ? "−" : ""}
                    {MONEY.format(Math.abs(net))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </CabinetShell>
  );
}
