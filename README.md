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
| `/`              | Sheet I — the interactive cross-section of all 35 mechanics  |
| `/moats/`        | The catalogue — all 35 mechanics as a table                  |
| `/moats/{1..35}/`| One sheet per mechanic: passport, essence, build, bypass     |
| `/calculator/`   | Sheet II — the survey: twelve questions, scored              |
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

## The cross-section (sheet I)

`src/scripts/atlas.ts` is the three.js scene behind `/`, ported from the v3
prototype. One shaft per mechanic hangs from the ground plane: colour and
cross-section shape encode the rock, thickness the capital, length the depth.

- **Groupings.** The six axes of the catalogue (`GROUPING_AXES`) re-lay the sheet
  in place: shafts ease to new positions and each row gets a label with its
  count. Bucketing is `bucketOf()` from `src/data/moats.ts` — the same function
  the OG card uses, so the section can never disagree with the matrix.
- **Selection.** Clicking a shaft takes a core: the specimen card fills from the
  matrix, a ring marks the shaft, the camera dives to it and the URL becomes
  `#moat-N`. `Escape`, the card's ✕, or a click on empty ground clears it;
  `hashchange` is honoured, so `/#moat-7` works as a link from anywhere.
- **The sheet.** A double-click on a shaft opens its full sheet in a modal over
  the section — the same modal the card's link opens, fetched from `/moats/N/`.
  The first click of the pair takes the core, so the card fills behind it.
- **Isolation.** Clicking a rock in the legend dims everything else; the depth
  ruler on the left works the same way, and the two are mutually exclusive.
- **The depth ruler** is the key to the vertical axis: level, digging tool,
  years and how many of the 35 lie that deep. Hovering a row lights that
  level's stratum in the scene, clicking isolates it.
- **The guide** behind “how it works” in the top-right corner is the page's own
  documentation: what the drawing encodes, the seven rocks, the four depths, the
  groupings, the filters, the controls and the caveats. `src/scripts/guide.ts`
  only opens and closes it — it is deliberately outside the 3D module so the
  guide survives a machine without WebGL.
- The scene imports the matrix directly and receives every string through
  `window.__ATLAS__`, filled by `index.astro` from the locale dictionary — no
  user-visible text lives in the script. It follows the theme toggle, honours
  `prefers-reduced-motion`, and falls back to the catalogue link if WebGL is
  missing.

## The calculator (sheet II)

`/calculator/` measures the moat you actually have. Twelve questions in four
segments of three — Pull, Ground, Grip, Leverage — each answered on a five-rung
ladder worth 0, 25, 50, 75 or 100.

- **Shape and scoring** live in `src/data/survey.ts`, language-neutral like the
  matrix: the segments, the questions, the weights, `scoreSurvey()`, and the
  hash codec. Every question also names the mechanics it probes; between them
  the twelve cover all 35 rows of the matrix exactly once (`SURVEY_COVERS_MATRIX`
  asserts it).
- **Copy** lives in `src/i18n/translations/pages/calculator.ts`, keyed by
  question id, with the five options in ascending order. Changing a question is
  a copy change; changing what it probes is a `survey.ts` change.
- **The result** is an index 0–100, a depth on the same 1–4 ruler as sheet I (so
  the verdict is the tool a rival would need), the four segment scores, and two
  lists drawn from the matrix: the mechanics behind your deepest answers, and
  the ones behind your shallowest, cheapest and quickest first. Both link
  straight to their sheets.
- **Answers live in the URL hash** (`#s=432102441032`, one digit per question,
  `-` for skipped) and nowhere else. The link is the section: it survives a
  reload, it is shareable, and the survey touches no storage, so it needs no
  consent category.
- `src/scripts/calculator.ts` is the engine; like the 3D scene it takes every
  string through `window.__SURVEY__` and writes none of its own. Keys `1`–`5`
  pick an option, `←` steps back. Without JavaScript the page states as much and
  the start button stays disabled.

## The sheets

Each of the 35 mechanics has a sheet at `/moats/N/`: a passport straight from
the matrix, the essence, three worked examples of how the moat gets built, three
of how it gets bypassed, and a verdict. The prose lives in
`src/i18n/translations/moats/{en,ru}.ts` under the same number as the deep link.

- **Import.** `node scripts/import-catalogue.mjs <catalogue.md> --ts
  src/i18n/translations/moats/ru.ts` parses the source catalogue and writes the
  Russian file: it checks that every moat has three build and three bypass
  examples with leads, strips the document's footnotes, rules and italics, and
  keeps the sheet names already in the file. `--json out.json` dumps the parsed
  structure instead, which is what the English translation is written from.
- **The sample figures** (share of apps, no-rate, median price) that the first
  thirteen mechanics carry live on the matrix as numbers, not prose, and render
  as their own passport block where they exist.
- **For machines.** Every sheet emits schema.org JSON-LD: a `DefinedTerm` with
  the essence as its description and every axis of the matrix — plus the sample
  figures — as `PropertyValue` entries, so the catalogue can be read without
  scraping the tables.
- **In the atlas.** The specimen card's link opens the sheet in a modal over the
  cross-section: the modal fetches `/moats/N/` and clones `#sheet-article` out of
  it, so the page stays the single renderer. A modified click, or a failed
  fetch, falls through to the page itself.

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

- the appendices of the source catalogue (the seven rocks, the four depths, the
  cross-cutting patterns) have no page yet
- `sources`, `contact` and `licence` on `/credits/` are still empty
