#!/usr/bin/env node
/**
 * Sheet III-b's acceptance gates, run over a finished build, plus the owner's
 * review report.
 *
 * Every expectation is re-derived from the two datasets — `strategies.v1.json`
 * (the rows) and `strategy-pages.v1.json` (the prose) — and compared with what
 * `dist/` actually says, in both locales. The shape rules (keys, per-moat
 * parity, references, empty fields, Russian ≠ English) already fail the build
 * in `src/data/strategy-pages.ts`; this checks the rendered result.
 *
 *   G5  every page and twin exists; each twin's Moats section equals the JSON
 *   G6  a page carries every block's content — nothing waits for JavaScript
 *   G7  every strategy link on the table, the moat sheets and the pages
 *       resolves; every row anchor on the table still exists
 *   G8  the twins agree across locales on block count and moat numbers, and
 *       no prose block is the same bytes in both
 *   G9  strategies.v1.json is still the published bytes
 *   G10 every page and twin carries the attribution; no 12-word run of the
 *       prose appears in the essay text (pass the essay with --essay FILE;
 *       without it the check runs against the gists, the only essay text in
 *       the repo, and says so)
 *   G13 eighty distinct descriptions per locale; canonical and the hreflang
 *       pair on every page
 *
 * Then the report: the slugs still at `draft`, and the one-sided combo pairs
 * (A lists B, B does not list A) — the seed of the co-occurrence matrix.
 *
 * Usage: node scripts/check-strategy-pages.mjs [DIST] [--essay FILE]
 * Exit 1 on any failure, with every offender listed.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const essayAt = args.includes("--essay") ? args[args.indexOf("--essay") + 1] : null;
const DIST = args.find((a) => !a.startsWith("--") && a !== essayAt) ?? "dist";
const PUBLISHED_SHA256 = "3c0211e1d0c8399e7e6ceea4727e564b9127c51cfea6ee8dd12448030833bba0";

const rowsRaw = readFileSync("src/data/strategies.v1.json");
const rows = JSON.parse(rowsRaw.toString("utf8"));
const pages = JSON.parse(readFileSync("src/data/strategy-pages.v1.json", "utf8")).pages;
const LOCALES = [
  { code: "en", prefix: "" },
  { code: "ru", prefix: "/ru" },
];
const L = (code, obj, key) => obj[`${key}_${code}`];

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
const flat = (s) => s.replace(/\s+/g, " ").trim();
const strip = (html) => flat(decode(html.replace(/<[^>]+>/g, " ")));
const mark = (m) => (m.kind === "via" ? `→ #${m.n}` : m.kind === "conditional" ? `#${m.n}?` : `#${m.n}`);

// ── G5 ─────────────────────────────────────────────────────────────────────
console.log("== G5: every page and twin exists; the twin's Moats section equals the JSON");
const html = { en: {}, ru: {} };
const twin = { en: {}, ru: {} };
for (const { code, prefix } of LOCALES) {
  let missing = 0;
  const moatsWrong = [];
  for (const s of rows.strategies) {
    const dir = `${prefix}/strategies/${s.slug}`;
    let lost = false;
    for (const f of [`${dir}/index.html`, `${dir}/index.md`, `${dir}.md`]) {
      if (!existsSync(join(DIST, f))) {
        bad(`${code}: ${f} is missing`);
        missing++;
        lost = true;
      }
    }
    if (lost) continue;
    html[code][s.slug] = read(`${dir}/index.html`);
    twin[code][s.slug] = read(`${dir}/index.md`);
    if (twin[code][s.slug] !== read(`${dir}.md`)) bad(`${code}: the two twin forms of ${s.slug} differ`);

    // The Moats section: one line per moat, its mark, the sheet link, the why.
    const section = twin[code][s.slug].split(/\n## /)[1] ?? "";
    const lines = section.split("\n").filter((l) => l.startsWith("- ["));
    const got = lines.map((l) => {
      const m = l.match(/^- \[([^\]]+)\]\([^)]*\/moats\/(\d+)\/\) \([^)]*\) — (.*)$/);
      return m ? { mark: m[1].replace(/ .*/, "").replace(/^(→)$/, "→"), text: m[1], n: Number(m[2]), why: m[3] } : null;
    });
    const want = s.moats.map((m) => ({ n: m.n, mark: mark(m), why: L(code, pages[s.slug].per_moat.find((x) => x.n === m.n), "why") }));
    const same =
      got.length === want.length &&
      got.every((g, i) => g && g.n === want[i].n && g.text.startsWith(want[i].mark) && g.why === want[i].why);
    if (!same) moatsWrong.push(s.slug);
    if (!s.moats.length && !section.includes(`> ${L(code, pages[s.slug], "moat_logic")}`)) {
      moatsWrong.push(`${s.slug} (no notice)`);
    }
  }
  if (!missing) ok(`${code}: ${rows.strategies.length} pages, each with both twin forms`);
  if (moatsWrong.length) bad(`${code} twins: Moats section differs from the JSON for ${moatsWrong.join(", ")}`);
  else ok(`${code} twins: every Moats section equals the JSON`);
}

