/**
 * The survey matrix behind the atlas — 35 defensibility mechanics.
 *
 * Language-neutral by design: this file holds only the measurable columns of the
 * matrix (rock, depth, capital, solo, ai, rent). Every human-readable string
 * lives in `src/i18n/translations/moats/{en,ru}.ts`, keyed by moat number.
 *
 * Source: moat-atlas prototype v3 (six groupings, geological cross-section).
 */

export type RockKey =
  | "networks"
  | "minds"
  | "assets"
  | "math"
  | "rules"
  | "locks"
  | "position";

export const ROCK_ORDER: RockKey[] = [
  "networks",
  "minds",
  "assets",
  "math",
  "rules",
  "locks",
  "position",
];

/** Rock colour doubles as the CSS custom property `--rock-{key}`. */
export const ROCK_COLORS: Record<RockKey, string> = {
  networks: "#2fbfa5",
  minds: "#d97ba6",
  assets: "#d6a644",
  math: "#5e8fbf",
  rules: "#c0453a",
  locks: "#9b76d9",
  position: "#c8cfc2",
};

/** Cross-section shape per rock — read by the 3D scene. */
export const ROCK_SHAPE: Record<RockKey, "box" | "slab" | number> = {
  networks: 24,
  minds: 6,
  assets: "box",
  math: 4,
  rules: "slab",
  locks: 8,
  position: 3,
};

/** Depth level → digging tool. 1 shovel · 2 excavator · 3 rig · 4 mine. */
export type DepthLevel = 1 | 2 | 3 | 4;
export const DEPTH_LEVELS: DepthLevel[] = [1, 2, 3, 4];

export type Ternary = "yes" | "partial" | "no";
export type AiTrend = "resistant" | "eroding" | "under-attack";

export interface Moat {
  /** Stable id — also the deep-link anchor (`#moat-7`) and sheet route (`/moats/7/`). */
  n: number;
  rock: RockKey;
  /** Depth in levels, 1–4. Fractional values sit between strata. */
  d: number;
  /** Capital glyph from the matrix (○ ◐ ● ◉, ranges kept as-is). */
  cap: string;
  /** Capital score 1–4 — drives shaft thickness. */
  capN: number;
  /** Reachable by a solo builder? */
  solo: Ternary;
  /** How the mechanic fares as AI commoditises software. */
  ai: AiTrend;
  /** Can the moat be rented from someone else? */
  rent: Ternary;
  /**
   * Figures from the canivibecodeit sample, where they exist — only the first
   * thirteen mechanics were measured. Kept as numbers so the sheet can render
   * them and a machine can read them; the labels live in the dictionaries.
   */
  sample?: MoatSample;
}

export interface MoatSample {
  /** Share of apps in the sample carrying this tag, per cent. */
  share: number;
  /** Share of those apps that cannot be vibe-coded, per cent. */
  noRate: number;
  /** Median price, USD. */
  median: number;
  /** Sample size, noted only where it is too small to lean on. */
  n?: number;
}

