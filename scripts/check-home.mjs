#!/usr/bin/env node
/**
 * The home page's acceptance gates that a finished build can answer on its
 * own — the copy, the sample card's arithmetic, the `/about/` page and the
 * twins — in both locales. The behaviour gates (the fold, the hand-off, the
 * first contact, the network) need a browser: `scripts/check-home-browser.mjs`.
 *
 *   G2  no forbidden word above `#section` (the reading-guide vocabulary the
 *       hero and the steps must not lean on), both locales
 *   G3  the sample card's code decodes to answers whose score is the index
 *       and depth the card shows, and its link carries that code
 *   G7  `/about/` in both locales carries every guide section; the home page
 *       renders none of them as a top-level section; sitemap, llms.txt and
 *       twin agree
 *   G9  the home twin opens with the three steps, still carries the matrix
 *       table and ends with the fine print; the about twin exists
 *   +   one h1, the counts in the copy are the data's, the JSON-LD carries
 *       the HowTo and the calculator
 *
 * Usage: node scripts/check-home.mjs [DIST]     (default ./dist)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = process.argv[2] ?? "dist";
const LOCALES = [
  { code: "en", prefix: "" },
  { code: "ru", prefix: "/ru" },
];

let failures = 0;
const bad = (msg) => {
  console.log(`  ✗ ${msg}`);
  failures++;
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

const read = (p) => readFileSync(join(DIST, p), "utf8");
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#38;/g, "&")
    .replace(/&amp;/g, "&");
/** Does the markup carry `<tag …>text</tag>` — Astro stamps every tag with a scope attribute. */
const hasElement = (html, tag, content, attrs = "") =>
  new RegExp(`<${tag}${attrs}[^>]*>\\s*${content.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*</${tag}>`).test(html);

const text = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ");

