/**
 * The lanes, rendered at build time as one static SVG — `/strategies/lanes.svg`.
 *
 * Same data, same lane order, same role states as the HTML map; it exists so
 * the map can be shared, printed and opened on its own. Two consequences shape
 * the code: an SVG used as an image has no CSS custom properties, so the light
 * palette is written out here from the tokens in `Layout.astro`; and it has no
 * line-breaking, so every string is measured and laid out by hand.
 *
 * Text stays real `<text>` — never paths — so the file remains searchable and
 * small, and every card is an `<a>` to the strategy's page, so the drawing is
 * navigable when opened directly. The spec's fallback is taken deliberately:
 * six equal columns per lane rather than the HTML's wrapping grid, because
 * legibility beats fidelity to a layout the SVG cannot reflow anyway.
 */
import { STRATEGY_COUNT, type MoatLink, type Strategy } from "../data/strategies";
import { getLocalizedPath, getTranslations } from "../i18n/index";
import { strategiesPage } from "../i18n/translations/pages/strategies";
import type { Locale } from "../i18n/config";
import { HOLD_COUNT, LANES, LANE_COUNT, cardExample } from "./lanes";
import { categoryName, moatMark, nameOf } from "./strategies";
import { siteUrl } from "./url";

/* The light palette of `Layout.astro`, written out: an SVG loaded as an image
   sees no custom properties. Keep in step with the tokens there. */
const INK = "#2a2118";
const INK_DIM = "#6b5b45";
const INK_FAINT = "#948467";
const LINE = "#cdbfa6";
const EARTH = "#f2ece0";
const PANEL = "#fffdf8";

const DISPLAY = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', monospace";
const BODY = "-apple-system, 'Segoe UI', Roboto, sans-serif";

const W = 1200;
const PAD = 32;
const LABEL_W = 150;
const GUTTER = 18;
const COLS = 6;
const GAP = 8;
const CARD_H = 62;
const LANE_PAD = 14;
const HEAD_H = 96;
const FOOT_H = 34;

const TRACK = W - PAD * 2 - LABEL_W - GUTTER;
const CARD_W = Math.floor((TRACK - GAP * (COLS - 1)) / COLS);
const INNER = CARD_W - 16;

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Rough advance width — enough to decide where a name breaks or is cut. */
const width = (s: string, size: number): number => s.length * size * 0.54;

/** A name over at most two lines, cut with an ellipsis rather than overflowing. */
function wrap(name: string, size: number, max: number): string[] {
  if (width(name, size) <= max) return [name];
  const words = name.split(" ");
  if (words.length > 1) {
    for (let i = words.length - 1; i > 0; i--) {
      const head = words.slice(0, i).join(" ");
      const tail = words.slice(i).join(" ");
      if (width(head, size) <= max && width(tail, size) <= max) return [head, tail];
    }
  }
  const fit = Math.max(1, Math.floor(max / (size * 0.54)) - 1);
  return [`${name.slice(0, fit)}…`];
}

/**
 * One line of text, styled by class. The classes are declared once in the
 * document's own `<style>` — an internal stylesheet travels with the file, so
 * it works when the SVG is used as an image, unlike the site's custom
 * properties, and it keeps the drawing well under the size the spec allows.
 */
function text(x: number, y: number, body: string, cls: string): string {
  return `<text x="${x}" y="${y}" class="${cls}">${esc(body)}</text>`;
}

const STYLE = [
  `text{font-family:${BODY}}`,
  `.d{font-family:${DISPLAY}}`,
  `.m{font-family:${MONO}}`,
  `.h1{font-size:26px;fill:${INK}}`,
  `.h2{font-size:13px;fill:${INK_DIM}}`,
  `.sum{font-size:11px;fill:${INK_DIM}}`,
  `.lab{font-size:14px;fill:${INK}}`,
  `.cnt{font-size:10px;fill:${INK_DIM}}`,
  `.n{font-size:11.5px;font-weight:500;fill:${INK}}`,
  `.mut{fill:${INK_DIM}}`,
  `.ex{font-size:10px;fill:${INK_DIM}}`,
  `.ch{font-size:10.5px;fill:${INK}}`,
  `.dim{fill:${INK_DIM}}`,
  `.q{font-size:10px;fill:${INK}}`,
  `.src{font-size:10px;fill:${INK_FAINT}}`,
  `rect.c{fill:none;stroke:${LINE}}`,
  `rect.hold{fill:${PANEL};stroke:${INK}}`,
  `line{stroke:${LINE}}`,
].join("");

