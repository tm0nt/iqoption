import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabinetShell } from "@/components/cabinet/CabinetShell";
import { ProfileNav } from "@/components/cabinet/ProfileNav";
import { loadProfile, longDate } from "@/lib/cabinet/profile";
import { isLocale } from "@/i18n/avalon";

export const metadata: Metadata = { title: "Social Networks" };
export const dynamic = "force-dynamic";

/**
 * Social sign-in.
 *
 * This platform authenticates with an e-mail and a password and nothing else —
 * there is no Google provider configured in src/auth.ts — so the row says it
 * is unavailable rather than offering a Link button that cannot link. A
 * control that does nothing is worse than a sentence that explains why.
 */
export default async function SocialNetworksPage(props: PageProps<"/[lang]/profile/socials">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();

  const { user, account } = await loadProfile(lang, "socials");

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
          <h1 className="pb-2 text-[28px] font-semibold text-avalon-text-strong">Social Networks</h1>

          <p className="max-w-[640px] pt-5 text-[14px] leading-[22px] text-avalon-text">
            You can use your social media accounts to log in to our site, as well as to share your
            trading achievements with your friends.
          </p>

          <div className="flex items-center gap-4 pt-8">
            <span className="flex size-[52px] items-center justify-center rounded-[4px] border border-avalon-surface-hover">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
              </svg>
            </span>

            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-avalon-text-strong">Google</p>
              <p className="text-[14px] text-avalon-text">Account not linked</p>
            </div>

            <span
              className="ml-auto text-[14px] text-avalon-border-muted"
              title="This platform signs in with an email and a password only."
            >
              Unavailable
            </span>
          </div>

          <p className="max-w-[640px] pt-8 text-[13px] leading-5 text-avalon-text">
            Signing in with a social account is not set up on this platform. Your account uses the
            email address and password you registered with.
          </p>
        </div>
      </div>
    </CabinetShell>
  );
}
