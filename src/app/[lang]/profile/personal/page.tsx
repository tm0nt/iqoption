import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { ProfileHeader } from "@/components/cabinet/ProfileHeader";
import { ProfilePhotoModal } from "@/components/cabinet/ProfilePhotoModal";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

/*
 * The tab title follows the page's language, which a static `metadata` cannot
 * do: it is evaluated once, before anyone has asked for a locale.
 */
export async function generateMetadata(props: PageProps<"/[lang]/profile/personal">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).nav.personalData };
}
export const dynamic = "force-dynamic";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "02.10.2026", as the account-statement range writes it. */
function shortDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** A section separated from the next by the hairline the live page uses. */
function Row({ children }: { children: React.ReactNode }) {
  return <section className="border-b border-avalon-surface-hover py-6">{children}</section>;
}

export default async function PersonalDataPage(props: PageProps<"/[lang]/profile/personal">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const d = cabinetCopy(lang).personal;

  /*
   * The photo dialog is a URL, not component state — which is how the live site
   * opens it, and what makes it survive a reload and a shared address.
   */
  const query = await props.searchParams;
  const photoOpen = query.act === "changephoto";

  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/profile/personal`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      activeBalanceId: true,
      balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
    },
  });
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const balance = wallet ? `${MONEY.format(Number(wallet.amount))} ${wallet.currency}` : "0.00";
  /* The statement defaults to the day before yesterday through today, which is
     the window the live page opens on. */
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 1);

  return (
    <CabinetShell
      locale={lang}
      account={{
        email: user.email,
        balance,
        // Type 4 is the practice wallet; anything else is real money.
        balanceLabel: wallet?.type === 4 ? cabinetCopy(lang).account.practice : cabinetCopy(lang).account.real,
        verified: user.emailVerified !== null,
      }}
    >
      <ProfileHeader locale={lang} createdAt={user.createdAt} id={user.id} />

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />

        <div className="min-w-0 grow">
          <Row>
            <div className="flex flex-col items-center">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Your profile photo"
                  className="size-[90px] rounded-full object-cover"
                />
              ) : (
                <span className="flex size-[90px] items-center justify-center rounded-full bg-avalon-surface-hover text-avalon-border-muted">
                  <svg width="28" height="24" viewBox="0 0 28 24" fill="currentColor" aria-hidden>
                    <path d="M26 4h-5l-1.6-2.4A2 2 0 0 0 17.7.6h-7.4a2 2 0 0 0-1.7.9L7 4H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-12 15a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zm0-11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" />
                  </svg>
                </span>
              )}

              <Link
                href={`/${lang}/profile/personal?act=changephoto`}
                className="mt-5 flex h-[42px] w-[234px] items-center justify-center rounded-[2px] border border-dashed border-avalon-border-muted text-[14px] text-avalon-text transition-colors hover:border-avalon-primary hover:text-avalon-primary"
              >
                {user.avatarUrl ? d.changePhoto : d.uploadPhoto}
              </Link>

              <p className="mt-4 text-center text-[13px] text-avalon-text">
                {d.photoNote}
              </p>
            </div>
          </Row>

          <Row>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-avalon-text-strong">
                  {d.statement}:{" "}
                  <span className="font-medium text-avalon-text">
                    {shortDate(from)} — {shortDate(today)}
                  </span>
                </h2>
                <p className="mt-2 max-w-[340px] text-[13px] leading-[22px] text-avalon-text">
                  {d.statementBody}
                </p>
              </div>

              <Link
                href={`/${lang}/transactions`}
                className="flex h-[42px] shrink-0 items-center gap-2 rounded-[2px] border border-avalon-surface-hover px-4 text-[14px] text-avalon-text-strong transition-colors hover:border-avalon-primary hover:text-avalon-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                  <rect x="1" y="2.5" width="14" height="12.5" rx="1.5" />
                  <path d="M1 6h14M5 1v3M11 1v3" />
                </svg>
                {d.createRequest}
              </Link>
            </div>
          </Row>

          <Row>
            <h2 className="text-[16px] font-semibold text-avalon-text-strong">
              {d.emailAddress}: <span className="font-medium text-avalon-text">{user.email}</span>
              {user.emailVerified && (
                <span className="ml-1.5 inline-flex size-4 translate-y-0.5 items-center justify-center rounded-full bg-avalon-primary text-[10px] text-white">
                  ✓
                </span>
              )}
            </h2>
            <p className="mt-2 text-[13px] text-avalon-text">
              {d.emailNote}
            </p>
            <Link
              href={`/${lang}/profile/settings`}
              className="mt-4 inline-block text-[14px] text-avalon-primary hover:underline"
            >
              {d.changeEmail}
            </Link>
          </Row>

          <Row>
            <h2 className="text-[16px] font-semibold text-avalon-text-strong">{d.contactInfo}:</h2>

            {user.phone && user.emailVerified ? (
              <dl className="mt-4 grid grid-cols-[150px_1fr] gap-y-3 text-[14px]">
                <dt className="text-avalon-text">Phone</dt>
                <dd className="text-avalon-text-strong">{user.phone}</dd>
              </dl>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center bg-avalon-surface px-6 py-12 text-center">
                <p className="max-w-[260px] text-[14px] leading-[18px] text-avalon-text">
                  {d.noContact}
                </p>
                <Link href={`/${lang}/verification`} className="mt-1 text-[14px] text-avalon-primary hover:underline">
                  {d.verifyPrompt}
                </Link>
              </div>
            )}

            <p className="mt-4 text-[12px] text-avalon-text">
              {d.rectify}{" "}
              <a href="mailto:support@avalonbroker.com" className="text-avalon-primary hover:underline">
                support@avalonbroker.com
              </a>
              .
            </p>
          </Row>

          <section className="py-6">
            <h2 className="text-[16px] font-semibold text-avalon-text-strong">{d.accessMyData}</h2>
            <p className="mt-2 text-[13px] text-avalon-text">
              {d.byCategory}
            </p>
            <Link
              href={`/${lang}/profile/personal`}
              className="mt-4 inline-block text-[14px] text-avalon-primary hover:underline"
            >
              {d.showMyData}
            </Link>
          </section>
        </div>
      </div>
      {photoOpen && (
        <ProfilePhotoModal closeHref={`/${lang}/profile/personal`} hasPhoto={Boolean(user.avatarUrl)} />
      )}
    </CabinetShell>
  );
}
