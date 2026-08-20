/**
 * Sheet II — the survey engine.
 *
 * Twelve questions, four segments; every answer deepens its segment and the
 * readout re-measures the section against the 1–4 ruler of the atlas. The shape
 * and the scoring come from `src/data/survey.ts`; every string arrives through
 * `window.__SURVEY__`, filled by `calculator.astro` from the locale dictionary.
 * Nothing user-visible is written in this file.
 *
 * Answers live in the URL hash (`#s=0413…`) and nowhere else — the link is the
 * section, and no storage is touched, so the survey needs no consent category.
 */
import {
  QUESTIONS,
  QUESTION_COUNT,
  SEGMENT_KEYS,
  OPTION_WEIGHTS,
  answeredCount,
  decodeAnswers,
  emptyAnswers,
  encodeAnswers,
  scoreSurvey,
  type Answers,
  type OptionIndex,
  type SegmentKey,
} from "../data/survey";
import {
  trackSurveyAnswer,
  trackSurveyComplete,
  trackSurveyShare,
  trackSurveyStart,
} from "../lib/analytics";

type DepthKey = "1" | "2" | "3" | "4";

interface QuestionPayload {
  id: string;
  segment: SegmentKey;
  rock: string;
  eyebrow: string;
  question: string;
  options: string[];
}

interface MoatPayload {
  name: string;
  rock: string;
  color: string;
  depth: string;
  href: string;
}

interface SurveyPayload {
  weights: number[];
  questions: QuestionPayload[];
  segments: Record<SegmentKey, { name: string; blurb: string; rock: string; color: string }>;
  rockNames: Record<string, string>;
  rockLabel: string;
  progress: string;
  ruler: Record<DepthKey, { tool: string; years: string }>;
  depthLabels: Record<DepthKey, string>;
  verdicts: Record<DepthKey, string>;
  result: Record<string, string>;
  nav: { back: string; skip: string };
  readout: { eyebrow: string; index: string; depth: string; verdict: string; empty: string };
  moats: Record<string, MoatPayload>;
  catalogueHref: string;
}

declare global {
  interface Window {
    __SURVEY__?: SurveyPayload;
  }
}

const HASH_PREFIX = "#s=";

