# SiteHeader Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/SiteHeader.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png`
- **Interaction model:** static shell (hosts the click-driven `LanguageMenu`)

## DOM Structure
```
header[data-test-id=header-block]        (height 0; the bar below is fixed)
  div.Navbar                             fixed, 60px, #FBF9FA, shadow
    div                                  flex, space-between, align-center, padding 10px 24px
      div[data-test-id=header-leftSide-block]   flex align-center, padding-right 16px
        div[data-test-id=header-logo-link-disabled]   120×30
          img  (avalon-logo.svg)         120×30
      <LanguageMenu />                   margin-right 12px, margin-left auto
      div[data-test-id=header-rightSide-block]  flex align-center, margin-left 8px
        a (Sign Up)
```
The lang menu is pushed right by a large auto left margin (measured `margin-left: 1074.19px`
at 1440px — reproduce with `margin-left: auto` on the lang menu).

## Computed Styles

### header wrapper
- position: relative; z-index: 190; width: 100%

### div.Navbar
- position: fixed; top: 0; left: 0; width: 100%; height: 60px
- backgroundColor: rgb(251, 249, 250)
- boxShadow: rgba(0, 0, 0, 0.05) 0px 0px 16px 1px
- transition: background-color 0.3s

### Navbar inner row
- display: flex; justifyContent: space-between; alignItems: center
- padding: 10px 24px  →  **10px 16px at ≤479px**
- height: 60px; box-sizing: border-box

### header-leftSide-block
- display: flex; alignItems: center; height: 30px
- paddingRight: 16px  →  **0 at ≤599px**

### logo wrapper + img
- width: 120px; height: 30px; display: block
- marginLeft: 0  →  **24px at ≤1279px**  →  **16px at ≤479px**
- img: `/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/images/avalon-logo.svg`,
  intrinsic 160×40, rendered 120×30, `object-fit: fill`, `alt=""`

### header-rightSide-block
- display: flex; alignItems: center; height: 40px; marginLeft: 8px

### Sign Up button — desktop (≥840px)
- display: block; position: relative; width: auto (90.19px measured); height: 40px
- padding: 8px 16px; box-sizing: border-box
- backgroundColor: rgb(9, 175, 142); border: 1px solid rgb(9, 175, 142); borderRadius: 2px
- color: rgb(255, 255, 255); font: 500 14px/22px Montserrat; textAlign: center
- transition: border 0.2s, background-color 0.2s, color 0.15s; cursor: pointer
- The label is a `<span>`; the login-arrow svg is present but 0×0 (hidden) at this width.

### Sign Up button — ≤839px
- display: flex; justifyContent: center; alignItems: center; width: 40px; height: 40px
- padding: 0; backgroundColor: transparent; border: 1px solid rgb(9, 175, 142)
- borderRadius: 40px
- Label span hidden; `LoginArrowIcon` shown at 21×20, `color: rgb(9, 175, 142)`, `margin-left: -1px`

## States & Behaviors

### Sign Up hover
- **Trigger:** hover
- **State A:** backgroundColor: rgb(9, 175, 142)
- **State B:** backgroundColor: rgb(0, 159, 127)
- **Transition:** border 0.2s, background-color 0.2s, color 0.15s
- (At ≤839px the background is transparent; keep the same transition and let the hover
  background apply to the desktop variant only.)

### Logo
- Inert — `data-test-id=header-logo-link-disabled`. Render as a plain `div`/`img`, not a link.

### Scroll
- N/A — the page does not scroll and the navbar never changes appearance.

## Assets
- `public/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/images/avalon-logo.svg`
- `LoginArrowIcon` from the page icon module (21×20, `viewBox="0 0 21 20"`, `fill: currentColor`)

## Text Content (verbatim)
- `Sign Up`

## Responsive Behavior
- **Desktop (1440px):** logo left, lang menu + pill Sign Up right, padding 24px
- **Tablet (768px):** Sign Up already a 40×40 outlined circle; logo wrapper gains `margin-left: 24px`
- **Mobile (390px):** navbar padding 16px; logo wrapper `margin-left: 16px`; left block loses its right padding
- **Breakpoints:** 1279 (logo margin), 839 (Sign Up → circle), 599 (left padding), 479 (navbar padding, logo margin)
