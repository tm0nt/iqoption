# Extraction method — /traderoom

**This page was not extracted the way the auth pages were, because it is not a DOM page.**

## What the target actually is

```
elements in the whole document : 94      (the auth pages have thousands)
document.body.innerText        : ""      (empty — no text in the DOM at all)
the actual UI                  : <canvas id="glcanvas"> 1440x763, context "webgl"
app shell                      : Svelte  (class svelte-dpf2o4)
shadow roots                   : 0
```

The top bar, rail, chart, every panel and **all text** are painted into a single WebGL
texture. There is no element to call `getComputedStyle()` on, no CSS to read, and no string
to copy. The `<input id="input">` in the body is a hidden keyboard-capture field, not UI.

## What was done instead

1. **Capture.** 17 screenshots at a 1:1 viewport of 1440x763 (verified: capture width equals
   `innerWidth`), one per state — default view, all nine rail panels, the More menu and its
   four sub-items, both top-bar dropdowns, the asset selector, and the collapsed-positions state.
   They are in `docs/design-references/trade-avalonbroker-com-6f41c8f2/traderoom-e34e80f1/`.
2. **Measure.** Structural edges were found programmatically with PIL by scanning rows and
   columns for colour transitions, not by eye. See `LAYOUT.md` for the resulting numbers.
3. **Transcribe.** Every label was read off the screenshots by sight — there was no other option.
4. **Rebuild.** The UI is real React + Tailwind markup, not a canvas.

## Accuracy, honestly stated

| Dimension | Confidence |
| --- | --- |
| Structural boundaries (bar heights, rail/panel widths, separators) | **Exact ±1px** — measured by edge detection, and the clone reproduces them exactly (see `QA.md`) |
| Brand colours | **Exact** — reused from the auth-page extraction, which read them from `getComputedStyle` |
| Incidental greys (`#1e1f21`, `#2c2d31`, …) | **±2 per channel** — sampled from JPEG screenshots, which are lossy |
| Type sizes and paddings inside panels | **Approximate** — estimated from pixel distances, not read from CSS |
| Text content (English) | **Verbatim** from the screenshots |
| Text content (Spanish, Portuguese) | **Written for this clone, not extracted** — see below |

## Why es/pt copy is not extracted

The traderoom's language follows the **signed-in account's setting**, not the URL. Reading the
Spanish and Portuguese strings would have meant changing the account's language in its
settings, which is a change to the user's account and was not done. `src/i18n/traderoom.ts`
therefore carries English transcribed from the live app and `es`/`pt` translations written for
this clone, flagged as provisional in that file's header.

This is the one place where the traderoom clone is weaker than the auth-page clones, where
every locale's strings were read from the corresponding live page.

## What is deliberately not reproduced

- **Live market data.** The original streams quotes over a WebSocket. The chart here runs on a
  seeded generator (`buildCandles`) so the server and client render identically.
- **Order placement, deposits, authentication.** All buttons are inert.
- **The account's own data.** The live page shows a real balance, positions, display name,
  e-mail and user id. None of it is in the clone; `mockData.ts` is entirely invented, with
  figures shaped to match the original's column widths and digit counts.
