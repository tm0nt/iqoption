/**
 * Minimal client for the Avalon market data socket.
 *
 * Works unchanged in the browser and in Node >= 22 (both expose a global
 * `WebSocket`). It owns four things the WASM engine also owns: the ssid
 * handshake, the heartbeat, the server clock offset, and re-arming every live
 * subscription after a reconnect.
 */

import {
  resolveWsUrl,
  heartbeatReply,
  rpcEnvelope,
  subscribeEnvelope,
  type InboundFrame,
} from "./protocol";

export type FrameHandler = (msg: never, frame: InboundFrame) => void;

export interface AvalonClientOptions {
  url?: string;
  /** Session id. In the browser this is the `ssid` cookie the traderoom sets. */
  ssid: string;
  /** Milliseconds before an unanswered rpc rejects. */
  requestTimeoutMs?: number;
  /** Set false to handle reconnection yourself. */
  autoReconnect?: boolean;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

export type ConnectionState = "idle" | "connecting" | "authenticating" | "ready" | "closed";

interface PendingRequest {
  resolve: (frame: InboundFrame) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface Subscription {
  name: string;
  filters: Record<string, unknown>;
  version: string;
  handler: (msg: never, frame: InboundFrame) => void;
}

const RECONNECT_BACKOFF_MS = [500, 1_000, 2_000, 5_000, 10_000, 20_000];

export class AvalonClient {
  readonly url: string;

  private readonly ssid: string;
  private readonly requestTimeoutMs: number;
  private readonly autoReconnect: boolean;
  private readonly onStateChange?: (state: ConnectionState) => void;
  private readonly onError?: (error: Error) => void;

  private socket: WebSocket | null = null;
  private state: ConnectionState = "idle";
  private requestSeq = 0;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  private readonly pending = new Map<string, PendingRequest>();
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly listeners = new Map<string, Set<(msg: never, frame: InboundFrame) => void>>();

  /** Server clock minus local clock, in milliseconds, from `timeSync`. */
  private clockOffsetMs = 0;

  constructor(options: AvalonClientOptions) {
    this.url = options.url ?? resolveWsUrl();
    this.ssid = options.ssid;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
    this.autoReconnect = options.autoReconnect ?? true;
    this.onStateChange = options.onStateChange;
    this.onError = options.onError;
  }

  /** Server time in milliseconds, corrected by the latest `timeSync`. */
  now(): number {
    return Date.now() + this.clockOffsetMs;
  }

  getState(): ConnectionState {
    return this.state;
  }

  /** Resolves once the handshake has been accepted. */
  connect(): Promise<void> {
    if (this.state === "ready") return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      this.setState("connecting");
      const socket = new WebSocket(this.url);
      this.socket = socket;

      const settleOk = () => {
        this.attempt = 0;
        resolve();
      };

      socket.onopen = () => {
        this.setState("authenticating");
        this.send({ name: "ssid", msg: this.ssid, request_id: this.nextRequestId() });
        // The feed answers a good ssid with `profile`; a bad one is answered
        // with a close rather than an error frame.
        this.once("profile", () => {
          this.setState("ready");
          this.rearmSubscriptions();
          settleOk();
        });
      };

      socket.onmessage = (event) => this.handleFrame(event.data);

      socket.onerror = () => {
        const error = new Error(`Avalon socket error (${this.url})`);
        this.onError?.(error);
        if (this.state !== "ready") reject(error);
      };

      socket.onclose = () => {
        this.failPending(new Error("Avalon socket closed"));
        const wasReady = this.state === "ready";
        this.setState("closed");
        if (!wasReady) reject(new Error("Avalon socket closed before authentication"));
        this.scheduleReconnect();
      };
    });
  }

  close(): void {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.failPending(new Error("Avalon client closed"));
    this.subscriptions.clear();
    this.listeners.clear();
    this.socket?.close();
    this.socket = null;
    this.setState("closed");
  }

  /** Request/response call against a microservice. Resolves with the answer frame. */
  async rpc<T = unknown>(name: string, version: string, body: unknown): Promise<T> {
    const requestId = this.nextRequestId();
    const frame = await this.request(requestId, rpcEnvelope(requestId, name, version, body));
    return frame.msg as T;
  }

