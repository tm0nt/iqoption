/*
 * Records the traderoom's WebSocket conversation, both directions.
 *
 * Paste into the DevTools console on https://trade.avalonbroker.com/traderoom
 * while signed in. **Timing matters**: the tap has to replace `WebSocket`
 * before the engine opens one, and a warm cache lets it boot in seconds. Two
 * attempts were lost to pasting too late.
 *
 *   1. Load the traderoom and paste this immediately.
 *   2. Check `__ready()`. While it prints `runtimeReady: false` you are early
 *      enough. If it already shows a socket, use `__reconnect()` — it closes
 *      the live socket so the engine opens a new one through the tap.
 *   3. Let it finish booting, then `copy(__dump())`.
 *
 * It only reads frames the page was already exchanging; nothing is sent.
 *
 * The dump carries account data — id, email, session key, balances. Replace
 * those values before sharing: the field names and the call order are what
 * matter, not the values.
 */
(() => {
  const Native = window.WebSocket;
  const sent = [];
  const received = new Map();
  const counts = new Map();

  const label = (frame) => {
    const inner = frame && typeof frame.msg === "object" && frame.msg ? frame.msg : null;
    return inner && inner.name ? `${frame.name}:${inner.name}` : frame.name;
  };

  function Tap(url, protocols) {
    const ws = protocols === undefined ? new Native(url) : new Native(url, protocols);

    const send = ws.send.bind(ws);
    ws.send = (data) => {
      if (typeof data === "string") {
        try {
          const frame = JSON.parse(data);
          if (frame.name !== "heartbeat") {
            const inner = frame.msg && typeof frame.msg === "object" ? frame.msg : null;
            sent.push({
              at: Date.now(),
              frame: frame.name,
              call: inner?.name ?? null,
              version: inner?.version ?? null,
              body: inner?.body === undefined ? null : inner.body,
              filters: inner?.params?.routingFilters ?? null,
            });
          }
        } catch {
          /* not JSON */
        }
      }
      return send(data);
    };

    ws.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      try {
        const frame = JSON.parse(event.data);
        // Keepalive would bury everything else.
        if (frame.name === "timeSync" || frame.name === "heartbeat") return;
        const key = label(frame);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        if (!received.has(key)) received.set(key, frame);
      } catch {
        /* not JSON */
      }
    });

    return ws;
  }
  Tap.prototype = Native.prototype;
  Object.assign(Tap, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  window.WebSocket = Tap;

  /** The engine keeps its sockets here, which is how a reconnect is forced. */
  const sockets = () => Object.values(window.GLEngineModule?.JSWebSockets ?? {});

  window.__ready = () => ({
    runtimeReady: window.GLEngineModule?.runtimeReady ?? null,
    sockets: sockets().map((ws) => ws.readyState),
    sent: sent.length,
    received: received.size,
  });

  window.__reconnect = () => {
    const open = sockets().filter((ws) => ws.readyState === 1);
    open.forEach((ws) => ws.close());
    return `closed ${open.length}; the engine should reopen through the tap`;
  };

  /** Every call the client made, in order — the part that is hard to infer. */
  window.__calls = () => sent.map((s) => `${s.call ?? s.frame}${s.version ? "@" + s.version : ""}`);

  window.__dump = () =>
    JSON.stringify(
      {
        sent,
        received: [...received].map(([key, frame]) => ({ key, count: counts.get(key), frame })),
      },
      null,
      1,
    );

  console.log("tap installed — check __ready(), then __reconnect() if needed, then copy(__dump())");
})();
