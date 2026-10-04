/**
 * Accounts and sessions, in memory.
 *
 * The real platform issues an `ssid` cookie from its login flow and the socket
 * trades it for a profile. This keeps the same shape — a session id maps to an
 * account — without any of the identity machinery: in development any
 * unrecognised id is accepted and given the demo account, so a client can
 * connect with nothing configured.
 */

import { randomUUID } from "node:crypto";
import { pool } from "./db/pool.mjs";
import { loadPositions } from "./market/position-store.mjs";

/** Practice money, in the account currency. */
const DEMO_START_BALANCE = 10_000;

/**
 * The first account always gets this id.
 *
 * It has to agree with `user_id` in the `check-session` stub the engine host
 * serves: the client compares the two, and a mismatch leaves it on its login
 * view with the traderoom never built.
 *
 * The value is arbitrary, and deliberately synthetic. Both seeds here once held
 * the ids from a recorded session of the live site — they work, because any
 * number works, but they identify a real account and have no business in a
 * fixture. When a recording answers a question, take the shape from it and
 * leave the identity behind.
 */
export const FIRST_USER_ID = 100_000_001;

let nextUserId = FIRST_USER_ID;

/** Matches `balanceId` in the default user settings, for the same reason. */
let nextBalanceId = 900_000_001;

/** sessionId -> userId */
const sessions = new Map();
/** userId -> account */
const accounts = new Map();

function createAccount({ name = "Demo Trader", currency = "USD" } = {}) {
  const userId = nextUserId++;
  const account = {
    userId,
    name,
    email: `trader${userId}@example.test`,
    currency,
    country: "BR",
    created: Date.now(),
    /**
     * One wallet, deliberately.
     *
     * `BalancesService::isInitialized()` requires both that balances arrived
     * *and* that one is selected, and `CMain` only reaches its traderoom once
     * that holds. Offering a real and a practice wallet leaves the choice to a
     * select-account dialog, so a single wallet removes the decision.
     *
     * Type 4 is the practice one, which is what this server is for.
     */
    balances: [
      { id: nextBalanceId++, type: 4, amount: DEMO_START_BALANCE, currency: "USD", is_fiat: true },
    ],
  };
  account.activeBalanceId = account.balances[0].id;
  /** UI preferences the client writes back with `set-user-settings`. */
  account.settings = new Map();
  /** Session key the client echoes back on some calls. */
  account.skey = randomUUID().replace(/-/g, "");
  accounts.set(userId, account);
  return account;
}

export function openSession({ name, currency } = {}) {
  const account = createAccount({ name, currency });
  const sessionId = randomUUID().replace(/-/g, "");
  sessions.set(sessionId, account.userId);
  return { sessionId, account };
}

/**
 * Whether a session id nobody issued is allowed to become an account.
 *
 * It is how this server worked before accounts existed, and it is convenient:
 * the engine can be booted against the feed with no web app running at all. It
 * is also an open door, so it is off unless asked for.
 */
const ALLOW_ANONYMOUS = process.env.AVALON_ALLOW_ANONYMOUS === "1";

/**
 * Resolves the ssid the engine presented to the person it belongs to.
 *
 * The web app mints a row in `trading_sessions` for a signed-in person and
 * hands the engine its id; this is the other half of that handover. An ssid
 * that is unknown, expired or disabled is refused — the feed does not decide
 * who exists, it only looks the answer up.
 *
 * The account is cached per user for the life of the process, because open
 * positions live in memory on it: a reconnect has to find the same object or
 * every running deal disappears.
 *
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
export async function resolveSession(sessionId) {
  if (!sessionId) return null;

  const known = sessions.get(sessionId);
  if (known !== undefined) {
    const cached = accounts.get(known);
    if (cached) return cached;
  }

  const rows = await pool().query(
    `SELECT u.id, u.email, u.name, u.locale, u.is_active, s.expires_at
       FROM trading_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? LIMIT 1`,
    [sessionId],
  );

  const row = rows[0];
  if (row && row.is_active && new Date(row.expires_at) > new Date()) {
    // Marks the session as in use, so an abandoned one is visible.
    pool()
      .query("UPDATE trading_sessions SET last_seen_at = NOW() WHERE id = ?", [sessionId])
      .catch(() => {});

    const account = await loadAccount(row);
    sessions.set(sessionId, account.userId);
    accounts.set(account.userId, account);
    return account;
  }

  if (!ALLOW_ANONYMOUS) return null;

  const account = createAccount();
  sessions.set(sessionId, account.userId);
  return account;
}

/** Builds the in-memory account for a person, wallets and all. */
async function loadAccount(row) {
  const userId = Number(row.id);
  const existing = accounts.get(userId);
  if (existing) return existing;

  const [wallets, positions] = await Promise.all([
    pool().query(
      "SELECT id, type, amount, currency, is_fiat FROM balances WHERE user_id = ? ORDER BY type",
      [userId],
    ),
    /*
     * Open deals and recent history both. A deal that expired while nobody was
     * connected comes back open and settles on the next tick — the expiry has
     * passed and the quote at that moment is what decides it.
     */
    loadPositions(userId),
  ]);

  const account = {
    userId,
    name: row.name ?? "Trader",
    email: row.email,
    currency: wallets[0]?.currency ?? "USD",
    country: "BR",
    created: Date.now(),
    balances: wallets.map((wallet) => ({
      id: Number(wallet.id),
      type: Number(wallet.type),
      amount: Number(wallet.amount),
      currency: wallet.currency,
      is_fiat: Boolean(wallet.is_fiat),
    })),
    positions,
  };

  account.activeBalanceId = account.balances[0]?.id;
  account.settings = new Map();
  account.skey = randomUUID().replace(/-/g, "");
  return account;
}