export const MOATS: Moat[] = [
  { n: 1,  rock: "networks", d: 4,   cap: "◐–●", capN: 2.5, solo: "partial", ai: "resistant",    rent: "no", sample: { share: 8.2, noRate: 67, median: 22.97 } },
  { n: 2,  rock: "networks", d: 3,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "partial", sample: { share: 0.7, noRate: 86, median: 102, n: 7 } },
  { n: 3,  rock: "assets",   d: 2.5, cap: "◐",   capN: 2,   solo: "yes",     ai: "eroding",      rent: "partial", sample: { share: 11.5, noRate: 57, median: 29 } },
  { n: 4,  rock: "assets",   d: 3.5, cap: "◉",   capN: 4,   solo: "no",      ai: "resistant",    rent: "yes", sample: { share: 12.3, noRate: 71, median: 18.99 } },
  { n: 5,  rock: "locks",    d: 2,   cap: "○",   capN: 1,   solo: "yes",     ai: "under-attack", rent: "no", sample: { share: 4.4, noRate: 24, median: 15 } },
  { n: 6,  rock: "locks",    d: 2,   cap: "◐",   capN: 2,   solo: "yes",     ai: "under-attack", rent: "partial", sample: { share: 40.2, noRate: 29, median: 19.99 } },
  { n: 7,  rock: "rules",    d: 3,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "yes", sample: { share: 10.1, noRate: 68, median: 20 } },
  { n: 8,  rock: "minds",    d: 4,   cap: "◐",   capN: 2,   solo: "partial", ai: "resistant",    rent: "partial", sample: { share: 7.8, noRate: 79, median: 14.84 } },
  { n: 9,  rock: "assets",   d: 3.5, cap: "◉",   capN: 4,   solo: "no",      ai: "eroding",      rent: "yes", sample: { share: 43.9, noRate: 52, median: 19.99 } },
  { n: 10, rock: "assets",   d: 3,   cap: "●",   capN: 3,   solo: "partial", ai: "resistant",    rent: "partial", sample: { share: 0.7, noRate: 29, median: 11.99 } },
  { n: 11, rock: "networks", d: 2,   cap: "○",   capN: 1,   solo: "yes",     ai: "under-attack", rent: "no", sample: { share: 17.3, noRate: 17, median: 15 } },
  { n: 12, rock: "rules",    d: 2.5, cap: "●",   capN: 3,   solo: "partial", ai: "eroding",      rent: "partial", sample: { share: 10.5, noRate: 44, median: 14.99 } },
  { n: 13, rock: "locks",    d: 1,   cap: "○",   capN: 1,   solo: "yes",     ai: "under-attack", rent: "no", sample: { share: 55.9, noRate: 17, median: 15 } },
  { n: 14, rock: "rules",    d: 3,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 15, rock: "math",     d: 3,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 16, rock: "position", d: 3,   cap: "●",   capN: 3,   solo: "partial", ai: "eroding",      rent: "partial" },
  { n: 17, rock: "position", d: 3,   cap: "◐",   capN: 2,   solo: "yes",     ai: "eroding",      rent: "no" },
  { n: 18, rock: "assets",   d: 3,   cap: "◉",   capN: 4,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 19, rock: "locks",    d: 4,   cap: "◐",   capN: 2,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 20, rock: "networks", d: 3,   cap: "◐",   capN: 2,   solo: "partial", ai: "resistant",    rent: "partial" },
  { n: 21, rock: "networks", d: 2,   cap: "○",   capN: 1,   solo: "yes",     ai: "resistant",    rent: "no" },
  { n: 22, rock: "assets",   d: 4,   cap: "◉",   capN: 4,   solo: "no",      ai: "eroding",      rent: "no" },
  { n: 23, rock: "locks",    d: 1,   cap: "○",   capN: 1,   solo: "yes",     ai: "under-attack", rent: "no" },
  { n: 24, rock: "math",     d: 4,   cap: "◐",   capN: 2,   solo: "partial", ai: "eroding",      rent: "no" },
  { n: 25, rock: "minds",    d: 2,   cap: "○",   capN: 1,   solo: "yes",     ai: "eroding",      rent: "no" },
  { n: 26, rock: "assets",   d: 3,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 27, rock: "math",     d: 2,   cap: "◐",   capN: 2,   solo: "partial", ai: "eroding",      rent: "no" },
  { n: 28, rock: "math",     d: 3,   cap: "◉",   capN: 4,   solo: "no",      ai: "eroding",      rent: "no" },
  { n: 29, rock: "rules",    d: 4,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "partial" },
  { n: 30, rock: "rules",    d: 4,   cap: "●",   capN: 3,   solo: "no",      ai: "resistant",    rent: "no" },
  { n: 31, rock: "assets",   d: 4,   cap: "◉",   capN: 4,   solo: "no",      ai: "resistant",    rent: "partial" },
  { n: 32, rock: "minds",    d: 2,   cap: "○",   capN: 1,   solo: "yes",     ai: "eroding",      rent: "no" },
  { n: 33, rock: "minds",    d: 1,   cap: "◐",   capN: 2,   solo: "yes",     ai: "under-attack", rent: "no" },
  { n: 34, rock: "networks", d: 3,   cap: "○–◐", capN: 1.5, solo: "partial", ai: "eroding",      rent: "no" },
  { n: 35, rock: "math",     d: 3,   cap: "◉",   capN: 4,   solo: "no",      ai: "resistant",    rent: "no" },
];

export const MOAT_COUNT = MOATS.length;

export const byNumber: Record<number, Moat> = Object.fromEntries(
  MOATS.map((m) => [m.n, m]),
);

/** Glyphs used by the legend and the specimen card. */
export const TERNARY_GLYPH: Record<Ternary, string> = { yes: "✓", partial: "~", no: "✗" };
export const AI_GLYPH: Record<AiTrend, string> = {
  resistant: "↑",
  eroding: "→",
  "under-attack": "↓",
};

/** The six axes the cross-section can be re-laid-out by. */
export const GROUPING_AXES = ["rock", "depth", "cap", "solo", "ai", "rent"] as const;
export type GroupingAxis = (typeof GROUPING_AXES)[number];

/** Ordered bucket keys per axis — labels come from the translations. */
export const AXIS_BUCKETS: Record<GroupingAxis, string[]> = {
  rock: ROCK_ORDER,
  depth: ["1", "2", "3", "4"],
  cap: ["1", "2", "3", "4"],
  solo: ["yes", "partial", "no"],
  ai: ["resistant", "eroding", "under-attack"],
  rent: ["no", "partial", "yes"],
};

/** Which bucket a moat falls into on a given axis. */
export function bucketOf(m: Moat, axis: GroupingAxis): string {
  switch (axis) {
    case "rock": return m.rock;
    case "depth": return String(Math.round(m.d));
    case "cap": return String(Math.round(m.capN));
    case "solo": return m.solo;
    case "ai": return m.ai;
    case "rent": return m.rent;
  }
}

export function moatsInBucket(axis: GroupingAxis, bucket: string): Moat[] {
  return MOATS.filter((m) => bucketOf(m, axis) === bucket);
}
