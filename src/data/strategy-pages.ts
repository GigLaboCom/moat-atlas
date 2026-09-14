/**
 * Sheet III-b — the prose behind each of the 80 strategy pages.
 *
 * `strategy-pages.v1.json` is the prose layer over `strategies.v1.json`: keyed
 * by slug, one entry per strategy, written for the atlas in both locales. The
 * structural facts — name, gist, role, moats, examples — stay in the frozen
 * dataset and are joined at build time; nothing derivable (depth, moat names,
 * the matrix attributes, back-links) is repeated here.
 *
 * Validation runs at import, so a hole in the prose fails `astro build` naming
 * the slug and the field — a page never ships with a blank block. Beyond the
 * shape, the rules the spec fixes: the keys are exactly the 80 slugs, the
 * per-moat notes cover exactly the row's moats, every combo and tension
 * resolves and is not the page itself, and no Russian field is a copy of its
 * English twin.
 *
 * `status` is the owner's review state. It is read by the build report and
 * never rendered.
 */
import { STRATEGIES, essayIndex, type Strategy } from "./strategies";
import raw from "./strategy-pages.v1.json";

export type PageStatus = "draft" | "reviewed";

export interface MoatWhy {
  n: number;
  why_en: string;
  why_ru: string;
}

export interface StrategyCase {
  /** A proper noun — the same in both locales. */
  name: string;
  what_en: string;
  what_ru: string;
}

export interface StrategyRef {
  slug: string;
  why_en: string;
  why_ru: string;
}

export interface StrategyPage {
  summary_en: string;
  summary_ru: string;
  /** One or two paragraphs, separated by a blank line. */
  how_en: string;
  how_ru: string;
  moat_logic_en: string;
  moat_logic_ru: string;
  per_moat: MoatWhy[];
  signals_en: string[];
  signals_ru: string[];
  build_en: string[];
  build_ru: string[];
  erosion_en: string[];
  erosion_ru: string[];
  solo_en: string;
  solo_ru: string;
  cases: StrategyCase[];
  combos: StrategyRef[];
  tensions: StrategyRef[];
  status: PageStatus;
}

export interface StrategyPagesDataset {
  version: string;
  pages: Record<string, StrategyPage>;
}

const data = raw as StrategyPagesDataset;

/* ── validation — every rule fails the build, none of them warns ──────── */
function fail(msg: string): never {
  throw new Error(`strategy-pages.v1.json: ${msg}`);
}

const STRING_FIELDS = ["summary", "how", "moat_logic", "solo"] as const;
const LIST_FIELDS = ["signals", "build", "erosion"] as const;
const LIST_BOUNDS = { min: 3, max: 5 };
const CASE_BOUNDS = { min: 2, max: 3 };
const COMBO_BOUNDS = { min: 2, max: 4 };
const TENSION_BOUNDS = { min: 0, max: 3 };
const STATUSES: PageStatus[] = ["draft", "reviewed"];

/** Text nobody meant to publish — the build refuses it rather than render it. */
const FILLER = /\b(TBD|TODO|lorem ipsum|placeholder)\b/i;

function text(at: string, value: unknown): string {
  if (typeof value !== "string" || !value.trim()) fail(`${at}: empty`);
  if (FILLER.test(value)) fail(`${at}: placeholder text`);
  return value;
}

/** Both locales of one field: non-empty, and not the same words. */
function pair(at: string, en: unknown, ru: unknown): void {
  text(`${at}_en`, en);
  text(`${at}_ru`, ru);
  if (en === ru) fail(`${at}: the Russian text is the English text`);
}

function list(at: string, value: unknown, bounds: { min: number; max: number }): unknown[] {
  if (!Array.isArray(value)) fail(`${at}: not a list`);
  if (value.length < bounds.min || value.length > bounds.max) {
    fail(`${at}: ${value.length} items, expected ${bounds.min}–${bounds.max}`);
  }
  return value;
}

