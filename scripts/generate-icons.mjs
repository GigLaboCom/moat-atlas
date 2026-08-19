#!/usr/bin/env node
/**
 * Render every icon the site can be asked for, plus the two files that point at
 * them — `site.webmanifest` and `browserconfig.xml`.
 *
 * Same coverage as the icon set in cloud-agents/heretic-vibe-coder/icons
 * (favicons, android-chrome, apple-touch, assets/images, mstile, favicon.ico),
 * but rendered through the Playwright Chromium already used for the OG cards
 * instead of Inkscape + ImageMagick — no extra tooling to install.
 *
 *   npm run icons
 *
 * Sources are the three masters in `icons/`; everything under `public/` listed
 * below is generated — edit the master, re-run, commit the output.
 * Requires Node >= 22.18 (imports the .ts dictionary with native type stripping).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { locales, defaultLocale } from "../src/i18n/config.ts";
import en from "../src/i18n/translations/en.ts";
import ru from "../src/i18n/translations/ru.ts";

const DICTIONARIES = { en, ru };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "icons");
const OUT = path.join(ROOT, "public");

/** Dark earth — the same value as `theme-color` in Layout.astro. */
const THEME_COLOR = "#14100c";

/** The manifest is per locale, like every other document the site serves. */
const manifestName = (lang) =>
  lang === defaultLocale ? "site.webmanifest" : `site.${lang}.webmanifest`;
const startUrl = (lang) =>
  `${lang === defaultLocale ? "/" : `/${lang}/`}?utm_source=web_app_manifest`;

const MASTERS = {
  main: path.join(SRC_DIR, "icon.svg"),
  maskable: path.join(SRC_DIR, "icon-maskable.svg"),
  mono: path.join(SRC_DIR, "icon-mono.svg"),
};

/** Every raster the site (or a browser looking for a convention) can ask for. */
const RASTERS = [
  // Classic favicons.
  ["main", 16, "favicon-16x16.png"],
  ["main", 32, "favicon-32x32.png"],
  ["main", 48, "favicon-48x48.png"],
  ["main", 64, "favicon-64x64.png"],
  ["main", 128, "favicon-128x128.png"],
  ["main", 256, "favicon-256x256.png"],
  // Android / Chrome.
  ["main", 36, "android-chrome-36x36.png"],
  ["main", 48, "android-chrome-48x48.png"],
  ["main", 72, "android-chrome-72x72.png"],
  ["main", 96, "android-chrome-96x96.png"],
  ["main", 144, "android-chrome-144x144.png"],
  ["main", 192, "android-chrome-192x192.png"],
  ["main", 256, "android-chrome-256x256.png"],
  ["main", 512, "android-chrome-512x512.png"],
  // Android adaptive icons — art inside the safe zone.
  ["maskable", 192, "maskable-192x192.png"],
  ["maskable", 512, "maskable-512x512.png"],
  // Apple.
  ["main", 180, "apple-touch-icon.png"],
  // Large stock for social cards, press and app stores.
  ["main", 128, "assets/images/favicon-128x128.png"],
  ["main", 256, "assets/images/favicon-256x256.png"],
  ["main", 384, "assets/images/favicon.192x192@2x.png"],
  ["main", 512, "assets/images/favicon-512x512.png"],
  ["main", 1024, "assets/images/favicon-1024x1024.png"],
  // Windows tiles, referenced by browserconfig.xml.
  ["main", 144, "assets/images/mstile/mstile-144x144.png"],
  ["main", 150, "assets/images/mstile/mstile-150x150.png"],
  ["main", 310, "assets/images/mstile/mstile-310x310.png"],
];

/** Sizes packed into favicon.ico, smallest first. */
const ICO_SIZES = [16, 32, 48, 256];

function svgPage(svg) {
  return `<!DOCTYPE html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    svg{display:block;width:100vw;height:100vh}
  </style>${svg}`;
}

async function renderPng(page, svg, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(svgPage(svg), { waitUntil: "load" });
  return page.screenshot({ type: "png", omitBackground: true });
}

/**
 * A Vista-era .ico: an ICONDIR, one 16-byte ICONDIRENTRY per size, then the PNG
 * payloads verbatim. Saves a dependency on ImageMagick just for this file.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

function manifest(lang) {
  const t = DICTIONARIES[lang];
  const icon = (src, sizes, purpose) => ({
    src,
    sizes,
    type: "image/png",
    ...(purpose ? { purpose } : {}),
  });
  return {
    name: t.meta.title,
    short_name: t.atlas.title,
    description: t.meta.description,
    lang,
    // Identity is the locale's own root; scope stays "/" so following a link
    // into the other locale keeps the user inside the installed app.
    id: lang === defaultLocale ? "/" : `/${lang}/`,
    scope: "/",
    start_url: startUrl(lang),
    display: "standalone",
    theme_color: THEME_COLOR,
    background_color: THEME_COLOR,
    icons: [
      icon("/android-chrome-36x36.png", "36x36"),
      icon("/android-chrome-48x48.png", "48x48"),
      icon("/android-chrome-72x72.png", "72x72"),
      icon("/android-chrome-96x96.png", "96x96"),
      icon("/android-chrome-144x144.png", "144x144"),
      icon("/android-chrome-192x192.png", "192x192"),
      icon("/android-chrome-256x256.png", "256x256"),
      icon("/android-chrome-512x512.png", "512x512"),
      icon("/maskable-192x192.png", "192x192", "maskable"),
      icon("/maskable-512x512.png", "512x512", "maskable"),
    ],
  };
}

function browserconfig() {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/assets/images/mstile/mstile-150x150.png"/>
      <square310x310logo src="/assets/images/mstile/mstile-310x310.png"/>
      <TileColor>${THEME_COLOR}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
}

function write(relPath, data) {
  const target = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  const { size } = fs.statSync(target);
  console.log(`  → public/${relPath}  ${size >= 1024 ? `${Math.round(size / 1024)} kB` : `${size} B`}`);
}

async function main() {
  const svg = Object.fromEntries(
    Object.entries(MASTERS).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]),
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const [master, size, out] of RASTERS) {
    write(out, await renderPng(page, svg[master], size));
  }

  const ico = [];
  for (const size of ICO_SIZES) {
    ico.push({ size, data: await renderPng(page, svg.main, size) });
  }
  write("favicon.ico", buildIco(ico));

  await context.close();
  await browser.close();

  // Vector copies: the sharp favicon everywhere it is supported, and the
  // silhouette Safari recolours for a pinned tab.
  write("favicon.svg", svg.main);
  write("safari-pinned-tab.svg", svg.mono);

  for (const lang of locales) {
    write(manifestName(lang), `${JSON.stringify(manifest(lang), null, 2)}\n`);
  }
  write("browserconfig.xml", browserconfig());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
