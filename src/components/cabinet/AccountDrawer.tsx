"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { cabinetCopy } from "@/i18n/cabinet";
import { cabinetExtra } from "@/i18n/cabinet-extra";
import {
  CloseIcon,
  LogoutIcon,
  OperationsCircleIcon,
  PersonalCircleIcon,
  PortfolioIcon,
  TradingCircleIcon,
  UserIcon,
  VerificationIcon,
  WithdrawCircleIcon,
} from "./icons";

export type DrawerAccount = {
  email: string;
  balance: string;
  balanceLabel: string;
  verified: boolean;
  /** Nothing submitted for verification yet. Absent means "go by `verified`". */
  needsDetails?: boolean;
  avatarUrl?: string | null;
};

/** Two people shaking hands, drawn to match the other icons in this list. */
function AffiliateIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" className={className} aria-hidden>
      <circle cx="6" cy="5.5" r="2.5" />
      <circle cx="12.5" cy="6.5" r="2" />
      <path d="M1.5 15c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5M10.8 11c.5-.3 1.1-.5 1.7-.5 2.2 0 4 1.5 4 4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The account panel the avatar opens.
 *
 * It is the only navigation that reaches every cabinet page, so the list here
 * is the site map: changing it changes where people can get to. The order is
 * the live site's, which runs from who you are, through what you hold, to how
 * you get money out.
 */
export function AccountDrawer({
  account,
  locale,
  open,
  onClose,
}: {
  account: DrawerAccount;
  locale: string;
  open: boolean;
  onClose: () => void;
}) {
  /*
   * No "Contact Support" row.
   *
   * It used to point at `/${locale}/chat`, which has never existed here — a
   * 404 behind the one item someone clicks when something is already wrong. On
   * the live platform that path redirects to the profile and the conversation
   * happens in a widget in the corner, and there is no widget here. The row
   * comes back when there is a channel for it to open; an item that goes
   * nowhere is worse than no item.
   */
  const copy = cabinetCopy(locale).nav;
  const extra = cabinetExtra(locale).profile;
  const needsDetails = account.needsDetails ?? !account.verified;

  const items = [
    { href: `/${locale}/profile/personal`, label: copy.personalData, Icon: PersonalCircleIcon },
    { href: `/${locale}/verification`, label: copy.verification, Icon: VerificationIcon, alert: !account.verified },
    { href: `/${locale}/portfolio`, label: copy.portfolio, Icon: PortfolioIcon },
    { href: `/${locale}/withdrawal`, label: copy.withdrawFunds, Icon: WithdrawCircleIcon },
    { href: `/${locale}/transactions`, label: copy.balanceHistory, Icon: OperationsCircleIcon },
    { href: `/${locale}/trading`, label: copy.tradingHistory, Icon: TradingCircleIcon },
    { href: `/${locale}/affiliate`, label: extra.affiliateProgram, Icon: AffiliateIcon },
  ];

  return (
    <>
      {/* Closes on a click anywhere else, which is how the live drawer behaves. */}
      {open && <button type="button" aria-label={copy.closeMenu} onClick={onClose} className="fixed inset-0 z-40 cursor-default" />}

      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-full flex-col bg-white font-avalon shadow-[0_0_16px_1px_rgba(0,0,0,0.12)] transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-4 pt-5">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avalon-surface-hover text-avalon-border-muted">
            {account.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={account.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <UserIcon width={18} height={18} />
            )}
          </span>
          <span className="truncate text-[13px] text-avalon-text">{account.email}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="ml-auto text-avalon-text transition-colors hover:text-avalon-text-strong"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className="flex items-baseline justify-between px-6 pb-4">
          <span className="text-[13px] text-avalon-text">{account.balanceLabel}</span>
          <span className="text-[20px] font-semibold text-avalon-primary">{account.balance}</span>
        </div>

        {needsDetails && (
          <Link
            href={`/${locale}/verification`}
            onClick={onClose}
            className="mx-6 mb-4 flex items-center gap-2 rounded-[2px] bg-[#fdeff1] px-3 py-2 text-[13px] text-avalon-danger"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-avalon-danger text-[10px] font-bold text-white">
              !
            </span>
            {copy.addPersonalInfo}
          </Link>
        )}

        <div className="mb-2 flex gap-3 px-6">
          <Link
            href={`/${locale}/counting`}
            onClick={onClose}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
          >
            {copy.deposit}
          </Link>
          <Link
            href={`/${locale}/traderoom`}
            onClick={onClose}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
          >
            {copy.tradeNow}
          </Link>
        </div>

        <nav className="mt-4 overflow-y-auto px-6">
          <ul>
            {items.map(({ href, label, Icon, alert }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-[11px] text-[14px] text-avalon-text-strong transition-colors hover:text-avalon-primary"
                >
                  <Icon className="shrink-0 text-avalon-text" />
                  {label}
                  {alert && <span className="ml-auto size-1.5 rounded-full bg-avalon-danger" />}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-2 border-t border-avalon-surface-hover" />

          <button
            type="button"
            onClick={() => signOut({ redirectTo: `/${locale}/login` })}
            className="flex w-full items-center gap-3 py-[11px] text-[14px] text-avalon-text-strong transition-colors hover:text-avalon-primary"
          >
            <LogoutIcon className="shrink-0 text-avalon-text" width={15} height={16} />
            {copy.logOut}
          </button>
        </nav>
      </aside>
    </>
  );
}
