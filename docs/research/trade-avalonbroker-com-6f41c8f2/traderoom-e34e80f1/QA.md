# Visual QA — /traderoom

Clone measured at the same 1440x763 reference viewport as the capture.

## Structural match

| Region | Original (measured) | Clone (measured) | Δ |
| --- | --- | --- | --- |
| Top bar | 0,0,1440,74 | 0,0,1440,74 | 0 |
| Rail | width 75 | 0,74,75,653 | 0 |
| Side panel | 260 wide, starts x 76 | 75,74,260,653 | 0 (the 1px edge sits inside the rail) |
| Content column | starts x 336 | 335,74,1105,653 | 0 |
| Status bar | 727→763, 36 tall | 0,727,1440,36 | 0 |
| Document | 1440x763, no scroll | 1440x763, no scroll | 0 |

## Behaviour

| Check | Result |
| --- | --- |
| All 9 rail panels open with the right title | pass |
| More → Market analysis / Leaderboard / Help / Alerts | pass |
| Asset selector opens and closes | pass |
| Balance and profile dropdowns, outside-click and Escape | pass |
| Positions drawer toggles from the rail and from the bar | pass |
| Onboarding dismiss | pass |
| Console errors | none |
| Locales en / es / pt | all render |

## Known gaps

1. The price grid shows two lines where the original often shows three or four; the seeded
   series spans a slightly narrower range than the live feed happened to at capture time.
2. Spanish and Portuguese copy is written for this clone rather than extracted — see
   `EXTRACTION_METHOD.md`.
3. Panel-internal type sizes and paddings are estimated from pixels, not read from CSS, so they
   are close rather than provably exact.
4. The chart does not animate; the original's last candle updates live.
