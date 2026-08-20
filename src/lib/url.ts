const SITE_URL = (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? "https://moa.giglabo.com";

/** Join a base URL with path segments, normalising double slashes. */
export function urlJoin(...parts: string[]): string {
  const trailing = parts.length > 1 && parts[parts.length - 1].endsWith("/");
  const joined = parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
    .filter(Boolean)
    .join("/");
  // Directory-style URLs keep their trailing slash — canonical and hreflang
  // must match the URLs the site actually serves.
  return trailing && !joined.endsWith("/") ? `${joined}/` : joined;
}

/** Return the absolute site URL for a given path. */
export function siteUrl(path: string): string {
  return urlJoin(SITE_URL, path);
}
