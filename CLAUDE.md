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
npm run audit     # audit /llms.txt, the .md twins and the sitemap of a running build
npm run skill     # install the /moats skill into ~/.claude/skills
npm run skill:check  # diff the skill's transcription against the matrix and survey
```

No test runner is configured. **After touching any file, run `npm run lint && npm run build`** — the build is the authoritative correctness check.

## Docker and CI

`Dockerfile` builds the site with Node and serves `dist/` from `nginx:alpine` as
the unprivileged `nginx` user on port 8080; the nginx config lives in `docker/`.
The `PUBLIC_` variables are build arguments — Astro inlines them, so an image is
tied to one host. Every location in the server block has to
`include /etc/nginx/snippets/headers.conf`: `add_header` does not inherit into a
location that declares one of its own.

`.github/workflows/ci.yml` lints, builds and smoke-tests the image on every push
and pull request. `.github/workflows/release.yml` fires on a `v*.*.*` tag:
same checks, then a multi-arch push to `ghcr.io/giglabocom/moat-atlas` and a
GitHub release. Releases are cut by tag, never by a push to `main`.

Both workflows scan for leaked credentials with the gitleaks CLI (the action
needs a licence for an organisation's repositories) before anything else runs.
The same scanner guards the working copy: `.githooks/pre-commit` scans the
staged diff, `npm run hooks` points `core.hooksPath` at `.githooks/`, and
`.gitleaks.toml` holds the rules — the gitleaks defaults plus an allowlist for
generated artefacts. A missing gitleaks binary makes the hook warn and pass, so
CI is the backstop; keep the version in the two workflows in step.

## Architecture

Astro 5 static site, no framework runtime, no CSS framework. Vanilla CSS scoped
per component, with the shared palette and type scale as custom properties in
`src/layouts/Layout.astro`.

- `src/layouts/Layout.astro` — html/head, hreflang, canonical, theme bootstrap, GA4 consent defaults, cookie banner
- `src/layouts/PageLayout.astro` — Layout + header + footer + reading column, used by every content page
- `src/pages/index.astro` — sheet I, the cross-section HUD
- `src/pages/calculator.astro` — sheet II, the survey
- `src/scripts/atlas.ts` — the three.js scene: shafts, six groupings, core
  selection, rock isolation, `#moat-N` deep links
- `src/scripts/section-state.ts` — sheet I's shared control state (view,
  grouping axis, the two isolation filters); binds the HUD buttons once for
  both views and mirrors the view into `?view=list`
- `src/scripts/atlas-list.ts` — sheet I's text mode: re-groups and filters
  the list `index.astro` server-renders
- `src/scripts/guide.ts` — the "how it works" dialog on sheet I, outside the
  3D module so it opens without WebGL
- `src/data/moats.ts` — the 35-row survey matrix, language-neutral
- `src/data/survey.ts` — sheet II: 12 questions, four segments, the scoring
- `src/scripts/calculator.ts` — the survey engine behind `/calculator/`
- `src/i18n/` — locales, dictionaries, per-page and per-moat copy
- `src/lib/` — consent, analytics, URL helpers
- `src/lib/seo/` — the machine-readable layer: the page index, JSON-LD,
  `/llms.txt` and the `.md` page twins
- `src/components/cookie-consent/` — shadow-DOM consent banner

## Conventions

- **Locales**: `en` default and unprefixed, `ru` under `/ru/`. Write a page once
  in `src/pages/` and read the locale from the `x-locale` header; add a rewrite
  stub under `src/pages/ru/`. Never fork a page per locale.
- **Strings**: no user-visible text in `.astro` markup or in `src/data/`.
  Shared UI copy goes to `src/i18n/translations/{en,ru}.ts`; single-page copy to
  `src/i18n/translations/pages/`; moat sheets to `src/i18n/translations/moats/`.
- **Analytics**: every event carries the locale — use the helpers in
  `src/lib/analytics.ts` rather than calling `gtag` directly. GA4's own page
  view is off; `Analytics.astro` sends it through `trackPageView()` so the hit
  carries the locale too.
- **Cookies**: anything stored beyond the consent record itself belongs to a
  category documented on `/cookies/`; add the row there when you add storage.
- **Region**: the banner asks `/api-shared/ip` on its own origin — the same path
  the sibling sites call, served by the shared service behind the ingress, and
  not by this image; `PUBLIC_GEO_ENDPOINT` overrides it. The answer is
  `{ status, ip: { isEu } }`; the endpoint reads the address from its own proxy
  headers, so a static site never sees an IP and only that boolean arrives.
  Anything that is not an explicit boolean — FAIL, a 404, a timeout — means
  "show the banner", never "auto-grant", and is not cached, so a route that
  comes back is retried on the next page. `PUBLIC_GEO_SIMULATE=eu|non-eu` walks
  both branches in `npm run dev`.