function el<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function boot(p: SurveyPayload): void {
  const intro = el("panel-intro");
  const questionPanel = el("panel-question");
  const resultPanel = el("panel-result");
  const startBtn = el<HTMLButtonElement>("start");
  if (!intro || !questionPanel || !resultPanel || !startBtn) return;

  // Aliased so the narrowing survives into the function declarations below.
  const introPanel: HTMLElement = intro;
  const qPanel: HTMLElement = questionPanel;
  const rPanel: HTMLElement = resultPanel;

  const needsJs = el("needs-js");
  if (needsJs) needsJs.hidden = true;
  startBtn.disabled = false;

  const progressText = el("q-progress");
  const progressBar = el("q-bar");
  const rockChip = el("q-rock");
  const qEyebrow = el("q-eyebrow");
  const qTitle = el("q-title");
  const qOptions = el("q-options");
  const backBtn = el<HTMLButtonElement>("q-back");
  const skipBtn = el<HTMLButtonElement>("q-skip");

  let answers: Answers = emptyAnswers();
  let step = 0;
  let view: "intro" | "question" | "result" = "intro";
  /** Guards the completion event so re-renders do not re-fire it. */
  let reported = false;

  /* ── URL ↔ answers ──────────────────────────────────── */

  function readHash(): Answers | null {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return null;
    return decodeAnswers(hash.slice(HASH_PREFIX.length));
  }

  function writeHash(): void {
    const code = encodeAnswers(answers);
    const url = answeredCount(answers)
      ? `${window.location.pathname}${window.location.search}${HASH_PREFIX}${code}`
      : `${window.location.pathname}${window.location.search}`;
    history.replaceState(null, "", url);
  }

  /* ── question view ──────────────────────────────────── */

  function renderQuestion(): void {
    const q = p.questions[step];
    if (!q) return;
    const segment = p.segments[q.segment];

    if (progressText) {
      progressText.textContent = p.progress
        .replace("{current}", String(step + 1))
        .replace("{total}", String(QUESTION_COUNT));
    }
    if (progressBar) progressBar.style.width = `${((step + 1) / QUESTION_COUNT) * 100}%`;

    if (rockChip) {
      const swatch = rockChip.querySelector("i");
      const label = rockChip.querySelector("em");
      if (swatch instanceof HTMLElement) swatch.style.background = segment.color;
      if (label) label.textContent = `${p.rockLabel} ${p.rockNames[q.rock] ?? q.rock}`;
    }

    if (qEyebrow) qEyebrow.textContent = `${segment.name} · ${q.eyebrow}`;
    if (qTitle) qTitle.textContent = q.question;

    if (qOptions) {
      qOptions.textContent = "";
      q.options.forEach((label, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-pressed", String(answers[step] === i));
        const text = document.createElement("b");
        text.style.fontWeight = "400";
        text.textContent = label;
        const weight = document.createElement("span");
        weight.textContent = `+${p.weights[i]}`;
        button.append(text, weight);
        button.addEventListener("click", () => answer(i as OptionIndex));
        qOptions.append(button);
      });
    }

    if (backBtn) {
      backBtn.textContent = p.nav.back;
      backBtn.hidden = step === 0;
    }
    if (skipBtn) skipBtn.textContent = p.nav.skip;
  }

  function answer(choice: OptionIndex): void {
    answers[step] = choice;
    trackSurveyAnswer(QUESTIONS[step].id, OPTION_WEIGHTS[choice], step + 1);
    advance();
  }

  function advance(): void {
    writeHash();
    if (step + 1 < QUESTION_COUNT) {
      step += 1;
      render();
      return;
    }
    view = answeredCount(answers) ? "result" : "intro";
    render();
  }

  /* ── result view ────────────────────────────────────── */

  function fill(id: string, text: string): void {
    const node = el(id);
    if (node) node.textContent = text;
  }

  function moatList(target: HTMLElement | null, ids: number[]): void {
    if (!target) return;
    target.textContent = "";
    for (const n of ids) {
      const moat = p.moats[String(n)];
      if (!moat) continue;
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = moat.href;
      const num = document.createElement("span");
      num.className = "n";
      num.textContent = String(n);
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = moat.name;
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = `${moat.rock} · ${moat.depth}`;
      link.append(num, name, meta);
      li.append(link);
      target.append(li);
    }
  }

  function renderResult(): void {
    const r = scoreSurvey(answers);
    const level = String(r.depth) as DepthKey;

    fill("r-eyebrow", p.result.eyebrow);
    fill("r-heading", p.result.heading);
    fill("r-lead", p.result.lead);
    fill("r-index", String(r.index));
    fill(
      "r-depth",
      p.result.depthValue.replace("{level}", level).replace("{tool}", p.ruler[level].tool),
    );
    fill("r-verdict", p.verdicts[level]);
    fill("r-rival", p.result.rivalNeeds.replace("{years}", p.ruler[level].years));
    fill("r-seg-title", p.result.segmentsTitle);

    const list = el("r-segments");
    if (list) {
      list.textContent = "";
      for (const segment of r.segments) {
        const meta = p.segments[segment.key];
        const li = document.createElement("li");

        const name = document.createElement("b");
        name.textContent = meta.name;
        if (segment.key === r.strongest || segment.key === r.weakest) {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = ` ${segment.key === r.strongest ? p.result.strongest : p.result.weakest}`;
          name.append(tag);
        }

        const track = document.createElement("div");
        track.className = "track";
        const fillBar = document.createElement("i");
        fillBar.style.width = `${segment.score}%`;
        fillBar.style.background = meta.color;
        track.append(fillBar);

        const pct = document.createElement("span");
        pct.className = "pct";
        pct.textContent = segment.answered ? String(segment.score) : p.readout.empty;

        li.append(name, track, pct);
        list.append(li);
      }
    }

    const holding = el("r-holding");
    if (holding) {
      holding.hidden = r.holding.length === 0;
      fill("r-holding-title", p.result.holdingTitle);
      fill("r-holding-lead", p.result.holdingLead);
      moatList(el("r-holding-list"), r.holding);
    }

    const dig = el("r-dig");
    if (dig) {
      dig.hidden = r.digNext.length === 0;
      fill("r-dig-title", p.result.digTitle);
      fill("r-dig-lead", p.result.digLead);
      moatList(el("r-dig-list"), r.digNext);
    }

    fill("r-restart", p.result.restart);
    fill("r-catalogue", p.result.catalogueLink);

    const share = el<HTMLButtonElement>("r-share");
    if (share) {
      share.hidden = !navigator.clipboard;
      if (share.dataset.state !== "copied") share.textContent = p.result.share;
    }

    if (r.complete && !reported) {
      reported = true;
      trackSurveyComplete(r.index, r.depth, r.strongest, r.weakest);
    }
  }

  /* ── the readout, which follows every answer ────────── */

  function renderReadout(): void {
    const r = scoreSurvey(answers);
    const answered = answeredCount(answers);
    const empty = p.readout.empty;
    const level = String(r.depth) as DepthKey;

    fill("o-code", encodeAnswers(answers));
    fill("o-index", answered ? String(r.index) : empty);
    fill("o-depth", answered ? p.depthLabels[level] : empty);
    fill("o-verdict", answered ? p.ruler[level].years : empty);

    const bars = el("o-bars");
    if (bars) {
      QUESTIONS.forEach((q, i) => {
        const bar = bars.querySelector<HTMLElement>(`[data-q="${q.id}"]`);
        if (!bar) return;
        const score = r.perQuestion[i];
        bar.style.height = score === null ? "0" : `${score}%`;
        bar.style.opacity = i === step && view === "question" ? "1" : "0.7";
      });
    }

    for (const key of SEGMENT_KEYS) {
      const cell = document.querySelector<HTMLElement>(`.legend b[data-segment="${key}"]`);
      const segment = r.segments.find((s) => s.key === key);
      if (cell && segment) cell.textContent = segment.answered ? String(segment.score) : empty;
    }
  }

  /* ── view switching ─────────────────────────────────── */

  function render(): void {
    introPanel.hidden = view !== "intro";
    qPanel.hidden = view !== "question";
    rPanel.hidden = view !== "result";
    if (view === "question") renderQuestion();
    if (view === "result") renderResult();
    renderReadout();
  }

  function firstUnanswered(): number {
    const i = answers.findIndex((a) => a === null);
    return i === -1 ? QUESTION_COUNT - 1 : i;
  }

  function start(resumed: boolean): void {
    view = "question";
    trackSurveyStart(resumed);
    render();
  }

  startBtn.addEventListener("click", () => start(false));

  backBtn?.addEventListener("click", () => {
    if (step > 0) {
      step -= 1;
      render();
    }
  });

  skipBtn?.addEventListener("click", () => advance());

  el("r-restart")?.addEventListener("click", () => {
    answers = emptyAnswers();
    step = 0;
    reported = false;
    writeHash();
    start(false);
  });

  el<HTMLButtonElement>("r-share")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        button.dataset.state = "copied";
        button.textContent = p.result.shared;
        trackSurveyShare(scoreSurvey(answers).index);
        window.setTimeout(() => {
          delete button.dataset.state;
          button.textContent = p.result.share;
        }, 2000);
      })
      .catch(() => {
        /* clipboard refused — the address bar already holds the same link */
      });
  });

  // 1–5 pick an option, ← steps back: the survey is faster than it looks.
  document.addEventListener("keydown", (event) => {
    if (view !== "question" || event.metaKey || event.ctrlKey || event.altKey) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= OPTION_WEIGHTS.length) {
      event.preventDefault();
      answer((digit - 1) as OptionIndex);
      return;
    }
    if (event.key === "ArrowLeft" && step > 0) {
      step -= 1;
      render();
    }
  });

  window.addEventListener("hashchange", () => {
    const fromUrl = readHash();
    if (!fromUrl || encodeAnswers(fromUrl) === encodeAnswers(answers)) return;
    answers = fromUrl;
    reported = false;
    step = firstUnanswered();
    view = answeredCount(answers) === QUESTION_COUNT ? "result" : "question";
    render();
  });

  // A shared link opens straight on its section.
  const resumedAnswers = readHash();
  if (resumedAnswers && answeredCount(resumedAnswers)) {
    answers = resumedAnswers;
    step = firstUnanswered();
    if (answeredCount(answers) === QUESTION_COUNT) {
      view = "result";
      render();
    } else {
      start(true);
    }
  } else {
    render();
  }
}

const payload = window.__SURVEY__;
if (payload) boot(payload);
