/*
 * Records only the order traffic of a live traderoom.
 *
 * The narrow companion to `capture-candles.js`: it keeps the frames that
 * describe a deal — opening one, its running state, selling it early, and the
 * balance moving — and nothing else. Those frames carry an instrument id, an
 * amount and a timestamp; they hold no account identity, so the dump can be
 * shared without scrubbing.
 *
 * It exists to answer what the engine build does not reveal: the shape of
 * `price-splitter.client-buyback-generated`, which has no attribute-binder
 * parser to read, and whether the live feed moves the balance when a deal
 * opens or only when it settles.
 *
 * Paste into the DevTools console on the traderoom. **Timing matters**: the tap
 * has to replace `WebSocket` before the engine opens one.
 *
 *   1. Switch to the practice balance. Nothing here needs real money.
 *   2. Load the traderoom and paste this immediately.
 *   3. Check `__status()`. If it reports a socket already open, call
 *      `__reconnect()` so the engine opens a new one through the tap.
 *   4. Open a deal, let it sit a few seconds, then sell it before it expires.
 *      Let a second one run to expiry.
 *   5. `copy(__dump())`.
 *
 * It only reads frames the page was already exchanging; nothing is sent.
 */
(() => {
  const Native = window.WebSocket;
  const sent = [];
  const received = [];
  const LIMIT = 600;

  /** The frames this capture is about, and only those. */
  const WANTED = /option|position|buyback|balance|deal|order/i;

  const wanted = (frame) => {
    if (!frame || typeof frame !== "object") return false;
    const inner = typeof frame.msg === "object" && frame.msg ? frame.msg : null;
    // An event moves its service into `microserviceName`, so both halves of the
    // name have to be considered.
    const names = [frame.name, frame.microserviceName, inner && inner.name];
    return names.some((name) => typeof name === "string" && WANTED.test(name));
  };

  const keep = (bucket, raw) => {
    if (bucket.length >= LIMIT) return;
    let frame;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    if (wanted(frame)) bucket.push(frame);
  };

  class Tapped extends Native {
    constructor(...args) {
      super(...args);
      window.__socket = this;
      this.addEventListener("message", (event) => {
        if (typeof event.data === "string") keep(received, event.data);
      });
    }

    send(data) {
      if (typeof data === "string") keep(sent, data);
      return super.send(data);
    }
  }

  window.WebSocket = Tapped;

  window.__reconnect = () => {
    if (!window.__socket) return "no socket yet — the tap is early enough, just wait";
    window.__socket.close();
    return "closed; the engine will reopen through the tap";
  };

  window.__dump = () =>
    JSON.stringify({ sent, received, counts: { sent: sent.length, received: received.length } }, null, 1);

  window.__status = () => ({
    tapped: window.WebSocket === Tapped,
    socketOpen: Boolean(window.__socket) && window.__socket.readyState === 1,
    sent: sent.length,
    received: received.length,
    names: [...new Set(received.map((f) => [f.microserviceName, f.name].filter(Boolean).join(".")))],
  });

  return "order tap armed — check __status(), trade, then copy(__dump())";
})();