/** The chips of one card, laid left to right until the width runs out. */
function chips(x: number, y: number, moats: MoatLink[]): string {
  const out: string[] = [];
  let dx = 0;
  for (const m of moats) {
    const label = moatMark(m);
    const w = width(label, 10.5) + 8;
    if (dx + w > INNER) {
      out.push(text(x + dx, y, "…", "m ch dim"));
      break;
    }
    out.push(text(x + dx, y, label, m.kind === "direct" ? "m ch" : "m ch dim"));
    dx += w;
  }
  return out.join("");
}

function card(locale: Locale, s: Strategy, x: number, y: number, timing: boolean): string {
  const hold = s.role === "hold";
  const muted = s.role !== "hold" && s.role !== "position";
  const p = strategiesPage[locale];
  const lines = wrap(nameOf(s, locale), 11.5, INNER);
  const example = timing ? p.lanes.entry : cardExample(s);
  const href = siteUrl(getLocalizedPath(`/strategies/${s.slug}/`, locale));

  const body = [
    `<rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" class="${hold ? "c hold" : "c"}"/>`,
    ...lines.map((line, i) => text(x + 8, y + 16 + i * 13, line, muted ? "n mut" : "n")),
    example ? text(x + 8, y + (lines.length > 1 ? 42 : 31), example, "ex") : "",
    s.moats.length ? chips(x + 8, y + CARD_H - 9, s.moats) : "",
    s.disputed ? text(x + CARD_W - 12, y + 13, "?", "m q") : "",
  ].join("");

  return `<a href="${esc(href)}"><title>${esc(nameOf(s, locale))}</title>${body}</a>`;
}

/** The whole map: 1200 wide, as tall as thirteen lanes of six columns need. */
export function renderLanesSvg(locale: Locale): string {
  const t = getTranslations(locale);
  const p = strategiesPage[locale];
  const rowsOf = (n: number) => Math.ceil(n / COLS);

  const heights = LANES.map((lane) => {
    const rows = rowsOf(lane.cards.length);
    return Math.max(rows * CARD_H + (rows - 1) * GAP, 52) + LANE_PAD * 2;
  });
  const H = HEAD_H + heights.reduce((a, b) => a + b, 0) + FOOT_H;

  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.lanes.region)}">`,
    `<title>${esc(t.strategies.heading)} — ${esc(p.lanes.view.map)}</title>`,
    `<style>${STYLE}</style>`,
    `<rect width="${W}" height="${H}" fill="${EARTH}"/>`,
    text(PAD, 44, t.strategies.heading, "d h1"),
    text(PAD, 66, p.subtitle, "d h2"),
    text(
      PAD,
      HEAD_H - 12,
      p.lanes.summary
        .replace("{total}", String(STRATEGY_COUNT))
        .replace("{hold}", String(HOLD_COUNT))
        .replace("{lanes}", String(LANE_COUNT)),
      "m sum",
    ),
  ];

  let y = HEAD_H;
  LANES.forEach((lane, i) => {
    out.push(`<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}"/>`);
    const top = y + LANE_PAD;
    out.push(
      text(PAD, top + 14, categoryName(lane.cat, locale), "d lab"),
      text(PAD, top + 30, `· ${lane.cards.length}`, "m cnt"),
      text(PAD, top + 44, p.lanes.hold.replace("{n}", String(lane.holds)), "m cnt"),
    );
    lane.cards.forEach(({ s }, j) => {
      const col = j % COLS;
      const row = Math.floor(j / COLS);
      out.push(
        card(
          locale,
          s,
          PAD + LABEL_W + GUTTER + col * (CARD_W + GAP),
          top + row * (CARD_H + GAP),
          lane.cat.slug === "timing",
        ),
      );
    });
    y += heights[i];
  });

  out.push(
    `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}"/>`,
    text(PAD, y + 22, `${p.attribution} ${siteUrl(getLocalizedPath("/strategies/", locale))}`, "m src"),
    "</svg>",
  );
  return out.join("\n");
}
