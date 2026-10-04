import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { WithdrawalPanel } from "@/components/cabinet/WithdrawalPanel";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Withdraw Funds" };
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-avalon-primary/10 text-avalon-primary",
  REJECTED: "bg-avalon-danger/10 text-avalon-danger",
  CANCELLED: "bg-avalon-surface-hover text-avalon-text",
};

/** The first and last few characters, which is all an operator needs to recognise it. */
function maskDestination(value: string | null) {
  if (!value) return "—";
  if (value.length <= 10) return value;
  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

export default async function WithdrawalPage(props: PageProps<"/[lang]/withdrawal">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/withdrawal`);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [user, requests, thisMonth, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.platformId },
      select: {
        email: true,
        kycStatus: true,
        balances: { select: { amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.platformId, kind: "WITHDRAWAL" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.transaction.count({
      where: {
        userId: session.user.platformId,
        kind: "WITHDRAWAL",
        createdAt: { gte: monthStart },
        status: { in: ["PENDING", "APPROVED"] },
      },
    }),
    cashierSettings(),
  ]);
  if (!user) redirect(`/${lang}/login`);

  const wallet = user.balances[0];
  const currency = wallet?.currency ?? "USD";
  const balance = Number(wallet?.amount ?? 0);
  const freeLeft = Math.max(0, settings.freeWithdrawalsPerMonth - thisMonth);

  return (
    <CabinetShell
      locale={lang}
      account={{
        email: user.email,
        balance: `${MONEY.format(balance)} ${currency}`,
        balanceLabel: wallet?.type === 4 ? "Practice account" : "Real account",
        verified: user.kycStatus === "APPROVED",
      }}
      bleed
    >
      <div className="bg-avalon-surface pb-16 pt-9">
        <div className="mx-auto w-full max-w-[1041px] px-6">
          <h1 className="text-center text-[26px] font-semibold text-avalon-text-strong">Withdrawal</h1>
          <p className="mt-3 text-center text-[14px] text-avalon-text">
            You have {freeLeft} free withdrawal{freeLeft === 1 ? "" : "s"} left until the end of the calendar month.
          </p>

          <div className="mt-8">
            <WithdrawalPanel
              methods={settings.methods.filter((method) => method.withdrawal)}
              balance={balance}
              currency={currency}
              minimum={settings.minWithdrawal}
              locale={lang}
            />
          </div>

          <section className="mt-9 rounded-[4px] bg-white px-8 py-8 shadow-avalon">
            <h2 className="text-center text-[18px] font-semibold text-avalon-text-strong">Withdrawal requests</h2>

            {requests.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="#acabac" strokeWidth="1.6" aria-hidden>
                  <circle cx="16" cy="16" r="11" />
                  <path d="M24 24l9 9M12 12l8 8M20 12l-8 8" />
                </svg>
                <p className="mt-4 text-[14px] text-avalon-text">No requests</p>
              </div>
            ) : (
              <table className="mt-6 w-full text-left text-[13px]">
                <thead className="text-[12px] uppercase tracking-wide text-avalon-text">
                  <tr>
                    {["Requested", "Method", "Destination", "Amount", "Status"].map((head) => (
                      <th key={head} className="pb-3 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-avalon-surface-hover">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-3 text-avalon-text">{request.createdAt.toLocaleString()}</td>
                      <td className="py-3 text-avalon-text-strong">{request.method}</td>
                      <td className="py-3 font-mono text-[12px] text-avalon-text">
                        {maskDestination(request.destination)}
                      </td>
                      <td className="py-3 text-avalon-text-strong">
                        {MONEY.format(Number(request.amount))} {request.currency}
                      </td>
                      <td className="py-3">
                        <span className={`rounded px-2 py-0.5 text-[12px] ${STATUS_TONE[request.status]}`}>
                          {request.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </CabinetShell>
  );
}
