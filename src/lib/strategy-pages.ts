/**
 * Sheet III-b, read for one locale — the shaping a strategy page and its `.md`
 * twin share, so the two cannot disagree on a sentence.
 *
 * The prose comes from `src/data/strategy-pages.ts`, the row from
 * `src/data/strategies.ts`; this module only picks the locale and derives the
 * few things both renderers need: the meta description, the neighbours in the
 * category, the matrix attributes of the moats the strategy digs.
 */
import { byNumber, type Moat } from "../data/moats";
import { STRATEGIES, categoryBySlug, strategiesIn, type Strategy } from "../data/strategies";
import {
  PAGES,
  type MoatWhy,
  type StrategyCase,
  type StrategyPage,
  type StrategyRef,
} from "../data/strategy-pages";
import type { Locale } from "../i18n/config";

export const bySlug: Record<string, Strategy> = Object.fromEntries(
  STRATEGIES.map((s) => [s.slug, s]),
);

const pick = (locale: Locale, en: string, ru: string) => (locale === "ru" ? ru : en);

export function summaryOf(p: StrategyPage, locale: Locale): string {
  return pick(locale, p.summary_en, p.summary_ru);
}

/** The paragraphs of "how it works", split on the blank line. */
export function howOf(p: StrategyPage, locale: Locale): string[] {
  return pick(locale, p.how_en, p.how_ru)
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function moatLogicOf(p: StrategyPage, locale: Locale): string {
  return pick(locale, p.moat_logic_en, p.moat_logic_ru);
}

export function signalsOf(p: StrategyPage, locale: Locale): string[] {
  return locale === "ru" ? p.signals_ru : p.signals_en;
}

export function buildOf(p: StrategyPage, locale: Locale): string[] {
  return locale === "ru" ? p.build_ru : p.build_en;
}

export function erosionOf(p: StrategyPage, locale: Locale): string[] {
  return locale === "ru" ? p.erosion_ru : p.erosion_en;
}

export function soloOf(p: StrategyPage, locale: Locale): string {
  return pick(locale, p.solo_en, p.solo_ru);
}

export function whyOf(m: MoatWhy, locale: Locale): string {
  return pick(locale, m.why_en, m.why_ru);
}

/** The page's note on one of the row's moats — validated to exist for every moat. */
export function whyFor(p: StrategyPage, n: number, locale: Locale): string {
  return whyOf(p.per_moat.find((m) => m.n === n)!, locale);
}

export function caseWhat(c: StrategyCase, locale: Locale): string {
  return pick(locale, c.what_en, c.what_ru);
}

export function refWhy(r: StrategyRef, locale: Locale): string {
  return pick(locale, r.why_en, r.why_ru);
}

/**
 * The meta description: the first sentence of the summary, cut at a word
 * boundary to fit a result snippet. Never the gist — eighty near-identical
 * descriptions would be worse than none.
 */
export const DESCRIPTION_MAX = 160;

export function descriptionOf(p: StrategyPage, locale: Locale): string {
  const summary = summaryOf(p, locale).replace(/\s+/g, " ").trim();
  const first = summary.match(/^.*?[.!?…](?=\s|$)/)?.[0] ?? summary;
  if (first.length <= DESCRIPTION_MAX) return first;
  const cut = first.slice(0, DESCRIPTION_MAX);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]$/, "")}…`;
}

/** The neighbours in the category, in essay order, wrapping at the edges. */
export function neighboursOf(s: Strategy): { prev: Strategy; next: Strategy } {
  const rows = strategiesIn(s.category);
  const i = rows.findIndex((r) => r.slug === s.slug);
  return {
    prev: rows[(i - 1 + rows.length) % rows.length],
    next: rows[(i + 1) % rows.length],
  };
}

/** The matrix rows of the moats the strategy grows into directly. */
export function directMoatsOf(s: Strategy): Moat[] {
  return s.moats.filter((m) => m.kind === "direct").map((m) => byNumber[m.n]);
}

export function categoryOf(s: Strategy) {
  return categoryBySlug[s.category];
}

export { PAGES };
export type { StrategyPage };
