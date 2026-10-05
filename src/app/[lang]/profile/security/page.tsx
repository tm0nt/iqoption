import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileFrame } from "@/components/cabinet/ProfileFrame";
import { ProfileSection } from "@/components/cabinet/ProfileSection";
import { SessionList, type SessionRow } from "@/components/cabinet/SessionList";
import { loadProfile } from "@/lib/cabinet/profile";
import { formatLongDate, localeTag } from "@/lib/cabinet/format";
import { cabinetExtra, type CabinetExtraCopy } from "@/i18n/cabinet-extra";
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
function browserOf(agent: string | null, unknown: string) {
  if (!agent) return unknown;
  if (/Edg\//.test(agent)) return "Edge";
  if (/OPR\//.test(agent)) return "Opera";
  if (/Firefox\//.test(agent)) return "Firefox";
  if (/Chrome\//.test(agent)) return "Chrome";
  if (/Safari\//.test(agent)) return "Safari";
  return unknown;
}

/** "Today at 7:49 PM", or the date once it is no longer today — in the page's language. */
function when(date: Date, locale: string, t: CabinetExtraCopy["profile"]) {
  const time = date.toLocaleTimeString(localeTag(locale), { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  return sameDay ? t.todayAt(time) : t.dateAt(formatLongDate(date, locale), time);
}

export default async function SecurityPage(props: PageProps<"/[lang]/profile/security">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const x = cabinetExtra(lang).profile;
  const { user, account, brand } = await loadProfile(lang, "security");

  const rows = await prisma.tradingSession.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const sessions: SessionRow[] = rows.map((row) => ({
    id: row.id,
    browser: browserOf(row.userAgent, x.unknownBrowser),
    ip: row.ip,
    when: when(row.lastSeenAt ?? row.createdAt, lang, x),
    // The newest one is almost certainly the tab reading this page: a fresh
    // ssid is minted on every traderoom load.
    current: row.id === rows[0]?.id,
  }));

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <ProfileFrame locale={lang} createdAt={user.createdAt} id={user.id} title={copy.profile.safetySecurity}>
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
      </ProfileFrame>
    </CabinetShell>
  );
}
