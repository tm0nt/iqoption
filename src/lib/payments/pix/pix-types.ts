/**
 * What the platform needs from a PIX rail, independent of who provides it.
 *
 * PIX is not a card. A card charge answers now — approved, declined — and the
 * cashier can act on the answer. A PIX charge answers with a string the person
 * pastes into their bank, and the money arrives minutes later through a
 * webhook, or never. So the shapes here are built around that asymmetry:
 * creating a charge yields something to *show*, and settlement arrives
 * separately.
 */

/** Which rail a provider id names. Only one today; the type is the hinge. */
export type PixProviderId = "dubai-cash" | "none";

/** A charge waiting to be paid. */
export type PixCharge = {
  /** The copy-and-paste string the person's bank reads. */
  brCode: string;
  /** A rendered QR, as a data URI, when the provider returns one. */
  qrImage: string | null;
  /** The provider's own id for the charge, for status lookups. */
  invoiceId: string;
  /** Ours, echoed back on the webhook — this is what reconciles. */
  externalId: string;
  amount: number;
};

/** Where a charge or a payout has got to. */
export type PixStatus = "pending" | "paid" | "failed";

export type PixPayout = {
  /** The provider's id for the transfer. */
  transferId: string;
  externalId: string;
  /** The central bank's end-to-end id, once there is one. */
  endToEndId: string | null;
  status: PixStatus;
  amount: number;
};

/** A settlement the provider pushed to us. */
export type PixEvent = {
  kind: "pay-in" | "pay-out" | "reversal" | "refund";
  /** The provider's transaction id. Idempotency hangs on this. */
  transactionUuid: string;
  externalId: string;
  amount: number;
  status: PixStatus;
  endToEndId: string | null;
};

export interface PixProvider {
  id: PixProviderId;
  /** True for a rail that moves no real money. */
  test: boolean;

  /**
   * Opens a charge. `externalId` is ours and must be unique: the provider
   * echoes it on the webhook, and it is how a payment finds its transaction.
   */
  createCharge(input: {
    externalId: string;
    amount: number;
    document?: string;
    name?: string;
    description?: string;
  }): Promise<PixCharge | null>;

  /** Sends money to a PIX key. Asynchronous: the answer is "accepted", not "paid". */
  payout(input: {
    externalId: string;
    key: string;
    keyType: "cpf" | "cnpj" | "email" | "mobile" | "evp";
    amount: number;
    holderName?: string;
    holderDocument?: string;
    description?: string;
  }): Promise<PixPayout | null>;

  /** Asks where a charge got to. Reconciliation, not the primary path. */
  chargeStatus(externalId: string): Promise<PixStatus | null>;
  /** Asks where a payout got to. */
  payoutStatus(externalId: string): Promise<PixStatus | null>;

  /** The provider's own balance, for an operator to see what can be paid out. */
  balance(): Promise<{ available: number; blocked: number } | null>;

  /**
   * Reads a webhook body into the platform's own shape, or null when it is
   * not an event this cares about. Parsing, not trusting: whether to act on
   * it is the caller's decision, after it has checked who sent it.
   */
  readEvent(body: unknown): PixEvent | null;
}
