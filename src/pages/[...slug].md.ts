/**
 * Every `.md` page twin, in both URL forms and both locales.
 *
 * One route generates them all: `slug` carries the whole path, so
 * `/moats/7.md`, `/moats/7/index.md` and `/ru/moats/7/index.md` are three
 * entries of the same static build. The pages come from `pages.ts` — the same
 * walker `/llms.txt` and `/sitemap.xml` use — which is what keeps the coverage
 * contract (a twin for exactly the listed pages) true by construction.
 *
 * The home page twin is `/index.md`; nginx rewrites the spec's `/.md` onto it,
 * because Astro cannot emit a file whose whole name is an extension.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { buildTwin } from "../lib/seo/md-twin";
import { allPages } from "../lib/seo/pages";

export const getStaticPaths = (() =>
  allPages().flatMap((page) => {
    const body = buildTwin(page);
    const trimmed = page.path.replace(/^\/+|\/+$/g, "");
    // "/" has no `<path>.md` form to offer — only `index.md`.
    const forms = trimmed ? [trimmed, `${trimmed}/index`] : ["index"];
    return forms.map((slug) => ({ params: { slug }, props: { body } }));
  })) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response((props as { body: string }).body, {
    headers: {
      // Prod serves these from nginx, which sets the same pair from the file
      // extension; this is what `astro dev` and `astro preview` answer with.
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": "inline",
    },
  });