/**
 * Writes a wallet's balance back.
 *
 * Called after a stake is taken and after a deal settles. It does not block the
 * frame that caused it: the client is told the new balance by the event it is
 * already waiting for, and a write that fails must be visible in the log rather
 * than as a stalled traderoom.
 */
export function saveBalance(balance) {
  pool()
    .query("UPDATE balances SET amount = ? WHERE id = ?", [balance.amount, balance.id])
    .catch((error) => console.error(`[avalon] could not save balance ${balance.id}:`, error.message));
}

/** Writes back every wallet of an account. */
export function saveBalances(account) {
  for (const balance of account.balances ?? []) saveBalance(balance);
}

/**
 * One wallet, in the shape the feed reports.
 *
 * The extra zeroed amounts are not padding: the client subtracts `hold_amount`
 * and `orders_amount` from `amount` to show what is actually available, and
 * reads `equivalent` for the account's display currency.
 */
/** Sequence number carried by every `balance-changed` event. */
let nextBalanceIndex = 5_000_000_000;

function balanceFrame(account, balance) {
  return {
    id: balance.id,
    user_id: account.userId,
    type: balance.type,
    amount: balance.amount,
    enrolled_amount: 0,
    enrolled_sum_amount: 0,
    bonus_amount: 0,
    hold_amount: 0,
    orders_amount: 0,
    auth_amount: 0,
    equivalent: balance.amount,
    currency: balance.currency,
    tournament_id: null,
    tournament_name: null,
    is_fiat: balance.is_fiat,
    is_marginal: true,
    has_deposits: false,
    created: account.created,
  };
}

/**
 * One wallet, in the shape `internal-billing.balance-changed` reports.
 *
 * This is not the snapshot entry: the event wraps the wallet in
 * `current_balance` and carries the deal's own `id` and `user_id` beside it.
 * Recorded from the live feed, where the header follows this event and treats
 * the `balances` snapshot as a login-time read only — which is why a stake has
 * to be announced here to move the balance before the deal settles.
 *
 * `new_amount` repeats `amount`; the live feed sends both and the client reads
 * whichever the view it is updating asks for. `index` is the event's own
 * sequence number, not the wallet's.
 */
export function balanceChangedFrame(account, balance) {
  return {
    current_balance: {
      id: balance.id,
      amount: balance.amount,
      enrolled_amount: balance.amount,
      bonus_amount: 0,
      bonus_enrolled_amount: 0,
      currency: balance.currency,
      type: balance.type,
      index: (nextBalanceIndex += 1),
      is_fiat: balance.is_fiat,
      new_amount: balance.amount,
      bonus_total_amount: 0,
      is_marginal: true,
      created: new Date(account.created).toISOString(),
      parent_id: null,
      staking_info: null,
    },
    id: balance.id,
    user_id: account.userId,
  };
}

/**
 * One wallet's margin state, as `marginal-balance` reports it.
 *
 * Every amount is a decimal **string**, not a number — the client parses them
 * itself to keep the precision the exchange reports. That is the opposite of
 * `positions-state`, where the same kinds of number travel bare; the two
 * conventions coexist and a recording is the only way to tell which applies.
 *
 * The same shape is what `marginal-portfolio.balance-changed` pushes. A
 * recording of the live feed shows a stake moving both this and
 * `internal-billing.balance-changed`, and the header follows this one: sending
 * only the billing event leaves the balance in the corner unchanged.
 */
