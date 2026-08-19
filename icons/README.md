# Icons

`icon.svg` is the master: four cores of different depth cut by the ground line,
in the rock palette from `src/data/moats.ts`, on a 16px grid so every derived
size lands on whole pixels. `icon-maskable.svg` is the same mark inside the
Android adaptive safe zone; `icon-mono.svg` is the silhouette Safari recolours
for a pinned tab.

Edit a master, then regenerate and commit the output:

```bash
npm run icons
```

`scripts/generate-icons.mjs` renders everything with the Playwright Chromium the
repo already installs — no Inkscape or ImageMagick, including `favicon.ico`,
which the script assembles from PNG frames itself.

Generated into `public/` (do not hand-edit):

| File                                        | Used by                                  |
| ------------------------------------------- | ---------------------------------------- |
| `favicon.ico` (16/32/48/256)                 | legacy browsers, bookmark bars           |
| `favicon.svg`                                | `rel="icon"`, the sharp one              |
| `favicon-{16,32,48,64,128,256}x*.png`        | `rel="icon"` fallbacks                   |
| `android-chrome-{36…512}.png`                | the web manifests                        |
| `maskable-{192,512}x*.png`                   | Android adaptive icons (`purpose`)       |
| `apple-touch-icon.png` (180)                 | iOS home screen                          |
| `safari-pinned-tab.svg`                      | `rel="mask-icon"`                        |
| `assets/images/favicon-{128…1024}.png`       | press, stores, anything wanting big art  |
| `assets/images/mstile/mstile-{144,150,310}`  | `browserconfig.xml`                      |
| `site.webmanifest`, `site.ru.webmanifest`    | `rel="manifest"`, one per locale         |
| `browserconfig.xml`                          | `msapplication-config`                   |

Names and descriptions in the manifests come from the locale dictionaries, and
the tile/theme colour from the dark palette in `src/layouts/Layout.astro` — keep
them in sync there, not here.
