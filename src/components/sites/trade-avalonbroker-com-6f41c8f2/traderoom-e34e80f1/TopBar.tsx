"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CaretIcon, CloseIcon, CopyIcon, DepositIcon, GridIcon, PlusIcon, ShareIcon, UserIcon } from "./icons";
import {
  ASSET_TABS,
  DEMO_AVAILABLE,
  DEMO_BALANCE,
  DEMO_COUNTRY,
  DEMO_EMAIL,
  DEMO_INVESTMENT,
  DEMO_REAL_BALANCE,
  DEMO_REGISTERED,
  DEMO_TOUR_PROGRESS,
  DEMO_USER_ID,
} from "./mockData";
import type { TraderoomCopy } from "@/i18n/traderoom";

const LOGO_SRC =
  "/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/images/avalon-logo.svg";

interface TopBarProps {
  copy: TraderoomCopy;
  activeTab: string;
  onSelectTab: (id: string) => void;
  onOpenAssets: () => void;
}

/** 74px top bar, 1px #494949 bottom edge. */
export function TopBar({ copy, activeTab, onSelectTab, onOpenAssets }: TopBarProps) {
  const [menu, setMenu] = useState<"balance" | "profile" | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  return (
    <header
      ref={rootRef}
      className="relative z-30 flex h-[74px] shrink-0 items-center gap-2 border-b border-[#494949] bg-black px-4"
    >
      <Image src={LOGO_SRC} alt="Avalon" width={160} height={40} priority className="h-[26px] w-[104px]" />

      <button
        type="button"
        aria-label="Layout"
        className="ml-3 flex size-[46px] items-center justify-center rounded-[3px] bg-[#1b1c1e] text-white hover:bg-[#232426]"
      >
        <GridIcon className="size-[22px]" />
      </button>

      <div className="flex items-end gap-[6px]">
        {ASSET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={cn(
              "group relative flex h-[46px] w-[122px] items-center gap-[7px] rounded-[3px] px-[9px] text-left",
              activeTab === tab.id
                ? "bg-[#1b1c1e] after:absolute after:inset-x-0 after:-bottom-[1px] after:h-[2px] after:bg-tr-buy"
                : "bg-[#121315] hover:bg-[#1b1c1e]",
            )}
          >
            <span
              className={cn(
                "flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                tab.badgeClass,
              )}
            >
              {tab.badge}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold leading-[15px] text-white">
                {tab.name}
              </span>
              <span className="block truncate text-[10px] leading-[13px] text-[#8b8c8e]">{tab.kind}</span>
            </span>
            <span className="absolute left-[3px] top-[2px] text-[#6a6b6d] opacity-0 transition-opacity group-hover:opacity-100">
              <CloseIcon className="size-[9px]" />
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={onOpenAssets}
          title={copy.topBar.openNewAsset}
          aria-label={copy.topBar.openNewAsset}
          className="flex size-[46px] items-center justify-center rounded-[3px] bg-[#1b1c1e] text-white hover:bg-[#232426]"
        >
          <PlusIcon className="size-[18px]" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMenu(menu === "profile" ? null : "profile")}
          className="flex items-center gap-[6px] rounded px-1 py-1 hover:bg-[#151618]"
        >
          <span className="relative flex size-[42px] items-center justify-center rounded-full bg-[#2a2b2d] text-[#8b8c8e]">
            <UserIcon className="size-[26px]" />
            <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90">
              <circle cx="22" cy="22" r="20.5" fill="none" stroke="#2a2b2d" strokeWidth="2.4" />
              <circle
                cx="22" cy="22" r="20.5" fill="none" stroke="#09af8e" strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray={`${(DEMO_TOUR_PROGRESS / 100) * 128.8} 128.8`}
              />
            </svg>
          </span>
          <CaretIcon className="size-[9px] text-[#8b8c8e]" />
        </button>

        <button
          type="button"
          onClick={() => setMenu(menu === "balance" ? null : "balance")}
          className="flex items-center gap-[7px] rounded px-2 py-2 hover:bg-[#151618]"
        >
          <span className="text-[19px] font-semibold leading-none text-white">{DEMO_BALANCE}</span>
          <CaretIcon className="size-[9px] text-[#8b8c8e]" />
        </button>

        <button
          type="button"
          className="ml-2 flex h-[42px] items-center gap-[8px] rounded-[3px] border border-tr-buy px-[18px] text-[14px] font-semibold text-tr-buy transition-colors hover:bg-tr-buy hover:text-black"
        >
          <DepositIcon className="size-[19px]" />
          {copy.topBar.deposit}
        </button>
      </div>

      {menu === "balance" ? <BalanceMenu copy={copy} /> : null}
      {menu === "profile" ? <ProfileMenu copy={copy} /> : null}
    </header>
  );
}

