import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { ProfileHeader } from "@/components/cabinet/ProfileHeader";
import { AccountSettingsForm } from "@/components/cabinet/AccountSettingsForm";
import { loadProfile } from "@/lib/cabinet/profile";
import { isLocale } from "@/i18n/avalon";
import { cabinetCopy } from "@/i18n/cabinet";

/*
 * The tab title follows the page's language, which a static `metadata` cannot
 * do: it is evaluated once, before anyone has asked for a locale.
 */
export async function generateMetadata(props: PageProps<"/[lang]/profile/settings">): Promise<Metadata> {
  const { lang } = await props.params;
  return { title: cabinetCopy(lang).profile.accountSettings };
}
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage(props: PageProps<"/[lang]/profile/settings">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const copy = cabinetCopy(lang);
  const { user, account, brand } = await loadProfile(lang, "settings");

  return (
    <CabinetShell locale={lang} account={account} brand={brand}>
      <ProfileHeader locale={lang} createdAt={user.createdAt} id={user.id} />

      <div className="mt-6 flex gap-12">
        <ProfileNav locale={lang} />
        <div className="min-w-0 grow">
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">{copy.profile.accountSettings}</h1>
          <AccountSettingsForm
            publicProfile={user.publicProfile}
            /* Nobody has rolled one yet: the e-mail's local part stands in
               until they do, rather than an empty line where a name goes. */
            displayName={user.displayName ?? user.email.split("@")[0]}
            deletionRequested={user.deletionRequestedAt !== null}
            locale={lang}
          />
        </div>
      </div>
    </CabinetShell>
  );
}
