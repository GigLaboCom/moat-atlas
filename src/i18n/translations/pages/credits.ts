/**
 * "Who made this" — the colophon of the atlas.
 * Facts that still need confirming (sources, contact) are left as empty strings
 * and render as a dash, the same convention the moat sheets use.
 */
export const creditsPage = {
  en: {
    title: "Who made this — Moat Atlas",
    description: "The colophon of the Moat Atlas: authorship, method, stack, sources and licence.",
    eyebrow: "Colophon",
    heading: "Who made this",
    intro:
      "The Moat Atlas is a cross-section of 35 defensibility mechanics — the ones that decide whether a product stays hard to copy. This page says who dug it, how, and out of what.",

    section_project_title: "The project",
    section_project_text:
      "One survey matrix, two sheets. Sheet I is the classification: every mechanic is a shaft, its depth is how long the moat takes to dig, its rock is the kind of defensibility, its thickness is the capital required. Sheet II is the calculator: twelve questions that measure the moat you actually have.",

    section_author_title: "Authorship",
    author_name: "Denis Esakov",
    author_role: "Survey, catalogue, design and code",
    section_author_note:
      "Published under the Heretic banner. Corrections to the matrix are welcome — a mechanic in the wrong rock or at the wrong depth is a bug like any other.",

    section_method_title: "Method",
    section_method_text:
      "Every mechanic was placed on six axes: rock (the kind of defensibility), depth (1 shovel, 2 excavator, 3 drill rig, 4 mine), capital, whether a solo builder can reach it, how it fares as AI commoditises software, and whether it can be rented rather than built. The groupings on sheet I re-lay the same 35 shafts along each of those axes in turn.",

    section_stack_title: "Made with",
    stack_astro: "Astro — static pages, en/ru routing, no framework runtime.",
    stack_three: "three.js — the geological cross-section.",
    stack_ga: "GA4 in Consent Mode v2 — cookieless until you say otherwise.",
    stack_claude: "Claude Code — prototyping and implementation.",

    section_sources_title: "Sources",
    section_sources_text: "",

    section_contact_title: "Contact",
    section_contact_text: "",

    section_license_title: "Licence",
    section_license_text: "",

    empty: "—",
  },
  ru: {
    title: "Кто сделал — Атлас рвов",
    description: "Выходные данные «Атласа рвов»: авторство, метод, стек, источники и лицензия.",
    eyebrow: "Выходные данные",
    heading: "Кто сделал",
    intro:
      "«Атлас рвов» — разрез 35 механик защищённости, тех самых, что решают, останется ли продукт трудным для копирования. Эта страница говорит, кто его копал, как и из чего.",

    section_project_title: "Проект",
    section_project_text:
      "Одна сводная матрица, два листа. Лист I — классификация: каждая механика это шахта, её глубина — сколько лет копать ров, порода — тип защищённости, толщина — нужный капитал. Лист II — калькулятор: двенадцать вопросов, которые измеряют ров, который у тебя есть на самом деле.",

    section_author_title: "Авторство",
    author_name: "Денис Есаков",
    author_role: "Съёмка, каталог, дизайн и код",
    section_author_note:
      "Издано под маркой Heretic. Правки к матрице приветствуются: механика не в той породе или не на той глубине — такой же баг, как любой другой.",

    section_method_title: "Метод",
    section_method_text:
      "Каждая механика размечена по шести осям: порода (тип защищённости), глубина (1 лопата, 2 экскаватор, 3 буровая, 4 шахта), капитал, доступность соло, поведение по мере того как AI обесценивает софт, и возможность арендовать ров вместо того чтобы копать. Группировки на листе I перекладывают те же 35 шахт по каждой из этих осей.",

    section_stack_title: "Сделано на",
    stack_astro: "Astro — статические страницы, маршрутизация en/ru, без рантайма фреймворка.",
    stack_three: "three.js — геологический разрез.",
    stack_ga: "GA4 в Consent Mode v2 — без cookie, пока не разрешишь.",
    stack_claude: "Claude Code — прототипирование и реализация.",

    section_sources_title: "Источники",
    section_sources_text: "",

    section_contact_title: "Контакт",
    section_contact_text: "",

    section_license_title: "Лицензия",
    section_license_text: "",

    empty: "—",
  },
};
