"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon, GearIcon } from "./icons";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  withSettings?: boolean;
  children: ReactNode;
}

/** 260px panel between the rail and the chart: black, 1px #4b4b4b right edge. */
export function SidePanel({ title, onClose, withSettings, children }: SidePanelProps) {
  return (
    <section className="flex w-[260px] shrink-0 flex-col border-r border-[#4b4b4b] bg-black">
      <header className="flex h-[48px] shrink-0 items-center gap-2 px-[18px]">
        <h2 className="text-[13px] font-medium text-white">{title}</h2>
        <div className="ml-auto flex items-center gap-3 text-[#8b8c8e]">
          {withSettings ? (
            <button type="button" aria-label="Settings" className="hover:text-white">
              <GearIcon className="size-[14px]" />
            </button>
          ) : null}
          <button type="button" aria-label="Close" onClick={onClose} className="hover:text-white">
            <CloseIcon className="size-[12px]" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

/** The two-tab strip several panels share (AVAILABLE/HISTORY, ACTIVE/HISTORY, NEW/HISTORY). */
export function PanelTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: string[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex border-b border-[#2b2b2d]">
      {tabs.map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "relative flex-1 py-[11px] text-[11px] font-semibold tracking-[0.04em]",
            i === active ? "text-tr-buy" : "text-[#8b8c8e] hover:text-white",
          )}
        >
          {t}
          {i === active ? <span className="absolute inset-x-0 -bottom-px h-[2px] bg-tr-buy" /> : null}
        </button>
      ))}
    </div>
  );
}

/** The grey pill select used by several panels. */
export function PanelSelect({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <button
      type="button"
      className="mx-[14px] my-[12px] flex w-[calc(100%-28px)] items-center gap-[9px] rounded-[2px] bg-[#1e1f21] px-[12px] py-[9px] text-[12px] text-white hover:bg-[#262729]"
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span className="text-[#8b8c8e]">▾</span>
    </button>
  );
}
