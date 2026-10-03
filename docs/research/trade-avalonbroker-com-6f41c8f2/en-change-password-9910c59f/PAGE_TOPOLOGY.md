# Page Topology — trade.avalonbroker.com/en/change-password

The simplest of the three pages: the same auto-margined 420px card as login, holding a heading,
an 88px illustration, one line of instruction, a single-field form, and two links. **No social
login and no risk-warning box.**

```
div[inner-layout-content]        flex column, flex:1, padding-top 60px
  div (card)                     max-width 420, margin auto, padding 48px 16px 60px
    div (inner)                  padding 0 16px, 356px content
      div > h1                   "Password recovery"
      svg                        88x88, margin 24px auto
      div                        instruction, 14px/22px, centred, margin 24px 0
      form
        div                      email field, background #FBF9FA, margin-bottom 16px
        button[login-submit-button]  "Submit", margin-bottom 16px
      div
        a[back-to-login-button]  "Back to Log in"
        div[auth-link]           "Don't have an account? Sign Up"
```

## Sections

| # | Section | Component | Interaction model |
| --- | --- | --- | --- |
| 1 | Site header (Sign Up variant) | `shared/SiteHeader` | static + click-driven lang menu |
| 2 | Heading | `ChangePasswordCard` | static |
| 3 | Illustration | `shared/icons` → `PasswordRecoveryIcon` | static |
| 4 | Instruction | `ChangePasswordCard` | static |
| 5 | Form | `ChangePasswordForm` | focus-driven border |
| 6 | Back / auth links | `shared/AuthLinkRow` | hover underline |
| 7 | Footer | `shared/SiteFooter` | static |
| 8 | Cookie notice | `shared/CookieNotice` | click-driven dismiss |

## Page-level behaviour
- Does not scroll at any tested viewport (`scrollHeight === innerHeight` at 1440x900,
  768x1024 and 390x844).
