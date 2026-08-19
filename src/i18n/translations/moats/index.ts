import type { Locale } from "../../config";
import type { MoatStrings } from "./types";
import en from "./en";
import ru from "./ru";

const byLocale: Record<Locale, Record<number, MoatStrings>> = { en, ru };

export function getMoatStrings(locale: Locale, n: number): MoatStrings {
  return byLocale[locale][n] ?? byLocale.en[n];
}

export function getAllMoatStrings(locale: Locale): Record<number, MoatStrings> {
  return byLocale[locale];
}

/** A sheet is a draft until its prose is filled in. */
export function isDraft(s: MoatStrings): boolean {
  return !s.essence && !s.build && !s.bypass;
}

export type { MoatStrings };
