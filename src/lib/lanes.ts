/**
 * Sheet III's second projection — the 80 strategies as 13 lanes.
 *
 * The table answers "what is each strategy"; the lanes answer "what does the
 * whole field look like, and where do the moats sit in it". Same dataset, same
 * order, no second copy: a lane is a category with its strategies in essay
 * order, and everything the card shows — the accent, the example, the chips,
 * the counts — is derived here from `strategies.v1.json` and the matrix.
 *
 * Nothing in this module knows about the DOM; the page, the static SVG and the
 * gate script all read the same lanes, so they cannot draw three different maps.
 */
import {
  CATEGORIES,
  STRATEGIES,
  strategiesIn,
  type MoatLink,
  type Strategy,
  type StrategyCategory,
} from "../data/strategies";

/** Chips a card shows before it starts counting ("+K"). */
export const CARD_CHIPS = 3;
/** Words of the card's one example. */
export const EXAMPLE_WORDS = 3;

export interface LaneCard {
  s: Strategy;
  /** The first three moats of the row, in the row's own order. */
  chips: MoatLink[];
  /** How many moats the chips leave out — 0 when the row fits. */
  more: number;
}

export interface Lane {
  cat: StrategyCategory;
  cards: LaneCard[];
  /** Cards in this lane whose role is `hold` — the number that tells the story. */
  holds: number;
}

/**
 * The card's one example: the first business example, the first from nature as
 * the fallback, nothing when the row has neither. Cut to three words — never
 * rewritten, so the card cannot say something the dataset does not.
 */
export function cardExample(s: Strategy): string {
  const first = s.examples_business[0] ?? s.examples_nature[0] ?? "";
  const words = first.split(/\s+/).filter(Boolean);
  return words.length > EXAMPLE_WORDS ? `${words.slice(0, EXAMPLE_WORDS).join(" ")}…` : first;
}

export function cardOf(s: Strategy): LaneCard {
  return { s, chips: s.moats.slice(0, CARD_CHIPS), more: Math.max(0, s.moats.length - CARD_CHIPS) };
}

/** The thirteen lanes in essay order — the order is part of what the map shows. */
export const LANES: Lane[] = CATEGORIES.map((cat) => {
  const rows = strategiesIn(cat.slug);
  return {
    cat,
    cards: rows.map(cardOf),
    holds: rows.filter((s) => s.role === "hold").length,
  };
});

export const LANE_COUNT = LANES.length;
export const HOLD_COUNT = STRATEGIES.filter((s) => s.role === "hold").length;

/**
 * A row's moats as one attribute — `1:direct,8:via`. The card carries the facts
 * its own filters need; the dataset is never shipped to the browser twice.
 */
export function moatData(s: Strategy): string {
  return s.moats.map((m) => `${m.n}:${m.kind}`).join(",");
}
