"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PanelSelect, PanelTabs, SidePanel } from "./SidePanel";
import {
  AnalysisIcon, FilterIcon, GlobeIcon, LeaderboardIcon,
  QuestionIcon, TutorialsIcon, WebinarIcon,
} from "./icons";
import {
  DEMO_CALENDAR, DEMO_DISPLAY_NAME, DEMO_LEADERS, DEMO_POSITIONS,
  DEMO_PROMOS, DEMO_TOURNAMENTS,
} from "./mockData";
import type { TraderoomCopy } from "@/i18n/traderoom";

type PanelProps = { copy: TraderoomCopy; onClose: () => void };

export function TradingHistoryPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.tradingHistory;
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <PanelSelect label={c.allPositions} />
      <ul>
        {DEMO_POSITIONS.map((p, i) => (
          <li key={i} className="flex items-start gap-[10px] border-t border-[#1e1f21] px-[14px] py-[11px]">
            <span className="w-[42px] shrink-0 text-[11px] leading-[15px] text-white">
              {p.time}
              <span className="block text-[10px] text-[#8b8c8e]">{p.date}</span>
            </span>
            <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#f29423] text-[9px] font-bold text-black">
              ₿
            </span>
            <span className="min-w-0 flex-1 text-[11px] leading-[15px] text-white">
              {p.asset}
              <span className="block text-[10px] text-[#8b8c8e]">{p.kind}</span>
            </span>
            <span className="shrink-0 text-right text-[11px] leading-[15px]">
              <span className="flex items-center justify-end gap-[4px] text-white">
                <span className={p.direction === "up" ? "text-tr-buy" : "text-tr-sell"}>
                  {p.direction === "up" ? "▲" : "▼"}
                </span>
                {p.amount}
              </span>
              <span className="block text-[10px] text-tr-buy">{p.result}</span>
            </span>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

export function ChatsSupportPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.chatsSupport;
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <button type="button" className="flex w-full items-center gap-[12px] px-[18px] py-[14px] text-left hover:bg-[#121315]">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#1e1f21]">
          <span className="text-[14px] font-bold text-tr-buy">A</span>
        </span>
        <span>
          <span className="block text-[12px] font-medium text-tr-buy">{c.support}</span>
          <span className="mt-[3px] flex items-center gap-[6px] text-[11px] text-[#8b8c8e]">
            <span className="size-[6px] rounded-full bg-tr-buy" />
            {c.schedule}
          </span>
        </span>
      </button>
    </SidePanel>
  );
}

export function TutorialsPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.tutorials;
  const videos = [
    { title: c.allVideos, n: 36 },
    { title: c.basics, n: 9 },
    { title: c.marginTrading, n: 1 },
    { title: c.technicalAnalysis, n: 4 },
    { title: c.fundamentalAnalysis, n: 3 },
  ];
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <div className="space-y-[10px] px-[14px] pt-[10px]">
        <Card icon={<QuestionIcon className="size-[18px]" />} title={c.howToTrade} meta={c.howToTradeMeta} />
        <Card icon={<QuestionIcon className="size-[18px]" />} title={c.interfaceGuide} meta={c.interfaceGuideMeta} />
      </div>
      <h3 className="px-[18px] pb-[8px] pt-[18px] text-[11px] text-[#8b8c8e]">{c.videoTutorials}</h3>
      <div className="space-y-[10px] px-[14px] pb-[14px]">
        {videos.map((v) => (
          <Card
            key={v.title}
            icon={<WebinarIcon className="size-[18px]" />}
            title={v.title}
            meta={`${v.n} ${c.videos}`}
          />
        ))}
      </div>
    </SidePanel>
  );
}

