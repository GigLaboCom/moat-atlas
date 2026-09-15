#!/usr/bin/env node
/**
 * The home page's behaviour gates — what only a browser can answer — against
 * a running build, in both locales. The static half is `check-home.mjs`.
 *
 *   G1  the fold: at 1280×800 and 390×844 the h1, the sub, the primary button
 *       and the trust line are inside the viewport, and the canvas is not
 *   G3  the sample card's link opens the calculator on the same index and
 *       depth the card shows
 *   G4  the hand-off: from a finished result, "show my mechanics" opens the
 *       section with `hl=` naming exactly the mechanics held, the status
 *       line counting them, and the list view showing them alone; `hl=99`
 *       lights nothing and throws nothing
 *   G5  first contact: a bare `/` shows the hint and points at one shaft;
 *       one press on the canvas ends both; `?view=list` shows neither
 *   G6  nothing stored: a whole calculator run, result included, sends no
 *       request that carries the answers, and leaves no storage but the
 *       consent record and the theme
 *   G8  one h1; the largest contentful paint is in the hero or the sample
 *       card, never the canvas; three.js is not fetched for the fold
 *
 * Needs the Playwright Chromium (`npx playwright install chromium`).
 * Usage: node scripts/check-home-browser.mjs [BASE_URL] [--shots DIR]
 *        (default http://localhost:4321)
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:4321").replace(/\/$/, "");
const shotDir = argv.includes("--shots") ? argv[argv.indexOf("--shots") + 1] : null;
if (shotDir) mkdirSync(shotDir, { recursive: true });

const LOCALES = [
  { code: "en", prefix: "" },
  { code: "ru", prefix: "/ru" },
];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

let failures = 0;
const bad = (msg) => {
  console.log(`  ✗ ${msg}`);
  failures++;
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

const browser = await chromium.launch();

/** A context with the consent already answered, so the banner never covers the fold. */
async function context(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  await ctx.addInitScript(() => {
    localStorage.setItem(
      "moat-atlas-consent",
      JSON.stringify({ categories: { essential: true, analytics: false, marketing: false, personalization: false }, timestamp: Date.now(), version: 1 }),
    );
  });
  return ctx;
}

const box = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: window.innerHeight, w: window.innerWidth };
  }, selector);

// ── G1 ─────────────────────────────────────────────────────────────────────
console.log("== G1: the fold holds the promise and the action, not the canvas");
for (const { code, prefix } of LOCALES) {
  for (const vp of VIEWPORTS) {
    const ctx = await context({ width: vp.width, height: vp.height });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}${prefix}/`, { waitUntil: "networkidle" });
    const inside = [];
    for (const sel of [".hero h1", ".hero .sub", ".hero .btn", ".hero .trust"]) {
      const b = await box(page, sel);
      if (!b) inside.push(`${sel} missing`);
      else if (b.top < 0 || b.bottom > b.h || b.left < 0 || b.right > b.w) inside.push(`${sel} bottom=${Math.round(b.bottom)}/${b.h}`);
    }
    const canvas = await box(page, "#scene");
    const canvasOut = canvas && canvas.top >= canvas.h;
    if (inside.length) bad(`${code} ${vp.name}: outside the fold — ${inside.join(", ")}`);
    else if (!canvasOut) bad(`${code} ${vp.name}: the canvas is inside the fold (top ${Math.round(canvas?.top)})`);
    else ok(`${code} ${vp.name}: h1, sub, button, trust inside; canvas at ${Math.round(canvas.top)}px, fold ${canvas.h}px`);
    if (errors.length) bad(`${code} ${vp.name}: page errors — ${errors.join(" | ")}`);
    if (shotDir) await page.screenshot({ path: `${shotDir}/after-${code}-${vp.name}.png` });
    await ctx.close();
  }
}

// ── G3 ─────────────────────────────────────────────────────────────────────
console.log("== G3: the sample card's link reproduces the card");
for (const { code, prefix } of LOCALES) {
  const ctx = await context({ width: 1280, height: 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${prefix}/`, { waitUntil: "networkidle" });
  const card = await page.evaluate(() => {
    const c = document.querySelector(".card.result");
    return { index: c.dataset.index, depth: c.dataset.depth, code: c.dataset.code, href: c.querySelector("a.open").getAttribute("href") };
  });
  await page.click(".card.result a.open");
  await page.waitForSelector("#panel-result:not([hidden])", { timeout: 10000 });
  const shown = await page.evaluate(() => ({
    index: document.getElementById("r-index").textContent.trim(),
    depth: document.getElementById("r-depth").textContent.trim(),
    hash: location.hash,
  }));
  if (shown.index !== card.index || !shown.depth.startsWith(card.depth) || shown.hash !== `#s=${card.code}`) {
    bad(`${code}: card ${card.index}/${card.depth} (${card.code}) → calculator ${shown.index}/${shown.depth} ${shown.hash}`);
  } else ok(`${code}: ${card.href} → index ${shown.index}, ${shown.depth}`);
  await ctx.close();
}

