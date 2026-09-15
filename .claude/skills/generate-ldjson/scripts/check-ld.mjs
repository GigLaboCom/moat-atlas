#!/usr/bin/env node
/**
 * Check the JSON-LD of a built site — the shape of what `src/lib/seo/ld.ts`
 * emitted, page by page, against `dist/sitemap.xml`.
 *
 * The container audit (`npm run audit`) only proves a graph is *present*. This
 * reads every graph out of `dist/`, resolves it, and fails on the mistakes a
 * generated graph actually makes: an `@id` nobody serves, a `ref()` that
 * resolves nowhere, a duplicate id, an empty or `undefined` value, a page type
 * that quietly changed, a `<` that escaped the serializer.
 *
 * Usage:
 *   node .claude/skills/generate-ldjson/scripts/check-ld.mjs [--dist DIR]
 *   node .claude/skills/generate-ldjson/scripts/check-ld.mjs --print /moats/7/
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
const DIST = resolve(flag("--dist") ?? "dist");
const PRINT = flag("--print");

let fails = 0;
const bad = (where, msg) => {
  fails += 1;
  console.log(`  ✗ ${where}: ${msg}`);
};

/* ── the built site ─────────────────────────────────────────────────────── */

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

try {
  statSync(DIST);
} catch {
  console.error(`no ${relative(process.cwd(), DIST) || DIST}/ — run \`npm run build\` first`);
  process.exit(1);
}

/** "dist/ru/moats/7/index.html" → "/ru/moats/7/" */
const pathOf = (file) => {
  const rel = relative(DIST, file).replace(/\\/g, "/");
  const dir = rel.replace(/index\.html$/, "").replace(/\.html$/, "/");
  return `/${dir}`.replace(/\/{2,}/g, "/");
};

let sitemap;
try {
  sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
} catch {
  console.error("no dist/sitemap.xml — the page index did not render");
  process.exit(1);
}
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!listed.length) {
  console.error("dist/sitemap.xml lists no URL");
  process.exit(1);
}
const origin = new URL(listed[0]).origin;
// /llms.txt is in the sitemap on purpose — a document, not a page: it carries
// no graph, so it is held out of the page-for-page comparison the way the
// audit holds it out, and stays out of the URLs an @id may point at.
const DOCUMENTS = new Set(["/llms.txt"]);
const listedPaths = new Set(listed.map((u) => new URL(u).pathname).filter((p) => !DOCUMENTS.has(p)));
const listedUrls = new Set(listed.filter((u) => !DOCUMENTS.has(new URL(u).pathname)));

/* ── the expected shape, stated independently of ld.ts ──────────────────── */

const KINDS = [
  [/^\/(ru\/)?$/, "atlas", "WebPage", true],
  [/^\/(ru\/)?moats\/$/, "catalogue", "CollectionPage", true],
  [/^\/(ru\/)?moats\/\d+\/$/, "sheet", "WebPage", true],
  [/^\/(ru\/)?calculator\/$/, "calculator", "WebPage", true],
  [/^\/(ru\/)?strategies\/$/, "strategies", "CollectionPage", true],
  [/^\/(ru\/)?strategies\/[a-z0-9-]+\/$/, "strategy", "WebPage", true],
  [/^\/(ru\/)?about\/$/, "about", "AboutPage", false],
  [/^\/(ru\/)?credits\/$/, "credits", "AboutPage", false],
  [/^\/(ru\/)?cookies\/$/, "cookies", "WebPage", false],
];
const kindOf = (p) => KINDS.find(([re]) => re.test(p));

const SCRIPT = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

/* ── pass 1: parse every graph ──────────────────────────────────────────── */

const graphs = new Map(); // path → nodes[]
const defined = new Set(); // every @id the site defines anywhere

for (const file of htmlFiles(DIST)) {
  const path = pathOf(file);
  if (!listedPaths.has(path)) continue; // 404.html and anything unlisted
  const html = readFileSync(file, "utf8");
  const bodies = [...html.matchAll(SCRIPT)].map((m) => m[1]);

  if (bodies.length === 0) {
    bad(path, "no application/ld+json");
    continue;
  }
  if (bodies.length > 1) bad(path, `${bodies.length} ld+json scripts, expected one`);

  const raw = bodies[0];
  if (raw.includes("<")) bad(path, "unescaped < in the serialized graph");

  let graph;
  try {
    graph = JSON.parse(raw);
  } catch (e) {
    bad(path, `unparsable JSON — ${e.message}`);
    continue;
  }
  if (graph["@context"] !== "https://schema.org") bad(path, "@context is not https://schema.org");
  if (!Array.isArray(graph["@graph"])) {
    bad(path, "no @graph array");
    continue;
  }
  graphs.set(path, graph["@graph"]);
  for (const node of graph["@graph"]) if (node && node["@id"]) defined.add(node["@id"]);
}

