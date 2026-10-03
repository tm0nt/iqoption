# LoginCard Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/LoginCard.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png`
- **Interaction model:** static container (composes `LoginForm`, `SocialLogin`, `RiskWarning`)

## DOM Structure
```
div (card)                      max-width 420, min-width 320, margin auto
  div (card inner)              padding 0 16px
    div                         margin-bottom 20px
      h1 > span                 "Log In"
    <LoginForm />
    <SocialLogin />
    div (auth links)            text-align center
      a                         "Forgot password?"
      div[data-test-id=auth-link]   "Don't have an account? " + a "Sign Up"
    <RiskWarning />
```

## Computed Styles

### Card
- display: block; position: relative
- maxWidth: 420px; minWidth: 320px; width: 100%
- margin: auto (measured `55.3125px 510px` at 1440×900 — it is auto-centred both axes)
- padding: 48px 16px 60px  →  **32px 16px 60px at ≤839px**
- box-sizing: border-box

### Card inner
- display: block; width: 100%; maxWidth: 420px; padding: 0 16px

### Heading wrapper
- display: block; width: 100%; height: 40px; marginBottom: 20px

### h1
- display: block; width: 100%
- font: 600 30px/40px Montserrat; letterSpacing: -1px; textAlign: center
- color: rgb(90, 89, 91)
- **≤479px:** font-size 24px, line-height 32px (wrapper height follows to 32px)

### Auth links block
- display: block; width: 100%; height: 50.1875px; textAlign: center

### "Forgot password?" link
- display: inline-block; position: relative; borderRadius: 2px
- color: rgb(9, 175, 142); font: 500 12px/20px Montserrat; textAlign: center; cursor: pointer
- transition: border 0.2s, background-color 0.2s, color 0.15s

### "Don't have an account?" row
- display: block; width: 100%; height: 20px; marginTop: 7px
- color: rgb(90, 89, 91); font: 500 12px/20px Montserrat; textAlign: center
- The trailing `Sign Up` is an inline `a`, color rgb(9, 175, 142), same font.

## States & Behaviors

### Link hover
- **Trigger:** hover on "Forgot password?" or the inline "Sign Up"
- **State A:** textDecorationLine: none
- **State B:** textDecorationLine: underline
- **Transition:** border 0.2s, background-color 0.2s, color 0.15s

## Assets
- None of its own.

## Text Content (verbatim)
- `Log In`
- `Forgot password?`
- `Don't have an account?` (note the straight apostrophe) followed by a space and `Sign Up`

## Responsive Behavior
- **Desktop (1440px):** card 420px wide, padding-top 48px, h1 30px
- **Tablet (768px):** card 420px wide, padding-top 32px, h1 30px
- **Mobile (390px):** card fills the viewport (390px, under the 420px cap), padding-top 32px, h1 24px
- **Breakpoints:** 839 (padding-top), 479 (h1 size)
