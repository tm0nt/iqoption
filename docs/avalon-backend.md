# Market data stack

The Avalon traderoom ships its chart as a 103 MB Emscripten build
(`glengineaa60ee59.wasm`, loaded by `glengineaa60ee59.js`). The engine is a
renderer: `iqplot::` draws, `F2::` lays out panels, and all of it is fed by one
JSON WebSocket. Nothing about the picture requires the WASM — it requires the
socket.

So this repo owns both ends of that socket:

```
server/                  our back end        speaks the protocol
  market/prices.mjs        price curve
  market/feed.mjs          ticks + candles
  protocol/router.mjs      calls + streams
  connection.mjs           handshake, keepalive
  index.mjs                ws + http

src/lib/avalon/          our client          speaks the protocol
  client.ts                socket, rpc, subscriptions, reconnect
  candles.ts               history + live series
src/components/chart/    our renderer
  engine.ts                canvas, scales, viewport
```

The client points at either back end by URL alone, because both answer the same
frames on the same path.

## Running it

```bash
npm run server     # ws://localhost:3100/echo/websocket
npm run dev        # http://localhost:3000/pt/traderoom
```

`.env.local` (copied from `.env.example`) decides which feed the app talks to:

```
NEXT_PUBLIC_AVALON_WS_URL=ws://localhost:3100/echo/websocket
NEXT_PUBLIC_AVALON_SSID=dev-session
```

Swap both for the live values to point the same UI at the real feed. Anything
in a `NEXT_PUBLIC_` variable is compiled into the client bundle, so a real
session id belongs in `AVALON_SSID` (server only) and not there.

Without a session id the chart falls back to a seeded generator and shows a
`demo data` badge, so the clone still renders with nothing configured.

## Protocol

Every frame is JSON with a `name` discriminator.

### Handshake

```jsonc
--> {"name":"ssid","msg":"<session id>","request_id":"1"}
<-- {"name":"profile","msg":{...}}
<-- {"name":"front","msg":"ws05.ws.prod.sc-ams-1a.quadcode.tech","session_id":"..."}
<-- {"name":"balances","msg":[...]}
```

`timeSync` arrives every second from the moment the socket opens, before
authentication; the client uses it as a clock offset so candle buckets line up
with the server's. `heartbeat` must be echoed back or the connection is dropped.

### Calls

`sendMessage` wraps a request/response call. The answer carries the same
`request_id` and a `status` (2000 ok, 4xxx error).

```jsonc
--> {"name":"sendMessage","request_id":"7","local_time":1790993164000,
     "msg":{"name":"get-candles","version":"2.0",
            "body":{"active_id":816,"size":60,"to":1790993160,"count":300}}}
<-- {"name":"candles","request_id":"7","status":2000,
     "msg":{"candles":[{"id":29849877,"from":1790992620,"to":1790992680,
                        "open":83594.14,"close":83464,"min":83435.82,
                        "max":83594.14,"volume":306,"phase":"C"}]}}
```

Implemented calls: `get-candles`, `get-initialization-data`, `get-active-list`,
`get-profile`, `get-balances`.

### Streams

`subscribeMessage` opens an event stream, filtered by `routingFilters`. The feed
fans out on a shared connection, so a client must match the filters back against
each payload.

```jsonc
--> {"name":"subscribeMessage","request_id":"8",
     "msg":{"name":"candle-generated","version":"1.0",
            "params":{"routingFilters":{"active_id":816,"size":60}}}}
<-- {"name":"candle-generated","msg":{"active_id":816,"size":60,"phase":"T",...}}
```

`phase` is `T` while the bucket is open and `C` once it closes. A rollover emits
the finished bucket before the new one, so a client never infers a close.

Implemented streams: `candle-generated`, `quote-generated`.

## The price curve

`server/market/prices.mjs` is a pure function of (instrument, time): fractal
brownian motion over interpolated value noise, so the same second always yields
the same price, in this process or the next.

