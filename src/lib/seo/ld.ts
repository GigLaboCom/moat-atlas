/**
 * JSON-LD for every page — one `@graph` per document rather than a scatter of
 * disconnected scripts.
 *
 * The graph is built from the same page index as `/llms.txt` and the `.md`
 * twins, so a page cannot advertise structured data that disagrees with what it
 * renders. Node identities are stable and cross-referenced: the 35 sheets are
 * `DefinedTerm`s of the atlas's `DefinedTermSet`, and the catalogue publishes
 * the matrix as a `Dataset` whose `variableMeasured` are the axes of the survey.
 *
 * Two rules:
 *  - every factual claim comes from the dictionaries or `src/data/` — nothing is
 *    invented for the crawler that the page does not say to a reader;
 *  - `@id`s are URLs the site actually serves, with a fragment when a node is
 *    not the page itself (`…/moats/7/#term`).
 */
import { GROUPING_AXES, MOAT_COUNT, byNumber, type GroupingAxis, type Moat } from "../../data/moats";
import {
  CATEGORIES,
  LINK_KINDS,
  ROLES,
  SOURCE,
  STRATEGY_COUNT,
  DATASET_VERSION,
  backlinksFor,
  depthOf,
  type LinkKind,
} from "../../data/strategies";
import { OPTION_WEIGHTS, QUESTION_COUNT, SEGMENT_KEYS } from "../../data/survey";
import type { Locale } from "../../i18n/config";
import { getLocalizedPath, getTranslations } from "../../i18n/index";
import { getMoatStrings } from "../../i18n/translations/moats/index";
import { creditsPage } from "../../i18n/translations/pages/credits";
import { calculatorPage } from "../../i18n/translations/pages/calculator";
import { strategiesPage } from "../../i18n/translations/pages/strategies";
import { strategyPage } from "../../i18n/translations/pages/strategy";
import { CONTACTS, GIGLABO_URL, REPO_URL } from "../links";
import { categoryName, examples, gistOf, moatMark, nameOf, noteOf, roleName } from "../strategies";
import { PAGES, bySlug, categoryOf, whyFor } from "../strategy-pages";
import { siteUrl } from "../url";
import { twinUrl } from "./md-twin";
import { pageAt, pagesFor, shortTitle, type PageEntry } from "./pages";

const SITE = siteUrl("/");
const ORG_ID = `${GIGLABO_URL}#organization`;
const LICENSE = "https://opensource.org/licenses/MIT";

type Node = Record<string, unknown>;

const ref = (id: string) => ({ "@id": id });

/** The set every sheet is a term of — one node per locale. */
const atlasSetId = (locale: Locale) => `${SITE}#atlas-${locale}`;
const termId = (page: PageEntry) => `${page.url}#term`;

/** The two pages a cross-sheet reference points at, in the reader's locale. */
const sheetUrl = (locale: Locale, n: number) => siteUrl(getLocalizedPath(`/moats/${n}/`, locale));
const strategyUrl = (locale: Locale, slug: string) =>
  siteUrl(getLocalizedPath(`/strategies/${slug}/`, locale));

/** The propertyID each of the three back-link lists takes on a sheet. */
const BACKLINK_IDS: Record<LinkKind, string> = {
  direct: "strategiesDirect",
  via: "strategiesVia",
  conditional: "strategiesConditional",
};

function organization(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "GigLabo",
    url: GIGLABO_URL,
  };
}

function author(locale: Locale): Node {
  const c = creditsPage[locale];
  return {
    "@type": "Person",
    "@id": `${SITE}#author`,
    name: c.author_name,
    jobTitle: c.author_role,
    url: siteUrl(getLocalizedPath("/credits/", locale)),
    worksFor: ref(ORG_ID),
    sameAs: CONTACTS[locale].map((l) => l.href),
  };
}

function website(locale: Locale): Node {
  const t = getTranslations(locale);
  return {
    "@type": "WebSite",
    "@id": `${SITE}#website`,
    url: SITE,
    name: t.atlas.title,
    description: t.meta.description,
    inLanguage: ["en", "ru"],
    publisher: ref(ORG_ID),
    author: ref(`${SITE}#author`),
    license: LICENSE,
    codeRepository: REPO_URL,
  };
}

