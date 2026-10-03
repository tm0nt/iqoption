"use client";

import { useEffect, useState } from "react";
import { FullscreenIcon, GearIcon, HeadsetIcon, SoundIcon } from "./icons";
import type { TraderoomCopy } from "@/i18n/traderoom";

/** 36px status bar: support pill, contact line, and the live clock on the right. */
export function StatusBar({ copy }: { copy: TraderoomCopy }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
      ];
      setNow(
        `${d.getDate()} ${months[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const offset = -new Date().getTimezoneOffset() / 60;
  const tz = `(UTC${offset >= 0 ? "+" : ""}${offset})`;

  return (
    <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-[#474747] bg-black px-3 text-[11px] text-[#8b8c8e]">
      <button
        type="button"
        className="flex h-[22px] items-center gap-[6px] rounded-[2px] bg-tr-support px-[9px] text-[10px] font-bold tracking-[0.04em] text-white"
      >
        <HeadsetIcon className="size-[13px]" />
        {copy.status.support}
      </button>
      <span className="flex items-center gap-[6px] text-white">
        <HeadsetIcon className="size-[13px] text-[#8b8c8e]" />
        support@avalonbroker.com
      </span>
      <span className="hidden text-[#5c5d5f] sm:inline">{copy.status.aroundTheClock}</span>

      <div className="ml-auto flex items-center gap-4">
        <button type="button" aria-label="Sound" className="hover:text-white">
          <SoundIcon className="size-[17px]" />
        </button>
        <button type="button" aria-label="Settings" className="hover:text-white">
          <GearIcon className="size-[17px]" />
        </button>
        <span className="hidden items-center gap-[6px] md:flex">
          {copy.status.currentTime}{" "}
          <span className="text-white" suppressHydrationWarning>
            {now ?? "--"}
          </span>
          <span className="text-[#5c5d5f]">{tz}</span>
        </span>
        <button type="button" aria-label="Fullscreen" className="hover:text-white">
          <FullscreenIcon className="size-[17px]" />
        </button>
      </div>
    </footer>
  );
}
