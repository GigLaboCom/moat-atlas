---
name: generate-ldjson
description: Generate and maintain this site's JSON-LD structured data — the one `@graph` per page built in `src/lib/seo/ld.ts`. Use when a new page kind needs structured data, when a schema.org type or property has to be added, corrected or dropped, when the matrix/survey/strategy axes change and the graph must follow, when a validator or an agent reports a missing or malformed node, when a `@id` stops resolving, and for a periodic accuracy pass over the graph.
user-invocable: true
argument-hint: "[page path or kind]"
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# JSON-LD for this site

The structured data of every page is **generated, never authored**. There is no
`ldJson` block in any page's front matter, no hand-written `<script
type="application/ld+json">` in any `.astro` file: `src/lib/seo/ld.ts` builds one
`@graph` per document from the page index, `src/components/JsonLd.astro` emits
it, and `Layout.astro` renders that for every real page. Adding structured data
means editing one module.

Read `references/graph.md` before editing — it holds the per-kind anatomy of the
graph, the field catalogue with the source of truth for every string, and the
validation checklist. Never work from memory of what schema.org "usually" wants.

## Where it lives

| File | Role |
| --- | --- |
| `src/lib/seo/ld.ts` | the whole graph — node builders, `mainEntities()` per page kind, `graphFor()`, `serializeLd()` |
| `src/lib/seo/pages.ts` | the page index every consumer walks: kind, locale, path, title, description, and the moat row or strategy row behind a page |
| `src/components/JsonLd.astro` | the emitter; takes `lang` + locale-neutral `basePath` |
| `src/i18n/translations/**` | every user-visible string the graph may quote |
| `src/data/{moats,survey,strategies,strategy-pages}.ts` | every fact the graph may state |
| `scripts/audit-agents.sh` | proves a built site carries JSON-LD on each listed page (presence, not shape) |
| `.claude/skills/generate-ldjson/scripts/check-ld.mjs` | parses every graph out of `dist/` and checks its shape |

## Rules

1. **No invented strings.** Every name, description and label in the graph is a
   dictionary key or a field of `src/data/`. If the page does not say it to a
   reader, the graph does not say it to a crawler. No fabricated FAQ, no
   `aggregateRating`, no `review`, no `offers` price the site does not publish —
   the free ones already in the graph are `price: 0`, which is true.
2. **`@id`s are URLs the site serves**, with a fragment when the node is not the
   page itself (`…/moats/7/#term`). They are stable: renaming an `@id` breaks
   every reference to it, including ones in other pages' graphs.
3. **Walk the index, never enumerate.** Pages come from `pagesFor(locale)` /
   `pageAt()`. A list of paths written into `ld.ts` is the bug this layer exists
   to prevent.
4. **One graph per document.** Nodes are cross-referenced with `ref()`, not
   duplicated, and not split across several `<script>` tags.
5. **Both locales, always.** `inLanguage` is the page's locale; quoted copy comes
   from that locale's dictionary. The guidance prose of the machine-readable
   layer stays English in both locales — that rule is about llms.txt and the
   twins, not about the graph, which quotes the reader's language.
6. **No `noindex` anywhere in this layer**, and no `@id` pointing at a path the
   sitemap hides (see `NOT_LISTED` in `pages.ts`).

## Workflow

### 1. Name the target

A page path (`/strategies/pick-a-niche/`), a page kind (`sheet`, `strategy`,
`calculator`…), or a type-level change ("the matrix gained an axis"). If the user
gave none, ask. `PageKind` in `pages.ts` is the full list of kinds.

### 2. Read the ground truth

For this site the rendered page is *not* the source — the copy is. Read, in this
order:

- the page entry in `pages.ts` (kind, title, description, `moat`/`strategy`);
- the dictionary that page renders (`src/i18n/translations/pages/…`, `moats/…`,
  or the shared `{en,ru}.ts`);
- the data module behind it (`moats.ts`, `survey.ts`, `strategies.ts`,
  `strategy-pages.ts`).

Then read the existing case for that kind in `mainEntities()`. Most work is
extending a node that is already there.

To see what ships today, build and pull the graph out of `dist/`:

```bash
npm run build
node .claude/skills/generate-ldjson/scripts/check-ld.mjs --print /moats/7/
```

### 3. Pick the types

| The page is | `WebPage` `@type` | Entity nodes | `mainEntity` |
| --- | --- | --- | --- |
| sheet I, the cross-section (`atlas`) | `WebPage` | `DefinedTermSet` of the 35 sheets | the set |
| the catalogue (`catalogue`) | `CollectionPage` | `Dataset` (the matrix, axes as `variableMeasured`) + `ItemList` | the list |
| one moat sheet (`sheet`) | `WebPage` | `DefinedTerm` carrying the passport as `additionalProperty` | the term |
| sheet II, the survey (`calculator`) | `WebPage` | `WebApplication` (shape of the instrument as `additionalProperty`) | the app |
| sheet III, the table (`strategies`) | `CollectionPage` | `Dataset` (`isBasedOn` the essay) + `ItemList` | the list |
| one strategy page (`strategy`) | `WebPage` | `DefinedTerm`, `mentions` the moats it leads to | the term |
| credits (`credits`) | `AboutPage` | — | — |
| cookies (`cookies`) | `WebPage` | — | — |

Every graph also carries `WebSite`, `Organization`, `Person` (the author) and,
off the home page, a `BreadcrumbList` whose labels are the footer's. Do not add
a second copy of any of those.

Extending rather than inventing: a new fact about a moat or a strategy is a
`PropertyValue` in that term's `additionalProperty`; a relation between two
entities is a `ref()` to the other node's `@id`; a downloadable form of a
dataset is a `DataDownload` pointing at the page's twin (`twinUrl(page.path)`).

Types this site does not use, and why: `FAQPage` (no page is Q&A — the survey is
an instrument, not a FAQ), `HowTo` (the sheets are descriptions, not procedures),
`Product`/`Offer` beyond the free web app, `VideoObject` (no video), `Article`
(nothing here is dated editorial). Reach for one only when a page genuinely
becomes that thing, and say so in the commit.

### 4. Edit `ld.ts`

- a new page kind → a new `case` in `mainEntities()`, after its entry exists in
  `pages.ts`;
- a new property on an existing entity → the node builder (`definedTerm`,
  `strategyTerm`, `variables`, the `calculator` case…);
- a new cross-reference → `ref(otherId)`, and check the other node is either in
  the same graph or a URL the site serves.

Keep the module's comment discipline: say *why* a node exists, not what the
line does.

### 5. Prove it

```bash
npm run lint && npm run build
node .claude/skills/generate-ldjson/scripts/check-ld.mjs
```

The checker walks every HTML page in `dist/`, parses its graph, and fails on: a
page with no graph or more than one, unparsable JSON, a duplicate or missing
`@id`, a `@id` whose base is not a URL in `dist/sitemap.xml`, a reference to a
node that resolves nowhere, a missing `@type`, an empty or `undefined`-valued
field, a literal `<` that escaped `serializeLd`, and a sitemap page that carries
no `mainEntity` where its kind should have one.

If the change touched the rest of the machine-readable layer, also run the
container audit — it is the only check that sees the served headers:

```bash
docker build -t moat-atlas . && docker run --rm -p 8099:8080 moat-atlas &
npm run audit -- http://localhost:8099
```

And for a Google-facing sanity check on one URL, the Rich Results test
(`https://search.google.com/test/rich-results`) or the schema.org validator
(`https://validator.schema.org/`) — paste the JSON the `--print` flag gives you
rather than a live URL when the change is not deployed yet.

### 6. Report

Say which nodes changed, which page kinds they affect, and what the checker
printed. If a property was left out on purpose (no data for it, or it would be
invented), say that too.
