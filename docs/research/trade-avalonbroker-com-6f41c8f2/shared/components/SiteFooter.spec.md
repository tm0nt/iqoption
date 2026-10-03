# SiteFooter Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/SiteFooter.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png`
- **Interaction model:** static

## DOM Structure
```
footer[data-test-id=footer-wrapper]   64px, #FBF9FA, 1px top border, flex: 0 0 auto
  div (container)                     max-width 1120, margin inline auto, padding 0 65px
    div                               flex, centre, min-height 64px, padding 12px 0
      div[data-test-id=footer-copyright]   "Avalon"
```

## Computed Styles

### footer
- display: block; width: 100%; height: 64px; flex: 0 0 auto
- backgroundColor: rgb(251, 249, 250)
- borderTop: 1px solid rgb(172, 171, 172) (other sides none)

### Container
- display: block; width: 100%; maxWidth: 1120px; margin-inline: auto; box-sizing: border-box
- padding-inline: 65px
  → **96px at ≤1279px** → **36px at ≤959px** → **48px at ≤839px** → **24px at ≤599px** → **16px at ≤479px**
- (The max-width also shrinks with the viewport in the original — it is effectively
  `min(1120px, 100%)`; reproduce with `max-width: 1120px; width: 100%`.)

### Row
- display: flex; justifyContent: center; alignItems: center
- width: 100%; minHeight: 64px; padding: 12px 0; box-sizing: border-box

### Copyright
- display: block; color: rgb(90, 89, 91); font: 500 14px/20.3px Montserrat; textAlign: center

## States & Behaviors
- N/A — static, no links, no hover.

## Assets
- None.

## Text Content (verbatim)
- `Avalon`

## Responsive Behavior
- Only the container's horizontal padding changes. Height is 64px + 1px border at every width.
- **Breakpoints:** 1279, 959, 839, 599, 479
