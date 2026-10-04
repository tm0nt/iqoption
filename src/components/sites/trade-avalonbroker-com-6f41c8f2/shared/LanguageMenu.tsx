"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FlagEnIcon,
  FlagEsIcon,
  FlagPtIcon,
} from "./icons";
import { LOCALES, LOCALE_LABELS } from "@/i18n/avalon";
import type { AvalonLocale } from "@/types/avalon-login";
import { rememberLocale } from "@/i18n/remember";

const FLAGS = {
  en: FlagEnIcon,
  es: FlagEsIcon,
  pt: FlagPtIcon,
} as const;

interface LanguageMenuProps {
  locale: AvalonLocale;
  /** Path segment of the current page, e.g. "login" — used to keep the page on switch. */
  page: string;
}

export function LanguageMenu({ locale, page }: LanguageMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ActiveFlag = FLAGS[locale];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      data-test-id="lang-menu"
      className="relative ml-auto mr-0 min-[600px]:mr-3"
    >
      <button
        type="button"
        data-test-id="lang-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative box-border cursor-pointer p-[10px] text-center font-avalon text-[14px] font-medium leading-[22px] text-avalon-text",
          "transition-[border-color,background-color,color] duration-200",
          // <=599px: 40x40 grey circle, flag only
          "inline-block size-10 rounded-full bg-avalon-surface-hover",
          // >=600px: transparent 71.625x46 pill with the label
          "min-[600px]:flex min-[600px]:size-auto min-[600px]:h-[46px] min-[600px]:items-center min-[600px]:rounded-[2px] min-[600px]:bg-transparent",
        )}
      >
        <span className="box-content block size-[18px] shrink-0 overflow-hidden rounded-full border border-avalon-border-muted">
          <ActiveFlag className="block size-[18px]" />
        </span>
        <span className="ml-[10px] hidden h-[26px] text-center text-[16px] font-medium capitalize leading-[26px] text-avalon-text-strong transition-colors duration-150 min-[600px]:block">
          {locale}
        </span>
      </button>

      <div
        role="menu"
        data-test-id="lang-menu-list"
        aria-hidden={!open}
        className={cn(
          // left: -308.375px against a 71.625px trigger === right edges flush.
          "absolute right-0 top-[46px] z-[131] mt-[18px] box-border w-[380px] max-w-[calc(100vw-32px)] rounded-[4px] bg-avalon-surface p-2 shadow-avalon",
          "avalon-dropdown",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[5px] opacity-0",
        )}
      >
        <div className="flex flex-wrap">
          {LOCALES.map((code) => {
            const Flag = FLAGS[code];
            return (
              <Link
                key={code}
                href={`/${code}/${page}`}
                onClick={() => rememberLocale(code)}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                className={cn(
                  "box-border flex h-[44px] w-[182px] items-center rounded-[2px] px-4 py-[10px] text-left text-[14px] font-medium leading-6",
                  code === locale ? "text-avalon-primary" : "text-avalon-text",
                )}
              >
                <span className="mr-[10px] block size-[18px] shrink-0">
                  <Flag className="block size-[18px]" />
                </span>
                {LOCALE_LABELS[code]}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
