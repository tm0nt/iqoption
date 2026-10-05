"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import type { AdminCopy } from "@/i18n/admin";
import type { AdminMoneyCopy } from "@/i18n/admin-money";
import { AdminNav, type NavBadges } from "./AdminNav";

/**
 * The frame around every admin page: the rail, and on a phone the bar that
 * opens it.
 *
 * On a wide screen the rail is always there and the page has the rest of the
 * width, which is what tables need. Below that the rail becomes a drawer behind
 * a menu button — a 232px column on a 390px screen leaves the page nothing.
 */
export function AdminShell({
  locale,
  brand,
  email,
  copy,
  money,
  badges,
  children,
}: {
  locale: string;
  brand: { name: string; logoUrl: string; primary: string };
  email: string;
  copy: AdminCopy["shell"];
  money: AdminMoneyCopy["nav"];
  badges: NavBadges;
  children: ReactNode;
}) {
  // Closed again by every link in the rail, through `onNavigate`.
  const [open, setOpen] = useState(false);

  const mark = (
    <Link href={`/${locale}/admin`} className="flex min-w-0 items-center gap-2.5">
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt="" className="h-6 max-w-[110px] object-contain" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[13px] font-bold text-white">
          {brand.name.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight tracking-tight text-white">{brand.name}</span>
        <span className="block text-[11px] leading-tight text-[#6f7076]">{copy.title}</span>
      </span>
    </Link>
  );

  const rail = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
        {mark}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={money.close}
          className="rounded p-1 text-[#a0a1a6] hover:bg-white/[0.06] hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 grow overflow-y-auto">
        <AdminNav locale={locale} copy={copy} money={money} badges={badges} onNavigate={() => setOpen(false)} />
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3.5">
        <p className="truncate px-1 text-[11px] text-[#6f7076]" title={email}>
          {copy.signedInAs}
          <span className="block truncate text-[12px] text-[#a0a1a6]">{email}</span>
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <Link
            href={`/${locale}/traderoom`}
            className="flex h-8 grow items-center justify-center gap-1.5 rounded-md border border-white/10 text-[12px] text-[#c4c5ca] transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <ExternalLink size={13} />
            {copy.traderoom}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: `/${locale}/login` })}
            title={money.signOut}
            aria-label={money.signOut}
            className="flex size-8 items-center justify-center rounded-md border border-white/10 text-[#a0a1a6] transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#0b0c0f] text-[#e8e8ea] lg:flex"
      /*
       * The accent is a variable rather than a Tailwind colour: it comes from a
       * row an administrator edits, and Tailwind's palette is decided when the
       * app is built.
       */
      style={{ "--accent": brand.primary } as React.CSSProperties}
    >
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-white/[0.06] bg-[#111216] lg:block">
        {rail}
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#111216]/95 px-4 backdrop-blur lg:hidden">
        {mark}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={money.menu}
          className="relative rounded-md p-2 text-[#c4c5ca] hover:bg-white/[0.06]"
        >
          <Menu size={20} />
          {badges.cashier + badges.payouts + badges.affiliates + badges.kyc > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--accent)]" />
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={money.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-white/[0.06] bg-[#111216] shadow-2xl">
            {rail}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
