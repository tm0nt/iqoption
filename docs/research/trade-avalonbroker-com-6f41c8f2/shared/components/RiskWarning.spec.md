# RiskWarning Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/RiskWarning.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png`
- **Interaction model:** static

## DOM Structure
A fieldset-style box: a bordered container whose legend is an absolutely positioned,
white-backgrounded label that straddles the top border.
```
div[data-test-id=auth-warning-block]   flex column, align-center, 1px border, radius 4px
  div (legend row)                     position absolute, full width, translateY(-50%)
    div (legend chip)                  inline-block, white background, padding 0 8px
      span                             "Risk Warning:"
  span                                 body copy
```

## Computed Styles

### Container
- display: flex; flexDirection: column; alignItems: center; position: relative
- width: 100%; margin: 32px 0 22px; padding: 16px; box-sizing: border-box
- border: 1px solid rgb(172, 171, 172); borderRadius: 4px
- color: rgb(90, 89, 91); font: 500 12px/18px Montserrat
- (Measured content box 322×36 inside a 356px column — i.e. 356 − 2×16 padding − 2×1 border.)

### Legend row
- display: block; position: absolute; top: 0; width: calc(100% - 2px)
- transform: translateY(-50%) (measured `matrix(1, 0, 0, 1, 0, -9.5)` against a 19px row)
- textAlign: center

### Legend chip
- display: inline-block; padding: 0 8px
- backgroundColor: rgb(255, 255, 255)
- color: rgb(90, 89, 91); font: 700 14px/18px Montserrat; textAlign: center
- textTransform: uppercase

### Body copy
- color: rgb(90, 89, 91); font: 500 12px/18px Montserrat
- Wraps to two lines at the card width (measured 322×36).

## States & Behaviors
- N/A — fully static, no hover, no focus, no transition that fires.

## Assets
- None.

## Text Content (verbatim)
- Legend (source casing, rendered uppercase by CSS): `Risk Warning:`
- Body: `All trading involves risk. Only risk capital you're prepared to lose.`

## Responsive Behavior
- Width-fluid, no property changes at any breakpoint (verified at 1440 / 768 / 390).
