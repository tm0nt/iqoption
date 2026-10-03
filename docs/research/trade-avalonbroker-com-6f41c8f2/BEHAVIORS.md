# Behaviour Bible — trade.avalonbroker.com auth pages

Extracted on the login page and re-verified on `/en/register` and `/en/change-password`. The
shared chrome (navbar, language menu, footer, cookie notice) behaves identically on all three.

Findings from the mandatory interaction sweep (scroll / click / hover / responsive), all
values captured by diffing `getComputedStyle()` before and after each trigger.

## Scroll sweep

**Nothing is scroll-driven.** `document.documentElement.scrollHeight === window.innerHeight`
at 1440×900, 768×1024 and 390×844, so the page never scrolls.

- Navbar: `position: fixed` with `transition: background-color 0.3s`, but no scroll listener
  changes it — it is `#FBF9FA` with `rgba(0,0,0,0.05) 0 0 16px 1px` at every scroll position.
- No `scroll-snap-type`, no `position: sticky` beyond the fixed navbar, no `animation-timeline`.
- No smooth-scroll library present (no `.lenis`, no `.locomotive-scroll`, no scroll wrapper).
- No viewport-entrance animations (no fade-up / slide-in / stagger).

## Click sweep

### Language menu — click-driven dropdown
- **Trigger:** click on the lang button (`.eb8mhue1`).
- **State A (closed):** `opacity: 0`, `transform: matrix(1, 0, 0, 1, 0, 5)` (translateY 5px).
- **State B (open):** `opacity: 1`, `transform: matrix(1, 0, 0, 1, 0, 0)`.
- **Transition:** `opacity 0.15s, transform 0.2s`.
- **Panel:** `position: absolute; top: 46px; left: -308.375px; margin-top: 18px; width: 380px;
  padding: 8px; background: #FBF9FA; border-radius: 4px;
  box-shadow: rgba(0,0,0,0.05) 0 0 16px 1px; z-index: 131`.
- **Items:** three 182×44 links in a 2-column wrap — English, Español, Português.
  `display: flex; align-items: center; padding: 10px 16px; border-radius: 2px; font: 14px/24px 500`.
  The active item (English) is `#09AF8E`; the others are `#5A595B`. The 18×18 flag sits in a
  span to the left of the label.
- The panel also contains a close button (`#icon_layout_close`, 18×18, `fill #1f1f21`) that is
  zero-sized on desktop.

### Cookie notice — click-driven dismiss
- **Trigger:** click "Got it" (`[data-test-id=notification-action-label]`).
- Removes the banner. The wrapper carries
  `transition: top 0.4s ease-in-out, margin-top 0.4s ease-in-out, margin-bottom 0.4s ease-in-out, opacity 0.4s`
  and sits at `opacity: 0.98` while visible.

### Other clickables
- "Log In" submit, "Log in with Google", "Forgot password?", "Sign Up" (header and inline),
  and the logo. The logo is explicitly inert (`data-test-id=header-logo-link-disabled`).
- Nothing on this page opens a modal, accordion, carousel or tab set.

## Hover sweep

| Element | Property | Before | After | Transition |
| --- | --- | --- | --- | --- |
| Log In submit | `background-color` | `rgb(9, 175, 142)` | `rgb(0, 170, 137)` | `border 0.2s, background-color 0.2s, color 0.15s` |
| Sign Up (header) | `background-color` | `rgb(9, 175, 142)` | `rgb(0, 159, 127)` | same |
| Log in with Google | `background-color` | `rgb(251, 249, 250)` | `rgb(245, 243, 244)` | same |
| Forgot password? | `text-decoration-line` | `none` | `underline` | same |
| Sign Up (inline link) | `text-decoration-line` | `none` | `underline` | same |
| Language button | — | — | **no change** | — |

## Focus / filled states

- **Trigger:** focusing an input, *or* the input having a value.
- **State A:** input wrapper `border: 1px solid rgb(145, 144, 145)`.
- **State B:** input wrapper `border: 1px solid rgb(35, 36, 37)`.
- The `<input>` itself never changes (no outline, no background, no colour shift) — only the
  wrapper border does.
- The dark border **persists after blur while the field holds a value** (verified: fill, blur,
  re-measure — still `rgb(35, 36, 37)`). So the rule is `:focus-within, :not(:placeholder-shown)`.
- No floating label, no success/error colour observed on the default page.
- The email field is autofocused on load (visible in the first paint of the live page).

## Responsive sweep

Measured with a 1px-step sweep from 1500px down to 320px. See `DESIGN_TOKENS.md` for the
full table; the discrete breakpoints are **1279, 959, 839, 599, 479** (all `max-width`).

| Width | Layout |
| --- | --- |
| 1440 | Full header (logo left, flag + "en", pill Sign Up right); card 420px centred; footer 64px |
| 768 | Sign Up is already a 40×40 outlined circle icon; lang still shows flag + "en"; card `padding-top: 32px` |
| 390 | Lang is a 40×40 grey circle (flag only); `h1` 24px; navbar padding 16px; cookie banner spans the full width at the bottom with its accent edge on top |


## Register page — additional behaviours

- **Country select** (`[data-test-id=register-country-select-select_header]`): click-driven
  dropdown, 418px panel anchored under the 50px header, with a search input above a
  270px-max virtualized list. Choosing a country also switches the phone dial code.
- **Dial-code select**: same mechanism, 120px header, 241 entries.
- **Submit / Google / header Log In**: the same `border 0.2s, background-color 0.2s, color 0.15s`
  transition and hover darkening as on the login page.
- **The register page scrolls** — 1134px at 1440x900 and 1126px at 390x844. It is the only one
  of the three that does. There is still no scroll-driven behaviour: the navbar does not change,
  nothing animates in, and there is no scroll-snap or smooth-scroll library.

## Change-password page — additional behaviours

- No social login, no risk warning, no tabs — the only interactive elements are the single
  autofocused field, the submit, and two links.
- Its field sits on `rgb(251, 249, 250)` instead of white; the focus/filled border rule is
  otherwise identical.
- Does not scroll at any tested viewport.
