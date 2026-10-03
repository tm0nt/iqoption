# PhoneField Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/PhoneField.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/desktop-1440-full.png`
- **Interaction model:** **click-driven** dial-code dropdown beside a plain tel input

## DOM Structure
```
div[register-mandatory-phone-wrapper]   50px, white, margin-bottom 18px
  div                                   flex, 100% x 50
    div (dial select, 120px)
      div[..._select_header]            z-index 5, radius 4px 0 0 4px, white, 1px border
        div                             flag + "+55"
        div (caret)                     absolute right 16
      div (panel)                       absolute, top 50, 418 wide
    div[...whole-wrapper-input]         flex 1, margin-left -1px
      div                               radius 0 4px 4px 0, 1px border, 48px inner
        input[type=tel]                 padding 0 16px, font 500 14px/16.1px
```

## Computed Styles

### Row
- display: flex; width: 100%; height: 50px

### Dial select header
- display: flex; alignItems: center; position: relative; zIndex: 5
- width: 120px (fixed at every breakpoint); height: 50px; padding: 10px 15px; box-sizing: border-box
- backgroundColor: rgb(255, 255, 255); border: 1px solid rgb(145, 144, 145)
- **borderRadius: 4px 0px 0px 4px**
- font: 500 14px/20.3px Montserrat; cursor: pointer
- Flag 20x20, `border-radius: 50%`, `margin-right: 12px`

### Number input wrapper
- marginLeft: -1px (so the shared edge renders as one hairline, not two)
- width: fills the remainder — 299px at 420px column, 237px at 358px
- **borderRadius: 0px 4px 4px 0px**; border: 1px solid rgb(145, 144, 145); height 48px inner

### Number input
- box-sizing: border-box; height: 48px; padding: 0 16px
- color: rgb(90, 89, 91); font: **500** 14px/16.1px Montserrat (note: medium, unlike the
  400-weight text inputs elsewhere on the form)
- type="tel", step="any", autocomplete="new-password"

## States & Behaviors

### Dial dropdown — click-driven
- **Trigger:** click the 120px header; closes on outside click and `Escape`.
- Panel is 418px wide, anchored under the select, and reuses the country dropdown's
  search + 270px-max scrolling list.

### Focus
- Both halves use the `.avalon-field` frame, so each darkens to `rgb(35, 36, 37)` independently
  — the same as the live site, where they are two separate bordered boxes.

### Linked to the country select
- Choosing a country in `CountrySelect` switches the dial code to that country.

## Assets
- The same shared flag SVGs as `CountrySelect`.

## Content
- 241 dial codes, localised and re-ordered per locale (`localizedDialCodes(locale)`).
- **An entry is identified by `iso|dial`, not by ISO alone.** The list has 241 rows but only
  239 distinct ISO codes: the Dominican Republic (`do`) ships three codes — `+1809`, `+1829`
  and `+1849` — under one flag. Keying by ISO collapses them into a single repeated entry and
  loses two real codes, so the per-locale ordering and name overrides are keyed by the pair
  (`dialKey()` in `shared/countries.ts`).
- Picking a country in `CountrySelect` selects that country's **first** dial entry.
- Placeholder: `Phone number` / `Número de teléfono` / `Número de telefone`.
- Default: Brazil `+55`.

## Responsive Behavior
- The 120px select is fixed; the input flexes. No property changes across breakpoints.
