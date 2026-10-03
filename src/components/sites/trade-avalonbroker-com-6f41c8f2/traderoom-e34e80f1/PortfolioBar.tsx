"use client";

import { ChevronIcon, PlusIcon } from "./icons";
import type { TraderoomCopy } from "@/i18n/traderoom";

interface PortfolioBarProps {
  copy: TraderoomCopy;
  expanded: boolean;
  onToggle: () => void;
}

/** 34px header band (#2c2d31) over a #17181a body, measured from the capture. */
export function PortfolioBar({ copy, expanded, onToggle }: PortfolioBarProps) {
  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex h-[34px] items-center justify-between bg-[#2c2d31] px-[18px]">
        <span className="text-[12px] font-semibold text-white">{copy.portfolio.title}</span>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-[7px] text-[12px] text-[#8b8c8e] hover:text-white"
        >
          {expanded ? copy.portfolio.hidePositions : copy.portfolio.showPositions}
          <ChevronIcon className={`size-[13px] transition-transform ${expanded ? "" : "rotate-180"}`} />
        </button>
      </div>
      {expanded ? (
        <div className="flex h-[168px] flex-col items-center justify-center gap-[13px] bg-[#17181a]">
          <p className="text-[12px] text-[#8b8c8e]">{copy.portfolio.empty}</p>
          <button
            type="button"
            className="flex items-center gap-[7px] rounded-[2px] bg-[#2c2d31] px-[14px] py-[7px] text-[12px] text-white hover:bg-[#36373b]"
          >
            <PlusIcon className="size-[11px]" />
            {copy.portfolio.selectAsset}
          </button>
        </div>
      ) : null}
    </div>
  );
}
