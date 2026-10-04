import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { TopAssets } from "@/components/cabinet/TopAssets";
import { fetchTopAssets } from "@/lib/market/server";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

const HERO = "/sites/trade-avalonbroker-com-6f41c8f2/cabinet/images/bg-portfolio.jpg";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(value: number, currency: string) {
  return `${MONEY.format(value)} ${currency}`;
}

/** One figure in the summary strip. */
function Stat({ value, label, tone }: { value: string; label: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <div
        className={`text-[20px] font-semibold ${
          tone === "good" ? "text-avalon-primary" : tone === "bad" ? "text-avalon-danger" : "text-avalon-text-strong"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[12px] font-medium text-avalon-text">{label}</div>
    </div>
  );
}

export default async function PortfolioPage(props: PageProps<"/[lang]/portfolio">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/portfolio`);

  const [user, open, assets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.platformId },
      select: {
        email: true,
        kycStatus: true,
        balances: { select: { amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
      },
    }),
    prisma.position.findMany({
      where: { userId: session.user.platformId, closedAt: 0 },
      orderBy: { openTime: "desc" },
    }),
    fetchTopAssets(),
  ]);
  if (!user) redirect(`/${lang}/login`);

  const wallet = user.balances[0];
  const currency = wallet?.currency ?? "USD";
  const cash = Number(wallet?.amount ?? 0);

  /*
   * What a running deal is worth while it runs, and what it cost.
   *
   * A binary option is not worth its stake plus a mark-to-market: it pays its
   * whole payout or nothing. "Equity" here is the cash plus what the open
   * stakes would return if every one of them won — which is the optimistic
   * edge, and is labelled as the estimate it is.
   */
  const invested = open.reduce((sum, position) => sum + Number(position.invest), 0);
  const ifAllWon = open.reduce(
    (sum, position) => sum + Number(position.invest) * (1 + position.profitPercent / 100),
    0,
  );
  const equity = cash + ifAllWon;
  const grossProfit = invested ? ((ifAllWon - invested) / invested) * 100 : 0;

  return (
    <CabinetShell
      locale={lang}
      account={{
        email: user.email,
        balance: money(cash, currency),
        balanceLabel: wallet?.type === 4 ? "Practice account" : "Real account",
        verified: user.kycStatus === "APPROVED",
      }}
      bleed
    >
      <section
        className="relative flex h-[230px] items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO})` }}
      >
        <div className="mx-auto flex w-full max-w-[1032px] items-baseline px-6">
          <h1 className="pr-[30px] text-[40px] font-bold leading-[50px] text-white">Portfolio</h1>
          <span aria-hidden className="mr-[30px] h-[34px] w-px self-center bg-white/25" />
          <span className="text-[32px] font-bold leading-[50px] text-white">{money(equity, currency)}</span>
          <span className="ml-3 max-w-[110px] text-[12px] leading-[14px] text-white/80">
            Estimated account value
          </span>
        </div>
      </section>

      <section className="border-b border-avalon-surface-hover bg-white">
        <div className="mx-auto flex w-full max-w-[1032px] items-center gap-5 px-6 py-[17px]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-avalon-surface text-[11px] font-semibold text-avalon-text">
            {currency}
          </span>
          <span>
            <span className="block text-[16px] font-medium text-avalon-text-strong">{money(cash, currency)}</span>
            <span className="block text-[13px] text-avalon-text">{currency} Balance</span>
          </span>

          <Link
            href={`/${lang}/counting`}
            className="ml-8 flex h-10 items-center rounded-[2px] border border-avalon-primary px-5 text-[14px] font-medium text-avalon-primary transition-colors hover:bg-avalon-primary hover:text-white"
          >
            Deposit
          </Link>
          <Link
            href={`/${lang}/withdrawal`}
            aria-label="Withdraw funds"
            className="flex size-10 items-center justify-center rounded-[2px] border border-avalon-primary text-avalon-primary transition-colors hover:bg-avalon-primary hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M10 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H10" />
              <path d="M11 5l3 3-3 3M14 8H6" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="bg-avalon-surface py-8">
        <div className="mx-auto w-full max-w-[1032px] px-6">
          <div className="grid grid-cols-2 gap-6 rounded-[4px] bg-white px-8 py-6 md:grid-cols-4">
            <Stat value={`${open.length} Position${open.length === 1 ? "" : "s"}`} label="" />
            <Stat value={money(invested, currency)} label="Total Investment" />
            <Stat value={money(equity, currency)} label="Total Equity" />
            <Stat
              value={`${grossProfit > 0 ? "+" : ""}${grossProfit.toFixed(0)}%`}
              label="Total Gross Profit"
              tone={grossProfit > 0 ? "good" : grossProfit < 0 ? "bad" : undefined}
            />
          </div>

          {open.length === 0 ? (
            <p className="mt-8 text-center text-[14px] text-avalon-text">
              You don&apos;t have any open positions yet. Explore Top Assets and{" "}
              <Link href={`/${lang}/traderoom`} className="text-avalon-primary hover:underline">
                start
              </Link>{" "}
              the best trading experience ever.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-avalon-surface-hover rounded-[4px] bg-white">
              {open.map((position) => (
                <li key={position.id} className="flex items-center gap-4 px-8 py-4 text-[14px]">
                  <span className="w-[90px] font-semibold text-avalon-text-strong">#{position.activeId}</span>
                  <span className={position.direction === "call" ? "text-avalon-primary" : "text-avalon-danger"}>
                    {position.direction === "call" ? "▲ call" : "▼ put"}
                  </span>
                  <span className="ml-auto text-avalon-text">
                    {money(Number(position.invest), position.currency)}
                  </span>
                  <span className="w-[120px] text-right text-avalon-text">
                    expires {new Date(position.expirationTime * 1000).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1032px] px-6">
        {assets.length > 0 ? (
          <TopAssets assets={assets} locale={lang} />
        ) : (
          <p className="py-12 text-center text-[14px] text-avalon-text">
            Top assets are unavailable — the market feed is not answering.
          </p>
        )}
      </div>
    </CabinetShell>
  );
}