// ── G4 ─────────────────────────────────────────────────────────────────────
console.log("== G4: the hand-off lights exactly the mechanics held");
for (const { code, prefix } of LOCALES) {
  const ctx = await context({ width: 1280, height: 800 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const sampleCode = await (async () => {
    await page.goto(`${BASE}${prefix}/`, { waitUntil: "networkidle" });
    return page.evaluate(() => document.querySelector(".card.result").dataset.code);
  })();
  await page.goto(`${BASE}${prefix}/calculator/#s=${sampleCode}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#panel-result:not([hidden])");
  const held = await page.evaluate(() =>
    [...document.querySelectorAll("#r-holding-list .n")].map((el) => Number(el.textContent)),
  );
  const link = await page.getAttribute("#r-section", "href");
  const hidden = await page.evaluate(() => document.getElementById("r-section").hidden);
  if (hidden || !link) {
    bad(`${code}: no hand-off link on a result holding ${held.length}`);
    await ctx.close();
    continue;
  }
  const hl = new URL(link, BASE).searchParams.get("hl")?.split(",").map(Number) ?? [];
  if (hl.join() !== held.join()) bad(`${code}: link carries hl=${hl.join()}, the result holds ${held.join()}`);
  await page.click("#r-section");
  await page.waitForURL((u) => u.searchParams.has("hl"));
  await page.waitForFunction(
    () => document.querySelector("#tooltip")?.textContent?.match(/\d+/),
    null,
    { timeout: 15000 },
  );
  const status = await page.textContent("#tooltip");
  const k = Number(status.match(/\d+/)?.[0]);
  if (k !== held.length) bad(`${code}: the status line says "${status}", ${held.length} held`);
  // The same state in the text view: exactly those entries stay.
  await page.click('.view-switch a[data-view="list"]');
  await page.waitForFunction(() => document.documentElement.classList.contains("view-list"));
  const visible = await page.evaluate(() =>
    [...document.querySelectorAll(".entry:not([hidden])")].map((li) => Number(li.dataset.n)),
  );
  if ([...visible].sort((a, b) => a - b).join() !== [...held].sort((a, b) => a - b).join()) {
    bad(`${code}: the list shows ${visible.join()}, expected ${held.join()}`);
  } else ok(`${code}: hl=${hl.join()} — status "${status}", list shows the same ${visible.length}`);
  if (shotDir) {
    await page.click('.view-switch a[data-view="scene"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${shotDir}/handoff-${code}.png` });
  }

  // An address that names nothing lights nothing and breaks nothing.
  await page.goto(`${BASE}${prefix}/?hl=99#section`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!document.querySelector("#scene") && document.querySelector("#tooltip")?.textContent !== "", null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({
    hl: new URL(location.href).searchParams.get("hl"),
    hidden: document.querySelectorAll(".entry[hidden]").length,
    status: document.querySelector("#tooltip")?.textContent,
  }));
  if (after.hl !== null || after.hidden !== 0 || errors.length) {
    bad(`${code}: hl=99 left hl=${after.hl}, ${after.hidden} hidden entries, errors: ${errors.join(" | ") || "none"}`);
  } else ok(`${code}: hl=99 dropped from the address, nothing hidden, no error (status "${after.status}")`);
  await ctx.close();
}

