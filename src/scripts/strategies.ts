/**
 * Sheet III's table engine — filtering, sorting and the address.
 *
 * The table arrives complete from the server: 80 rows in essay order under 13
 * group headers, every fact a filter needs stamped on the row as a data
 * attribute. This script never builds a row; it hides, re-orders and counts.
 * The whole state lives in the query string, the same discipline as the
 * calculator's hash — `?cat=accumulation,price&role=hold&q=net&sort=depth:desc`
 * — defaults blank, `replaceState` not `pushState`, the row anchor untouched
 * so `?role=hold#usership` is one address. No storage anywhere.
 *
 * Words come through `window.__STRATEGIES__`, filled by `strategies.astro`.
 */
import { fold } from "../lib/fold";

interface Payload {
  count: string;
  empty: string;
  sortAsc: string;
  sortDesc: string;
  roles: string[];
  categories: string[];
  path: string;
}

declare global {
  interface Window {
    __STRATEGIES__?: Payload;
  }
}

type SortKey = "cat" | "name" | "role" | "depth";
type Dir = "asc" | "desc";

const SORT_KEYS: SortKey[] = ["cat", "name", "role", "depth"];
/** The direction a column starts in when first clicked. */
const DEFAULT_DIR: Record<SortKey, Dir> = { cat: "asc", name: "asc", role: "asc", depth: "desc" };

const words = window.__STRATEGIES__;
const tbody = document.getElementById("rows");
const form = document.getElementById("filters") as HTMLFormElement | null;

if (words && tbody && form) boot(words, tbody, form);

