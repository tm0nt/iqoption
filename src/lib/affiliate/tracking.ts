/**
 * Following a visitor from an affiliate's link to an account.
 *
 * Three moments, three functions:
 *
 *   - `recordClick`: someone arrives with `?ref=CODE`. The visit is written
 *     down and the browser is handed a cookie naming it.
 *   - `attachReferral`: that browser creates an account. The cookie is read
 *     back and the account is the affiliate's, for good.
 *   - `recordFirstDeposit`: the account's first deposit is approved, which is
 *     the event most affiliate deals turn on.
 *
 * The cookie is signed. Its value decides who gets paid, and an unsigned one
 * is a field anyone can type an affiliate's id into. Signing costs one HMAC
 * and means the only way to be attributed to an affiliate is to have actually
 * come through their link. The last click wins: a newer link overwrites it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { affiliateProgram } from "./program";

export const CLICK_COOKIE = "aff_click";

export { TRACKING_PARAMS } from "./params";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set; affiliate cookies cannot be signed");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`aff:${payload}`).digest("base64url").slice(0, 32);
}

/** `<clickId>.<affiliateId>.<signature>` */
export function clickCookieValue(clickId: number, affiliateId: number) {
  const payload = `${clickId}.${affiliateId}`;
  return `${payload}.${sign(payload)}`;
}

/** The click a cookie names, or null when it is missing, malformed or not ours. */
export function readClickCookie(value: string | undefined | null): { clickId: number; affiliateId: number } | null {
  if (!value) return null;
  const match = /^(\d{1,10})\.(\d{1,10})\.([A-Za-z0-9_-]{32})$/.exec(value);
  if (!match) return null;
  const expected = Buffer.from(sign(`${match[1]}.${match[2]}`));
  const given = Buffer.from(match[3]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { clickId: Number(match[1]), affiliateId: Number(match[2]) };
}

/** Trimmed, bounded and stripped of anything that is not printable. */
function clean(value: string | null | undefined, max: number) {
  if (!value) return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return text ? text.slice(0, max) : null;
}

/** The visitor's address, as the proxy in front of the app reports it. */
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return clean(forwarded || headers.get("x-real-ip"), 45);
}

/** Headers a CDN or proxy uses to say which country a request came from. */
const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

function countryOf(headers: Headers) {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim().toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value) && value !== "XX") return value;
  }
  return null;
}

/**
 * Writes down one visit through a link, or reuses the visitor's last one.
 *
 * The same address clicking the same affiliate's link again within a minute is
 * the same visit — a reload, a back button, a preview bot following a shared
 * link twice — and counting it twice is how click numbers stop meaning
 * anything.
 *
 * @returns the cookie value to set, or null when the code is not one that
 *          tracks (unknown, not yet approved, suspended, or the programme is
 *          closed).
 */
export async function recordClick(input: {
  code: string;
  sub?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  landing: string;
  headers: Headers;
}) {
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,32}$/.test(code)) return null;

  const [program, affiliate] = await Promise.all([
    affiliateProgram(),
    prisma.affiliate.findUnique({ where: { code }, select: { id: true, status: true } }),
  ]);
  if (!program.enabled || !affiliate || affiliate.status !== "ACTIVE") return null;

  const ip = clientIp(input.headers);
  const recent = ip
    ? await prisma.affiliateClick.findFirst({
        where: { affiliateId: affiliate.id, ip, createdAt: { gte: new Date(Date.now() - 60_000) } },
        orderBy: { id: "desc" },
        select: { id: true },
      })
    : null;

  const click =
    recent ??
    (await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        subId: clean(input.sub, 64),
        utmSource: clean(input.utmSource, 128),
        utmMedium: clean(input.utmMedium, 128),
        utmCampaign: clean(input.utmCampaign, 128),
        landing: clean(input.landing, 512),
        referer: clean(input.headers.get("referer"), 512),
        ip,
        userAgent: clean(input.headers.get("user-agent"), 255),
        country: countryOf(input.headers),
      },
      select: { id: true },
    }));

  return { value: clickCookieValue(click.id, affiliate.id), maxAge: program.cookieDays * 86_400, affiliateId: affiliate.id };
}

/**
 * Makes a new account the affiliate's, from the cookie its browser carried.
 *
 * Never throws: an account that failed to be attributed is a lost commission,
 * an account that failed to be created is a lost customer, and only the first
 * of those is acceptable.
 *
 * @returns the referral, for the postback, or null when there is none.
 */
export async function attachReferral(userId: number, cookie: string | undefined, headers: Headers) {
  try {
    const claim = readClickCookie(cookie);
    if (!claim) return null;

    const [program, affiliate, click] = await Promise.all([
      affiliateProgram(),
      prisma.affiliate.findUnique({ where: { id: claim.affiliateId }, select: { id: true, status: true, userId: true } }),
      prisma.affiliateClick.findUnique({ where: { id: claim.clickId }, select: { id: true, affiliateId: true, subId: true } }),
    ]);
    if (!program.enabled || !affiliate || affiliate.status !== "ACTIVE") return null;
    // An affiliate cannot be their own referral.
    if (affiliate.userId === userId) return null;

    const sameClick = click && click.affiliateId === affiliate.id ? click : null;
    return await prisma.referral.create({
      data: {
        userId,
        affiliateId: affiliate.id,
        clickId: sameClick?.id ?? null,
        subId: sameClick?.subId ?? null,
        ip: clientIp(headers),
      },
      select: { id: true, affiliateId: true, clickId: true, subId: true, userId: true },
    });
  } catch (error) {
    // A second registration racing the first hits the unique key on userId.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      console.error("could not attach a referral:", error);
    }
    return null;
  }
}

/**
 * Records a referred account's first approved deposit, once.
 *
 * Runs inside the cashier's settlement transaction so the two cannot disagree.
 * `ftdAt: null` in the filter is the guard: a second approval finds nothing to
 * update.
 *
 * @returns true when this was the first.
 */
export async function recordFirstDeposit(
  tx: Prisma.TransactionClient,
  userId: number,
  amount: Prisma.Decimal,
  at: Date,
) {
  const updated = await tx.referral.updateMany({
    where: { userId, ftdAt: null },
    data: { ftdAt: at, ftdAmount: amount },
  });
  return updated.count > 0;
}

/**
 * A relative path inside this site, or the fallback.
 *
 * The click route redirects to wherever the link pointed, which makes it an
 * open redirect if `to` is taken as given: `//evil.example` is a path to a
 * browser and a host to everyone else.
 */
export function safeReturnPath(to: string | null | undefined, fallback: string) {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(to)) return fallback;
  return to.slice(0, 1024);
}
