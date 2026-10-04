"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  CloseIcon,
  LogoutIcon,
  OperationsCircleIcon,
  PersonalCircleIcon,
  PortfolioIcon,
  SupportCircleIcon,
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
};

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
  const items = [
    { href: `/${locale}/profile/personal`, label: "Personal Data", Icon: PersonalCircleIcon },
    { href: `/${locale}/verification`, label: "Verification", Icon: VerificationIcon, alert: !account.verified },
    { href: `/${locale}/portfolio`, label: "Portfolio", Icon: PortfolioIcon },
    { href: `/${locale}/withdrawal`, label: "Withdraw Funds", Icon: WithdrawCircleIcon },
    { href: `/${locale}/transactions`, label: "Balance History", Icon: OperationsCircleIcon },
    { href: `/${locale}/trading`, label: "Trading History", Icon: TradingCircleIcon },
    { href: `/${locale}/chat`, label: "Contact Support", Icon: SupportCircleIcon },
  ];

  return (
    <>
      {/* Closes on a click anywhere else, which is how the live drawer behaves. */}
      {open && <button type="button" aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40 cursor-default" />}

      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-[400px] max-w-full flex-col bg-white font-avalon shadow-[0_0_16px_1px_rgba(0,0,0,0.12)] transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-4 pt-5">
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avalon-surface-hover text-avalon-border-muted">
            <UserIcon width={18} height={18} />
          </span>
          <span className="truncate text-[13px] text-avalon-text">{account.email}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto text-avalon-text transition-colors hover:text-avalon-text-strong"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <div className="flex items-baseline justify-between px-6 pb-4">
          <span className="text-[13px] text-avalon-text">{account.balanceLabel}</span>
          <span className="text-[20px] font-semibold text-avalon-primary">{account.balance}</span>
        </div>

        {!account.verified && (
          <Link
            href={`/${locale}/verification`}
            onClick={onClose}
            className="mx-6 mb-4 flex items-center gap-2 rounded-[2px] bg-[#fdeff1] px-3 py-2 text-[13px] text-avalon-danger"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-avalon-danger text-[10px] font-bold text-white">
              !
            </span>
            Add personal info
          </Link>
        )}

        <div className="mb-2 flex gap-3 px-6">
          <Link
            href={`/${locale}/counting`}
            onClick={onClose}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
          >
            Deposit
          </Link>
          <Link
            href={`/${locale}/traderoom`}
            onClick={onClose}
            className="flex h-[50px] flex-1 items-center justify-center rounded-[2px] bg-avalon-primary text-[14px] font-medium text-white transition-colors hover:bg-avalon-primary-hover"
          >
            Trade Now
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
            Log Out
          </button>
        </nav>
      </aside>
    </>
  );
}
