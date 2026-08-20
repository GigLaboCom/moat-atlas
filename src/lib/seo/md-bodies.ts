/**
 * The bodies of the `.md` twins — synthesized, per page, from the same data and
 * dictionaries the HTML page renders.
 *
 * Nothing here is hand-written prose and nothing is a source dump: this site has
 * no MDX to transform, so every twin is built from the structured content
 * (`src/data/*`, `src/i18n/translations/*`). That is the good case — the twin
 * carries the whole page, not a stub, and it cannot drift from the page because
 * both read the same keys.
 *
 * Rules for anything added here:
 *  - every link is absolute and already locale-correct (`u()`), because a
 *    relative link dies the moment an agent stores the file;
 *  - no navigation chrome, no button captions, no aria text;
 *  - never invent a fact the dictionaries do not carry.
 */
import {
  AI_GLYPH,
  DEPTH_LEVELS,
  GROUPING_AXES,
  MOATS,
  MOAT_COUNT,
  ROCK_ORDER,
  TERNARY_GLYPH,
  byNumber,
  moatsInBucket,
  type Moat,
} from "../../data/moats";
import { QUESTIONS, SEGMENT_KEYS, OPTION_WEIGHTS, questionsOf } from "../../data/survey";
import type { Locale } from "../../i18n/config";
import { getLocalizedPath, getTranslations } from "../../i18n/index";
import { getMoatStrings } from "../../i18n/translations/moats/index";
import { calculatorPage } from "../../i18n/translations/pages/calculator";
import { cookiesPage } from "../../i18n/translations/pages/cookies";
import { creditsPage } from "../../i18n/translations/pages/credits";
import { CONTACTS, GIGLABO_URL, LAZY_SHOT_URL, MNEMOVI_URL, REPO_URL } from "../links";
import { siteUrl } from "../url";
import type { PageEntry } from "./pages";

/** Absolute, locale-correct URL for a locale-neutral site path. */
export function u(locale: Locale, base: string): string {
  return siteUrl(getLocalizedPath(base, locale));
}

