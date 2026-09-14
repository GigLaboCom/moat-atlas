/**
 * Sheet III, read for one locale — the small amount of shaping the page and
 * its `.md` twin share, so the two cannot spell a row differently.
 *
 * The markers are fixed by the spec and identical in both locales: a moat the
 * strategy reaches only *via* another is written `→ #N`, one it reaches only
 * under a condition `#N?`. They are typography, not copy, so they live here
 * rather than in a dictionary.
 */
import {
  depthOf,
  type LinkKind,
  type MoatLink,
  type Strategy,
  type StrategyCategory,
  type StrategyRole,
} from "../data/strategies";
import type { Locale } from "../i18n/config";
import { fold } from "./fold";

export const VIA_MARK = "→";
export const CONDITIONAL_MARK = "?";

export function nameOf(s: Strategy, locale: Locale): string {
  return locale === "ru" ? s.name_ru : s.name_en;
}

export function gistOf(s: Strategy, locale: Locale): string {
  return locale === "ru" ? s.gist_ru : s.gist_en;
}

export function noteOf(s: Strategy, locale: Locale): string {
  return locale === "ru" ? s.note_ru : s.note_en;
}

export function categoryName(c: StrategyCategory, locale: Locale): string {
  return locale === "ru" ? c.ru : c.en;
}

export function roleName(r: StrategyRole, locale: Locale): string {
  return locale === "ru" ? r.ru : r.en;
}

export function roleGist(r: StrategyRole, locale: Locale): string {
  return locale === "ru" ? r.gist_ru : r.gist_en;
}

/** `#8`, `→ #17`, `#10?` — the moat as the table writes it. */
export function moatMark(link: MoatLink): string {
  if (link.kind === "via") return `${VIA_MARK} #${link.n}`;
  if (link.kind === "conditional") return `#${link.n}${CONDITIONAL_MARK}`;
  return `#${link.n}`;
}

/** The derived depth as the table writes it: the number, marked like its moat. */
export function depthMark(s: Strategy): string {
  const depth = depthOf(s);
  if (!depth) return "—";
  if (depth.kind === "via") return `${VIA_MARK} ${depth.d}`;
  if (depth.kind === "conditional") return `${depth.d}${CONDITIONAL_MARK}`;
  return String(depth.d);
}

/** The depth level (1–4) a strategy's derived depth rounds to, for the tool label. */
export function depthLevel(s: Strategy): 1 | 2 | 3 | 4 | null {
  const depth = depthOf(s);
  return depth ? (Math.round(depth.d) as 1 | 2 | 3 | 4) : null;
}

/** Examples joined the way every cell joins them; "—" when there are none. */
export function examples(list: string[]): string {
  return list.length ? list.join(", ") : "—";
}

/**
 * Search text of one row — both names, both gists and every example, folded
 * the way the page script folds the query (`fold.ts`).
 */
export function searchText(s: Strategy): string {
  return fold(
    [s.name_en, s.name_ru, s.gist_en, s.gist_ru, ...s.examples_nature, ...s.examples_business].join(
      " ",
    ),
  );
}

export type { LinkKind };
