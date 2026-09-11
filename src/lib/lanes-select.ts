/**
 * Which cards the address lights, as a pure function of the query.
 *
 * The lanes view is lit from outside — a moat sheet links to it with its own
 * strategies highlighted, a strategy page with its combination partners — so
 * the rule that decides "lit" has to be one rule. It lives here, with no
 * imports beyond the search fold and no knowledge of the DOM: the page script
 * feeds it rows read off the cards' data attributes, the gate script feeds it
 * rows read out of `strategies.v1.json`, and the two cannot disagree.
 *
 * Unknown values are dropped in silence, the way the table drops them: a
 * `moat=99` or a `hl=nope` lights nothing and breaks nothing.
 */
import { fold } from "./fold";

export const LINK_KIND_VALUES = ["direct", "via", "conditional"] as const;
export type LinkKindValue = (typeof LINK_KIND_VALUES)[number];

export interface LaneRow {
  slug: string;
  /** `moats` of the row, already parsed — `[{ n: 8, kind: "via" }]`. */
  moats: { n: number; kind: string }[];
  /** Folded search text: both names, both gists, every example. */
  search: string;
}

export interface LaneQuery {
  /** `#N` or a comma list of them; anything else is dropped. */
  moat?: string;
  /** Narrows `moat` to one link kind; ignored without `moat`. */
  kind?: string;
  /** Slugs to light exactly. */
  hl?: string[];
  /** Free text, matched the way the table matches it. */
  q?: string;
}

/** `1:direct,8:via` → `[{ n: 1, kind: "direct" }, { n: 8, kind: "via" }]`. */
export function parseMoats(value: string): { n: number; kind: string }[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [n, kind] = part.split(":");
      return { n: Number(n), kind: kind ?? "direct" };
    })
    .filter((m) => Number.isFinite(m.n));
}

/** The numbers of `moat=`, in order, duplicates and non-numbers dropped. */
export function parseMoatParam(value: string): number[] {
  const seen = new Set<number>();
  for (const part of value.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n > 0) seen.add(n);
  }
  return [...seen];
}

/** A comma list of slugs, trimmed and de-duplicated; membership is checked later. */
export function parseSlugList(value: string): string[] {
  return [...new Set(value.split(",").map((s) => s.trim()).filter(Boolean))];
}

/**
 * The lit set — the union of every active highlight. The three sources are
 * composable and additive: a card lit by `moat=` stays lit when a `q=` lights
 * others, because "highlight" adds attention rather than narrowing it (that is
 * what `role=` and `cat=` are for). An empty query lights nothing, which is the
 * page's resting state, not an empty result.
 */
export function litRows(rows: LaneRow[], query: LaneQuery): Set<string> {
  const lit = new Set<string>();
  const moats = parseMoatParam(query.moat ?? "");
  const kind = (LINK_KIND_VALUES as readonly string[]).includes(query.kind ?? "")
    ? (query.kind as LinkKindValue)
    : "";
  const hl = new Set(query.hl ?? []);
  const q = fold((query.q ?? "").trim());

  for (const row of rows) {
    if (hl.has(row.slug)) lit.add(row.slug);
    if (moats.length && row.moats.some((m) => moats.includes(m.n) && (!kind || m.kind === kind))) {
      lit.add(row.slug);
    }
    if (q && row.search.includes(q)) lit.add(row.slug);
  }
  return lit;
}

/** Whether the query asks for any highlight at all — the banner's condition. */
export function hasHighlight(query: LaneQuery): boolean {
  return Boolean(
    parseMoatParam(query.moat ?? "").length || (query.hl ?? []).length || (query.q ?? "").trim(),
  );
}
