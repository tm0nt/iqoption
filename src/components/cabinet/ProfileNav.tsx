"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The sub-navigation down the left of every profile page.
 *
 * Each item is 48px tall with a hairline under it, and the one you are on is
 * teal — the live site marks the current page by colour alone, with no bar or
 * background, which is why the active link carries no other treatment here.
 */
const ITEMS = [
  { slug: "personal", label: "Personal Data" },
  { slug: "subscribes", label: "Notification Settings" },
  { slug: "settings", label: "Account Settings" },
  { slug: "socials", label: "Social Networks" },
  { slug: "payments", label: "Payment Methods" },
  { slug: "security", label: "Safety & Security" },
];

export function ProfileNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-[240px] shrink-0">
      <ul>
        {ITEMS.map(({ slug, label }) => {
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
