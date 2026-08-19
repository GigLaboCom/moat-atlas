/**
 * The Open Graph card, as a standalone HTML document.
 *
 * Rendered by `scripts/generate-og-images.mjs` in headless Chromium at
 * 1200×630. Everything here is inline and offline: no webfonts, no external
 * images — the same system stacks and palette the site declares in
 * `src/layouts/Layout.astro`, so the card cannot drift from the dark theme.
 *
 * Copy comes from `src/i18n/translations/{en,ru}.ts` and the numbers from
 * `src/data/moats.ts`; nothing user-visible is written in this file.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Dark-theme tokens, mirrored from Layout.astro. */
const C = {
  earth: "#14100c",
  panel: "#18130e",
  line: "#3d3123",
  ink: "#ede3d1",
  inkDim: "#a8987f",
  inkFaint: "#6f6250",
};

const DISPLAY = 'Georgia, "Times New Roman", serif';
// Menlo leads the stack (the site puts ui-monospace first): SF Mono falls back
// glyph-by-glyph on Cyrillic and the RU card ends up with ragged word spacing.
const MONO = 'Menlo, ui-monospace, "Cascadia Mono", Consolas, "Liberation Mono", monospace';
const BODY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The favicon strata mark, scaled up. */
function mark() {
  return `<svg viewBox="0 0 32 32" width="46" height="46" aria-hidden="true">
    <rect x="4" y="7" width="4" height="9" fill="#2fbfa5"/>
    <rect x="10" y="7" width="4" height="18" fill="#d6a644"/>
    <rect x="16" y="7" width="4" height="13" fill="#9b76d9"/>
    <rect x="22" y="7" width="4" height="21" fill="#c0453a"/>
    <rect x="2" y="6" width="28" height="1" fill="${C.inkDim}"/>
  </svg>`;
}

/**
 * One specimen per moat: colour is the rock, width is the capital it takes.
 * Sorted by rock so each depth band reads as a stratum, not as noise.
 */
function chips(moats, rockColors, rockOrder) {
  return moats
    .slice()
    .sort((a, b) => rockOrder.indexOf(a.rock) - rockOrder.indexOf(b.rock) || a.n - b.n)
    .map((m) => {
      const width = Math.round(13 + m.capN * 7);
      return `<i class="chip" style="width:${width}px;background:${rockColors[m.rock]}"></i>`;
    })
    .join("");
}

/**
 * @param {object} args
 * @param {"en"|"ru"} args.lang
 * @param {object} args.t          default export of the locale dictionary
 * @param {object[]} args.moats    MOATS
 * @param {string[]} args.rockOrder ROCK_ORDER
 * @param {Record<string,string>} args.rockColors ROCK_COLORS
 * @param {number[]} args.depthLevels DEPTH_LEVELS
 * @param {(m: object, axis: string) => string} args.bucketOf
 * @param {string} args.domain
 */
export function renderOgHtml({ lang, t, moats, rockOrder, rockColors, depthLevels, bucketOf, domain }) {
  const bands = depthLevels
    .map((level) => {
      const inBand = moats.filter((m) => bucketOf(m, "depth") === String(level));
      const ruler = t.atlas.ruler[level];
      return `<div class="band">
        <div class="band-label">
          <span class="tool">${esc(ruler.tool)}</span>
          <span class="years">${esc(ruler.years)}</span>
        </div>
        <div class="chips">${chips(inBand, rockColors, rockOrder)}</div>
      </div>`;
    })
    .join("");

  const stats = [
    [moats.length, t.og.stats.moats],
    [rockOrder.length, t.og.stats.rocks],
    [depthLevels.length, t.og.stats.depths],
  ]
    .map(
      ([n, label]) =>
        `<li><b>${n}</b><span>${esc(label)}</span></li>`,
    )
    .join("");

  const legend = rockOrder
    .map(
      (key) =>
        `<li><i style="background:${rockColors[key]}"></i>${esc(t.rocks[key])}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>OG · ${esc(t.atlas.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px;
    background: ${C.earth}; color: ${C.ink};
    font-family: ${BODY};
    padding: 52px 60px 46px;
    display: flex; flex-direction: column;
    overflow: hidden; position: relative;
  }
  /* Strata hairlines behind everything, the way the section plate is ruled. */
  body::before {
    content: ""; position: absolute; inset: 0;
    background: repeating-linear-gradient(
      to bottom, transparent 0 62px, ${C.line} 62px 63px
    );
    opacity: 0.22;
  }
  body > * { position: relative; }

  header { display: flex; align-items: center; gap: 16px; }
  header .domain {
    margin-left: auto; font-family: ${MONO}; font-size: 17px;
    color: ${C.inkFaint}; letter-spacing: 0.02em;
  }

  main { flex: 1; display: flex; gap: 52px; align-items: center; padding: 34px 0; }

  .copy { width: 560px; }
  .eyebrow {
    font-family: ${MONO}; font-size: 16px; letter-spacing: 0.16em;
    text-transform: uppercase; color: #d6a644;
  }
  h1 {
    font-family: ${DISPLAY}; font-weight: 400; font-size: 82px;
    line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 20px;
  }
  .tagline { font-size: 26px; line-height: 1.35; color: ${C.inkDim}; }

  .stats { display: flex; gap: 34px; margin-top: 34px; list-style: none; }
  .stats li { display: flex; align-items: baseline; gap: 9px; }
  .stats b { font-family: ${DISPLAY}; font-weight: 400; font-size: 40px; }
  .stats span { font-family: ${MONO}; font-size: 15px; color: ${C.inkFaint}; }

  .plate {
    flex: 1; align-self: stretch;
    background: ${C.panel}; border: 1px solid ${C.line}; border-radius: 4px;
    padding: 18px 20px 20px; display: flex; flex-direction: column;
  }
  .plate-head {
    font-family: ${MONO}; font-size: 13px; letter-spacing: 0.18em;
    text-transform: uppercase; color: ${C.inkFaint};
    padding-bottom: 12px; border-bottom: 1px solid ${C.line};
  }
  .band {
    flex: 1; display: flex; align-items: center; gap: 16px;
    border-bottom: 1px solid ${C.line}; padding: 10px 0;
  }
  .band:last-child { border-bottom: 0; }
  .band-label { width: 116px; flex: none; font-family: ${MONO}; }
  .band-label .tool { display: block; font-size: 15px; color: ${C.ink}; }
  .band-label .years { display: block; font-size: 12px; color: ${C.inkFaint}; margin-top: 3px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px 5px; align-content: center; }
  .chip { display: block; height: 13px; border-radius: 2px; }

  .legend { display: flex; gap: 26px; list-style: none; font-family: ${MONO}; font-size: 15px; color: ${C.inkDim}; }
  .legend li { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .legend i { width: 11px; height: 11px; border-radius: 2px; flex: none; }
</style>
</head>
<body>
  <header>
    ${mark()}
    <span class="domain">${esc(domain)}</span>
  </header>

  <main>
    <section class="copy">
      <p class="eyebrow">${esc(t.atlas.eyebrow)}</p>
      <h1>${esc(t.atlas.title)}</h1>
      <p class="tagline">${esc(t.ui.tagline)}</p>
      <ul class="stats">${stats}</ul>
    </section>

    <section class="plate">
      <div class="plate-head">${esc(t.atlas.ruler.heading)}</div>
      ${bands}
    </section>
  </main>

  <ul class="legend">${legend}</ul>
</body>
</html>`;
}