That is what keeps history and the live stream consistent without storing a
series — a client asking for last hour gets exactly the bars it would have seen
had it been connected, and the candle it is watching tick is the same function
sampled at `now`. Consecutive candles join up because `open` is the curve at the
bucket's first instant and `close` at its last.

Per-instrument `base`, `volatility` and `period` live in
`server/market/actives.mjs`.

## Checking the two against each other

`scripts/avalon-probe.mjs` dumps one sample of every frame a feed sends.

```bash
# our back end
node scripts/avalon-probe.mjs --url ws://localhost:3100/echo/websocket \
  --ssid dev --active 816 --size 60

# the live feed, with a session id from the traderoom tab you are signed in to
AVALON_SSID=<ssid cookie> node scripts/avalon-probe.mjs --active 1 --size 60
```

Read the live ssid from DevTools -> Application -> Cookies ->
`trade.avalonbroker.com` -> `ssid`. It is a session credential: keep it out of
commits and shared logs.

## Hosting the real engine

The engine is not configurable. Its feed URL is a string inside the WASM, built
from the hostname it asks JS for (`GLEngineModule.selfHostname`). But the socket
itself is opened by glue code in page scope:

```js
socket = new WebSocket(UTF8ToString($1));   // glengineaa60ee59.js
```

So replacing `window.WebSocket` before the engine boots points it at our back
end with no patching of the binary. The same glue exposes
`GLEngineModule.WebSocket_onReceive(ptr, data, len, isBinary)` and
`WebSocket_onChangeReadyState(ptr, state, code)`, which is a second, lower entry
point if a transport other than a socket is ever wanted.

`public/engine-host/index.html` is that host page. It also answers `/api/appinit`
and `check-session` locally, and **blocks every cross-origin request**, so the
shell's analytics, crash reporting and push registration cannot phone home.

```bash
node scripts/download-engine.mjs       # mirrors 71 files, 107.8 MB
npm run server
npm run dev
# then open, note the explicit index.html — Next 404s on /engine-host
http://localhost:3000/engine-host/index.html?ws=ws://localhost:3100/echo/websocket
```

`public/engine/` is gitignored; the mirror script refetches it.

### The HTTP surface

The engine does not only speak WebSocket. It also calls a dozen HTTP endpoints
during boot, over both `fetch` and `XMLHttpRequest`, and the shell builds some
of those URLs as `location.protocol + hostname + path` — with the `//` missing,
which parses as a different origin.

The shim answers them by **rewriting the URL to a static file** under
`public/engine-host/stubs/`, rather than by fabricating `Response` objects. One
rewrite rule then covers both transports, and nothing has to reimplement XHR's
event machinery. The paths came out of the WASM's own string table:

```bash
grep -ao "/api/[a-zA-Z0-9/_.-]\{3,60\}" public/engine/glengineaa60ee59.wasm | sort -u
```

A same-origin `/api/` call with no rule logs `UNSTUBBED` in red and gets `{}`,
so an unimplemented endpoint shows up instead of hanging. Everything
cross-origin is answered with `{}` and logged as `block`.

### Authentication

The engine does not use the `ssid` frame. It sends:

```jsonc
--> {"name":"authenticate","request_id":"1",
     "msg":{"ssid":"…","protocol":3,"session_id":"","client_session_id":""}}
<-- {"name":"authenticated","request_id":"1","msg":true}
```

and holds every other message back — the engine's own trace logs them as
`CACHE MSG …` — until it sees `authenticated`. `profile`, `front` and
`balances` follow. The older `ssid` spelling is still accepted.

### Keeping the page sealed

The shell bundles Sentry, which obtains a clean `fetch` from a hidden iframe and
so slips past any patch of `window.fetch` — it was observed reaching its ingest
host. Patching is not enough, so the real boundary is a
`Content-Security-Policy` header on `/engine-host/*` in `next.config.ts`, which
the browser enforces across every transport. `connect-src` is scoped to
localhost, so pointing the page at a remote feed means widening it first.

### The discovery loop

