/**
 * Sheet III's shared control state — the view, the filters, the highlight.
 *
 * The page has two projections of the same 80 rows: the table and the lanes.
 * The controls are bound here once; both renderers subscribe, so a filter set
 * in one view is the same filter in the other, and neither module reads the
 * other's DOM. The same shape sheet I uses for its scene and its list
 * (`section-state.ts`).
 *
 * The whole state is the query string — defaults blank, `replaceState`, the
 * `#slug` anchor untouched, unknown values dropped in silence:
 *
 *   ?view=lanes&cat=price&role=hold&moat=1&kind=via&hl=luxury,affordability&q=net
 *
 * Two parameters belong to one view each and are cleared when the reader
 * leaves it: `sort` is the table's (the lanes never re-order a lane — the
 * essay's order is part of what the map shows), `hl`/`kind` are the map's.
 * `moat` belongs to both and means the same thing in both — the rows that lead
 * to that moat — which the table renders by filtering and the map by lighting.
 */
import { parseMoatParam, parseSlugList } from "../lib/lanes-select";

export interface Payload {
  count: string;
  empty: string;
  sortAsc: string;
  sortDesc: string;
  roles: string[];
  categories: string[];
  path: string;
  lanes: {
    label: string;
    moat: string;
    search: string;
    none: string;
  };
}

declare global {
  interface Window {
    __STRATEGIES__?: Payload;
  }
}

export type SortKey = "cat" | "name" | "role" | "depth";
export type Dir = "asc" | "desc";
export type StrategiesView = "table" | "lanes";

const SORT_KEYS: SortKey[] = ["cat", "name", "role", "depth"];
/** The direction a column starts in when first clicked. */
export const DEFAULT_DIR: Record<SortKey, Dir> = {
  cat: "asc",
  name: "asc",
  role: "asc",
  depth: "desc",
};
const KINDS = ["direct", "via", "conditional"];

export interface StrategiesState {
  view: StrategiesView;
  cats: Set<string>;
  roles: Set<string>;
  /** As written — one moat or a comma list; every entry exists in the matrix. */
  moat: string;
  /** Narrows `moat` to one link kind on the map; ignored without `moat`. */
  kind: string;
  /** Slugs the address lights on the map. */
  hl: string[];
  q: string;
  sort: SortKey;
  dir: Dir;
}

export const words = window.__STRATEGIES__;
const form = document.getElementById("filters") as HTMLFormElement | null;

const state: StrategiesState = {
  view: document.documentElement.classList.contains("view-lanes") ? "lanes" : "table",
  cats: new Set(),
  roles: new Set(),
  moat: "",
  kind: "",
  hl: [],
  q: "",
  sort: "cat",
  dir: "asc",
};

export function strategiesState(): Readonly<StrategiesState> {
  return state;
}

type Listener = (state: Readonly<StrategiesState>) => void;
const listeners: Listener[] = [];

export function onStateChange(fn: Listener): void {
  listeners.push(fn);
}

function emit(): void {
  for (const fn of listeners) fn(state);
}

/* ── the controls ──────────────────────────────────────── */
const catBoxes = Array.from(form?.querySelectorAll<HTMLInputElement>('input[name="cat"]') ?? []);
const roleBoxes = Array.from(form?.querySelectorAll<HTMLInputElement>('input[name="role"]') ?? []);
const moatSelect = form?.querySelector<HTMLSelectElement>('select[name="moat"]') ?? null;
const search = form?.querySelector<HTMLInputElement>('input[name="q"]') ?? null;
const clear = document.getElementById("clear") as HTMLAnchorElement | null;
const preset = document.getElementById("preset-hold") as HTMLAnchorElement | null;
const viewLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".view-switch a"));
export const headers = Array.from(
  document.querySelectorAll<HTMLTableCellElement>("thead th[data-sort]"),
);

const catRank = new Map((words?.categories ?? []).map((c, i) => [c, i]));
const roleRank = new Map((words?.roles ?? []).map((r, i) => [r, i]));
const validMoats = new Set(
  moatSelect ? Array.from(moatSelect.options).map((o) => o.value).filter(Boolean) : [],
);
// The slugs that exist are the ones on the page — the dataset itself never
// reaches the browser, so the map's own cards are what `hl=` is checked against.
const validSlugs = new Set(
  Array.from(document.querySelectorAll<HTMLElement>("#lanes li.card[data-slug]")).map(
    (el) => el.dataset.slug ?? "",
  ),
);

export function rankOfCat(slug: string): number {
  return catRank.get(slug) ?? 99;
}

export function rankOfRole(role: string): number {
  return roleRank.get(role) ?? 99;
}

/* ── the address in, unknown values dropped ────────────── */
function readUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const list = (key: string, valid: (v: string) => boolean) =>
    new Set(
      (params.get(key) ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v && valid(v)),
    );

  state.view = params.get("view") === "lanes" ? "lanes" : "table";
  state.cats = list("cat", (v) => catRank.has(v));
  state.roles = list("role", (v) => roleRank.has(v));
  state.moat = parseMoatParam(params.get("moat") ?? "")
    .filter((n) => validMoats.has(String(n)))
    .join(",");
  state.q = (params.get("q") ?? "").trim();

  const kind = params.get("kind") ?? "";
  state.kind = state.view === "lanes" && state.moat && KINDS.includes(kind) ? kind : "";
  state.hl =
    state.view === "lanes"
      ? parseSlugList(params.get("hl") ?? "").filter((slug) => validSlugs.has(slug))
      : [];

  const [key, dir] = (params.get("sort") ?? "").split(":");
  if (state.view === "table" && SORT_KEYS.includes(key as SortKey)) {
    state.sort = key as SortKey;
    state.dir = dir === "asc" || dir === "desc" ? dir : DEFAULT_DIR[state.sort];
  } else {
    state.sort = "cat";
    state.dir = "asc";
  }
}

