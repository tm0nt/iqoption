/**
 * Stored preferences, exactly as the client writes them.
 *
 * `CMain::checkLoginConnectionProgress` reads the settings object and bails on
 * the first null member — seven checks in a row, one per settings type plus a
 * flag. A config that does not parse into its type leaves that pointer null,
 * and the traderoom is never built; nothing is logged. Partial defaults are
 * therefore not good enough, so these are the full shapes recorded from the
 * client's own `set-user-settings` calls.
 *
 * Three are adjusted on purpose: the grid gets a 1x1 scheme with an instrument
 * selected (its own default selects nothing, so there is no chart), favourites
 * are filled, and the welcome prompts are marked as already seen.
 */
import { ACTIVES } from "../market/actives.mjs";

const DEFAULTS = {
  "traderoom_gl_common": {
    "balanceId": 1251576862,
    "theme": "black",
    "isSoundDisabled": false,
    "openedLeftPanelSections": "",
    "isPlotCandleWidthAutoChanged": false,
    "assetSortConfig": {
      "binary|": "commission_turbo_desc",
      "blitz-option|": "volume_desc",
      "digital-option|": "volume_desc",
      "exchange-option|": "name_asc",
      "fx-option|": "nextexp_asc",
      "marginal-cfd|Commodity": "volume_desc",
      "marginal-cfd|ETF": "volume_desc",
      "marginal-cfd|Stock": "volume_desc",
      "marginal-crypto|": "volume_desc",
      "marginal-forex|": "volume_desc"
    },
    "lastSelectedActiveCategory": "",
    "customSettings": {},
    "isPosDashedLineVisible": true,
    "notAutoSelectClosestStrike": true,
    "isNewOptionInCurrentTab": false,
    "isShowPendingOption": false,
    "isHideBalance": false,
    "isShowBidAskOnPlot": true,
    "isShowBgMap": true,
    "isShowDottedOptionLine": true,
    "isHideChangePositionNotification": false,
    "isShowOptionAmountOnPlot": true,
    "notHideAllStrike": true,
    "tradingLeverages": {},
    "favoriteEmoji": [],
    "portfolioWithoutInvestment": false,
    "alreadySettedFlags": [],
    "lastCandles": {},
    "isShowAlertsNotification": true,
    "leftPanelButtonsStates": [
      "AssetSelector&&true",
      "Portfolio&&true",
      "History&&true",
      "Raffles&&true",
      "PerformanceDashboard&&true",
      "Chat&&true",
      "Leaderboard&&true",
      "Promo&&true",
      "Webinars&&true",
      "MarketAnalysis&&true",
      "Tournaments&&false",
      "FAQ&&false",
      "Tutorials&&true",
      "Alerts&&false",
      "ShowMore&&true"
    ],
    "leftPanelButtonsStatesVer": 4,
    "selectedMarketAnalysisTab": "MARKET_NEWS",
    "marginBannerWasClosed": false,
    "marginPlotTypeWasChanged": true,
    "isPortfolioHidden": false,
    "portfolioWasHiddenOnce": true,
    "portfolioSort": {},
    "lastSlowBrowserNotifyDate": -1,
    "isBlitzPromoHidden": false,
    "lastDepositBonusStatus": "",
    "isSignalsOpened": false,
    "isEliteClubOpened": false,
    "wasLoyaltyNoticeHidden": false,
    "wasLoyaltyNoticeShown": false,
    "isCandleTimerVisible": true,
    "candleTimerMode": 0
  },
  "traderoom_gl_trading": {
    "isBuybackOneClickMargin": false,
    "isBuybackOneClickDigital": false,
    "isBuybackOneClickBinary": false,
    "isBuybackOneClickBlitz": false,
    "isBuybackOneClickFX": false,
    "isBuybackOneClickExchangeOption": false,
    "isBuybackOneClickDemo": true,
    "isBuybackOneClickOption": false,
    "isBuyOneClickMargin": false,
    "isBuyOneClickDigital": false,
    "isBuyOneClickBinary": false,
    "isBuyOneClickBlitz": false,
    "isBuyOneClickFX": false,
    "isBuyOneClickExchangeOption": false,
    "isBuyOneClickDemo": false,
    "isBuyOneClickOption": false,
    "isCloseAllAvailableOneClick": false,
    "isRolloverOneClickBlitz": false,
    "isCodeOfConduct": false,
    "lastTournamentBet": [],
    "lastRealBet": [],
    "lastDemoBet": [],
    "lastRealLotBets": [],
    "lastPracticeLotBets": [],
    "lastLots": {},
    "lastAmounts": {},
    "lastAmountsPractice": {},
    "lastTpsl": {
      "tpOrderId": 0,
      "takeProfitType": "percent",
      "takeProfitValue": null,
      "slOrderId": 0,
      "stopLossType": "percent",
      "stopLossValue": null,
      "activeId": 0,
      "leverage": 0,
      "trailingStop": false
    },
    "recentMuxFactor": 1,
    "recentIndicators": "",
    "exchangePriceLimit": 205,
    "widgetsEnable": [],
    "hiLoWidgetMinDuration": 9,
    "bubbleInfoTypeStock": "none",
    "bubbleInfoTypeOption": "none",
    "priceMode": true,
    "isPlotAlertsVisible": true,
    "isPlotPendingsVisible": true,
    "isPercentOnOptionsPlotTabs": false,
    "isBuybackResultOnBinaryPlotTab": false,
    "isBuybackResultOnDigitalPlotTab": false,
    "isBuybackResultOnExchangePlotTab": false,
    "isBuybackResultOnFXPlotTab": true
  },
  "traderoom_gl_welcome": {
    "highRiskAccepted": true,
    "welcomeToDoCompleteSteps": [],
    "disabledMobileHomescreen": false,
    "insurancePopupShown": true,
    "depositBonusHintShown": true,
    "traderoomKycShown": true,
    "interfaceTourPassed": true,
    "vipPromotionClicked": false,
    "isTrialDisclaimerClosed": true,
    "isCookiesNotificationClosed": true,
    "webinarsPanelShown": true,
    "rafflesPanelShown": true,
    "rafflesBannerShown": true,
    "rafflesBtnShown": true,
    "performanceDashboardShown": true,
    "stakeHintShown": true,
    "customDemoBalanceHintShown": true,
    "marginTypeTutorialShown": true,
    "mclarenPalettePopupShown": true,
    "islamicHintShown": true,
    "rolloverPopupShown": true
  },
  /*
   * `UserFavAssetsSettingsData::favoriteAssets` binds to a
   * `std::vector<std::shared_ptr<F2::IQFavoritOptionData>>`, so the entries are
   * objects, not bare ids. `IQFavoritOptionData` takes `favoriteAssetId` (int)
   * and `type`, which goes through `enum_as_string_reader_t<IQOptionType>`.
   *
   * The enum's own table, `F2::MVEnum<F2::IQOptionType>::mapper()`, spells the
   * value `turbo` — not `turbo-option`. `F2::getOptionType()` does accept
   * `turbo-option`, but it is a different table and not the one JSON uses, so
   * that value fails the round-trip with
   * `serializeToJSON error: Failed to write attribute: type`.
   * The grid config's `selectedActiveType` is a plain string, so `turbo-option`
   * stays correct there.
   *
   * Sending ids directly is what produced `Cannot parse common config: Object
   * is expected` — and the client then wrote the setting back as
   * `{"favoriteAssets":[]}`, which is the parse failing in the open.
   */
  "traderoom_fav_assets": {
    "favoriteAssets": ACTIVES.map((a) => ({
      "favoriteAssetId": a.id,
      "type": "turbo"
    }))
  },
  /*
   * `UserCombinedContextMenuSettingsData` has one mandatory attribute, and it
   * binds to a `std::map`, so an empty object satisfies it. Returning `{}` for
   * the whole config does not: the map has to be present under its own key.
   */
  "context_menu_combined": {
    "contextMenuSettings": {}
  },

  "privacy-settings": {
    "allow_share_chosen_asset": true
  },
  "traderoom_gl_shortcuts": {
    "disabled_shortcuts": []
  },
  "margin-trading-settings": {
    "enable_advanced_ui": false
  },

  /**
   * Stored leaderboard positions.
   *
   * `positions_in_leaderboard` is the one mandatory attribute of
   * `F2::LeaderboardStoredPositionsData`, and it binds to a
   * `std::vector<LeaderboardPosStored>`, so an empty array satisfies it.
   * Returning `{}` here is what made the client log
   * `Cannot parse common config: Missing mandatory attribute:
   * positions_in_leaderboard` — the prefix names the shared config parser,
   * not `traderoom_gl_common`.
   */
  "leaderboard": {
    "positions_in_leaderboard": []
  },
  /*
   * The chart layout, copied from a live traderoom's own `set-user-settings`
   * write rather than guessed. Several fields are not what they look like:
   *
   *   - `timeScale` is the width of the visible window, not a multiplier. The
   *     live value is ~2120; a 1 here collapses the chart to a few pixels and
   *     the client then never asks for a history range, because nothing fits.
   *   - `plotType` is `candles`, plural.
   *   - `gridSchemeRows` and `gridSchemeColumns` are percentages, so a single
   *     full-size cell is `[100]`, not `[1]`, and `gridSchemeName` spells that
   *     layout `default_1_1`.
   *   - `indicators` and `scriptedIndicators` are JSON held in a string, so an
   *     empty one is a document, not an empty string.
   */
  "traderoom_gl_grid": {
    "name": "default",
    "gridSchemeName": "default_1_1",
    "gridSchemeRows": [100],
    "gridSchemeColumns": [100],
    "fixedNumberOfPlotters": 1,
    "selectedActiveId": ACTIVES[0].id,
    "selectedActiveType": "digital-option",
    "plotters": [0, 1, 2].map((i) => ({
      "activeId": ACTIVES[i].id,
      "activeType": "digital-option",
      "isMinimized": false,
      "plotType": "candles",
      "emptyCandles": false,
      /*
       * These two travel together. The plot derives its candle type from the
       * scale, so a duration that disagrees with it is discarded:
       * `IQPlot::startLoadingNewCandleType` recomputes the type and resubscribes
       * at one second, which is why the client asked for single-second candles
       * no matter what the config said.
       *
       * This is the pair a live traderoom was recorded holding for a ten-second
       * chart. There is one entry per open tab, because a tab with no entry
       * falls back to the engine's own default of sixty seconds and then drags
       * the whole axis back with it.
       */
      "candleDuration": 10,
      "timeScale": 2119.972496676448,
      "indicators": "{\"indicators\":[]}",
      "scriptedIndicators": "{\"scripted_indicators\":[]}",
      "stackPanelSizes": [100],
      "lineColor": "",
      "lineWidth": 1,
      "candleColorUp": "",
      "candleColorDown": "",
      "emptyHACandles": false,
      "candleHAColorUp": "",
      "candleHAColorDown": "",
      "chartPriceType": "mid"
    }))
  }
};

/** @returns the stored shape for a config name, or `{}` when unknown. */
export function defaultUserConfig(name, account) {
  const value = DEFAULTS[name];
  if (!value) return {};
  const copy = structuredClone(value);
  // The wallet is per account, so it cannot live in a static default.
  if (name === "traderoom_gl_common") copy.balanceId = account.activeBalanceId;
  return copy;
}
