"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnalysisIcon, HistoryIcon, SearchIcon, TrophyIcon } from "./icons";
import { DEMO_GAINERS, DEMO_LOSERS, DEMO_TRADERS_CHOICE } from "./mockData";
import type { AvalonAssetCard } from "@/types/avalon-login";
import type { TraderoomCopy } from "@/i18n/traderoom";

/** Full-bleed overlay opened by the "+" tab: category rail on the left, market lists on the right. */
export function AssetSelector({ copy, onClose }: { copy: TraderoomCopy; onClose: () => void }) {
  const c = copy.assetSelector;
  const [region, setRegion] = useState<"world" | "br">("world");
  const [cat, setCat] = useState(0);

  const cats = [
    { label: c.trending, Icon: TrophyIcon, count: null },
    { label: c.upTo5, Icon: AnalysisIcon, count: 139 },
    { label: c.upTo15, Icon: HistoryIcon, count: 139 },
    { label: c.longExpiration, Icon: AnalysisIcon, count: 374 },
  ];

  return (
    <div className="absolute inset-0 z-20 flex bg-black/95" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 -z-10 size-full cursor-default" onClick={onClose} />

      <nav className="w-[260px] shrink-0 pt-[26px]">
        {cats.map(({ label, Icon, count }, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setCat(i)}
            className={cn(
              "flex w-full items-center gap-[13px] px-[40px] py-[14px] text-left text-[14px]",
              i === cat ? "text-white" : "text-[#8b8c8e] hover:text-white",
            )}
          >
            <Icon className="size-[19px]" />
            <span className="flex-1">{label}</span>
            {count ? <span className="text-[11px] text-[#8b8c8e]">{count}</span> : null}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto px-[30px] pb-[30px] pt-[22px]">
        <label className="flex h-[32px] items-center gap-[9px] rounded-[2px] border border-[#2b2b2d] bg-[#121315] px-[11px]">
          <SearchIcon className="size-[15px] text-[#8b8c8e]" />
          <input
            placeholder={c.search}
            className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#6a6b6d]"
          />
        </label>

        <div className="mt-[14px] flex items-center gap-[14px]">
          <button type="button" className="flex h-[30px] w-[210px] items-center justify-between rounded-[2px] bg-[#1e1f21] px-[12px] text-[12px] text-white">
            Forex <span className="text-[#8b8c8e]">▾</span>
          </button>
          <div className="ml-auto flex overflow-hidden rounded-[2px] bg-[#1e1f21] text-[12px]">
            {([["world", c.worldwide], ["br", c.brazil]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRegion(k)}
                className={cn("px-[22px] py-[7px]", region === k ? "bg-[#2f3032] text-white" : "text-[#8b8c8e]")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Section title={c.tradersChoice} meta={c.lastWeek} items={DEMO_TRADERS_CHOICE} copy={c} />
        <Section title={c.gainers} meta={c.lastWeek} items={DEMO_GAINERS} copy={c} />
        <Section title={c.losers} meta={c.lastWeek} items={DEMO_LOSERS} copy={c} />
      </div>
    </div>
  );
}

function Section({
  title, meta, items, copy,
}: {
  title: string;
  meta: string;
  items: AvalonAssetCard[];
  copy: TraderoomCopy["assetSelector"];
}) {
  return (
    <>
      <div className="mb-[13px] mt-[26px] flex items-baseline justify-between">
        <h3 className="text-[21px] font-semibold text-white">{title}</h3>
        <span className="text-[11px] text-[#8b8c8e]">{meta}</span>
      </div>
      <div className="grid grid-cols-1 gap-[13px] md:grid-cols-2 xl:grid-cols-3">
        {items.map((a) => (
          <div key={a.name} className="rounded-[3px] border border-[#2b2b2d] bg-[#121315] p-[14px]">
            <div className="flex items-center gap-[9px]">
              <span className="size-[20px] rounded-full bg-[#2a2b2d]" aria-hidden />
              <span className="text-[13px] font-medium text-white">{a.name}</span>
            </div>
            <div className="mt-[12px] text-[11px] text-[#8b8c8e]">{copy.profit}</div>
            <div className="mt-[3px] text-[19px] font-semibold text-tr-buy">{a.profit}</div>
            <div className="mt-[12px] flex justify-between text-[11px] text-[#8b8c8e]">
              <span>{copy.price}</span>
              <span>{copy.change5min}</span>
            </div>
            <div className="mt-[3px] flex justify-between text-[12px]">
              <span className="text-white">{a.price}</span>
              <span className={a.up ? "text-tr-buy" : "text-tr-sell"}>{a.change}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
