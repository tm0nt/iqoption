/**
 * Which of someone's wallets a screen is talking about.
 *
 * Everyone has two — a real one and a practice one — and which is meant
 * depends on the screen. Three rules, and every wallet read in the app follows
 * one of them:
 *
 *   - What the person is looking at now: `activeWallet`. The traderoom lets
 *     them switch, and the cabinet has to agree with it or the same account
 *     shows two different balances in two places.
 *   - Where real money goes: `realWallet`. A deposit credits it and a
 *     withdrawal leaves from it, whichever wallet is being traded on; practice
 *     money is not money and cannot be paid out.
 *   - Everything else reads the list.
 */

/** `IQBalanceType`: the two kinds of wallet. */
export const REAL = 1;
export const PRACTICE = 4;

type Wallet = { type: number };
type Identified = Wallet & { id: number };

/**
 * The wallet someone is trading on.
 *
 * `activeBalanceId` is their recorded choice. It falls back to the practice
 * wallet rather than to the first of the list, because the list is ordered by
 * type and so begins with the real one — which on an unfunded account is
 * empty, and showing someone an empty balance they did not choose reads as a
 * broken account.
 */
export function activeWallet<T extends Identified>(wallets: T[], activeBalanceId?: number | null): T | undefined {
  return (
    (activeBalanceId != null ? wallets.find((wallet) => wallet.id === activeBalanceId) : undefined) ??
    wallets.find((wallet) => wallet.type === PRACTICE) ??
    wallets[0]
  );
}

/** The wallet real money moves through. */
export function realWallet<T extends Wallet>(wallets: T[]): T | undefined {
  return wallets.find((wallet) => wallet.type === REAL) ?? wallets[0];
}
