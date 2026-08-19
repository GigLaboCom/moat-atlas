export const defaultLocale = "en";
export const locales = ["en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
};
