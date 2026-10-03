# Page Topology — trade.avalonbroker.com/en/register

Same shell as the login page, but the content area is a **full-width band** rather than an
auto-margined card, and the form column is wider (420px of content versus 356px).

```
div[inner-layout-content]              flex column, flex:1, padding-top 60px
  div (band)                           width 100%, min-width 320, padding 48px 0 60px
    div.RegisterFormContainer          width 420 + 2x16 padding = 452 box, margin inline auto
      div > h1                         "Sign Up"
      form[data-test-id=register-form]
        div[register-form-name-input]        First Name
        div[register-last-name-input]        Last Name
        div[register-form-country-wrapper]   country select + residence hint
        div[register-email-input]            Email
        div[register-password2-input]        Password
        div[register-mandatory-phone-wrapper] dial select (120px) + tel input
        div > div[register-terms-warning]    terms sentence with 3 external links
        button[register-submit-button]       "Open an Account for Free"
      div[social-login-links]          divider + "Sign Up with Google"
      div[auth-link]                   "Already have an account? Log In now"
      div[auth-warning-block]          RISK WARNING
```

## Differences from the login page

| Thing | Login | Register |
| --- | --- | --- |
| Content wrapper | auto-margined 420px card | full-width band, `padding: 48px 0 60px` |
| Form column | 356px content | 420px content (452px box) |
| Header right button | filled teal "Sign Up" | **outlined** teal "Log In", `margin-right: 8px` |
| Submit padding | `12px 20px` | `8px 20px`, `min-height: 50px`, `line-height: 22px` |
| Google label | "Log in with Google" | "Sign Up with Google" |
| Page scrolls? | no | **yes** — 1134px at 1440x900 |

## Sections

| # | Section | Component | Interaction model |
| --- | --- | --- | --- |
| 1 | Site header (Log In variant) | `shared/SiteHeader` | static + click-driven lang menu |
| 2 | Heading | `RegisterCard` | static |
| 3 | Name fields | `shared/AuthField` | focus-driven border |
| 4 | Country select | `CountrySelect` | **click-driven** dropdown with search + virtualized list |
| 5 | Email / password | `shared/AuthField` | focus-driven border |
| 6 | Phone row | `PhoneField` | **click-driven** dial dropdown + tel input |
| 7 | Terms notice | `TermsNotice` | static, three external links |
| 8 | Submit | `shared/AuthSubmitButton` | hover |
| 9 | Social login | `shared/SocialLogin` | hover |
| 10 | Auth link | `shared/AuthLinkRow` | hover underline |
| 11 | Risk warning | `shared/RiskWarning` | static |
| 12 | Footer | `shared/SiteFooter` | static |
| 13 | Cookie notice | `shared/CookieNotice` | click-driven dismiss |

## Responsive

| Width | Band padding-top | Container box | Form column |
| --- | --- | --- | --- |
| 1440 | 48px | 452px | 420px |
| 768 | 32px | 452px | 420px |
| 390 | 32px | 390px (full width) | 358px |

The dial select stays 120px at every width; the tel input absorbs the remainder
(299px at ≥768, 237px at 390).
