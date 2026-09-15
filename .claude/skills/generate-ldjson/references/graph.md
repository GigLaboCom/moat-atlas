# The graph, node by node

What `graphFor(locale, basePath)` emits, where every value comes from, and what
a reviewer checks. Read this before editing `src/lib/seo/ld.ts`; re-read it
after, because a change here without a change there is how the two drift.

## Constants

| Name | Value | Source |
| --- | --- | --- |
| `SITE` | `siteUrl("/")` | `src/lib/url.ts`, i.e. `PUBLIC_SITE_URL` at build time |
| `ORG_ID` | `${GIGLABO_URL}#organization` | `src/lib/links.ts` |
| `LICENSE` | `https://opensource.org/licenses/MIT` | the repo's licence |
| `atlasSetId(locale)` | `${SITE}#atlas-<locale>` | one term set per locale |
| `termId(page)` | `${page.url}#term` | sheets and strategy pages |

`ref(id)` is the only way to point at another node. A node is defined once per
graph and referenced everywhere else.

## Nodes present in every graph

### `WebSite` — `${SITE}#website`

| Field | From |
| --- | --- |
| `name` | `t.atlas.title` |
| `description` | `t.meta.description` |
| `inLanguage` | `["en", "ru"]` — the site, not the page |
| `publisher` | `ref(ORG_ID)` |
| `author` | `ref(${SITE}#author)` |
| `license`, `codeRepository` | `LICENSE`, `REPO_URL` |

### `Organization` — `${GIGLABO_URL}#organization`

Name and URL only. The organisation is the publisher of every page; it is not
the author.

### `Person` — `${SITE}#author`

`name`, `jobTitle` from `creditsPage[locale]`; `url` is the credits page;
`worksFor` refs the org; `sameAs` is `CONTACTS[locale]` — per-locale because the
author writes in a different place in each language.

### The page node — `@id` = `page.url`

`@type` is the kind's type from the table in `SKILL.md`. Fields:

| Field | From |
| --- | --- |
| `name` | `shortTitle(page)` — the title with the `— Moat Atlas` suffix dropped, or a strategy's own name |
| `description` | `page.description`, i.e. the same meta description the page renders |
| `inLanguage` | the page's locale |
| `isPartOf` | `ref(${SITE}#website)` |
| `about` / `mainEntity` | `ref()` of the kind's main entity, both, or neither |
| `breadcrumb` | `ref(${page.url}#breadcrumb)`, absent on the home page |
| `primaryImageOfPage` | `/og/og-<locale>.png`, 1200×630 — rendered by `npm run og` |
| `encoding` | a `MediaObject` at `twinUrl(page.path)`, declaring the Markdown twin |
| `license`, `publisher`, `author` | as above |
| `alternativeHeadline` | `t.atlas.subtitle`, home page only |

`serializeLd()` drops `undefined` and replaces every `<` with its JSON unicode
escape, so the JSON can never close its own `<script>`. Never `JSON.stringify`
a graph by hand.

### `BreadcrumbList` — `${page.url}#breadcrumb`

Built by `breadcrumbs(page)`; `null` for the `atlas` kind. Labels are
`t.ui.footer.{atlas,catalogue,strategies}` plus `shortTitle(page)`, so the trail
reads exactly like the chrome. Trails:

- catalogue, sheet → Atlas › Catalogue (› sheet)
- strategies, strategy → Atlas › Strategies (› strategy)
- calculator, about, credits, cookies → Atlas › page

## Per-kind entity nodes

### `atlas` — `DefinedTermSet` at `atlasSetId(locale)`

`name`/`description` are `t.atlas.title`/`t.atlas.subtitle`;
`hasDefinedTerm` refs the `#term` of every `sheet` page of that locale, taken
from `pagesFor(locale)`. This is the only node that enumerates the sheets, and
it does so by walking the index.

The home page adds two nodes beside the set. A `HowTo` at `<page>#howto` —
`name` is `homePage[locale].steps.title`, one `HowToStep` per step of
`homeSteps(locale)` (counts filled from the data), `tool` a ref to the
calculator's `#app`. And the calculator's own `WebApplication`, built by
`calculatorApp(locale)` with the same `@id` it has on `/calculator/`, so the
two graphs describe one instrument. The `mainEntity` stays the set.

### `catalogue` — `Dataset` + `ItemList`

`Dataset` at `${SITE}#matrix-<locale>`: `variableMeasured` is `variables()` —
one `PropertyValue` per `GROUPING_AXES` entry, `name` from `t.atlas.axes[axis]`,
`propertyID` the axis key, `description` the axis's own value labels joined
(`t.rocks` for the rock axis, `t.values.<axis>` for the rest). `size` is
`${MOAT_COUNT} rows`; `distribution` is a `DataDownload` of the page's twin.

`ItemList` at `${page.url}#list`: `numberOfItems` = `MOAT_COUNT`, ascending, one
`ListItem` per sheet with `shortTitle` and URL. It is the page's `mainEntity`.

### `sheet` — `DefinedTerm` at `${page.url}#term`

`identifier` is the moat number as a string — **the number is the identity**,
never renumbered. `inDefinedTermSet` refs `atlasSetId(locale)`, a node defined in
the home page's graph: a cross-page reference, which is allowed because the `@id`
resolves to a URL the site serves.

`additionalProperty` is the passport, in matrix order: `rock`, `depth` (`m.d`,
`maxValue: 4`), `capital` (`m.capN`, `maxValue: 4`), `solo`, `ai`, `rent`, each
named with `t.atlas.axes[…]`. Where `m.sample` exists, three more:
`sampleShare` and `sampleNoRate` in `%`, `sampleMedianPrice` in `USD`, named
with `t.sheet.sample.*`. A sheet without figures emits none of the three —
absent, never zero.

