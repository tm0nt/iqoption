# CountrySelect Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/CountrySelect.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-register-e66c8527/desktop-1440-full.png`
- **Interaction model:** **click-driven** dropdown with a search box above a scrollable list

## DOM Structure
```
div[e18yf4cy0]                         flex column, relative, 100% x 50
  div[register-country-select-select]  flex, relative
    div[..._header]                    z-index 5, 50px, white, 1px border, radius 4
      div                              flex, align-center, 22px tall
        img                            20x20, border-radius 50%, margin-right 12
        span                           country name
      div (caret)                      absolute, right 16, 10x5 CSS triangle
    div (panel)                        absolute, top 49, 418 wide, 1px top border, white
      div                              radius 4, overflow hidden
        div (search row)               padding 5px 35px 4px 20px, 1px bottom border
          input[..._search]            40px, placeholder "Search by country"
          div (magnifier)              18x18 background-image, absolute right
        div (list)                     max-height 270, overflow-y auto (react-virtualized)
```

## Computed Styles

### Header (closed state)
- display: flex; alignItems: center; position: relative; zIndex: 5
- width: 100%; height: 50px; padding: 10px 15px; box-sizing: border-box
- backgroundColor: rgb(255, 255, 255)
- border: 1px solid rgb(145, 144, 145) (the shared `.avalon-field` frame); borderRadius: 4px
- color: rgb(90, 89, 91); font: 500 14px/20.3px Montserrat; cursor: pointer

### Flag
- width: 20px; height: 20px; marginRight: 12px; borderRadius: 50%

### Country name
- display: block; height: 22px; font: 500 14px/22px Montserrat; color: rgb(90, 89, 91)

### Caret
- position: absolute; right: 16px; vertically centred
- A pure CSS triangle: `border-width: 5px 5px 0`, box 10x5, colour `currentColor`
- Reproduced by `SelectCaret` in the shared icon module.

### Dropdown panel
- position: absolute; top: 49px; width: 418px
- backgroundColor: rgb(255, 255, 255); borderTop: 1px solid; borderRadius: 4px; overflow: hidden

### Search row
- padding: 5px 35px 4px 20px; borderBottom: 1px solid
- input: 40px tall, white, font 400 14px/20px Montserrat

### List
- maxHeight: 270px; overflow: hidden auto
- Rows are 50px; the live site virtualizes them with react-virtualized.

## States & Behaviors

### Open / close — click-driven
- **Trigger:** click the header. Closes on outside click and on `Escape`.
- The panel is mounted only while open (matching the original, whose closed panel is 1px tall).

### Selection
- Picking a country updates the header **and moves the phone dial code to the same country**,
  which is how the live page behaves.

### Focus
- The header uses the same `.avalon-field` frame as the text inputs, so it darkens from
  `rgb(145, 144, 145)` to `rgb(35, 36, 37)` on focus.

## Assets
- `public/sites/trade-avalonbroker-com-6f41c8f2/shared/flags/<iso>.svg` — 239 flags downloaded
  from the site's own CDN by the shared flag downloader.

## Content
- 35 countries (the live select is region-restricted), localised and re-ordered per locale.
  Stored as an English baseline plus per-locale ISO ordering and name overrides in
  `shared/countries.ts`; `localizedCountries(locale)` returns the list the site serves.
- Search placeholder: `Search by country` / `Buscar por país` / `Pesquisa por país`.
- Default selection: **Brazil** (`br`) in every locale.

## Responsive Behavior
- The control is width-fluid: 420px at ≥768px, 358px at 390px. No property changes.