function BalanceMenu({ copy }: { copy: TraderoomCopy }) {
  return (
    <div className="absolute right-[150px] top-[74px] flex w-[610px] overflow-hidden rounded-b-[3px] bg-[#1b1c1e] text-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="flex-1 space-y-3 border-r border-[#2b2b2d] p-5">
        <Row label={copy.topBar.available} value={DEMO_AVAILABLE} />
        <Row label={copy.topBar.investment} value={DEMO_INVESTMENT} />
        <button type="button" className="flex items-center gap-[6px] pt-2 text-[#8b8c8e] hover:text-white">
          <span className="flex size-[13px] items-center justify-center rounded-full border border-current text-[9px]">?</span>
          {copy.topBar.whatIsThis}
        </button>
      </div>
      <div className="w-[280px]">
        <div className="flex items-center justify-between p-5">
          <div>
            <div className="text-[12px] font-semibold text-white">{copy.topBar.realAccount}</div>
            <div className="mt-[6px] text-[17px] font-semibold text-tr-buy">{DEMO_REAL_BALANCE}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Share" className="text-[#8b8c8e] hover:text-white">
              <ShareIcon className="size-[17px]" />
            </button>
            <button type="button" className="rounded-[2px] bg-[#2f3032] px-[14px] py-[7px] text-[12px] text-white hover:bg-[#3a3b3d]">
              {copy.topBar.deposit}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between bg-[#232426] p-5">
          <div>
            <div className="text-[12px] font-semibold text-white">{copy.topBar.practiceAccount}</div>
            <div className="mt-[6px] text-[17px] font-semibold text-white">{DEMO_BALANCE}</div>
          </div>
          <button type="button" className="rounded-[2px] bg-[#2f3032] px-[14px] py-[7px] text-[12px] text-white hover:bg-[#3a3b3d]">
            {copy.topBar.topUp}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({ copy }: { copy: TraderoomCopy }) {
  const links = [
    copy.profile.uploadPhoto,
    copy.profile.personalData,
    copy.profile.depositFunds,
    copy.profile.withdrawFunds,
    copy.profile.contactSupport,
    copy.profile.balanceHistory,
    copy.profile.tradingHistory,
    copy.profile.settings,
  ];
  return (
    <div className="absolute right-[150px] top-[74px] flex w-[620px] overflow-hidden rounded-b-[3px] bg-[#1b1c1e] text-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="flex-1 p-5">
        <div className="text-[12px] text-[#8b8c8e]">{DEMO_EMAIL}</div>
        <div className="mt-4 flex items-center gap-3 rounded-[3px] bg-[#232426] p-3">
          <span className="relative flex size-[42px] items-center justify-center text-[11px] font-semibold text-white">
            <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90">
              <circle cx="22" cy="22" r="20" fill="none" stroke="#3a3b3d" strokeWidth="3" />
              <circle cx="22" cy="22" r="20" fill="none" stroke="#09af8e" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(DEMO_TOUR_PROGRESS / 100) * 125.6} 125.6`} />
            </svg>
            {DEMO_TOUR_PROGRESS}%
          </span>
          <span className="text-[12px] leading-[17px] text-white">{copy.profile.tourProgress}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-[#2b2b2d] pt-4">
          <span className="size-[15px] rounded-full bg-tr-buy" aria-hidden />
          <span className="text-white">{DEMO_COUNTRY}</span>
        </div>
        <div className="mt-4 flex gap-12">
          <div>
            <div className="text-[11px] text-[#8b8c8e]">{copy.profile.dateRegistered}</div>
            <div className="mt-[5px] text-white">{DEMO_REGISTERED}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#8b8c8e]">{copy.profile.userId}</div>
            <div className="mt-[5px] flex items-center gap-2 text-white">
              {DEMO_USER_ID}
              <CopyIcon className="size-[13px] text-[#8b8c8e]" />
            </div>
          </div>
        </div>
      </div>
      <ul className="w-[230px] border-l border-[#2b2b2d] py-3">
        {links.map((l) => (
          <li key={l}>
            <button type="button" className="flex w-full items-center gap-[10px] px-5 py-[9px] text-left text-white hover:bg-[#232426]">
              <span className="size-[15px] shrink-0 rounded-[2px] bg-[#3a3b3d]" aria-hidden />
              {l}
            </button>
          </li>
        ))}
        <li className="mt-2 border-t border-[#2b2b2d] pt-2">
          <button type="button" className="flex w-full items-center gap-[10px] px-5 py-[9px] text-left text-white hover:bg-[#232426]">
            <span className="size-[15px] shrink-0 rounded-[2px] bg-[#3a3b3d]" aria-hidden />
            {copy.profile.logOut}
          </button>
        </li>
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-dotted border-[#3a3b3d] pb-[6px]">
      <span className="text-[#8b8c8e]">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
