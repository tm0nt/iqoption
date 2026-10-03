# Design Tokens — trade.avalonbroker.com/en/login

All values read from `getComputedStyle()` on the live page at 1440 / 768 / 390 px.
The site ships CSS-in-JS (emotion, `css-*` + `e*` class pairs); the only static stylesheet
is normalize.css, so every value below came from computed styles, not from a stylesheet.

## Colors

| Token | Value | Hex | Used by |
| --- | --- | --- | --- |
| `--avalon-primary` | `rgb(9, 175, 142)` | `#09AF8E` | Log In button, Sign Up button, links, active lang item, "Got it" |
| `--avalon-primary-hover` | `rgb(0, 170, 137)` | `#00AA89` | Log In button hover |
| `--avalon-signup-hover` | `rgb(0, 159, 127)` | `#009F7F` | Sign Up button hover |
| `--avalon-text` | `rgb(90, 89, 91)` | `#5A595B` | body text, headings, input text |
| `--avalon-text-strong` | `rgb(31, 31, 33)` | `#1F1F21` | "Log in with Google" label, lang code "en" |
| `--avalon-placeholder` | `rgb(117, 117, 117)` | `#757575` | input `::placeholder` |
| `--avalon-border` | `rgb(145, 144, 145)` | `#919091` | input border (idle) |
| `--avalon-border-focus` | `rgb(35, 36, 37)` | `#232425` | input border (focused / filled) |
| `--avalon-border-muted` | `rgb(172, 171, 172)` | `#ACABAC` | Google button border, risk-warning border, footer top border, flag ring |
| `--avalon-surface` | `rgb(251, 249, 250)` | `#FBF9FA` | navbar, footer, Google button, lang dropdown, cookie banner |
| `--avalon-surface-hover` | `rgb(245, 243, 244)` | `#F5F3F4` | Google button hover, mobile lang button background |
| `--avalon-white` | `rgb(255, 255, 255)` | `#FFFFFF` | page background, input background, divider label background |
| `--avalon-info` | `rgb(0, 99, 179)` | `#0063B3` | 3px accent edge on the cookie banner |

`html` and `body` have no background of their own (`rgba(0,0,0,0)`), so the page reads white.

## Typography

Family: **Montserrat**, fallback `sans-serif`. Weights actually served: 400, 500, 600, 700, 900.
Loaded from Google Fonts with `font-display: swap`.

| Role | size / line-height / weight / tracking |
| --- | --- |
| Page root (`body`) | 16px / 23.2px / 500 |
| `h1` "Log In" (≥480px) | 30px / 40px / 600 / `-1px` |
| `h1` "Log In" (≤479px) | 24px / 32px / 600 / `-1px` |
| Input text | 14px / 16.1px / 400 |
| Input placeholder | 14px / 400 |
| Primary button label | 16px / 24px / 500 |
| Google button label | 14px / 16px / 600 |
| Divider label "or use a social account" | 12px / 20px / 500 |
| "Forgot password?" / "Don't have an account?" / "Sign Up" | 12px / 20px / 500 |
| "RISK WARNING:" | 14px / 18px / 700, `text-transform: uppercase` |
| Risk warning body | 12px / 18px / 500 |
| Header Sign Up label | 14px / 22px / 500 |
| Header lang code "en" | 16px / 26px / 500, `text-transform: capitalize` |
| Footer copyright | 14px / 20.3px / 500 |
| Cookie banner body / action | 12px / 20px / 500 |

## Radii

| Element | Radius |
| --- | --- |
| Inputs | 4px |
| Primary / Sign Up button (desktop) | 2px |
| Google button | 2px |
| Risk-warning box | 4px |
| Lang dropdown panel | 4px |
| Cookie banner | 3px |
| Flag badge, mobile lang button | 50% |
| Mobile Sign Up button | 40px |

## Shadows

| Element | Shadow |
| --- | --- |
| Navbar | `rgba(0, 0, 0, 0.05) 0px 0px 16px 1px` |
| Lang dropdown panel | `rgba(0, 0, 0, 0.05) 0px 0px 16px 1px` |
| Cookie banner | `rgba(0, 0, 0, 0.05) 0px 0px 16px 1px` |

## Transitions

| Element | Transition |
| --- | --- |
| Buttons (`e1qay7kl0`) | `border 0.2s, background-color 0.2s, color 0.15s` |
| Navbar | `background-color 0.3s` |
| Lang code text | `color 0.15s` |
| Lang dropdown panel | `opacity 0.15s, transform 0.2s` |
| Cookie banner | `top 0.4s ease-in-out, margin-top 0.4s ease-in-out, margin-bottom 0.4s ease-in-out, opacity 0.4s` |

## Layout constants

| Thing | Value |
| --- | --- |
| Navbar height | 60px, `position: fixed`, `z-index` on `header` wrapper = 190 |
| Navbar inner padding | `10px 24px` (`10px 16px` ≤479px) |
| Content wrapper | `flex: 1`, `padding-top: 60px` (offsets the fixed navbar) |
| Auth card | `max-width: 420px`, `min-width: 320px`, `margin: auto`, `padding: 48px 16px 60px` (`32px 16px 60px` ≤839px) |
| Card inner | `padding: 0 16px` |
| Form control width | 356px at ≥420px card width |
| Footer | 64px tall + 1px top border, `flex: 0 0 auto` |
| Footer container | `max-width: 1120px`, padding `65px` → `96px` ≤1279 → `36px` ≤959 → `48px` ≤839 → `24px` ≤599 → `16px` ≤479 |
| Cookie banner (≥600px) | `position: fixed; left: 24px; bottom: 24px; width: 376px; z-index: 99998` |
| Cookie banner (≤599px) | full width, `left: 0; bottom: 0; max-width: 100%` |

## Breakpoints (max-width, measured by a 1px sweep from 1500px to 320px)

| Breakpoint | What changes |
| --- | --- |
| `≤1279px` | footer container padding `65px → 96px`; logo wrapper `margin-left: 0 → 24px` |
| `≤959px` | footer container padding `96px → 36px` |
| `≤839px` | Sign Up becomes a 40×40 outlined circle with the login-arrow icon (label hidden, transparent background, 1px `#09AF8E` border, radius 40px); card `padding-top: 48px → 32px`; footer container padding `36px → 48px` |
| `≤599px` | lang button becomes a 40×40 circle, background `#F5F3F4`, radius 50%, label "en" hidden; header left block `padding-right: 16px → 0`; lang menu `margin-right: 12px → 0`; cookie banner goes full-width bottom and its 3px accent moves from the left edge to the top edge; footer container padding `48px → 24px` |
| `≤479px` | `h1` `30px/40px → 24px/32px`; navbar padding `24px → 16px`; logo wrapper `margin-left: 24px → 16px`; footer container padding `24px → 16px` |
