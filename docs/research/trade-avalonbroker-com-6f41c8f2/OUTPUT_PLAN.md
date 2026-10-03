# Output Plan — trade.avalonbroker.com auth pages

`<app-root>` is the repository root (`.`); `<site-key>` is
`trade-avalonbroker-com-6f41c8f2` (first 8 hex of SHA-256 over `https://trade.avalonbroker.com`).

## Targets

| Source URL | `<page-key>` | Route |
| --- | --- | --- |
| `https://trade.avalonbroker.com/en/login` | `en-login-301e30be` | `/[lang]/login` |
| `https://trade.avalonbroker.com/en/register` | `en-register-e66c8527` | `/[lang]/register` |
| `https://trade.avalonbroker.com/en/change-password` | `en-change-password-9910c59f` | `/[lang]/change-password` |
| `https://trade.avalonbroker.com/traderoom` | `traderoom-e34e80f1` | `/[lang]/traderoom` |

Each `<page-key>` is the readable slug of the English source pathname plus the first 8 hex of
SHA-256 over that pathname.

## Routing

The source site serves each page under a locale prefix (`/en/…`, `/es/…`, `/pt/…`) and its own
language menu switches between exactly those three. The clone therefore uses one dynamic
segment, `src/app/[lang]/…`, with `generateStaticParams` over the three locales — so every
source pathname resolves at its exact URL:

| URL | Prerendered |
| --- | --- |
| `/en/login`, `/es/login`, `/pt/login` | ● SSG |
| `/en/register`, `/es/register`, `/pt/register` | ● SSG |
| `/en/change-password`, `/es/change-password`, `/pt/change-password` | ● SSG |
| `/en/traderoom`, `/es/traderoom`, `/pt/traderoom` | ● SSG |
| `/` | ○ static — redirects to `/en/login` |

An unknown `lang` segment renders `notFound()`.

The template scaffold at `src/app/page.tsx` (a placeholder that only said "Clone target not yet
built") was the only pre-existing route and was replaced, as the skill allows for a first clone
into an untouched template. No other route, component namespace, research folder, screenshot
folder or asset namespace existed, so nothing else was overwritten.

## Artifact locations

| Kind | Path |
| --- | --- |
| Research | `docs/research/<site-key>/<page-key>/` |
| Screenshots | `docs/design-references/<site-key>/<page-key>/` |
| Page components | `src/components/sites/<site-key>/<page-key>/` |
| Shared components | `src/components/sites/<site-key>/shared/` |
| Page assets | `public/sites/<site-key>/<page-key>/` |
| Shared assets (239 flags) | `public/sites/<site-key>/shared/flags/` |
| Copy, all locales | `src/i18n/avalon.ts` |
| Types | `src/types/avalon-login.ts` |

## Download scripts

- `scripts/download-assets-trade-avalonbroker-com-6f41c8f2-en-login-301e30be.mjs` — logo + favicon
- `scripts/download-assets-trade-avalonbroker-com-6f41c8f2-shared-flags.mjs` — 239 country flags
  (shared by the register page's two selects), driven by `scripts/data/avalon-flag-urls.json`

## Shared foundation changes

- `src/app/layout.tsx` — Montserrat 400/500/600/700/900 via `next/font/google`, site metadata,
  favicon, viewport.
- `src/app/globals.css` — Avalon tokens registered in `@theme inline` plus a small set of
  page-scoped rules under `.avalon-root` / `.avalon-field` / `.avalon-divider`. The existing
  shadcn tokens were left untouched.

Single origin, single application root — no multi-origin decision was required.

## Traderoom — a different kind of target

`/traderoom` is **not a DOM page**: it is a single `<canvas id="glcanvas">` driven by WebGL
inside a Svelte shell, with 94 elements in the whole document and an empty `document.body.innerText`.
None of the skill's extraction method applies to it, so it was rebuilt from measured
screenshots instead. `docs/research/trade-avalonbroker-com-6f41c8f2/traderoom-e34e80f1/EXTRACTION_METHOD.md`
documents exactly what that means for accuracy, and what is and is not reproduced.

It also sits behind authentication. It was captured through the signed-in Chrome session the
user pointed at it; no credentials were entered and no account setting was changed. Every
figure in the clone is invented — see `mockData.ts`.
