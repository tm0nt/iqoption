import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { AccountSettingsForm } from "@/components/cabinet/AccountSettingsForm";
import { loadProfile, longDate } from "@/lib/cabinet/profile";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Account Settings" };
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage(props: PageProps<"/[lang]/profile/settings">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const { user, account } = await loadProfile(lang, "settings");

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
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">Account Settings</h1>
          <AccountSettingsForm
            publicProfile={user.publicProfile}
            /* Nobody has rolled one yet: the e-mail's local part stands in
               until they do, rather than an empty line where a name goes. */
            displayName={user.displayName ?? user.email.split("@")[0]}
            deletionRequested={user.deletionRequestedAt !== null}
          />
        </div>
      </div>
    </CabinetShell>
  );
}