- **Moat identity**: the number is the id — deep link `/#moat-7`, sheet
  `/moats/7/`, translation key `7`. Do not renumber.
- **Empty copy**: a moat sheet with no prose renders a draft notice and dashes.
  That is intentional — leave the fields empty rather than inventing text.

## The machine-readable layer

Everything an agent reads rather than a person: JSON-LD, `/llms.txt`, a plain
Markdown twin of every page, `/sitemap.xml` and `/robots.txt`. It all hangs off
one walker, `src/lib/seo/pages.ts` — **never enumerate pages anywhere else.** A
page hand-listed in llms.txt is a future dead link; a twin generated for a path
the sitemap hides is a URL nobody meant to publish. Both disappear when every
consumer walks the same index, and `scripts/audit-agents.sh` proves it did.

| File | Role |
|---|---|
| `src/lib/seo/pages.ts` | The page index: path, locale, title, description, kind, per locale. Titles come from the same dictionary keys the pages render. |
| `src/lib/seo/ld.ts` | One JSON-LD `@graph` per page — site, org, author, the page, breadcrumbs, and the page's own entity. |
| `src/lib/seo/llms.config.ts` | **All curated llms.txt prose.** Almost every edit lands here. |
| `src/lib/seo/llms.ts` | Pure renderer: config + index → text. |
| `src/lib/seo/md-twin.ts` | The twin document — front matter, provenance, `## Related`. Carries the decisions table for the URL form and the headers. |
| `src/lib/seo/md-bodies.ts` | The twin bodies, synthesized per page kind from `src/data/` and the dictionaries. |
| `src/pages/[...slug].md.ts` | Every twin, both URL forms, both locales. |
| `src/pages/{llms.txt,sitemap.xml,robots.txt}.ts` | The three endpoints. |
| `src/components/JsonLd.astro` | Emits the graph; `Layout.astro` renders it for every real page. |
| `scripts/audit-agents.sh` | The audit, also run in CI against the container. |

Rules:

- **A twin exists for exactly the pages `/llms.txt` lists.** Both walk
  `pages.ts`, so adding a page to the index adds all of it at once — sitemap
  entry, twin in both URL forms, JSON-LD, head links.
- **Twins are never listed in `sitemap.xml`.** Each twin sends
  `Link: rel="canonical"` at its HTML page; listing it would have the two assert
  opposite things. Discovery is `/llms.txt` plus the `<head>` link.
- **No `noindex` anywhere in this layer** — an agent that honours it refuses to
  use the file it just fetched.
- **No invented strings.** A twin heading is a dictionary key or it does not
  exist; the guidance lines (provenance, `Related`, llms.txt prose) are English
  in both locales because they address the model, not the reader.
- **Never hand-write a `.md` file into `public/`.** A snapshot goes stale and
  nobody notices.
- The nginx side lives in `docker/`: the `text/markdown` type, `inline`
  disposition, the `Link` canonical built by the `$md_canonical` map, CORS, and
  the `^(.*)/\.md$ → $1/index.md` rewrite that serves the `/.md` form Astro
  cannot emit. A `.md` 404 answers `text/plain`, never the HTML error page.
- After changing anything here: `npm run build`, then `docker build` and
  `npm run audit -- http://localhost:PORT`. The audit checks coverage both
  ways, both URL forms, head links, sitemap agreement and the 404 shape.

## Icons

Masters live in `icons/` (`icon.svg`, `icon-maskable.svg`, `icon-mono.svg`);
`npm run icons` regenerates every favicon, app icon, `favicon.ico`,
`safari-pinned-tab.svg`, `browserconfig.xml` and the per-locale manifests into
`public/`. Those outputs are generated — edit the master and re-run, never the
files under `public/`. Manifest copy comes from the locale dictionaries and the
tile/theme colour from the dark palette in `Layout.astro`.

## Brand glyphs

`src/assets/brands/*.svg` are Font Awesome Pro brand marks under the commercial
licence (`FONTAWESOME-LICENSE.txt` sits beside them) — copied files, never the
webfont or the CDN. `src/components/BrandIcon.astro` inlines one by file name
and sizes it; the masters already paint with `currentColor`, so a glyph takes
the colour of whatever it sits in. Every brand icon on the site goes through
that component — add the `.svg` to the folder rather than pasting a path.

Outbound addresses live in `src/lib/links.ts`: the repository, the sibling
GigLabo projects, and `CONTACTS`, which is per-locale because the author writes
in a different place in each language. Network names and handles are proper
nouns and stay in that file; the prose around them is in the dictionaries.