The `F2::` framework asks for far more than candles before it will paint. The
server names everything it does not implement, on stdout, verbose or not:

```
[avalon] MISSING CALL   get-features v2.0 body={"tags":["new-web-screens"]}
[avalon] MISSING STREAM position-changed filters={"user_id":1}
```

Boot the host page, read the `MISSING` lines, add the handler to
`server/protocol/router.mjs`, repeat. The engine always receives a `4040` naming
what was missing rather than silence, so it fails loudly instead of hanging.

Terminal output is easy to lose, so the server can keep its own record instead:

```bash
npm run server:trace     # writes server/.transcript.jsonl (gitignored)
```

One JSON object per line, every frame a client sent:

```bash
jq -r 'select(.direction=="in") | .payload.msg.name // .payload.name' \
  server/.transcript.jsonl | sort | uniq -c | sort -rn
```

That histogram is the engine's actual requirements list, in priority order.

### Artwork

The engine loads brand, category and indicator icons with `new Image()`, which
no patch of `fetch` or `XMLHttpRequest` can intercept. `/storage/public/:path*`
is therefore rewritten to a transparent pixel in `next.config.ts`, server side,
where every transport is covered.

## Reading the engine's acceptance

A `2000` is not acceptance. The engine will take a well-formed answer, reject
its contents silently, and start the session over — which looks like a healthy
log and a client that never finishes booting.

The measure that works is **repetition**. A call that is answered acceptably is
asked once or twice per boot; one that is answered unacceptably is asked
hundreds of times. Comparing counts between runs of the transcript is how each
of these was found:

| | before | after |
|---|---|---|
| sockets opened | 273 | 1 |
| `get-forget-user-status` | 1126 | 10 |
| `core.get-profile` | 676 | 10 |

The first collapse came from answering unknown calls at all — an unknown call
made the engine open a *new socket* rather than reuse its own. The second came
from filling out `profile`: a thin version with nine fields was accepted and
discarded, because the client subtracts `hold_amount` and `orders_amount` from
`amount` to show available funds and reads `equivalent` for the display
currency. Absent fields read as undefined, the profile is dropped, and the
client re-authenticates.

So `server/accounts.mjs` returns 38 profile fields and 18 per wallet, following
a response recorded from the live feed.

## Frames recorded from the live feed

`scripts/capture-frames.js` taps `window.WebSocket` in the real traderoom and
keeps one example of every frame. One boot yielded 61 distinct names; these are
the shapes that matter here.

**Acknowledgements** are generic, not derived from the request name:

```jsonc
<-- {"name":"result","request_id":"…","msg":{"success":true}}
```

257 of them in a single boot. Subscriptions, unsubscriptions and `setOptions`
all answer this way.

**Candles** confirmed the implementation in `server/market/`, with two
differences worth noting: `at` is in **nanoseconds**, and live candles carry
`ask`/`bid` alongside the OHLC.

```jsonc
<-- {"name":"candle-generated","microserviceName":"quotes",
     "msg":{"active_id":2270,"size":5,"at":1791002306041555700,
            "from":1791002305,"to":1791002310,"id":10062049,
            "open":84646.06,"close":84656.21,"min":84646.06,"max":84656.21,
            "ask":84656.212,"bid":84656.211,"volume":0,"phase":"T"}}
```

A history answer is bare, with no envelope:
`{"name":"candles","request_id":"114","msg":{"candles":[{id,from,to,open,close,min,max,volume}]}}`.

**`first-candles`** returns the newest candle for every timeframe at once,
keyed by size in seconds — this is what a chart asks for when it opens:

```jsonc
<-- {"name":"first-candles","request_id":"66",
     "msg":{"candles_by_size":{"1":{…},"5":{…},"10":{…},"60":{…}}}}
```

**Instruments** do not come from `get-initialization-data`: its `turbo`,
`binary` and `blitz` blocks were all empty for the account recorded. The catalog
arrives as `actives-index` (active ids grouped by `commodity`, `crypto`, `etf`,
`forex`, `index`, `stock`), `instruments-list` (leverage and markups) and
`instruments` (digital option strikes).