function Card({ icon, title, meta }: { icon: React.ReactNode; title: string; meta: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-[12px] rounded-[3px] bg-[#1b1c1e] px-[14px] py-[13px] text-left hover:bg-[#232426]">
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#2a2b2d] text-[#c9cacc]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-[17px] text-white">{title}</span>
        <span className="block text-[11px] text-[#8b8c8e]">{meta}</span>
      </span>
    </button>
  );
}

export function PromoPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.promo;
  const [tab, setTab] = useState(0);
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <PanelTabs tabs={[c.available, c.history]} active={tab} onSelect={setTab} />
      {tab === 0 ? (
        <div className="space-y-[12px] p-[14px]">
          {DEMO_PROMOS.map((p) => (
            <div key={p.title} className="relative overflow-hidden rounded-[3px] border border-[#2b2b2d] bg-[#121315] p-[13px]">
              <div className="flex items-center gap-[7px] text-[10px]">
                <span className="text-[#8b8c8e]">{c.promoCode}</span>
                <span className="text-white">{c.exclusive}</span>
                {p.isNew ? (
                  <span className="ml-auto rounded-[2px] bg-tr-buy px-[5px] py-px text-[8px] font-bold text-black">NEW</span>
                ) : null}
              </div>
              <p className="mt-[8px] max-w-[170px] text-[13px] font-semibold leading-[17px] text-white">{p.title}</p>
              <p className="mt-[10px] text-[10px] text-[#8b8c8e]">{p.meta}</p>
              <span className="pointer-events-none absolute -bottom-[6px] -right-[6px] size-[46px] rotate-[-20deg] rounded-[8px] bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] opacity-80" />
            </div>
          ))}
        </div>
      ) : (
        <Empty>—</Empty>
      )}
    </SidePanel>
  );
}

export function TournamentsPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.tournaments;
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <button type="button" className="block px-[18px] py-[12px] text-[12px] text-white hover:text-tr-buy">
        {c.past}
      </button>
      <div className="space-y-[16px] px-[14px] pb-[16px]">
        {DEMO_TOURNAMENTS.map((t) => (
          <div key={t.name} className="relative overflow-hidden rounded-[3px] bg-gradient-to-br from-[#1b2430] to-[#121619] p-[14px]">
            <h3 className="text-[14px] font-semibold text-white">{t.name}</h3>
            <span className="mt-[9px] inline-block rounded-[2px] bg-[#2f3032] px-[8px] py-[4px] text-[9px] font-bold tracking-[0.05em] text-[#c9cacc]">
              {t.status}
            </span>
            <dl className="mt-[14px] grid grid-cols-2 gap-y-[14px] text-[11px]">
              <Stat label={c.prizePool} value={t.prizePool} />
              <Stat label={c.entryFee} value={t.entryFee} />
              <Stat label={c.participants} value={t.participants} />
              <Stat label={c.instruments} value={t.instruments} small />
            </dl>
            <span className="pointer-events-none absolute -right-[10px] top-[18px] size-[86px] rounded-full border-[10px] border-white/[0.04]" />
          </div>
        ))}
      </div>
    </SidePanel>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <dt className="text-[#8b8c8e]">{label}</dt>
      <dd className={cn("mt-[3px] font-semibold text-white", small ? "text-[10px]" : "text-[17px]")}>{value}</dd>
    </div>
  );
}

export function WebinarsPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.webinars;
  const [tab, setTab] = useState(0);
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <PanelTabs tabs={[c.new, c.history]} active={tab} onSelect={setTab} />
      <Empty>{c.empty}</Empty>
    </SidePanel>
  );
}

