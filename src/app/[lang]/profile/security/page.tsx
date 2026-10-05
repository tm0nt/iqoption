import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { ProfileHeader } from "@/components/cabinet/ProfileHeader";
import { ProfileSection } from "@/components/cabinet/ProfileSection";
import { SessionList, type SessionRow } from "@/components/cabinet/SessionList";
import { loadProfile, longDate } from "@/lib/cabinet/profile";
import { prisma } from "@/lib/db";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

/*
 * The tab title follows the page's language, which a static `metadata` cannot
 * do: it is evaluated once, before anyone has asked for a locale.
 */
export async function generateMetadata(props: PageProps<"/[lang]/profile/security">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).profile.safetySecurity };
}
export const dynamic = "force-dynamic";

/**
 * The browser a user-agent string claims to be.
 *
 * Deliberately crude. This is a label on a row so that someone can recognise
 * their own session, not a fingerprint, and the order matters: every Chromium
 * browser also says "Chrome", and Chrome itself says "Safari".
 */
function browserOf(agent: string | null) {
  if (!agent) return "unknown";
  if (/Edg\//.test(agent)) return "Edge";
  if (/OPR\//.test(agent)) return "Opera";
  if (/Firefox\//.test(agent)) return "Firefox";
  if (/Chrome\//.test(agent)) return "Chrome";
  if (/Safari\//.test(agent)) return "Safari";
  return "unknown";
}

/** "Today at 7:49 PM", or the date once it is no longer today. */
function when(date: Date) {
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay ? `Today at ${time}` : `${longDate(date)} at ${time}`;
}

export default async function SecurityPage(props: PageProps<"/[lang]/profile/security">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const { user, account, brand } = await loadProfile(lang, "security");

  const rows = await prisma.tradingSession.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const sessions: SessionRow[] = rows.map((row) => ({
    id: row.id,
    browser: browserOf(row.userAgent),
    ip: row.ip,
    when: when(row.lastSeenAt ?? row.createdAt),
    // The newest one is almost certainly the tab reading this page: a fresh
    // ssid is minted on every traderoom load.
    current: row.id === rows[0]?.id,
  }));

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <ProfileHeader locale={lang} createdAt={user.createdAt} id={user.id} />

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />

        <div className="min-w-0 grow">
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">{copy.profile.safetySecurity}</h1>

          <ProfileSection title={copy.security.twoStepTitle}>
            <p>{copy.security.twoStepBody}</p>
            <p className="text-avalon-border-muted">{copy.security.twoStepUnavailable}</p>
          </ProfileSection>

          <ProfileSection title={copy.security.passwordTitle}>
            <p>{copy.security.passwordBody}</p>
            <Link
              href={`/${lang}/change-password`}
              className="inline-block text-[14px] text-avalon-primary transition-colors hover:text-avalon-primary-hover"
            >
              {copy.security.passwordAction}
            </Link>
          </ProfileSection>

          <ProfileSection title={copy.security.sessionsTitle}>
            <p>{copy.security.sessionsBody}</p>
            <div className="pt-3">
              <SessionList sessions={sessions} locale={lang} />
            </div>
          </ProfileSection>

          <ProfileSection title={copy.security.historyTitle} last>
            <p>{copy.security.historyBody}</p>
            <p className="text-avalon-border-muted">{copy.security.historyNote}</p>
          </ProfileSection>
        </div>
      </div>
    </CabinetShell>
  );
}
