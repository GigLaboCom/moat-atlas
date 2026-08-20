/**
 * `/sitemap.xml` — canonical HTML URLs only.
 *
 * The `.md` twins are deliberately absent and must never be added: a sitemap
 * declares canonical URLs, and every twin points its canonical back at the HTML
 * page. Listing both would have the sitemap and the `Link` header assert
 * opposite things. Twins are found through `/llms.txt` and the `<head>` link.
 */
import type { APIRoute } from "astro";
import { defaultLocale } from "../i18n/config";
import { allPages, alternatesOf } from "../lib/seo/pages";

const lastmod = new Date().toISOString().slice(0, 10);

export const GET: APIRoute = () => {
  const urls = allPages()
    .map((page) => {
      const alts = alternatesOf(page.base)
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.locale}" href="${a.url}"/>`,
        )
        .join("\n");
      const xDefault = alternatesOf(page.base).find((a) => a.locale === defaultLocale)!;
      return [
        "  <url>",
        `    <loc>${page.url}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        alts,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault.url}"/>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
