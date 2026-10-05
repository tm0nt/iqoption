"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminCopy } from "@/i18n/admin";

/**
 * The rail's links, with the current one marked.
 *
 * A client component only because it needs the path. The order runs from what
 * the platform is, through what it offers, to what people did with it — which
 * is roughly the order someone new to the screen reads them in.
 */
export function AdminNav({ locale, copy }: { locale: string; copy: AdminCopy["shell"] }) {
  const pathname = usePathname();

  const groups: { items: { href: string; label: string }[] }[] = [
    {
      items: [
        { href: `/${locale}/admin`, label: copy.overview },
        { href: `/${locale}/admin/brand`, label: copy.brand },
        { href: `/${locale}/admin/settings`, label: copy.settings },
      ],
    },
    {
      items: [
        { href: `/${locale}/admin/assets`, label: copy.instruments },
        { href: `/${locale}/admin/content`, label: copy.content },
        { href: `/${locale}/admin/promo`, label: copy.promo },
      ],
    },
    {
      items: [
        { href: `/${locale}/admin/positions`, label: copy.deals },
        { href: `/${locale}/admin/cashier`, label: copy.cashier },
      ],
    },
  ];

  // `/admin` would otherwise be "current" on every page under it.
  const isCurrent = (href: string) =>
    href.endsWith("/admin") ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="px-3">
      {groups.map((group, index) => (
        <ul key={index} className={index ? "mt-1 border-t border-white/5 pt-1" : ""}>
          {group.items.map((item) => {
            const current = isCurrent(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`block rounded px-3 py-2 text-[13px] transition-colors ${
                    current ? "bg-white/[0.06] text-white" : "text-[#a0a1a6] hover:bg-white/[0.03] hover:text-white"
                  }`}
                  style={current ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ))}
    </nav>
  );
}
