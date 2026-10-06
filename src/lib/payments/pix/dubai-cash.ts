/**
 * PIX through Dubai Cash.
 *
 * Four things about this rail shape the adapter, and each one is in their
 * documentation rather than guessed:
 *
 * - **A charge is not a payment.** `create-immediate-qrcode` returns a BR Code
 *   to show; the money arrives later as a `PIX_PAY_IN` webhook, or not at all.
 * - **A payout is asynchronous.** `withdraw` answers `AWAITING`. The outcome
 *   is a `PIX_PAY_OUT` webhook.
 * - **Fees are separate entries.** The gross amount moves, and the fee is a
 *   different transaction, so the event's `amount` is not what the account
 *   nets. Nothing here tries to reconcile that; the operator's statement does.
 * - **The webhook is the primary source, polling is the fallback.** Their own
 *   advice, and it is why `chargeStatus` exists but is not what credits a
 *   deposit.
 *
 * The key lives in the environment. It is a bearer credential for moving
 * money, so it never reaches a settings row an administrator can read.
 */
import type { PixCharge, PixEvent, PixPayout, PixProvider, PixStatus } from "./pix-types";

const BASE = "https://api.dubai-cash.com/v1/customers";

/** Their vocabulary for "this is finished and the money moved". */
const DONE = new Set(["DONE", "COMPLETED", "PAID", "APPROVED"]);
/** ...and for "it will not". */
const FAILED = new Set(["FAILED", "CANCELLED", "CANCELED", "REFUSED", "REJECTED", "EXPIRED", "ERROR"]);

function statusFrom(raw: unknown): PixStatus {
  const value = String(raw ?? "").toUpperCase();
  if (DONE.has(value)) return "paid";
  if (FAILED.has(value)) return "failed";
  return "pending";
}

async function call(path: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      /*
       * `Bearer`, despite the key carrying its own `apikey_` prefix. Their
       * documentation does not say which scheme they read, so all four were
       * tried against `/account/balance`: the raw key, `x-api-key` and
       * `api-key` each answer 401, and only `Bearer` answers 200.
       */
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!response) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(`[pix] ${path} answered ${response.status}`, JSON.stringify(body)?.slice(0, 300));
    return null;
  }
  return body as Record<string, unknown> | null;
}

export function dubaiCashProvider(apiKey: string): PixProvider {
  return {
    id: "dubai-cash",
    test: false,

    async createCharge({ externalId, amount, document, name, description }): Promise<PixCharge | null> {
      const body = await call("/pix/create-immediate-qrcode", apiKey, {
        method: "POST",
        body: JSON.stringify({
          externalId,
          // Their field takes up to two decimals; anything finer is the
          // caller rounding where it should not.
          amount: Math.round(amount * 100) / 100,
          ...(document ? { document } : {}),
          ...(name ? { name } : {}),
          ...(description ? { description } : {}),
        }),
      });

      const data = body?.data as Record<string, unknown> | undefined;
      if (!data?.qrCode) return null;

      return {
        brCode: String(data.qrCode),
        qrImage: data.qrCodeImage ? String(data.qrCodeImage) : null,
        invoiceId: String(data.invoiceUuid ?? ""),
        /*
         * Whichever they answer with. Tested against the live API they echo
         * the one sent, but their own documented example answers with a
         * different one — so the charge's reference is read from the reply
         * rather than assumed, because that is what the webhook will carry.
         */
        externalId: String(data.externalId ?? externalId),
        amount: Number(data.amount ?? amount),
      };
    },

    async payout({ externalId, key, keyType, amount, holderName, holderDocument, description }) {
      const body = await call("/pix/withdraw", apiKey, {
        method: "POST",
        body: JSON.stringify({
          externalId,
          key,
          keyType,
          amount: Math.round(amount * 100) / 100,
          /*
           * Always sent when known. Their documentation is explicit: without
           * `holder.document` the order can be refused, because the ownership
           * of the destination key cannot be checked.
           */
          ...(holderName || holderDocument
            ? { holder: { ...(holderName ? { name: holderName } : {}), ...(holderDocument ? { document: holderDocument } : {}) } }
            : {}),
          ...(description ? { description } : {}),
        }),
      });

      const data = body?.data as Record<string, unknown> | undefined;
      if (!data) return null;

      return {
        transferId: String(data.uuid ?? ""),
        externalId: String(data.externalId ?? externalId),
        endToEndId: data.endtoendId ? String(data.endtoendId) : null,
        status: statusFrom(data.status),
        amount: Number(data.amount ?? amount),
      } satisfies PixPayout;
    },

    async chargeStatus(externalId) {
      const body = await call(`/pix/status-invoice?externalId=${encodeURIComponent(externalId)}`, apiKey);
      const data = body?.data as Record<string, unknown> | undefined;
      return data ? statusFrom(data.status) : null;
    },

    async payoutStatus(externalId) {
      const body = await call(`/pix/status?externalId=${encodeURIComponent(externalId)}`, apiKey);
      const data = body?.data as Record<string, unknown> | undefined;
      return data ? statusFrom(data.status) : null;
    },

    async balance() {
      const body = await call("/account/balance", apiKey);
      if (!body || typeof body.balance !== "number") return null;
      /*
       * `availableBalance` is what can actually be paid out and it is not
       * `balance` — the account this was written against showed 666.80 held
       * and 91.10 available. Reporting the larger one would promise payouts
       * the account cannot make. It is undocumented, so `balance` is the
       * fallback when it is absent.
       */
      const available = typeof body.availableBalance === "number" ? body.availableBalance : body.balance;
      return { available, blocked: Number(body.preventiveBlock ?? 0) };
    },

    readEvent(raw): PixEvent | null {
      if (!raw || typeof raw !== "object") return null;
      const payload = raw as Record<string, unknown>;

      /*
       * Their documentation shows the two events side by side under
       * `pixPayIn` and `pixPayOut` keys, which is how an example reads rather
       * than how a callback arrives — one callback carries one event. Both
       * shapes are accepted so a wrapped body does not go unread.
       */
      const candidates = [payload, payload.pixPayIn, payload.pixPayOut].filter(
        (value): value is Record<string, unknown> => Boolean(value) && typeof value === "object",
      );

      for (const candidate of candidates) {
        const event = String(candidate.event ?? "");
        const transaction = candidate.transaction as Record<string, unknown> | undefined;
        if (!event || !transaction) continue;

        const kind =
          event === "PIX_PAY_IN"
            ? "pay-in"
            : event === "PIX_PAY_OUT"
              ? "pay-out"
              : event === "PIX_REFUND"
                ? "refund"
                : event.startsWith("PIX_REVERSAL")
                  ? "reversal"
                  : null;
        if (!kind) continue;

        const bank = candidate.bankData as Record<string, unknown> | undefined;
        return {
          kind,
          transactionUuid: String(transaction.uuid ?? transaction.transactionId ?? ""),
          externalId: String(transaction.externalId ?? ""),
          amount: Number(transaction.amount ?? 0),
          status: statusFrom(candidate.status),
          endToEndId: bank?.endtoendId ? String(bank.endtoendId) : null,
        };
      }

      return null;
    },
  };
}
