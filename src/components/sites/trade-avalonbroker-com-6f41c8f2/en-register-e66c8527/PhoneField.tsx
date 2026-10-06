"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AsYouType, type CountryCode } from "libphonenumber-js/max";
import { cn } from "@/lib/utils";
import { SelectCaret } from "../shared/icons";
import { dialKey, flagSrc } from "../shared/countries";
import type { AvalonDialCode } from "@/types/avalon-login";

interface PhoneFieldProps {
  dial: AvalonDialCode;
  onDialChange: (dial: AvalonDialCode) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  /** The locale's own dial-code list, already named and ordered as the site serves it. */
  dialCodes: readonly AvalonDialCode[];
}

/**
 * Phone row: a 120px dial-code select rounded on the left, butted against a
 * flexible tel input rounded on the right (the input overlaps the select by 1px
 * so the shared edge renders as a single hairline).
 */
export function PhoneField({
  dial,
  onDialChange,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  dialCodes,
}: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  const formattedPhone = useMemo(
    () => new AsYouType(dial.iso.toUpperCase() as CountryCode).input(value.replace(/\D/g, "")),
    [dial.iso, value],
  );

  useEffect(() => {
    if (cursorRef.current === null || !phoneInputRef.current) return;
    phoneInputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
    cursorRef.current = null;
  }, [formattedPhone]);

  function handlePhoneChange(input: HTMLInputElement) {
    const beforeCursor = input.value.slice(0, input.selectionStart ?? input.value.length);
    const digitsBeforeCursor = beforeCursor.replace(/\D/g, "").length;
    const digits = input.value.replace(/\D/g, "");
    const formatted = new AsYouType(dial.iso.toUpperCase() as CountryCode).input(digits);
    let cursor = 0;
    let seen = 0;
    while (cursor < formatted.length && seen < digitsBeforeCursor) {
      if (/\d/.test(formatted[cursor])) seen += 1;
      cursor += 1;
    }
    cursorRef.current = cursor;
    onChange(digits);
  }

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
    return q
      ? dialCodes.filter(
          (d) => d.name.toLowerCase().includes(q) || d.dial.includes(q),
        )
      : dialCodes;
  }, [query, dialCodes]);

  return (
    <div
      data-test-id="register-mandatory-phone-wrapper"
      className="mb-[18px] block h-[50px] w-full bg-white"
    >
      <div ref={rootRef} className="relative flex h-[50px] w-full">
        <div className="relative w-[120px] shrink-0">
          <button
            type="button"
            data-test-id="register-mandatory-phone-field-select_header"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="avalon-field avalon-field-start relative z-[5] box-border flex h-[50px] w-full cursor-pointer items-center bg-white px-[15px] py-[10px] font-avalon text-[14px] font-medium leading-[20.3px] text-avalon-text"
          >
            <span className="flex h-[22px] items-center justify-start">
              <Image
                src={flagSrc(dial.iso)}
                alt=""
                width={20}
                height={20}
                className="mr-3 size-5 shrink-0 rounded-full"
              />
              {dial.dial}
            </span>
            <SelectCaret className="absolute right-4 top-1/2 -translate-y-1/2" />
          </button>

          {open ? (
            <div className="absolute left-0 top-[50px] z-10 w-[418px] max-w-[calc(100vw-48px)] border-t border-avalon-border bg-white">
              <div className="relative w-full overflow-hidden rounded-[4px] border border-t-0 border-avalon-border bg-white">
                <div className="relative block border-b border-avalon-border py-[5px] pl-5 pr-[35px]">
                  <input
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
                  {results.map((entry) => {
                    const key = dialKey(entry);
                    const selected = key === dialKey(dial);
                    return (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onDialChange(entry);
                        setQuery("");
                        setOpen(false);
                      }}
                      className={cn(
                        "flex h-[50px] w-full items-center px-5 text-left font-avalon text-[14px] font-medium leading-[20.3px] hover:bg-avalon-surface-hover",
                        selected ? "text-avalon-primary" : "text-avalon-text",
                      )}
                    >
                      <Image
                        src={flagSrc(entry.iso)}
                        alt=""
                        width={20}
                        height={20}
                        className="mr-3 size-5 shrink-0 rounded-full"
                      />
                      <span className="flex-1">{entry.name}</span>
                      <span className="ml-3 shrink-0">{entry.dial}</span>
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div
          data-test-id="register-mandatory-phone-field-whole-wrapper-input"
          className="-ml-px block h-[50px] flex-1"
        >
          <div className="avalon-field avalon-field-end relative h-[50px] w-full">
            <input
              ref={phoneInputRef}
              data-test-id="register-mandatory-phone-field-input"
              name="phone"
              type="tel"
              inputMode="tel"
              step="any"
              value={formattedPhone}
              onChange={(event) => handlePhoneChange(event.currentTarget)}
              placeholder={placeholder}
              autoComplete="new-password"
              className="box-border h-12 w-full border-0 bg-transparent px-4 font-avalon text-[14px] font-medium leading-[16.1px] text-avalon-text outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