## Translations

The client keeps its UI strings in its own virtual filesystem, at
`/local/strings_<locale>_<version>.txt`, and reads them before it will paint.
When the file is missing it reports

```
Can't open file '/local//strings_en_1051611253.txt'
Failed to parse input JSON: The document is empty.
```

The document is served by `/api/lang/route-translations`, and its shape is the
standard envelope with the strings **nested under a locale key**:

```jsonc
{"isSuccessful":true,"message":[],"result":{"en":{"desktop.BB":"Bollinger Bands", …}}}
```

That nesting is the whole trick. A flat `result` map — the obvious reading —
is worse than an empty one: the client stops before it opens its socket.

`public/engine-host/stubs/lang-route-translations.json` holds our own short set
of strings in that shape. Keys with no entry render as the key itself.

## Shapes taken from a wide capture

One boot of the real traderoom, summarised structurally with
`scripts/capture-frames.js`, corrected seven answers that had been guessed:

| frame | shape |
|---|---|
| `result` | `{success}` — the ack for every subscription and `setOptions` |
| `resources` | `[]`, bare, `status: 2000` — empty on the live feed too |
| `balances` | bare array of 18-field wallets |
| `additional-blocks` | `{user_id, additional_blocks:[{id, enabled}]}` |
| `features` | `{identity, features:[{id,name,category,params,version,status}]}` — 377 of them |
| `feed-languages` | `{type, available_settings:[…]}` |
| `forget-user-status` | `{status}` and nothing else |
| `subscription-balance-changed` | `{id}` |
| `underlying-list` | `{items:[…]}` |
| `verification-init-data` | `{user_id, requirements_data, restrictions_data, verification_level_data, steps_summary}` |
| `positions` | `{positions, total, limit}` |
| `trading-params` | `{commissions:[{active_id, value}]}` — 161 entries |
| `actives-index` | ids by class; `forex` splits into `major`/`minor`/`exotic` |
| `alerts` | `{total, records}` |
| `traders-mood` | `{instrument, asset_id, value}` |

## An instrument, as the feed describes it

Answered per asset, and richer than the option catalog in
`get-initialization-data`:

```jsonc
{"name":"active","request_id":"71","status":0,
 "msg":{"id":2516,"name":"Samsung-L","description":"Samsung-L",
        "is_visible":true,"is_paused":false,"active_group_id":2,"priority":500,
        "precision":4,"pip_scale":2,"spread_plus":0.4,"spread_minus":0.1,
        "time_from":"00:00:00","time_to":"00:00:00",
        "expiration_days":[1,1,1,1,1,1,1],
        "currency_left_side":"Samsung-L","currency_right_side":"USD",
        "type":"Stock","is_otc":false,"min_qty":1,"qty_step":1}}
```

`is_visible`, `is_paused` and the `time_from`/`time_to` pair decide whether an
instrument can be selected at all; `00:00:00` on both means around the clock.

## Where the engine effort stands

The engine boots, authenticates, runs its WebGL loop at 30fps and answers every
frame we send — its own telemetry reports one connection, no disconnects and
~1400 frames in. What it does **not** do is leave its `login` view, so the
traderoom is never built and no candle is ever requested.

That view is not a sign-in form; it is the waiting state for a sequence the
binary names `login_step_socket`, `_profile`, `_features`, `_settings`, `_kyc`
and `_assets`. Five are confirmed by the events they raise
(`EventAuthenticated`, `EventFullProfile`, `CommandFeaturesInitialized`,
`EventUserConfigReceived`, `EventKycStepsReceived`). The sixth never completes,
and `F2::CMain::checkLoginConnectionProgress()` is the gate that holds
`initializeTraderoom()` behind it.

### The engine's own instrumentation

It ships a 39-function automation API, which is far better than guessing from
the outside:

