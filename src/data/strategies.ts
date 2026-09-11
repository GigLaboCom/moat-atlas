/**
 * Sheet III — the 80 strategies from kepano's "Many ways to win", with the
 * atlas's overlay: which of them grow into a moat, and which one.
 *
 * `strategies.v1.json` beside this file is the canonical dataset and is checked
 * in byte-for-byte as it was published (Watchword `moat-atlas-strategies-data-v1`,
 * sha256 3c0211…3bba0). Nothing is retyped here; this module only types it,
 * validates it and derives what the pages need — the depth of a strategy, the
 * back-links of a moat. The strategy names, gists and roles are the one place
 * on the site where copy lives in `src/data/`: the dataset is bilingual by
 * design and is shipped as one document, so splitting it into the dictionaries
 * would break the "check in as-is" contract.
 *
 * Validation runs at import, so a broken dataset fails `astro build` with a
 * message naming the row — it never reaches a page as a silent dash.
 */
import { MOATS, byNumber, type Moat } from "./moats";
import raw from "./strategies.v1.json";

export type RoleKey = "hold" | "position" | "take" | "structure" | "protect" | "morph";
export type LinkKind = "direct" | "via" | "conditional";

/** The order the Role column sorts by — holds first, morphs last. */
export const ROLE_ORDER: RoleKey[] = ["hold", "position", "structure", "protect", "take", "morph"];
export const LINK_KINDS: LinkKind[] = ["direct", "via", "conditional"];

export interface StrategyRole {
  en: string;
  ru: string;
  gist_en: string;
  gist_ru: string;
}

export interface StrategyCategory {
  slug: string;
  en: string;
  ru: string;
}

export interface MoatLink {
  n: number;
  kind: LinkKind;
}

export interface Strategy {
  /** Stable row anchor — `/strategies/#usership`. Never renamed. */
  slug: string;
  category: string;
  name_en: string;
  name_ru: string;
  gist_en: string;
  gist_ru: string;
  /** Proper nouns and near-universal common nouns — English in both locales. */
  examples_nature: string[];
  examples_business: string[];
  role: RoleKey;
  moats: MoatLink[];
  /** The owner considers the mapping arguable; rendered with a marker, never hidden. */
  disputed: boolean;
  note_en: string;
  note_ru: string;
}

export interface StrategiesDataset {
  version: string;
  source: { title: string; author: string; url: string; note: string };
  roles: Record<RoleKey, StrategyRole>;
  categories: StrategyCategory[];
  strategies: Strategy[];
}

const data = raw as StrategiesDataset;

/* ── validation — every rule fails the build, none of them warns ──────── */
function fail(msg: string): never {
  throw new Error(`strategies.v1.json: ${msg}`);
}

function validate(d: StrategiesDataset): void {
  if (d.strategies.length !== 80) fail(`expected 80 strategies, found ${d.strategies.length}`);

  const categories = new Set(d.categories.map((c) => c.slug));
  if (categories.size !== d.categories.length) fail("duplicate category slug");
  const roles = new Set(Object.keys(d.roles));
  const slugs = new Set<string>();

  for (const s of d.strategies) {
    const at = `strategy "${s.slug}"`;
    if (!s.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) fail(`${at}: slug is not kebab-case`);
    if (slugs.has(s.slug)) fail(`${at}: duplicate slug`);
    slugs.add(s.slug);
    if (!categories.has(s.category)) fail(`${at}: unknown category "${s.category}"`);
    if (!roles.has(s.role)) fail(`${at}: unknown role "${s.role}"`);
    for (const key of ["name_en", "name_ru", "gist_en", "gist_ru"] as const) {
      if (!s[key] || !s[key].trim()) fail(`${at}: empty ${key}`);
    }
    if (!Array.isArray(s.examples_nature) || !Array.isArray(s.examples_business)) {
      fail(`${at}: examples must be arrays`);
    }
    const seen = new Set<number>();
    for (const m of s.moats) {
      if (!Number.isInteger(m.n) || !byNumber[m.n]) fail(`${at}: moat #${m.n} does not exist`);
      if (!LINK_KINDS.includes(m.kind)) fail(`${at}: moat #${m.n} has unknown kind "${m.kind}"`);
      if (seen.has(m.n)) fail(`${at}: moat #${m.n} listed twice`);
      seen.add(m.n);
    }
    if (s.disputed && !(s.note_en.trim() && s.note_ru.trim())) {
      fail(`${at}: disputed without a note in both locales`);
    }
  }
}

validate(data);

export const STRATEGIES: Strategy[] = data.strategies;
export const STRATEGY_COUNT = STRATEGIES.length;
export const CATEGORIES: StrategyCategory[] = data.categories;
export const ROLES: Record<RoleKey, StrategyRole> = data.roles;
export const SOURCE = data.source;
export const DATASET_VERSION = data.version;

export const categoryBySlug: Record<string, StrategyCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

/** Essay order — the default sort and the tie-breaker of every other one. */
export const essayIndex: Record<string, number> = Object.fromEntries(
  STRATEGIES.map((s, i) => [s.slug, i]),
);

export function strategiesIn(category: string): Strategy[] {
  return STRATEGIES.filter((s) => s.category === category);
}

/**
 * The depth of a strategy — the deepest of its moats, taken from the matrix
 * (never stored in the JSON). Direct links win; a strategy that only reaches a
 * moat *via* another or under a condition reports that depth with the kind, so
 * the page can mark it; no moats at all is `null`.
 */
export interface DerivedDepth {
  d: number;
  kind: LinkKind;
}

export function depthOf(s: Strategy): DerivedDepth | null {
  for (const kind of LINK_KINDS) {
    const ds = s.moats.filter((m) => m.kind === kind).map((m) => byNumber[m.n].d);
    if (ds.length) return { d: Math.max(...ds), kind };
  }
  return null;
}

/** The rocks a strategy digs into, through its direct moats. */
export function rocksOf(s: Strategy): Moat["rock"][] {
  return [...new Set(s.moats.filter((m) => m.kind === "direct").map((m) => byNumber[m.n].rock))];
}

/** Every strategy that leads to moat `n`, by kind — the sheet's back-link block. */
export type Backlinks = Record<LinkKind, Strategy[]>;

const backlinks: Record<number, Backlinks> = Object.fromEntries(
  MOATS.map((m) => [m.n, { direct: [], via: [], conditional: [] } as Backlinks]),
);
for (const s of STRATEGIES) {
  for (const m of s.moats) backlinks[m.n][m.kind].push(s);
}

export function backlinksFor(n: number): Backlinks {
  return backlinks[n];
}

export function hasBacklinks(b: Backlinks): boolean {
  return LINK_KINDS.some((k) => b[k].length > 0);
}

/** Moats no strategy reaches directly — a finding the owner wants visible. */
export const MOATS_WITHOUT_DIRECT: number[] = MOATS.filter(
  (m) => backlinks[m.n].direct.length === 0,
).map((m) => m.n);