function validate(d: StrategyPagesDataset, strategies: Strategy[]): void {
  if (d.version !== "1.0") fail(`unknown version "${d.version}"`);
  if (!d.pages || typeof d.pages !== "object") fail("no pages");

  const known = new Map(strategies.map((s) => [s.slug, s]));
  for (const slug of Object.keys(d.pages)) {
    if (!known.has(slug)) fail(`page "${slug}" is not a strategy`);
  }
  for (const s of strategies) {
    if (!d.pages[s.slug]) fail(`strategy "${s.slug}" has no page`);
  }

  for (const s of strategies) {
    const p = d.pages[s.slug];
    const at = `page "${s.slug}"`;

    for (const f of STRING_FIELDS) pair(`${at}: ${f}`, p[`${f}_en`], p[`${f}_ru`]);

    for (const f of LIST_FIELDS) {
      const en = list(`${at}: ${f}_en`, p[`${f}_en`], LIST_BOUNDS);
      const ru = list(`${at}: ${f}_ru`, p[`${f}_ru`], LIST_BOUNDS);
      if (en.length !== ru.length) {
        fail(`${at}: ${f} has ${en.length} English items and ${ru.length} Russian ones`);
      }
      en.forEach((item, i) => pair(`${at}: ${f}[${i}]`, item, ru[i]));
    }

    // The per-moat notes are the row's moats, exactly — no extras, no gaps.
    if (!Array.isArray(p.per_moat)) fail(`${at}: per_moat is not a list`);
    const want = s.moats.map((m) => m.n);
    const got = p.per_moat.map((m) => m.n);
    for (const n of got) {
      if (!want.includes(n)) fail(`${at}: per_moat names moat #${n}, which the row does not map`);
      if (got.filter((x) => x === n).length > 1) fail(`${at}: per_moat lists moat #${n} twice`);
    }
    for (const n of want) {
      if (!got.includes(n)) fail(`${at}: per_moat is missing moat #${n}`);
    }
    for (const m of p.per_moat) pair(`${at}: per_moat #${m.n} why`, m.why_en, m.why_ru);

    const cases = list(`${at}: cases`, p.cases, CASE_BOUNDS) as StrategyCase[];
    for (const c of cases) {
      text(`${at}: case name`, c.name);
      pair(`${at}: case "${c.name}" what`, c.what_en, c.what_ru);
    }

    const seen = new Set<string>();
    const refs = (name: "combos" | "tensions", bounds: { min: number; max: number }) => {
      const items = list(`${at}: ${name}`, p[name], bounds) as StrategyRef[];
      for (const r of items) {
        if (!known.has(r.slug)) fail(`${at}: ${name} points at "${r.slug}", which does not exist`);
        if (r.slug === s.slug) fail(`${at}: ${name} points at itself`);
        if (seen.has(r.slug)) fail(`${at}: "${r.slug}" appears twice across combos and tensions`);
        seen.add(r.slug);
        pair(`${at}: ${name} "${r.slug}" why`, r.why_en, r.why_ru);
      }
    };
    refs("combos", COMBO_BOUNDS);
    refs("tensions", TENSION_BOUNDS);

    if (!STATUSES.includes(p.status)) fail(`${at}: status "${p.status}" is not draft or reviewed`);
  }
}

validate(data, STRATEGIES);

export const PAGES: Record<string, StrategyPage> = data.pages;
export const PAGES_VERSION = data.version;

export function pageOf(slug: string): StrategyPage {
  return PAGES[slug];
}

/**
 * The owner's review queue: every slug still at `draft`. Read by the build
 * report and the closure, never by a page.
 */
export const DRAFT_SLUGS: string[] = STRATEGIES.filter((s) => PAGES[s.slug].status === "draft").map(
  (s) => s.slug,
);

/**
 * Combos are directed — A may list B without B listing A. The one-sided pairs
 * are reported, not rejected: they are the seed of the future co-occurrence
 * matrix, and the owner decides which direction was the honest one.
 */
export const ONE_SIDED_COMBOS: { from: string; to: string }[] = STRATEGIES.flatMap((s) =>
  PAGES[s.slug].combos
    .filter((c) => !PAGES[c.slug].combos.some((back) => back.slug === s.slug))
    .map((c) => ({ from: s.slug, to: c.slug })),
).sort((a, b) => essayIndex[a.from] - essayIndex[b.from] || essayIndex[a.to] - essayIndex[b.to]);
