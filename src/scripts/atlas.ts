/**
 * Sheet I — the cross-section.
 *
 * Ported from the v3 prototype: 35 shafts hanging from the ground plane, one per
 * mechanic, re-laid-out along any of the six axes of the catalogue. Shape and
 * colour encode the rock, thickness the capital, length the depth.
 *
 * The matrix itself is imported from `src/data/moats.ts` (language-neutral);
 * every string arrives through `window.__ATLAS__`, filled by `index.astro` from
 * the locale dictionary. Nothing user-visible is written in this file.
 */
import * as THREE from "three";

import {
  MOATS,
  DEPTH_LEVELS,
  ROCK_ORDER,
  ROCK_COLORS,
  ROCK_SHAPE,
  AXIS_BUCKETS,
  GROUPING_AXES,
  TERNARY_GLYPH,
  AI_GLYPH,
  bucketOf,
  type DepthLevel,
  type GroupingAxis,
  type Moat,
  type RockKey,
} from "../data/moats";
import {
  trackCoreTaken,
  trackDepthIsolate,
  trackGrouping,
  trackRockIsolate,
  trackSheetOpen,
} from "../lib/analytics";

export interface AtlasPayload {
  sheetBase: string;
  loading: string;
  /** Moat number → its localized name and (possibly empty) essence. */
  names: Record<number, { name: string; essence: string }>;
  rockNames: Record<RockKey, string>;
  /** Axis → bucket key → row label, e.g. `depth` → `3` → "3 · drill rig". */
  bucketLabels: Record<GroupingAxis, Record<string, string>>;
  axisLabels: Record<GroupingAxis, string>;
  tools: Record<string, string>;
  depthLabels: Record<string, string>;
  status: { atlas: string; grouping: string; isolated: string; isolatedDepth: string };
  specimen: { eyebrow: string; rock: string };
  draft: string;
}

declare global {
  interface Window {
    __ATLAS__?: AtlasPayload;
  }
}

/* ── layout constants, as in the prototype ─────────────── */
const UNIT = 1.3; // world units per depth level
const COLS = 9;
const DX = 1.35;
const DZ = 1.5;
const GAP = 1.9;
const ROW_LABEL_X = -6.6;
const NEUTRAL_LABEL = "#a8987f";

const THEMES = {
  dark: {
    earth: 0x14100c, gridMajor: 0x4a3b26, gridMinor: 0x2a2116,
    stratum: 0xe8dcc2, strataOpacity: 0.045, ring: 0xede3d1,
    // Sprite text keeps its rock colour on the dark earth...
    labelInk: null as string | null, labelMix: 0,
  },
  light: {
    earth: 0xf2ece0, gridMajor: 0xbfae90, gridMinor: 0xd8cbb4,
    stratum: 0x6b5b45, strataOpacity: 0.05, ring: 0x2a2118,
    // ...and is pulled towards the ink on the light one, or it washes out.
    labelInk: "#241b12" as string | null, labelMix: 0.45,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

/** Blend `hex` towards `target` by `amount` (0–1). */
function mixHex(hex: string, target: string, amount: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = parse(hex);
  const b = parse(target);
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? THEMES.light
    : THEMES.dark;
}

function rockHex(rock: RockKey): string {
  return ROCK_COLORS[rock];
}

/** Cross-section shape encodes the rock; `w` is the diameter read off capital. */
function shaftGeometry(rock: RockKey, w: number, h: number): THREE.BufferGeometry {
  const shape = ROCK_SHAPE[rock];
  if (shape === "box") return new THREE.BoxGeometry(w, h, w);
  if (shape === "slab") return new THREE.BoxGeometry(w * 1.25, h, w * 0.6);
  const r = w * 0.58;
  return new THREE.CylinderGeometry(r, r, h, shape);
}

function shaftWidth(m: Moat): number {
  return 0.32 + m.capN * 0.1;
}

/** Text drawn to a canvas — the texture behind every sprite in the scene. */
function spriteTexture(text: string, color: string, big: boolean): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = big ? 512 : 128;
  cv.height = big ? 80 : 128;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = color;
  if (big) {
    ctx.font = '500 34px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    ctx.fillText(text.toUpperCase(), 502, 44);
  } else {
    ctx.font = '700 58px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 70);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Text hung in the scene as a sprite. */
function makeSprite(text: string, color: string, big: boolean): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: spriteTexture(text, color, big), transparent: true, depthWrite: false }),
  );
  sprite.scale.set(big ? 3.4 : 0.62, big ? 0.53 : 0.62, 1);
  return sprite;
}

