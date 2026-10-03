# RegisterCard / RegisterForm Specification

## Overview
- **Target files:**
  `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/RegisterCard.tsx`
  `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/RegisterForm.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/desktop-1440-full.png`
- **Interaction model:** static container; the form is focus-driven, with two click-driven selects

## Computed Styles

### Band (`e5g442x0`)
- display: block; width: 100%; minWidth: 320px
- padding: 48px 0 60px  →  **32px 0 60px at ≤839px**

### Container (`RegisterFormContainer`)
- display: block; width: 420px **content** + `padding: 0 16px` = a **452px border box**
- maxWidth: 420px (content); margin-inline: auto
- At 390px the box is the full 390px and the content 358px.

### Heading
- Same as login: `h1` 600 30px/40px, `letter-spacing: -1px`, centred; 24px/32px at ≤479px.
- Wrapper `margin-bottom: 20px`.

### Field wrappers (`esmjjsw0`)
- display: block; width: 100%; height: 50px; marginBottom: 18px
- backgroundColor: rgb(255, 255, 255)
- The country wrapper is 78px tall because it also holds the residence hint.

### Residence hint (`esmjjsw3`)
- display: block; width: 100%; marginTop: 8px
- color: rgb(90, 89, 91); font: 500 12px/20px Montserrat

### Submit (`css-w4zspq`)
- display: block; position: relative; width: 100%; height: 50px; minHeight: 50px
- **padding: 8px 20px** (login uses 12px 20px); marginBottom: 20px; box-sizing: border-box
- backgroundColor: rgb(9, 175, 142); borderRadius: 2px
- color: rgb(255, 255, 255); font: 500 16px/**22px** Montserrat; textAlign: center
- transition: border 0.2s, background-color 0.2s, color 0.15s

### Auth link (`eorem1v0`)
- display: block; width: 100%; height: 20px (no top margin, unlike the login page's 7px)
- color: rgb(90, 89, 91); font: 500 12px/20px Montserrat; textAlign: center
- Shape: `<lead> <Log In link> <tail>` — the English tail is the word "now".

### Risk warning
- Identical to the login page apart from its width (386px content inside the 420px column).

## States & Behaviors

### Submit hover
- backgroundColor: rgb(9, 175, 142) → rgb(0, 170, 137); transition as above.

### Submit behaviour
- Out of scope (no account creation). The handler only calls `preventDefault()`.

### Country → dial linkage
- See `CountrySelect.spec.md`.

## Text Content (verbatim, English)
- Heading: `Sign Up`
- Placeholders: `First Name`, `Last Name`, `Email`, `Password`, `Phone number`
- Hint: `Please make sure this is your country of permanent residence`
- Submit: `Open an Account for Free`
- Google: `Sign Up with Google`
- Auth link: `Already have an account?` + `Log In` + `now`

Spanish and Portuguese equivalents live in `src/i18n/avalon.ts`, read from the live
`/es/register` and `/pt/register` pages.

## Responsive Behavior
- **Desktop (1440px):** band padding-top 48px, column 420px
- **Tablet (768px):** band padding-top 32px, column 420px
- **Mobile (390px):** band padding-top 32px, column 358px, `h1` 24px
- **Breakpoints:** 839 (band padding), 479 (`h1`)
