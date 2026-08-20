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
import { GROUPING_AXES, MOAT_COUNT, type GroupingAxis, type Moat } from "../../data/moats";
import { OPTION_WEIGHTS, QUESTION_COUNT, SEGMENT_KEYS } from "../../data/survey";
import type { Locale } from "../../i18n/config";
import { getLocalizedPath, getTranslations } from "../../i18n/index";
import { creditsPage } from "../../i18n/translations/pages/credits";
import { calculatorPage } from "../../i18n/translations/pages/calculator";
import { CONTACTS, GIGLABO_URL, REPO_URL } from "../links";
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
  if (page.kind !== "catalogue") trail.push({ name: shortTitle(page), url: page.url });

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
  const m = page.moat as Moat;
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
    ],
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
