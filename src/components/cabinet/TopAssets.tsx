"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkline } from "./Sparkline";
import type { TopAsset } from "@/lib/market/top-assets-type";

const CARDS_PER_PAGE = 4;

type Sort = "gainers" | "losers";

/** The instrument families the filter offers, by the `kind` the catalogue uses. */
const FAMILIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "index", label: "Indices" },
  { value: "stock", label: "Stocks" },
];

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[42px] w-[164px] appearance-none rounded-[2px] border border-avalon-border-muted bg-white pl-4 pr-9 text-[14px] text-avalon-text-strong outline-none transition-colors focus:border-avalon-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        width="10"
        height="6"
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-avalon-text"
      >
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * The instrument carousel at the foot of the portfolio.
 *
 * Sorted by the week's move, which is the whole point of the section: the
 * ranking is the content, so the sort control changes which end of it you are
 * looking at rather than merely reordering a list you could already read.
 */
export function TopAssets({ assets, locale }: { assets: TopAsset[]; locale: string }) {
  const [sort, setSort] = useState<Sort>("gainers");
  const [family, setFamily] = useState("all");
  const [page, setPage] = useState(0);

  const ranked = useMemo(() => {
    const filtered = family === "all" ? assets : assets.filter((asset) => asset.kind === family);
    return [...filtered].sort((a, b) => (sort === "gainers" ? b.change - a.change : a.change - b.change));
  }, [assets, family, sort]);

  const pages = Math.max(1, Math.ceil(ranked.length / CARDS_PER_PAGE));
  const current = Math.min(page, pages - 1);
  const shown = ranked.slice(current * CARDS_PER_PAGE, current * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section className="pb-12 pt-10">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-[20px] font-semibold text-avalon-text-strong">Top Assets</h2>
        <div className="ml-auto flex gap-4">
          <Select
            value={sort}
            onChange={(value) => {
              setSort(value as Sort);
              setPage(0);
            }}
            options={[
              { value: "gainers", label: "Gainers" },
              { value: "losers", label: "Losers" },
            ]}
          />
          <Select
            value={family}
            onChange={(value) => {
              setFamily(value);
              setPage(0);
            }}
            options={FAMILIES}
          />
        </div>
      </div>

      <div className="relative mt-6">
        {pages > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="absolute -left-5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-avalon-surface-hover bg-white text-avalon-text transition-colors hover:text-avalon-primary disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={current === pages - 1}
              className="absolute -right-5 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-avalon-surface-hover bg-white text-avalon-text transition-colors hover:text-avalon-primary disabled:opacity-40"
            >
              ›
            </button>
          </>
        )}

        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {shown.map((asset) => {
            const rising = asset.change >= 0;
            return (
              <li key={asset.id}>
                <Link
                  href={`/${locale}/traderoom`}
                  className="block rounded-[4px] border border-avalon-surface-hover bg-white p-5 transition-shadow hover:shadow-avalon"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-avalon-surface text-[11px] font-semibold text-avalon-text">
                      {asset.ticker.slice(0, 3)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-avalon-text-strong">
                        {asset.name}
                      </span>
                      <span className="block text-[12px] text-avalon-text">{asset.ticker}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <Sparkline series={asset.series} rising={rising} />
                    <span className="shrink-0 text-right">
                      <span
                        className={`block text-[14px] font-semibold ${
                          rising ? "text-avalon-primary" : "text-avalon-danger"
                        }`}
                      >
                        {rising ? "+" : ""}
                        {asset.change.toFixed(2)}%
                      </span>
                      <span className="block text-[11px] text-avalon-text">Per week</span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {pages > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {Array.from({ length: pages }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Page ${index + 1}`}
                onClick={() => setPage(index)}
                className={`size-1.5 rounded-full transition-colors ${
                  index === current ? "bg-avalon-text-strong" : "bg-avalon-border-muted/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-avalon-text">
        * Information regarding past performance is not a reliable indicator of future performance.
      </p>
    </section>
  );
}
