/**
 * `/robots.txt` — nothing is disallowed, and the file carries the pointer to
 * the agent-facing map. A crawler that reads only this file still learns that
 * `/llms.txt` and the `.md` twins exist.
 */
import type { APIRoute } from "astro";
import { siteUrl } from "../lib/url";

export const GET: APIRoute = () =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "# AI/LLM guide — what this site is, how its URLs work, every page listed:",
      `#   ${siteUrl("/llms.txt")}`,
      "# Every page also has a plain-Markdown twin: append `.md` to any URL, or",
      "# `index.md` to a directory URL — cheaper to fetch and to parse than the HTML.",
      "",
      `Sitemap: ${siteUrl("/sitemap.xml")}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
