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
 * Usage: node scripts/check-strategies.mjs [DIST]     (default ./dist)
 * Exit 1 on the first class of failure, with every offender listed.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = process.argv[2] ?? "dist";
const TOTAL = 80;
const data = JSON.parse(readFileSync("src/data/strategies.v1.json", "utf8"));
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

console.log(failures ? `== ${failures} problem(s)` : "== clean");
process.exit(failures ? 1 : 0);
