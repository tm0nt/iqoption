import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { ProfileHeader } from "@/components/cabinet/ProfileHeader";
import { NotificationForm } from "@/components/cabinet/NotificationForm";
import { loadProfile } from "@/lib/cabinet/profile";
import { readSettings } from "@/lib/cabinet/notifications";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

/*
 * The tab title follows the page's language, which a static `metadata` cannot
 * do: it is evaluated once, before anyone has asked for a locale.
 */
export async function generateMetadata(props: PageProps<"/[lang]/profile/subscribes">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).profile.notificationSettings };
}
export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage(props: PageProps<"/[lang]/profile/subscribes">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const { user, account, brand } = await loadProfile(lang, "subscribes");
  const settings = readSettings(user.notifications);

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <ProfileHeader locale={lang} createdAt={user.createdAt} id={user.id} />

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />
        <div className="min-w-0 grow">
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">{copy.profile.notificationSettings}</h1>
          <NotificationForm settings={settings} locale={lang} />
        </div>
      </div>
    </CabinetShell>
  );
}
