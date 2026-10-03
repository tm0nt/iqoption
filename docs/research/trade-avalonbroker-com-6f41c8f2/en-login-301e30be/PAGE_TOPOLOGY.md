# Page Topology — trade.avalonbroker.com/en/login

The page is a React SPA (emotion CSS-in-JS). After the preloader resolves, the layout is a
single column: fixed navbar → centered auth card → footer pinned to the bottom, plus one
portal-rendered cookie notification.

```
<body>
  svg (hidden icon sprite ×2)
  div#root
    div[data-test-id=inner-layout-wrapper]      flex column, min-height 100%
      header[data-test-id=header-block]         z-index 190, height 0 (the bar is fixed)
        div.Navbar                              position fixed, 60px, #FBF9FA, shadow
          div                                   flex, space-between, padding 10px 24px
            div[header-leftSide-block]          logo (120×30 svg)
            div[lang-menu]                      flag + "en" + dropdown panel (absolute)
            div[header-rightSide-block]         Sign Up button
      div[data-test-id=inner-layout-content]    flex column, flex:1, padding-top 60px
        div (auth card)                         max-width 420, margin auto
          div (card inner)                      padding 0 16px
            div > h1                            "Log In"
            form                                email, password, submit
            div[social-login-links]             divider + Google button
            div                                 Forgot password? / Don't have an account?
            div[auth-warning-block]             RISK WARNING fieldset-style box
      footer[data-test-id=footer-wrapper]       64px, #FBF9FA, 1px top border
  div (portal)
    div[notification-position-container-block]  position fixed, z-index 99998
      div[notification-wrapper-block]           cookie banner
```

## Sections, top to bottom

| # | Section | Component | Fixed/flow | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | Site header | `SiteHeader` | fixed overlay (60px), spacer via content `padding-top` | static shell |
| 1a | Logo | inside `SiteHeader` | flow | static (`data-test-id=header-logo-link-disabled` — not a link) |
| 1b | Language menu | `LanguageMenu` | flow, panel absolutely positioned | **click-driven** toggle, fade+slide panel |
| 1c | Sign Up button | inside `SiteHeader` | flow | static link, hover colour change |
| 2 | Auth card | `LoginCard` | flow, vertically centred by `margin: auto` | static container |
| 2a | Heading | inside `LoginCard` | flow | static |
| 2b | Login form | `LoginForm` | flow | **focus-driven** border change; submit is inert in the clone |
| 2c | Social login | `SocialLogin` | flow | static + hover |
| 2d | Auth links | inside `LoginCard` | flow | hover underline |
| 2e | Risk warning | `RiskWarning` | flow | static |
| 3 | Footer | `SiteFooter` | flow, `flex: 0 0 auto` | static |
| 4 | Cookie notice | `CookieNotice` | fixed overlay, `z-index: 99998` | **click-driven** dismiss |

## Layering

| Layer | z-index |
| --- | --- |
| Cookie notice container | 99998 |
| Cookie notice wrapper | 10 (inside the container) |
| `header` wrapper | 190 |
| Language dropdown panel | 131 |
| Everything else | auto |

## Page-level behaviour

- No scrolling at any tested viewport: the page is exactly viewport height at 1440×900,
  768×1024 and 390×844 (`scrollHeight === innerHeight`). There is no scroll-driven behaviour,
  no scroll-snap, no smooth-scroll library (no `.lenis`/`.locomotive-scroll`), no
  `IntersectionObserver`-driven section switching, and no entrance animations.
- The vertical centring of the card comes from `margin: auto` inside a `flex-direction: column`
  content wrapper, not from `justify-content`.
- No `<video>`, Lottie or canvas anywhere on the page.
