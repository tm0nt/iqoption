"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cabinetCopy } from "@/i18n/cabinet";

/**
 * The sub-navigation down the left of every profile page.
 *
 * Each item is 48px tall with a hairline under it, and the one you are on is
 * teal — the live site marks the current page by colour alone, with no bar or
 * background, which is why the active link carries no other treatment here.
 */
/** The six, in the order the live page lists them. */
const SLUGS = ["personal", "subscribes", "settings", "socials", "payments", "security"] as const;

export function ProfileNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const copy = cabinetCopy(locale);

  const items = SLUGS.map((slug) => ({
    slug,
    label: {
      personal: copy.nav.personalData,
      subscribes: copy.profile.notificationSettings,
      settings: copy.profile.accountSettings,
      socials: copy.profile.socialNetworks,
      payments: copy.profile.paymentMethods,
      security: copy.profile.safetySecurity,
    }[slug],
  }));

  /*
   * Below `md` the list runs across the top and scrolls sideways, the way a
   * phone shows tabs; from `md` it is the live site's column.
   */
  return (
    <nav className="-mx-4 shrink-0 overflow-x-auto px-4 md:mx-0 md:w-[240px] md:overflow-visible md:px-0">
      <ul className="flex gap-5 border-b border-avalon-surface-hover md:block md:border-b-0">
        {items.map(({ slug, label }) => {
          const href = `/${locale}/profile/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug} className="shrink-0 md:border-b md:border-dotted md:border-avalon-border-muted/60">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 py-3 text-[14px] font-medium transition-colors md:mb-0 md:whitespace-normal md:border-b-0 md:pr-3 md:text-[16px] ${
                  active
                    ? "border-avalon-primary text-avalon-primary"
                    : "border-transparent text-avalon-text hover:text-avalon-text-strong"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
