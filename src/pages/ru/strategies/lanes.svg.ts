/**
 * `/ru/strategies/lanes.svg` — the Russian rendering of the same map.
 *
 * An endpoint cannot be rewritten with an `x-locale` header the way a page is,
 * so this one calls the renderer for its own locale; the drawing itself lives
 * in `src/lib/lanes-svg.ts` and is written once.
 */
import type { APIRoute } from "astro";
import { renderLanesSvg } from "../../../lib/lanes-svg";

export const GET: APIRoute = () =>
  new Response(renderLanesSvg("ru"), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
