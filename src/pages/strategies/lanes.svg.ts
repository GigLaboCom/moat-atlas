/**
 * `/strategies/lanes.svg` — the build-time rendering of sheet III's map.
 *
 * A static endpoint, not a page: it has no twin, no sitemap row and no entry in
 * the page index, because it is an image of a page that already has all three.
 */
import type { APIRoute } from "astro";
import { renderLanesSvg } from "../../lib/lanes-svg";

export const GET: APIRoute = () =>
  new Response(renderLanesSvg("en"), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
