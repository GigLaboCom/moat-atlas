/**
 * The `/llms.txt` renderer — curated framing (`llms.config.ts`) plus the live
 * page index (`pages.ts`).
 *
 * One file covers both locales. The sibling project serves a per-locale variant
 * behind `?locale=`, which a static build cannot do and this site does not need:
 * 40 pages per locale fit in one document, and an agent that reads it once ends
 * up knowing the Russian half exists — which the split version cannot promise.
 */
import { defaultLocale, locales, type Locale } from "../../i18n/config";
import { siteUrl } from "../url";
import {
  LLMS_AREAS,
  LLMS_ENDPOINTS,
  LLMS_LOCALE_NAMES,
  LLMS_SITE,
  LLMS_URL_CONVENTIONS,
  LLMS_USAGE_NOTES,
} from "./llms.config";
import { NOT_LISTED, pagesFor, shortTitle, type PageEntry } from "./pages";

const BASE = siteUrl("/").replace(/\/$/, "");

function expand(s: string): string {
  return s.replaceAll("{BASE}", BASE);
}

/** One line, collapsed and clamped — a page list is scanned, not read. */
function oneLine(text: string, max = 220): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function label(page: PageEntry): string {
  const short = shortTitle(page);
  return page.kind === "sheet" ? `${page.n}. ${short}` : short;
}

function line(page: PageEntry): string {
  return `- [${label(page)}](${page.url}): ${oneLine(page.description)}`;
}

/** The four area sections for one locale, at the given heading depth. */
function areas(locale: Locale, depth: number, withSummary: boolean): string[] {
  const hash = "#".repeat(depth);
  const pages = pagesFor(locale);
  return LLMS_AREAS.flatMap(({ key, heading, summary }) => {
    const inArea = pages.filter((p) => p.area === key);
    if (!inArea.length) return [];
    return [
      "",
      `${hash} ${heading}`,
      ...(withSummary ? ["", expand(summary)] : []),
      "",
      ...inArea.map(line),
    ];
  });
}

export function renderLlmsTxt(): string {
  const out: string[] = [
    `# ${LLMS_SITE.name}`,
    "",
    `> ${LLMS_SITE.blurb}`,
    "",
    LLMS_SITE.intro,
    "",
    "## How the URLs work",
    "",
    ...LLMS_URL_CONVENTIONS.map((c) => `- ${expand(c)}`),
  ];

  out.push(...areas(defaultLocale, 2, true));

  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    const pages = pagesFor(locale);
    out.push(
      "",
      `## ${LLMS_LOCALE_NAMES[locale]} — the same atlas under \`/${locale}/\``,
      "",
      `Every page above exists in ${LLMS_LOCALE_NAMES[locale]} at the same path under a \`/${locale}\` prefix, each with its own \`.md\` twin — ${pages.length} pages. The Russian sheets are the source the English side was translated from.`,
      ...areas(locale, 3, false),
    );
  }

  out.push(
    "",
    "## Machine-readable endpoints",
    "",
    ...LLMS_ENDPOINTS.map((e) => `- ${expand(e.url)}: ${e.what}`),
    "",
    "## Not listed here",
    "",
    // Paths, not links: these are the URLs that deliberately answer nothing,
    // and printing them as links would make every link checker report them.
    ...NOT_LISTED.map((n) => `- \`${n.path}\` — ${n.why}`),
    "",
    "## Notes for agents",
    "",
    ...LLMS_USAGE_NOTES.map((n) => `- ${expand(n)}`),
    "",
  );

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}
