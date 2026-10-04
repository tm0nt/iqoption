/**
 * One client connection: handshake, keepalive, calls and streams.
 *
 * The server pushes `timeSync` every second from the moment the socket opens —
 * before authentication, like the live feed — so a client can discipline its
 * clock while it is still deciding what to send. Everything else waits for a
 * session.
 */

import { CALLS, PASSIVE_STREAMS, STATUS, STREAMS } from "./protocol/router.mjs";
import { record } from "./transcript.mjs";
import { balancesFrame, profileFrame, resolveSession } from "./accounts.mjs";
import { settleDue } from "./market/positions.mjs";

const TIME_SYNC_MS = 1_000;
const HEARTBEAT_MS = 20_000;
/** How often expired options are settled and announced. */
const SETTLE_MS = 1_000;
/** An unauthenticated socket is dropped rather than left to idle. */
const AUTH_GRACE_MS = 30_000;

/** Distinguishes sockets in the transcript; a client may open several. */
let nextConnectionId = 0;

export class Connection {
  /**
   * @param {import("ws").WebSocket} socket
   * @param {{ feed: import("./market/feed.mjs").MarketFeed, log?: (...args: unknown[]) => void }} deps
   */
  constructor(socket, { feed, log = () => {} }) {
    this.socket = socket;
    this.feed = feed;
    this.log = log;
    this.id = ++nextConnectionId;
    this.account = null;
    /** `request_id` -> teardown */
    this.streams = new Map();
    /** Acknowledged subscriptions that only ever carry server-sent events. */
    this.passive = [];

    this.timers = [
      setInterval(() => this.send({ name: "timeSync", msg: Date.now() }), TIME_SYNC_MS),
      setInterval(() => this.send({ name: "heartbeat", msg: Date.now() }), HEARTBEAT_MS),
      /*
       * An option that has reached its expiry has to be settled and announced:
       * the portfolio only learns a deal is over from `position-changed`, and
       * the header balance only moves when the wallet is re-sent.
       */
      setInterval(() => {
        if (!this.account) return;
        const closed = settleDue(this.account, this.feed);
        if (!closed.length) return;
        for (const position of closed) {
          this.pushEvent("portfolio.position-changed", position);
        }
        // The same channel the deal panel listens on when a stake is taken.
        for (const entry of balancesFrame(this.account)) {
          this.pushEvent("internal-billing.balance-changed", entry);
        }
        this.send({ name: "balances", msg: balancesFrame(this.account) });
      }, SETTLE_MS),
    ];
    this.authTimer = setTimeout(() => {
      if (!this.account) {
        this.log("dropping unauthenticated socket");
        socket.close(4001, "not authenticated");
      }
    }, AUTH_GRACE_MS);

    record("note", { event: "open" }, this.id);
    console.log(`[avalon] open #${this.id}`);
    socket.on("message", (data) => this.handle(data));
    socket.on("close", (code, reason) => {
      // A client that keeps reconnecting is failing somewhere; the close code
      // says whether it hung up on us or we dropped it.
      record("note", { event: "close", code, reason: String(reason ?? ""), authenticated: Boolean(this.account) }, this.id);
      console.log(`[avalon] close #${this.id} code=${code} authenticated=${Boolean(this.account)}`);
      this.dispose();
    });
    socket.on("error", (error) => this.log("socket error", error.message));
  }

  send(frame) {
    if (this.socket.readyState !== this.socket.OPEN) return;
    // Keepalive would drown the transcript; everything else is correlation.
    if (frame.name !== "timeSync" && frame.name !== "heartbeat") record("out", frame, this.id);
    this.socket.send(JSON.stringify(frame));
  }

