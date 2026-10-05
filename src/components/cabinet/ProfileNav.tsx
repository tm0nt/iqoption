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

  return (
    <nav className="w-[240px] shrink-0">
      <ul>
        {items.map(({ slug, label }) => {
          const href = `/${locale}/profile/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug} className="border-b border-dotted border-avalon-border-muted/60">
              <Link
                href={href}
                className={`block py-3 pr-3 text-[16px] font-medium transition-colors ${
                  active ? "text-avalon-primary" : "text-avalon-text hover:text-avalon-text-strong"
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
