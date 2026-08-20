/**
 * The `.md` page twins — a plain-Markdown copy of every page, served at the
 * page URL with `.md` appended.
 *
 * An agent that wants a sheet should not have to fetch the HTML and de-chrome
 * it (the atlas page alone ships a three.js bundle). This is the convention
 * llmstxt.org specifies and the major docs sites ship; `/llms.txt` says which
 * pages exist, a twin gives the page. The contract between the two is the thing
 * to protect: **a twin exists for exactly the pages llms.txt lists, and nowhere
 * else** — both walk `pages.ts`, so that holds by construction.
 *
 * Decisions (change one only with a reason here):
 *
 * | Decision | Value | Why |
 * |---|---|---|
 * | URL form | both `<path>.md` and `<path>/index.md`; home is `/index.md`, and nginx rewrites `/.md` onto it | The spec says `index.md` for filename-less URLs; every real crawler tries `<path>.md`. Supporting both removes a 404 class. |
 * | `Content-Type` | `text/markdown; charset=utf-8` | What agent tooling sniffs for. Set by the endpoint in dev and by `docker/nginx.conf` in the image. |
 * | `Content-Disposition` | `inline` | `text/markdown` alone makes browsers download the file. |
 * | `Link` | `<html url>; rel="canonical"` | Dedupe signal, so a twin never competes with its page. |
 * | `sitemap.xml` | twins are **not** listed, ever | A sitemap declares canonical URLs and every twin points its canonical at the HTML page — listing both would have them assert opposite things. Twins are for agents that were told the convention, not for crawler discovery. |
 * | `noindex` | never | An agent that honours `noindex` refuses to use the file. `rel="canonical"` is the dedupe signal. |
 * | Unknown path | 404 | A 200 carrying an apology is content an agent ingests and quotes back. |
 *
 * The guidance lines are English in both locales — they address the model, not
 * the reader; the page content itself is always in the page's own language.
 */
import { localeLabels, type Locale } from "../../i18n/config";
import { getTranslations } from "../../i18n/index";
import { siteUrl } from "../url";
import { bodyFor, u } from "./md-bodies";
import { MOAT_COUNT, alternatesOf, shortTitle, type PageEntry } from "./pages";

export const LLMS_TXT_URL = siteUrl("/llms.txt");

/** YAML double-quoted scalar — sheet descriptions carry quotes and dashes. */
function yaml(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Drop the arrows the UI strings carry ("← Previous" → "Previous"). */
function bare(label: string): string {
  return label.replace(/^[←→]\s*/, "").replace(/\s*[←→]$/, "");
}

/** The twin URL of a page path — `/moats/7/` → `/moats/7/index.md`. */
export function twinPath(path: string): string {
  return path.endsWith("/") ? `${path}index.md` : `${path}.md`;
}

export function twinUrl(path: string): string {
  return siteUrl(twinPath(path));
}

function provenance(page: PageEntry): string[] {
  return [
    `> Markdown twin of ${page.url} — the same content as the HTML page, a fraction of the bytes.`,
    "> Every page of this site has one: append `.md` to any URL, or `index.md` to a directory URL.",
    `> Site structure and the full page list for agents: ${LLMS_TXT_URL}`,
  ];
}

function related(page: PageEntry): string[] {
  const t = getTranslations(page.locale);
  const f = t.ui.footer;
  const out: string[] = [`- HTML version of this page: ${page.url}`];

  for (const alt of alternatesOf(page.base)) {
    if (alt.locale === page.locale) continue;
    out.push(`- ${localeLabels[alt.locale]}: ${alt.url}`);
  }

  if (page.kind === "sheet" && page.n) {
    if (page.n > 1) {
      out.push(`- ${bare(t.sheet.prev)}: ${u(page.locale, `/moats/${page.n - 1}/`)}`);
    }
    if (page.n < MOAT_COUNT) {
      out.push(`- ${bare(t.sheet.next)}: ${u(page.locale, `/moats/${page.n + 1}/`)}`);
    }
  }

  if (page.kind !== "atlas") out.push(`- ${f.atlas}: ${u(page.locale, "/")}`);
  if (page.kind !== "catalogue") out.push(`- ${f.catalogue}: ${u(page.locale, "/moats/")}`);
  if (page.kind !== "calculator") {
    out.push(`- ${f.calculator}: ${u(page.locale, "/calculator/")}`);
  }
  out.push(`- Site map for agents: ${LLMS_TXT_URL}`);
  return out;
}

/** Assemble one twin: front matter, heading, provenance, body, Related. */
export function buildTwin(page: PageEntry): string {
  const t = getTranslations(page.locale);
  const facts: string[] = [];
  if (page.kind === "sheet" && page.n) {
    facts.push(`- ${t.sheet.eyebrow} ${page.n} / ${MOAT_COUNT}`);
  }

  return [
    "---",
    `title: ${yaml(shortTitle(page))}`,
    `description: ${yaml(page.description)}`,
    `canonical: ${page.url}`,
    `locale: ${page.locale}`,
    "---",
    "",
    `# ${shortTitle(page)}`,
    "",
    ...provenance(page),
    "",
    ...(facts.length ? [...facts, ""] : []),
    bodyFor(page),
    "",
    "## Related",
    "",
    ...related(page),
    "",
  ].join("\n");
}

export type { Locale };