/** Home > Catalogue > Sheet — labels are the footer's, so they match the chrome. */
function breadcrumbs(page: PageEntry): Node | null {
  if (page.kind === "atlas") return null;
  const t = getTranslations(page.locale);
  const f = t.ui.footer;
  const trail: { name: string; url: string }[] = [
    { name: f.atlas, url: siteUrl(getLocalizedPath("/", page.locale)) },
  ];

  if (page.kind === "catalogue" || page.kind === "sheet") {
    trail.push({ name: f.catalogue, url: siteUrl(getLocalizedPath("/moats/", page.locale)) });
  }
  if (page.kind === "strategies" || page.kind === "strategy") {
    trail.push({ name: f.strategies, url: siteUrl(getLocalizedPath("/strategies/", page.locale)) });
  }
  if (page.kind !== "catalogue" && page.kind !== "strategies") {
    trail.push({ name: shortTitle(page), url: page.url });
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${page.url}#breadcrumb`,
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

/** The axes of the matrix, as the measured variables of the dataset. */
function variables(locale: Locale): Node[] {
  const t = getTranslations(locale);
  const described: Record<GroupingAxis, string> = {
    rock: Object.values(t.rocks).join(", "),
    depth: Object.values(t.values.depth).join(", "),
    cap: Object.values(t.values.cap).join(", "),
    solo: Object.values(t.values.solo).join(", "),
    ai: Object.values(t.values.ai).join(", "),
    rent: Object.values(t.values.rent).join(", "),
  };
  return GROUPING_AXES.map((axis) => ({
    "@type": "PropertyValue",
    name: t.atlas.axes[axis],
    propertyID: axis,
    description: described[axis],
  }));
}

/** One sheet, as a defined term carrying its whole passport. */
function definedTerm(page: PageEntry): Node {
  const t = getTranslations(page.locale);
  const p = strategyPage[page.locale];
  const m = page.moat as Moat;
  const back = backlinksFor(m.n);
  const leadHere = LINK_KINDS.flatMap((k) => back[k]);
  return {
    "@type": "DefinedTerm",
    "@id": termId(page),
    identifier: String(page.n),
    name: shortTitle(page),
    description: page.description,
    inLanguage: page.locale,
    url: page.url,
    mainEntityOfPage: ref(page.url),
    inDefinedTermSet: ref(atlasSetId(page.locale)),
    additionalProperty: [
      { "@type": "PropertyValue", name: t.atlas.axes.rock, propertyID: "rock", value: m.rock },
      { "@type": "PropertyValue", name: t.atlas.axes.depth, propertyID: "depth", value: m.d, maxValue: 4 },
      { "@type": "PropertyValue", name: t.atlas.axes.cap, propertyID: "capital", value: m.capN, maxValue: 4 },
      { "@type": "PropertyValue", name: t.atlas.axes.solo, propertyID: "solo", value: m.solo },
      { "@type": "PropertyValue", name: t.atlas.axes.ai, propertyID: "ai", value: m.ai },
      { "@type": "PropertyValue", name: t.atlas.axes.rent, propertyID: "rent", value: m.rent },
      ...(m.sample
        ? [
            { "@type": "PropertyValue", name: t.sheet.sample.share, propertyID: "sampleShare", value: m.sample.share, unitText: "%" },
            { "@type": "PropertyValue", name: t.sheet.sample.noRate, propertyID: "sampleNoRate", value: m.sample.noRate, unitText: "%" },
            { "@type": "PropertyValue", name: t.sheet.sample.median, propertyID: "sampleMedianPrice", value: m.sample.median, unitText: "USD" },
          ]
        : []),
      // Sheet III seen from this side — the back-link block the sheet renders.
      // Which way a strategy reaches the moat is a fact about the pair, so it
      // is stated here, on the moat's own node, rather than on a term another
      // page defines; an empty list is left out, never written as a dash.
      ...LINK_KINDS.filter((k) => back[k].length > 0).map((k) => ({
        "@type": "PropertyValue",
        name: p.kinds[k],
        propertyID: BACKLINK_IDS[k],
        value: back[k].map((s) => nameOf(s, page.locale)).join(", "),
      })),
    ],
    // The strategies themselves, as the terms their own pages define.
    ...(leadHere.length > 0
      ? {
          mentions: leadHere.map((s) => ({
            "@type": "DefinedTerm",
            "@id": `${strategyUrl(page.locale, s.slug)}#term`,
            identifier: s.slug,
            name: nameOf(s, page.locale),
            url: strategyUrl(page.locale, s.slug),
          })),
        }
      : {}),
  };
}

/**
 * One strategy, as a defined term the way a sheet is one — the row's facts as
 * properties, the moats it grows into as references to the sheets' own terms,
 * and the essay's dataset as the set it belongs to.
 */
function strategyTerm(page: PageEntry): Node {
  const t = getTranslations(page.locale);
  const tp = strategiesPage[page.locale];
  const p = strategyPage[page.locale];
  const s = page.strategy!;
  const prose = PAGES[s.slug];
  const depth = depthOf(s);
  return {
    "@type": "DefinedTerm",
    "@id": termId(page),
    identifier: s.slug,
    name: shortTitle(page),
    description: page.description,
    inLanguage: page.locale,
    url: page.url,
    mainEntityOfPage: ref(page.url),
    isPartOf: ref(`${SITE}#strategies-${page.locale}`),
    additionalProperty: [
      { "@type": "PropertyValue", name: tp.columns.category, propertyID: "category", value: categoryName(categoryOf(s), page.locale) },
      { "@type": "PropertyValue", name: tp.columns.role, propertyID: "role", value: roleName(ROLES[s.role], page.locale) },
      // A depth reached only via another moat or under a condition is marked
      // in the table; a bare number here would drop the mark, so only a
      // direct depth is asserted — the moats property carries the marks.
      ...(depth && depth.kind === "direct"
        ? [{ "@type": "PropertyValue", name: tp.columns.depth, propertyID: "depth", value: depth.d, maxValue: 4 }]
        : []),
      { "@type": "PropertyValue", name: tp.columns.moats, propertyID: "moats", value: s.moats.length ? s.moats.map(moatMark).join(", ") : "—" },
      // The two example columns, joined as every cell joins them. A row with
      // no examples emits neither — absent, not a dash a crawler has to read.
      ...(s.examples_nature.length
        ? [{ "@type": "PropertyValue", name: tp.columns.nature, propertyID: "nature", value: examples(s.examples_nature) }]
        : []),
      ...(s.examples_business.length
        ? [{ "@type": "PropertyValue", name: tp.columns.business, propertyID: "business", value: examples(s.examples_business) }]
        : []),
      // The owner's caveat on the mapping, marked on the table and printed
      // under the moats strip — a graph that dropped it would read as settled.
      ...(s.disputed
        ? [{ "@type": "PropertyValue", name: tp.markers.disputed, propertyID: "disputed", value: noteOf(s, page.locale) }]
        : []),
      // The page's own sentence on each moat it leads to. It belongs to the
      // pair, not to the moat, so it is a property of this strategy: the
      // sheet's `#term` is one node, and eighty pages must not each give it a
      // different description.
      ...s.moats.map((m) => ({
        "@type": "PropertyValue",
        name: getMoatStrings(page.locale, m.n).name,
        propertyID: `moat-${m.n}`,
        value: `${p.kinds[m.kind]} · ${t.atlas.axes.depth} ${byNumber[m.n].d} — ${whyFor(prose, m.n, page.locale)}`,
      })),
    ],
    // Every moat the strategy leads to, by the term its own sheet defines.
    ...(s.moats.length
      ? {
          mentions: s.moats.map((m) => ({
            "@type": "DefinedTerm",
            "@id": `${sheetUrl(page.locale, m.n)}#term`,
            identifier: String(m.n),
            name: getMoatStrings(page.locale, m.n).name,
            url: sheetUrl(page.locale, m.n),
          })),
        }
      : {}),
    // The strategies it stacks with and fights with, by their own terms.
    ...(prose.combos.length || prose.tensions.length
      ? {
          relatedLink: [...prose.combos, ...prose.tensions].map((r) =>
            siteUrl(getLocalizedPath(`/strategies/${bySlug[r.slug].slug}/`, page.locale)),
          ),
        }
      : {}),
  };
}

/** The nodes a page contributes beyond the WebPage itself. */
function mainEntities(page: PageEntry): { type: string; nodes: Node[]; mainEntity?: string } {
  const t = getTranslations(page.locale);
  const sheets = pagesFor(page.locale).filter((p) => p.kind === "sheet");

  switch (page.kind) {
    case "atlas": {
      const set: Node = {
        "@type": "DefinedTermSet",
        "@id": atlasSetId(page.locale),
        name: t.atlas.title,
        description: t.atlas.subtitle,
        inLanguage: page.locale,
        url: page.url,
        license: LICENSE,
        creator: ref(`${SITE}#author`),
        hasDefinedTerm: sheets.map((s) => ref(termId(s))),
      };
      return { type: "WebPage", nodes: [set], mainEntity: atlasSetId(page.locale) };
    }
    case "catalogue": {
      const dataset: Node = {
        "@type": "Dataset",
        "@id": `${SITE}#matrix-${page.locale}`,
        name: t.catalogue.meta.title,
        description: t.catalogue.meta.description,
        inLanguage: page.locale,
        url: page.url,
        license: LICENSE,
        creator: ref(`${SITE}#author`),
        publisher: ref(ORG_ID),
        isAccessibleForFree: true,
        variableMeasured: variables(page.locale),
        size: `${MOAT_COUNT} rows`,
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/markdown",
          contentUrl: twinUrl(page.path),
        },
      };
      const list: Node = {
        "@type": "ItemList",
        "@id": `${page.url}#list`,
        numberOfItems: MOAT_COUNT,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: sheets.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: shortTitle(s),
          url: s.url,
        })),
      };
      return { type: "CollectionPage", nodes: [dataset, list], mainEntity: `${page.url}#list` };
    }
    case "sheet":
      return { type: "WebPage", nodes: [definedTerm(page)], mainEntity: termId(page) };
    case "calculator": {
      const c = calculatorPage[page.locale];
      const app: Node = {
        "@type": "WebApplication",
        "@id": `${page.url}#app`,
        name: t.calculator.heading,
        description: t.calculator.meta.description,
        url: page.url,
        inLanguage: page.locale,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        author: ref(`${SITE}#author`),
        publisher: ref(ORG_ID),
        license: LICENSE,
        featureList: SEGMENT_KEYS.map((k) => `${c.segments[k].name} — ${c.segments[k].blurb}`),
        // The survey's shape, so an agent can describe the instrument without
        // running it: twelve questions, five rungs, these weights.
        additionalProperty: [
          { "@type": "PropertyValue", name: "questions", value: QUESTION_COUNT },
          { "@type": "PropertyValue", name: "segments", value: SEGMENT_KEYS.length },
          { "@type": "PropertyValue", name: "optionWeights", value: OPTION_WEIGHTS.join(", ") },
        ],
      };
      return { type: "WebPage", nodes: [app], mainEntity: `${page.url}#app` };
    }
    case "strategies": {
      const p = strategiesPage[page.locale];
      // The dataset node credits the essay the taxonomy comes from; the role and
      // moat columns are the atlas's own and are declared as its variables.
      const dataset: Node = {
        "@type": "Dataset",
        "@id": `${SITE}#strategies-${page.locale}`,
        name: t.strategies.meta.title,
        description: t.strategies.meta.description,
        version: DATASET_VERSION,
        inLanguage: page.locale,
        url: page.url,
        license: LICENSE,
        creator: ref(`${SITE}#author`),
        publisher: ref(ORG_ID),
        isAccessibleForFree: true,
        isBasedOn: {
          "@type": "CreativeWork",
          name: SOURCE.title,
          author: { "@type": "Person", name: SOURCE.author, url: SOURCE.url },
          url: SOURCE.url,
        },
        variableMeasured: [
          { "@type": "PropertyValue", name: p.columns.category, propertyID: "category", description: CATEGORIES.map((c) => categoryName(c, page.locale)).join(", ") },
          { "@type": "PropertyValue", name: p.columns.role, propertyID: "role", description: Object.values(ROLES).map((r) => roleName(r, page.locale)).join(", ") },
          { "@type": "PropertyValue", name: p.columns.moats, propertyID: "moats", description: "direct, via, conditional" },
          // Depth is the matrix's own axis, derived per row; the two example
          // columns take open text, so they are declared without values.
          { "@type": "PropertyValue", name: p.columns.depth, propertyID: "depth", description: Object.values(t.values.depth).join(", ") },
          { "@type": "PropertyValue", name: p.columns.nature, propertyID: "nature" },
          { "@type": "PropertyValue", name: p.columns.business, propertyID: "business" },
        ],
        size: `${STRATEGY_COUNT} rows`,
        distribution: {
          "@type": "DataDownload",
          encodingFormat: "text/markdown",
          contentUrl: twinUrl(page.path),
        },
      };
      // The list walks the index, like the catalogue's: every item is the
      // strategy's own page (sheet III-b), not the row's anchor in this table
      // — a summary list points at the pages it summarises.
      const list: Node = {
        "@type": "ItemList",
        "@id": `${page.url}#list`,
        numberOfItems: STRATEGY_COUNT,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: pagesFor(page.locale)
          .filter((sp) => sp.kind === "strategy")
          .map((sp, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: shortTitle(sp),
            description: gistOf(sp.strategy!, page.locale),
            url: sp.url,
          })),
      };
      return { type: "CollectionPage", nodes: [dataset, list], mainEntity: `${page.url}#list` };
    }
    case "strategy":
      return { type: "WebPage", nodes: [strategyTerm(page)], mainEntity: termId(page) };
    case "credits":
      return { type: "AboutPage", nodes: [] };
    case "cookies":
      return { type: "WebPage", nodes: [] };
  }
}