**When the matrix gains or loses an axis**, this list and `variables()` both
change, and so do `t.atlas.axes` and `t.values`. The sheet's JSON-LD is expected
to state the whole passport.

After the passport come sheet III's back-links, the block
`StrategyBacklinks.astro` renders: up to three more `PropertyValue`s —
`strategiesDirect`, `strategiesVia`, `strategiesConditional`, named with
`strategyPage[locale].kinds.*`, each the names of `backlinksFor(n)[kind]`
joined. An empty kind emits nothing. `mentions` then carries those strategies as
`DefinedTerm`s — `@id`, `identifier`, `name`, `url` and nothing else, because
the strategy's own page defines that term.

*Which way* a strategy reaches a moat is a fact about the pair, so it is stated
on the moat's own node here and on the strategy's own node there. Neither side
writes a `description` onto the other's `@id`: one node, eighty pages, one
description.

### `calculator` — `WebApplication` at `${page.url}#app`

`name` `t.calculator.heading`, `description` `t.calculator.meta.description`,
`applicationCategory: BusinessApplication`, `operatingSystem: Any (web
browser)`, `browserRequirements: Requires JavaScript`, `isAccessibleForFree`,
`offers` at price 0 USD — the survey really is free and needs no consent
category. `featureList` is the four segments as `name — blurb` from
`calculatorPage[locale]`. `additionalProperty` states the instrument's shape:
`questions` = `QUESTION_COUNT`, `segments` = `SEGMENT_KEYS.length`,
`optionWeights` = `OPTION_WEIGHTS` joined — so an agent can describe the survey
without running it. Keep those three in step with `src/data/survey.ts`.

### `strategies` — `Dataset` + `ItemList`

`Dataset` at `${SITE}#strategies-<locale>`: `version` is `DATASET_VERSION`;
`isBasedOn` credits the source essay from `SOURCE` (title, author, url);
`variableMeasured` is the table's own columns — `category` (all `CATEGORIES`
names), `role` (all `ROLES` names), `moats` (`"direct, via, conditional"`),
`depth` (the matrix's depth labels), and `nature`/`business`, which take open
text and so are declared by name alone; `size` is `${STRATEGY_COUNT} rows`;
`distribution` the twin.

`ItemList` at `${page.url}#list`: one `ListItem` per `strategy` page of
`pagesFor(locale)` — `shortTitle`, `gistOf` and the page's own URL, the way the
catalogue's list points at the sheets. A summary list points at the pages it
summarises, not at its own anchors. Slugs never change.

### `strategy` — `DefinedTerm` at `${page.url}#term`

`identifier` is the slug; `isPartOf` refs the strategies dataset of that locale.
`additionalProperty`, named with `strategiesPage[locale].columns.*`: `category`,
`role`, `depth` (only when the row has direct moats, `maxValue: 4`), `moats`
(the row's marks via `moatMark`, `—` when empty), `nature` and `business` (the
example columns via `examples()`, each omitted when the row has none), and
`disputed` — the owner's note (`noteOf`) under `markers.disputed`, present only
on a row the dataset marks arguable.

Then one `PropertyValue` per moat the strategy leads to: `propertyID`
`moat-<n>`, `name` the moat's own name, value `kind · depth N — why`, where the
*why* is the page's own sentence (`whyFor(prose, n, locale)`). It is a property
of the strategy, not of the moat — see the `sheet` section.

`mentions` is one `DefinedTerm` per moat, carrying `@id` (the sheet's `#term`),
`identifier`, `name` and `url` — a reference, not a second copy of the sheet's
term — and is omitted for a row with no moats. `relatedLink` lists the combos
and tensions as strategy-page URLs, and is omitted when there are none.

### `about`, `credits`, `cookies`

`AboutPage`, `AboutPage` and `WebPage`, no entity nodes. Nothing to invent
here: the author is already a node in every graph, and the reading guide on
`/about/` is prose, not an entity.

## Adding a page kind

The graph is the last step, not the first:

1. `PageKind` + an `entry()` in `pagesFor()` (`src/lib/seo/pages.ts`) — this one
   edit gives the page its sitemap row, both twin URL forms, the head links and
   a slot in llms.txt;
2. the twin body in `src/lib/seo/md-bodies.ts`;
3. the llms.txt prose in `src/lib/seo/llms.config.ts`;
4. a `case` in `mainEntities()` — every kind must be handled, the switch has no
   default and TypeScript will name the missing one;
5. `breadcrumbs()` if the kind sits under a section;
6. `npm run build`, the checker, then `npm run audit` against a container.

## Validation checklist

Shape (the checker enforces all of these):

- [ ] exactly one `application/ld+json` per page, valid JSON
- [ ] `@context: https://schema.org` and a `@graph` array
- [ ] every node has `@type` and a unique `@id`
- [ ] every `@id`'s base URL is a page in `dist/sitemap.xml`
- [ ] every `ref()` resolves — in this graph, or to a `@id` some page defines
- [ ] no empty string, no `"undefined"`, no raw `<` in the serialized JSON
- [ ] the page node carries `url`, `name`, `description`, `inLanguage`,
      `isPartOf`, `encoding`, and a `breadcrumb` off the home page
- [ ] a kind with a main entity actually refs it, and that node is in the graph

Judgement (yours, not the checker's):

- [ ] every string traces to a dictionary key or a `src/data/` field
- [ ] the locale's copy, not the other locale's, and `inLanguage` matches
- [ ] numbers agree with the matrix, the survey and the strategies dataset
- [ ] no type claimed that the page is not (`FAQPage`, `HowTo`, `Product`…)
- [ ] no rating, review, price or date the site does not publish
- [ ] `@id`s unchanged unless the URL itself changed
