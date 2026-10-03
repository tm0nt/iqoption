"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { LeftRail, type PanelKey, type RailKey } from "./LeftRail";
import { Onboarding } from "./Onboarding";
import { ChartArea } from "./ChartArea";
import { TradePanel } from "./TradePanel";
import { PortfolioBar } from "./PortfolioBar";
import { StatusBar } from "./StatusBar";
import { AssetSelector } from "./AssetSelector";
import {
  AlertsPanel, ChatsSupportPanel, HelpPanel, LeaderboardPanel,
  MarketAnalysisPanel, MorePanel, PromoPanel, TournamentsPanel,
  TradingHistoryPanel, TutorialsPanel, WebinarsPanel,
} from "./panels";
import { ASSET_TABS } from "./mockData";
import { getTraderoomCopy } from "@/i18n/traderoom";
import type { AvalonLocale } from "@/types/avalon-login";

/**
 * Clone of https://trade.avalonbroker.com/traderoom.
 *
 * The original is a single WebGL canvas with no DOM, so this is a rebuild in
 * real markup measured from 1:1 screenshots rather than an extraction. Live
 * quotes, order placement and account data are out of scope — the chart runs on
 * a seeded generator and every figure shown is demo data.
 */
export function TraderoomPage({ locale }: { locale: AvalonLocale }) {
  const copy = getTraderoomCopy(locale);
  const [panel, setPanel] = useState<PanelKey | null>(null);
  const [onboarding, setOnboarding] = useState(true);
  const [positions, setPositions] = useState(true);
  const [assets, setAssets] = useState(false);
  const [tab, setTab] = useState(ASSET_TABS[0].id);

  const selectRail = (key: RailKey) => {
    if (key === "portfolio") {
      setPositions((v) => !v);
      return;
    }
    setPanel((cur) => (cur === key ? null : (key as PanelKey)));
  };

  const close = () => setPanel(null);

  return (
    <div className="traderoom-root">
      <TopBar
        copy={copy}
        activeTab={tab}
        onSelectTab={setTab}
        onOpenAssets={() => setAssets(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        <LeftRail copy={copy} active={panel} onSelect={selectRail} />

        {panel === null && onboarding ? (
          <Onboarding copy={copy} onClose={() => setOnboarding(false)} />
        ) : null}

        {panel === "history" ? <TradingHistoryPanel copy={copy} onClose={close} /> : null}
        {panel === "chats" ? <ChatsSupportPanel copy={copy} onClose={close} /> : null}
        {panel === "tutorials" ? <TutorialsPanel copy={copy} onClose={close} /> : null}
        {panel === "promo" ? <PromoPanel copy={copy} onClose={close} /> : null}
        {panel === "tournaments" ? <TournamentsPanel copy={copy} onClose={close} /> : null}
        {panel === "webinars" ? <WebinarsPanel copy={copy} onClose={close} /> : null}
        {panel === "analysis" ? <MarketAnalysisPanel copy={copy} onClose={close} /> : null}
        {panel === "leaderboard" ? <LeaderboardPanel copy={copy} onClose={close} /> : null}
        {panel === "alerts" ? <AlertsPanel copy={copy} onClose={close} /> : null}
        {panel === "help" ? <HelpPanel copy={copy} onClose={close} /> : null}
        {panel === "more" ? (
          <MorePanel copy={copy} onClose={close} onSelect={(k) => setPanel(k)} />
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <ChartArea copy={copy} assetId={tab} />
            <TradePanel copy={copy} />
          </div>
          <PortfolioBar
            copy={copy}
            expanded={positions}
            onToggle={() => setPositions((v) => !v)}
          />
        </main>

        {assets ? <AssetSelector copy={copy} onClose={() => setAssets(false)} /> : null}
      </div>

      <StatusBar copy={copy} />
    </div>
  );
}
