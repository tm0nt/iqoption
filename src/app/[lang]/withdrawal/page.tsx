import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { WithdrawalPanel } from "@/components/cabinet/WithdrawalPanel";
import { RequestHistory, type RequestRow } from "@/components/cabinet/RequestHistory";
import { cashierSettings, freeWithdrawalsLeft } from "@/lib/cabinet/cashier";
import { loadCabinet } from "@/lib/cabinet/profile";
import { formatDateTime, formatMoney, maskDestination } from "@/lib/cabinet/format";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";

export async function generateMetadata(props: PageProps<"/[lang]/withdrawal">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.withdrawFunds };
}
export const dynamic = "force-dynamic";

/**
 * The withdrawal page.
 *
 * Everything on it is about the real wallet — the balance shown, the limit
 * checked, the money held — because that is the only wallet money leaves from.
 */
export default async function WithdrawalPage(props: PageProps<"/[lang]/withdrawal">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const x = cabinetExtra(lang).cashier;

  const { user, account, brand, real } = await loadCabinet(lang, `/${lang}/withdrawal`);
  const settings = await cashierSettings();
  const [requests, freeLeft] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, kind: "WITHDRAWAL" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    freeWithdrawalsLeft(user.id, settings),
  ]);

  const currency = real?.currency ?? "USD";
  const balance = Number(real?.amount ?? 0);
  const money = (n: number) => formatMoney(n, currency, lang);
  const charges = settings.withdrawalFeePercent > 0 || settings.withdrawalFeeFixed > 0;
  const feeDescription = [
    settings.withdrawalFeePercent > 0 ? `${settings.withdrawalFeePercent}%` : null,
    settings.withdrawalFeeFixed > 0 ? money(settings.withdrawalFeeFixed) : null,
  ]
    .filter(Boolean)
    .join(" + ");

  const rows: RequestRow[] = requests.map((row) => ({
    id: row.id,
    when: formatDateTime(row.createdAt, lang),
    method: row.method,
    destination: maskDestination(row.destination),
    amount: formatMoney(Number(row.amount), row.currency, lang),
    extra: Number(row.fee) > 0 ? `${x.fee} ${formatMoney(Number(row.fee), row.currency, lang)}` : null,
    status: row.status,
  }));

  return (
    <CabinetShell locale={lang} account={account} brand={brand} bleed>
      <div className="bg-avalon-surface pb-16 pt-8 sm:pt-9">
        <div className="mx-auto w-full max-w-[1041px] px-4 sm:px-6">
          <h1 className="text-center text-[24px] font-semibold text-avalon-text-strong sm:text-[26px]">{copy.nav.withdrawFunds}</h1>
          <p className="mt-3 text-center text-[14px] text-avalon-text">
            {copy.personal.freeWithdrawals(freeLeft)}
            {charges && <> {x.feeAfterFree(feeDescription)}</>}
          </p>

          <div className="mt-8">
            <WithdrawalPanel
              methods={settings.methods.filter((method) => method.withdrawal)}
              balance={balance}
              currency={currency}
              minimum={settings.minWithdrawal}
              maximum={settings.maxWithdrawal}
              freeLeft={freeLeft}
              feePercent={settings.withdrawalFeePercent}
              feeFixed={settings.withdrawalFeeFixed}
              kycBlocked={settings.requireKycForWithdrawal && user.kycStatus !== "APPROVED"}
              locale={lang}
            />
          </div>

          <div className="mt-9">
            <RequestHistory title={x.yourWithdrawals} rows={rows} locale={lang} showDestination />
          </div>
        </div>
      </div>
    </CabinetShell>
  );
}
