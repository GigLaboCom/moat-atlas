/**
 * The home page's derived copy — the placeholders its strings carry, filled
 * from the data so no count is ever typed: `{questions}`, `{moats}`,
 * `{levels}`, `{strategies}`, `{tools}`, `{product}`. Shared by the page, the
 * page index (the description), the twin and the JSON-LD, so all four say
 * the same sentence.
 */
import { DEPTH_LEVELS, MOAT_COUNT } from "../data/moats";
import { STRATEGY_COUNT } from "../data/strategies";
import { QUESTION_COUNT } from "../data/survey";
import type { Locale } from "../i18n/config";
import { getTranslations } from "../i18n/index";
import { homePage, type HomeStrings } from "../i18n/translations/pages/home";
import { strategiesPage } from "../i18n/translations/pages/strategies";

/** The tool names of the ruler, in order, as a list a sentence can carry. */
function toolList(locale: Locale): string {
  const t = getTranslations(locale);
  return DEPTH_LEVELS.map((l) => t.atlas.ruler[l].tool.toLowerCase()).join(", ");
}

export function fillHome(locale: Locale, template: string): string {
  const s = homePage[locale];
  return template
    .replaceAll("{questions}", String(QUESTION_COUNT))
    .replaceAll("{moats}", String(MOAT_COUNT))
    .replaceAll("{levels}", String(DEPTH_LEVELS.length))
    .replaceAll("{strategies}", String(STRATEGY_COUNT))
    .replaceAll("{tools}", toolList(locale))
    .replaceAll("{product}", s.sample.product);
}

export function homeStrings(locale: Locale): HomeStrings {
  return homePage[locale];
}

/** The hero's sub-line — also the page's description and its `og:description`. */
export function homeDescription(locale: Locale): string {
  return fillHome(locale, homePage[locale].hero.sub);
}

/** The three steps with their counts filled — the page, the twin and the HowTo. */
export function homeSteps(locale: Locale): { title: string; text: string }[] {
  return homePage[locale].steps.items.map((s) => ({
    title: fillHome(locale, s.title),
    text: fillHome(locale, s.text),
  }));
}

/** The first sentence of sheet III's intro — the teaser's one line. */
export function strategiesTeaser(locale: Locale): string {
  const intro = strategiesPage[locale].intro;
  const end = intro.search(/[.!?](\s|$)/);
  return end === -1 ? intro : intro.slice(0, end + 1);
}