  handle(raw) {
    let frame;
    try {
      frame = JSON.parse(String(raw));
    } catch {
      return;
    }

    // Everything but the keepalive chatter is worth keeping.
    if (frame.name !== "heartbeat") record("in", frame, this.id);

    switch (frame.name) {
      case "ssid":
      case "authenticate":
        return this.authenticate(frame);
      case "heartbeat":
        // The client echoing our heartbeat; nothing to do but note it is alive.
        return;
      case "setOptions":
        return this.ack(frame);
      case "sendMessage":
        return this.call(frame);
      case "subscribeMessage":
        return this.openStream(frame);
      case "unsubscribeMessage":
        return this.closeStream(frame);
      default:
        console.log(
          `[avalon] MISSING FRAME  ${frame.name}  ${JSON.stringify(frame).slice(0, 600)}`,
        );
        return this.send({
          name: "error",
          request_id: frame.request_id,
          status: STATUS.NOT_FOUND,
          msg: { message: `unsupported frame ${frame.name}` },
        });
    }
  }

  authenticate(frame) {
    // Two spellings reach us. The older one carries the session id as the whole
    // message; the engine's `authenticate` wraps it in an object alongside a
    // protocol version. Both are logged until the shapes are pinned down.
    console.log(`[avalon] auth frame ${JSON.stringify(frame).slice(0, 400)}`);
    const sessionId =
      typeof frame.msg === "string" ? frame.msg : (frame.msg?.ssid ?? frame.msg?.session_id ?? "");
    const account = resolveSession(String(sessionId));
    if (!account) {
      this.send({ name: "error", status: 4010, msg: { message: "invalid ssid" } });
      this.socket.close(4010, "invalid ssid");
      return;
    }

    this.account = account;
    clearTimeout(this.authTimer);
    this.log(`authenticated user ${account.userId}`);

    // `authenticate` is answered with a plain boolean before anything else;
    // the engine holds every other message back until it sees this.
    this.send({ name: "front", msg: "local", session_id: String(account.userId) });

    if (frame.name === "authenticate") {
      this.send({ name: "authenticated", request_id: frame.request_id, msg: true });

      // The wallets are pushed as well as answered. `BalancesService` marks
      // itself initialised from its `balances` *message* handler, and an answer
      // to `internal-billing.get-balances` is consumed by the request matcher
      // instead — so without this push the service never reports ready and
      // `CMain` never builds its traderoom.
      //
      // The profile is deliberately not pushed: a bare one is rejected here and
      // the client restarts the session. Only the legacy `ssid` path below
      // wants it that way.
      this.send({ name: "balances", msg: balancesFrame(account) });
      return;
    }

    this.send({ name: "profile", request_id: frame.request_id, msg: profileFrame(account) });
    this.send({ name: "balances", msg: balancesFrame(account) });
  }

  call(frame) {
    if (!this.requireAuth(frame)) return;

    const name = frame.msg?.name;
    const handler = CALLS[name];
    if (!handler) {
      // Always reported, verbose or not: an unimplemented call is the signal
      // that drives the next round of work on this server.
      console.log(
        `[avalon] MISSING CALL   ${name} v${frame.msg?.version ?? "?"} ` +
          `body=${JSON.stringify(frame.msg?.body ?? null).slice(0, 300)}`,
      );
      return this.send({
        name: "error",
        request_id: frame.request_id,
        status: STATUS.NOT_FOUND,
        msg: { isSuccessful: false, message: [`no handler for ${name}`], result: null },
      });
    }

    let result;
    try {
      result = handler(frame.msg?.body, this.context());
    } catch (error) {
      return this.send({
        name: "error",
        request_id: frame.request_id,
        status: STATUS.BAD_REQUEST,
        msg: { isSuccessful: false, message: [error.message], result: null },
      });
    }

    if (result?.error) {
      return this.send({
        name: "error",
        request_id: frame.request_id,
        status: result.status ?? STATUS.BAD_REQUEST,
        msg: { isSuccessful: false, message: [result.error], result: null },
      });
    }

    this.send({
      name: result.name,
      request_id: frame.request_id,
      status: result.envelope ? 0 : STATUS.OK,
      microserviceName: name,
      msg: result.envelope
        ? { isSuccessful: true, message: [], result: result.payload }
        : result.payload,
    });
  }

