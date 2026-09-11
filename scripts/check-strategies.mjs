#!/usr/bin/env node
/**
 * Sheet III's acceptance gates, run over a finished build.
 *
 * Every check re-derives its expectation from `src/data/strategies.v1.json`
 * and compares it with what `dist/` actually says — the page, the twins, the
 * 35 moat sheets — in both locales. Nothing here trusts a count typed into a
 * test: the total is the one literal the spec allows.
 *
 *   G2  the page carries every strategy row and every category group row
 *   G4  every moat link on the page resolves; every strategy link on a moat
 *       sheet names a row that exists (the link now leads to the strategy's
 *       own page, `/strategies/<slug>/`; the row anchor form is still accepted)
 *   G5  each moat sheet's back-links equal the set derived from the JSON
 *   G6  the twin has every row, and every Moats cell equals the JSON
 *   G8  the Russian page uses the Russian names; the two twins agree
 *   G11 the disputed rows carry the marker and their note
 *
 * Then the lanes view — the same eighty rows as a map, on the same page:
 *
 *   L1  thirteen lanes in essay order, eighty cards, the counts of the JSON
 *   L2  every card's role is the JSON's, and the accent is on the holds alone
 *   L3  every card, chip and lane label leads somewhere that exists
 *   L6  the inbound links: from every moat sheet that has strategies, and from
 *       every strategy page, with exactly the partners of the prose dataset
 *   L7  all of the above is in the static HTML — no script builds a card
 *   L8  the static SVG of the map, both locales
 *
 * L4 (what an address lights) and L5 (the round trip between the two views)
 * are behaviour, not markup: they are proven in a browser, not here.
 *
 * Usage: node scripts/check-strategies.mjs [DIST]     (default ./dist)
 * Exit 1 on the first class of failure, with every offender listed.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = process.argv[2] ?? "dist";
const TOTAL = 80;
const data = JSON.parse(readFileSync("src/data/strategies.v1.json", "utf8"));
const prose = JSON.parse(readFileSync("src/data/strategy-pages.v1.json", "utf8")).pages;
const moatNumbers = [...new Set(data.strategies.flatMap((s) => s.moats.map((m) => m.n)))];
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
const strip = (html) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

const mark = (m) => (m.kind === "via" ? `→ #${m.n}` : m.kind === "conditional" ? `#${m.n}?` : `#${m.n}`);
const expectedMoats = (s) => (s.moats.length ? s.moats.map(mark).join(", ") : "—");

// ── G2 ─────────────────────────────────────────────────────────────────────
console.log("== G2: row and group counts on the page");
const pages = {};
for (const { code, prefix } of LOCALES) {
  const html = read(`${prefix}/strategies/index.html`);
  pages[code] = html;
  const rows = html.match(/<tr id="[^"]+" class="strategy/g)?.length ?? 0;
  const groups = html.match(/<tr class="group"/g)?.length ?? 0;
  if (rows !== TOTAL) bad(`${code}: ${rows} strategy rows, expected ${TOTAL}`);
  else ok(`${code}: ${rows} strategy rows`);
  if (groups !== data.categories.length) {
    bad(`${code}: ${groups} group rows, expected ${data.categories.length}`);
  } else ok(`${code}: ${groups} group rows`);
  const ids = new Set([...html.matchAll(/<tr id="([^"]+)" class="strategy/g)].map((m) => m[1]));
  const missing = data.strategies.filter((s) => !ids.has(s.slug)).map((s) => s.slug);
  if (missing.length) bad(`${code}: rows missing for ${missing.join(", ")}`);
}

// ── G4 ─────────────────────────────────────────────────────────────────────
console.log("== G4: links resolve both ways");
for (const { code, prefix } of LOCALES) {
  const links = [...pages[code].matchAll(/href="([^"]*\/moats\/(\d+)\/)"/g)];
  const dead = links.filter(([, href]) => !existsSync(join(DIST, href, "index.html")));
  const wrongLocale = links.filter(([, href]) => !href.startsWith(`${prefix}/moats/`));
  if (dead.length) bad(`${code}: dead moat links ${[...new Set(dead.map((d) => d[1]))].join(", ")}`);
  else ok(`${code}: ${links.length} moat links on the page resolve`);
  if (wrongLocale.length) bad(`${code}: moat links in the wrong locale ${wrongLocale[0][1]}`);

  const slugs = new Set(data.strategies.map((s) => s.slug));
  const rowIds = new Set([...pages[code].matchAll(/<tr id="([^"]+)" class="strategy/g)].map((m) => m[1]));
  let anchors = 0;
  const dangling = [];
  for (const n of moatNumbers) {
    const sheet = read(`${prefix}/moats/${n}/index.html`);
    for (const [, href, anchor, dir] of sheet.matchAll(/href="([^"]*\/strategies\/)(?:#([^"]+)|([^"/]+)\/)"/g)) {
      const slug = anchor ?? dir;
      anchors++;
      if (!href.startsWith(`${prefix}/strategies/`)) dangling.push(`#${n} → ${href} (locale)`);
      if (!slugs.has(slug) || !rowIds.has(slug)) dangling.push(`#${n} → #${slug}`);
    }
  }
  if (dangling.length) bad(`${code}: dangling strategy anchors: ${dangling.join(", ")}`);
  else ok(`${code}: ${anchors} strategy anchors on the moat sheets match a row`);
}

// ── G5 ─────────────────────────────────────────────────────────────────────
console.log("== G5: back-links on every moat sheet equal the derived set");
for (const { code, prefix } of LOCALES) {
  let checked = 0;
  for (let n = 1; n <= 35; n++) {
    const sheet = read(`${prefix}/moats/${n}/index.html`);
    const block = sheet.match(/<section class="backlinks[^>]*>([\s\S]*?)<\/section>/)?.[1];
    if (!block) {
      bad(`${code}: moat #${n} has no back-link block`);
      continue;
    }
    const expected = { direct: [], via: [], conditional: [] };
    for (const s of data.strategies) for (const m of s.moats) if (m.n === n) expected[m.kind].push(s.slug);

    // The three lists, in the order the component renders them.
    const lists = [...block.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g)].map((m) =>
      [...m[1].matchAll(/data-strategy="([^"]+)"/g)].map((x) => x[1]),
    );
    const kinds = ["direct", "via", "conditional"].filter((k) => expected[k].length);
    const actual = Object.fromEntries(kinds.map((k, i) => [k, lists[i] ?? []]));
    for (const k of kinds) {
      const want = expected[k].join(",");
      const got = (actual[k] ?? []).join(",");
      if (want !== got) bad(`${code}: moat #${n} ${k}: expected [${want}] got [${got}]`);
    }
    if (lists.length !== kinds.length) bad(`${code}: moat #${n} renders ${lists.length} lists, expected ${kinds.length}`);
    const notice = /class="none"/.test(block);
    if (!expected.direct.length && !notice) bad(`${code}: moat #${n} has no direct strategy but no notice`);
    if (expected.direct.length && notice) bad(`${code}: moat #${n} has direct strategies yet shows the notice`);
    checked++;
  }
  ok(`${code}: ${checked} moat sheets compared`);
}

// ── G6 ─────────────────────────────────────────────────────────────────────
console.log("== G6: the twin carries every row and the same Moats cells");
const twinRows = {};
for (const { code, prefix } of LOCALES) {
  const twin = read(`${prefix}/strategies/index.md`);
  const rows = twin
    .split("\n")
    .filter((l) => l.startsWith("| ") && !l.startsWith("| Strategy") && !l.startsWith("| Стратегия") && !/^\|[-|]+\|$/.test(l))
    .map((l) => l.slice(1, -1).split(" | ").map((c) => c.trim()));
  twinRows[code] = rows;
  if (rows.length !== TOTAL) bad(`${code} twin: ${rows.length} rows, expected ${TOTAL}`);
  else ok(`${code} twin: ${rows.length} rows`);
  // Rows are matched by name, not position, so one missing row reports as
  // one problem rather than as every row after it.
  const byName = new Map(rows.map((r) => [r[0].replace(/ \([^)]*\)$/, ""), r]));
  const wrong = [];
  for (const s of data.strategies) {
    const row = byName.get(code === "ru" ? s.name_ru : s.name_en);
    if (!row) {
      wrong.push(`${s.slug}: row missing`);
      continue;
    }
    const cell = row[5].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    if (cell !== expectedMoats(s)) wrong.push(`${s.slug}: moats "${cell}" ≠ "${expectedMoats(s)}"`);
  }
  if (wrong.length) bad(`${code} twin: ${wrong.join("; ")}`);
  else ok(`${code} twin: every Moats cell equals the JSON`);
}

// ── G8 ─────────────────────────────────────────────────────────────────────
console.log("== G8: locale parity");
{
  const ruNames = [...pages.ru.matchAll(/<tr id="([^"]+)" class="strategy[^>]*>[\s\S]*?<strong[^>]*>(?:<a[^>]*>)?([^<]*)</g)];
  const wrong = ruNames.filter(([, slug, name]) => {
    const s = data.strategies.find((x) => x.slug === slug);
    return s && decode(name) !== s.name_ru;
  });
  if (wrong.length) bad(`ru page: ${wrong.length} rows not in Russian (${wrong[0][1]})`);
  else ok(`ru page: all ${ruNames.length} names are the Russian ones`);

  const ruRoles = data.strategies.every((s) => pages.ru.includes(`>${data.roles[s.role].ru}</span>`));
  if (!ruNames.length) bad("ru page: no names found — the row pattern no longer matches");
  if (!ruRoles) bad("ru page: a role pill is not in Russian");
  else ok("ru page: role pills are Russian");

  if (twinRows.en.length !== twinRows.ru.length) bad("twins: row counts differ");
  const norm = (c) => c.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const keyed = (rows) => new Map(rows.map((r) => [r[0].replace(/ \([^)]*\)$/, ""), r]));
  const enByName = keyed(twinRows.en);
  const ruByName = keyed(twinRows.ru);
  const cellsDiffer = data.strategies.filter((s) => {
    const en = enByName.get(s.name_en);
    const ru = ruByName.get(s.name_ru);
    return !en || !ru || norm(en[5]) !== norm(ru[5]);
  });
  if (cellsDiffer.length) bad(`twins: ${cellsDiffer.length} Moats cells differ between locales`);
  else ok("twins: identical row counts and Moats cells in both locales");
}

// ── G11 ────────────────────────────────────────────────────────────────────
console.log("== G11: disputed rows carry the marker and the note");
for (const { code } of LOCALES) {
  const html = pages[code];
  for (const s of data.strategies.filter((x) => x.disputed)) {
    const row = html.match(new RegExp(`<tr id="${s.slug}" class="strategy disputed"[\\s\\S]*?</tr>`))?.[0];
    const note = code === "ru" ? s.note_ru : s.note_en;
    if (!row) bad(`${code}: ${s.slug} is not marked disputed`);
    else if (!/<details class="mark disputed"/.test(row)) bad(`${code}: ${s.slug} has no disputed badge`);
    else if (!strip(row).includes(note)) bad(`${code}: ${s.slug} does not carry its note`);
    else ok(`${code}: ${s.slug} — badge and note present`);
  }
}

/* ══ the lanes view ═══════════════════════════════════════════════════════ */

