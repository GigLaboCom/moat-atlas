/**
 * Sheet II — the survey copy.
 *
 * The shape of the survey (which questions, which segment, which mechanics they
 * probe) lives in `src/data/survey.ts`; this file only holds the words, keyed by
 * the ids declared there. Each question carries five options in ascending order
 * — they line up with `OPTION_WEIGHTS` (0, 25, 50, 75, 100).
 */

export interface QuestionStrings {
  /** Short theme, shown above the question. */
  eyebrow: string;
  question: string;
  /** Five rungs, shallow to deep. */
  options: [string, string, string, string, string];
}

export interface CalculatorStrings {
  intro: string;
  needsJs: string;
  segments: Record<"pull" | "ground" | "grip" | "leverage", { name: string; blurb: string }>;
  questions: Record<string, QuestionStrings>;
  verdicts: Record<1 | 2 | 3 | 4, string>;
  result: {
    eyebrow: string;
    heading: string;
    lead: string;
    segmentsTitle: string;
    strongest: string;
    weakest: string;
    holdingTitle: string;
    holdingLead: string;
    digTitle: string;
    digLead: string;
    depthValue: string;
    rivalNeeds: string;
    restart: string;
    share: string;
    shared: string;
    sheetLink: string;
    catalogueLink: string;
  };
  nav: { back: string; skip: string };
  section: { title: string; ground: string; hint: string };
}

