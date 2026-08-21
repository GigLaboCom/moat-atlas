export default {
  meta: {
    title: "Moat Atlas — the geology of defensibility",
    description:
      "An interactive cross-section of 35 defensibility mechanics: rock types, depths, digging tools, and a survey to measure your own moat.",
  },
  atlas: {
    eyebrow: "Heretic · geological survey",
    title: "Moat Atlas",
    subtitle:
      "35 mechanics that make a product hard to copy. The downward axis is always depth; the groupings re-lay the section along the other axes of the catalogue.",
    tabs: {
      atlas: { title: "Classification", sub: "sheet I · cross-section" },
      calc: { title: "Calculator", sub: "sheet II · your moat" },
    },
    ruler: {
      heading: "Depth · click to isolate",
      caption: "the tool and the years a rival needs · how many of the 35 lie that deep",
      1: { tool: "Shovel", years: "weeks — months" },
      2: { tool: "Excavator", years: "1–3 years" },
      3: { tool: "Drill rig", years: "3–10 years" },
      4: { tool: "Mine", years: "10+ years" },
    },
    legend: {
      grouping: "Grouping",
      rocks: "Rocks · click to isolate",
      foot: "downward axis is always depth<br>colour and shape — rock · thickness — capital",
    },
    axes: {
      rock: "Rock",
      depth: "Depth",
      cap: "Capital",
      solo: "Solo",
      ai: "AI",
      rent: "Rent",
    },
    /** The Sheet I view switch: the 3D section or the same 35 sheets as text. */
    view: {
      label: "View",
      scene: "Section",
      list: "List",
    },
    specimen: {
      empty_eyebrow: "No core taken",
      empty_title: "The section is waiting",
      empty_body:
        "Click a shaft — its core lands here: the passport from the survey matrix, the essence, how it is built and how it is bypassed.",
      eyebrow: "Core no. {n}",
      rock: "rock",
      close: "Clear selection",
      link: "Open the full sheet →",
      page: "Open as a page →",
      stats: {
        depth: "depth",
        cap: "capital",
        solo: "solo",
        ai: "AI",
        rent: "rent",
      },
    },
    status: {
      atlas: "Hover a shaft · click for a core · double-click for the sheet",
      grouping: "Grouping:",
      isolated: "Isolated rock:",
      isolatedDepth: "Isolated depth:",
    },
    /** The "how it works" dialog behind the button in the top-right corner. */
    guide: {
      open: "How it works",
      title: "How to read this",
      lede:
        "A moat is a hole. A hole has a rock — what the obstacle is actually made of; a depth — how long a rival has to dig; and a tool — what they dig with. All 35 mechanics of the catalogue hang in this section along those three axes.",
      sections: [
        {
          title: "The drawing",
          body:
            "One shaft is one mechanic. The downward axis is always depth: the lower a shaft hangs, the longer a competitor needs. Colour and cross-section shape are the rock, thickness is the capital the mechanic demands, and the number on the cap is the number of its sheet.",
        },
        {
          title: "Seven rocks",
          body:
            "What the obstacle is made of — and therefore who digs it. Human networks and minds are dug by other people: users, customers, time; money does not speed them up. Assets and rules are dug with money and patience. Mathematics is a choice of business model, locks are the customer accumulating themselves, position is a single strategic move.",
        },
        {
          title: "Four depths",
          body:
            "Level 1, the shovel, is weeks to months — those are wedges, not moats. Level 2, the excavator, is one to three years: the zone a solo founder can reach. Level 3, the drill rig, is three to ten years and capital is compulsory. Level 4, the mine, is ten years and up: time is the raw material there, and a mine cannot be dug faster by hiring more miners.",
        },
        {
          title: "Groupings",
          body:
            "The six buttons re-lay the same 35 shafts along another axis: rock, depth, capital, whether a solo founder can reach it, how AI is treating it, and whether it can be rented instead of dug. Nothing appears or disappears — only the rows change.",
        },
        {
          title: "Filters",
          body:
            "A rock in the legend and a level on the ruler each isolate their own group and dim the rest; the two are mutually exclusive, and taking a core clears both. Hovering a row of the ruler lights that level's stratum in the drawing.",
        },
        {
          title: "The list",
          body:
            "The switch in the corner lays the same 35 sheets out as text — name, passport, essence — grouped along the current axis and cut by the same filters. The address carries the whole setup — view, grouping, filter — so a link reproduces it exactly, and every sheet still opens as its own page.",
        },
        {
          title: "Controls",
          body:
            "Drag to rotate, wheel to zoom. Hovering a shaft reads its passport into the status line, a click takes a core into the card, a double-click opens the full sheet — how it is built, how it is bypassed, the verdict. On a touch screen the same three: drag turns the section, two fingers zoom, a tap takes a core and a second tap on the same shaft opens its sheet. Esc returns to the overview, and every core has its own address: /#moat-7.",
        },
        {
          title: "Sheet II",
          body:
            "The calculator measures the moat you actually have: twelve questions, four segments, an index and a depth on this same ruler. It stores nothing — the answers live in the link.",
        },
        {
          title: "The fine print",
          body:
            "The matrix is a considered judgement, not a measurement, and the sample figures exist only on the first thirteen sheets. And the main thing: moats are almost never stormed, they are devalued — which makes the “how it is bypassed” half of every sheet the load-bearing one.",
        },
      ],
      close: "Close",
    },
    hint: "drag — rotate · wheel — zoom · double-click — the sheet · esc — overview",
    loading: "Drilling the section…",
    fallback:
      "The 3D section needs WebGL. The full catalogue is available as a list.",
    fallbackLink: "Open the catalogue",
  },
  rocks: {
    networks: "Human networks",
    minds: "Minds",
    assets: "Assets",
    math: "Mathematics",
    rules: "Rules",
    locks: "Locks",
    position: "Position",
  },
  values: {
    depth: { 1: "1 · shovel", 2: "2 · excavator", 3: "3 · drill rig", 4: "4 · mine" },
    cap: { 1: "○ low", 2: "◐ medium", 3: "● high", 4: "◉ extreme" },
    solo: { yes: "✓ solo-reachable", partial: "~ partly", no: "✗ no" },
    ai: { resistant: "↑ AI-resistant", eroding: "→ eroding", "under-attack": "↓ under attack" },
    rent: { no: "✗ not for sale", partial: "~ partly", yes: "✓ rentable" },
  },
  catalogue: {
    meta: {
      title: "Catalogue — Moat Atlas",
      description: "All 35 defensibility mechanics as a sortable list: rock, depth, capital, solo, AI, rent.",
    },
    heading: "Catalogue",
    tagline: "35 sheets",
    intro: "The same matrix as the cross-section, flat. Every row opens its own sheet.",
    columns: {
      n: "No.",
      name: "Mechanic",
      rock: "Rock",
      depth: "Depth",
      cap: "Capital",
      solo: "Solo",
      ai: "AI",
      rent: "Rent",
    },
    backToAtlas: "← Back to the section",
  },
  sheet: {
    eyebrow: "Sheet",
    passport: "Passport",
    years: "Time to dig",
    essence: "Essence",
    build: "How it is built",
    bypass: "How it is bypassed",
    draft:
      "This sheet is a skeleton — the prose is still being surveyed. The passport below comes straight from the matrix.",
    verdict: "Verdict",
    sample: {
      title: "Sample",
      share: "Share of apps",
      noRate: "No-rate",
      median: "Median price",
      small: "small sample: n = {n}",
      note: "Figures from the canivibecodeit sample. No-rate is the share of apps carrying this tag that cannot be vibe-coded — a proxy for structural strength. Only the first thirteen mechanics were measured.",
    },
    showInAtlas: "Show in the section →",
    prev: "← Previous",
    next: "Next →",
  },
  calculator: {
    meta: {
      title: "Calculator — Moat Atlas",
      description: "Twelve questions that measure the depth of your own moat.",
    },
    heading: "Your moat",
    tagline: "sheet II",
    progress: "Question {current} / {total}",
    rockLabel: "rock:",
    note: "Each answer deepens its segment of the moat — twelve of them make the section.",
    readout: {
      eyebrow: "Section no.",
      index: "Index",
      depth: "Depth",
      verdict: "Verdict",
      empty: "—",
    },
    start: "Start the survey",
  },
  credits: {
    nav: "Who made this",
  },
  ui: {
    tagline: "The geology of defensibility",
    themeDark: "Dark",
    themeLight: "Light",
    langLabel: "Language",
    github: "Source on GitHub",
    skipToContent: "Skip to content",
    breadcrumbs: "Breadcrumbs",
    footer: {
      atlas: "Atlas",
      catalogue: "Catalogue",
      calculator: "Calculator",
      credits: "Who made this",
      cookiePolicy: "Cookie Policy",
      giglabo: "GigLabo ↗",
      updated: "Updated",
    },
  },
  /** Open Graph card — `npm run og`; the numbers come from src/data/moats.ts. */
  og: {
    stats: {
      moats: "mechanics",
      rocks: "rock types",
      depths: "depths",
    },
  },
  notFound: {
    title: "Page not found",
    description: "This shaft has not been drilled.",
    heading: "404",
    message: "Nothing at this depth. The page may have been moved or has not been surveyed yet.",
    home: "Back to the section",
  },
};