/* ── the source, bundled the way the skill checker bundles it ───────────── */
const { build } = await import(pathToFileURL(join(process.cwd(), "node_modules/esbuild/lib/main.js")));
const entry = `
  export * as survey from "./src/data/survey.ts";
  export * as sample from "./src/data/sample-result.ts";
  export { MOAT_COUNT, DEPTH_LEVELS } from "./src/data/moats.ts";
  export { STRATEGY_COUNT } from "./src/data/strategies.ts";
  export { GUIDE_KEYS, GUIDE_READING_KEYS, GUIDE_FINEPRINT_KEY } from "./src/lib/guide.ts";
  export { homePage } from "./src/i18n/translations/pages/home.ts";
  export { default as en } from "./src/i18n/translations/en.ts";
  export { default as ru } from "./src/i18n/translations/ru.ts";
`;
const bundled = await build({
  stdin: { contents: entry, resolveDir: process.cwd(), loader: "ts" },
  bundle: true, format: "esm", write: false, platform: "neutral", logLevel: "silent",
});
const src = await import(
  "data:text/javascript;base64," + Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
const dict = { en: src.en, ru: src.ru };

/* The vocabulary the hero and the steps must not lean on — §5 of the spec,
   stems for Russian so the cases are caught. */
const FORBIDDEN = {
  en: [/\bgeolog/i, /\bdefensibilit/i, /\bcore\b/i, /\bstrat(um|a)\b/i],
  ru: [/геолог/i, /защищённост/i, /защищенност/i, /\bкерн/i, /\bпласт/i],
};

const pages = {};
for (const { code, prefix } of LOCALES) pages[code] = read(`${prefix}/index.html`);

// ── G2 ─────────────────────────────────────────────────────────────────────
console.log("== G2: no forbidden word above #section");
for (const { code } of LOCALES) {
  const html = pages[code];
  const cut = html.indexOf('id="section"');
  if (cut === -1) {
    bad(`${code}: no #section on the home page`);
    continue;
  }
  const bodyStart = html.indexOf("<body");
  const above = text(html.slice(bodyStart, cut));
  const hits = FORBIDDEN[code].map((re) => above.match(re)?.[0]).filter(Boolean);
  if (hits.length) bad(`${code}: forbidden above #section — ${hits.join(", ")}`);
  else ok(`${code}: nothing forbidden above #section`);
}

// ── G3 ─────────────────────────────────────────────────────────────────────
console.log("== G3: the sample card is the real result of its own code");
for (const { code } of LOCALES) {
  const html = pages[code];
  const card = html.match(/<div class="card result[^"]*"[^>]*data-code="([^"]+)"[^>]*data-index="(\d+)"[^>]*data-depth="(\d)"/);
  if (!card) {
    bad(`${code}: no sample card with data-code/index/depth`);
    continue;
  }
  const [, sampleCode, index, depth] = card;
  const answers = src.survey.decodeAnswers(sampleCode);
  if (!answers) {
    bad(`${code}: the card's code ${sampleCode} does not decode`);
    continue;
  }
  const r = src.survey.scoreSurvey(answers);
  if (String(r.index) !== index || String(r.depth) !== depth) {
    bad(`${code}: card says ${index}/${depth}, the scoring says ${r.index}/${r.depth}`);
  } else ok(`${code}: code ${sampleCode} → index ${r.index}, depth ${r.depth}, as the card says`);
  if (sampleCode !== src.sample.SAMPLE_CODE) bad(`${code}: the card's code is not src/data/sample-result.ts's`);
  const link = html.match(/<a class="open[^"]*" href="([^"]+)"/);
  if (!link || !link[1].endsWith(`#s=${sampleCode}`)) bad(`${code}: the card's link does not carry #s=${sampleCode}`);
  else ok(`${code}: the card links to ${link[1]}`);
  const cardHtml = html.slice(html.indexOf("card result"), html.indexOf('class="open'));
  for (const n of r.holding) {
    if (!hasElement(cardHtml, "span", `#${n}`, ' class="n"')) bad(`${code}: mechanic #${n} of the result is not a chip on the card`);
  }
  const chips = cardHtml.match(/<span class="n"[^>]*>#\d+<\/span>/g)?.length ?? 0;
  if (chips !== r.holding.length) bad(`${code}: ${chips} chips on the card, the result holds ${r.holding.length}`);
  else ok(`${code}: the ${chips} mechanics it holds are chips on the card`);
}

// ── G7 ─────────────────────────────────────────────────────────────────────
console.log("== G7: /about/ carries the guide; the home page no longer does");
const sitemap = read("sitemap.xml");
const llms = read("llms.txt");
for (const { code, prefix } of LOCALES) {
  const path = `${prefix}/about/index.html`;
  if (!existsSync(join(DIST, path))) {
    bad(`${code}: no ${path}`);
    continue;
  }
  const about = read(path);
  const guide = dict[code].atlas.guide;
  const missing = src.GUIDE_KEYS.filter((k) => !hasElement(about, "h2", guide.sections[k].title));
  if (missing.length) bad(`${code}: /about/ lacks ${missing.join(", ")}`);
  else ok(`${code}: /about/ carries all ${src.GUIDE_KEYS.length} guide sections`);
  if (!text(about).includes(guide.lede.slice(0, 40))) bad(`${code}: /about/ lacks the lede`);

  const home = pages[code];
  const asH2 = src.GUIDE_READING_KEYS.filter((k) => hasElement(home, "h2", guide.sections[k].title));
  if (asH2.length) bad(`${code}: the home page still renders ${asH2.join(", ")} as a top-level section`);
  const inDetails = src.GUIDE_READING_KEYS.filter((k) => !hasElement(home, "dt", guide.sections[k].title));
  if (inDetails.length) bad(`${code}: the home page's guide lacks ${inDetails.join(", ")}`);
  else ok(`${code}: the seven reading sections are folded under the section`);
  if (!home.includes(`id="guide"`) || !home.includes("<details")) bad(`${code}: the guide is not a <details>`);
  const fine = guide.sections[src.GUIDE_FINEPRINT_KEY];
  if (!hasElement(home, "h2", fine.title, ' id="fineprint-title"')) bad(`${code}: the fine print is not at the foot of the home page`);

  const url = `${prefix}/about/`;
  if (!new RegExp(`<loc>https?://[^<]+${url.replace(/\//g, "\\/")}</loc>`).test(sitemap)) bad(`${code}: ${url} is not in the sitemap`);
  if (!llms.includes(`${url})`)) bad(`${code}: ${url} is not in llms.txt`);
  if (!existsSync(join(DIST, `${prefix}/about/index.md`))) bad(`${code}: no twin for ${url}`);
  else ok(`${code}: ${url} in sitemap, llms.txt, and twinned`);
}

// ── G9 ─────────────────────────────────────────────────────────────────────
console.log("== G9: the home twin, in the page's order");
for (const { code, prefix } of LOCALES) {
  const twin = read(`${prefix}/index.md`);
  const h2s = [...twin.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const steps = src.homePage[code].steps.title;
  if (h2s[0] !== steps) bad(`${code}: the twin's first H2 is "${h2s[0]}", expected "${steps}"`);
  else ok(`${code}: the twin opens with "${steps}"`);
  const c = dict[code].catalogue.columns;
  if (!twin.includes(`| ${c.n} | ${c.name} |`)) bad(`${code}: the twin lost the catalogue table`);
  const rows = twin.match(/^\| \d+ \| \[/gm)?.length ?? 0;
  if (rows !== src.MOAT_COUNT) bad(`${code}: the twin's table has ${rows} rows, expected ${src.MOAT_COUNT}`);
  const fine = dict[code].atlas.guide.sections[src.GUIDE_FINEPRINT_KEY].title;
  if (h2s[h2s.length - 2] !== fine) bad(`${code}: the fine print is not the twin's last section before Related (${h2s.slice(-2).join(" / ")})`);
  const guideTitle = dict[code].atlas.guide.title;
  if (!h2s.includes(guideTitle)) bad(`${code}: the twin lacks the reading guide`);
  const about = read(`${prefix}/about/index.md`);
  const aboutH2s = [...about.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const guide = dict[code].atlas.guide;
  const lacking = src.GUIDE_KEYS.filter((k) => !aboutH2s.includes(guide.sections[k].title));
  if (lacking.length) bad(`${code}: the about twin lacks ${lacking.join(", ")}`);
  else ok(`${code}: the about twin carries every section`);
}

// ── the rest ────────────────────────────────────────────────────────────────
console.log("== one h1, live counts, the graph");
for (const { code } of LOCALES) {
  const html = pages[code];
  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) bad(`${code}: ${h1s} h1 elements on the home page`);
  const hero = text(html.slice(html.indexOf('class="hero'), html.indexOf('class="sample')));
  const n = { q: src.survey.QUESTION_COUNT, m: src.MOAT_COUNT, l: src.DEPTH_LEVELS.length };
  for (const [label, value] of [["questions", n.q], ["mechanics", n.m], ["levels", n.l]]) {
    if (!new RegExp(`\\b${value}\\b`).test(hero)) bad(`${code}: the hero does not carry the ${label} count ${value}`);
  }
  const teaser = text(html.slice(html.indexOf('class="teaser'), html.indexOf('class="fineprint')));
  if (!teaser.includes(String(src.STRATEGY_COUNT))) bad(`${code}: the teaser does not carry ${src.STRATEGY_COUNT}`);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const graph = ld ? JSON.parse(ld[1])["@graph"] : [];
  const howTo = graph.find((node) => node["@type"] === "HowTo");
  if (!howTo) bad(`${code}: no HowTo in the home graph`);
  else if (howTo.step?.length !== 3) bad(`${code}: the HowTo has ${howTo.step?.length} steps`);
  if (!graph.some((node) => node["@type"] === "WebApplication")) bad(`${code}: no WebApplication in the home graph`);
  const description = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1];
  const sub = html.match(/<p class="sub"[^>]*>([\s\S]*?)<\/p>/)?.[1];
  const subMatches = description && sub && decode(description) === decode(sub).trim();
  if (!subMatches) bad(`${code}: og:description is not the hero sub`);
  if (h1s === 1 && howTo?.step?.length === 3 && subMatches) ok(`${code}: one h1, counts live, HowTo + WebApplication, og:description = hero sub`);
}

console.log(failures ? `== ${failures} failure(s)` : "== clean");
process.exit(failures ? 1 : 0);