/** The whole graph for one page. Returns null for a path that is not a page. */
export function graphFor(locale: Locale, basePath: string): object | null {
  const page = pageAt(locale, basePath);
  if (!page) return null;

  const t = getTranslations(locale);
  const { type, nodes, mainEntity } = mainEntities(page);
  const crumbs = breadcrumbs(page);

  const webPage: Node = {
    "@type": type,
    "@id": page.url,
    url: page.url,
    name: shortTitle(page),
    description: page.description,
    inLanguage: locale,
    isPartOf: ref(`${SITE}#website`),
    about: mainEntity ? ref(mainEntity) : undefined,
    mainEntity: mainEntity ? ref(mainEntity) : undefined,
    breadcrumb: crumbs ? ref(crumbs["@id"] as string) : undefined,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: siteUrl(`/og/og-${locale}.png`),
      width: 1200,
      height: 630,
    },
    // The Markdown twin, declared where a machine already looks.
    encoding: {
      "@type": "MediaObject",
      encodingFormat: "text/markdown",
      contentUrl: twinUrl(page.path),
    },
    license: LICENSE,
    publisher: ref(ORG_ID),
    author: ref(`${SITE}#author`),
    ...(page.kind === "atlas" ? { alternativeHeadline: t.atlas.subtitle } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      website(locale),
      organization(),
      author(locale),
      webPage,
      ...(crumbs ? [crumbs] : []),
      ...nodes,
    ],
  };
}

/** JSON for a `<script>` body: `<` escaped so a `</script>` can never appear. */
export function serializeLd(graph: object): string {
  return JSON.stringify(graph, (_k, v) => (v === undefined ? undefined : v)).replace(
    /</g,
    "\\u003c",
  );
}