## Open Graph cards

`npm run og` renders `public/og/og-{lang}.png` from `scripts/og/template.mjs`
(palette and fonts mirrored from `Layout.astro`, copy from the locale
dictionaries, specimens from `src/data/moats.ts`). Re-run and commit the PNGs
after changing the card copy — `og.stats`, `atlas.*`, `ui.tagline`, `rocks.*` —
or the matrix. Never hard-code card text in the script.

## The cross-section

`src/scripts/atlas.ts` imports the matrix from `src/data/moats.ts` directly and
takes every string through `window.__ATLAS__`, which `index.astro` fills from
the dictionary — add a string to the payload rather than writing text in the
script. Grouping buckets come from `AXIS_BUCKETS` + `bucketOf()`; their row
labels are `t.values.<axis>` (and `t.rocks` for the rock axis).

Sheet I has two projections of the same page: the scene and a text list.
`?view=list` (set on `<html>` as `view-list` by an inline script before first
paint) shows the list `index.astro` server-renders grouped by rock — entry
anchors make `/?view=list#moat-7` a real address. The HUD controls are bound
once in `section-state.ts`; the scene and `atlas-list.ts` both subscribe, so
the grouping and the isolation filters are one state across the two views. The
renderer boots lazily — a page opened straight into the list never starts
three.js — and a WebGL failure switches to the list instead of a dead canvas.
List-group chrome is rebuilt by the script without Astro's scope attribute, so
its CSS in `index.astro` goes through `:global()` (the calculator's rule); the
entries themselves are server-rendered and only re-parented.

## The calculator

`src/data/survey.ts` holds the shape of sheet II — four segments of three
questions, weights `0/25/50/75/100`, `scoreSurvey()` and the hash codec — and no
strings. The words live in `src/i18n/translations/pages/calculator.ts`, keyed by
question id, options in ascending order; `src/scripts/calculator.ts` takes them
through `window.__SURVEY__` the way the cross-section takes `window.__ATLAS__`.

- Each question lists the mechanics it probes, and together the twelve cover all
  35 rows exactly once — keep it that way when editing, `SURVEY_COVERS_MATRIX`
  is the check.
- Answers live in the URL hash and nowhere else. Do not add storage here: the
  page deliberately needs no consent category and no row on `/cookies/`.
- Elements the engine builds (options, segment bars, the two find-lists) are not
  stamped with Astro's scope attribute — their CSS in `calculator.astro` has to
  go through `:global()` under a server-rendered ancestor.

## Moat sheets

A sheet is `{ name, essence, build[], bypass[], verdict }` — see
`src/i18n/translations/moats/types.ts`. `build` and `bypass` hold three worked
examples each, `{ lead, text }`; the draft notice returns the moment all of
`essence`, `build` and `bypass` are empty.

The Russian file is generated from the source catalogue:

```bash
node scripts/import-catalogue.mjs <catalogue.md> --ts src/i18n/translations/moats/ru.ts
node scripts/import-catalogue.mjs <catalogue.md> --json /tmp/catalogue.json
```

The importer keeps the sheet names already in the target file and refuses to run
if a moat is missing its essence, its examples or its verdict. English is a
translation of the same structure, written by hand. Small edits go straight into
the `.ts` files; a re-import of the catalogue overwrites `ru.ts` wholesale, so
re-run it only when the source itself changed.

`moat.sample` on the matrix carries the canivibecodeit figures for the first
thirteen mechanics as numbers; the labels are in the dictionaries and the sheet
renders the block only where the figures exist. Each sheet also emits
schema.org JSON-LD with the whole passport as properties — keep it in step with
the matrix when the axes change.

The atlas opens a sheet in a modal by fetching `/moats/N/` and cloning
`#sheet-article`; if the sheet markup around that element changes, check the
modal's `:global()` rules in `index.astro` still cover it.

## The /moats skill

`skills/moats/` ships a Claude Code skill that scores any project on the
atlas's ruler. `references/atlas.md` and `references/calculator.md` inside it
are transcriptions of `src/data/{moats,survey}.ts` and the English dictionaries
— when the matrix, the survey or the calculator copy changes, update them and
run `npm run skill:check`, which re-derives every checkable claim from the
source and fails on drift; both workflows run it. Rung and verdict text in the
references is verbatim dictionary text, never a paraphrase.

`npm run skill` installs the skill to `~/.claude/skills` (`--link` symlinks the
checkout, `--to DIR` targets any other skills directory).
`.claude-plugin/{marketplace,plugin}.json` make the repo installable without a
clone — `/plugin marketplace add GigLaboCom/moat-atlas`, then
`/plugin install moats@moat-atlas`.
