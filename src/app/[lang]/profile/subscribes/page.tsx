import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { NotificationForm } from "@/components/cabinet/NotificationForm";
import { loadProfile, longDate } from "@/lib/cabinet/profile";
import { readSettings } from "@/lib/cabinet/notifications";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Notification Settings" };
export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage(props: PageProps<"/[lang]/profile/subscribes">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const { user, account } = await loadProfile(lang, "subscribes");
  const settings = readSettings(user.notifications);

  return (
    <CabinetShell locale={lang} account={account}>
      <p className="pt-7 text-right text-[12px] leading-5 text-avalon-text">
        Date registered: {longDate(user.createdAt)}
        <br />
        Profile ID: {user.id}
      </p>

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />
        <div className="min-w-0 grow">
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">Notification Settings</h1>
          <NotificationForm settings={settings} />
        </div>
      </div>
    </CabinetShell>
  );
}
