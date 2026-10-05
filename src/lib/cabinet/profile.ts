/**
 * The chrome every cabinet page shares.
 *
 * Every page needs the same things before it can draw anything — a session,
 * the account, the platform's brand, and the wallets the header and the
 * cashier talk about. They used to be assembled page by page, and drifted:
 * the deposit and withdrawal pages never passed the brand, so the header
 * showed the build's logo there and the platform's everywhere else; two pages
 * called an account verified when its e-mail was confirmed and six when its
 * identity was. This is the one place that decides.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { activeWallet, PRACTICE, REAL } from "@/lib/cabinet/wallet";
import { cabinetCopy } from "@/i18n/cabinet";
import { setting } from "@/lib/engine/settings";
import { formatMoney } from "@/lib/cabinet/format";

/**
 * Loads the signed-in account, or sends them to sign in.
 *
 * `nextPath` is the page they were heading for, so the login form can return
 * them to it rather than to the traderoom.
 *
 * An account closed since its session was issued is signed out here. The web
 * session is a signed token that outlives the row it describes, so without
 * this a person who closed their account — or was disabled by an
 * administrator — kept browsing the cabinet for up to a week.
 */
export async function loadCabinet(lang: string, nextPath: string) {
  const copy = cabinetCopy(lang);
  const [brand, session] = await Promise.all([setting("brand"), auth()]);
  if (!session?.user) redirect(`/${lang}/login?next=${nextPath}`);

  const user = await prisma.user.findUnique({
    where: { id: session.user.platformId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      phone: true,
      phoneCountry: true,
      avatarUrl: true,
      createdAt: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      citizenship: true,
      isUsPerson: true,
      publicProfile: true,
      displayName: true,
      notifications: true,
      closedAt: true,
      deletionRequestedAt: true,
      activeBalanceId: true,
      kycStatus: true,
      isActive: true,
      balances: { select: { id: true, amount: true, currency: true, type: true }, orderBy: { type: "asc" } },
    },
  });
  if (!user) redirect(`/${lang}/login`);
  if (!user.isActive) redirect(`/api/session/closed?locale=${lang}`);

  const wallet = activeWallet(user.balances, user.activeBalanceId);
  const real = user.balances.find((candidate) => candidate.type === REAL) ?? null;

  return {
    user,
    wallet,
    /** Where deposits land and withdrawals leave from, whichever wallet is being traded on. */
    real,
    /** What the shell needs to wear the platform's own identity. */
    brand: { name: brand.name, logoUrl: brand.logoUrl, primary: brand.primary, supportEmail: brand.supportEmail, siteUrl: brand.siteUrl },
    account: {
      email: user.email,
      balance: wallet ? formatMoney(Number(wallet.amount), wallet.currency, lang) : "0.00",
      balanceLabel: wallet?.type === PRACTICE ? copy.account.practice : copy.account.real,
      /** Identity approved — what "verified" means everywhere in the cabinet. */
      verified: user.kycStatus === "APPROVED",
      /** Nothing submitted yet, which is what the drawer's red prompt is for. */
      needsDetails: user.kycStatus === "NONE",
      avatarUrl: user.avatarUrl,
    },
  };
}

/** The same, for a page under /profile. */
export function loadProfile(lang: string, slug: string) {
  return loadCabinet(lang, `/${lang}/profile/${slug}`);
}
