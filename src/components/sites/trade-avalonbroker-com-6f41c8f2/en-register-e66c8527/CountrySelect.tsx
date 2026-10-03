"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SelectCaret } from "../shared/icons";
import { flagSrc } from "../shared/countries";
import type { AvalonCountry } from "@/types/avalon-login";

interface CountrySelectProps {
  value: AvalonCountry;
  onChange: (country: AvalonCountry) => void;
  searchPlaceholder: string;
  /** The locale's own country list, already named and ordered as the site serves it. */
  countries: readonly AvalonCountry[];
}

/**
 * Country picker from the register page: a 50px white header with a 20px round
 * flag and the country name, a caret on the right, and a dropdown whose first row
 * is a search box above a scrollable list.
 */
export function CountrySelect({
  value,
  onChange,
  searchPlaceholder,
  countries,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? countries.filter((c) => c.name.toLowerCase().includes(q)) : countries;
  }, [query, countries]);

  return (
    <div ref={rootRef} className="relative flex w-full flex-col">
      <div
        data-test-id="register-country-select-select"
        className="relative flex w-full"
      >
        <button
          type="button"
          data-test-id="register-country-select-select_header"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="avalon-field relative z-[5] box-border flex h-[50px] w-full cursor-pointer items-center bg-white px-[15px] py-[10px] text-left font-avalon text-[14px] font-medium leading-[20.3px] text-avalon-text"
        >
          <span className="flex h-[22px] w-full items-center justify-start">
            <Image
              src={flagSrc(value.iso)}
              alt=""
              width={20}
              height={20}
              className="mr-3 size-5 shrink-0 rounded-full"
            />
            <span className="block h-[22px] leading-[22px]">{value.name}</span>
          </span>
          <SelectCaret className="absolute right-4 top-1/2 -translate-y-1/2" />
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 top-[49px] z-10 w-full border-t border-avalon-border bg-white">
          <div className="relative w-full overflow-hidden rounded-[4px] border border-t-0 border-avalon-border bg-white">
            <div className="relative block border-b border-avalon-border py-[5px] pl-5 pr-[35px]">
              <input
                data-test-id="register-country-select-select_search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="box-border h-10 w-full border-0 bg-white font-avalon text-[14px] font-normal leading-5 text-avalon-text outline-none"
              />
            </div>
            <div
              role="listbox"
              className="max-h-[270px] w-full overflow-y-auto overflow-x-hidden"
            >
              {results.map((country) => (
                <button
                  key={country.iso}
                  type="button"
                  role="option"
                  aria-selected={country.iso === value.iso}
                  onClick={() => {
                    onChange(country);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-[50px] w-full items-center px-5 text-left font-avalon text-[14px] font-medium leading-[20.3px] hover:bg-avalon-surface-hover",
                    country.iso === value.iso
                      ? "text-avalon-primary"
                      : "text-avalon-text",
                  )}
                >
                  <Image
                    src={flagSrc(country.iso)}
                    alt=""
                    width={20}
                    height={20}
                    className="mr-3 size-5 shrink-0 rounded-full"
                  />
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
