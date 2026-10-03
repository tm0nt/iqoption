"use client";

import { cn } from "@/lib/utils";
import {
  BellIcon, CandleIcon, CaretIcon, CloseIcon, CollapseIcon, IndicatorIcon,
  InfoIcon, PencilIcon, SignalIcon, StarIcon,
} from "./icons";
import { ASSET_TABS, DEMO_SENTIMENT, buildCandles } from "./mockData";
import { bindingFor, DEFAULT_CANDLE_SIZE } from "./actives";
import { CandleChart } from "@/components/chart/CandleChart";
import { useAvalonCandles } from "@/hooks/useAvalonCandles";
import { useAvalonSession } from "@/lib/avalon/session";
import type { Candle } from "@/lib/avalon/types";
import type { TraderoomCopy } from "@/i18n/traderoom";

const DEMO_CANDLE_COUNT = 120;

/**
 * Fallback series for when no feed is configured.
 *
 * Built once at import rather than per render: the generator needs a clock to
 * anchor its buckets to, and reading one during render is not pure. The values
 * are seeded, so server and client agree on everything the DOM shows.
 */
const DEMO_SERIES: Candle[] = (() => {
  const now = Math.floor(Date.now() / 1000 / DEFAULT_CANDLE_SIZE) * DEFAULT_CANDLE_SIZE;
  const start = now - (DEMO_CANDLE_COUNT - 1) * DEFAULT_CANDLE_SIZE;
  return buildCandles(DEMO_CANDLE_COUNT).map((candle, i) => ({
    ...candle,
    t: start + i * DEFAULT_CANDLE_SIZE,
    v: 0,
    open: false,
  }));
})();

interface ChartAreaProps {
  copy: TraderoomCopy;
  assetId: string;
}

/**
 * The original paints its chart into a WebGL canvas driven by the Emscripten
 * build. This renders the same picture from the same data: `useAvalonCandles`
 * talks to the feed the engine talks to, and `CandleChart` draws it.
 *
 * Without a session id the chart falls back to the seeded generator, so the
 * clone still looks right before the feed is wired up.
 */