/** Redraw an existing sprite — used when the theme flips under it. */
function retintSprite(sprite: THREE.Sprite, text: string, color: string, big: boolean): void {
  sprite.material.map?.dispose();
  sprite.material.map = spriteTexture(text, color, big);
  sprite.material.needsUpdate = true;
}

/** One drilled shaft — the mesh carrying its `Moat` in `userData`. */
type Shaft = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

interface Record3D {
  moat: Moat;
  shaft: Shaft;
  cap: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  label: THREE.Sprite;
  /** Target position for the current grouping — eased towards in the loop. */
  tx: number;
  tz: number;
}

function boot(data: AtlasPayload): void {
  const canvasEl = el<HTMLCanvasElement>("scene");
  const tooltipEl = el("tooltip");
  if (!canvasEl || !tooltipEl) return;
  // Aliased so the narrowing survives into the function declarations below.
  const canvas: HTMLCanvasElement = canvasEl;
  const tooltip: HTMLElement = tooltipEl;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    // No WebGL — the HUD stays, the fallback panel points at the catalogue.
    canvas.hidden = true;
    const fallback = el("webgl-fallback");
    if (fallback) fallback.hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let theme: Theme = currentTheme();

  /** Sprite ink for the current theme — rock colours alone vanish on light. */
  const tint = (color: string) =>
    theme.labelInk ? mixHex(color, theme.labelInk, theme.labelMix) : color;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.earth);
  scene.fog = new THREE.Fog(theme.earth, 16, 34);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // Lit dimly on purpose: the shafts carry their own emissive glow, and the
  // dimming of unselected cores has to stay readable against the ambient.
  scene.add(new THREE.AmbientLight(0x9a8a72, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.1);
  sun.position.set(7, 11, 5);
  scene.add(sun);
  const under = new THREE.PointLight(0xffd9a0, 10, 30);
  under.position.set(0, 3, 0);
  scene.add(under);

  /* ── the section itself ──────────────────────────────── */
  const atlas = new THREE.Group();
  scene.add(atlas);

  let grid = new THREE.GridHelper(17, 34, theme.gridMajor, theme.gridMinor);
  atlas.add(grid);

  const strata: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let k = 1; k <= 4; k++) {
    const stratum = new THREE.Mesh(
      new THREE.PlaneGeometry(17, 13),
      new THREE.MeshBasicMaterial({
        color: theme.stratum,
        transparent: true,
        opacity: theme.strataOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    stratum.rotation.x = -Math.PI / 2;
    stratum.position.y = -UNIT * k;
    atlas.add(stratum);
    strata.push(stratum);
  }

  /* Shafts are born in the centre and slide out into the first grouping. */
  const shafts: Shaft[] = [];
  const records: Record3D[] = [];
  const byN = new Map<number, Record3D>();

  for (const m of MOATS) {
    const color = rockHex(m.rock);
    const h = m.d * UNIT;
    const w = shaftWidth(m);

    const shaft = new THREE.Mesh(
      shaftGeometry(m.rock, w, h),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.75,
        metalness: 0.05,
      }),
    );
    shaft.position.set(0, -h / 2, 0);
    shaft.userData = m;
    atlas.add(shaft);
    shafts.push(shaft);

    const cap = new THREE.Mesh(
      shaftGeometry(m.rock, w + 0.12, 0.05),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
    );
    cap.position.set(0, 0.025, 0);
    atlas.add(cap);

    const label = makeSprite(String(m.n), tint(color), false);
    label.position.set(0, 0.55, 0);
    atlas.add(label);

    const rec: Record3D = { moat: m, shaft, cap, label, tx: 0, tz: 0 };
    records.push(rec);
    byN.set(m.n, rec);
  }

  /* ── grouping: re-lay the sheet along an axis ─────────── */
  interface RowLabel { sprite: THREE.Sprite; text: string; color: string }
  let rowLabels: RowLabel[] = [];
  function clearRowLabels(): void {
    for (const { sprite } of rowLabels) {
      atlas.remove(sprite);
      sprite.material.map?.dispose();
      sprite.material.dispose();
    }
    rowLabels = [];
  }

  let currentAxis: GroupingAxis = "rock";

  function applyGrouping(axis: GroupingAxis, instant: boolean): void {
    currentAxis = axis;

    const groups = AXIS_BUCKETS[axis]
      .map((bucket) => ({
        label: data.bucketLabels[axis][bucket] ?? bucket,
        color: axis === "rock" ? rockHex(bucket as RockKey) : NEUTRAL_LABEL,
        items: MOATS.filter((m) => bucketOf(m, axis) === bucket),
      }))
      .filter((g) => g.items.length > 0);

    const heights = groups.map((g) => (Math.ceil(g.items.length / COLS) - 1) * DZ);
    const total = heights.reduce((a, b) => a + b, 0) + GAP * (groups.length - 1);
    let zCursor = -total / 2;

    clearRowLabels();
    groups.forEach((g, gi) => {
      g.items.forEach((m, i) => {
        const line = Math.floor(i / COLS);
        const inLine = Math.min(COLS, g.items.length - line * COLS);
        const col = i - line * COLS;
        const rec = byN.get(m.n)!;
        rec.tx = (col - (inLine - 1) / 2) * DX;
        rec.tz = zCursor + line * DZ;
      });

      const text = `${g.label} · ${g.items.length}`;
      const lbl = makeSprite(text, tint(g.color), true);
      lbl.position.set(ROW_LABEL_X, 0.16, zCursor + heights[gi] / 2);
      atlas.add(lbl);
      rowLabels.push({ sprite: lbl, text, color: g.color });
      zCursor += heights[gi] + GAP;
    });

    if (instant) {
      for (const rec of records) {
        rec.shaft.position.x = rec.tx;
        rec.shaft.position.z = rec.tz;
        rec.cap.position.x = rec.tx;
        rec.cap.position.z = rec.tz;
        rec.label.position.x = rec.tx;
        rec.label.position.z = rec.tz;
      }
    }
    if (selected) {
      const rec = byN.get((selected.userData as Moat).n)!;
      goal.target.set(rec.tx, -rec.moat.d * UNIT * 0.45, rec.tz);
    }
  }

  /* ── selection ring ──────────────────────────────────── */
  let ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null = null;
  function placeRing(shaft: THREE.Mesh): void {
    removeRing();
    const w = shaftWidth(shaft.userData as Moat);
    ring = new THREE.Mesh(
      new THREE.RingGeometry(w * 0.85, w * 0.85 + 0.07, 40),
      new THREE.MeshBasicMaterial({ color: theme.ring, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(shaft.position.x, 0.06, shaft.position.z);
    atlas.add(ring);
  }
  function removeRing(): void {
    if (!ring) return;
    atlas.remove(ring);
    ring.geometry.dispose();
    ring.material.dispose();
    ring = null;
  }

  /* ── selection and isolation, by rock or by depth ────── */
  let selected: Shaft | null = null;
  let isolatedRock: RockKey | null = null;
  let isolatedDepth: DepthLevel | null = null;
  /** The depth row under the pointer — it lights its stratum without filtering. */
  let hoveredDepth: DepthLevel | null = null;

  /** Both filters are exclusive; with neither set, every shaft is in focus. */
  function inFocus(m: Moat): boolean {
    if (isolatedRock) return m.rock === isolatedRock;
    if (isolatedDepth) return bucketOf(m, "depth") === String(isolatedDepth);
    return true;
  }

  function baseIntensity(mesh: THREE.Mesh): number {
    if (selected) return mesh === selected ? 0.95 : 0.07;
    if (isolatedRock || isolatedDepth) return inFocus(mesh.userData as Moat) ? 0.6 : 0.07;
    return 0.3;
  }

  function applyDimming(): void {
    for (const rec of records) {
      rec.shaft.material.emissiveIntensity = baseIntensity(rec.shaft);
      const lit = selected ? rec.shaft === selected : inFocus(rec.moat);
      rec.cap.material.opacity = lit ? 1 : 0.15;
      rec.label.material.opacity = lit ? 1 : 0.18;
    }
  }

  /**
   * The strata are the floors of the four depth levels; lighting one is what
   * ties a row of the ruler to the drawing.
   */
  function paintStrata(): void {
    const lit = hoveredDepth ?? isolatedDepth;
    for (const [i, s] of strata.entries()) {
      s.material.opacity = theme.strataOpacity * (i + 1 === lit ? 5 : 1);
    }
  }

  /* ── the specimen card ───────────────────────────────── */
  const cardEyebrow = el("card-eyebrow")!;
  const cardTitle = el("card-title")!;
  const cardStats = el("card-stats")!;
  const cardBody = el("card-body")!;
  const cardClose = el("card-close")!;
  const cardLink = el<HTMLAnchorElement>("card-link")!;
  const emptyCard = {
    eyebrow: cardEyebrow.textContent ?? "",
    title: cardTitle.textContent ?? "",
    body: cardBody.textContent ?? "",
  };

  function passport(m: Moat): string {
    const level = String(Math.round(m.d));
    return [
      `${m.n} · ${data.names[m.n].name}`,
      data.rockNames[m.rock],
      data.depthLabels[level],
      m.cap,
      AI_GLYPH[m.ai],
    ].join(" · ");
  }

  function fillCard(m: Moat): void {
    const level = String(Math.round(m.d));
    // `eyebrow` is a template: "Core no. {n}" / "Керн №{n}".
    cardEyebrow.textContent = `${data.specimen.eyebrow.replace("{n}", String(m.n))} · ${
      data.specimen.rock
    }: ${data.rockNames[m.rock].toLowerCase()}`;
    cardTitle.textContent = data.names[m.n].name;
    el("s-depth")!.textContent = `${m.d} · ${data.tools[level]}`;
    el("s-cap")!.textContent = m.cap;
    el("s-solo")!.textContent = TERNARY_GLYPH[m.solo];
    el("s-ai")!.textContent = AI_GLYPH[m.ai];
    el("s-rent")!.textContent = TERNARY_GLYPH[m.rent];
    cardStats.hidden = false;
    cardClose.hidden = false;
    cardLink.hidden = false;
    cardLink.href = `${data.sheetBase}${m.n}/`;
    // Sheets without prose say so, exactly like the sheet page does.
    cardBody.textContent = data.names[m.n].essence || data.draft;
  }

  function resetCard(): void {
    cardEyebrow.textContent = emptyCard.eyebrow;
    cardTitle.textContent = emptyCard.title;
    cardBody.textContent = emptyCard.body;
    cardStats.hidden = true;
    cardClose.hidden = true;
    cardLink.hidden = true;
  }

  /* ── camera state ────────────────────────────────────── */
  const orbit = { theta: 0.7, phi: 1.02, radius: 14, target: new THREE.Vector3(0, -1.6, 0) };
  const goal = { radius: 14, target: new THREE.Vector3(0, -1.6, 0) };
  let dragging = false;
  let lastX = 0, lastY = 0, downX = 0, downY = 0;

  function applyCamera(): void {
    const t = orbit.target;
    camera.position.set(
      t.x + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
      t.y + orbit.radius * Math.cos(orbit.phi),
      t.z + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
    );
    camera.lookAt(t);
  }

  function setHash(hash: string): void {
    history.replaceState(null, "", hash || window.location.pathname + window.location.search);
  }

  function select(mesh: Shaft, silent = false): void {
    // The first half of a double-click, or a second click on the same shaft:
    // the core is already out, so nothing to re-aim and nothing to count.
    if (mesh === selected) return;
    const m = mesh.userData as Moat;
    selected = mesh;
    isolatedRock = null;
    isolatedDepth = null;
    syncFilters();
    paintStrata();
    applyDimming();
    placeRing(mesh);
    fillCard(m);
    tooltip.textContent = passport(m);
    const rec = byN.get(m.n)!;
    goal.target.set(rec.tx, -m.d * UNIT * 0.45, rec.tz);
    goal.radius = 6.5;
    if (!silent) {
      setHash(`#moat-${m.n}`);
      trackCoreTaken(m.n, m.rock, m.d);
    }
  }

  function deselect(): void {
    if (!selected) return;
    selected = null;
    applyDimming();
    removeRing();
    resetCard();
    tooltip.textContent = data.status.atlas;
    goal.target.set(0, -1.6, 0);
    goal.radius = 14;
    setHash("");
  }

  cardClose.addEventListener("click", deselect);

  /* ── the full sheet, in a modal over the section ─────── */
  const modal = el<HTMLDialogElement>("sheet-modal");
  const modalBody = el("modal-body");
  const modalPage = el<HTMLAnchorElement>("modal-page");
  /** Fetched sheets, kept for the session — a re-open costs nothing. */
  const sheetCache = new Map<number, string>();

  async function openSheet(n: number, source = "modal"): Promise<void> {
    if (!modal || !modalBody || !modalPage) return;
    const url = `${data.sheetBase}${n}/`;
    modalPage.href = url;
    modalBody.textContent = data.loading;
    modal.showModal();
    modalBody.scrollTop = 0;
    trackSheetOpen(n, source);

    try {
      let html = sheetCache.get(n);
      if (html === undefined) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        html = await response.text();
        sheetCache.set(n, html);
      }
      const article = new DOMParser()
        .parseFromString(html, "text/html")
        .getElementById("sheet-article");
      if (!article) throw new Error("no article");
      modalBody.replaceChildren(document.importNode(article, true));
      modal.scrollTop = 0;
    } catch {
      // The page is the source of truth — if the fetch fails, just go there.
      window.location.href = url;
    }
  }

  function closeSheet(): void {
    modal?.close();
  }

  cardLink.addEventListener("click", (e) => {
    if (!selected) return;
    const n = (selected.userData as Moat).n;
    // Modified clicks keep their usual meaning: the sheet is a real page.
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      trackSheetOpen(n, "atlas");
      return;
    }
    e.preventDefault();
    void openSheet(n);
  });

  el("modal-close")?.addEventListener("click", closeSheet);

  // A click on the backdrop lands on the dialog itself, never on its content.
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeSheet();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    // An open dialog — the sheet or the guide — closes itself and keeps the
    // key; only the bare section clears its selection.
    if (document.querySelector("dialog[open]")) return;
    deselect();
  });

  /* ── grouping buttons ────────────────────────────────── */
  const groupers = el("groupers");
  const grpButtons = Array.from(groupers?.querySelectorAll<HTMLButtonElement>(".grp") ?? []);
  for (const btn of grpButtons) {
    const axis = btn.dataset.axis as GroupingAxis;
    if (!GROUPING_AXES.includes(axis)) continue;
    btn.addEventListener("click", () => {
      if (currentAxis === axis) return;
      applyGrouping(axis, false);
      for (const b of grpButtons) b.classList.toggle("on", b === btn);
      if (!selected) {
        tooltip.textContent = `${data.status.grouping} ${data.axisLabels[axis].toLowerCase()}`;
      }
      trackGrouping(axis);
    });
  }

  /* ── rock legend and depth ruler are both isolation filters ── */
  const legendItems = Array.from(
    el("legend-list")?.querySelectorAll<HTMLLIElement>("li") ?? [],
  );
  const depthItems = Array.from(el("depth-list")?.querySelectorAll<HTMLLIElement>("li") ?? []);

  function syncFilters(): void {
    for (const li of legendItems) li.classList.toggle("on", li.dataset.rock === isolatedRock);
    for (const li of depthItems) {
      li.classList.toggle("on", Number(li.dataset.depth) === isolatedDepth);
    }
  }

  for (const li of legendItems) {
    const rock = li.dataset.rock as RockKey;
    if (!ROCK_ORDER.includes(rock)) continue;
    li.addEventListener("click", () => {
      deselect();
      isolatedRock = isolatedRock === rock ? null : rock;
      isolatedDepth = null;
      syncFilters();
      applyDimming();
      paintStrata();
      tooltip.textContent = isolatedRock
        ? `${data.status.isolated} ${data.rockNames[rock].toLowerCase()}`
        : data.status.atlas;
      trackRockIsolate(isolatedRock);
    });
  }

  for (const li of depthItems) {
    const level = Number(li.dataset.depth) as DepthLevel;
    if (!DEPTH_LEVELS.includes(level)) continue;
    li.addEventListener("pointerenter", () => {
      hoveredDepth = level;
      paintStrata();
    });
    li.addEventListener("pointerleave", () => {
      hoveredDepth = null;
      paintStrata();
    });
    li.addEventListener("click", () => {
      deselect();
      isolatedDepth = isolatedDepth === level ? null : level;
      isolatedRock = null;
      syncFilters();
      applyDimming();
      paintStrata();
      tooltip.textContent = isolatedDepth
        ? `${data.status.isolatedDepth} ${data.depthLabels[isolatedDepth]}`
        : data.status.atlas;
      trackDepthIsolate(isolatedDepth);
    });
  }

  /* ── pointer: orbit, hover, click ────────────────────── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pick(e: MouseEvent): THREE.Intersection | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(shafts)[0] ?? null;
  }

  let hovered: Shaft | null = null;
  function hover(e: PointerEvent): void {
    const hit = pick(e);
    const object = (hit?.object ?? null) as typeof hovered;
    if (hovered && object !== hovered) {
      hovered.material.emissiveIntensity = baseIntensity(hovered);
      hovered = null;
      tooltip.textContent = selected ? passport(selected.userData as Moat) : data.status.atlas;
      canvas.style.cursor = "grab";
    }
    if (object && object !== hovered) {
      hovered = object;
      hovered.material.emissiveIntensity = Math.max(0.85, baseIntensity(hovered));
      tooltip.textContent = passport(hovered.userData as Moat);
      canvas.style.cursor = "pointer";
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointermove", (e) => {
    if (dragging) {
      orbit.theta += (e.clientX - lastX) * 0.005;
      orbit.phi -= (e.clientY - lastY) * 0.004;
      orbit.phi = Math.max(0.35, Math.min(1.35, orbit.phi));
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      hover(e);
    }
  });
  window.addEventListener("pointerup", (e) => {
    const wasDrag = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 6;
    dragging = false;
    canvas.classList.remove("dragging");
    if (wasDrag || e.target !== canvas) return;
    const hit = pick(e);
    if (hit) select(hit.object as Shaft);
    else deselect();
  });
  // The first click takes the core, the second opens what it is made of.
  canvas.addEventListener("dblclick", (e) => {
    const hit = pick(e);
    if (!hit) return;
    e.preventDefault();
    void openSheet(((hit.object as Shaft).userData as Moat).n, "dblclick");
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      goal.radius = Math.max(5, Math.min(24, goal.radius + e.deltaY * 0.01));
    },
    { passive: false },
  );

  /* ── theme follows the site toggle ───────────────────── */
  new MutationObserver(() => {
    theme = currentTheme();
    (scene.background as THREE.Color).set(theme.earth);
    (scene.fog as THREE.Fog).color.set(theme.earth);
    for (const s of strata) s.material.color.set(theme.stratum);
    paintStrata();
    atlas.remove(grid);
    grid.dispose();
    grid = new THREE.GridHelper(17, 34, theme.gridMajor, theme.gridMinor);
    atlas.add(grid);
    ring?.material.color.set(theme.ring);
    for (const rec of records) {
      retintSprite(rec.label, String(rec.moat.n), tint(rockHex(rec.moat.rock)), false);
    }
    for (const row of rowLabels) retintSprite(row.sprite, row.text, tint(row.color), true);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ── start: laid out by rock, then the deep link ─────── */
  applyGrouping("rock", reduceMotion);
  tooltip.textContent = data.status.atlas;

  function selectFromHash(silent: boolean): void {
    const match = window.location.hash.match(/^#moat-(\d+)$/);
    const rec = match ? byN.get(Number(match[1])) : undefined;
    if (rec) select(rec.shaft, silent);
    else deselect();
  }
  selectFromHash(true);
  // A `#moat-N` link followed while already on this page, or a back/forward
  // step, re-aims the section instead of doing nothing.
  window.addEventListener("hashchange", () => selectFromHash(true));

  /* ── loop ────────────────────────────────────────────── */
  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Let three set the CSS size too: a canvas is a replaced element, so with
    // `inset: 0` and no explicit size it would take its intrinsic (device-pixel)
    // width and overflow the viewport on retina screens.
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  function tick(): void {
    const dt = clock.getDelta();
    if (!dragging && !reduceMotion && !selected) orbit.theta += dt * 0.05;

    const camEase = Math.min(1, dt * 4);
    orbit.radius += (goal.radius - orbit.radius) * camEase;
    orbit.target.lerp(goal.target, camEase);

    const moveEase = reduceMotion ? 1 : Math.min(1, dt * 3.5);
    for (const rec of records) {
      const p = rec.shaft.position;
      p.x += (rec.tx - p.x) * moveEase;
      p.z += (rec.tz - p.z) * moveEase;
      rec.cap.position.x = p.x;
      rec.cap.position.z = p.z;
      rec.label.position.x = p.x;
      rec.label.position.z = p.z;
    }
    if (ring && selected) {
      ring.position.x = selected.position.x;
      ring.position.z = selected.position.z;
    }

    applyCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

const payload = window.__ATLAS__;
if (payload) boot(payload);
