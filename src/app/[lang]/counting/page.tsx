import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { DepositPanel } from "@/components/cabinet/DepositPanel";
import { cashierSettings } from "@/lib/cabinet/cashier";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

export async function generateMetadata(props: PageProps<"/[lang]/counting">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.deposit };
}
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * What the live page answers below the form.
 *
 * Rewritten for what is true here rather than copied: the live answers describe
 * bank timings and a support desk that this platform does not have, and an FAQ
 * that answers for someone else is worse than none.
 */
export default async function DepositPage(props: PageProps<"/[lang]/counting">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const f = cabinetCopy(lang).faq;

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/counting`);

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.platformId },
      select: {
        email: true,
        kycStatus: true,
        activeBalanceId: true,
        balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
      },
    }),
    cashierSettings(),
  ]);
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const currency = wallet?.currency ?? "USD";

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
      <h1 className="pt-16 text-[34px] font-normal leading-[52px] text-avalon-text">{cabinetCopy(lang).nav.deposit}</h1>

      <div className="mt-5">
        <DepositPanel
          methods={settings.methods.filter((method) => method.deposit)}
          presets={settings.depositPresets}
          currency={currency}
          minimum={settings.minDeposit}
          locale={lang}
        />
      </div>

      <section className="mt-16 pb-16">
        <h2 className="text-center text-[20px] font-bold text-avalon-text">{f.heading}</h2>

        <dl className="mx-auto mt-8 max-w-[968px]">
          {f.items.map((item) => (
            <div key={item.q} className="border-b border-avalon-surface-hover py-5">
              <dt className="text-[15px] font-medium text-avalon-text-strong">{item.q}</dt>
              <dd className="mt-2 text-[14px] leading-[22px] text-avalon-text">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </CabinetShell>
  );
}
