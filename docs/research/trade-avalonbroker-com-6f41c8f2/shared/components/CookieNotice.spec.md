# CookieNotice Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/CookieNotice.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/desktop-1440-full.png` (bottom-left) and `mobile-390-full.png` (full-width)
- **Interaction model:** **click-driven** dismiss

## DOM Structure
Rendered through a portal as the last child of `<body>`, outside `#root`.
```
div[data-test-id=notification-position-container-block]   position fixed, z-index 99998
  div[data-test-id=notification-wrapper-block]            #FBF9FA, radius 3px, shadow, opacity .98
    div                                                   (height-animation wrapper)
      div[data-test-id=notification-inner-block]          3px accent edge, padding 20px 40px 20px 18px
        div[data-test-id=notification-message-block]      body copy
        div[data-test-id=notification-action-block]       margin-top 8px
          div[data-test-id=notification-action-label]     "Got it"
```

## Computed Styles

### Position container — ≥600px
- position: fixed; left: 24px; bottom: 24px; zIndex: 99998
- width: 376px; height: auto (148px measured)
- transform: translate(0, 0)

### Position container — ≤599px
- left: 0; bottom: 0; width: 100%; maxWidth: 100%

### Wrapper
- position: relative; zIndex: 10; width: 100%
- backgroundColor: rgb(251, 249, 250); borderRadius: 3px
- boxShadow: rgba(0, 0, 0, 0.05) 0px 0px 16px 1px
- opacity: 0.98; overflow: hidden; cursor: default
- transition: top 0.4s ease-in-out, margin-top 0.4s ease-in-out, margin-bottom 0.4s ease-in-out, opacity 0.4s

### Inner block
- display: block; padding: 20px 40px 20px 18px; box-sizing: border-box
- borderStyle: solid; borderColor: rgb(0, 99, 179)
- borderWidth: **`0 0 0 3px` at ≥600px** → **`3px 0 0` at ≤599px**

### Message
- display: block; width: 100%
- color: rgb(90, 89, 91); font: 500 12px/20px Montserrat
- (315×80 at 376px wide — four lines on desktop.)

### Action row
- display: block; width: 100%; marginTop: 8px

### "Got it"
- display: inline-block; verticalAlign: top
- color: rgb(9, 175, 142); font: 500 12px/20px Montserrat; cursor: pointer

## States & Behaviors

### Dismiss
- **Trigger:** click "Got it"
- Removes the banner from the DOM. Keep the 0.4s opacity transition on the wrapper.
- **Implementation:** React `useState` in the page; render `null` once dismissed.
  Per the clone's scope this is local UI state only — it stores nothing.

### Hover
- No measured change on any part of the banner.

## Assets
- None.

## Text Content (verbatim)
- `We use cookies to understand how you use our site and to improve your experience. By clicking “Got it” or by continuing to use our website, you agree to their use.`
  (curly quotes around Got it, exactly as above)
- `Got it`

## Responsive Behavior
- **Desktop (1440px) / Tablet (768px):** 376px card, 24px from the left and bottom, 3px accent on the left edge
- **Mobile (390px):** full width, flush to the bottom, 3px accent on the top edge
- **Breakpoint:** 599px
