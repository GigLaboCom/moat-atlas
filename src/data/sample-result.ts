/**
 * The worked example on the home page — one answer set for the calculator,
 * so a visitor sees the deliverable before answering a question.
 *
 * The answers are an archetype, not a real product's figures: a product built
 * by one person, sold to a few hundred customers who have wired it into their
 * day, with an audience but no data, no assets and no rules on its side. The
 * card is rendered from this set through the real scoring and the real hash
 * codec — nothing on it is typed by hand, and its link reproduces it in the
 * calculator exactly. The name the card wears is `sample.product` in
 * `src/i18n/translations/pages/home.ts`.
 *
 * To put a real product here, replace the twelve answers (option indices,
 * shallow to deep, in `QUESTIONS` order) and the name — nothing else knows.
 */
import { QUESTIONS, encodeAnswers, scoreSurvey, type Answers, type OptionIndex } from "./survey";

const SAMPLE_OPTIONS: Record<string, OptionIndex> = {
  "pull-1": 1,
  "pull-2": 2,
  "pull-3": 2,
  "ground-1": 1,
  "ground-2": 0,
  "ground-3": 0,
  "grip-1": 3,
  "grip-2": 3,
  "grip-3": 2,
  "leverage-1": 0,
  "leverage-2": 1,
  "leverage-3": 1,
};

/** In `QUESTIONS` order — the shape the codec and the scoring take. */
export const SAMPLE_ANSWERS: Answers = QUESTIONS.map((q) => {
  const a = SAMPLE_OPTIONS[q.id];
  if (a === undefined) throw new Error(`sample-result: no answer for question ${q.id}`);
  return a;
});

/** The twelve characters the calculator reads back from `#s=`. */
export const SAMPLE_CODE = encodeAnswers(SAMPLE_ANSWERS);

export const SAMPLE_RESULT = scoreSurvey(SAMPLE_ANSWERS);

/**
 * The shaft the bare section pulses on first contact: the deepest mechanic the
 * sample holds, so the card above and the drawing below point at one thing.
 */
export const SAMPLE_PULSE = SAMPLE_RESULT.holding[0];

if (!SAMPLE_RESULT.complete || SAMPLE_PULSE === undefined) {
  throw new Error("sample-result: the sample must answer every question and hold at least one mechanic");
}
