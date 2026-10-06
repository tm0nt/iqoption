/**
 * Where PIX settlements arrive.
 *
 * This is the endpoint that moves money, so it is written suspicious of its
 * own caller. Three things guard it, in this order:
 *
 * 1. **Who sent it.** Dubai Cash authenticates with HTTP Basic, using an id
 *    and secret we registered with their webhook manager. No credentials
 *    configured means the endpoint refuses everything rather than trusting
 *    anonymous callers — an open till is worse than a broken one. The compare
 *    is constant-time, because a timing oracle on a shared secret is a slow
 *    way to hand it over.
 * 2. **Which transaction.** The event carries the `externalId` the charge was
 *    created with, matched against `providerRef`. An event for a charge this
 *    platform never opened is logged and ignored.
 * 3. **Whether it already happened.** Providers retry, and a retry must not
 *    credit twice. `settleTransaction` settles only a row that is still
 *    PENDING — the status change is the lock — so a second delivery finds
 *    nothing to do and answers 200 anyway, because a provider that is told
 *    "error" retries forever.
 *
 * Crediting goes through the same `settleTransaction` an administrator's
 * approval runs. Not a copy of it: the wallet, the promo bonus and the
 * affiliate's first deposit all have to move the same way whether a webhook
 * or a person said yes.
 */
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { settleTransaction } from "@/lib/cabinet/settle";
import { pixProvider, pixWebhookCredentials } from "@/lib/payments/pix/provider";

export const dynamic = "force-dynamic";

/** Constant-time string compare, padded so length alone leaks nothing. */
function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  const width = Math.max(left.length, right.length, 1);
  const padLeft = Buffer.alloc(width);
  const padRight = Buffer.alloc(width);
  left.copy(padLeft);
  right.copy(padRight);
  return timingSafeEqual(padLeft, padRight) && left.length === right.length;
}

function authorised(request: Request) {
  const expected = pixWebhookCredentials();
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const split = decoded.indexOf(":");
  if (split < 0) return false;

  return same(decoded.slice(0, split), expected.id) && same(decoded.slice(split + 1), expected.secret);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const provider = pixProvider();
  if (!provider) return NextResponse.json({ error: "no pix provider" }, { status: 503 });

  const body = await request.json().catch(() => null);
  const event = provider.readEvent(body);
  if (!event) {
    // Parsed and not interesting — a kind this does not act on. Answering 200
    // stops the provider retrying something that will never be acted on.
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!event.externalId) {
    console.error("[pix] event with no externalId", event.kind, event.transactionUuid);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const row = await prisma.transaction.findFirst({
    where: { providerRef: event.externalId },
    select: { id: true, status: true, kind: true, amount: true },
  });

  if (!row) {
    /*
     * Not an error on their side. It is a charge this platform did not open,
     * or one whose row was removed. Logged with the reference so it can be
     * found, and acknowledged so it is not retried forever.
     */
    console.error(`[pix] ${event.kind} for unknown reference ${event.externalId}`);
    return NextResponse.json({ ok: true, unknown: true });
  }

  if (row.status !== "PENDING") {
    return NextResponse.json({ ok: true, alreadySettled: true });
  }

  /*
   * A reversal or a refund on a deposit that has not been credited yet means
   * the money is not coming. There is nothing to claw back — the row is still
   * PENDING — so it is closed as rejected rather than left in the queue for
   * somebody to chase.
   */
  const outcome =
    event.kind === "reversal" || event.kind === "refund"
      ? "reject"
      : event.status === "paid"
        ? "approve"
        : event.status === "failed"
          ? "reject"
          : null;

  if (!outcome) return NextResponse.json({ ok: true, pending: true });

  /*
   * `by: null` says no person decided this. The cashier screen shows the
   * difference, and it matters when somebody asks later who approved a
   * payment.
   */
  const result = await settleTransaction(row.id, outcome, {
    by: null,
    note: `PIX ${event.kind} ${event.status}${event.endToEndId ? ` · ${event.endToEndId}` : ""}`,
    providerRef: event.externalId,
  });

  if (!result.ok) {
    console.error(`[pix] could not settle ${row.id}: ${result.reason}`);
    /*
     * 500 on purpose: this is our failure, not a bad request, and the
     * provider retrying is exactly what should happen.
     */
    return NextResponse.json({ error: "could not settle" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settled: outcome });
}
