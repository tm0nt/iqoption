# ChangePasswordCard / ChangePasswordForm Specification

## Overview
- **Target files:**
  `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-change-password-9910c59f/ChangePasswordCard.tsx`
  `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-change-password-9910c59f/ChangePasswordForm.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-change-password-9910c59f/desktop-1440-full.png`
- **Interaction model:** static layout; the single field is focus-driven

## Computed Styles

### Card (`e1imzaze0`)
- display: block; position: relative; width: 100%
- minWidth: 320px; maxWidth: 420px; margin: auto
- padding: 48px 16px 60px  →  **32px 16px 60px at ≤839px**
- box-sizing: border-box

### Inner (`e1imzaze1`)
- display: block; width: 100%; maxWidth: 420px; padding: 0 16px (356px content at 420px card)

### Heading
- Identical to the login page: 600 30px/40px, `letter-spacing: -1px`, centred;
  24px/32px at ≤479px. Wrapper `margin-bottom: 20px`.

### Illustration (`e1pc040f0`)
- display: block; width: 88px; height: 88px; **margin: 24px auto**; overflow: hidden
- Sprite symbol `#icon_general_form-recovery` — a lock inside a circular arrow on a pale
  circular field. Reproduced as `PasswordRecoveryIcon`.

### Instruction (`e1pc040f1`)
- display: block; width: 100%; margin: 24px 0
- color: rgb(90, 89, 91); font: 500 14px/22px Montserrat; textAlign: center
- Wraps to two lines at 356px (44px tall).

### Field wrapper (`e1pc040f3`)
- display: block; width: 100%; height: 50px; **marginBottom: 16px**
- **backgroundColor: rgb(251, 249, 250)** — note this page's field sits on the muted surface,
  unlike the white fields on login and register.
- The inner frame and input are the shared `.avalon-field` / 48px input.

### Submit (`css-gt0d7h`)
- display: block; position: relative; width: 100%; height: 50px
- padding: 12px 20px; **marginBottom: 16px**; box-sizing: border-box
- backgroundColor: rgb(9, 175, 142); borderRadius: 2px
- color: rgb(255, 255, 255); font: 500 16px/24px Montserrat; textAlign: center

### Links block (`e3v9ozq0`)
- display: block; width: 100%; textAlign: center
- `a[back-to-login-button]`: inline-block, radius 2px, color rgb(9, 175, 142),
  font 500 12px/20px Montserrat
- `div[auth-link]`: marginTop 7px, 20px tall, 12px/20px, colour rgb(90, 89, 91)

## States & Behaviors

### Field focus / filled
- Same rule as the login form: wrapper border rgb(145, 144, 145) → rgb(35, 36, 37) on
  `:focus-within` or while the field holds a value.
- The email field is autofocused on load.

### Submit hover
- backgroundColor rgb(9, 175, 142) → rgb(0, 170, 137).

### Link hover
- `text-decoration-line: none → underline` on both links.

### Submit behaviour
- Out of scope (no recovery backend). The handler only calls `preventDefault()`.

## Assets
- `PasswordRecoveryIcon` from the shared inline sprite. No bitmap assets.

## Text Content (verbatim, English)
- Heading: `Password recovery`
- Instruction: `To proceed with changing your password, please enter your phone or email.`
- Placeholder: `Email`
- Submit: `Submit`
- Back link: `Back to Log in`
- Auth link: `Don't have an account?` + `Sign Up`

Spanish and Portuguese equivalents live in `src/i18n/avalon.ts`. Note the Portuguese
instruction has no trailing period on the live site; that is reproduced verbatim.

## Responsive Behavior
- **Desktop (1440px):** card 420px, padding-top 48px, `h1` 30px
- **Tablet (768px):** card 420px, padding-top 32px, `h1` 30px
- **Mobile (390px):** card full width (390px), padding-top 32px, `h1` 24px, inner content 326px
- **Breakpoints:** 839 (card padding), 479 (`h1`)
