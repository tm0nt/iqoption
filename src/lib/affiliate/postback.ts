/**
 * Telling an affiliate's own tracker that something happened.
 *
 * An affiliate running paid traffic needs to see their conversions in their own
 * tools, keyed by the click id they sent us. They give us a URL with macros in
 * it — `https://tracker.example/pb?cid={sub_id}&e={event}&p={amount}` — and on
 * each event this fills the macros and calls it.
 *
 * The URL is theirs, which makes this a request to an address a stranger
 * chose, sent from inside our network. So before anything is fetched:
 *
 *   - only http and https;
 *   - every address the host resolves to has to be a public one — no
 *     loopback, no private ranges, no link-local (which is where cloud
 *     metadata lives), no multicast. Checked inside the connection's own DNS
 *     lookup rather than beforehand, so a host that answers one address to
 *     the check and another to the connection gains nothing;
 *   - redirects are not followed, because a public host that answers 302 to
 *     `http://169.254.169.254/` would undo the check above;
 *   - five seconds, then it gives up.
 *
 * Every attempt is logged, so an affiliate who says "you never told me" can be
 * shown what was sent and what came back.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { prisma } from "@/lib/db";

export type PostbackEvent = "registration" | "ftd" | "cpa";

export const POSTBACK_MACROS = ["event", "click_id", "sub_id", "user_id", "amount", "currency"] as const;

function privateV4(address: string) {
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateV6(address: string) {
  const lower = address.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (mapped) return privateV4(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(lower);
}

export function isPublicAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return !privateV4(address);
  if (family === 6) return !privateV6(address);
  return false;
}

/**
 * The checks that need no network: a URL, http or https, and a host that is
 * not obviously this machine. What the form says when an affiliate saves one.
 */
export function postbackUrlProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.replace(/\{[a-z_]+\}/g, "x"));
  } catch {
    return "not a URL";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "only http and https";
  if (url.username || url.password) return "no credentials in the URL";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    return "not a public host";
  }
  if (isIP(host) && !isPublicAddress(host)) return "not a public address";
  return null;
}

/** Fills the macros, each value URL-encoded so a sub id cannot rewrite the query. */
export function fillMacros(template: string, values: Record<string, string | number | null | undefined>) {
  return template.replace(/\{([a-z_]+)\}/g, (whole, name: string) => {
    if (!(POSTBACK_MACROS as readonly string[]).includes(name)) return whole;
    const value = values[name];
    return encodeURIComponent(value === null || value === undefined ? "" : String(value));
  });
}

/** `dns.lookup`, refusing to hand back an address that is not public. */
const publicLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some(({ address }) => !isPublicAddress(address))) {
      return callback(new Error("host resolves to a private address"), "", 0);
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

function send(url: string): Promise<{ status: number | null; error: string | null }> {
  const problem = postbackUrlProblem(url);
  if (problem) return Promise.resolve({ status: null, error: problem });

  const client = url.startsWith("https:") ? https : http;
  return new Promise((resolve) => {
    // node:http follows no redirects, which is what is wanted here.
    const request = client.get(url, { lookup: publicLookup, timeout: 5_000, headers: { "user-agent": "affiliate-postback/1" } }, (response) => {
      response.resume();
      resolve({ status: response.statusCode ?? null, error: null });
    });
    request.on("timeout", () => request.destroy(new Error("timed out after 5 seconds")));
    request.on("error", (error) => resolve({ status: null, error: error.message.slice(0, 250) }));
  });
}

/**
 * Calls an affiliate's postback for one event, if they have one.
 *
 * Never throws: a tracker that is down must not fail the registration or the
 * deposit approval that caused the event.
 */
export async function firePostback(
  affiliateId: number,
  event: PostbackEvent,
  data: { userId: number; clickId?: number | null; subId?: string | null; amount?: number | null; currency?: string | null },
) {
  try {
    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { postbackUrl: true } });
    if (!affiliate?.postbackUrl) return;

    let { clickId, subId } = data;
    if (clickId === undefined || subId === undefined) {
      const referral = await prisma.referral.findUnique({ where: { userId: data.userId }, select: { clickId: true, subId: true } });
      clickId ??= referral?.clickId ?? null;
      subId ??= referral?.subId ?? null;
    }

    const url = fillMacros(affiliate.postbackUrl, {
      event,
      click_id: clickId,
      sub_id: subId,
      user_id: data.userId,
      amount: data.amount != null ? data.amount.toFixed(2) : "",
      currency: data.currency ?? "",
    });

    const result = await send(url);
    await prisma.affiliatePostback.create({
      data: { affiliateId, event, url: url.slice(0, 1024), status: result.status, error: result.error },
    });
  } catch (error) {
    console.error(`postback for affiliate ${affiliateId} failed:`, error);
  }
}
