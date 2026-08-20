/**
 * The page index — one walker, read by everything that has to enumerate the
 * site: `/sitemap.xml`, `/llms.txt`, the `.md` twins and the JSON-LD graph.
 *
 * There is deliberately no second list anywhere. A page hand-written into
 * llms.txt or into the sitemap is a future dead link; a twin generated for a
 * path the sitemap hides is a public URL nobody meant to publish. Both classes
 * of bug disappear if every consumer walks the same index.
 *
 * Titles and descriptions come from the same dictionary keys the pages
 * themselves render, so a twin can never disagree with its HTML page.
 */
import { MOATS, MOAT_COUNT, byNumber, type Moat } from "../../data/moats";
import { defaultLocale, locales, type Locale } from "../../i18n/config";
import { getLocalizedPath, getTranslations } from "../../i18n/index";
import { getMoatStrings, isDraft } from "../../i18n/translations/moats/index";
import { cookiesPage } from "../../i18n/translations/pages/cookies";
import { creditsPage } from "../../i18n/translations/pages/credits";
import { siteUrl } from "../url";

/** The sections llms.txt groups pages under; also the breadcrumb trail. */
export type AreaKey = "atlas" | "catalogue" | "calculator" | "about";

export type PageKind =
  | "atlas"
  | "catalogue"
  | "sheet"
  | "calculator"
  | "cookies"
  | "credits";

export interface PageEntry {
  kind: PageKind;
  area: AreaKey;
  /** Locale-neutral, directory-style: "/", "/moats/", "/moats/7/". */
  base: string;
  /** The path this locale is actually served at — "/ru/moats/7/". */
  path: string;
  /** Absolute URL of the HTML page. */
  url: string;
  locale: Locale;
  title: string;
  description: string;
  /** Sheets only: the moat number, its matrix row, and whether prose is missing. */
  n?: number;
  moat?: Moat;
  draft?: boolean;
  /** Sitemap hint. Nothing else reads it. */
  priority: number;
}

/**
 * Paths that exist but are never advertised. The reason is part of the record:
 * an unexplained gap makes an agent hunt for a URL that was withheld on purpose.
 */
export const NOT_LISTED: { path: string; why: string }[] = [
  { path: "/404", why: "error page, no content of its own" },
];

/**
 * The page title without the " — Moat Atlas" suffix: the twin's single `# `
 * heading and the label in llms.txt. The home page has no suffix to drop.
 */
export function shortTitle(page: PageEntry): string {
  const t = getTranslations(page.locale);
  return page.title.replace(new RegExp(`\\s*[—-]\\s*${t.atlas.title}$`), "");
}

/** The sheet title, shared by `/moats/[n].astro` and its twin so they cannot drift. */
export function sheetMeta(locale: Locale, n: number) {
  const t = getTranslations(locale);
  const s = getMoatStrings(locale, n);
  return {
    title: `${s.name} — ${t.atlas.title}`,
    description: s.essence || t.catalogue.meta.description,
  };
}

/** Every published page of the site, in reading order, for one locale. */
export function pagesFor(locale: Locale): PageEntry[] {
  const t = getTranslations(locale);
  const entry = (
    kind: PageKind,
    area: AreaKey,
    base: string,
    title: string,
    description: string,
    priority: number,
    rest: Partial<PageEntry> = {},
  ): PageEntry => {
    const path = getLocalizedPath(base, locale);
    return {
      kind,
      area,
      base,
      path,
      url: siteUrl(path),
      locale,
      title,
      description,
      priority,
      ...rest,
    };
  };

  return [
    entry("atlas", "atlas", "/", t.meta.title, t.meta.description, 1.0),
    entry(
      "catalogue",
      "catalogue",
      "/moats/",
      t.catalogue.meta.title,
      t.catalogue.meta.description,
      0.9,
    ),
    ...MOATS.map((m) => {
      const meta = sheetMeta(locale, m.n);
      return entry("sheet", "catalogue", `/moats/${m.n}/`, meta.title, meta.description, 0.8, {
        n: m.n,
        moat: m,
        draft: isDraft(getMoatStrings(locale, m.n)),
      });
    }),
    entry(
      "calculator",
      "calculator",
      "/calculator/",
      t.calculator.meta.title,
      t.calculator.meta.description,
      0.9,
    ),
    entry(
      "credits",
      "about",
      "/credits/",
      creditsPage[locale].title,
      creditsPage[locale].description,
      0.4,
    ),
    entry(
      "cookies",
      "about",
      "/cookies/",
      cookiesPage[locale].title,
      cookiesPage[locale].description,
      0.3,
    ),
  ];
}

/** The same index across every locale — what the sitemap and the twins walk. */
export function allPages(): PageEntry[] {
  return locales.flatMap((l) => pagesFor(l));
}

export function pageAt(locale: Locale, base: string): PageEntry | undefined {
  return pagesFor(locale).find((p) => p.base === base);
}

/** Sibling URLs of one page in every locale — hreflang and the twins' footer. */
export function alternatesOf(base: string): { locale: Locale; url: string }[] {
  return locales.map((l) => ({ locale: l, url: siteUrl(getLocalizedPath(base, l)) }));
}

export { MOAT_COUNT, byNumber, defaultLocale, locales };
export type { Locale };
