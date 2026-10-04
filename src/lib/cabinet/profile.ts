/**
 * The chrome every profile page shares.
 *
 * Each of the six pages needs the same three things before it can draw
 * anything — a session, the account, and the wallet the header shows — and
 * repeating that in six files is six places for them to drift apart.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { activeWallet } from "@/lib/cabinet/wallet";

const MONEY = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "October 2, 2026", as the live page writes the registration date. */
export function longDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Loads the signed-in account, or sends them to sign in.
 *
 * `slug` is the page they were heading for, so the login form can return them
 * to it rather than to the traderoom.
 */
export async function loadProfile(lang: string, slug: string) {
  const session = await auth();
  if (!session?.user) redirect(`/${lang}/login?next=/${lang}/profile/${slug}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      phone: true,
      createdAt: true,
      publicProfile: true,
      displayName: true,
      notifications: true,
      closedAt: true,
      deletionRequestedAt: true,
      activeBalanceId: true,
      balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
    },
  });
  if (!user) redirect(`/${lang}/login`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);

  return {
    user,
    account: {
      email: user.email,
      balance: wallet ? `${MONEY.format(Number(wallet.amount))} ${wallet.currency}` : "0.00",
      // Type 4 is the practice wallet; anything else is real money.
      balanceLabel: wallet?.type === 4 ? "Practice account" : "Real account",
      verified: user.emailVerified !== null,
    },
  };
}
