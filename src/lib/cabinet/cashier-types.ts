/**
 * The cashier's shapes, with no server in them.
 *
 * In its own module because client components need the type and the initials
 * helper, and the module that reads the settings reaches for Prisma — importing
 * that from the browser bundle drags the database driver in behind it, and the
 * build fails on `fs` with no hint of why.
 */
import { round2 } from "./money";

export type CashierMethod = {
  id: string;
  name: string;
  days: string;
  deposit: boolean;
  withdrawal: boolean;
  kind: "bank" | "crypto";
};

/**
 * Everything the operator decides about money moving in and out.
 *
 * A limit of 0 means "no limit" rather than "nothing allowed": a minimum of 0
 * is meaningless and a maximum of 0 would close the cashier, which is what
 * turning a method off is for.
 */
export type CashierSettings = {
  methods: CashierMethod[];

  minDeposit: number;
  /** Per request. 0 is no ceiling. */
  maxDeposit: number;
  /** Offered as buttons on the deposit page, largest first. */
  depositPresets: number[];
  /**
   * How many deposits one person may have waiting at once. Every pending
   * deposit is a row someone has to reconcile by hand, so an unbounded number
   * is an unbounded queue. 0 is no limit.
   */
  maxPendingDeposits: number;

  minWithdrawal: number;
  /** Per request. 0 is no ceiling. */
  maxWithdrawal: number;
  freeWithdrawalsPerMonth: number;
  /** Charged on a withdrawal once the free ones for the month are used. */
  withdrawalFeePercent: number;
  withdrawalFeeFixed: number;
  /** Refuse withdrawals until identity verification is approved. */
  requireKycForWithdrawal: boolean;

  /** Where the deposit form's "Terms & Conditions" goes. Empty shows no link. */
  termsUrl: string;
};

export const CASHIER_DEFAULTS: CashierSettings = {
  methods: [{ id: "pix", name: "PIX (CPF)", days: "1 - 3 business days", deposit: true, withdrawal: true, kind: "bank" }],
  minDeposit: 10,
  maxDeposit: 0,
  depositPresets: [5000, 2500, 1000, 500, 250, 100, 50, 25],
  maxPendingDeposits: 3,
  minWithdrawal: 10,
  maxWithdrawal: 0,
  freeWithdrawalsPerMonth: 1,
  withdrawalFeePercent: 0,
  withdrawalFeeFixed: 0,
  requireKycForWithdrawal: false,
  termsUrl: "",
};

/** Icons are drawn from the rail's own name, so a new rail needs no new code. */
/**
 * The platform's own artwork for a payment method, or null for none.
 *
 * Matched on the method's name rather than configured per row, so a cashier
 * that was set up before any of this existed shows its icons without being
 * edited. An unmatched method keeps the lettered badge, which is why this
 * returns null instead of a placeholder: a wrong logo is worse than initials.
 *
 * The files are mirrored by `scripts/download-artwork.mjs` and cut from the
 * engine's sprite atlas; where the platform has no logo of its own — Tether,
 * USDC, Cardano, BNB, whose artwork only exists with an OTC badge burnt into
 * it — the generic crypto mark stands in rather than a coin logo from
 * somewhere else.
 */
const METHOD_ICONS: [RegExp, string][] = [
  [/bitcoin|\bbtc\b/i, "/storage/cashier/methods/bitcoin.png"],
  [/ethereum|\beth\b/i, "/storage/cashier/methods/eth.png"],
  [/litecoin|\bltc\b/i, "/storage/cashier/methods/ltc.png"],
  [/ripple|\bxrp\b/i, "/storage/cashier/methods/xrp.png"],
  [/visa/i, "/storage/cashier/methods/visa.svg"],
  [/maestro/i, "/storage/cashier/methods/maestro.svg"],
  [/mastercard|master card/i, "/storage/cashier/methods/mastercard.svg"],
  [/\bpix\b|bank|transfer|boleto/i, "/storage/cashier/methods/wallet.svg"],
  // Anything else crypto-shaped: the generic mark.
  [/coin|crypto|usdt|usdc|tether|cardano|\bada\b|\bbnb\b|binance|solana|\bsol\b|doge/i, "/storage/cashier/methods/other_cryptos.svg"],
];

export function methodIcon(method: CashierMethod): string | null {
  for (const [pattern, file] of METHOD_ICONS) {
    if (pattern.test(method.name) || pattern.test(method.id)) return file;
  }
  // A method with no match but marked crypto still gets the generic mark.
  return method.kind === "crypto" ? "/storage/cashier/methods/other_cryptos.svg" : null;
}

export function methodInitials(method: CashierMethod) {
  const match = /\(([^)]+)\)/.exec(method.name);
  return (match?.[1] ?? method.name).slice(0, 4).toUpperCase();
}

/**
 * The wording the built-in methods carry for how long they take.
 *
 * Exported so the panels can recognise it: a value that matches this is the
 * default and gets translated, while anything else is what an administrator
 * typed and is shown as typed. Translating that would overwrite their words.
 */
export const DEFAULT_DAYS = "1 - 3 business days";

/**
 * What the platform keeps of one withdrawal.
 *
 * Nothing while the month's free ones last. After that the fixed part plus the
 * percentage, never more than the amount itself — a fee that exceeds what is
 * being withdrawn is a request that pays the person a negative sum.
 */
export function withdrawalFee(settings: CashierSettings, amount: number, freeLeft: number) {
  if (freeLeft > 0) return 0;
  const fee = round2(settings.withdrawalFeeFixed + (amount * settings.withdrawalFeePercent) / 100);
  return Math.min(Math.max(fee, 0), amount);
}

/** True when a deposit amount sits inside the configured limits. */
export function withinLimits(amount: number, min: number, max: number) {
  return amount >= min && (max <= 0 || amount <= max);
}
