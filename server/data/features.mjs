/**
 * Platform feature flags.
 *
 * Read from a live `GET /api/v2/features?category=platform-4`, which answers
 * with 377 flags of which 137 are on. Serving an empty list instead leaves the
 * client with no traderoom to build — most of the interface is gated here.
 *
 * Worth noting which instrument families are on: digital, blitz and the three
 * margin ones. `binary-instrument` is **off**, which is why the `turbo`,
 * `binary` and `blitz` blocks of `get-initialization-data` come back empty on
 * the live feed.
 */

/**
 * Families this server does not implement.
 *
 * Copying the live list wholesale turns on margin and digital instruments, and
 * the client then waits for instrument sets we never send — it holds its login
 * view rather than reporting anything missing. The flags describe *this*
 * platform, so the families we do serve are the ones that stay on.
 */
const NOT_IMPLEMENTED = new Set([
  "digital-instrument",
  "blitz-instrument",
  "blitz-multi-deals",
  // Not listed here on purpose: `margin-forex-instrument`,
  // `margin-cfd-instrument` and `margin-crypto-instrument`.
  // `CInstrument::isActivesReceived()` walks every option type and requires
  // actives for each one that is either available to the user **or** a
  // marginal instrument — the marginal ones regardless of their flag. Turning
  // the flags off stops the client asking for those instruments while it keeps
  // waiting for them, which deadlocks the login gate.
  "margin-instruments-swap",
  "margin-asset-info",
  "margin-inline-tpsl-editor",
  "new-margin-portfolio",
  "hide-margin-balance",
  "hide-margin-balance-setting",
  "hide-margin-crypto-expirations",
  "ms-portfolio",
  "limit-orders",
  "trailing-stop",
  "do-tick-deals",
  "fx-tick-deals",
  "tick-deals",
  // The client has an `EventTraderoomTabsReceived` it never gets from us, and
  // a grid-layout selector with no layouts behind it.
  "traderoom-tabs",
  "multi-grid-layout",
  "options-asset-selector-redesign",
  "avalon-redesign",
]);

/** Binary options are what this server actually serves candles for. */
const EXTRA_ENABLED = ["binary-instrument"];

/** Flags reported as enabled. Everything else is answered as disabled. */
export const ENABLED_FEATURES = [
  "tournaments", "select-balance-dialog", "oneclick-deposit-dialog", "email-activation",
  "chat", "manager-feedback", "faq", "deposit-dialog", "deposit-panel-payment-form",
  "leaderboard-notification", "api-to-websocket", "social-user-profile",
  "deposit-bonus-disabled", "social-user-profile-active-asset-show", "chat-support",
  "chat-feedback", "chat-online-users", "chat-send-heartbeat", "chat-send-text-typing",
  "digital-instrument", "profit-scale", "portfolio", "economic-calendar", "limit-orders",
  "volume-indicator", "chat-support-demo-users", "chat-message-like",
  "chat-public-attachments", "trailing-stop", "news-browser", "cfd-available-onopen",
  "overnight-schedule", "callput-ab", "buy-sell-price", "welcome-todo", "cfd-expiration",
  "earnings-calendar", "asset-small-profile", "indicator-templates",
  "push-notifications-by-default", "fx-min-deal-amount", "spread-by-leverage",
  "strikes-hidden", "script-indicators", "only-closed-candles", "asset-profile",
  "fx-option-payout-limit", "fx-spread", "personal-manager", "support-phones", "avatars",
  "indicators-info-tab", "video-tutorials", "chat-send-typing", "trading-phases",
  "analytics", "asset-technical-signals", "tutorial-balance", "custodial-fee",
  "info-btns-visible", "price-alerts", "ms-portfolio", "spread-in-pips", "tick-deals",
  "new-api-reg", "pips-price-right-panel", "block-withdraw-wo-docs", "deposit-border-style",
  "margin-forex-instrument", "margin-cfd-instrument", "margin-crypto-instrument",
  "cashbox-v3", "retention-popup", "tournaments-do", "pricing-v2",
  "margin-instruments-swap", "user-script-indicators", "overnights-write-off",
  "margin-asset-info", "margin-inline-tpsl-editor", "do-tick-deals", "exchange-rate-v2",
  "desktop-registration", "popup-server", "leaderboard-v2", "hide-margin-balance",
  "disable-phone-registration", "graph-improvements",
  "deposit-crypto-commission-rules-checkbox", "deposit-terms-and-conditions-checkbox",
  "bg-map", "new-margin-portfolio", "cashier-new-card-flow", "post-split-graph-correction",
  "show-support-pictures-in-chats", "hide-margin-crypto-expirations",
  "cfd-forex-ux-ui-improv-tips", "cfd-forex-ux-ui-improv-tpsl", "pending-on-closed-market",
  "unavailable-country-registration", "hide-video-categories", "traders-mood-redesign",
  "kyc-flow-in-traderoom", "deposit-checkout-redesign", "web-dependencies", "fx-tick-deals",
  "kyc-questionnaire-type", "traderoom-tabs", "trading-settings-cluster-bo",
  "kyc-verification-before-deposit", "deposit-soft-restrictions", "blitz-instrument",
  "deposit-checkout-redesign-improvements", "user-availability", "promo-codes",
  "promo-centre", "blitz-multi-deals", "cashier-promo-codes", "avalon-redesign",
  "hide-chat-room", "trading-settings-cluster-do-v2", "trading-settings-cluster-bo-v2",
  "trading-settings-cluster-turbo-v2", "trading-settings-cluster-blitz-v2",
  "trading-settings-cluster-fx-v2", "delete-old-fav-assets", "multi-grid-layout",
  "return-wd", "webinars", "options-asset-selector-redesign", "hide-otc",
  "mandatory-phone-field-on-registration", "options-assets-group", "show-callput-price",
  "show-trial-cookies-and-disclaimer-notifications", "hide-margin-balance-setting",
];

/** The flags this server stands behind. */
export function enabledFeatures() {
  const kept = ENABLED_FEATURES.filter((name) => !NOT_IMPLEMENTED.has(name));
  return [...new Set([...kept, ...EXTRA_ENABLED])];
}

/** In the shape the feed reports, so the client can read it unchanged. */
export function featureRows(category = "platform-4") {
  return enabledFeatures().map((name, index) => ({
    id: index + 1,
    name,
    category,
    params: null,
    version: 1,
    status: "enabled",
  }));
}