export function marginalBalanceFrame(account, balance) {
  const amount = String(balance.amount);
  const zero = "0";
  return {
    id: balance.id,
    index: (nextBalanceIndex += 1),
    generated_at: Date.now(),
    user_id: account.userId,
    type: balance.type,
    currency: balance.currency,
    cash: amount,
    bonus: zero,
    pnl: zero,
    isolated_pnl: zero,
    equity: amount,
    equity_usd: amount,
    swap: zero,
    dividends: zero,
    pnl_net: zero,
    isolated_swap: zero,
    isolated_dividends: zero,
    isolated_pnl_net: zero,
    margin: zero,
    isolated_margin: zero,
    available: amount,
    stop_out_level: "50",
    additional_margin_step: 20,
    additional_margin_refund_offset: 5,
    position_pnls: [],
  };
}

/**
 * The `profile` payload.
 *
 * Field names and types follow a response recorded from the live feed. The
 * oddities are deliberate and load-bearing: `birthdate` and `ssid` are `false`
 * rather than null, `confirmation_required` and `demo` are numbers rather than
 * booleans, and `balances` is empty here because wallets arrive through
 * `internal-billing.get-balances` instead.
 *
 * `forget_status` is embedded, which is why the client can ask for it both here
 * and through `get-forget-user-status`.
 */
export function profileFrame(account) {
  const active = account.balances.find((b) => b.id === account.activeBalanceId);
  return {
    id: account.userId,
    user_id: account.userId,
    name: "",
    first_name: "",
    last_name: "",
    nickname: account.name,
    email: account.email,
    new_email: "",
    avatar: "",
    address: "",
    city: "",
    postal_index: "",
    phone: "",
    confirmed_phones: [],
    need_phone_confirmation: null,
    nationality: "",
    gender: "",
    birthdate: false,
    tin: "",

    country_id: 30,
    flag: "BR",
    locale: "en_US",
    tz: "UTC",
    tz_offset: 0,
    timediff: 0,

    account_status: "NONE",
    client_category_id: 1,
    company_id: 1,
    group_id: 1,
    site_id: 1,
    user_group: "Local",
    user_circle: null,
    created: Math.floor(account.created / 1000),
    last_visit: false,

    is_activated: true,
    is_islamic: false,
    is_vip_group: false,
    confirmation_required: 0,
    trade_restricted: false,
    trial: false,
    demo: 0,
    public: 0,
    infeed: 1,
    messages: 0,
    welcome_splash: 0,
    popup: [],
    functions: [],
    socials: {},
    tournaments_ids: null,
    finance_state: "",

    currency: account.currency,
    currency_char: "$",
    currency_id: 1,
    mask: "$%s",
    balance: active?.amount ?? 0,
    balance_id: account.activeBalanceId,
    balance_type: active?.type ?? 4,
    // Wallets travel separately; the live payload leaves this empty too.
    balances: [],
    deposit_count: 0,
    deposit_in_one_click: false,
    rate_in_one_click: false,
    bonus_wager: 0,
    bonus_total_wager: 0,
    money: { deposit: { min: 0, max: 0 }, withdraw: { min: 0, max: 0 } },
    cashback_level_info: { enabled: false },

    auth_two_factor: null,
    skey: account.skey,
    ssid: false,
    tc: true,
    forget_status: { status: "none", created: null, expires: null },
    kyc_confirmed: false,
    kyc: {
      status: 1,
      isPhoneFilled: false,
      isPhoneNeeded: false,
      isProfileFilled: false,
      isProfileNeeded: false,
      isRegulatedUser: false,
      daysLeftToVerify: -1,
      isPhoneConfirmed: false,
      isDocumentsNeeded: false,
      isDocumentsApproved: false,
      isDocumentsDeclined: false,
      isDocumentsUploaded: false,
      isDocumentPoaUploaded: false,
      isDocumentPoiUploaded: false,
      isDocumentsUploadSkipped: false,
      isPhoneConfirmationSkipped: false,
    },
    personal_data_policy: {
      is_call_accepted: { status: true },
      is_push_accepted: { status: true },
      is_email_accepted: { status: true },
      is_agreement_accepted: { status: true },
      is_thirdparty_accepted: { status: true },
    },
  };
}

/** The `balances` payload, which carries the wallets without the person. */
export function balancesFrame(account) {
  return account.balances.map((balance) => balanceFrame(account, balance));
}