```js
const m = window.GLEngineModule;
m["automation.getViewName"](m["automation.getCurrentView"]())  // "login"
m["automation.getElementViaQuery"](view, "*")                  // 0 elements
m["automation.SOBADgetPerfStats"]()                            // sockets, fps
m["automation.getFeatureState"]("binary-instrument")           // per flag
```

`public/engine-host/index.html` also keeps the engine's full log in
`window.__gl`, which is where the two timed-out requests and the step names
came from. The overlay filters it; `__gl` does not.

### The client names the frame it wanted

Every timeout prints the answer it was waiting for:

```
WS:get-trading-group-params -> {"name":"trading-params","msName":"","request_id":"","status":-6}
```

That line turns a guess into a read, and it is how `trading-params`,
`set-user-settings-reply` and the promo-code answers were fixed. The naming is
not one rule: most answers are the request minus `get-`, but
`set-user-settings` answers as `set-user-settings-reply`,
`subscribe-balance-changed` as `subscription-balance-changed`, and
`trading-settings.get-trading-group-params` as plain `trading-params` — even
though its *change* streams are `turbo-option-trading-group-params-changed`.
Deriving names from the stream names looks right and is wrong.

Calls carry a service prefix that answers drop: `promo-codes.get-…`,
`core.get-profile`, `trading-settings.get-…`. A handler registered without the
prefix never matches, and the client waits ten seconds per call rather than
reporting anything.

### Observation channels, and what each one gave

| channel | state |
|---|---|
| server transcript (`npm run server:trace`) | clean — no unhandled call or stream |
| the engine's own log (`window.__gl`) | clean — no timeouts left |
| its automation API | `view: login`, 0 elements, healthy socket, 30fps |
| its analytics (`/api/v1/events`) | silent — it never posts the stage events |
| a recording of the live feed | unavailable; see below |

### Ruled out

- **Translations** — fixed; the error is gone and the file loads.
- **`check-session`** — its shape was wrong and is now right, but it was never
  the gate: login succeeds well before the stall.
- **Instrument family** — `turbo`/`binary` *is* read; the log shows
  `parse binary` with our nine instruments, despite `binary-instrument` being
  disabled on the live brand.
- **Asset groups, digital underlyings, user-setting defaults, tab features** —
  all plausible, all tried, none moved the view.

### Still open

- One texture path arrives as the literal `https://[resources_endpoint]/…`,
  unsubstituted, even though `/api/configuration` carries that key and the same
  file is where the client correctly found the websocket host.
- What `checkLoginConnectionProgress` actually waits for.

### How to resume

The discovery loop that worked — read the log, add the handler, measure the
repetition — has run dry: the client now waits silently instead of complaining.
Two ways forward:

1. **Capture a working boot.** `scripts/capture-frames.js` records both
   directions; its header has the timing recipe. The live traderoom has been
   intermittent (`runtimeReady: true` with no socket at all), so this needs a
   window when it works. The outbound call order after
   `internal-billing.get-balances` is the missing piece.
2. **Decompile the gate.** `F2::CMain::checkLoginConnectionProgress()`.

## Known gaps

- **Instrument ids are provisional.** `server/market/actives.mjs` follows the
  ids the live feed appears to use, but they have not been reconciled against a
  real `get-initialization-data` response. Run the probe against the live feed
  and correct the catalog; `src/components/sites/.../actives.ts` maps the UI's
  asset tabs onto them.
- **No order flow.** `get-candles` and the two streams are in; placing,
  settling and reporting positions are not.
- **The engine still re-initialises in a loop.** Every call it makes is
  answered and no errors remain, but it reports
  `Failed to parse input JSON: The document is empty` and starts over. The
  likely cause is the resources chain: `resources.get-resources` returns an
  empty list, so the translations file the engine expects at
  `/local/strings_<locale>_<version>.txt` is never fetched, and parsing the
  missing content fails. Mapping that payload is the next step.
- **No real identity.** Any unknown session id is accepted and handed a fresh
  demo account. That is deliberate for development and must not be deployed.
