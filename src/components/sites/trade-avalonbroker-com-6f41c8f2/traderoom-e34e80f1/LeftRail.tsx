"use client";

import { cn } from "@/lib/utils";
import {
  AnalysisIcon,
  ChatIcon,
  HistoryIcon,
  LeaderboardIcon,
  MoreIcon,
  PortfolioIcon,
  PromoIcon,
  TrophyIcon,
  TutorialsIcon,
  WebinarIcon,
} from "./icons";
import type { TraderoomCopy } from "@/i18n/traderoom";

/** Items that live in the rail itself. */
export type RailKey =
  | "portfolio"
  | "history"
  | "chats"
  | "tutorials"
  | "promo"
  | "tournaments"
  | "webinars"
  | "analysis"
  | "leaderboard"
  | "more";

/** Everything that can occupy the side-panel slot, including the More sub-items. */
export type PanelKey =
  | Exclude<RailKey, "portfolio">
  | "help"
  | "alerts";

interface LeftRailProps {
  copy: TraderoomCopy;
  active: PanelKey | null;
  onSelect: (key: RailKey) => void;
}

/**
 * 75px rail, measured from the 1:1 capture: black, 1px #484848 right edge,
 * items are a 24px icon above a two-line 9px uppercase label.
 */
export function LeftRail({ copy, active, onSelect }: LeftRailProps) {
  const items: { key: RailKey; label: string; Icon: typeof PortfolioIcon; badge?: number; isNew?: boolean }[] = [
    { key: "portfolio", label: copy.rail.totalPortfolio, Icon: PortfolioIcon },
    { key: "history", label: copy.rail.tradingHistory, Icon: HistoryIcon },
    { key: "chats", label: copy.rail.chatsSupport, Icon: ChatIcon },
    { key: "tutorials", label: copy.rail.tutorials, Icon: TutorialsIcon },
    { key: "promo", label: copy.rail.promo, Icon: PromoIcon, badge: 2 },
    { key: "tournaments", label: copy.rail.tournaments, Icon: TrophyIcon },
    { key: "webinars", label: copy.rail.webinars, Icon: WebinarIcon, isNew: true },
    { key: "analysis", label: copy.rail.marketAnalysis, Icon: AnalysisIcon },
    { key: "leaderboard", label: copy.rail.leaderboard, Icon: LeaderboardIcon },
  ];

  return (
    <nav className="flex w-[75px] shrink-0 flex-col items-center overflow-y-auto overflow-x-hidden border-r border-[#484848] bg-black py-1">
      {items.map(({ key, label, Icon, badge, isNew }) => (
        <RailButton
          key={key}
          label={label}
          Icon={Icon}
          badge={badge}
          isNew={isNew}
          active={active === key}
          onClick={() => onSelect(key)}
        />
      ))}
      <div className="mt-auto w-full">
        <RailButton
          label={copy.rail.more}
          Icon={MoreIcon}
          active={active === "more"}
          onClick={() => onSelect("more")}
        />
      </div>
    </nav>
  );
}

function RailButton({
  label,
  Icon,
  badge,
  isNew,
  active,
  onClick,
}: {
  label: string;
  Icon: typeof PortfolioIcon;
  badge?: number;
  isNew?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col items-center gap-[5px] px-1 py-[11px] transition-colors",
        active ? "bg-[#17181a] text-white" : "text-[#8b8c8e] hover:text-white",
      )}
    >
      <span className="relative">
        <Icon className="size-[22px]" />
        {badge ? (
          <span className="absolute -right-[7px] -top-[6px] flex size-[14px] items-center justify-center rounded-full bg-tr-buy text-[9px] font-semibold text-black">
            {badge}
          </span>
        ) : null}
        {isNew ? (
          <span className="absolute -right-[13px] -top-[7px] rounded-[2px] bg-tr-buy px-[3px] py-px text-[7px] font-bold leading-none text-black">
            NEW
          </span>
        ) : null}
      </span>
      <span className="w-full text-center text-[9px] font-medium uppercase leading-[11px] tracking-[0.02em]">
        {label}
      </span>
      {active ? (
        <span className="absolute inset-y-0 left-0 w-[2px] bg-tr-buy" aria-hidden />
      ) : null}
    </button>
  );
}