for (const p of listedPaths) {
  if (!graphs.has(p)) bad(p, "listed in the sitemap but no page was built for it");
}

if (PRINT) {
  const want = PRINT.endsWith("/") ? PRINT : `${PRINT}/`;
  const nodes = graphs.get(want);
  if (!nodes) {
    console.error(`no built page at ${want} — known: ${[...graphs.keys()].slice(0, 8).join(", ")}…`);
    process.exit(1);
  }
  console.log(JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }, null, 2));
  process.exit(0);
}

/* ── pass 2: check each graph ───────────────────────────────────────────── */

/** Every `{"@id": …}` used as a reference, and every value, walked. */
function walk(value, visit, trail = "") {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, visit, `${trail}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    visit(value, trail);
    for (const [k, v] of Object.entries(value)) walk(v, visit, trail ? `${trail}.${k}` : k);
    return;
  }
  visit(value, trail);
}

const isRef = (o) => o && typeof o === "object" && !Array.isArray(o) && Object.keys(o).length === 1 && "@id" in o;

for (const [path, nodes] of graphs) {
  const here = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
  const seen = new Set();
  const locale = path.startsWith("/ru/") || path === "/ru/" ? "ru" : "en";
  const kind = kindOf(path);

  for (const node of nodes) {
    if (!node["@type"]) bad(path, `a node has no @type (${JSON.stringify(node).slice(0, 60)}…)`);
    const id = node["@id"];
    if (!id) {
      bad(path, `a ${node["@type"]} node has no @id`);
      continue;
    }
    if (seen.has(id)) bad(path, `duplicate @id ${id}`);
    seen.add(id);
  }

  // Every @id on this site's own host must be a URL the sitemap lists.
  walk(nodes, (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v) || !v["@id"]) return;
    const id = String(v["@id"]);
    let url;
    try {
      url = new URL(id);
    } catch {
      bad(path, `@id is not an absolute URL: ${id}`);
      return;
    }
    if (url.origin !== origin) return; // the org and other external identities
    const base = `${url.origin}${url.pathname}`;
    if (!listedUrls.has(base)) bad(path, `@id points at an unlisted URL: ${id}`);
  });

  // Every reference resolves — in this graph, or to a node some page defines.
  walk(nodes, (v, trail) => {
    if (!isRef(v)) return;
    const id = String(v["@id"]);
    if (!here.has(id) && !defined.has(id)) bad(path, `${trail} refs a node nobody defines: ${id}`);
  });

  // No empty or accidental values anywhere in the graph.
  walk(nodes, (v, trail) => {
    if (typeof v === "string" && v.trim() === "") bad(path, `${trail} is an empty string`);
    if (typeof v === "string" && /\bundefined\b|\bnull\b|\bNaN\b|\{\w+\}/.test(v))
      bad(path, `${trail} looks unrendered: "${v.slice(0, 60)}"`);
    if (typeof v === "number" && Number.isNaN(v)) bad(path, `${trail} is NaN`);
  });

  // The page node itself.
  const page = nodes.find((n) => n["@id"] === `${origin}${path}`);
  if (!page) {
    bad(path, `no node identifies the page itself (${origin}${path})`);
    continue;
  }
  for (const field of ["url", "name", "description", "inLanguage", "isPartOf", "encoding", "license", "publisher", "author"]) {
    if (page[field] === undefined) bad(path, `the page node has no ${field}`);
  }
  if (page.inLanguage !== locale) bad(path, `inLanguage is ${page.inLanguage}, expected ${locale}`);
  if (page.url !== `${origin}${path}`) bad(path, `the page node's url is ${page.url}`);

  const crumb = nodes.find((n) => n["@type"] === "BreadcrumbList");
  const isHome = /^\/(ru\/)?$/.test(path);
  if (!isHome && !crumb) bad(path, "no BreadcrumbList");
  if (isHome && crumb) bad(path, "the home page carries a BreadcrumbList");
  if (crumb && page.breadcrumb?.["@id"] !== crumb["@id"]) bad(path, "the page does not ref its breadcrumb");

  if (!kind) {
    bad(path, "a listed page this check does not know — teach it the new kind");
    continue;
  }
  const [, name, type, wantsEntity] = kind;
  if (page["@type"] !== type) bad(path, `${name} page is ${page["@type"]}, expected ${type}`);
  if (wantsEntity) {
    const main = page.mainEntity?.["@id"];
    if (!main) bad(path, `${name} page has no mainEntity`);
    else if (!here.has(main)) bad(path, `mainEntity ${main} is not a node of this graph`);
  }
}

const pages = graphs.size;
console.log(
  fails === 0
    ? `== clean — ${pages} pages, ${defined.size} nodes`
    : `== ${fails} problem(s) across ${pages} pages`,
);
process.exit(fails > 0 ? 1 : 0);