function boot(words: Payload, tbody: HTMLElement, form: HTMLFormElement): void {
  const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.strategy"));
  const groups = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr.group"));
  const emptyRow = document.getElementById("empty") as HTMLTableRowElement | null;
  const total = rows.length;

  const catBoxes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="cat"]'));
  const roleBoxes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="role"]'));
  const moatSelect = form.querySelector<HTMLSelectElement>('select[name="moat"]');
  const search = form.querySelector<HTMLInputElement>('input[name="q"]');
  const count = document.getElementById("count");
  const clear = document.getElementById("clear") as HTMLAnchorElement | null;
  const preset = document.getElementById("preset-hold") as HTMLAnchorElement | null;
  const headers = Array.from(
    document.querySelectorAll<HTMLTableCellElement>("thead th[data-sort]"),
  );

  const lang = document.documentElement.lang || "en";
  const collator = new Intl.Collator(lang, { sensitivity: "base" });
  const roleRank = new Map(words.roles.map((r, i) => [r, i]));
  const catRank = new Map(words.categories.map((c, i) => [c, i]));
  const validMoats = new Set(
    moatSelect ? Array.from(moatSelect.options).map((o) => o.value).filter(Boolean) : [],
  );

  const state = {
    cats: new Set<string>(),
    roles: new Set<string>(),
    moat: "",
    q: "",
    sort: "cat" as SortKey,
    dir: "asc" as Dir,
  };

  /* ── the address in, unknown values dropped ─────────── */
  function readUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const list = (key: string, valid: (v: string) => boolean) =>
      new Set((params.get(key) ?? "").split(",").map((v) => v.trim()).filter((v) => v && valid(v)));
    state.cats = list("cat", (v) => catRank.has(v));
    state.roles = list("role", (v) => roleRank.has(v));
    const moat = params.get("moat") ?? "";
    state.moat = validMoats.has(moat) ? moat : "";
    state.q = (params.get("q") ?? "").trim();
    const [key, dir] = (params.get("sort") ?? "").split(":");
    if (SORT_KEYS.includes(key as SortKey)) {
      state.sort = key as SortKey;
      state.dir = dir === "asc" || dir === "desc" ? dir : DEFAULT_DIR[state.sort];
    } else {
      state.sort = "cat";
      state.dir = "asc";
    }
  }

  /* ── the address out, defaults blank, the anchor kept ─── */
  function writeUrl(): void {
    const url = new URL(window.location.href);
    const set = (key: string, value: string) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    };
    set("cat", [...state.cats].sort((a, b) => catRank.get(a)! - catRank.get(b)!).join(","));
    set("role", [...state.roles].sort((a, b) => roleRank.get(a)! - roleRank.get(b)!).join(","));
    set("moat", state.moat);
    set("q", state.q);
    set("sort", state.sort === "cat" && state.dir === "asc" ? "" : `${state.sort}:${state.dir}`);
    // The lists and the sort read as written — `cat=price,time`, `sort=depth:desc`
    // — not as the percent-escapes URLSearchParams would print.
    url.search = url.searchParams.toString().replace(/%2C/g, ",").replace(/%3A/g, ":");
    history.replaceState(null, "", url);
  }

  function isDefault(): boolean {
    return (
      !state.cats.size &&
      !state.roles.size &&
      !state.moat &&
      !state.q &&
      state.sort === "cat" &&
      state.dir === "asc"
    );
  }

  /* ── rows in, rows out ───────────────────────────────── */
  function matches(row: HTMLTableRowElement, q: string): boolean {
    const d = row.dataset;
    if (state.cats.size && !state.cats.has(d.cat ?? "")) return false;
    if (state.roles.size && !state.roles.has(d.role ?? "")) return false;
    if (state.moat && !(d.moats ?? "").split(",").includes(state.moat)) return false;
    if (q && !(d.search ?? "").includes(q)) return false;
    return true;
  }

  function compare(a: HTMLTableRowElement, b: HTMLTableRowElement): number {
    const sign = state.dir === "asc" ? 1 : -1;
    let c = 0;
    switch (state.sort) {
      case "name":
        c = collator.compare(a.dataset.name ?? "", b.dataset.name ?? "");
        break;
      case "role":
        c = (roleRank.get(a.dataset.role ?? "") ?? 99) - (roleRank.get(b.dataset.role ?? "") ?? 99);
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
        c = (catRank.get(a.dataset.cat ?? "") ?? 99) - (catRank.get(b.dataset.cat ?? "") ?? 99);
        break;
    }
    // Essay order is always the tie-breaker — inside a category the rows keep
    // the essay's sequence whichever way the column points.
    const tie = Number(a.dataset.idx) - Number(b.dataset.idx);
    return c !== 0 ? c * sign : tie;
  }

  function apply(): void {
    const q = fold(state.q);
    let shown = 0;
    const perGroup = new Map<string, number>();
    for (const row of rows) {
      const on = matches(row, q);
      row.hidden = !on;
      if (on) {
        shown++;
        perGroup.set(row.dataset.cat ?? "", (perGroup.get(row.dataset.cat ?? "") ?? 0) + 1);
      }
    }

    const grouped = state.sort === "cat";
    const sorted = [...rows].sort(compare);
    const frag = document.createDocumentFragment();
    if (grouped) {
      const order = state.dir === "asc" ? groups : [...groups].reverse();
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

    if (count) {
      count.textContent = words.count.replace("{n}", String(shown)).replace("{total}", String(total));
    }
    if (clear) clear.hidden = isDefault();
  }

  function syncControls(): void {
    for (const b of catBoxes) b.checked = state.cats.has(b.value);
    for (const b of roleBoxes) b.checked = state.roles.has(b.value);
    if (moatSelect) moatSelect.value = state.moat;
    if (search && search.value.trim() !== state.q) search.value = state.q;
    for (const th of headers) {
      const on = th.dataset.sort === state.sort;
      th.setAttribute("aria-sort", on ? (state.dir === "asc" ? "ascending" : "descending") : "none");
      const button = th.querySelector("button");
      if (button) button.title = on ? (state.dir === "asc" ? words.sortAsc : words.sortDesc) : "";
    }
  }

  function update(): void {
    syncControls();
    apply();
    writeUrl();
  }

  /* ── the controls ────────────────────────────────────── */
  form.addEventListener("submit", (e) => e.preventDefault());

  form.addEventListener("change", (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.name === "cat" || el.name === "role") {
      const set = el.name === "cat" ? state.cats : state.roles;
      if ((el as HTMLInputElement).checked) set.add(el.value);
      else set.delete(el.value);
    } else if (el.name === "moat") {
      state.moat = el.value;
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

  for (const th of headers) {
    th.querySelector("button")?.addEventListener("click", () => {
      const key = th.dataset.sort as SortKey;
      if (state.sort === key) state.dir = state.dir === "asc" ? "desc" : "asc";
      else {
        state.sort = key;
        state.dir = DEFAULT_DIR[key];
      }
      update();
    });
  }

  // A category in a row is the one-click filter for that category.
  tbody.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-cat]");
    if (!a) return;
    e.preventDefault();
    state.cats = new Set([a.dataset.cat ?? ""]);
    update();
  });

  preset?.addEventListener("click", (e) => {
    e.preventDefault();
    state.roles = new Set(["hold"]);
    update();
  });

  // Clear goes to the bare path — the same page with nothing in the address.
  clear?.addEventListener("click", (e) => {
    e.preventDefault();
    state.cats.clear();
    state.roles.clear();
    state.moat = "";
    state.q = "";
    state.sort = "cat";
    state.dir = "asc";
    if (search) search.value = "";
    syncControls();
    apply();
    history.replaceState(null, "", words.path + window.location.hash);
  });

  // Back/forward between addresses of this page re-reads the query.
  window.addEventListener("popstate", () => {
    readUrl();
    syncControls();
    apply();
  });

  readUrl();
  update();

  // The row the address names may have been scrolled to before the filters
  // hid its neighbours; bring it back into view once the table has settled.
  const target = window.location.hash.slice(1);
  if (target) document.getElementById(target)?.scrollIntoView({ block: "center" });
}