/** The cards of one lane, in document order, as raw `<li>` chunks. */
const laneChunks = (html) =>
  html
    .split('<section class="lane" data-lane="')
    .slice(1)
    .map((chunk) => ({
      slug: chunk.slice(0, chunk.indexOf('"')),
      html: chunk.slice(0, chunk.indexOf("</section>")),
    }));

const cardChunks = (laneHtml) =>
  laneHtml
    .split('<li class="card')
    .slice(1)
    .map((c) => `<li class="card${c.slice(0, c.indexOf("</li>"))}`);

const attr = (chunk, name) => chunk.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "";
const mark3 = (s) => s.moats.slice(0, 3).map(mark);

// ── L1 ─────────────────────────────────────────────────────────────────────
console.log("== L1: thirteen lanes in essay order, eighty cards, the JSON's counts");
const laneHtml = {};
for (const { code } of LOCALES) {
  const lanes = laneChunks(pages[code]);
  laneHtml[code] = lanes;
  const order = lanes.map((l) => l.slug).join(",");
  const expected = data.categories.map((c) => c.slug).join(",");
  if (order !== expected) bad(`${code}: lanes are "${order}", expected "${expected}"`);
  else ok(`${code}: ${lanes.length} lanes in essay order`);

  let sum = 0;
  for (const lane of lanes) {
    const cards = cardChunks(lane.html);
    sum += cards.length;
    const rows = data.strategies.filter((s) => s.category === lane.slug);
    if (cards.length !== rows.length) {
      bad(`${code}: lane ${lane.slug} has ${cards.length} cards, expected ${rows.length}`);
    }
    const shown = Number(lane.html.match(/<span data-count[^>]*>(\d+)</)?.[1]);
    if (shown !== rows.length) bad(`${code}: lane ${lane.slug} counts ${shown}, expected ${rows.length}`);
    const holds = Number(lane.html.match(/class="holds"[^>]*>[^<]*?(\d+)/)?.[1]);
    const wantHolds = rows.filter((s) => s.role === "hold").length;
    if (holds !== wantHolds) {
      bad(`${code}: lane ${lane.slug} says ${holds} hold, expected ${wantHolds}`);
    }
  }
  if (sum !== TOTAL) bad(`${code}: ${sum} cards on the map, expected ${TOTAL}`);
  else ok(`${code}: ${sum} cards, every lane's two counts match the JSON`);
}

