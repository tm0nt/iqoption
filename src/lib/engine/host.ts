/**
 * Boots the traderoom's WebGL engine inside the app.
 *
 * This is `public/engine-host/index.html` as a module. That page proved what
 * the engine needs; this runs the same sequence from a React route so the
 * traderoom is a page of the platform rather than a static file beside it, and
 * so its configuration can come from the database instead of a query string.
 *
 * The engine is a 103 MB Emscripten build and is not configurable: the feed URL
 * is a string inside the WASM, built from the hostname it asks JS for. But the
 * socket is opened by glue code in page scope —
 *
 *     socket = new WebSocket(UTF8ToString($1))
 *
 * — so replacing `window.WebSocket` before the engine boots redirects it with
 * no patching of the binary. Everything here depends on running *before* the
 * engine's own script, which is why this function appends that script itself
 * rather than letting the framework load it.
 *
 * Mirror the engine first: `node scripts/download-engine.mjs`.
 */

export type EngineHostOptions = {
  /** Where the engine's socket is redirected. */
  wsUrl: string;
  /** Session id the engine reads out of `document.cookie`. */
  ssid: string;
  /** Path the mirrored engine build is served from, e.g. `/engine`. */
  resourceHost: string;
  /** Cache-busting version the build's own manifest expects. */
  resourceVersion: number;
  /** Where the canned HTTP answers live. */
  stubBase: string;
  /**
   * The language the engine should draw itself in.
   *
   * It reads this out of a `lang` cookie before it asks for anything, and the
   * dictionary it then fetches is per locale — so this has to be set before the
   * engine's own script is appended, not after.
   */
  locale: string;
  /** Optional overlay to mirror the engine's log into. */
  statusElement?: HTMLPreElement | null;
};

type Shell = {
  ssid: string;
  resHost: string;
  orignHost: string;
  resV: number;
  urlhash: string;
  dataLayer: { push: (value: unknown) => void };
  replaceHostSubdomain: (url: string, subdomain: string) => string;
  getCookie: (name: string) => string | undefined;
  setupCookie: (name: string, value: string, options?: Record<string, string | true>) => void;
  GLEngineModule?: {
    appendLogMessage?: (message: unknown) => unknown;
    setInitProgress?: (done: number, total: number) => unknown;
  };
  __gl?: string[];
  MozWebSocket?: typeof WebSocket;
};

type ShellWindow = Window & typeof globalThis & Shell;

/** Set once the engine has been started, so a re-render cannot boot it twice. */
let booted = false;

export function engineAlreadyBooted() {
  return booted;
}

