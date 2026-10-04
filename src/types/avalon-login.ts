/** Content contracts for the trade.avalonbroker.com auth-page clones. */

/** Locales offered by the site's own language menu. */
export type AvalonLocale = "en" | "es" | "pt";

/** A country offered by the register page's (region-restricted) country select. */
export interface AvalonCountry {
  name: string;
  /** ISO 3166-1 alpha-2, lowercase — also the flag filename. */
  iso: string;
}

/** An entry in the register page's international dial-code select. */
export interface AvalonDialCode {
  name: string;
  /** E.164 prefix including the leading "+". */
  dial: string;
  iso: string;
}

/** An external legal link embedded in the register page's terms sentence. */
export interface AvalonTermsLink {
  text: string;
  href: string;
}

/** Copy shared by every auth page: chrome, risk disclosure, cookie notice. */
export interface AvalonCommonCopy {
  /** Short code rendered next to the flag, e.g. "en". Uppercased by CSS. */
  langLabel: string;
  signUp: string;
  logIn: string;
  footer: string;
  divider: string;
  /** Legend chip text. Stored in source casing; rendered uppercase by CSS. */
  riskLegend: string;
  riskBody: string;
  cookieMessage: string;
  cookieAction: string;
}

export interface AvalonLoginCopy {
  title: string;
  heading: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  submit: string;
  google: string;
  forgotPassword: string;
  /** "Don't have an account?" + link + optional trailing word. */
  noAccountLead: string;
  noAccountLink: string;
  noAccountTail: string;
  /** On the button while the request is in flight. */
  submitting: string;
  /**
   * Shown for every sign-in failure, whatever it was. Naming which of the two
   * was wrong turns the form into a way of discovering who has an account.
   */
  invalidCredentials: string;
}

export interface AvalonRegisterCopy {
  title: string;
  heading: string;
  firstNamePlaceholder: string;
  lastNamePlaceholder: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  phonePlaceholder: string;
  countrySearchPlaceholder: string;
  countryHint: string;
  submit: string;
  google: string;
  /**
   * The terms sentence split around its three links: always `termsLinks.length + 1`
   * plain-text segments interleaved with the links.
   */
  termsSegments: string[];
  termsLinks: AvalonTermsLink[];
  hasAccountLead: string;
  hasAccountLink: string;
  hasAccountTail: string;
  /** On the button while the account is being created. */
  submitting: string;
}

export interface AvalonChangePasswordCopy {
  title: string;
  heading: string;
  instruction: string;
  emailPlaceholder: string;
  submit: string;
  backToLogin: string;
  noAccountLead: string;
  noAccountLink: string;
  noAccountTail: string;
}

/** Everything one locale needs to render all three auth pages. */
export interface AvalonDictionary {
  common: AvalonCommonCopy;
  login: AvalonLoginCopy;
  register: AvalonRegisterCopy;
  changePassword: AvalonChangePasswordCopy;
}

/** Which page a shared chrome component is rendering inside. */
export type AvalonAuthPage = "login" | "register" | "changePassword";

/* ---------------------------------------------------------------------------
   Traderoom
   --------------------------------------------------------------------------- */

/** An asset tab open in the traderoom's top bar. */
export interface AvalonAssetTab {
  id: string;
  name: string;
  /** Sub-label, e.g. "Up to 5 min" or "Stock". */
  kind: string;
  /** Emoji/short badge stand-in for the instrument glyph. */
  badge: string;
  badgeClass: string;
}

/** One candle in the mock price series. */
export interface AvalonCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

/** A row in the Trading History panel. */
export interface AvalonPosition {
  time: string;
  date: string;
  asset: string;
  kind: string;
  direction: "up" | "down";
  amount: string;
  result: string;
}

/** A card in the Tournaments panel. */
export interface AvalonTournament {
  name: string;
  status: string;
  prizePool: string;
  entryFee: string;
  participants: string;
  instruments: string;
}

/** A row in the Leaderboard panel. */
export interface AvalonLeader {
  rank: number;
  name: string;
  amount: string;
}

/** A card in the Promo panel. */
export interface AvalonPromo {
  kind: string;
  tag: string;
  title: string;
  meta: string;
  isNew?: boolean;
}

/** A row in the Market Analysis economic calendar. */
export interface AvalonCalendarEvent {
  flag: string;
  name: string;
  time: string;
  impact: "low" | "medium" | "high";
}

/** A tutorial entry. */
export interface AvalonTutorial {
  title: string;
  meta: string;
  icon: string;
}

/** An asset card inside the asset selector. */
export interface AvalonAssetCard {
  name: string;
  profit: string;
  price: string;
  change: string;
  up: boolean;
}
