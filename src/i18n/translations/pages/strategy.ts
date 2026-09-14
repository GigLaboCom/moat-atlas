/**
 * Sheet III-b — the copy around one strategy page.
 *
 * The prose of a page comes from `src/data/strategy-pages.v1.json` and the row
 * from `src/data/strategies.v1.json`; this file holds what the page says
 * *around* them — the block headings, the moat-strip labels, the footer
 * navigation. Column names shared with the table (category, role, depth, the
 * examples) are read from `strategies.ts` so the two sheets use one word.
 */

export interface StrategyStrings {
  meta: {
    /** `{name}` is the strategy's name in this locale. */
    title: string;
  };
  /** "strategy" — completes the table's tagline: "sheet III · strategy 3 / 80". */
  eyebrow: string;
  /** How a moat link is qualified, in words — the twin's parenthesis and the strip's label. */
  kinds: {
    direct: string;
    via: string;
    conditional: string;
  };
  blocks: {
    moats: string;
    summary: string;
    how: string;
    logic: string;
    signals: string;
    build: string;
    erosion: string;
    solo: string;
    /** Lead-in to the matrix attributes of the direct moats, under the solo block. */
    soloAttrs: string;
    examples: string;
    /** Lead-in to the expanded cases under the examples. */
    cases: string;
    combos: string;
    tensions: string;
    source: string;
  };
  nav: {
    prev: string;
    next: string;
    all: string;
    twin: string;
  };
  /** Into the lanes view of sheet III, with this page's strategies lit. */
  map: {
    self: string;
    combos: string;
    tensions: string;
  };
}

export const strategyPage: Record<"en" | "ru", StrategyStrings> = {
  en: {
    meta: { title: "{name} — a strategy in the Moat Atlas" },
    eyebrow: "strategy",
    kinds: {
      direct: "direct",
      via: "via",
      conditional: "under conditions",
    },
    blocks: {
      moats: "Moats it grows into",
      summary: "Summary",
      how: "How it works",
      logic: "Why it holds — or only takes",
      signals: "Do you have it",
      build: "How to dig it",
      erosion: "How it erodes",
      solo: "Solo, without capital",
      soloAttrs: "What the matrix says of its moats",
      examples: "In nature, in business",
      cases: "Cases",
      combos: "Combines with",
      tensions: "Fights with",
      source: "Source",
    },
    nav: {
      prev: "Previous",
      next: "Next",
      all: "All 80 strategies",
      twin: "Markdown twin",
    },
    map: {
      self: "This strategy on the map →",
      combos: "Map this combination →",
      tensions: "Map this tension →",
    },
  },
  ru: {
    meta: { title: "{name} — стратегия в Атласе рвов" },
    eyebrow: "стратегия",
    kinds: {
      direct: "напрямую",
      via: "через",
      conditional: "при условии",
    },
    blocks: {
      moats: "В какие рвы вырастает",
      summary: "Кратко",
      how: "Как работает",
      logic: "Почему держит — или только занимает",
      signals: "Есть ли это у вас",
      build: "Как копать",
      erosion: "Как размывается",
      solo: "Соло, без капитала",
      soloAttrs: "Что матрица говорит о его рвах",
      examples: "В природе, в бизнесе",
      cases: "Случаи",
      combos: "Сочетается с",
      tensions: "Конфликтует с",
      source: "Источник",
    },
    nav: {
      prev: "Предыдущая",
      next: "Следующая",
      all: "Все 80 стратегий",
      twin: "Markdown-двойник",
    },
    map: {
      self: "Эта стратегия на карте →",
      combos: "Показать сочетание на карте →",
      tensions: "Показать конфликт на карте →",
    },
  },
};
