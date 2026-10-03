# LanguageMenu Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/LanguageMenu.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/state-lang-dropdown-open.png`
- **Interaction model:** **click-driven** toggle with a fade + slide panel

## DOM Structure
```
div[data-test-id=lang-menu]        position relative, margin-right 12px, margin-left auto
  button                           flag span + "en"
    span                           18×18 circle, 1px ring, overflow hidden
      svg (flag)                   18×18
    div                            "en"
  div (panel)                      position absolute, 380×104
    button (close)                 0×0 on desktop
    div
      div                          flex wrap, three 182×44 items
        a ×3                       flag span + label
```

## Computed Styles

### Wrapper
- position: relative; width: 71.625px; height: 46px
- marginRight: 12px  →  **0 at ≤599px**; marginLeft: auto

### Trigger button — desktop (≥600px)
- display: flex; alignItems: center; position: relative
- width: auto (71.625px measured); height: 46px; padding: 10px; box-sizing: border-box
- background: transparent; border: none; borderRadius: 2px
- color: rgb(90, 89, 91); font: 500 14px/22px Montserrat; cursor: pointer
- transition: border 0.2s, background-color 0.2s, color 0.15s
- **No hover change.**

### Trigger button — ≤599px
- display: inline-block; width: 40px; height: 40px; padding: 10px; borderRadius: 50%
- backgroundColor: rgb(245, 243, 244)
- The "en" label is `display: none`.

### Flag badge (span)
- display: block; width: 18px; height: 18px
- border: 1px solid rgb(172, 171, 172); borderRadius: 50%; overflow: hidden
- Contains an 18×18 `<svg>`.

### "en" label
- display: block; marginLeft: 10px; height: 26px
- color: rgb(31, 31, 33); font: 500 16px/26px Montserrat; textAlign: center
- textTransform: capitalize; transition: color 0.15s

### Dropdown panel
- position: absolute; top: 46px; left: -308.375px; marginTop: 18px; zIndex: 131
- width: 380px; height: 104px; padding: 8px; box-sizing: border-box
- backgroundColor: rgb(251, 249, 250); borderRadius: 4px
- boxShadow: rgba(0, 0, 0, 0.05) 0px 0px 16px 1px
- font: 500 14px/24px Montserrat
- transition: opacity 0.15s, transform 0.2s

### Panel item (`a`)
- display: flex; alignItems: center; width: 182px; height: 44px
- padding: 10px 16px; box-sizing: border-box; borderRadius: 2px
- font: 500 14px/24px Montserrat; textAlign: left; cursor: pointer
- **Active (English):** color: rgb(9, 175, 142); the flag svg inherits `currentColor`
- **Idle (Español, Português):** color: rgb(90, 89, 91)
- Flag span sits before the label. For the active item the span is `.css-o0nd7d` (20×20 box,
  18×18 svg); for idle items `.css-1ps7nh9` (18×18). Render both at 18×18 with a 10px gap.
- Items wrap two per row inside the 380px panel (182 + 182 = 364 + 2×8 padding).

## States & Behaviors

### Panel open/close — click-driven
- **Trigger:** click the trigger button
- **State A (closed):** opacity: 0; transform: translateY(5px); pointer-events must be off
- **State B (open):** opacity: 1; transform: translateY(0)
- **Transition:** opacity 0.15s, transform 0.2s
- **Implementation:** React `useState`, class toggle, CSS transition. Close on outside click
  and on `Escape`.

### Hover
- Trigger button: no change. Panel items: no measured change.

## Assets
- `FlagEnIcon`, `FlagEsIcon`, `FlagPtIcon` — from the inline SVG sprite
  (`#icon_langmenu_en` `viewBox="0 0 512 512"`, `#icon_langmenu_es` and `#icon_langmenu_pt`
  `viewBox="0 0 32 32"`). The sprite is rendered once, hidden, and referenced with `<use>`,
  exactly as the original does.

## Text Content (verbatim)
- Trigger: `en`
- Items: `English`, `Español`, `Português`

## Responsive Behavior
- **Desktop (1440px) / Tablet (768px):** flag + "en" label, 71.6×46, transparent background
- **Mobile (390px):** 40×40 circle, `#F5F3F4` background, flag only
- **Breakpoint:** 599px
