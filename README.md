# moat-atlas

Interactive 3D atlas of 35 competitive moats — the geology of defensibility: rock types, depths, tools, and a survey to dig your own.

## Commands

```bash
npm install
npm run dev       # dev server at localhost:4321
npm run build     # static build to dist/
npm run preview   # preview the production build
npm run lint      # ESLint 9 (flat config)
npm run og        # re-render the Open Graph cards into public/og/
npm run icons     # re-render favicons, app icons, manifests, browserconfig
```

Run `npm run lint && npm run build` before finishing any change — the build is the authoritative correctness check.

## Routes

| Route            | What it is                                                  |
|------------------|-------------------------------------------------------------|
| `/`              | Sheet I — the cross-section (HUD skeleton; 3D scene pending) |
| `/moats/`        | The catalogue — all 35 mechanics as a table                  |
| `/moats/{1..35}/`| One sheet per mechanic: passport, essence, build, bypass     |
| `/calculator/`   | Sheet II — the survey (skeleton; scoring pending)            |
| `/credits/`      | Who made this — colophon                                     |
| `/cookies/`      | Cookie policy + preference toggles                           |
| `/404`           | Not found                                                    |

Every route also exists at `/ru/…`.

## Localization

`en` is the default locale and is served unprefixed; `ru` lives under `/ru/`.

- `src/i18n/config.ts` — locale list and labels
- `src/i18n/index.ts` — `getTranslations`, `getLocalizedPath`, `getLocaleFromUrl`
- `src/i18n/translations/{en,ru}.ts` — the shared dictionary
- `src/i18n/translations/pages/*.ts` — copy for a single page (cookies, credits)
- `src/i18n/translations/moats/{en,ru}.ts` — the 35 sheets, keyed by moat number

A page is written once, in `src/pages/`, and reads its locale from the `x-locale`
request header. The `/ru/` routes are thin rewrites that set that header:

```astro
---
const url = new URL('/moats/', Astro.url);
const headers = new Headers({ 'x-locale': 'ru' });
return Astro.rewrite(new Request(url, { headers }));
---
```

Astro warns that `Astro.request.headers` is unavailable on prerendered pages; the
header still arrives through the rewritten `Request`, and the built HTML is
verified per locale (`<html lang>`, canonical, hreflang).

Adding a locale: extend `locales` in `src/i18n/config.ts` and `astro.config.mjs`,
add `src/i18n/translations/{locale}.ts` plus the moat sheets, and mirror the
rewrite files under `src/pages/{locale}/`.

## Data

`src/data/moats.ts` holds the survey matrix — 35 mechanics scored on six axes
(rock, depth, capital, solo, AI, rent) with no human-readable strings in it.
Names and prose live in the translations, keyed by the same number that is used
for the deep link (`/#moat-7`) and the sheet route (`/moats/7/`).

## Cookies and analytics

- GA4 loads only when `PUBLIC_GA_ID` is set, in Consent Mode v2 with everything
  denied by default — cookieless until the visitor opts in.
- `<cookie-consent-banner>` (`src/components/cookie-consent/`) is a shadow-DOM
  web component; the choice is stored in `moat-atlas-consent`.
- `/cookies/` documents the categories and re-exposes the same toggles.
- `PUBLIC_GEO_ENDPOINT` is optional: it should return `{ ip: { isEu: boolean } }`
  and lets non-EU visitors skip the banner. Without it — and whenever the lookup
  fails — the banner is shown to everyone.
- Every analytics event carries the current locale (`src/lib/analytics.ts`).

## Icons

Everything a browser can ask for is generated from three masters in `icons/` —
`icon.svg`, `icon-maskable.svg` (Android safe zone) and `icon-mono.svg` (Safari
pinned tab):

```bash
npm run icons
```

`scripts/generate-icons.mjs` renders it with the same Playwright Chromium the OG
cards use — no Inkscape or ImageMagick — and writes into `public/`:
`favicon.ico` (16/32/48/256, assembled by the script), `favicon.svg`,
`favicon-*.png`, `android-chrome-36…512`, `maskable-192/512`,
`apple-touch-icon.png`, `safari-pinned-tab.svg`,
`assets/images/favicon-128…1024`, `assets/images/mstile/*`, `browserconfig.xml`
and one manifest per locale (`site.webmanifest`, `site.ru.webmanifest` — names
and descriptions come from the dictionaries, so the RU install prompt is in
Russian). `Layout.astro` links all of it. Edit a master, re-run, commit the
output; see `icons/README.md` for the full table.

## Open Graph cards

`/og/og-{lang}.png` — the image every page points at, one per locale, 1200×630.
They are generated, not hand-drawn:

```bash
npm run og                # both locales into public/og/
npm run og -- ru          # one locale
npm run og -- --html      # also dump the rendered HTML next to the PNG
npm run og -- --out /tmp  # render somewhere else
```

`scripts/og/template.mjs` builds a self-contained HTML card — the dark-theme
palette and system font stacks from `src/layouts/Layout.astro`, the copy from
the locale dictionary (`og.stats`, `atlas.*`, `ui.tagline`, `rocks.*`) and the
specimens from `src/data/moats.ts`: one chip per mechanic, laid into its depth
band, coloured by rock, width by the capital it takes.
`scripts/generate-og-images.mjs` screenshots it with Playwright.

Re-run it after changing that copy, the matrix, or the card design, and commit
the PNGs — the build only copies `public/` across. It needs Node ≥ 22.18 (the
script imports the `.ts` sources through native type stripping) and the
Playwright Chromium build (`npx playwright install chromium`). Fonts are
resolved locally, so the card looks the way it does on macOS; regenerate on the
same machine family to keep the two locales consistent.

## Environment

| Variable              | Effect                                          |
|-----------------------|-------------------------------------------------|
| `PUBLIC_SITE_URL`     | Absolute base for canonical/hreflang/OG URLs     |
| `PUBLIC_GA_ID`        | Enables GA4                                     |
| `PUBLIC_GEO_ENDPOINT` | EU detection for the consent banner (optional)  |

## Still to build

- the three.js cross-section on `/` (shafts, strata, six groupings, core cards)
- the survey engine and scoring behind `/calculator/`
- sheet prose for all 35 mechanics (`essence`, `build`, `bypass` are empty)