/** A table cell: pipes escaped, newlines flattened. */
function cell(v: string): string {
  return String(v).replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.map(cell).join(" | ")} |`,
    `|${head.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

/** Strip the leading glyph off a dictionary value ("● high" → "high"). */
function word(v: string): string {
  return v.replace(/^\S+\s+/, "");
}

/** The seven-axis passport of one mechanic, as rows. */
function passportRows(locale: Locale, m: Moat): string[][] {
  const t = getTranslations(locale);
  const depth = Math.round(m.d) as 1 | 2 | 3 | 4;
  const cap = Math.round(m.capN) as 1 | 2 | 3 | 4;
  return [
    [t.catalogue.columns.rock, t.rocks[m.rock]],
    [t.catalogue.columns.depth, `${m.d} · ${t.atlas.ruler[depth].tool}`],
    [t.sheet.years, t.atlas.ruler[depth].years],
    [t.catalogue.columns.cap, `${m.cap} · ${word(t.values.cap[cap])}`],
    [t.catalogue.columns.solo, t.values.solo[m.solo]],
    [t.catalogue.columns.ai, t.values.ai[m.ai]],
    [t.catalogue.columns.rent, t.values.rent[m.rent]],
  ];
}

/** The matrix as one wide table — the catalogue, and the tail of the atlas twin. */
function matrixTable(locale: Locale): string {
  const t = getTranslations(locale);
  const c = t.catalogue.columns;
  return table(
    [c.n, c.name, c.rock, c.depth, c.cap, c.solo, c.ai, c.rent],
    MOATS.map((m) => [
      String(m.n),
      `[${getMoatStrings(locale, m.n).name}](${u(locale, `/moats/${m.n}/`)})`,
      t.rocks[m.rock],
      String(m.d),
      m.cap,
      TERNARY_GLYPH[m.solo],
      AI_GLYPH[m.ai],
      TERNARY_GLYPH[m.rent],
    ]),
  );
}

/** Sheet: the whole passport, the prose and the worked examples. */
function sheetBody(locale: Locale, n: number): string {
  const t = getTranslations(locale);
  const m = byNumber[n];
  const s = getMoatStrings(locale, n);
  const out: string[] = [];

  // Bullets, not a table: the passport is two columns of which one has no name
  // in any dictionary, and an invented header word would be text this site
  // never wrote.
  out.push(
    `## ${t.sheet.passport}`,
    "",
    ...passportRows(locale, m).map(([k, v]) => `- **${k}**: ${v}`),
  );

  if (m.sample) {
    out.push(
      "",
      `## ${t.sheet.sample.title}`,
      "",
      `- **${t.sheet.sample.share}**: ${m.sample.share}%`,
      `- **${t.sheet.sample.noRate}**: ${m.sample.noRate}%`,
      `- **${t.sheet.sample.median}**: $${m.sample.median}`,
      "",
      m.sample.n ? `${t.sheet.sample.small.replace("{n}", String(m.sample.n))}. ${t.sheet.sample.note}` : t.sheet.sample.note,
    );
  }

  if (!s.essence && !s.build.length && !s.bypass.length) {
    out.push("", `> ${t.sheet.draft}`);
    return out.join("\n");
  }

  if (s.essence) out.push("", `## ${t.sheet.essence}`, "", s.essence);

  for (const [heading, examples] of [
    [t.sheet.build, s.build],
    [t.sheet.bypass, s.bypass],
  ] as const) {
    if (!examples.length) continue;
    out.push("", `## ${heading}`);
    for (const ex of examples) out.push("", `### ${ex.lead}`, "", ex.text);
  }

  if (s.verdict) out.push("", `## ${t.sheet.verdict}`, "", s.verdict);
  return out.join("\n");
}

/** Sheet I: what the drawing is, how to read it, and the whole matrix. */
function atlasBody(locale: Locale): string {
  const t = getTranslations(locale);
  const out: string[] = [];

  out.push(t.atlas.subtitle);

  out.push("", `## ${t.atlas.guide.title}`, "", t.atlas.guide.lede);
  for (const s of t.atlas.guide.sections) out.push("", `### ${s.title}`, "", s.body);

  out.push(
    "",
    `## ${t.atlas.axes.depth}`,
    "",
    t.atlas.ruler.caption,
    "",
    ...DEPTH_LEVELS.map(
      (l) =>
        `- **${l} · ${t.atlas.ruler[l].tool}** — ${t.atlas.ruler[l].years} · ${
          moatsInBucket("depth", String(l)).length
        }/${MOAT_COUNT}`,
    ),
  );

  out.push(
    "",
    `## ${t.atlas.axes.rock}`,
    "",
    ...ROCK_ORDER.map(
      (r) => `- **${t.rocks[r]}** — ${MOATS.filter((m) => m.rock === r).length}/${MOAT_COUNT}`,
    ),
  );

  out.push(
    "",
    `## ${t.atlas.legend.grouping}`,
    "",
    ...GROUPING_AXES.map((a) => `- ${t.atlas.axes[a]}`),
  );

  out.push("", `## ${t.catalogue.heading} (${MOAT_COUNT})`, "", matrixTable(locale));
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Sheet I, flat: the matrix and nothing else. */
function catalogueBody(locale: Locale): string {
  const t = getTranslations(locale);
  return [t.catalogue.intro, "", matrixTable(locale)].join("\n");
}

/** Sheet II: every question, its ladder, and the mechanics it probes. */
function calculatorBody(locale: Locale): string {
  const t = getTranslations(locale);
  const c = calculatorPage[locale];
  const out: string[] = [c.intro, "", t.calculator.note];

  // One section per segment, questions in survey order inside it. Every heading
  // is a dictionary string; the option ladders carry their weights so an agent
  // can reproduce the scoring without reading `src/data/survey.ts`.
  for (const key of SEGMENT_KEYS) {
    out.push("", `## ${c.segments[key].name}`, "", c.segments[key].blurb);
    for (const q of questionsOf(key)) {
      const s = c.questions[q.id];
      const i = QUESTIONS.findIndex((x) => x.id === q.id) + 1;
      out.push(
        "",
        `### ${i}. ${s.question}`,
        "",
        `${s.eyebrow}`,
        "",
        ...s.options.map((o, oi) => `${oi + 1}. (${OPTION_WEIGHTS[oi]}) ${o}`),
        "",
        `${t.catalogue.columns.name}: ${q.moats
          .map((n) => `[${getMoatStrings(locale, n).name}](${u(locale, `/moats/${n}/`)})`)
          .join(", ")}`,
      );
    }
  }

  out.push(
    "",
    `## ${t.calculator.readout.verdict}`,
    "",
    table(
      [t.calculator.readout.depth, t.calculator.readout.verdict],
      ([1, 2, 3, 4] as const).map((l) => [
        `${l} · ${t.atlas.ruler[l].tool} · ${t.atlas.ruler[l].years}`,
        c.verdicts[l],
      ]),
    ),
  );
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** The cookie policy: the categories and the storage table, no UI copy. */
function cookiesBody(locale: Locale): string {
  const p = cookiesPage[locale];
  return [
    p.intro,
    "",
    `## ${p.section_what_title}`,
    "",
    p.section_what_text,
    "",
    `## ${p.section_categories_title}`,
    "",
    `- **${p.cat_essential_title}** — ${p.cat_essential_text}`,
    `- **${p.cat_analytics_title}** — ${p.cat_analytics_text}`,
    `- **${p.cat_marketing_title}** — ${p.cat_marketing_text}`,
    `- **${p.cat_personalization_title}** — ${p.cat_personalization_text}`,
    "",
    `## ${p.section_specific_title}`,
    "",
    table(
      [p.table_name, p.table_purpose, p.table_duration, p.table_category],
      [
        [p.cookie_consent_name, p.cookie_consent_purpose, p.cookie_consent_duration, p.cookie_consent_category],
        [p.cookie_theme_name, p.cookie_theme_purpose, p.cookie_theme_duration, p.cookie_theme_category],
        [p.cookie_ga_name, p.cookie_ga_purpose, p.cookie_ga_duration, p.cookie_ga_category],
        [p.cookie_region_name, p.cookie_region_purpose, p.cookie_region_duration, p.cookie_region_category],
      ],
    ),
    "",
    p.last_updated,
  ].join("\n");
}

/** The colophon: who, how, out of what, under which licence. */
function creditsBody(locale: Locale): string {
  const p = creditsPage[locale];
  const out = [
    p.intro,
    "",
    `## ${p.section_project_title}`,
    "",
    p.section_project_text,
    "",
    `## ${p.section_author_title}`,
    "",
    `**${p.author_name}** — ${p.author_role}`,
    "",
    p.section_author_note,
    "",
    `## ${p.section_method_title}`,
    "",
    p.section_method_text,
    "",
    `## ${p.section_stack_title}`,
    "",
    `- ${p.stack_astro}`,
    `- ${p.stack_three}`,
    `- ${p.stack_ga}`,
    `- ${p.stack_claude}`,
  ];

  if (p.section_sources_text) {
    out.push("", `## ${p.section_sources_title}`, "", p.section_sources_text);
  }

  out.push(
    "",
    `## ${p.section_license_title}`,
    "",
    p.section_license_text,
    "",
    `- [${p.license_repo}](${REPO_URL})`,
    "",
    `## ${p.section_contact_title}`,
    "",
    p.section_contact_text,
    "",
    ...CONTACTS[locale].map((c) => `- ${c.network}: [${c.handle}](${c.href})`),
    "",
    `## ${p.section_related_title}`,
    "",
    p.section_related_text,
    "",
    `- [${p.related_giglabo_label}](${GIGLABO_URL}) — ${p.related_giglabo_note}`,
    `- [${p.related_hls_label}](${LAZY_SHOT_URL}) — ${p.related_hls_note}`,
    `- [${p.related_mvi_label}](${MNEMOVI_URL}) — ${p.related_mvi_note}`,
  );
  return out.join("\n");
}

/** The body of one twin — everything between the provenance block and Related. */
export function bodyFor(page: PageEntry): string {
  switch (page.kind) {
    case "atlas":
      return atlasBody(page.locale);
    case "catalogue":
      return catalogueBody(page.locale);
    case "sheet":
      return sheetBody(page.locale, page.n!);
    case "calculator":
      return calculatorBody(page.locale);
    case "cookies":
      return cookiesBody(page.locale);
    case "credits":
      return creditsBody(page.locale);
  }
}
