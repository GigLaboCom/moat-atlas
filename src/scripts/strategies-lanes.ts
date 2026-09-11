/**
 * Sheet III's map — the 80 strategies as 13 lanes, the other projection of the
 * page the table draws.
 *
 * The lanes arrive complete from the server; this script never builds a card.
 * It lights, dims and collapses, and it reads every fact it needs off the
 * card's own data attributes — the dataset is not shipped to the browser a
 * second time. What "lit" means is decided by `src/lib/lanes-select.ts`, the
 * same pure function the gate script runs against the JSON.
 *
 * Three gestures live here and nowhere else:
 *  - hovering (or focusing) a moat chip lights every other card that carries
 *    the same `#N` — transient, never written to the address;
 *  - the ⊙ in a lane label isolates that lane (`?cat=<slug>`, shared with the
 *    table, so the two views filter as one);
 *  - the banner says what the address lit, and clears it.
 */
import {
  hasHighlight,
  litRows,
  parseMoats,
  type LaneRow,
} from "../lib/lanes-select";
import {
  clearAll,
  onStateChange,
  strategiesState,
  toggleCat,
  words,
  type Payload,
  type StrategiesState,
} from "./strategies-state";

const lanesEl = document.getElementById("lanes");

if (words && lanesEl) boot(words, lanesEl);

function boot(w: Payload, lanes: HTMLElement): void {
  const laneEls = Array.from(lanes.querySelectorAll<HTMLElement>("section.lane"));
  const cardEls = Array.from(lanes.querySelectorAll<HTMLLIElement>("li.card"));
  const count = document.getElementById("count");
  const banner = document.getElementById("banner");
  const bannerWhat = document.getElementById("banner-what");
  const moatSelect = document.querySelector<HTMLSelectElement>('select[name="moat"]');

  const byCard = new Map<string, HTMLLIElement>();
  const rows: LaneRow[] = cardEls.map((el) => {
    const slug = el.dataset.slug ?? "";
    byCard.set(slug, el);
    return { slug, moats: parseMoats(el.dataset.moats ?? ""), search: el.dataset.search ?? "" };
  });

  /** The moat's name as the filter's own <option> spells it — "#1 Network effect". */
  const moatLabel = (n: number) =>
    moatSelect?.querySelector<HTMLOptionElement>(`option[value="${n}"]`)?.textContent?.trim() ??
    `#${n}`;

  /** Hover and focus light a moat across every lane, outside the address. */
  let hovered: Set<string> | null = null;
  let firstPaint = true;

  function paint(s: Readonly<StrategiesState>): void {
    const query = { moat: s.moat, kind: s.kind, hl: s.hl, q: s.q };
    const urlLit = litRows(rows, query);
    const lit = hovered ?? urlLit;
    const on = hovered !== null || hasHighlight(query);

    lanes.classList.toggle("lit", on && lit.size > 0);

    let shown = 0;
    for (const lane of laneEls) {
      const slug = lane.dataset.lane ?? "";
      const isolated = s.cats.size > 0 && !s.cats.has(slug);
      lane.classList.toggle("collapsed", isolated);
      const iso = lane.querySelector<HTMLButtonElement>(".iso");
      if (iso) iso.setAttribute("aria-pressed", String(s.cats.has(slug)));

      let visible = 0;
      for (const card of lane.querySelectorAll<HTMLLIElement>("li.card")) {
        const collapsed = s.roles.size > 0 && !s.roles.has(card.dataset.role ?? "");
        card.classList.toggle("collapsed", collapsed);
        card.classList.toggle("lit", lit.has(card.dataset.slug ?? ""));
        if (!collapsed) visible++;
      }
      if (!isolated) shown += visible;
      const label = lane.querySelector("[data-count]");
      if (label) label.textContent = String(visible);
    }

    if (count && s.view === "lanes") {
      count.textContent = w.count
        .replace("{n}", String(shown))
        .replace("{total}", String(rows.length));
    }

    if (banner && bannerWhat) {
      const parts: string[] = [];
      const moats = s.moat
        .split(",")
        .map((n) => Number(n))
        .filter(Boolean);
      if (moats.length) {
        parts.push(w.lanes.moat.replace("{moats}", moats.map(moatLabel).join(", ")));
      }
      const named = s.hl.map((slug) => byCard.get(slug)?.querySelector(".name")?.textContent?.trim()).filter(Boolean);
      if (named.length) parts.push(named.join(", "));
      if (s.q) parts.push(w.lanes.search.replace("{q}", s.q));
      const active = hasHighlight(query);
      banner.hidden = !active;
      if (active) {
        bannerWhat.textContent = urlLit.size
          ? `${w.lanes.label}: ${parts.join(" · ")}`
          : w.lanes.none;
      }
    }

    if (firstPaint) {
      firstPaint = false;
      if (s.view === "lanes") revealFirstLit(urlLit);
    }
  }

  /**
   * A link that lights something has to show it: if nothing lit is on screen
   * already, walk to the first lit lane and leave the header strip visible.
   * Never on hover — only on the address the reader arrived at.
   */
  function revealFirstLit(lit: Set<string>): void {
    if (!lit.size) return;
    const cards = [...lit].map((slug) => byCard.get(slug)).filter(Boolean) as HTMLLIElement[];
    const inView = cards.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
    if (inView) return;
    const lane = cards
      .map((el) => el.closest<HTMLElement>("section.lane"))
      .filter(Boolean)
      .sort((a, b) => laneEls.indexOf(a!) - laneEls.indexOf(b!))[0];
    if (!lane) return;
    window.scrollTo({ top: lane.getBoundingClientRect().top + window.scrollY - 72 });
  }

  onStateChange(paint);

  /* ── the chip gesture: where else does #N appear ──────── */
  function light(el: HTMLElement | null): void {
    const n = Number(el?.dataset.n);
    hovered = Number.isFinite(n) && n
      ? new Set(rows.filter((r) => r.moats.some((m) => m.n === n)).map((r) => r.slug))
      : null;
    paint(strategiesState());
  }

  const chipOf = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>(".chip[data-n]");
  lanes.addEventListener("mouseover", (e) => {
    const chip = chipOf(e);
    if (chip) light(chip);
  });
  lanes.addEventListener("mouseout", (e) => {
    if (chipOf(e)) light(null);
  });
  lanes.addEventListener("focusin", (e) => light(chipOf(e)));
  lanes.addEventListener("focusout", (e) => {
    if (chipOf(e)) light(null);
  });

  /* ── the lane label: isolate here, or filter the table ── */
  lanes.addEventListener("click", (e) => {
    const iso = (e.target as HTMLElement).closest<HTMLButtonElement>("button.iso");
    if (!iso) return;
    toggleCat(iso.dataset.iso ?? "");
  });

  banner?.querySelector(".clear")?.addEventListener("click", (e) => {
    e.preventDefault();
    clearAll();
  });
}
