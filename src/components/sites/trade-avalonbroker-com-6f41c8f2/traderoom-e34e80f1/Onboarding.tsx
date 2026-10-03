"use client";

import { CheckIcon, CloseIcon } from "./icons";
import { DEMO_TOUR_PROGRESS } from "./mockData";
import type { TraderoomCopy } from "@/i18n/traderoom";

/** The default-state checklist panel, shown until dismissed. */
export function Onboarding({ copy, onClose }: { copy: TraderoomCopy; onClose: () => void }) {
  const done = [
    copy.onboarding.createAccount,
    copy.onboarding.selectAsset,
    copy.onboarding.firstForecast,
    copy.onboarding.confirmEmail,
  ];
  const r = 20;
  const circumference = 2 * Math.PI * r;

  return (
    <section className="flex w-[260px] shrink-0 flex-col border-r border-[#4b4b4b] bg-black">
      <header className="flex items-start gap-[13px] px-[18px] py-[16px]">
        <span className="relative flex size-[44px] shrink-0 items-center justify-center text-[11px] font-semibold text-white">
          <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90">
            <circle cx="22" cy="22" r={r} fill="none" stroke="#2f3032" strokeWidth="3" />
            <circle
              cx="22" cy="22" r={r} fill="none" stroke="#09af8e" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(DEMO_TOUR_PROGRESS / 100) * circumference} ${circumference}`}
            />
          </svg>
          {DEMO_TOUR_PROGRESS}%
        </span>
        <p className="pt-[3px] text-[12px] leading-[16px] text-white">{copy.onboarding.title}</p>
        <button type="button" aria-label="Close" onClick={onClose} className="ml-auto text-[#8b8c8e] hover:text-white">
          <CloseIcon className="size-[12px]" />
        </button>
      </header>

      <ul>
        {done.map((label) => (
          <li key={label} className="flex items-center gap-[12px] border-t border-[#1e1f21] px-[18px] py-[14px]">
            <CheckIcon className="size-[19px] shrink-0 text-tr-buy" />
            <span className="text-[12px] text-[#8b8c8e] line-through">{label}</span>
          </li>
        ))}
        <li className="flex items-center gap-[12px] border-t border-[#1e1f21] px-[18px] py-[14px]">
          <span className="flex size-[19px] shrink-0 items-center justify-center rounded-full border border-[#8b8c8e] text-[10px] text-[#8b8c8e]">
            5
          </span>
          <span className="text-[12px] text-white">{copy.onboarding.topUp}</span>
        </li>
      </ul>

      <div className="px-[18px] pt-[14px]">
        <button
          type="button"
          className="w-full rounded-[2px] bg-tr-buy py-[11px] text-[12px] font-bold tracking-[0.04em] text-black transition-colors hover:bg-[#00aa89]"
        >
          {copy.onboarding.deposit}
        </button>
      </div>
    </section>
  );
}