export function MarketAnalysisPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.marketAnalysis;
  return (
    <SidePanel title={c.title} onClose={onClose} withSettings>
      <div className="flex border-b border-[#2b2b2d]">
        <span className="flex flex-1 justify-center py-[10px] text-tr-buy">$</span>
        <span className="flex flex-1 justify-center py-[10px] text-[#8b8c8e]">
          <AnalysisIcon className="size-[15px]" />
        </span>
      </div>
      {DEMO_CALENDAR.map((group) => (
        <div key={group.date}>
          <h3 className="px-[18px] py-[10px] text-[11px] font-semibold text-white">{group.date}</h3>
          <ul>
            {group.events.map((e, i) => (
              <li key={i} className="flex items-center gap-[10px] border-t border-[#1e1f21] px-[14px] py-[11px]">
                <span className="text-[14px]">{e.flag}</span>
                <span className="min-w-0 flex-1 text-[11px] leading-[15px] text-[#c9cacc]">{e.name}</span>
                <span className="shrink-0 text-right text-[11px] text-white">
                  {e.time}
                  <span
                    className={cn(
                      "mx-auto mt-[5px] block size-[6px] rounded-full",
                      e.impact === "high" ? "bg-tr-sell" : e.impact === "medium" ? "bg-[#f29423]" : "bg-[#c0392b]",
                    )}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </SidePanel>
  );
}

export function LeaderboardPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.leaderboard;
  const medal = ["#d9a441", "#b9bcc0", "#c07b4a"];
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <PanelSelect label={c.worldwide} icon={<GlobeIcon className="size-[15px] text-tr-buy" />} />
      <div className="-mt-[6px]">
        <PanelSelect label={c.allInstruments} icon={<FilterIcon className="size-[15px] text-[#8b8c8e]" />} />
      </div>
      <div className="border-t border-[#1e1f21] px-[14px] py-[11px]">
        <div className="flex items-center gap-[10px] text-[12px]">
          <span className="w-[16px] text-center text-[#8b8c8e]">—</span>
          <span className="size-[14px] rounded-full bg-tr-buy" />
          <span className="flex-1 text-[#8b8c8e]">{DEMO_DISPLAY_NAME}</span>
          <span className="text-white">$0.00</span>
        </div>
        <p className="mt-[10px] text-center text-[11px] leading-[16px] text-[#8b8c8e]">{c.noProfit}</p>
      </div>
      <ul className="border-t border-[#1e1f21]">
        {DEMO_LEADERS.map((l) => (
          <li key={l.rank} className="flex items-center gap-[10px] border-b border-[#1e1f21] px-[14px] py-[10px] text-[12px]">
            {l.rank <= 3 ? (
              <span
                className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black"
                style={{ background: medal[l.rank - 1] }}
              >
                {l.rank}
              </span>
            ) : (
              <span className="w-[18px] shrink-0 text-center text-[#8b8c8e]">{l.rank}</span>
            )}
            <span className="size-[14px] shrink-0 rounded-full bg-tr-buy" />
            <span className="min-w-0 flex-1 truncate text-white">{l.name}</span>
            <span className="shrink-0 text-tr-buy">{l.amount}</span>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

export function HelpPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.help;
  const rows = [c.askQuestion, c.general, c.trading, c.depositing, c.withdrawing, c.account, c.bonus];
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <ul>
        {rows.map((r) => (
          <li key={r}>
            <button type="button" className="flex w-full items-center gap-[13px] border-b border-[#1e1f21] px-[18px] py-[15px] text-left text-[12px] text-white hover:bg-[#121315]">
              <span className="flex size-[20px] shrink-0 items-center justify-center text-[#c9cacc]">
                <QuestionIcon className="size-[17px]" />
              </span>
              {r}
            </button>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

export function AlertsPanel({ copy, onClose }: PanelProps) {
  const c = copy.panels.alerts;
  const [tab, setTab] = useState(0);
  return (
    <SidePanel title={c.title} onClose={onClose}>
      <PanelTabs tabs={[c.active, c.history]} active={tab} onSelect={setTab} />
      <PanelSelect label={c.allAlerts} icon={<FilterIcon className="size-[15px] text-[#8b8c8e]" />} />
      <div className="px-[14px]">
        <button type="button" className="flex w-full items-center justify-center gap-[8px] rounded-[2px] bg-[#1e1f21] py-[10px] text-[12px] text-white hover:bg-[#262729]">
          <span className="flex size-[15px] items-center justify-center rounded-full bg-[#f29423] text-[9px] font-bold text-black">₿</span>
          {c.create}
        </button>
      </div>
      <p className="mt-[80px] px-[30px] text-center text-[12px] leading-[18px] text-[#8b8c8e]">
        {c.emptyLead} <span className="text-tr-buy">{c.emptyLink}</span> {c.emptyTail}
      </p>
    </SidePanel>
  );
}

export function MorePanel({
  copy,
  onClose,
  onSelect,
}: PanelProps & { onSelect: (k: "analysis" | "leaderboard" | "help" | "alerts") => void }) {
  const items = [
    { k: "analysis" as const, label: copy.rail.marketAnalysis, Icon: AnalysisIcon },
    { k: "leaderboard" as const, label: copy.rail.leaderboard, Icon: LeaderboardIcon },
    { k: "help" as const, label: copy.panels.help.title, Icon: QuestionIcon },
    { k: "alerts" as const, label: copy.panels.alerts.title, Icon: TutorialsIcon },
  ];
  return (
    <SidePanel title={copy.panels.more.title} onClose={onClose} withSettings>
      <ul>
        {items.map(({ k, label, Icon }) => (
          <li key={k}>
            <button
              type="button"
              onClick={() => onSelect(k)}
              className="flex w-full items-center gap-[13px] border-b border-[#1e1f21] px-[18px] py-[15px] text-left text-[12px] uppercase text-white hover:bg-[#121315]"
            >
              <Icon className="size-[19px] text-[#c9cacc]" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex h-[280px] items-center justify-center px-[40px] text-center text-[12px] leading-[18px] text-[#8b8c8e]">
      {children}
    </p>
  );
}
