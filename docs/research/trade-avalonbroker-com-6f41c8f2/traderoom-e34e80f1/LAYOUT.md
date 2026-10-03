# Layout — /traderoom

Reference viewport **1440x763** (1:1 capture). All values below were found by scanning the
screenshot for colour transitions, so they are measured, not estimated.

## Structural grid

| Region | Measured | In the clone |
| --- | --- | --- |
| Top bar | y 0–74, 1px `#494949` bottom edge | `header` 0,0,1440,74 ✓ |
| Left rail | x 0–75, 1px `#484848` right edge, bg `#000` | `nav` 0,74,75,653 ✓ |
| Side panel | x 76–335 (260px), 1px `#4b4b4b` right edge | `section` 75,74,260,653 ✓ |
| Content column | x 336 → 1440 | `main` 335,74,1105,653 ✓ |
| Chart toolbar | vertical strip ~42px at the left of the content column | ✓ |
| Trade panel | right column, controls 110px wide starting x 1320 | 120px column ✓ |
| Portfolio header | y 523–557 (34px), bg `#2c2d31` | ✓ |
| Portfolio body | y 558–726, bg `#17181a` | ✓ |
| Status bar | y 727–763 (36px), 1px `#474747` top edge | `footer` 0,727,1440,36 ✓ |
| Document | 1440x763, **no scroll** | 1440x763, no scroll ✓ |

## Palette

Brand colours are the exact values extracted from the auth pages; the greys were sampled from
the screenshots and are accurate to about ±2 per channel.

| Token | Value | Use |
| --- | --- | --- |
| `--color-tr-bg` | `#000000` | page, rail, panels, top bar, status bar |
| `--color-tr-surface` | `#17181a` | portfolio body, active rail item |
| `--color-tr-surface-2` | `#131416` | inactive asset tab |
| `--color-tr-bar` | `#2c2d31` | portfolio header band |
| `--color-tr-hover` | `#212123` | trade-panel controls |
| `--color-tr-line` | `#2b2b2d` | panel dividers |
| `--color-tr-line-strong` | `#484848` | rail/panel separators |
| `--color-tr-muted` | `#8b8c8e` | secondary text |
| `--color-tr-buy` | `#09af8e` | up candles, BUY, accents (measured `#0aaf8f` in JPEG) |
| `--color-tr-sell` | `#f6465d` | down candles, SELL |
| `--color-tr-support` | `#f94b64` | status-bar support pill |
| `--color-tr-gold` | `#f29423` | Bitcoin glyph |

## Rail

Ten items, each a 22px icon over a two-line 9px uppercase label: Total portfolio, Trading
history, Chats & support, Tutorials, Promo (badge 2), Tournaments, Webinars (NEW), Market
analysis, Leader board, and More pinned to the bottom.

**The rail is adaptive.** At an inner height of 763px the app folds Market analysis and Leader
board into More; at 860px it shows them in the rail. The clone keeps all nine in the rail and
also lists the four sub-items under More, which is what the original does at the taller height.

"Total portfolio" is not a panel — it toggles the bottom positions drawer.

## Chart

| Thing | Value |
| --- | --- |
| Price grid step | 50 units |
| Candle body | ~62% of the slot width |
| Time axis | four labels at 30-second spacing |
| Price pill | `#e8e9eb` on black text, pinned to the price axis with a left-pointing notch |
| Countdown | solid white rail plus a dashed rail to its left, both full plot height |
| Expiry readout | `00:03` above the dashed price line |
| OHLC readout | `ask`/`bid` to four decimals, bottom-left |
| Watermark | "AVALON" at ~3.5% white |
