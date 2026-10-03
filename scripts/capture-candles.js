/*
 * Records only the candle traffic of a live traderoom.
 *
 * This is the narrow companion to `capture-frames.js`. That one keeps the whole
 * conversation, which carries account data and has to be scrubbed before it can
 * be shared; this one keeps nothing but candle frames, and those hold no
 * personal data at all — an instrument id, a bucket size and a price.
 *
 * It exists to answer one question: what does `candles-generated` carry? The
 * client subscribes to it with `routingFilters: {active_id}` and no `size`, so
 * it is not the per-series `candle-generated`, and no recording of it has been
 * captured yet.
 *
 * Paste into the DevTools console on the traderoom. **Timing matters**: the tap
 * has to replace `WebSocket` before the engine opens one.
 *
 *   1. Load the traderoom and paste this immediately.
 *   2. If it reports a socket already open, call `__reconnect()` — it closes the
 *      live socket so the engine opens a new one through the tap.
 *   3. Let the chart run for a minute, switch the timeframe once or twice, then
 *      `copy(__dump())`.
 *
 * It only reads frames the page was already exchanging; nothing is sent.
 */
(() => {
  const Native = window.WebSocket;
  const sent = [];
  const received = [];
  const LIMIT = 400;

  /** True for the frames this capture is about, and only those. */
  const wanted = (frame) => {
    if (!frame || typeof frame !== "object") return false;
    const inner = typeof frame.msg === "object" && frame.msg ? frame.msg : null;
    const names = [frame.name, inner && inner.name];
    return names.some((name) => typeof name === "string" && name.includes("candle"));
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
    JSON.stringify(
      {
        sent,
        received,
        counts: { sent: sent.length, received: received.length },
      },
      null,
      1,
    );

  window.__status = () => ({
    tapped: window.WebSocket === Tapped,
    socketOpen: Boolean(window.__socket) && window.__socket.readyState === 1,
    sent: sent.length,
    received: received.length,
    names: [...new Set(received.map((f) => f.name))],
  });

  return "candle tap armed — check __status(), then copy(__dump())";
})();
