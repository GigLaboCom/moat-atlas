/**
 * Outbound addresses of the project — the repository, the sibling GigLabo
 * projects the colophon cross-references, and the author's accounts.
 * Language-neutral: the prose around these lives in the dictionaries.
 */
import type { Locale } from "../i18n/config";

export const REPO_URL = "https://github.com/GigLaboCom/moat-atlas";

export const GIGLABO_URL = "https://giglabo.com/";
export const LAZY_SHOT_URL = "https://giglabo.com/hls";
export const MNEMOVI_URL = "https://giglabo.com/mvi";

export interface ContactLink {
  /** Also the analytics target and the glyph in src/assets/brands/. */
  id: string;
  href: string;
  /** Network and handle are proper nouns — the same in every locale. */
  network: string;
  handle: string;
}

/**
 * The author writes in a different place depending on the language, so the
 * contact block differs per locale — the same split the Heretic site makes.
 */
export const CONTACTS: Record<Locale, readonly ContactLink[]> = {
  en: [
    { id: "x-twitter", href: "https://x.com/dyesakov", network: "X", handle: "@dyesakov" },
    {
      id: "threads",
      href: "https://www.threads.com/@d_yesakov",
      network: "Threads",
      handle: "@d_yesakov",
    },
    { id: "github", href: REPO_URL, network: "GitHub", handle: "GigLaboCom/moat-atlas" },
  ],
  ru: [
    { id: "telegram", href: "https://t.me/it_phil", network: "Telegram", handle: "@it_phil" },
    { id: "x-twitter", href: "https://x.com/bodryachog", network: "X", handle: "@bodryachog" },
    {
      id: "threads",
      href: "https://www.threads.com/@bodryachog",
      network: "Threads",
      handle: "@bodryachog",
    },
    { id: "github", href: REPO_URL, network: "GitHub", handle: "GigLaboCom/moat-atlas" },
  ],
};
