# CLAUDE.md

Guidance for Claude Code working in this repository.

## Commands

```bash
npm run dev       # localhost:4321
npm run build     # static build to dist/
npm run preview
npm run lint
npm run og        # re-render public/og/og-{lang}.png (Playwright)
npm run icons     # re-render favicons/manifests/browserconfig from icons/*.svg
```

No test runner is configured. **After touching any file, run `npm run lint && npm run build`** — the build is the authoritative correctness check.

## Architecture

Astro 5 static site, no framework runtime, no CSS framework. Vanilla CSS scoped
per component, with the shared palette and type scale as custom properties in
`src/layouts/Layout.astro`.

- `src/layouts/Layout.astro` — html/head, hreflang, canonical, theme bootstrap, GA4 consent defaults, cookie banner
- `src/layouts/PageLayout.astro` — Layout + header + footer + reading column, used by every content page
- `src/pages/index.astro` — sheet I, the cross-section HUD (3D scene not wired yet)
- `src/data/moats.ts` — the 35-row survey matrix, language-neutral
- `src/i18n/` — locales, dictionaries, per-page and per-moat copy
- `src/lib/` — consent, analytics, URL helpers
- `src/components/cookie-consent/` — shadow-DOM consent banner

## Conventions

- **Locales**: `en` default and unprefixed, `ru` under `/ru/`. Write a page once
  in `src/pages/` and read the locale from the `x-locale` header; add a rewrite
  stub under `src/pages/ru/`. Never fork a page per locale.
- **Strings**: no user-visible text in `.astro` markup or in `src/data/`.
  Shared UI copy goes to `src/i18n/translations/{en,ru}.ts`; single-page copy to
  `src/i18n/translations/pages/`; moat sheets to `src/i18n/translations/moats/`.
- **Analytics**: every event carries the locale — use the helpers in
  `src/lib/analytics.ts` rather than calling `gtag` directly.
- **Cookies**: anything stored beyond the consent record itself belongs to a
  category documented on `/cookies/`; add the row there when you add storage.
- **Moat identity**: the number is the id — deep link `/#moat-7`, sheet
  `/moats/7/`, translation key `7`. Do not renumber.
- **Empty copy**: a moat sheet with no prose renders a draft notice and dashes.
  That is intentional — leave the fields empty rather than inventing text.

## Icons

Masters live in `icons/` (`icon.svg`, `icon-maskable.svg`, `icon-mono.svg`);
`npm run icons` regenerates every favicon, app icon, `favicon.ico`,
`safari-pinned-tab.svg`, `browserconfig.xml` and the per-locale manifests into
`public/`. Those outputs are generated — edit the master and re-run, never the
files under `public/`. Manifest copy comes from the locale dictionaries and the
tile/theme colour from the dark palette in `Layout.astro`.

## Open Graph cards

`npm run og` renders `public/og/og-{lang}.png` from `scripts/og/template.mjs`
(palette and fonts mirrored from `Layout.astro`, copy from the locale
dictionaries, specimens from `src/data/moats.ts`). Re-run and commit the PNGs
after changing the card copy — `og.stats`, `atlas.*`, `ui.tagline`, `rocks.*` —
or the matrix. Never hard-code card text in the script.

## Adding a moat sheet's prose

Fill `essence`, `build` and `bypass` for that number in **both**
`src/i18n/translations/moats/en.ts` and `ru.ts`. The draft notice disappears on
its own once any of the three is non-empty.
