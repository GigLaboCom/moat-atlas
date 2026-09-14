/**
 * The home page — the words around the hero, the sample result, the three
 * steps, the section's heading and the sheet III teaser.
 *
 * Counts are placeholders, never digits: `{questions}`, `{moats}`, `{levels}`,
 * `{strategies}` and `{tools}` are filled from `src/data/` by the page, so the
 * copy can never disagree with the data. The reading guide itself stays in the
 * main dictionary (`atlas.guide`), because the section, `/about/` and the twin
 * all read it; `lib/guide.ts` says which of its sections the home page keeps.
 */

export interface HomeStrings {
  hero: {
    title: string;
    sub: string;
    cta: string;
    trust: string;
    explore: string;
  };
  sample: {
    /** "What you get — example: {product}" */
    above: string;
    /** The worked example's name — an archetype, not a real product's data. */
    product: string;
    below: string;
    /** The whole card is a link to the live result; this is its label. */
    open: string;
    mechanics: string;
  };
  steps: {
    title: string;
    items: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }];
  };
  section: {
    title: string;
    caption: string;
    /** The `<summary>` of the folded reading guide. */
    guide: string;
    /** Under the guide: the rest of it lives on /about/. */
    fullGuide: string;
  };
  teaser: {
    title: string;
    link: string;
  };
}

export const homePage: Record<"en" | "ru", HomeStrings> = {
  en: {
    hero: {
      title: "How hard is your product to copy?",
      sub: "Answer {questions} questions and get your moat's depth on a {levels}-level scale — and which of {moats} mechanics you actually have.",
      cta: "Measure my moat",
      trust: "2 minutes · no signup · nothing stored — the answers live in the link.",
      explore: "Or explore the {moats} mechanics first →",
    },
    sample: {
      above: "What you get — example: {product}",
      product: "a solo-built SaaS",
      below: "Your result is a link like this one. Share it or keep it; we never see it.",
      open: "Open this result in the calculator →",
      mechanics: "Mechanics it has",
    },
    steps: {
      title: "How it works",
      items: [
        {
          title: "Answer {questions} questions",
          text: "About what your customers would lose by leaving, what a rival would need to match you, and how long it would take.",
        },
        {
          title: "Get your depth",
          text: "An index and a level on a {levels}-step scale: {tools} — weeks to decades.",
        },
        {
          title: "Read the sheet for each mechanic you have",
          text: "How it is built, how it is bypassed, and the verdict. Moats are rarely stormed; they are devalued.",
        },
      ],
    },
    section: {
      title: "The {moats} mechanics, as a cross-section",
      caption: "Each shaft is one way to be hard to copy. The deeper it hangs, the longer a rival needs. Click any shaft.",
      guide: "How to read this section",
      fullGuide: "The full guide — with sheet II and the fine print →",
    },
    teaser: {
      title: "{strategies} ways to win — and which of them become a moat",
      link: "See the strategies →",
    },
  },
  ru: {
    hero: {
      title: "Насколько ваш продукт трудно скопировать?",
      sub: "Ответьте на {questions} вопросов и узнайте глубину своего рва по {levels}-уровневой шкале — и какие из {moats} механик у вас на самом деле есть.",
      cta: "Измерить мой ров",
      trust: "2 минуты · без регистрации · ничего не хранится — ответы живут в ссылке.",
      explore: "Или сначала посмотреть {moats} механик →",
    },
    sample: {
      above: "Что вы получите — пример: {product}",
      product: "SaaS, собранный в одиночку",
      below: "Ваш результат — такая же ссылка. Делитесь или храните; мы её не видим.",
      open: "Открыть этот результат в калькуляторе →",
      mechanics: "Механики, которые у него есть",
    },
    steps: {
      title: "Как это работает",
      items: [
        {
          title: "Ответьте на {questions} вопросов",
          text: "О том, что потеряют ваши клиенты, уйдя, что нужно конкуренту, чтобы вас догнать, и сколько это займёт.",
        },
        {
          title: "Получите глубину",
          text: "Индекс и уровень по {levels}-ступенчатой шкале: {tools} — от недель до десятилетий.",
        },
        {
          title: "Прочитайте лист по каждой своей механике",
          text: "Как строится, как обходится, вердикт. Рвы редко берут штурмом — их обесценивают.",
        },
      ],
    },
    section: {
      title: "{moats} механик в разрезе",
      caption: "Каждая шахта — один способ быть трудно копируемым. Чем глубже висит, тем дольше догонять. Нажмите на любую.",
      guide: "Как читать этот разрез",
      fullGuide: "Полное руководство — с листом II и оговорками →",
    },
    teaser: {
      title: "{strategies} способов побеждать — и какие из них становятся рвом",
      link: "Смотреть стратегии →",
    },
  },
};