// ── G5 ─────────────────────────────────────────────────────────────────────
console.log("== G5: first contact — one hint, one shaft, until the first press");
for (const { code, prefix } of LOCALES) {
  for (const motion of ["no-preference", "reduce"]) {
    const ctx = await context({ width: 1280, height: 800 }, { reducedMotion: motion });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}${prefix}/`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.getElementById("stage").scrollIntoView());
    await page.waitForFunction(() => document.querySelector(".status")?.hasAttribute("data-first-contact"), null, { timeout: 15000 });
    const before = await page.evaluate(() => ({
      pulsed: document.querySelector(".status").getAttribute("data-first-contact"),
      live: document.querySelector(".status").getAttribute("aria-live"),
      text: document.querySelector("#tooltip").textContent,
    }));
    const canvas = await box(page, "#scene");
    await page.mouse.click(canvas.left + 40, canvas.top + canvas.h / 2);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({
      pulsed: document.querySelector(".status").getAttribute("data-first-contact"),
      text: document.querySelector("#tooltip").textContent,
    }));
    if (!before.pulsed || before.live !== "polite") bad(`${code} ${motion}: no first-contact hint (${JSON.stringify(before)})`);
    else if (after.pulsed) bad(`${code} ${motion}: the hint survived a press`);
    else ok(`${code} ${motion}: hint "${before.text}" pointing at #${before.pulsed}; gone after one press → "${after.text}"`);
    if (errors.length) bad(`${code} ${motion}: errors — ${errors.join(" | ")}`);
    await ctx.close();
  }
  const ctx = await context({ width: 1280, height: 800 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${prefix}/?view=list`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const list = await page.evaluate(() => ({
    hint: document.querySelector(".status")?.getAttribute("data-first-contact"),
    scripts: performance.getEntriesByType("resource").filter((r) => /atlas\.[A-Za-z0-9_-]+\.js/.test(r.name)).length,
  }));
  if (list.hint || list.scripts) bad(`${code} list: hint=${list.hint}, three.js fetched=${list.scripts}`);
  else ok(`${code} list: no hint, no pulse, no three.js`);
  await ctx.close();
}

// ── G6 ─────────────────────────────────────────────────────────────────────
console.log("== G6: nothing stored — no request carries the answers, no storage but consent and theme");
for (const { code, prefix } of LOCALES) {
  const ctx = await context({ width: 1280, height: 800 });
  const page = await ctx.newPage();
  const requests = [];
  page.on("request", (r) => requests.push({ url: r.url(), body: r.postData() ?? "" }));
  await page.goto(`${BASE}${prefix}/calculator/`, { waitUntil: "networkidle" });
  await page.click("#start");
  for (let i = 0; i < 12; i++) {
    await page.waitForSelector("#q-options button");
    await page.click(`#q-options button:nth-child(${(i % 5) + 1})`);
  }
  await page.waitForSelector("#panel-result:not([hidden])");
  await page.waitForTimeout(500);
  const code12 = page.url().split("#s=")[1];
  const leaks = requests.filter((r) => (code12 && (r.url.includes(code12) || r.body.includes(code12))) || /[?&#]s=[0-4-]{12}/.test(r.url));
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((k) => !["moat-atlas-consent", "moat-atlas-theme"].includes(k)),
    session: Object.keys(sessionStorage),
    cookies: document.cookie,
  }));
  if (leaks.length) bad(`${code}: ${leaks.length} request(s) carry the answers — ${leaks.map((l) => l.url).join(", ")}`);
  else if (storage.local.length || storage.session.length) bad(`${code}: storage beyond consent/theme — ${JSON.stringify(storage)}`);
  else ok(`${code}: ${requests.length} requests, none with #s=${code12}; storage clean`);
  await ctx.close();
}

// ── G8 ─────────────────────────────────────────────────────────────────────
console.log("== G8: one h1, LCP in the hero or the card, three.js not on the fold");
for (const { code, prefix } of LOCALES) {
  const ctx = await context({ width: 1280, height: 800 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lcp = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lcp.push({ tag: e.element?.tagName, id: e.element?.id, cls: e.element?.className, size: e.size });
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(`${BASE}${prefix}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    lcp: window.__lcp.at(-1),
    inFold: (() => {
      const e = document.querySelector("#hero-title");
      return !!e;
    })(),
    three: performance.getEntriesByType("resource").filter((x) => /atlas\.[A-Za-z0-9_-]+\.js/.test(x.name)).length,
    lcpInHero: (() => {
      const last = window.__lcp.at(-1);
      if (!last) return false;
      const el = last.id ? document.getElementById(last.id) : document.querySelector(`${last.tag}.${String(last.cls).split(" ")[0]}`);
      return !!el && (!!el.closest(".hero") || !!el.closest(".sample"));
    })(),
  }));
  if (r.h1 !== 1) bad(`${code}: ${r.h1} h1 elements`);
  if (!r.lcp || !r.lcpInHero) bad(`${code}: LCP element is ${JSON.stringify(r.lcp)}`);
  if (r.three) bad(`${code}: three.js was fetched for the fold`);
  if (r.h1 === 1 && r.lcpInHero && !r.three) ok(`${code}: one h1; LCP = <${r.lcp.tag?.toLowerCase()}${r.lcp.id ? "#" + r.lcp.id : ""}> in the fold; three.js deferred`);
  await ctx.close();
}

await browser.close();
console.log(failures ? `== ${failures} failure(s)` : "== clean");
process.exit(failures ? 1 : 0);