// ── G6 ─────────────────────────────────────────────────────────────────────
console.log("== G6: every block's content is in the HTML, no script needed");
for (const { code } of LOCALES) {
  const gaps = [];
  for (const s of rows.strategies) {
    const page = pages[s.slug];
    const text = strip(html[code][s.slug] ?? "");
    const expect = [
      L(code, s, "name"),
      L(code, s, "gist"),
      ...L(code, page, "how").split(/\n\s*\n/),
      L(code, page, "summary"),
      L(code, page, "moat_logic"),
      ...page.per_moat.map((m) => L(code, m, "why")),
      ...L(code, page, "signals"),
      ...L(code, page, "build"),
      ...L(code, page, "erosion"),
      L(code, page, "solo"),
      ...s.examples_nature,
      ...s.examples_business,
      ...page.cases.flatMap((c) => [c.name, L(code, c, "what")]),
      ...page.combos.map((c) => L(code, c, "why")),
      ...page.tensions.map((c) => L(code, c, "why")),
      L(code, s, "note"),
    ].filter(Boolean);
    const lost = expect.filter((e) => !text.includes(flat(e)));
    if (lost.length) gaps.push(`${s.slug}: ${lost.length} piece(s), first "${lost[0].slice(0, 40)}…"`);
  }
  if (gaps.length) bad(`${code}: content missing from the HTML — ${gaps.join("; ")}`);
  else ok(`${code}: all blocks present on all ${rows.strategies.length} pages`);
}

// ── G7 ─────────────────────────────────────────────────────────────────────
console.log("== G7: links resolve — table, moat sheets, pages — and the row anchors survive");
const slugs = new Set(rows.strategies.map((s) => s.slug));
const moatNumbers = [...new Set(rows.strategies.flatMap((s) => s.moats.map((m) => m.n)))];
for (const { code, prefix } of LOCALES) {
  const resolves = (href) => existsSync(join(DIST, href, "index.html"));
  // Site-relative links only — the head's canonical and hreflang are absolute
  // and are G13's business.
  const linksIn = (doc) =>
    [...doc.matchAll(/href="((?:\/[a-z]{2})?\/strategies\/([^"/#?]+)\/)"/g)].map(([, href, slug]) => ({ href, slug }));

  const table = read(`${prefix}/strategies/index.html`);
  const tableLinks = linksIn(table);
  const dead = tableLinks.filter((l) => !resolves(l.href) || !l.href.startsWith(`${prefix}/strategies/`));
  const linked = new Set(tableLinks.map((l) => l.slug));
  const unlinked = [...slugs].filter((x) => !linked.has(x));
  if (dead.length) bad(`${code} table: dead page links ${[...new Set(dead.map((d) => d.href))].join(", ")}`);
  else ok(`${code} table: ${tableLinks.length} page links resolve`);
  if (unlinked.length) bad(`${code} table: rows without a page link: ${unlinked.join(", ")}`);
  const anchors = new Set([...table.matchAll(/<tr id="([^"]+)" class="strategy/g)].map((m) => m[1]));
  const lostAnchors = [...slugs].filter((x) => !anchors.has(x));
  if (lostAnchors.length) bad(`${code} table: row anchors missing: ${lostAnchors.join(", ")}`);
  else ok(`${code} table: all ${slugs.size} row anchors still there`);

  let sheetLinks = 0;
  const sheetDead = [];
  for (const n of moatNumbers) {
    for (const l of linksIn(read(`${prefix}/moats/${n}/index.html`))) {
      sheetLinks++;
      if (!resolves(l.href) || !slugs.has(l.slug)) sheetDead.push(`#${n} → ${l.href}`);
    }
  }
  if (sheetDead.length) bad(`${code} sheets: dangling strategy links: ${sheetDead.join(", ")}`);
  else ok(`${code} sheets: ${sheetLinks} strategy links resolve`);

  let pageLinks = 0;
  const pageDead = [];
  for (const s of rows.strategies) {
    for (const l of linksIn(html[code][s.slug] ?? "")) {
      pageLinks++;
      if (!resolves(l.href)) pageDead.push(`${s.slug} → ${l.href}`);
    }
  }
  if (pageDead.length) bad(`${code} pages: dangling links: ${pageDead.join(", ")}`);
  else ok(`${code} pages: ${pageLinks} strategy-to-strategy links resolve`);
}

