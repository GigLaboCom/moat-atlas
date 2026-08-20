/**
 * Sheet II — the survey behind `/calculator/`.
 *
 * Language-neutral, like `moats.ts`: this file holds the shape of the survey
 * (segments, questions, weights) and the scoring. Every string lives in
 * `src/i18n/translations/pages/calculator.ts`, keyed by the ids below.
 *
 * Twelve questions in four segments of three — the ring moat of prototype v3,
 * where each answer deepens one segment. Each question also names the mechanics
 * it probes, so a shallow answer can point at the sheets worth digging; between
 * them the twelve questions cover all 35 rows of the matrix exactly once.
 */

import { MOATS, byNumber, type DepthLevel, type Moat, type RockKey } from "./moats";

export const SEGMENT_KEYS = ["pull", "ground", "grip", "leverage"] as const;
export type SegmentKey = (typeof SEGMENT_KEYS)[number];

/** Each segment is drawn in the colour of the rock it mostly measures. */
export const SEGMENT_ROCK: Record<SegmentKey, RockKey> = {
  pull: "networks",
  ground: "assets",
  grip: "locks",
  leverage: "rules",
};

/** The five rungs of every answer ladder — the score a question contributes. */
export const OPTION_WEIGHTS = [0, 25, 50, 75, 100] as const;
export type OptionIndex = 0 | 1 | 2 | 3 | 4;
export const OPTION_COUNT = OPTION_WEIGHTS.length;

export interface Question {
  /** Stable id — also the translation key and the analytics label. */
  id: string;
  segment: SegmentKey;
  /** Mechanics this question probes; a low answer sends you to their sheets. */
  moats: number[];
}

export const QUESTIONS: Question[] = [
  { id: "pull-1", segment: "pull", moats: [1, 11, 20] },
  { id: "pull-2", segment: "pull", moats: [2, 16, 27] },
  { id: "pull-3", segment: "pull", moats: [8, 21, 32, 34] },
  { id: "ground-1", segment: "ground", moats: [3, 4] },
  { id: "ground-2", segment: "ground", moats: [9, 10, 22, 31] },
  { id: "ground-3", segment: "ground", moats: [12, 18, 26] },
  { id: "grip-1", segment: "grip", moats: [5, 6] },
  { id: "grip-2", segment: "grip", moats: [19, 25, 33] },
  { id: "grip-3", segment: "grip", moats: [13, 17, 23] },
  { id: "leverage-1", segment: "leverage", moats: [7, 14, 30] },
  { id: "leverage-2", segment: "leverage", moats: [24, 29] },
  { id: "leverage-3", segment: "leverage", moats: [15, 28, 35] },
];

export const QUESTION_COUNT = QUESTIONS.length;

export function questionsOf(segment: SegmentKey): Question[] {
  return QUESTIONS.filter((q) => q.segment === segment);
}

/** One slot per question, `null` until answered. */
export type Answers = (OptionIndex | null)[];

export function emptyAnswers(): Answers {
  return QUESTIONS.map(() => null);
}

export function answeredCount(answers: Answers): number {
  return answers.filter((a) => a !== null).length;
}

export function isComplete(answers: Answers): boolean {
  return answeredCount(answers) === QUESTION_COUNT;
}

export interface SegmentScore {
  key: SegmentKey;
  /** 0–100, the mean of the segment's answered questions. */
  score: number;
  answered: number;
  total: number;
}

export interface SurveyResult {
  /** 0–100 — the mean of every answered question. */
  index: number;
  depth: DepthLevel;
  segments: SegmentScore[];
  strongest: SegmentKey;
  weakest: SegmentKey;
  /** Per-question score, aligned with `QUESTIONS`; `null` where unanswered. */
  perQuestion: (number | null)[];
  /** Mechanics you answered high on — the moat you already hold. */
  holding: number[];
  /** Mechanics you answered low on, cheapest first — where to dig next. */
  digNext: number[];
  complete: boolean;
}

/** Index → depth level, on the same 1–4 ruler the cross-section uses. */
export function depthFromIndex(index: number): DepthLevel {
  if (index < 25) return 1;
  if (index < 50) return 2;
  if (index < 75) return 3;
  return 4;
}

/** Answers at or below this are a hole in the section. */
const SHALLOW = 25;
/** Answers at or above this count as ground you already hold. */
const DEEP = 75;
const LIST_LIMIT = 6;

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Cheapest and quickest first — what a low answer should send you to dig. */
function byEffort(a: Moat, b: Moat): number {
  return a.capN - b.capN || a.d - b.d || a.n - b.n;
}

/** Deepest first — what is worth naming as already yours. */
function byDepth(a: Moat, b: Moat): number {
  return b.d - a.d || b.capN - a.capN || a.n - b.n;
}

function collect(ids: number[], compare: (a: Moat, b: Moat) => number): number[] {
  return [...new Set(ids)]
    .map((n) => byNumber[n])
    .filter(Boolean)
    .sort(compare)
    .slice(0, LIST_LIMIT)
    .map((m) => m.n);
}

export function scoreSurvey(answers: Answers): SurveyResult {
  const perQuestion: (number | null)[] = QUESTIONS.map((_, i) => {
    const a = answers[i];
    return a === null || a === undefined ? null : OPTION_WEIGHTS[a];
  });

  const segments: SegmentScore[] = SEGMENT_KEYS.map((key) => {
    const scores = QUESTIONS.map((q, i) => (q.segment === key ? perQuestion[i] : null)).filter(
      (s): s is number => s !== null,
    );
    return {
      key,
      score: Math.round(mean(scores)),
      answered: scores.length,
      total: questionsOf(key).length,
    };
  });

  const answered = perQuestion.filter((s): s is number => s !== null);
  const index = Math.round(mean(answered));

  // Ties resolve to the declared segment order, so the verdict is stable.
  const ranked = [...segments].sort((a, b) => b.score - a.score);

  const shallow: number[] = [];
  const deep: number[] = [];
  QUESTIONS.forEach((q, i) => {
    const score = perQuestion[i];
    if (score === null) return;
    if (score <= SHALLOW) shallow.push(...q.moats);
    if (score >= DEEP) deep.push(...q.moats);
  });

  return {
    index,
    depth: depthFromIndex(index),
    segments,
    strongest: ranked[0].key,
    weakest: ranked[ranked.length - 1].key,
    perQuestion,
    holding: collect(deep, byDepth),
    digNext: collect(shallow, byEffort),
    complete: isComplete(answers),
  };
}

/**
 * Answers as a 12-character string (`0`–`4`, `-` for unanswered) — short enough
 * to live in the URL hash, so a section is shareable and survives a reload
 * without storing anything on the visitor's machine.
 */
export function encodeAnswers(answers: Answers): string {
  return answers.map((a) => (a === null || a === undefined ? "-" : String(a))).join("");
}

export function decodeAnswers(raw: string): Answers | null {
  if (raw.length !== QUESTION_COUNT) return null;
  const answers: Answers = [];
  for (const ch of raw) {
    if (ch === "-") {
      answers.push(null);
      continue;
    }
    const n = Number(ch);
    if (!Number.isInteger(n) || n < 0 || n >= OPTION_COUNT) return null;
    answers.push(n as OptionIndex);
  }
  return answers;
}

/** Guard for the fixture above: every mechanic is probed by exactly one question. */
export const PROBED_MOATS: number[] = QUESTIONS.flatMap((q) => q.moats);
export const SURVEY_COVERS_MATRIX =
  new Set(PROBED_MOATS).size === MOATS.length && PROBED_MOATS.length === MOATS.length;
