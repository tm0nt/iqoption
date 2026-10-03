# LoginForm Specification

## Overview
- **Target file:** `src/components/sites/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/LoginForm.tsx`
- **Screenshot:** `docs/design-references/trade-avalonbroker-com-6f41c8f2/en-login-301e30be/state-input-focus.png`
- **Interaction model:** **focus-driven** border change; the submit is inert in the clone
  (no backend is in scope)

## DOM Structure
```
form
  div[data-test-id=login-email-input]      margin-bottom 18px, background #fff
    div                                    (emotion wrapper, no own box)
      div                                  1px border, radius 4px, overflow hidden
        input[name=identifier]
  div[data-test-id=login-password-input]   same shape
    ...
      input[type=password][name=password]
  button                                   submit
```

## Computed Styles

### Field wrapper (`[data-test-id=login-*-input]`)
- display: block; width: 100%; height: 50px; marginBottom: 18px
- backgroundColor: rgb(255, 255, 255)

### Input border box
- position: relative; width: calc(100% - 2px) (354px measured inside a 356px field)
- height: 48px
- border: 1px solid rgb(145, 144, 145); borderRadius: 4px; overflow: hidden
- transition: all

### `input`
- display: inline-block; width: 100%; height: 48px
- padding: 0 10px; box-sizing: border-box; border: none; background: transparent
- color: rgb(90, 89, 91); font: 400 14px/16.1px Montserrat
- cursor: text; outline: none
- `::placeholder` → color: rgb(117, 117, 117); font: 400 14px Montserrat; opacity: 1
- Attributes on the live site: email → `name="identifier" type="text" autocomplete="new-password"`;
  password → `name="password" type="password" autocomplete="new-password"`
- The email input is autofocused on load.

### Submit button
- display: block; position: relative; width: 100%; height: 50px
- padding: 12px 20px; marginBottom: 20px; box-sizing: border-box
- backgroundColor: rgb(9, 175, 142); border: 1px solid transparent; borderRadius: 2px
- color: rgb(255, 255, 255); font: 500 16px/24px Montserrat; textAlign: center
- transition: border 0.2s, background-color 0.2s, color 0.15s; cursor: pointer

## States & Behaviors

### Input focus / filled
- **Trigger:** `:focus-within` on the border box, **or** the input holding a value
- **State A:** borderColor: rgb(145, 144, 145)
- **State B:** borderColor: rgb(35, 36, 37)
- **Transition:** `all` (the site declares the shorthand; use `border-color 0.2s`)
- Verified: after filling and blurring, the border stays `rgb(35, 36, 37)` — so implement as
  `:focus-within, :not(:placeholder-shown)`.
- The `<input>` itself does not change in any state.

### Submit hover
- **Trigger:** hover
- **State A:** backgroundColor: rgb(9, 175, 142)
- **State B:** backgroundColor: rgb(0, 170, 137)
- **Transition:** border 0.2s, background-color 0.2s, color 0.15s

### Submit behaviour
- Out of scope (no authentication). Prevent the default submit so the clone does not navigate.

## Assets
- None.

## Text Content (verbatim)
- Email placeholder: `Email`
- Password placeholder: `Password`
- Button label: `Log In`

## Responsive Behavior
- The form has no breakpoint of its own — it fills the card inner width
  (356px at ≥420px card, 326px at 390px viewport). All paddings and heights are constant.