export function ChartArea({ copy, assetId }: ChartAreaProps) {
  const asset = ASSET_TABS.find((a) => a.id === assetId) ?? ASSET_TABS[0];
  const binding = bindingFor(asset.id);
  const { ssid } = useAvalonSession();

  const { candles: live, quote, state, loadOlder } = useAvalonCandles({
    ssid,
    activeId: binding.activeId,
    size: DEFAULT_CANDLE_SIZE,
  });

  const candles = live.length > 0 ? live : DEMO_SERIES;
  const last = candles[candles.length - 1];
  const ask = quote?.ask ?? last.c + 0.001;
  const bid = quote?.bid ?? last.c - 0.001;

  return (
    <div className="relative flex min-h-0 flex-1 bg-black">
      <ChartToolbar />

      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-[10px] p-[14px]">
          <div className="pointer-events-auto flex items-center gap-[9px]">
            <span className="flex size-[30px] items-center justify-center rounded-full bg-[#f29423] text-[14px] font-bold text-black">
              {asset.badge}
            </span>
            <button type="button" className="flex items-center gap-[7px] text-left">
              <span>
                <span className="block text-[15px] font-semibold leading-[18px] text-white">{asset.name}</span>
                <span className="block text-[11px] leading-[14px] text-[#8b8c8e]">{asset.kind}</span>
              </span>
              <CaretIcon className="size-[9px] text-[#8b8c8e]" />
            </button>
          </div>
          <div className="pointer-events-auto flex items-center gap-[7px]">
            <button type="button" className="flex h-[25px] items-center gap-[5px] rounded-[13px] bg-[#1e1f21] px-[10px] text-[11px] text-white hover:bg-[#282a2c]">
              <InfoIcon className="size-[13px]" /> {copy.trade.info}
            </button>
            <button type="button" aria-label="Alerts" className="flex size-[25px] items-center justify-center rounded-full bg-[#1e1f21] text-white hover:bg-[#282a2c]">
              <BellIcon className="size-[13px]" />
            </button>
            <button type="button" aria-label="Favourite" className="flex size-[25px] items-center justify-center rounded-full bg-[#1e1f21] text-white hover:bg-[#282a2c]">
              <StarIcon className="size-[13px]" />
            </button>
            {state === "ready" && live.length > 0 ? null : (
              <span className="rounded-full bg-[#1e1f21] px-[9px] py-[5px] text-[10px] text-[#8b8c8e]">
                {state === "idle" ? "demo data" : state}
              </span>
            )}
          </div>
        </div>

        <CandleChart
          candles={candles}
          precision={binding.precision}
          watermark="AVALON"
          onNeedOlder={loadOlder}
          className="absolute inset-0"
        />

        {/* expiry rail and its warning line, both measured from the capture */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[24px] top-0 w-px bg-white/75"
          style={{ right: "158px" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[24px] top-0 w-px bg-white/30"
          style={{ right: "212px" }}
        />

        <div className="pointer-events-none absolute bottom-[46px] left-[72px] flex items-center gap-[6px] text-[10px] leading-[13px] text-[#8b8c8e]">
          <span className="flex size-[13px] items-center justify-center rounded-full border border-current text-[8px]">?</span>
          <span>
            <span className="block">ask {ask.toFixed(binding.precision + 2)}</span>
            <span className="block">bid {bid.toFixed(binding.precision + 2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ChartToolbar() {
  const tools = [
    { Icon: CandleIcon, label: "Candle type" },
    { Icon: null, label: "5s", text: "5s" },
    { Icon: SignalIcon, label: "Signals", isNew: true },
    { Icon: PencilIcon, label: "Draw" },
    { Icon: IndicatorIcon, label: "Indicators" },
    { Icon: null, label: "2m", text: "2m" },
  ];
  return (
    <div className="relative flex w-[42px] shrink-0 flex-col items-center gap-[9px] pt-[14px]">
      <button type="button" aria-label="Close chart" className="flex size-[24px] items-center justify-center rounded-[2px] bg-[#1e1f21] text-white hover:bg-[#282a2c]">
        <CloseIcon className="size-[11px]" />
      </button>
      <button type="button" aria-label="Collapse" className="flex size-[24px] items-center justify-center rounded-[2px] bg-[#1e1f21] text-white hover:bg-[#282a2c]">
        <CollapseIcon className="size-[12px]" />
      </button>

      <div className="mt-[22px] flex flex-col items-center text-[11px] leading-[13px]">
        <span className="text-[#c9cacc]">BUY</span>
        <span className="font-semibold text-tr-buy">{DEMO_SENTIMENT.buy}%</span>
        <div className="my-[5px] flex w-[9px] flex-col gap-[2px]">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className={cn("h-[4px] w-full", i < 5 ? "bg-tr-buy" : "bg-tr-sell")}
              style={{ opacity: 0.45 + (i % 4) * 0.18 }}
            />
          ))}
        </div>
        <span className="text-[#c9cacc]">SELL</span>
        <span className="font-semibold text-tr-sell">{DEMO_SENTIMENT.sell}%</span>
      </div>

      <div className="mt-[10px] flex flex-col gap-[7px]">
        {tools.map(({ Icon, label, text, isNew }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="relative flex size-[26px] items-center justify-center rounded-[2px] bg-[#1e1f21] text-[11px] font-semibold text-white hover:bg-[#282a2c]"
          >
            {Icon ? <Icon className="size-[14px]" /> : text}
            {isNew ? (
              <span className="absolute -top-[7px] right-[2px] rounded-[2px] bg-tr-buy px-[3px] text-[7px] font-bold leading-[9px] text-black">
                NEW
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
