"use client";

import { useState } from "react";
import { TRADE_DEFAULTS, buildCandles } from "./mockData";
import type { TraderoomCopy } from "@/i18n/traderoom";

const LAST = buildCandles(34)[33].c;

/**
 * Right-hand trading column. Measured at 120px wide with 110px controls;
 * placing an order is out of scope, so the buttons are inert.
 */
export function TradePanel({ copy }: { copy: TraderoomCopy }) {
  const [invest, setInvest] = useState(TRADE_DEFAULTS.invest);
  const price = LAST.toFixed(2);

  return (
    <aside className="flex w-[120px] shrink-0 flex-col gap-[9px] bg-black px-[5px] py-[10px] text-[11px]">
      <div className="rounded-[2px] bg-[#1e1f21] px-[9px] py-[7px]">
        <div className="flex items-center justify-between text-[#8b8c8e]">
          <span>{copy.trade.invest}</span>
          <span className="flex size-[12px] items-center justify-center rounded-full border border-current text-[8px]">?</span>
        </div>
        <div className="mt-[3px] flex items-center justify-between">
          <span className="flex items-baseline gap-[4px]">
            <span className="text-[12px] text-[#8b8c8e]">$</span>
            <span className="text-[15px] font-semibold text-white">{invest}</span>
          </span>
          <span className="flex flex-col gap-[2px]">
            <button type="button" aria-label="Increase" onClick={() => setInvest((v) => v + 1)} className="text-[#8b8c8e] hover:text-white">+</button>
            <button type="button" aria-label="Decrease" onClick={() => setInvest((v) => Math.max(1, v - 1))} className="text-[#8b8c8e] hover:text-white">−</button>
          </span>
        </div>
      </div>

      <div className="rounded-[2px] bg-[#1e1f21] px-[9px] py-[7px]">
        <div className="flex items-center justify-between text-[#8b8c8e]">
          <span>{copy.trade.expiration}</span>
          <span className="flex size-[12px] items-center justify-center rounded-full border border-current text-[8px]">?</span>
        </div>
        <div className="mt-[3px] flex items-center gap-[6px]">
          <span className="text-[#8b8c8e]">⚑</span>
          <span className="text-[13px] font-medium text-white">{TRADE_DEFAULTS.expiration}</span>
        </div>
      </div>

      <div className="px-[2px] pt-[6px] text-center">
        <div className="flex items-center justify-center gap-[5px] text-[#8b8c8e]">
          {copy.trade.profit}
          <span className="flex size-[12px] items-center justify-center rounded-full border border-current text-[8px]">?</span>
        </div>
        <div className="mt-[7px] text-[30px] font-light leading-none text-tr-buy">
          +{TRADE_DEFAULTS.profitPercent}
          <span className="text-[17px]">%</span>
        </div>
        <div className="mt-[7px] text-[14px] font-semibold text-tr-buy">{TRADE_DEFAULTS.profitAmount}</div>
      </div>

      <button
        type="button"
        className="mt-[26px] rounded-[2px] bg-[#242426] py-[9px] text-center transition-colors hover:bg-[#2d2d30]"
      >
        <span className="block text-[12px] font-bold text-white">{copy.trade.buy}</span>
        <span className="block text-[11px] text-tr-buy">{price}</span>
      </button>
      <button
        type="button"
        className="rounded-[2px] bg-[#242426] py-[9px] text-center transition-colors hover:bg-[#2d2d30]"
      >
        <span className="block text-[12px] font-bold text-white">{copy.trade.sell}</span>
        <span className="block text-[11px] text-tr-sell">{price}</span>
      </button>
    </aside>
  );
}
