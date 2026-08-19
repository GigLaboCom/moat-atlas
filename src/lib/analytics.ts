/**
 * GA4 event tracking helpers.
 * Works in cookieless mode (consent denied) — GA4 still sends anonymized pings.
 * Every event carries the current locale, per project convention.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function getLocale(): string {
  return document.documentElement.lang || "en";
}

function getUtmParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const search = new URLSearchParams(window.location.search);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const val = search.get(key);
    if (val) params[key] = val;
  }
  return params;
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, {
    locale: getLocale(),
    ...getUtmParams(),
    ...params,
  });
}

export function trackPageView(url?: string): void {
  trackEvent("page_view", {
    page_location: url ?? window.location.href,
    page_title: document.title,
  });
}

/** A shaft was clicked in the cross-section — a core was taken. */
export function trackCoreTaken(n: number, rock: string, depth: number): void {
  trackEvent("core_taken", { moat_id: n, rock, depth });
}

/** The section was re-laid-out along another axis. */
export function trackGrouping(axis: string): void {
  trackEvent("grouping_change", { axis });
}

/** A single rock was isolated in the legend (null = cleared). */
export function trackRockIsolate(rock: string | null): void {
  trackEvent("rock_isolate", { rock: rock ?? "all" });
}

export function trackSheetOpen(n: number, source: string): void {
  trackEvent("sheet_open", { moat_id: n, source });
}

export function trackThemeChange(theme: string): void {
  trackEvent("theme_change", { theme });
}

export function trackLocaleChange(locale: string): void {
  trackEvent("locale_change", { new_locale: locale });
}
