"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  Braces,
  ChartCandlestick,
  ChartLine,
  Handshake,
  LayoutDashboard,
  Newspaper,
  Palette,
  Settings2,
  SlidersHorizontal,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminCopy } from "@/i18n/admin";
import type { AdminMoneyCopy } from "@/i18n/admin-money";

/** What the layout counted, so the rail can say where work is waiting. */
export type NavBadges = { cashier: number; payouts: number; affiliates: number; kyc: number };

type Item = { href: string; label: string; Icon: LucideIcon; badge?: number };

/**
 * The rail's links, grouped, with the current one marked.
 *
 * A client component only because it needs the path. Grouped by what an
 * operator is doing — money, affiliates, the platform itself, what it shows,
 * how it is set up — so the screen someone is looking for is under the word
 * they are thinking of. The badges are the queues: a number on a link is work
 * waiting behind it.
 */
export function AdminNav({
  locale,
  copy,
  money,
  badges,
  onNavigate,
}: {
  locale: string;
  copy: AdminCopy["shell"];
  money: AdminMoneyCopy["nav"];
  badges: NavBadges;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;

  const groups: { heading?: string; items: Item[] }[] = [
    { items: [{ href: base, label: copy.overview, Icon: LayoutDashboard }] },
    {
      heading: money.finance,
      items: [
        { href: `${base}/cashier`, label: copy.cashier, Icon: ArrowLeftRight, badge: badges.cashier },
        { href: `${base}/finance`, label: money.limits, Icon: SlidersHorizontal },
        { href: `${base}/users`, label: money.users, Icon: Users, badge: badges.kyc },
      ],
    },
    {
      heading: money.affiliates,
      items: [
        { href: `${base}/affiliates`, label: money.affiliateList, Icon: Handshake, badge: badges.affiliates },
        { href: `${base}/affiliates/payouts`, label: money.payouts, Icon: BadgeDollarSign, badge: badges.payouts },
        { href: `${base}/affiliates/program`, label: money.program, Icon: Settings2 },
      ],
    },
    {
      heading: money.platform,
      items: [
        { href: `${base}/positions`, label: copy.deals, Icon: ChartCandlestick },
        { href: `${base}/assets`, label: copy.instruments, Icon: ChartLine },
      ],
    },
    {
      heading: money.content,
      items: [
        { href: `${base}/content`, label: copy.content, Icon: Newspaper },
        { href: `${base}/promo`, label: copy.promo, Icon: Ticket },
      ],
    },
    {
      heading: money.configuration,
      items: [
        { href: `${base}/brand`, label: copy.brand, Icon: Palette },
        { href: `${base}/settings`, label: money.advanced, Icon: Braces },
      ],
    },
  ];

  /*
   * The deepest match wins. `/admin` would otherwise be current on every page
   * under it, and `/admin/affiliates` on the payouts page beside it.
   */
  const all = groups.flatMap((group) => group.items.map((item) => item.href));
  const current =
    all
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null;

  return (
    <nav className="space-y-4 px-3 pb-4">
      {groups.map((group, index) => (
        <div key={group.heading ?? index}>
          {group.heading && (
            <p className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5c5d63]">
              {group.heading}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, Icon, badge }) => {
              const active = href === current;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-colors ${
                      active ? "bg-white/[0.07] text-white" : "text-[#a0a1a6] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      className={active ? "text-[var(--accent)]" : "text-[#6f7076] group-hover:text-[#a0a1a6]"}
                    />
                    <span className="min-w-0 grow truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="rounded-full bg-[var(--accent)] px-1.5 text-[10.5px] font-semibold leading-[17px] text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
