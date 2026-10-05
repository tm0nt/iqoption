/**
 * The cashier's shapes, with no server in them.
 *
 * In its own module because client components need the type and the initials
 * helper, and the module that reads the settings reaches for Prisma — importing
 * that from the browser bundle drags the database driver in behind it, and the
 * build fails on `fs` with no hint of why.
 */
export type CashierMethod = {
  id: string;
  name: string;
  days: string;
  deposit: boolean;
  withdrawal: boolean;
  kind: "bank" | "crypto";
};

export type CashierSettings = {
  methods: CashierMethod[];
  freeWithdrawalsPerMonth: number;
  minWithdrawal: number;
  minDeposit: number;
  /** Offered as buttons on the deposit page, largest first. */
  depositPresets: number[];
};

/** Icons are drawn from the rail's own name, so a new rail needs no new code. */
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
