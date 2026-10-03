# SocialLogin Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/SocialLogin.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png`
- **Interaction model:** static + hover

## DOM Structure
```
div[data-test-id=social-login-links]     position relative
  div (divider)                          position relative, text-align center, margin-bottom 16px
    ::before                             1px full-width rule, vertically centred
    div (label)                          inline-block, white background, padding 0 6px
      span                               "or use a social account"
  div (button column)                    flex column, margin-bottom 24px
    button
      div (icon box)                     26×27, flex centre
        svg (google)                     26×27
      div (label)                        "Log in with Google"
```

## Computed Styles

### Divider row
- position: relative; width: 100%; height: 23.1875px; textAlign: center
- marginBottom: 16px  →  **12px at ≤479px**
- **`::before`:** content `""`; position: absolute; display: block; left: 0; right: 0;
  top: 11.5938px (i.e. 50%); height: 1px; transform: translateY(-1px);
  background-color: transparent; **borderBottom: 1px solid rgb(172, 171, 172)** — the rule is a
  bottom border, not a background

### Divider label
- display: inline-block; position: relative; padding: 0 6px
- backgroundColor: rgb(255, 255, 255)  ← this is what punches the hole in the rule
- color: rgb(90, 89, 91); font: 500 12px/20px Montserrat; textAlign: center

### Button column
- display: flex; flexDirection: column; width: 100%; marginBottom: 24px

### Google button
- display: flex; justifyContent: center; alignItems: center; position: relative
- width: 100%; height: 53px; padding: 12px 16px; box-sizing: border-box
- backgroundColor: rgb(251, 249, 250); border: 1px solid rgb(172, 171, 172); borderRadius: 2px
- color: rgb(31, 31, 33); font: 600 16px/16px Montserrat; textAlign: center
- transition: border 0.2s, background-color 0.2s, color 0.15s; cursor: pointer

### Icon box
- display: flex; justifyContent: center; alignItems: center; width: 26px; height: 27px
- box-sizing: border-box

### Button label
- display: block; width: 100%; height: 16px
- color: rgb(31, 31, 33); font: 600 14px/16px Montserrat; textAlign: center
- Note the label is `flex: 1` next to the 26px icon, so the text is centred on the **remaining**
  width, not on the button — which is why it sits slightly right of centre (measured label box
  x=585 in a button spanning 542–898).

## States & Behaviors

### Google button hover
- **Trigger:** hover
- **State A:** backgroundColor: rgb(251, 249, 250)
- **State B:** backgroundColor: rgb(245, 243, 244)
- **Transition:** border 0.2s, background-color 0.2s, color 0.15s

### Click
- Out of scope (no OAuth). Render as a `button type="button"` that does nothing.

## Assets
- `GoogleIcon` from the inline sprite (`#icon_layout_ic_google`, `viewBox="0 0 29 30"`,
  four clipped paths in `#fbbc05`, `#ea4335`, `#34a853`, `#4285f4`), rendered at 26×27.

## Text Content (verbatim)
- `or use a social account`
- `Log in with Google`

## Responsive Behavior
- Width-fluid. The wrapper goes 92.19px → 88.19px at ≤479px because the divider row's
  `margin-bottom` drops from 16px to 12px.
- **Breakpoint:** 479px