  /**
   * Opens a live stream. The handler keeps firing until the returned function is
   * called; the subscription is replayed automatically after a reconnect.
   */
  subscribe<T>(
    name: string,
    filters: Record<string, unknown>,
    handler: (msg: T, frame: InboundFrame) => void,
    version = "1.0",
  ): () => void {
    const key = subscriptionKey(name, filters);
    const entry: Subscription = {
      name,
      filters,
      version,
      handler: handler as (msg: never, frame: InboundFrame) => void,
    };
    this.subscriptions.set(key, entry);
    const off = this.on<T>(name, (msg, frame) => {
      if (matchesFilters(msg, filters)) handler(msg, frame);
    });

    if (this.state === "ready") {
      this.send(subscribeEnvelope(this.nextRequestId(), name, filters, false, version));
    }

    return () => {
      off();
      this.subscriptions.delete(key);
      if (this.state === "ready") {
        this.send(subscribeEnvelope(this.nextRequestId(), name, filters, true, version));
      }
    };
  }

  /** Listens to every frame with the given `name`, filters included. */
  on<T>(name: string, handler: (msg: T, frame: InboundFrame) => void): () => void {
    const typed = handler as (msg: never, frame: InboundFrame) => void;
    const set = this.listeners.get(name) ?? new Set();
    set.add(typed);
    this.listeners.set(name, set);
    return () => {
      set.delete(typed);
      if (set.size === 0) this.listeners.delete(name);
    };
  }

  private once(name: string, handler: () => void): void {
    const off = this.on(name, () => {
      off();
      handler();
    });
  }

  private request(requestId: string, payload: unknown): Promise<InboundFrame> {
    return new Promise<InboundFrame>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Avalon request ${requestId} timed out`));
      }, this.requestTimeoutMs);
      this.pending.set(requestId, { resolve, reject, timer });
      this.send(payload);
    });
  }

  private send(payload: unknown): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== 1) {
      throw new Error("Avalon socket is not open");
    }
    socket.send(JSON.stringify(payload));
  }

  private handleFrame(raw: unknown): void {
    if (typeof raw !== "string") return;
    let frame: InboundFrame;
    try {
      frame = JSON.parse(raw) as InboundFrame;
    } catch {
      return;
    }

    if (frame.name === "timeSync" && typeof frame.msg === "number") {
      this.clockOffsetMs = frame.msg - Date.now();
      return;
    }
    if (frame.name === "heartbeat") {
      const serverTime = typeof frame.msg === "number" ? frame.msg : Date.now();
      try {
        this.send(heartbeatReply(serverTime));
      } catch {
        // socket closed under us; the close handler reconnects
      }
      return;
    }

    if (frame.request_id) {
      const waiting = this.pending.get(frame.request_id);
      if (waiting) {
        this.pending.delete(frame.request_id);
        clearTimeout(waiting.timer);
        if (frame.status && frame.status >= 4000) {
          waiting.reject(new Error(`Avalon ${frame.name} failed with status ${frame.status}`));
        } else {
          waiting.resolve(frame);
        }
        return;
      }
    }

    const set = this.listeners.get(frame.name);
    if (!set) return;
    for (const handler of [...set]) handler(frame.msg as never, frame);
  }

  private rearmSubscriptions(): void {
    for (const sub of this.subscriptions.values()) {
      this.send(
        subscribeEnvelope(this.nextRequestId(), sub.name, sub.filters, false, sub.version),
      );
    }
  }

  private scheduleReconnect(): void {
    if (!this.autoReconnect || this.disposed || this.reconnectTimer) return;
    const delay = RECONNECT_BACKOFF_MS[Math.min(this.attempt, RECONNECT_BACKOFF_MS.length - 1)];
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error: unknown) => {
        this.onError?.(error instanceof Error ? error : new Error(String(error)));
      });
    }, delay);
  }

  private failPending(error: Error): void {
    for (const [, waiting] of this.pending) {
      clearTimeout(waiting.timer);
      waiting.reject(error);
    }
    this.pending.clear();
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange?.(state);
  }

  private nextRequestId(): string {
    this.requestSeq += 1;
    return String(this.requestSeq);
  }
}

function subscriptionKey(name: string, filters: Record<string, unknown>): string {
  const parts = Object.keys(filters)
    .sort()
    .map((key) => `${key}=${String(filters[key])}`);
  return `${name}:${parts.join(",")}`;
}

/**
 * The feed fans subscriptions out on a shared connection, so an event for
 * another chart can land on this socket. Match the routing filters back against
 * the payload before handing it to the caller.
 */
function matchesFilters(msg: unknown, filters: Record<string, unknown>): boolean {
  if (typeof msg !== "object" || msg === null) return true;
  const record = msg as Record<string, unknown>;
  return Object.entries(filters).every(([key, value]) => {
    const actual = record[key];
    return actual === undefined || actual === value;
  });
}
