import { defaultLocale, locales, type Locale } from "./config";
import en from "./translations/en";
import ru from "./translations/ru";

const translations: Record<Locale, typeof en> = { en, ru };

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export function getLocaleFromUrl(url: URL): Locale {
  const segment = url.pathname.split("/")[1];
  if (locales.includes(segment as Locale)) return segment as Locale;
  return defaultLocale;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}