// ── G8 ─────────────────────────────────────────────────────────────────────
console.log("== G8: the two locales agree on shape and differ in words");
{
  const blocks = (md) => md.split(/\n## /).slice(1).map((b) => ({ head: b.split("\n")[0], body: b.split("\n").slice(1).join("\n").trim() }));
  const moatNs = (md) => [...(md.split(/\n## /)[1] ?? "").matchAll(/\/moats\/(\d+)\/\)/g)].map((m) => m[1]).join(",");
  const SKIP_HEADS = 2; // the Examples block carries English strings by design; Source and Related are shared
  const problems = [];
  for (const s of rows.strategies) {
    const en = blocks(twin.en[s.slug] ?? "");
    const ru = blocks(twin.ru[s.slug] ?? "");
    if (en.length !== ru.length) {
      problems.push(`${s.slug}: ${en.length} blocks in EN, ${ru.length} in RU`);
      continue;
    }
    if (moatNs(twin.en[s.slug]) !== moatNs(twin.ru[s.slug])) problems.push(`${s.slug}: moat numbers differ`);
    en.forEach((b, i) => {
      // Examples (English by contract), Source (English attribution + URL) and Related are the same on purpose.
      if (i >= en.length - SKIP_HEADS || /^(In nature|В природе)/.test(b.head)) return;
      if (b.body && b.body === ru[i].body) problems.push(`${s.slug}: block "${b.head}" is byte-identical in both locales`);
    });
  }
  if (problems.length) bad(problems.join("; "));
  else ok(`all ${rows.strategies.length} pairs: same block count, same moats, different prose`);

  // Field level, so a copied paragraph is named by slug and field, not by block.
  const copied = [];
  for (const s of rows.strategies) {
    const p = pages[s.slug];
    for (const f of ["summary", "how", "moat_logic", "solo"]) if (p[`${f}_en`] === p[`${f}_ru`]) copied.push(`${s.slug}.${f}_ru`);
    for (const f of ["signals", "build", "erosion"]) p[`${f}_en`].forEach((x, i) => { if (x === p[`${f}_ru`][i]) copied.push(`${s.slug}.${f}_ru[${i}]`); });
    for (const m of p.per_moat) if (m.why_en === m.why_ru) copied.push(`${s.slug}.per_moat#${m.n}.why_ru`);
  }
  if (copied.length) bad(`fields equal in both locales: ${copied.join(", ")}`);
  else ok("no prose field is the same in both locales");
}

// ── G9 ─────────────────────────────────────────────────────────────────────
console.log("== G9: the strategies dataset is still the published bytes");
{
  const sha = createHash("sha256").update(rowsRaw).digest("hex");
  if (sha !== PUBLISHED_SHA256) bad(`strategies.v1.json hashes to ${sha.slice(0, 12)}…, expected ${PUBLISHED_SHA256.slice(0, 12)}…`);
  else ok(`strategies.v1.json sha256 ${sha.slice(0, 12)}… as published`);
}

// ── G10 ────────────────────────────────────────────────────────────────────
console.log("== G10: attribution everywhere; no 12-word run of the prose is in the essay");
{
  const attribution = { en: "Strategy taxonomy ©", ru: "Таксономия стратегий ©" };
  for (const { code } of LOCALES) {
    const noPage = rows.strategies.filter((s) => !strip(html[code][s.slug] ?? "").includes(attribution[code]));
    const noTwin = rows.strategies.filter((s) => !(twin[code][s.slug] ?? "").includes(attribution[code]) || !(twin[code][s.slug] ?? "").includes(rows.source.url));
    if (noPage.length) bad(`${code}: pages without the attribution: ${noPage.map((s) => s.slug).join(", ")}`);
    else ok(`${code}: every page carries the attribution`);
    if (noTwin.length) bad(`${code}: twins without the attribution and source URL: ${noTwin.map((s) => s.slug).join(", ")}`);
    else ok(`${code}: every twin carries the attribution and the source URL`);
  }

  const WINDOW = 12;
  const words = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").split(/\s+/).filter(Boolean);
  const shingles = (s) => {
    const w = words(s);
    const out = new Set();
    for (let i = 0; i + WINDOW <= w.length; i++) out.add(w.slice(i, i + WINDOW).join(" "));
    return out;
  };
  let essay;
  if (essayAt) {
    essay = readFileSync(essayAt, "utf8");
    console.log(`  · essay text: ${essayAt} (${words(essay).length} words)`);
  } else {
    essay = rows.strategies.flatMap((s) => [s.gist_en, s.gist_ru, ...s.examples_nature, ...s.examples_business]).join(". ");
    console.log("  · no --essay given: checking against the gists and examples in strategies.v1.json only");
  }
  const bank = shingles(essay);
  const hits = [];
  for (const s of rows.strategies) {
    const p = pages[s.slug];
    const fields = {
      summary_en: p.summary_en, summary_ru: p.summary_ru, how_en: p.how_en, how_ru: p.how_ru,
      moat_logic_en: p.moat_logic_en, moat_logic_ru: p.moat_logic_ru, solo_en: p.solo_en, solo_ru: p.solo_ru,
      ...Object.fromEntries(["signals", "build", "erosion"].flatMap((f) => [[`${f}_en`, p[`${f}_en`].join(". ")], [`${f}_ru`, p[`${f}_ru`].join(". ")]])),
      per_moat: p.per_moat.flatMap((m) => [m.why_en, m.why_ru]).join(". "),
      cases: p.cases.flatMap((c) => [c.what_en, c.what_ru]).join(". "),
      refs: [...p.combos, ...p.tensions].flatMap((c) => [c.why_en, c.why_ru]).join(". "),
    };
    for (const [field, text] of Object.entries(fields)) {
      for (const sh of shingles(text)) {
        if (bank.has(sh)) {
          hits.push(`${s.slug}.${field}: "${sh}"`);
          break;
        }
      }
    }
  }
  if (hits.length) bad(`prose runs found in the essay text: ${hits.join("; ")}`);
  else ok(`no ${WINDOW}-word run of any prose field appears in the essay text`);
}

// ── G13 ────────────────────────────────────────────────────────────────────
console.log("== G13: distinct descriptions; canonical and hreflang on every page");
for (const { code, prefix } of LOCALES) {
  const seen = new Map();
  const dupes = [];
  const noMeta = [];
  for (const s of rows.strategies) {
    const doc = html[code][s.slug] ?? "";
    const d = doc.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    if (!d) noMeta.push(`${s.slug} (description)`);
    else if (seen.has(d)) dupes.push(`${seen.get(d)} = ${s.slug}`);
    else seen.set(d, s.slug);
    if (d.length > 160) noMeta.push(`${s.slug} (description ${d.length} chars)`);
    const self = `${prefix}/strategies/${s.slug}/`;
    if (!doc.includes(`<link rel="canonical" href="https://moa.giglabo.com${self}">`) && !new RegExp(`<link rel="canonical" href="[^"]*${self}">`).test(doc)) noMeta.push(`${s.slug} (canonical)`);
    for (const l of ["en", "ru", "x-default"]) {
      if (!new RegExp(`<link rel="alternate" hreflang="${l}" href="[^"]*/strategies/${s.slug}/">`).test(doc)) noMeta.push(`${s.slug} (hreflang ${l})`);
    }
    if (!/<meta property="og:url" content="[^"]+">/.test(doc)) noMeta.push(`${s.slug} (og:url)`);
  }
  if (dupes.length) bad(`${code}: duplicate descriptions: ${dupes.join(", ")}`);
  else ok(`${code}: ${seen.size} distinct descriptions`);
  if (noMeta.length) bad(`${code}: metadata missing: ${noMeta.join(", ")}`);
  else ok(`${code}: canonical, the hreflang pair and og:url on every page`);
}

// ── the owner's report ─────────────────────────────────────────────────────
console.log("== report");
{
  const drafts = rows.strategies.filter((s) => pages[s.slug].status === "draft").map((s) => s.slug);
  console.log(`  · status draft: ${drafts.length} of ${rows.strategies.length}${drafts.length ? ` — ${drafts.join(", ")}` : ""}`);
  const oneSided = [];
  for (const s of rows.strategies) {
    for (const c of pages[s.slug].combos) {
      if (!pages[c.slug].combos.some((b) => b.slug === s.slug)) oneSided.push(`${s.slug} → ${c.slug}`);
    }
  }
  const total = rows.strategies.reduce((n, s) => n + pages[s.slug].combos.length, 0);
  console.log(`  · one-sided combo pairs: ${oneSided.length} of ${total} combo edges`);
  for (const pair of oneSided) console.log(`      ${pair}`);
}

console.log(failures ? `== ${failures} problem(s)` : "== clean");
process.exit(failures ? 1 : 0);