export const calculatorPage: Record<"en" | "ru", CalculatorStrings> = {
  en: {
    intro:
      "Twelve questions, four segments of one ring. Each answer deepens its segment; at the end the section is measured against the same 1–4 ruler the atlas uses — the tool a rival would need to fill it in. Nothing is stored: your answers live in the address bar, so the link is the section.",
    needsJs: "The survey runs in the browser — enable JavaScript to take it.",

    segments: {
      pull: {
        name: "Pull",
        blurb: "Whether demand compounds on its own — users, liquidity, audience.",
      },
      ground: {
        name: "Ground",
        blurb: "What you own that a rival cannot buy — data, capital, exclusive rights.",
      },
      grip: {
        name: "Grip",
        blurb: "How badly the customer's day breaks without you.",
      },
      leverage: {
        name: "Leverage",
        blurb: "What works for you without you — rules, standards, cost curves.",
      },
    },

    questions: {
      "pull-1": {
        eyebrow: "Compounding use",
        question: "Does each new user make the product better for everyone else?",
        options: [
          "Not at all — every user is alone in the product",
          "Barely — a little shared content",
          "Inside a team, yes; across teams, no",
          "Yes, across the whole base",
          "Yes, and it accelerates — the more users, the harder it is to leave",
        ],
      },
      "pull-2": {
        eyebrow: "Distribution",
        question: "Where does the next customer come from?",
        options: [
          "I chase every one of them by hand",
          "Ads — the flow stops when I stop paying",
          "A mix of paid and word of mouth",
          "Mostly referrals, search and partners",
          "They arrive by default — I sit where the demand already forms",
        ],
      },
      "pull-3": {
        eyebrow: "Audience",
        question: "If you launched something new tomorrow, who would hear about it?",
        options: [
          "Nobody I have a channel to",
          "A handful of personal contacts",
          "A mailing list of strangers",
          "An audience that answers back",
          "A community that would follow me to a new product",
        ],
      },

      "ground-1": {
        eyebrow: "Data",
        question: "What data do you hold that a rival cannot buy, scrape or regenerate?",
        options: [
          "None",
          "The same data everyone in the category has",
          "Some proprietary history, nothing decisive",
          "Years of data a newcomer cannot reconstruct",
          "A closed loop — usage produces data that makes the product better",
        ],
      },
      "ground-2": {
        eyebrow: "Heavy assets",
        question: "What would a rival have to spend on physical or infrastructure assets to match you?",
        options: [
          "Nothing — a laptop and a weekend",
          "Off-the-shelf cloud, paid monthly",
          "Serious infrastructure, but purchasable",
          "Capital that has to be raised first",
          "Capital and years — plants, fleets, locations, silicon",
        ],
      },
      "ground-3": {
        eyebrow: "Exclusive rights",
        question: "What do you have exclusive access to?",
        options: [
          "Nothing exclusive",
          "Partnerships anyone else can also sign",
          "A licence others could obtain with effort",
          "Rights or supply a rival cannot get today",
          "A cornered resource — catalogue, contract or installed base that is not for sale",
        ],
      },

      "grip-1": {
        eyebrow: "Switching cost",
        question: "How long would it take a customer to replace you?",
        options: [
          "An afternoon",
          "A few days",
          "Weeks, with a migration",
          "A quarter and a project team",
          "A rewrite nobody would approve",
        ],
      },
      "grip-2": {
        eyebrow: "Habit",
        question: "How broken is the customer's day without you?",
        options: [
          "They would not notice",
          "A minor annoyance",
          "There is a workaround",
          "Real, visible pain",
          "The business stops",
        ],
      },
      "grip-3": {
        eyebrow: "Craft",
        question: "How far ahead is your execution?",
        options: [
          "Copyable over a weekend",
          "A few months of catching up",
          "About a year of tuning",
          "Years of accumulated detail",
          "Rivals copy the surface and get the result wrong",
        ],
      },

      "leverage-1": {
        eyebrow: "Rules",
        question: "What must a rival obtain before they can even sell against you?",
        options: [
          "Nothing at all",
          "Standard paperwork",
          "A certification that takes months",
          "Licences, audits and approvals",
          "A regulatory position that takes years and is rarely granted",
        ],
      },
      "leverage-2": {
        eyebrow: "Standard",
        question: "Does anyone build against your format, API or process?",
        options: [
          "No one",
          "A couple of one-off integrations",
          "A small ecosystem of partners",
          "Partners depend on my interfaces",
          "My format is the standard the category has to follow",
        ],
      },
      "leverage-3": {
        eyebrow: "Cost curve",
        question: "What happens to your unit cost as you grow?",
        options: [
          "It rises — growth costs me money",
          "It stays flat",
          "It falls slowly",
          "It falls fast enough to set a price they struggle to meet",
          "It falls so far a newcomer cannot serve the same customer profitably",
        ],
      },
    },

    verdicts: {
      1: "A ditch. Everything here can be reproduced in weeks — what you have is a head start, not a moat.",
      2: "A trench. Copying you costs a rival about a year of work, but nothing in the section deepens on its own yet.",
      3: "A moat. Three to ten years of digging stand between you and a copy; the work now is keeping the water in it.",
      4: "A canyon. What you hold takes a decade to reproduce — the risk is no longer imitation, it is erosion.",
    },

    result: {
      eyebrow: "Section taken",
      heading: "Your section",
      lead: "Twelve answers, four segments, measured against the ruler of the atlas.",
      segmentsTitle: "Segments",
      strongest: "Deepest",
      weakest: "Shallowest",
      holdingTitle: "Ground you already hold",
      holdingLead: "The mechanics behind your deepest answers — these are yours to defend.",
      digTitle: "Where to dig next",
      digLead: "Mechanics behind your shallowest answers, cheapest and quickest first.",
      depthValue: "{level} · {tool}",
      rivalNeeds: "A rival needs {years} to fill it in.",
      restart: "Take it again",
      share: "Copy the link",
      shared: "Link copied",
      sheetLink: "Open the sheet →",
      catalogueLink: "All 35 mechanics →",
    },

    nav: { back: "← Back", skip: "Skip" },

    section: {
      title: "The section so far",
      ground: "ground level",
      hint: "one bar per question · colour is the segment",
    },
  },

  ru: {
    intro:
      "Двенадцать вопросов, четыре сегмента одного кольца. Каждый ответ углубляет свой сегмент; в конце разрез меряется той же линейкой 1–4, что и атлас, — инструментом, который понадобится конкуренту, чтобы его засыпать. Ничего не сохраняется: ответы живут в адресной строке, поэтому ссылка и есть разрез.",
    needsJs: "Опрос работает в браузере — включите JavaScript, чтобы его пройти.",

    segments: {
      pull: {
        name: "Тяга",
        blurb: "Растёт ли спрос сам по себе — пользователи, ликвидность, аудитория.",
      },
      ground: {
        name: "Порода",
        blurb: "Что у тебя есть такого, чего конкурент не купит: данные, капитал, исключительные права.",
      },
      grip: {
        name: "Врастание",
        blurb: "Насколько ломается день клиента без тебя.",
      },
      leverage: {
        name: "Рычаг",
        blurb: "Что работает на тебя без тебя — правила, стандарты, кривая издержек.",
      },
    },

    questions: {
      "pull-1": {
        eyebrow: "Накопление пользы",
        question: "Каждый новый пользователь делает продукт лучше для остальных?",
        options: [
          "Нет — каждый сидит в продукте в одиночку",
          "Почти нет — немного общего контента",
          "Внутри команды да, между командами нет",
          "Да, по всей базе",
          "Да, и это ускоряется: чем больше людей, тем труднее уйти",
        ],
      },
      "pull-2": {
        eyebrow: "Дистрибуция",
        question: "Откуда приходит следующий клиент?",
        options: [
          "Каждого добываю руками",
          "Реклама — поток кончается вместе с бюджетом",
          "Пополам: платно и по сарафану",
          "В основном рекомендации, поиск и партнёры",
          "Приходят по умолчанию — я стою там, где спрос уже возникает",
        ],
      },
      "pull-3": {
        eyebrow: "Аудитория",
        question: "Если завтра запустить что-то новое — кто об этом узнает?",
        options: [
          "Никто: своего канала нет",
          "Десяток личных контактов",
          "Рассылка незнакомых людей",
          "Аудитория, которая отвечает",
          "Сообщество, которое перейдёт за мной в новый продукт",
        ],
      },

      "ground-1": {
        eyebrow: "Данные",
        question: "Какие данные у тебя есть, которые конкурент не купит, не спарсит и не соберёт заново?",
        options: [
          "Никаких",
          "Те же, что у всех в категории",
          "Кое-что своё, но не решающее",
          "Годы данных, которые новичок не восстановит",
          "Замкнутый контур: использование рождает данные, данные делают продукт лучше",
        ],
      },
      "ground-2": {
        eyebrow: "Тяжёлые активы",
        question: "Сколько конкуренту придётся вложить в физические и инфраструктурные активы, чтобы сравняться?",
        options: [
          "Нисколько — ноутбук и выходные",
          "Обычное облако с оплатой по месяцам",
          "Серьёзная инфраструктура, но её можно купить",
          "Капитал, который сначала надо привлечь",
          "Капитал и годы: заводы, парк, точки, кремний",
        ],
      },
      "ground-3": {
        eyebrow: "Исключительные права",
        question: "К чему у тебя есть исключительный доступ?",
        options: [
          "Ни к чему исключительному",
          "Партнёрства, которые подпишет любой",
          "Лицензия, которую при желании получат другие",
          "Права или поставки, которых у конкурента сегодня нет",
          "Загнанный в угол ресурс: каталог, контракт или установленная база, которые не продаются",
        ],
      },

      "grip-1": {
        eyebrow: "Стоимость перехода",
        question: "Сколько времени займёт у клиента замена тебя?",
        options: [
          "Полдня",
          "Несколько дней",
          "Недели, с миграцией",
          "Квартал и проектная команда",
          "Переписывание, которое никто не согласует",
        ],
      },
      "grip-2": {
        eyebrow: "Привычка",
        question: "Насколько сломан день клиента без тебя?",
        options: [
          "Не заметят",
          "Лёгкий сбой",
          "Есть обход",
          "Ощутимая боль",
          "Бизнес встаёт",
        ],
      },
      "grip-3": {
        eyebrow: "Ремесло",
        question: "Насколько твоё исполнение впереди?",
        options: [
          "Копируется за выходные",
          "Несколько месяцев догонять",
          "Около года доводки",
          "Годы накопленных деталей",
          "Конкуренты копируют форму и получают не тот результат",
        ],
      },

      "leverage-1": {
        eyebrow: "Правила",
        question: "Что конкурент обязан получить, прежде чем вообще выйти против тебя?",
        options: [
          "Ничего",
          "Обычные бумаги",
          "Сертификацию на несколько месяцев",
          "Лицензии, аудиты, согласования",
          "Регуляторную позицию, которую дают редко и годами",
        ],
      },
      "leverage-2": {
        eyebrow: "Стандарт",
        question: "Кто-нибудь строит под твой формат, API или процесс?",
        options: [
          "Никто",
          "Пара разовых интеграций",
          "Небольшая экосистема партнёров",
          "Партнёры зависят от моих интерфейсов",
          "Мой формат — стандарт, под который подстраивается категория",
        ],
      },
      "leverage-3": {
        eyebrow: "Кривая издержек",
        question: "Что происходит с себестоимостью по мере роста?",
        options: [
          "Растёт — рост стоит мне денег",
          "Стоит на месте",
          "Медленно снижается",
          "Падает достаточно быстро, чтобы держать цену, которую им трудно повторить",
          "Падает так, что новичок не может обслуживать того же клиента с прибылью",
        ],
      },
    },

    verdicts: {
      1: "Канава. Всё это воспроизводится за недели — у тебя фора, а не ров.",
      2: "Траншея. Скопировать тебя стоит примерно года работы, но сам по себе разрез пока не углубляется.",
      3: "Ров. Между тобой и копией — от трёх до десяти лет копки; теперь задача удержать в нём воду.",
      4: "Каньон. То, что у тебя есть, воспроизводится десятилетие — риск уже не в копировании, а в размывании.",
    },

    result: {
      eyebrow: "Керн взят",
      heading: "Твой разрез",
      lead: "Двенадцать ответов, четыре сегмента, измеренные линейкой атласа.",
      segmentsTitle: "Сегменты",
      strongest: "Глубже всего",
      weakest: "Мельче всего",
      holdingTitle: "Порода, которая уже твоя",
      holdingLead: "Механики за самыми глубокими ответами — их и защищать.",
      digTitle: "Где копать дальше",
      digLead: "Механики за самыми мелкими ответами: сначала те, что дешевле и быстрее.",
      depthValue: "{level} · {tool}",
      rivalNeeds: "Конкуренту нужно {years}, чтобы его засыпать.",
      restart: "Пройти заново",
      share: "Скопировать ссылку",
      shared: "Ссылка скопирована",
      sheetLink: "Открыть лист →",
      catalogueLink: "Все 35 механик →",
    },

    nav: { back: "← Назад", skip: "Пропустить" },

    section: {
      title: "Разрез на этот момент",
      ground: "уровень земли",
      hint: "по столбцу на вопрос · цвет — сегмент",
    },
  },
};