  openStream(frame) {
    if (!this.requireAuth(frame)) return;

    const name = frame.msg?.name;
    const filters = frame.msg?.params?.routingFilters ?? {};
    if (PASSIVE_STREAMS.has(name)) {
      /*
       * Nothing is pushed on its own, but the subscription still has to be
       * remembered: an event belongs to the subscription that asked for it, and
       * carries that `request_id`. The client opens seven
       * `portfolio.position-changed` subscriptions, one per instrument family,
       * and routes an incoming event by the id rather than by re-reading the
       * filters.
       */
      this.passive.push({ name, filters, requestId: frame.request_id });
      return this.ack(frame);
    }

    const start = STREAMS[name];
    if (!start) {
      console.log(
        `[avalon] MISSING STREAM ${name} filters=${JSON.stringify(filters).slice(0, 300)}`,
      );
      return this.send({
        name: "error",
        request_id: frame.request_id,
        status: STATUS.NOT_FOUND,
        msg: { message: `no stream named ${name}` },
      });
    }

    /*
     * A subscription is identified by the `request_id` that opened it, not by
     * its routing filters.
     *
     * A recording of the live feed makes this plain: when the chart changes
     * candle size it opens the new subscription first and only then closes the
     * old one, and the closing frame carries the *old* request id —
     * `unsubscribeMessage s_193 {active_id, size: 5}` arrives after
     * `subscribeMessage s_236 {active_id, size: 60}`. The two overlap on
     * purpose, so the series never goes quiet.
     *
     * Keying by filters collapsed that overlap: the second subscribe looked
     * like a duplicate and was dropped, and the close that followed then tore
     * down the only stream there was. The client went on believing it held a
     * live subscription while nothing was being sent.
     */
    const key = frame.request_id;
    if (key === undefined || this.streams.has(key)) return;

    const teardown = start(filters, this.context());
    if (!teardown) {
      return this.send({
        name: "error",
        request_id: frame.request_id,
        status: STATUS.BAD_REQUEST,
        msg: { message: `cannot subscribe to ${name} with ${JSON.stringify(filters)}` },
      });
    }

    this.streams.set(key, teardown);
    this.ack(frame);
  }

  closeStream(frame) {
    // The frame names the subscription to close by its opening request id.
    const key = frame.request_id;
    const teardown = this.streams.get(key);
    if (teardown) {
      teardown();
      this.streams.delete(key);
    }
    this.ack(frame);
  }

  /**
   * Acknowledges a frame that only needs confirming.
   *
   * The feed answers subscriptions and option changes with a generic `result`
   * carrying `{success: true}` — recorded 257 times in one boot of the real
   * traderoom — rather than with a name derived from the request. Inventing
   * `subscribed` left the client waiting on every subscription it opened.
   */
  /**
   * Sends a subscription event the way the live feed sends one.
   *
   * A stream is subscribed under a dotted name — `portfolio.position-changed` —
   * but the event that comes back splits it: the service goes in
   * `microserviceName` and only the bare event stays in `name`. A recording of
   * the live feed shows every pushed event in that shape, and none of them
   * carries a `request_id`:
   *
   *   {"name": "underlying-list-changed",
   *    "microserviceName": "digital-option-instruments", "msg": {...}}
   *
   * Sending the dotted name as one string leaves the client with an event it
   * has no handler for, which it drops without a word.
   */
  pushEvent(stream, msg) {
    const dot = stream.indexOf(".");
    if (dot < 0) return this.send({ name: stream, msg });
    return this.send({
      name: stream.slice(dot + 1),
      microserviceName: stream.slice(0, dot),
      msg,
    });
  }

  ack(frame) {
    this.send({ name: "result", request_id: frame.request_id, msg: { success: true } });
  }

  requireAuth(frame) {
    if (this.account) return true;
    this.send({
      name: "error",
      request_id: frame.request_id,
      status: 4010,
      msg: { message: "not authenticated" },
    });
    return false;
  }

  context() {
    return {
      feed: this.feed,
      account: this.account,
      send: (frame) => this.send(frame),
      pushEvent: (stream, msg) => this.pushEvent(stream, msg),
    };
  }

  dispose() {
    for (const timer of this.timers) clearInterval(timer);
    clearTimeout(this.authTimer);
    for (const teardown of this.streams.values()) teardown();
    this.streams.clear();
  }
}
