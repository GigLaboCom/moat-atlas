/**
 * One-off importer for the catalogue markdown behind the 35 sheets.
 *
 *   node scripts/import-catalogue.mjs <path-to.md> [--json out.json]
 *
 * The source is one section per moat:
 *
 *   ## 1. Сетевые эффекты 🕸️ (8,2% приложений · no-rate 67% · медиана $22.97)
 *   **Суть.** …
 *   ### Как строится
 *   **Facebook — плотность важнее размера.** …
 *   ### Как обходится
 *   **TikTok против Instagram — смена типа графа.** …
 *   **Вывод.** …
 *
 * It prints the parsed structure as JSON (essence, build[], bypass[], verdict,
 * plus the sample figures the first thirteen headings carry). Prose is written
 * into `src/i18n/translations/moats/ru.ts` by hand from this output — the point
 * of the script is that nothing is retyped and nothing is silently dropped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const args = argv.slice(2);
const source = args.find((a) => !a.startsWith("--"));
if (!source) {
  console.error("usage: node scripts/import-catalogue.mjs <catalogue.md> [--json out.json]");
  process.exit(1);
}
const jsonFlag = args.indexOf("--json");
const jsonOut = jsonFlag === -1 ? null : args[jsonFlag + 1];

const raw = readFileSync(source, "utf8");

/** `**Lead.** body` → { lead, text }; a paragraph without a lead keeps text only. */
function splitLead(paragraph) {
  // Italics carry no meaning once the prose is plain text in a data file, but
  // they can only be stripped after the bold lead has been taken off.
  const plain = (s) => s.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "$1").trim();
  const m = paragraph.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
  if (!m) return { lead: "", text: plain(paragraph) };
  return { lead: plain(m[1]).replace(/\.$/, "").trim(), text: plain(m[2]) };
}

function paragraphs(block) {
  return block
    .split(/\n{2,}/)
    // Footnote markers ([^2^]) belong to the source document, not to the sheet.
    .map((p) =>
      p
        .replace(/\[\^[^\]]*\]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    // Horizontal rules separate the sections in the source; they are not prose.
    .filter((p) => p && !/^-{3,}$/.test(p));
}

/** `(8,2% приложений · no-rate 67% · медиана $22.97)` → machine-readable figures. */
function parseSample(headingTail) {
  if (!headingTail) return null;
  const share = headingTail.match(/([\d,]+)\s*%/);
  const noRate = headingTail.match(/no-rate\s+([\d,]+)\s*%/);
  const median = headingTail.match(/медиана\s*\$([\d.,]+)/);
  const n = headingTail.match(/\bn\s*=\s*(\d+)/);
  if (!share || !noRate || !median) return null;
  const num = (s) => Number(s.replace(",", "."));
  const sample = { share: num(share[1]), noRate: num(noRate[1]), median: num(median[1]) };
  if (n) sample.n = Number(n[1]);
  return sample;
}

const sections = raw.split(/^## (?=\d+\.\s)/m).slice(1);
const moats = [];

for (const section of sections) {
  const [heading, ...rest] = section.split("\n");
  // The last moat is followed by the appendices ("Семь пород", the matrix, …) —
  // cut at the first heading that is not another moat.
  const body = rest.join("\n").split(/^#{1,2} (?!\d+\.\s)/m)[0];
  const m = heading.match(/^(\d+)\.\s+(.+?)\s*(?:\(([^)]*)\))?\s*$/);
  if (!m) throw new Error(`unparsed heading: ${heading}`);
  const n = Number(m[1]);
  const title = m[2].replace(/[\p{Extended_Pictographic}️]/gu, "").trim();

  const buildSplit = body.split(/^### Как строится\s*$/m);
  if (buildSplit.length !== 2) throw new Error(`moat ${n}: no build section`);
  const bypassSplit = buildSplit[1].split(/^### Как обходится\s*$/m);
  if (bypassSplit.length !== 2) throw new Error(`moat ${n}: no bypass section`);

  const head = paragraphs(buildSplit[0]);
  const essenceParagraph = head.find((p) => p.startsWith("**Суть.**"));
  if (!essenceParagraph) throw new Error(`moat ${n}: no essence`);

  const build = paragraphs(bypassSplit[0]).map(splitLead);
  const tail = paragraphs(bypassSplit[1]);
  const verdictParagraph = tail.find((p) => p.startsWith("**Вывод.**"));
  const bypass = tail.filter((p) => !p.startsWith("**Вывод.**")).map(splitLead);

  moats.push({
    n,
    title,
    sample: parseSample(m[3]),
    essence: splitLead(essenceParagraph).text,
    build,
    bypass,
    verdict: verdictParagraph ? splitLead(verdictParagraph).text : "",
  });
}

moats.sort((a, b) => a.n - b.n);

const report = moats.map((x) => ({
  n: x.n,
  title: x.title,
  build: x.build.length,
  bypass: x.bypass.length,
  verdict: x.verdict ? "yes" : "MISSING",
  sample: x.sample ? "yes" : "—",
  words: [x.essence, x.verdict, ...x.build.map((b) => b.text), ...x.bypass.map((b) => b.text)]
    .join(" ")
    .split(/\s+/).length,
}));

console.error(`parsed ${moats.length} moats`);
console.error(
  report
    .map((r) => `${String(r.n).padStart(2)} ${r.title.padEnd(34)} build ${r.build} · bypass ${r.bypass} · verdict ${r.verdict} · sample ${r.sample} · ${r.words}w`)
    .join("\n"),
);

/** Existing sheet names win: they are the site's names, not the document's. */
function existingNames(path) {
  const names = {};
  let file;
  try {
    file = readFileSync(path, "utf8");
  } catch {
    return names;
  }
  for (const m of file.matchAll(/^\s*(\d+):\s*\{\s*name:\s*"((?:[^"\\]|\\.)*)"/gm)) {
    names[Number(m[1])] = m[2];
  }
  return names;
}

const q = (s) => JSON.stringify(s);

function emitTs(path) {
  const names = existingNames(path);
  const missing = moats.filter((m) => !names[m.n]).map((m) => m.n);
  if (missing.length) throw new Error(`no existing name for moats: ${missing.join(", ")}`);

  const body = moats
    .map((m) => {
      const examples = (list) =>
        list
          .map((e) => `      { lead: ${q(e.lead)}, text: ${q(e.text)} },`)
          .join("\n");
      return [
        `  ${m.n}: {`,
        `    name: ${q(names[m.n])},`,
        `    essence: ${q(m.essence)},`,
        `    build: [`,
        examples(m.build),
        `    ],`,
        `    bypass: [`,
        examples(m.bypass),
        `    ],`,
        `    verdict: ${q(m.verdict)},`,
        `  },`,
      ].join("\n");
    })
    .join("\n");

  const header = [
    "import type { MoatStrings } from \"./types\";",
    "",
    "/**",
    " * Sheet copy per moat, imported from the catalogue with",
    " * `scripts/import-catalogue.mjs` — see CLAUDE.md before editing by hand.",
    " */",
    "const moats: Record<number, MoatStrings> = {",
  ].join("\n");

  writeFileSync(path, `${header}\n${body}\n};\n\nexport default moats;\n`);
  console.error(`\nwrote ${path}`);
}

const tsFlag = args.indexOf("--ts");
if (tsFlag !== -1) emitTs(args[tsFlag + 1]);

const json = JSON.stringify(moats, null, 2);
if (jsonOut) {
  writeFileSync(jsonOut, json);
  console.error(`\nwrote ${jsonOut}`);
} else {
  console.log(json);
}
