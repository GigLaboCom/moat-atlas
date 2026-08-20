/**
 * `/llms.txt` — the agent-facing map of the site (llmstxt.org).
 *
 * The document is assembled at build time from the live page index plus the
 * curated framing in `src/lib/seo/llms.config.ts`. Nothing is hand-listed.
 */
import type { APIRoute } from "astro";
import { renderLlmsTxt } from "../lib/seo/llms";

export const GET: APIRoute = () =>
  new Response(renderLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
