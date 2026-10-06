import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        // Brand, category and indicator artwork lives on the broker's CDN. The
        // engine loads it with `new Image()`, which no patch of `fetch` or
        // `XMLHttpRequest` can see, so the substitution has to happen here. A
        // transparent pixel satisfies its image loader without mirroring any
        // of the artwork.
        source: "/storage/public/:path*",
        destination: "/engine-host/stubs/pixel.png",
      },
    ];
  },
  async redirects() {
    return [
      {
        // The host page is a static file, so `/engine-host` alone 404s. Next's
        // own trailing-slash normalisation sends `/engine-host/` here too.
        source: "/engine-host",
        destination: "/engine-host/index.html",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // The engine host page and its stubs are edited between reloads while
        // the boot sequence is being worked out. Caching them turns every
        // iteration into a hunt for a stale file.
        source: "/engine-host/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          {
            // The engine's shell bundles Sentry, which reaches for a clean
            // `fetch` out of a hidden iframe and so slips past any patch of
            // `window.fetch`. A header-delivered policy is enforced by the
            // browser on every transport instead, which is the only way to
            // actually hold the "nothing leaves this origin" line.
            //
            // `unsafe-eval` is required, not merely convenient:
            // Embind generates its C++ bindings with `new Function()`, so
            // `wasm-unsafe-eval` alone leaves every type unregistered and the
            // engine throws `UnboundTypeError` for its own methods. Allowing
            // it costs little here, since the point of this policy is
            // `connect-src` — the page runs third-party code by design, and
            // what matters is that none of it can call home.
            //
            // `connect-src` names every host the page may reach. The
            // production domain is here because that is where the feed lives
            // once deployed; `ws.trade.avalonbroker.com` is the broker's own
            // socket, and it is worth knowing it is listed — the host shim
            // rewrites `/echo/websocket` to this platform's feed before the
            // engine opens it, so nothing uses that entry today, and removing
            // it would make the policy match the intent exactly.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "media-src 'self'",
              "worker-src 'self' blob:",
              "connect-src 'self' ws://localhost:* http://localhost:* wss://ws.trade.avalonbroker.com wss://trading.spalone.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
