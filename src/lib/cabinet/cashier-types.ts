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
