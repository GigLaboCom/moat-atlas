#!/usr/bin/env node
/**
 * Render the Open Graph cards that `src/layouts/Layout.astro` points at
 * (`/og/og-{lang}.png`) — one per locale, 1200×630, straight into `public/og/`.
 *
 * The card is an HTML document built by `scripts/og/template.mjs` from the same
 * two sources the site uses: the locale dictionaries and the survey matrix. Run
 * it after changing either, or after touching the card design:
 *
 *   npm run og            # every locale
 *   npm run og -- ru      # one locale
 *   npm run og -- --html  # also dump the rendered HTML next to the PNG
 *
 * Requires Node >= 22.18 (imports the .ts sources with native type stripping)
 * and the Playwright Chromium build (`npx playwright install chromium`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { renderOgHtml, OG_WIDTH, OG_HEIGHT } from "./og/template.mjs";
import { locales } from "../src/i18n/config.ts";
import {
  MOATS,
  ROCK_ORDER,
  ROCK_COLORS,
  DEPTH_LEVELS,
  bucketOf,
} from "../src/data/moats.ts";
import en from "../src/i18n/translations/en.ts";
import ru from "../src/i18n/translations/ru.ts";

const DICTIONARIES = { en, ru };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT = path.join(ROOT, "public", "og");

const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://moat-atlas.giglabo.com";
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");

function parseArgs(argv) {
  const opts = { locales: [], out: DEFAULT_OUT, html: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--html") opts.html = true;
    else if (arg === "--out") opts.out = path.resolve(argv[++i] ?? "");
    else if (locales.includes(arg)) opts.locales.push(arg);
    else {
      console.error(`Usage: node scripts/generate-og-images.mjs [${locales.join("|")}] [--out dir] [--html]`);
      process.exit(1);
    }
  }
  if (opts.locales.length === 0) opts.locales = [...locales];
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.out, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: OG_WIDTH, height: OG_HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });

  for (const lang of opts.locales) {
    const html = renderOgHtml({
      lang,
      t: DICTIONARIES[lang],
      moats: MOATS,
      rockOrder: ROCK_ORDER,
      rockColors: ROCK_COLORS,
      depthLevels: DEPTH_LEVELS,
      bucketOf,
      domain: DOMAIN,
    });

    const outPath = path.join(opts.out, `og-${lang}.png`);
    if (opts.html) fs.writeFileSync(outPath.replace(/\.png$/, ".html"), html);

    const page = await context.newPage();
    // No network at all — the card is self-contained, so `load` is enough.
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: outPath, type: "png" });
    await page.close();

    const { size } = fs.statSync(outPath);
    const shown = path.relative(ROOT, outPath);
    console.log(
      `  → ${shown.startsWith("..") ? outPath : shown}  ${OG_WIDTH}×${OG_HEIGHT}  ${Math.round(size / 1024)} kB`,
    );
  }

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