/* ── the address out, defaults blank, the anchor kept ──── */
function writeUrl(): void {
  const url = new URL(window.location.href);
  const set = (key: string, value: string) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  };
  set("view", state.view === "lanes" ? "lanes" : "");
  set("cat", [...state.cats].sort((a, b) => rankOfCat(a) - rankOfCat(b)).join(","));
  set("role", [...state.roles].sort((a, b) => rankOfRole(a) - rankOfRole(b)).join(","));
  set("moat", state.moat);
  set("kind", state.view === "lanes" ? state.kind : "");
  set("hl", state.view === "lanes" ? state.hl.join(",") : "");
  set("q", state.q);
  set(
    "sort",
    state.view === "lanes" || (state.sort === "cat" && state.dir === "asc")
      ? ""
      : `${state.sort}:${state.dir}`,
  );
  // The lists and the sort read as written — `cat=price,time`, `sort=depth:desc`
  // — not as the percent-escapes URLSearchParams would print.
  url.search = url.searchParams.toString().replace(/%2C/g, ",").replace(/%3A/g, ":");
  history.replaceState(null, "", url);
}

export function isDefault(): boolean {
  return (
    !state.cats.size &&
    !state.roles.size &&
    !state.moat &&
    !state.q &&
    !state.hl.length &&
    !state.kind &&
    state.sort === "cat" &&
    state.dir === "asc"
  );
}

function syncControls(): void {
  document.documentElement.classList.toggle("view-lanes", state.view === "lanes");
  for (const b of catBoxes) b.checked = state.cats.has(b.value);
  for (const b of roleBoxes) b.checked = state.roles.has(b.value);
  if (moatSelect) moatSelect.value = validMoats.has(state.moat) ? state.moat : "";
  if (search && search.value.trim() !== state.q) search.value = state.q;
  for (const a of viewLinks) {
    if (a.dataset.view === state.view) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
  for (const th of headers) {
    const on = th.dataset.sort === state.sort;
    th.setAttribute("aria-sort", on ? (state.dir === "asc" ? "ascending" : "descending") : "none");
    const button = th.querySelector("button");
    if (button && words) button.title = on ? (state.dir === "asc" ? words.sortAsc : words.sortDesc) : "";
  }
  if (clear) clear.hidden = isDefault();
}

function update(): void {
  syncControls();
  emit();
  writeUrl();
}

/* ── actions ───────────────────────────────────────────── */
export function setView(view: StrategiesView): void {
  if (state.view === view) return;
  state.view = view;
  // Each view drops the parameter that means nothing in the other: the table
  // keeps no highlight, the map keeps no sort.
  if (view === "lanes") {
    state.sort = "cat";
    state.dir = "asc";
  } else {
    state.hl = [];
    state.kind = "";
  }
  update();
}

export function setCats(cats: string[]): void {
  state.cats = new Set(cats.filter((c) => catRank.has(c)));
  update();
}

export function toggleCat(slug: string): void {
  if (!catRank.has(slug)) return;
  if (state.cats.has(slug)) state.cats.delete(slug);
  else state.cats.add(slug);
  update();
}

export function setSort(key: SortKey): void {
  if (state.sort === key) state.dir = state.dir === "asc" ? "desc" : "asc";
  else {
    state.sort = key;
    state.dir = DEFAULT_DIR[key];
  }
  update();
}

export function clearAll(): void {
  state.cats.clear();
  state.roles.clear();
  state.moat = "";
  state.kind = "";
  state.hl = [];
  state.q = "";
  state.sort = "cat";
  state.dir = "asc";
  if (search) search.value = "";
  syncControls();
  emit();
  history.replaceState(
    null,
    "",
    (words?.path ?? window.location.pathname) +
      (state.view === "lanes" ? "?view=lanes" : "") +
      window.location.hash,
  );
}

/* ── wiring ────────────────────────────────────────────── */
if (form) {
  form.addEventListener("submit", (e) => e.preventDefault());

  form.addEventListener("change", (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.name === "cat" || el.name === "role") {
      const set = el.name === "cat" ? state.cats : state.roles;
      if ((el as HTMLInputElement).checked) set.add(el.value);
      else set.delete(el.value);
    } else if (el.name === "moat") {
      state.moat = el.value;
      if (!state.moat) state.kind = "";
    } else {
      return;
    }
    update();
  });

  let timer: number | undefined;
  search?.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      state.q = search.value.trim();
      update();
    }, 150);
  });
}

for (const th of headers) {
  th.querySelector("button")?.addEventListener("click", () => setSort(th.dataset.sort as SortKey));
}

preset?.addEventListener("click", (e) => {
  e.preventDefault();
  state.roles = new Set(["hold"]);
  update();
});

// Clear goes to the bare path — the same view with nothing else in the address.
clear?.addEventListener("click", (e) => {
  e.preventDefault();
  clearAll();
});

for (const a of viewLinks) {
  const view = a.dataset.view;
  if (view !== "table" && view !== "lanes") continue;
  a.addEventListener("click", (e) => {
    // Modified clicks keep their usual meaning: the view is a real URL.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setView(view);
  });
}

// Back/forward between addresses of this page re-reads the query.
window.addEventListener("popstate", () => {
  readUrl();
  syncControls();
  emit();
});

// The first read of the address happens once, after both renderers have
// subscribed — their modules evaluate in the same task as this one.
queueMicrotask(() => {
  readUrl();
  update();
});