export function bootEngine(options: EngineHostOptions): void {
  if (booted) return;
  booted = true;

  const { wsUrl, ssid, resourceHost, resourceVersion, stubBase, locale, statusElement } = options;
  const shell = window as ShellWindow;

  /* ----------------------------------------------------------------- status */
  const lines: { line: string; kind?: "bad" | "good" }[] = [];
  const seen = new Set<string>();

  function status(line: string, kind?: "bad" | "good") {
    lines.push({ line, kind });
    if (lines.length > 40) lines.shift();
    if (statusElement) {
      statusElement.innerHTML = lines
        .map((entry) => {
          const text = entry.line.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
          if (entry.kind === "bad") return `<b>${text}</b>`;
          if (entry.kind === "good") return `<i>${text}</i>`;
          return text;
        })
        .join("\n");
      statusElement.scrollTop = statusElement.scrollHeight;
    }
    console.log("[host]", line);
  }

  /** Reports each distinct request once, so a polling loop cannot flood. */
  function statusOnce(key: string, line: string, kind?: "bad" | "good") {
    if (seen.has(key)) return;
    seen.add(key);
    status(line, kind);
  }

  status(`feed  ${wsUrl}`, "good");

  /* --------------------------------------------------- the IP-literal guard */
  /*
   * `replaceHostSubdomain` replaces the first label of a host with more than
   * two labels, so `127.0.0.1` becomes `auth.0.0.1` — a host whose trailing
   * numeric label forces IPv4 parsing, which then fails. Nothing can match a
   * route, `check-session` goes out against something unparseable, and the
   * traderoom never opens with no indication of why.
   *
   * The routine cannot be made more forgiving: the engine carries the same one
   * in C++ and compares results. Any hostname works — `localhost`, or any
   * domain, on any machine. Only a bare address does not.
   */
  const host = location.hostname;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) {
    statusOnce("iphost", `SERVE THIS ON A HOSTNAME, NOT ${host} — subdomain rewriting breaks on an IP literal`, "bad");
    console.error(
      `[host] This page is being served from the IP literal ${host}. The engine derives its ` +
        "service hosts by rewriting the first label, which produces an unparseable address, and " +
        "the traderoom will not open. Use localhost or any domain name instead.",
    );
  }

  /* ---------------------------------------------------------------- cookies */
  // The engine reads document.cookie wholesale and pulls `ssid` out of it.
  document.cookie = `ssid=${encodeURIComponent(ssid)}; path=/`;
  document.cookie = `lang=${locale}; path=/`;
  shell.ssid = ssid;

  /* ------------------------------------------------------------- websockets */
  {
    const Native = window.WebSocket;
    const Redirected = function (this: unknown, url: string | URL, protocols?: string | string[]) {
      const original = String(url);
      // Everything the engine opens is the feed; anything else is unexpected
      // and worth seeing in the log rather than silently rewriting.
      const target = /\/echo\/websocket/.test(original) ? wsUrl : original;
      status(target === original ? `ws    ${original} (not redirected)` : `ws    ${original} -> ${target}`);
      return protocols === undefined ? new Native(target) : new Native(target, protocols);
    } as unknown as typeof WebSocket;

    Redirected.prototype = Native.prototype;
    Object.assign(Redirected, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    window.WebSocket = Redirected;
    shell.MozWebSocket = Redirected;
  }

  /* --------------------------------------------------------- the HTTP shim  */
  /**
   * Endpoints the engine and its shell call during boot, mapped to a canned
   * answer. Paths were read out of the WASM's string table and out of
   * bundle.js.
   */
  const ROUTES: [RegExp, string][] = [
    [/^\/api\/appinit$/, `${stubBase}/appinit.json`],
    [/\/api\/v\d+\/check-session$/, `${stubBase}/check-session.json`],
    [/\/api\/v2\/features$/, `${stubBase}/features.json`],
    [/\/api\/geoip\/getmycountry/, `${stubBase}/geoip.json`],
    [/\/api\/v1\/get\/company$/, `${stubBase}/company.json`],
    [/\/api\/configuration/, `${stubBase}/configuration.json`],
    [/\/api\/trading-accounts\//, `${stubBase}/trading-accounts.json`],
    [/\/api\/lang\/routes$/, `${stubBase}/lang-routes.json`],
    /*
     * The locale travels in the rewritten URL. A rerouted request becomes a
     * plain GET of a static path and loses whatever query the engine put on it,
     * so the one thing that matters is put back here.
     */
    [/\/api\/lang\/route-translations$/, `${stubBase}/lang-route-translations.json?locale=${locale}`],
    [/\/api\/regulation$/, `${stubBase}/regulation.json`],
    [/\/web-client-versions\//, `${stubBase}/versions.json`],
    [/\/api\/v1\/versions\//, `${stubBase}/versions.json`],
    // Country table. `countries-list` rejects anything without a `countries`
    // array, and each entry needs the six mandatory attributes of
    // `F2::services::CountryInformation`.
    [/\/api\/v\d+\/countries$/, `${stubBase}/countries.json`],
    [/\/api\/support\/phones/, `${stubBase}/support-phones.json`],
    // The `/v1/` endpoints are an older API generation and answer with a bare
    // array rather than the `{isSuccessful, message, result}` envelope.
    [/\/v1\/webinars$/, `${stubBase}/webinars.json`],
    [/\/v1\/brand\/icons$/, `${stubBase}/brand-icons.json`],
    // Telemetry. Swallowed rather than answered.
    [/\/api\/v1\/events$/, `${stubBase}/empty.json`],
    // Brand and category artwork, served from the broker's CDN. A transparent
    // pixel satisfies the engine's image loader without mirroring any of it.
    [/^\/storage\/public\//, `${stubBase}/pixel.png`],
  ];

  /** The engine's own assets, our stubs and the framework's pass through. */
  function isLocalAsset(pathname: string) {
    return (
      pathname.startsWith(`${resourceHost}/`) ||
      pathname.startsWith(stubBase) ||
      pathname.startsWith("/engine-host/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/engine/")
    );
  }

  /** Decides what a request should actually hit. */
  function reroute(rawUrl: string, method: string): string {
    /*
     * The shell builds some URLs as `location.protocol + hostname + path`, with
     * the `//` missing. Parsed on its own that is an absolute URL on another
     * origin; parsed against the page it is a relative path. The shell hands
     * the first form straight to `new URL()`, so try that reading first and
     * only fall back to resolving against the page.
     */
    /*
     * The translations file carries image URLs with a literal
     * `[resources_endpoint]` where the host should be, for the engine to expand
     * from `configuration.json`. It does not expand them, and the brackets read
     * as an IPv6 literal, so the URL will not parse, no route can match it and
     * every decorative icon fails to load. Expanding it here lets those
     * requests reach the `/storage/public/` rule like any other.
     */
    const expanded = rawUrl.includes("[resources_endpoint]")
      ? rawUrl.replace(/^https?:\/\/\[resources_endpoint\]/, location.origin).replace("[resources_endpoint]", location.host)
      : rawUrl;

    let absolute: URL;
    try {
      absolute = new URL(expanded);
    } catch {
      try {
        absolute = new URL(expanded, location.href);
      } catch {
        return rawUrl;
      }
    }

    const pathname = absolute.pathname;
    if (isLocalAsset(pathname)) return rawUrl;

    for (const [pattern, target] of ROUTES) {
      if (pattern.test(pathname)) {
        statusOnce(`r:${pathname}`, `stub  ${method} ${pathname}`);
        return target;
      }
    }

    // Nothing else leaves this origin: the shell carries analytics, crash
    // reporting and push registration that would otherwise phone home.
    if (absolute.origin !== location.origin) {
      statusOnce(`b:${absolute.host}${pathname}`, `block ${absolute.host}${pathname}`);
      return `${stubBase}/empty.json`;
    }

    // Reporting only `/api/` paths hid the translations service, which asks on
    // a path of its own, so every unmatched request is named here.
    statusOnce(`u:${pathname}`, `UNSTUBBED ${method} ${pathname}${absolute.search.slice(0, 80)}`, "bad");
    // Only `/api/` gets a canned body; the rest is left to fail honestly, so a
    // wrong guess here cannot look like a working endpoint.
    return pathname.startsWith("/api/") ? `${stubBase}/empty.json` : rawUrl;
  }

  /** Accepts the three things fetch takes: a string, a URL, or a Request. */
  function urlOf(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    return input.url;
  }

  {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const original = urlOf(input);
      const method = init?.method ?? (input instanceof Request ? input.method : "GET");
      const target = reroute(original, method);
      if (target === original) return nativeFetch(input, init);
      // A rerouted call always becomes a plain GET of a static file.
      return nativeFetch(target);
    };
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon = (url: string | URL) => {
      statusOnce(`beacon:${String(url)}`, `beacon blocked ${String(url).slice(0, 60)}`, "bad");
      return false;
    };
  }

  {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      const original = String(url);
      const target = reroute(original, method);
      const args = target !== original ? ["GET", target, ...rest] : [method, url, ...rest];
      return (open as (...a: unknown[]) => void).apply(this, args);
    } as typeof XMLHttpRequest.prototype.open;
  }

  /* ---------------------------------------------------------- shell globals */
  /**
   * Resolves a host for a given subdomain. The engine has the same routine in
   * C++ and compares results, so the behaviour has to match: a bare or
   * `trade.`-prefixed host gains the subdomain, a deeper one has its first
   * label replaced, and an empty subdomain drops that label.
   */
  shell.replaceHostSubdomain = (url: string, subdomain: string) => {
    const labels = String(url).split(".");
    const shallow =
      labels.length <= 2 || labels[0] === "int" || labels[0] === "trade" || labels[0].startsWith("build");

    if (shallow) {
      if (subdomain.length > 0) labels.unshift(subdomain);
    } else if (subdomain.length > 0) {
      labels[0] = subdomain;
    } else {
      labels.shift();
    }
    return labels.join(".");
  };

  shell.getCookie = (name: string) => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : undefined;
  };

  shell.setupCookie = (name, value, cookieOptions) => {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    for (const key of Object.keys(cookieOptions ?? {})) {
      const setting = (cookieOptions ?? {})[key];
      cookie += `; ${key}${setting === true ? "" : `=${setting}`}`;
    }
    document.cookie = cookie;
  };

  // Read by the shell and by toLoad.js when it builds every asset URL.
  shell.resHost = resourceHost;
  shell.orignHost = resourceHost;
  shell.resV = resourceVersion;
  shell.urlhash = location.hash;
  // Swallows the shell's analytics pushes without loading a tag manager.
  shell.dataLayer = { push: () => {} };

  /* ------------------------------------------------------------------- boot */
  window.addEventListener("error", (event) => status(`error ${event.message}`, "bad"));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as { message?: string } | undefined;
    status(`reject ${reason?.message ?? String(event.reason)}`, "bad");
  });

  /**
   * Mirrors the engine's own log.
   *
   * The engine reports through `GLEngineModule.appendLogMessage`, which the
   * shell only prints when the line contains `[error]` — everything else goes
   * into a 32-entry ring buffer and is never seen. Wrapping it surfaces the
   * engine's view of its own boot, which is the only place that says why it
   * stopped.
   */
  (function waitForEngine(attempt: number) {
    const engine = shell.GLEngineModule;
    if (!engine || typeof engine.appendLogMessage !== "function") {
      if (attempt < 600) setTimeout(() => waitForEngine(attempt + 1), 100);
      return;
    }

    status("engine module ready, mirroring its log", "good");

    // The overlay stays readable, but the full stream is kept for querying:
    // the engine's last events are what say where a boot stopped.
    shell.__gl = [];
    const inner = engine.appendLogMessage;
    engine.appendLogMessage = function (this: unknown, message: unknown) {
      const text = String(message);
      shell.__gl?.push(text);
      if (shell.__gl && shell.__gl.length > 4000) shell.__gl.splice(0, 2000);
      // The engine traces every dispatched event. Those lines crowd out the
      // ones that carry information, so they are kept out of the overlay.
      if (text.includes("Executing EVENT:") || text.includes("EventMVMessage")) {
        return inner.call(this, message);
      }
      // Drop the engine's own timestamp prefix; the overlay is already ordered.
      status(`gl    ${text.replace(/^\[[\d\-: .]+\]\s*/, "")}`, text.includes("[error]") ? "bad" : undefined);
      return inner.call(this, message);
    };

    const progress = engine.setInitProgress;
    if (typeof progress === "function") {
      engine.setInitProgress = function (this: unknown, done: number, total: number) {
        if (done === total) status(`init complete (${total} steps)`, "good");
        return progress.call(this, done, total);
      };
    }
  })(0);

  const manifest = document.createElement("script");
  manifest.src = `${resourceHost}/toLoad.js?v=${resourceVersion}`;
  manifest.onerror = () =>
    status(`could not load ${manifest.src}\nrun: node scripts/download-engine.mjs`, "bad");
  manifest.onload = () => status("manifest loaded, engine starting", "good");
  document.head.appendChild(manifest);
}
