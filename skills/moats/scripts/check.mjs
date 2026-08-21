#!/usr/bin/env node
/**
 * Verify the skill's transcriptions against the moat-atlas repo.
 *
 * The references (atlas.md, calculator.md) transcribe src/data/{moats,survey}.ts
 * and the English dictionaries; this script re-derives every checkable claim
 * from the repo and diffs. Run it after any change to the matrix, the survey or
 * the calculator copy:
 *
 *   node scripts/check.mjs [path-to-moat-atlas-repo]
 *
 * The path defaults to two levels up — right when the skill sits in the repo at
 * skills/moats/; an installed copy has to be told where the repo is.
 * Exit 0 = clean, 1 = mismatches. Needs the repo's node_modules (esbuild).
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(process.argv[2] ?? join(skillDir, "../.."));
if (!existsSync(join(repo, "src/data/moats.ts"))) {
  console.error(`not a moat-atlas repo: ${repo}\nusage: node scripts/check.mjs <repo-path>`);
  process.exit(2);
}

// ---------------------------------------------------------------- load source
const { build } = await import(pathToFileURL(join(repo, "node_modules/esbuild/lib/main.js")));
const entry = `
  export * as data from "./src/data/moats.ts";
  export * as survey from "./src/data/survey.ts";
  export { calculatorPage } from "./src/i18n/translations/pages/calculator.ts";
  export { default as ui } from "./src/i18n/translations/en.ts";
  export { default as sheets } from "./src/i18n/translations/moats/en.ts";
`;
const bundled = await build({
  stdin: { contents: entry, resolveDir: repo, loader: "ts" },
  bundle: true, format: "esm", write: false, platform: "neutral", logLevel: "silent",
});
const src = await import(
  "data:text/javascript;base64," + Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
const { MOATS, TERNARY_GLYPH, AI_GLYPH } = src.data;
const { QUESTIONS, SURVEY_COVERS_MATRIX } = src.survey;
const en = src.calculatorPage.en;
const rocks = src.ui.rocks;
const depthLabel = src.ui.values.depth; // {1:"1 · shovel",…}
const sheetName = (n) => src.sheets[n].name;

const YEARS = { 1: "weeks–months", 2: "1–3y", 3: "3–10y", 4: "10y+" }; // legend shorthand

// ---------------------------------------------------------------- helpers
const errors = [];
const warns = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warns.push(`${file}: ${msg}`);
const read = (f) => readFileSync(join(skillDir, f), "utf8");
const strip = (s) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const sameSet = (a, b) => a.length === b.length && [...a].sort((x, y) => x - y).join() === [...b].sort((x, y) => x - y).join();
const nums = (s) => [...s.matchAll(/\d+/g)].map((m) => Number(m[0]));

const soloSet = MOATS.filter((m) => m.solo === "yes").map((m) => m.n);
const attackSet = MOATS.filter((m) => m.ai === "under-attack").map((m) => m.n);
const rentSet = MOATS.filter((m) => m.rent === "yes").map((m) => m.n);
const shovelSet = MOATS.filter((m) => m.d === 1).map((m) => m.n);

// A prose claim of the shape "N of those six are … solo-reachable" must match
// the real overlap between the under-attack set and the solo set.
function checkRatioClaim(file, text) {
  const m = text.match(/\b(four|five|six|all|every one)\b[^.]{0,60}\bsolo[- ]reachable/i);
  if (!m) return;
  const claimed = { four: 4, five: 5, six: 6, all: 6, "every one": 6 }[m[1].toLowerCase()];
  const actual = attackSet.filter((n) => soloSet.includes(n)).length;
  if (claimed !== actual)
    err(file, `claims ${m[1]} of the ↓ set are solo-reachable; the matrix says ${actual} of ${attackSet.length}`);
}

// ---------------------------------------------------------------- atlas.md
{
  const file = "references/atlas.md";
  const text = read(file);
  const blocks = [...text.matchAll(/^### (\d+) · (.+)\n\n`(.+?)` · depth \*\*([\d.]+)\*\* ([\w ]+?) \((.+?)\) · capital (\S+(?:–\S+)?) · solo (\S+) · AI (\S+) · rent (\S+)\s*$/gm)];
  if (blocks.length !== MOATS.length) err(file, `parsed ${blocks.length} axis lines, expected ${MOATS.length}`);
  for (const [, nStr, name, rock, d, tool, years, cap, solo, ai, rent] of blocks) {
    const m = MOATS.find((x) => x.n === Number(nStr));
    if (!m) { err(file, `mechanic ${nStr} not in the matrix`); continue; }
    const want = {
      name: sheetName(m.n),
      rock: rocks[m.rock],
      d: String(m.d),
      tool: depthLabel[Math.round(m.d)].split("· ")[1],
      years: YEARS[Math.round(m.d)],
      cap: m.cap,
      solo: TERNARY_GLYPH[m.solo],
      ai: AI_GLYPH[m.ai],
      rent: TERNARY_GLYPH[m.rent],
    };
    const got = { name, rock, d, tool, years, cap, solo, ai, rent };
    for (const k of Object.keys(want))
      if (String(got[k]).trim() !== String(want[k]).trim())
        err(file, `mechanic ${m.n} ${k}: "${got[k]}" ≠ source "${want[k]}"`);
  }
  const list = (label) => {
    const m = text.match(new RegExp(`\\*\\*${label}[^:]*:\\*\\*([^.]*)`));
    return m ? nums(m[1]) : null;
  };
  const cuts = [
    ["Solo-reachable", soloSet],
    ["AI under attack", attackSet],
    ["Rentable", rentSet],
    ["Shovel depth", shovelSet],
  ];
  for (const [label, want] of cuts) {
    const got = list(label);
    if (!got) warn(file, `cross-cut "${label}" not found`);
    else if (!sameSet(got, want)) err(file, `cross-cut "${label}": [${got}] ≠ source [${want}]`);
  }
  checkRatioClaim(file, text);
}

// ---------------------------------------------------------------- calculator.md
{
  const file = "references/calculator.md";
  const text = read(file);
  const blocks = [...text.matchAll(/^### Q(\d+)\. (.+?) — \*(.+?)\*\n\n(.+?)\n\nMechanics: (.+?)$/gms)];
  if (blocks.length !== QUESTIONS.length) err(file, `parsed ${blocks.length} question blocks, expected ${QUESTIONS.length}`);
  for (const [, qn, question, eyebrow, rungLine, mechLine] of blocks) {
    const q = QUESTIONS[Number(qn) - 1];
    const s = en.questions[q.id];
    if (strip(question) !== strip(s.question))
      err(file, `Q${qn} question: "${question}" ≠ source "${s.question}"`);
    if (strip(eyebrow) !== strip(s.eyebrow))
      err(file, `Q${qn} eyebrow: "${eyebrow}" ≠ source "${s.eyebrow}"`);
    const rungs = rungLine.split(" · ").map((r) => strip(r).replace(/^\d+ /, ""));
    if (rungs.length !== 5) err(file, `Q${qn}: ${rungs.length} rungs, expected 5`);
    rungs.forEach((r, i) => {
      if (r !== strip(s.options[i] ?? ""))
        err(file, `Q${qn} rung ${i * 25}: "${r}" ≠ source "${s.options[i]}"`);
    });
    if (!sameSet(nums(mechLine.replace(/\d+x/g, "")), q.moats))
      err(file, `Q${qn} mechanics: [${nums(mechLine)}] ≠ source [${q.moats}]`);
    for (const [, num, mname] of mechLine.matchAll(/\*\*(\d+)\*\* ([^,*]+)/g))
      if (strip(mname).toLowerCase() !== sheetName(Number(num)).toLowerCase())
        err(file, `Q${qn} mechanic ${num} name: "${strip(mname)}" ≠ source "${sheetName(Number(num))}"`);
  }
  for (const [, level, verdict] of text.matchAll(/^\| (\d) · [^|]+ \| (.+?) \|$/gm)) {
    if (strip(verdict) !== strip(en.verdicts[Number(level)]))
      err(file, `verdict band ${level}: "${strip(verdict)}" ≠ source "${en.verdicts[Number(level)]}"`);
  }
  if (!SURVEY_COVERS_MATRIX) err("survey.ts", "SURVEY_COVERS_MATRIX is false in the source itself");
  const hash = text.match(/#s=([0-9-]+)/);
  if (!hash) warn(file, "no #s= example link");
  else if (hash[1].length !== QUESTIONS.length) err(file, `#s= example is ${hash[1].length} chars, expected ${QUESTIONS.length}`);
  for (const needle of ["0 / 25 / 50 / 75\n/ 100", "< 25 → 1", "first **6**", "`-` for\nunanswered"])
    if (!text.includes(needle.replace("\n", " ")) && !text.includes(needle))
      warn(file, `scoring claim not found verbatim: "${needle.replace("\n", " ")}"`);
}

// ---------------------------------------------------------------- scan.md
{
  const file = "references/scan.md";
  const text = read(file);
  const heads = [...text.matchAll(/^### Q(\d+) .*?— mechanics? ([\d, ]+)$/gm)];
  if (heads.length !== QUESTIONS.length) warn(file, `parsed ${heads.length} per-question headings, expected ${QUESTIONS.length}`);
  for (const [, qn, mechs] of heads)
    if (!sameSet(nums(mechs), QUESTIONS[Number(qn) - 1].moats))
      err(file, `Q${qn} mechanics: [${nums(mechs)}] ≠ source [${QUESTIONS[Number(qn) - 1].moats}]`);
}

// ---------------------------------------------------------------- SKILL.md + interview.md
{
  const file = "SKILL.md";
  const text = read(file);
  checkRatioClaim(file, text);
  const claims = [
    [/mechanic ([\d, or]+) \(depth 1\)/, shovelSet, "shovel-only trap"],
    [/`↓` \(([\d, ]+)\)/, attackSet, "under-attack trap"],
    [/[Mm]echanics ([\d, ]+) can be rented/, rentSet, "rentable trap"],
    [/solo-reachable\*\* mechanics \(([\d,\s]+)\)/, soloSet, "solo filter"],
  ];
  for (const [re, want, label] of claims) {
    const m = text.match(re);
    if (!m) warn(file, `${label} claim not found`);
    else if (!sameSet(nums(m[1]), want)) err(file, `${label}: [${nums(m[1])}] ≠ source [${want}]`);
  }

  const interview = read("references/interview.md");
  for (const q of ["Q3", "Q6", "Q8", "Q10"])
    if (!interview.includes(`**${q} `)) warn("references/interview.md", `${q} missing from the always-interview list`);
}

// ---------------------------------------------------------------- report
for (const w of warns) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${errors.length} error(s), ${warns.length} warning(s) against ${repo}`);
process.exit(errors.length ? 1 : 0);
