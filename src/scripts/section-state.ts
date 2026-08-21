/**
 * Sheet I's shared control state: the grouping axis, the two isolation
 * filters and the view — the 3D section or the text list. The HUD controls
 * are bound here once; the scene and the list both subscribe, so a filter
 * set in one view is the same filter in the other, and neither module ever
 * reads the other's DOM.
 *
 * The whole state lives in the URL — `?view=list&group=solo&rock=minds` (or
 * `&depth=2`) — so any configuration is a link, and the sheet pages' Atlas
 * crumb can send a reader back to exactly what they left. Defaults stay out
 * of the address: a bare `/` is the scene, grouped by rock, unfiltered. The
 * view's initial value is read off the `view-list` class the inline bootstrap
 * in `index.astro` puts on <html> before first paint; the rest is read here.
 */
import {
  GROUPING_AXES,
  ROCK_ORDER,
  DEPTH_LEVELS,
  type DepthLevel,
  type GroupingAxis,
  type RockKey,
} from "../data/moats";
import {
  trackDepthIsolate,
  trackGrouping,
  trackRockIsolate,
  trackViewMode,
} from "../lib/analytics";

export type SectionView = "scene" | "list";

export interface SectionState {
  view: SectionView;
  axis: GroupingAxis;
  /** Isolated rock — exclusive with `depth`; both null means everything. */
  rock: RockKey | null;
  depth: DepthLevel | null;
}

/** What just changed — subscribers redraw only what the change touches. */
export type SectionChange = "view" | "axis" | "filter";
type Listener = (state: Readonly<SectionState>, change: SectionChange) => void;

const params = new URLSearchParams(window.location.search);
const urlAxis = params.get("group") as GroupingAxis | null;
const urlRock = params.get("rock") as RockKey | null;
const urlDepth = Number(params.get("depth")) as DepthLevel;

const state: SectionState = {
  view: document.documentElement.classList.contains("view-list") ? "list" : "scene",
  axis: urlAxis && GROUPING_AXES.includes(urlAxis) ? urlAxis : "rock",
  rock: urlRock && ROCK_ORDER.includes(urlRock) ? urlRock : null,
  depth: DEPTH_LEVELS.includes(urlDepth) ? urlDepth : null,
};
// The two filters are exclusive everywhere else; a crafted URL carrying both
// keeps the rock, as the legend click would have.
if (state.rock) state.depth = null;

const listeners: Listener[] = [];

export function onSectionChange(fn: Listener): void {
  listeners.push(fn);
}

export function sectionState(): Readonly<SectionState> {
  return state;
}

function emit(change: SectionChange): void {
  for (const fn of listeners) fn(state, change);
}

/* ── the controls, bound once for both views ───────────── */
const grpButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("#groupers .grp"),
);
const legendItems = Array.from(
  document.querySelectorAll<HTMLLIElement>("#legend-list li"),
);
const depthItems = Array.from(
  document.querySelectorAll<HTMLLIElement>("#depth-list li"),
);
const viewLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>(".view-switch a"),
);

function sync(): void {
  document.documentElement.classList.toggle("view-list", state.view === "list");
  for (const b of grpButtons) {
    const on = b.dataset.axis === state.axis;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const li of legendItems) {
    const on = li.dataset.rock === state.rock;
    li.classList.toggle("on", on);
    li.setAttribute("aria-pressed", String(on));
  }
  for (const li of depthItems) {
    const on = Number(li.dataset.depth) === state.depth;
    li.classList.toggle("on", on);
    li.setAttribute("aria-pressed", String(on));
  }
  for (const a of viewLinks) {
    if (a.dataset.view === state.view) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
}

/** Every piece of state is a link — keep the address honest, defaults blank. */
function syncUrl(): void {
  const url = new URL(window.location.href);
  const write = (key: string, value: string | null) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  };
  write("view", state.view === "list" ? "list" : null);
  write("group", state.axis === "rock" ? null : state.axis);
  write("rock", state.rock);
  write("depth", state.depth ? String(state.depth) : null);
  history.replaceState(null, "", url);
}

/* ── actions ───────────────────────────────────────────── */
export function setAxis(axis: GroupingAxis): void {
  if (state.axis === axis) return;
  state.axis = axis;
  sync();
  syncUrl();
  emit("axis");
  trackGrouping(axis);
}

export function toggleRock(rock: RockKey): void {
  state.rock = state.rock === rock ? null : rock;
  state.depth = null;
  sync();
  syncUrl();
  emit("filter");
  trackRockIsolate(state.rock);
}

export function toggleDepth(level: DepthLevel): void {
  state.depth = state.depth === level ? null : level;
  state.rock = null;
  sync();
  syncUrl();
  emit("filter");
  trackDepthIsolate(state.depth);
}

/** Taking a core clears both filters — untracked, as it always was. */
export function clearIsolation(): void {
  if (!state.rock && !state.depth) return;
  state.rock = null;
  state.depth = null;
  sync();
  syncUrl();
  emit("filter");
}

export function setView(view: SectionView): void {
  if (state.view === view) return;
  state.view = view;
  sync();
  syncUrl();
  emit("view");
  trackViewMode(view);
}

/* ── wiring ────────────────────────────────────────────── */
/** The legend rows are list items — give them the keyboard a button has. */
function pressable(el: HTMLElement, action: () => void): void {
  el.setAttribute("role", "button");
  el.tabIndex = 0;
  el.addEventListener("click", action);
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    action();
  });
}

for (const btn of grpButtons) {
  const axis = btn.dataset.axis as GroupingAxis;
  if (!GROUPING_AXES.includes(axis)) continue;
  btn.addEventListener("click", () => setAxis(axis));
}

for (const li of legendItems) {
  const rock = li.dataset.rock as RockKey;
  if (!ROCK_ORDER.includes(rock)) continue;
  pressable(li, () => toggleRock(rock));
}

for (const li of depthItems) {
  const level = Number(li.dataset.depth) as DepthLevel;
  if (!DEPTH_LEVELS.includes(level)) continue;
  pressable(li, () => toggleDepth(level));
}

for (const a of viewLinks) {
  const view = a.dataset.view;
  if (view !== "scene" && view !== "list") continue;
  a.addEventListener("click", (e) => {
    // Modified clicks keep their usual meaning: the view is a real URL.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setView(view);
  });
}

sync();
