/**
 * Sheet III — the copy around the strategies table.
 *
 * The rows themselves (names, gists, roles, notes) come from
 * `src/data/strategies.v1.json`, which is bilingual by construction; this file
 * holds everything the page says *about* the table — the intro, the column
 * heads, the filter bar, the markers, the legend and the attribution.
 */

export interface StrategiesStrings {
  subtitle: string;
  intro: string;
  /** Rendered under the table; the source URL comes from the dataset. */
  attribution: string;
  columns: {
    strategy: string;
    category: string;
    gist: string;
    nature: string;
    business: string;
    role: string;
    moats: string;
    depth: string;
  };
  filters: {
    label: string;
    category: string;
    role: string;
    /** The one-click preset that sets role=hold. */
    holds: string;
    moat: string;
    moatAny: string;
    search: string;
    searchPlaceholder: string;
    clear: string;
    /** "{n} of {total}" — the visible row count. */
    count: string;
    /** Announced when the filters leave nothing. */
    empty: string;
  };
  sort: {
    label: string;
    asc: string;
    desc: string;
  };
  markers: {
    /** The "?" badge on a disputed row. */
    disputed: string;
    /** The "i" affordance on a row that carries a note. */
    note: string;
    /** Trailing line in the Gist cell of every Timing row. */
    timing: string;
    /** Prefix on a moat the strategy reaches only through another. */
    via: string;
    /** Suffix on a moat the strategy reaches only under a condition. */
    conditional: string;
    /** Screen-reader text for a "→ #N" link. */
    viaLabel: string;
    /** Screen-reader text for a "#N?" link. */
    conditionalLabel: string;
  };
  legend: {
    title: string;
    /** In the twin, the heading of the notes list under a category table. */
    notes: string;
    disputedNote: string;
  };
  backToAtlas: string;
}

export const strategiesPage: Record<"en" | "ru", StrategiesStrings> = {
  en: {
    subtitle: "How things win — and which of it becomes a moat",
    intro:
      "The 80 strategies come from kepano's essay “Many ways to win” — a taxonomy of how organisms, products and companies gain an edge. The essay's point is that winners run a narrow, unusual combination of strategies. The Atlas adds one layer on top: which of these strategies grow into a moat, and which only take a position without holding it. That layer — the Role and Moats columns — is the Atlas's reading, not the essay's.",
    attribution:
      "Strategy taxonomy © kepano (Steph Ango), paraphrased with attribution. Role and moat mapping © Moat Atlas.",
    columns: {
      strategy: "Strategy",
      category: "Category",
      gist: "Gist",
      nature: "Nature",
      business: "Business",
      role: "Role",
      moats: "Moats",
      depth: "Depth",
    },
    filters: {
      label: "Filters",
      category: "Category",
      role: "Role",
      holds: "Only what holds",
      moat: "Moat",
      moatAny: "any moat",
      search: "Search",
      searchPlaceholder: "name, gist, example…",
      clear: "Clear",
      count: "{n} of {total}",
      empty: "Nothing matches — clear a filter.",
    },
    sort: {
      label: "Sort by",
      asc: "ascending",
      desc: "descending",
    },
    markers: {
      disputed: "Mapping is debatable — see note",
      note: "Note",
      timing: "Entry, not defense",
      via: "→",
      conditional: "?",
      viaLabel: "via",
      conditionalLabel: "under conditions",
    },
    legend: {
      title: "Roles",
      notes: "Notes",
      disputedNote: "disputed",
    },
    backToAtlas: "← Back to the section",
  },
  ru: {
    subtitle: "Как побеждают — и что из этого становится рвом",
    intro:
      "80 стратегий взяты из эссе kepano «Many ways to win» — таксономии того, как организмы, продукты и компании получают преимущество. Мысль эссе: побеждает узкая, необычная комбинация стратегий. Атлас добавляет один слой сверху: какие из этих стратегий вырастают в ров, а какие лишь занимают позицию, не удерживая её. Этот слой — колонки «Роль» и «Рвы» — прочтение Атласа, а не эссе.",
    attribution:
      "Таксономия стратегий © kepano (Steph Ango), пересказана с указанием источника. Роли и маппинг на рвы © Атлас рвов.",
    columns: {
      strategy: "Стратегия",
      category: "Категория",
      gist: "Суть",
      nature: "Природа",
      business: "Бизнес",
      role: "Роль",
      moats: "Рвы",
      depth: "Глубина",
    },
    filters: {
      label: "Фильтры",
      category: "Категория",
      role: "Роль",
      holds: "Только то, что держит",
      moat: "Ров",
      moatAny: "любой ров",
      search: "Поиск",
      searchPlaceholder: "название, суть, пример…",
      clear: "Сбросить",
      count: "{n} из {total}",
      empty: "Ничего не подходит — снимите фильтр.",
    },
    sort: {
      label: "Сортировка",
      asc: "по возрастанию",
      desc: "по убыванию",
    },
    markers: {
      disputed: "Маппинг спорный — см. заметку",
      note: "Заметка",
      timing: "Вход, не защита",
      via: "→",
      conditional: "?",
      viaLabel: "через",
      conditionalLabel: "при условии",
    },
    legend: {
      title: "Роли",
      notes: "Заметки",
      disputedNote: "спорно",
    },
    backToAtlas: "← Назад к разрезу",
  },
};
