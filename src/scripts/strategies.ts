/**
 * Sheet III's table — one of the two projections of the same 80 rows.
 *
 * The table arrives complete from the server: 80 rows in essay order under 13
 * group headers, every fact a filter needs stamped on the row as a data
 * attribute. This script never builds a row; it hides, re-orders and counts.
 * The state — filters, sort, the view itself — lives in `strategies-state.ts`
 * and in the query string; this module only subscribes and redraws.
 *
 * Words come through `window.__STRATEGIES__`, filled by `strategies.astro`.
 */
import { fold } from "../lib/fold";
import { parseMoatParam, parseMoats } from "../lib/lanes-select";
import {
  onStateChange,
  rankOfCat,
  rankOfRole,
  setCats,
  words,
  type Dir,
  type Payload,
  type SortKey,
  type StrategiesState,
} from "./strategies-state";

const tbody = document.getElementById("rows");

if (words && tbody) boot(words, tbody);

function boot(words: Payload, tbody: HTMLElement): void {
  const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.strategy"));
  const groups = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.group"));
  const emptyRow = document.getElementById("empty") as HTMLTableRowElement | null;
  const count = document.getElementById("count");
  const total = rows.length;

  const lang = document.documentElement.lang || "en";
  const collator = new Intl.Collator(lang, { sensitivity: "base" });
  let first = true;

  /* ── rows in, rows out ───────────────────────────────── */
  function matches(row: HTMLTableRowElement, s: Readonly<StrategiesState>, q: string, moats: number[]): boolean {
    const d = row.dataset;
    if (s.cats.size && !s.cats.has(d.cat ?? "")) return false;
    if (s.roles.size && !s.roles.has(d.role ?? "")) return false;
    if (moats.length && !parseMoats(d.moats ?? "").some((m) => moats.includes(m.n))) return false;
    if (q && !(d.search ?? "").includes(q)) return false;
    return true;
  }

  function compare(sort: SortKey, dir: Dir) {
    return (a: HTMLTableRowElement, b: HTMLTableRowElement): number => {
      const sign = dir === "asc" ? 1 : -1;
      let c = 0;
      switch (sort) {
        case "name":
          c = collator.compare(a.dataset.name ?? "", b.dataset.name ?? "");
          break;
        case "role":
          c = rankOfRole(a.dataset.role ?? "") - rankOfRole(b.dataset.role ?? "");
          break;
        case "depth": {
          // "—" sorts last whichever way the column points.
          const da = a.dataset.depth ? Number(a.dataset.depth) : null;
          const db = b.dataset.depth ? Number(b.dataset.depth) : null;
          if (da === null && db === null) c = 0;
          else if (da === null) return 1;
          else if (db === null) return -1;
          else c = da - db;
          break;
        }
        case "cat":
          c = rankOfCat(a.dataset.cat ?? "") - rankOfCat(b.dataset.cat ?? "");
          break;
      }
      // Essay order is always the tie-breaker — inside a category the rows keep
      // the essay's sequence whichever way the column points.
      const tie = Number(a.dataset.idx) - Number(b.dataset.idx);
      return c !== 0 ? c * sign : tie;
    };
  }

  function apply(s: Readonly<StrategiesState>): void {
    const q = fold(s.q);
    const moats = parseMoatParam(s.moat);
    let shown = 0;
    const perGroup = new Map<string, number>();
    for (const row of rows) {
      const on = matches(row, s, q, moats);
      row.hidden = !on;
      if (on) {
        shown++;
        perGroup.set(row.dataset.cat ?? "", (perGroup.get(row.dataset.cat ?? "") ?? 0) + 1);
      }
    }

    const grouped = s.sort === "cat";
    const sorted = [...rows].sort(compare(s.sort, s.dir));
    const frag = document.createDocumentFragment();
    if (grouped) {
      const order = s.dir === "asc" ? groups : [...groups].reverse();
      for (const g of order) {
        const slug = g.dataset.group ?? "";
        const n = perGroup.get(slug) ?? 0;
        g.hidden = n === 0;
        const label = g.querySelector("[data-count]");
        if (label) label.textContent = String(n);
        frag.appendChild(g);
        for (const row of sorted) if (row.dataset.cat === slug) frag.appendChild(row);
      }
    } else {
      for (const g of groups) {
        g.hidden = true;
        frag.appendChild(g);
      }
      for (const row of sorted) frag.appendChild(row);
    }
    if (emptyRow) {
      emptyRow.hidden = shown > 0;
      frag.appendChild(emptyRow);
    }
    tbody.appendChild(frag);

    // The count belongs to whichever view is on screen; the map keeps its own.
    if (count && s.view === "table") {
      count.textContent = words.count.replace("{n}", String(shown)).replace("{total}", String(total));
    }
  }

  onStateChange((s) => {
    apply(s);
    if (!first) return;
    first = false;
    // The row the address names may have been scrolled past before the filters
    // hid its neighbours; bring it back into view once the table has settled.
    const target = window.location.hash.slice(1);
    if (s.view === "table" && target) {
      document.getElementById(target)?.scrollIntoView({ block: "center" });
    }
  });

  // A category in a row is the one-click filter for that category; the lane
  // labels on the map carry the same href and the map handles those.
  tbody.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("td.c-cat a[data-cat]");
    if (!a) return;
    e.preventDefault();
    setCats([a.dataset.cat ?? ""]);
  });
}
