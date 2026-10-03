# Shared components — trade.avalonbroker.com

These components are identical on all three auth pages, so they live in the site-level shared
namespace (`src/components/sites/trade-avalonbroker-com-6f41c8f2/shared/`) rather than under a
single page key. Their specs were extracted from the login page and re-verified against the
register and change-password pages.

| Spec | Component | Varies by page? |
| --- | --- | --- |
| `SiteHeader.spec.md` | `SiteHeader` | yes — filled "Sign Up" vs outlined "Log In" (+8px right margin) |
| `LanguageMenu.spec.md` | `LanguageMenu` | no |
| `SiteFooter.spec.md` | `SiteFooter` | no |
| `CookieNotice.spec.md` | `CookieNotice` | no |
| `RiskWarning.spec.md` | `RiskWarning` | no (absent from change-password) |
| `SocialLogin.spec.md` | `SocialLogin` | label only ("Log in with" vs "Sign Up with") |

Unspecced thin primitives extracted from the same measurements:

| File | What it is |
| --- | --- |
| `AuthField.tsx` | the 50px wrapper + 48px bordered input used by every form field |
| `AuthSubmitButton.tsx` | the filled teal primary button |
| `AuthLinkRow.tsx` | the "Don't have an account? Sign Up" row |
| `AuthShell.tsx` | the page frame (header + content column + footer + cookie notice) |
| `icons.tsx` | the inline SVG sprite and its icon components |
| `countries.ts` | country / dial-code data and per-locale ordering |
