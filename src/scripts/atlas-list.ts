/**
 * Sheet I's text mode — the same 35 sheets as a readable list. The markup is
 * server-rendered in `index.astro`, grouped by rock; this module only re-groups
 * the entries along whatever axis the HUD picks and hides what the isolation
 * filters exclude. Group labels come through `window.__ATLAS__`, the way every
 * string reaches the scene — nothing user-visible is written here.
 */
import {
  MOATS,
  AXIS_BUCKETS,
  ROCK_COLORS,
  byNumber,
  bucketOf,
  type GroupingAxis,
  type RockKey,
} from "../data/moats";
import { onSectionChange, sectionState } from "./section-state";

const data = window.__ATLAS__;
const container = document.getElementById("list-groups");

if (data && container) {
  const groupsHost: HTMLElement = container;
  const labels = data.bucketLabels;

  /** Entry <li>s are server-rendered once and only ever re-parented. */
  const entries = new Map<number, HTMLLIElement>();
  for (const li of groupsHost.querySelectorAll<HTMLLIElement>(".entry")) {
    entries.set(Number(li.dataset.n), li);
  }

  /**
   * Rebuild the group sections for an axis and move the entries in. Built with
   * DOM calls, not markup — these elements miss Astro's scope attribute, so
   * their CSS in `index.astro` goes through `:global()` under `.atlas-list`.
   */
  function regroup(axis: GroupingAxis): void {
    const frag = document.createDocumentFragment();
    for (const bucket of AXIS_BUCKETS[axis]) {
      const items = MOATS.filter((m) => bucketOf(m, axis) === bucket);
      if (items.length === 0) continue;

      const section = document.createElement("section");
      section.className = "list-group";

      const heading = document.createElement("h2");
      if (axis === "rock") {
        const dot = document.createElement("i");
        dot.className = "dot";
        dot.style.background = ROCK_COLORS[bucket as RockKey];
        heading.append(dot);
      }
      const label = document.createElement("span");
      label.textContent = labels[axis][bucket] ?? bucket;
      const count = document.createElement("em");
      count.textContent = String(items.length);
      heading.append(label, count);

      const ol = document.createElement("ol");
      for (const m of items) {
        const li = entries.get(m.n);
        if (li) ol.append(li);
      }

      section.append(heading, ol);
      frag.append(section);
    }
    groupsHost.replaceChildren(frag);
  }

  /**
   * The filters hide rather than dim: a text list is for reading, and a dimmed
   * paragraph still costs the scroll. The group counts follow, so what the
   * filter kept is always on the ruler-side of the heading.
   */
  function applyFilter(): void {
    const { rock, depth } = sectionState();
    for (const [n, li] of entries) {
      const m = byNumber[n];
      li.hidden = rock
        ? m.rock !== rock
        : depth
          ? bucketOf(m, "depth") !== String(depth)
          : false;
    }
    for (const group of groupsHost.querySelectorAll<HTMLElement>(".list-group")) {
      const shown = group.querySelectorAll(".entry:not([hidden])").length;
      group.hidden = shown === 0;
      const count = group.querySelector("em");
      if (count) count.textContent = String(shown);
    }
  }

  onSectionChange((s, change) => {
    if (change === "axis") {
      regroup(s.axis);
      applyFilter();
    } else if (change === "filter") {
      applyFilter();
    } else if (s.view === "list") {
      // Arriving from the scene with a core taken: land on that entry. The
      // hash is already `#moat-N`, but the anchor only just became visible.
      const match = window.location.hash.match(/^#moat-(\d+)$/);
      const target = match && document.getElementById(`moat-${match[1]}`);
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
    }
  });
}