// ── L2 ─────────────────────────────────────────────────────────────────────
console.log("== L2: every card wears its role, and only the holds wear the accent");
const HOLDS = data.strategies.filter((s) => s.role === "hold").length;
for (const { code } of LOCALES) {
  const cards = laneHtml[code].flatMap((l) => cardChunks(l.html));
  const wrong = [];
  for (const chunk of cards) {
    const slug = attr(chunk, "data-slug");
    const s = data.strategies.find((x) => x.slug === slug);
    if (!s) {
      wrong.push(`${slug}: not a strategy`);
      continue;
    }
    if (attr(chunk, "data-role") !== s.role) wrong.push(`${slug}: data-role ≠ ${s.role}`);
    if (!chunk.startsWith(`<li class="card role-${s.role}`)) wrong.push(`${slug}: class ≠ role-${s.role}`);
    if (s.disputed && !/class="badge"/.test(chunk)) wrong.push(`${slug}: no disputed badge`);
  }
  const accented = cards.filter((c) => c.startsWith('<li class="card role-hold')).length;
  if (wrong.length) bad(`${code}: ${wrong.join("; ")}`);
  else ok(`${code}: ${cards.length} cards carry the JSON's role`);
  if (accented !== HOLDS) bad(`${code}: ${accented} accented cards, expected ${HOLDS}`);
  else ok(`${code}: ${accented} hold cards`);
  const summary = strip(pages[code].match(/<p class="summary"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
  for (const n of [TOTAL, HOLDS, data.categories.length]) {
    if (!summary.includes(String(n))) bad(`${code}: the header strip does not say ${n} ("${summary}")`);
  }
}

// ── L3 / L7 ────────────────────────────────────────────────────────────────
console.log("== L3: every card, chip and lane label leads somewhere that exists");
for (const { code, prefix } of LOCALES) {
  const dead = [];
  let chips = 0;
  for (const lane of laneHtml[code]) {
    const label = lane.html.match(/<h2[^>]*>\s*<a href="([^"]+)"/)?.[1];
    if (label !== `${prefix}/strategies/?cat=${lane.slug}`) {
      bad(`${code}: lane ${lane.slug} label points at "${label}"`);
    }
    for (const chunk of cardChunks(lane.html)) {
      const slug = attr(chunk, "data-slug");
      const s = data.strategies.find((x) => x.slug === slug);
      const href = chunk.match(/<a class="name" href="([^"]+)"/)?.[1] ?? "";
      if (href !== `${prefix}/strategies/${slug}/`) {
        dead.push(`${slug} → ${href} ≠ ${prefix}/strategies/${slug}/`);
      }
      else if (!existsSync(join(DIST, href, "index.html"))) dead.push(`${slug} → ${href}`);
      const got = [...chunk.matchAll(/<a class="chip[^"]*"[^>]*>([^<]+)<\/a>/g)].map((m) =>
        decode(m[1]).trim(),
      );
      chips += got.length;
      if (got.join(",") !== mark3(s).join(",")) {
        dead.push(`${slug}: chips [${got.join(",")}] ≠ [${mark3(s).join(",")}]`);
      }
      const numbers = [...chunk.matchAll(/class="chip[^"]*" data-n="(\d+)" href="([^"]+)"/g)];
      for (const [, n, moatHref] of numbers) {
        if (moatHref !== `${prefix}/moats/${n}/`) dead.push(`${slug}: chip #${n} → ${moatHref}`);
      }
    }
  }
  if (dead.length) bad(`${code}: ${dead.join("; ")}`);
  else ok(`${code}: 80 card links, ${chips} chips and 13 lane labels resolve`);
}

// ── L6 ─────────────────────────────────────────────────────────────────────
console.log("== L6: the inbound links, from the sheets and from the strategy pages");
for (const { code, prefix } of LOCALES) {
  const wrong = [];
  for (let n = 1; n <= 35; n++) {
    const sheet = decode(read(`${prefix}/moats/${n}/index.html`));
    const has = data.strategies.some((s) => s.moats.some((m) => m.n === n));
    const link = sheet.includes(`href="${prefix}/strategies/?view=lanes&moat=${n}"`);
    if (has !== link) wrong.push(`#${n}: ${link ? "links" : "does not link"} to the map`);
  }
  if (wrong.length) bad(`${code} sheets: ${wrong.join("; ")}`);
  else ok(`${code} sheets: every moat with strategies points at the map, and only those`);

  const missing = [];
  for (const s of data.strategies) {
    const page = decode(read(`${prefix}/strategies/${s.slug}/index.html`));
    const lit = [...page.matchAll(/href="[^"]*\?view=lanes&hl=([^"]+)"/g)].map((m) => m[1].split(","));
    const self = lit.find((l) => l.length === 1 && l[0] === s.slug);
    if (!self) missing.push(`${s.slug}: no "this strategy on the map" link`);
    for (const [key, kind] of [["combos", "combos"], ["tensions", "tensions"]]) {
      const partners = prose[s.slug][key].map((r) => r.slug);
      if (!partners.length) continue;
      const want = [s.slug, ...partners].join(",");
      if (!lit.some((l) => l.join(",") === want)) missing.push(`${s.slug}: ${kind} link ≠ [${want}]`);
    }
  }
  if (missing.length) bad(`${code} pages: ${missing.join("; ")}`);
  else ok(`${code} pages: every page maps itself, its combination and its tension`);
}

// ── L8 ─────────────────────────────────────────────────────────────────────
console.log("== L8: the static drawing of the map, both locales");
for (const { code, prefix } of LOCALES) {
  const at = `${prefix}/strategies/lanes.svg`;
  if (!existsSync(join(DIST, at))) {
    bad(`${code}: ${at} is missing`);
    continue;
  }
  const svg = read(at);
  const size = statSync(join(DIST, at)).size;
  const anchors = svg.match(/<a href=/g)?.length ?? 0;
  const labels = svg.match(/class="d lab"/g)?.length ?? 0;
  if (size >= 60 * 1024) bad(`${code}: ${at} is ${(size / 1024).toFixed(1)} KB, the cap is 60 KB`);
  if (anchors !== TOTAL) bad(`${code}: ${at} has ${anchors} card links, expected ${TOTAL}`);
  if (labels !== data.categories.length) {
    bad(`${code}: ${at} has ${labels} lane labels, expected ${data.categories.length}`);
  }
  if (size < 60 * 1024 && anchors === TOTAL && labels === data.categories.length) {
    ok(`${code}: ${at} — ${(size / 1024).toFixed(1)} KB, ${anchors} cards, ${labels} lanes`);
  }
}

console.log(failures ? `== ${failures} problem(s)` : "== clean");
process.exit(failures ? 1 : 0);
