/**
 * The reading guide of sheet I — which of its sections go where.
 *
 * The prose lives in the dictionaries (`atlas.guide.sections`, keyed); this
 * file only fixes the order and the two cuts of it. The home page folds the
 * seven sections about the drawing itself under "How to read this section";
 * `/about/` carries all of them, and the fine print stands on its own at the
 * bottom of the home page.
 */
export const GUIDE_KEYS = [
  "drawing",
  "rocks",
  "depths",
  "groupings",
  "filters",
  "list",
  "controls",
  "calculator",
  "fineprint",
] as const;

export type GuideKey = (typeof GUIDE_KEYS)[number];

/** The seven the home page keeps beside the section, collapsed by default. */
export const GUIDE_READING_KEYS: GuideKey[] = [
  "drawing",
  "rocks",
  "depths",
  "groupings",
  "filters",
  "list",
  "controls",
];

/** The one paragraph that stays on the home page, at the very bottom. */
export const GUIDE_FINEPRINT_KEY: GuideKey = "fineprint";
