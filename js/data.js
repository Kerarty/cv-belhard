/* ============================================================
   CV BELHARD — данные и локализация (RU/EN)
   Один источник правды для игры и для «документной» версии.
   ============================================================ */

const DATA = {

  /* ---------------------------------------------------------- RU */
  ru: {
    ui: {
      title: 'ЯРОСЛАВ КУКАР',
      role: 'Game Designer',
      tagline: 'Резюме-игра для БелХард',
      newGame: '▶ Новая игра',
      continueGame: '▶ Продолжить',
      docMode: 'Просто резюме (без игры)',
      controls: 'A/D или ←/→ — идти · Space — прыжок · C — дизайн-комментарии · Esc — меню',
      level: 'Модуль',
      gems: 'Найдено',
      deaths: 'Смерти',
      time: 'Время',
      designOn: 'C-режим ВКЛ',
      designOff: 'C-режим ВЫКЛ',
      mute: 'Звук',
      menu: 'Меню',
      close: 'Закрыть',
      backToGame: 'Вернуться в игру',
      toDoc: 'Показать резюме',
      pdf: 'Скачать PDF',
      restart: 'Заново',
      collected: 'Найдено',
      skill: 'НАВЫК',
      project: 'ПРОЕКТ',
      secret: 'СЕКРЕТ',
      nextHint: 'Enter / Space — продолжить',
      tabs: { about: 'О себе', skills: 'Навыки', projects: 'Проекты', design: 'Дизайн-комментарии', contacts: 'Контакты' },
      ending: {
        title: 'МОДУЛЬ ПРОЙДЕН',
        subtitle: 'Готов к найму. Осталось решить — куда ставить штамп.',
        verdict: 'ВЕРДИКТ: ГОДЕН К НАЙМУ',
        writeMe: 'Написать мне',
        github: 'GitHub',
      },
      toastDesign: 'Дизайн-комментарии: подходи к табличкам',
      konami: 'Konami-код принят. Уважаю экспертизу игрока.',
      saveFound: 'Прогресс найден',
      loading: 'Нажми любую клавишу',
    },

    resume: {
      about: [
        'Геймдизайнер с профильным техническим образованием (БГУИР, «Информационные системы и технологии в игровой индустрии», 2023–2027).',
        'Хорошо понимаю основные игровые механики проекта и особенно интересуюсь балансом техники, боевыми характеристиками, экономикой и влиянием изменений на игровой процесс.',
        'Аналитический и системный склад мышления, техническая база в программировании и работе с данными. Понимаю взаимосвязь между дизайном механики и её реализацией, а опыт тестирования помогает системно искать проблемы и проверять изменения.',
      ],
      skills: [
        { name: 'Game Design', note: 'механики, прогрессия, документация' },
        { name: 'Level Design', note: 'Echoloop — 8 уровней; блокауты и плейтесты' },
        { name: 'Баланс и экономика', note: 'варгейм на 4 фракции, 15+ плейтест-сессий' },
        { name: 'Unity 6 / C#', note: 'дипломная симуляция «Механизм», Echoloop' },
        { name: 'GDD и документация', note: 'структурированы под передачу команде' },
        { name: 'Аналитика и данные', note: 'мат. статистика, теория вероятностей' },
        { name: 'Playable-прототипы', note: 'PixiJS, один HTML-файл, 0 запросов' },
        { name: 'Figma / Photoshop', note: 'UI-макеты, арт-стили' },
      ],
      projects: [
        {
          name: 'Варгейм «Королевства Эридора»',
          kind: 'Настольная пошаговая тактика · 4 фракции',
          text: 'Разработал тактику с нуля: боевые механики, система захвата территорий, баланс юнитов. Провёл 15+ плейтест-сессий, собирал обратную связь и итеративно балансировал характеристики — по принципу, схожему с анализом live ops после релиза события.',
        },
        {
          name: 'GDD стратегии с градостроительством',
          kind: 'Концепт-документ компьютерной игры',
          text: 'Полноценный GDD для стратегии с элементами градостроительного симулятора: игровые механики, прогрессия, баланс ресурсов, арт-стиль. Документ структурирован под передачу в команду разработки.',
        },
        {
          name: '«Механизм»',
          kind: 'Дипломная производственная симуляция · Unity',
          text: 'Симуляция завода на Unity: полный цикл от заказа до сдачи, честное качество и связанные экономики материалов, персонала и заказов.',
        },
        {
          name: 'Echoloop',
          kind: 'Головоломка о времени · Unity 6 + URP',
          text: 'Петля, эхо прошлых проходов, 8 уровней. Каждый уровень — новая интерпретация одной механики.',
        },
        {
          name: 'Splash Kitty! и Mob Rush',
          kind: 'Playable-реклама · PixiJS',
          text: 'Играбельные рекламные мини-игры: вся игра в одном HTML-файле (684 и 472 КБ), процедурный арт и звук, 0 сетевых запросов, MRAID.',
        },
        {
          name: 'Серия интерактивных CV',
          kind: 'Weappy · Playrix · Lesta · Stark Games · Mind Games · Playstrom',
          text: 'Для каждого отклика — отдельный интерактивный проект в стиле компании. Этот сайт — его продолжение: резюме как игра.',
        },
      ],
      designNotes: [
        { id: 'no-text', title: 'Обучение без текста', text: 'Первый прыжок безопасен: ошибка не стоит ничего. Игрок учится механике через естественный прогресс, а не через туториал-стену.' },
        { id: 'coyote', title: 'Coyote time и jump buffer', text: 'Инпут прощается на ~100 мс: прыжок с края срабатывает, нажатие чуть раньше земли запоминается. Игра ощущается честной, хотя по правилам «нечестна».' },
        { id: 'first-goal', title: 'Награда видна сразу', text: 'Первый предмет стоит на виду у старта: цель задана до того, как игрок начал думать о цели. Дальше мотивация тянет сама.' },
        { id: 'risk', title: 'Риск после мастерства', text: 'Враги и шипы появляются только на Модуле 02, когда прыжок уже выучен. Кривая сложности растёт вместе с навыком игрока.' },
        { id: 'checkpoint', title: 'Фейл стоит дёшево', text: 'Чекпоинты делают смерть мелкой поправкой, а не наказанием. Стоимость ошибки определяет, боится ли игрок экспериментировать.' },
        { id: 'stomp', title: 'Атака через прыжок', text: 'Один способ взаимодействия с врагом — прыжок сверху. Читаемо, безопасно при желании, рискованно при жадности: игрок сам выбирает.' },
        { id: 'data', title: 'Предметы = данные', text: 'Каждый коллектибл несёт реальную информацию о кандидате. Геймплей — это система доставки резюме: сначала интерес, потом содержание.' },
        { id: 'door', title: 'Дверь не блокирует', text: 'Финал открыт всегда: собирать всё не обязательно. Принуждение к 100% фрустрирует, а резюме — не гринд, уважение ко времени читателя.' },
        { id: 'secret', title: 'Секрет награждает любопытство', text: 'Иллюзорная стена и Konami-код вознаграждают исследование. Кандидат, который копает глубже, делает то же самое с вакансией компании.' },
        { id: 'fastpath', title: 'Одна кнопка до документа', text: 'У HR 60 секунд. Игра в любой момент сворачивается в обычное резюме — и обратно. Никто не обязан играть.' },
      ],
      contacts: {
        phone: '+375 44 783 84 89',
        email: 'kukar.yar@gmail.com',
        github: 'github.com/Kerarty',
        telegram: '@Kerarty',
      },
      docNote: 'Печатная версия · Ctrl+P → PDF',
      fastPathNote: 'Это быстрая версия для тех, у кого нет пяти минут на игру. Полная версия — кнопкой «Играть».',
    },
  },

  /* ---------------------------------------------------------- EN */
  en: {
    ui: {
      title: 'YAROSLAV KUKAR',
      role: 'Game Designer',
      tagline: 'A playable resume for BelHard',
      newGame: '▶ New game',
      continueGame: '▶ Continue',
      docMode: 'Plain resume (no game)',
      controls: 'A/D or ←/→ — move · Space — jump · C — design notes · Esc — menu',
      level: 'Module',
      gems: 'Found',
      deaths: 'Deaths',
      time: 'Time',
      designOn: 'C-notes ON',
      designOff: 'C-notes OFF',
      mute: 'Sound',
      menu: 'Menu',
      close: 'Close',
      backToGame: 'Back to game',
      toDoc: 'Show resume',
      pdf: 'Download PDF',
      restart: 'Restart',
      collected: 'Found',
      skill: 'SKILL',
      project: 'PROJECT',
      secret: 'SECRET',
      nextHint: 'Enter / Space — continue',
      tabs: { about: 'About', skills: 'Skills', projects: 'Projects', design: 'Design notes', contacts: 'Contacts' },
      ending: {
        title: 'MODULE COMPLETE',
        subtitle: 'Ready to hire. Only the stamp placement is left to decide.',
        verdict: 'VERDICT: FIT FOR HIRE',
        writeMe: 'Write to me',
        github: 'GitHub',
      },
      toastDesign: 'Design notes: walk up to the signs',
      konami: 'Konami code accepted. I respect player expertise.',
      saveFound: 'Progress found',
      loading: 'Press any key',
    },

    resume: {
      about: [
        'Game designer with a specialized technical education (BSUIR, Information Systems and Technologies in the Game Industry, 2023–2027).',
        'I understand a project’s core game mechanics well and am especially interested in unit balance, combat stats, economies and how changes affect gameplay.',
        'Analytical, systems-oriented mindset with a technical base in programming and data work. I understand the link between mechanic design and its implementation, and my testing experience helps me systematically find problems and verify changes.',
      ],
      skills: [
        { name: 'Game Design', note: 'mechanics, progression, documentation' },
        { name: 'Level Design', note: 'Echoloop — 8 levels; blockouts and playtests' },
        { name: 'Balance & economy', note: '4-faction wargame, 15+ playtest sessions' },
        { name: 'Unity 6 / C#', note: '“Mechanism” graduation sim, Echoloop' },
        { name: 'GDD & documentation', note: 'structured for handover to a dev team' },
        { name: 'Analytics & data', note: 'math statistics, probability theory' },
        { name: 'Playable prototypes', note: 'PixiJS, single HTML file, 0 requests' },
        { name: 'Figma / Photoshop', note: 'UI mockups, art styles' },
      ],
      projects: [
        {
          name: 'Wargame “Kingdoms of Eridor”',
          kind: 'Tabletop turn-based tactics · 4 factions',
          text: 'Built the tactics game from scratch: combat mechanics, territory capture system, unit balance. Ran 15+ playtest sessions, gathered feedback and iteratively tuned stats — much like post-release live ops analysis.',
        },
        {
          name: 'GDD: strategy / city-builder hybrid',
          kind: 'Concept document for a PC game',
          text: 'A full GDD for a strategy with city-building elements: mechanics, progression, resource balance and art style. Structured for handover to a development team.',
        },
        {
          name: '“Mechanism”',
          kind: 'Graduation factory simulation · Unity',
          text: 'A Unity factory simulation: the full cycle from order to delivery, honest quality and interconnected economies of materials, staff and orders.',
        },
        {
          name: 'Echoloop',
          kind: 'Time puzzle · Unity 6 + URP',
          text: 'A loop, echoes of past runs, 8 levels. Every level is a new interpretation of a single mechanic.',
        },
        {
          name: 'Splash Kitty! and Mob Rush',
          kind: 'Playable ads · PixiJS',
          text: 'Playable ad mini-games: the whole game in one HTML file (684 / 472 KB), procedural art and sound, 0 network requests, MRAID.',
        },
        {
          name: 'Interactive CV series',
          kind: 'Weappy · Playrix · Lesta · Stark Games · Mind Games · Playstrom',
          text: 'A separate interactive project in the company’s style for every application. This site continues the series: a resume as a game.',
        },
      ],
      designNotes: [
        { id: 'no-text', title: 'Teaching without text', text: 'The first jump is safe: a mistake costs nothing. The player learns through natural progression, not a tutorial wall.' },
        { id: 'coyote', title: 'Coyote time & jump buffer', text: 'Input is forgiven for ~100 ms: jumping off a ledge still works, a press slightly before landing is remembered. The game feels fair even though the rules are “unfair”.' },
        { id: 'first-goal', title: 'The reward is visible at once', text: 'The first item sits in sight of the spawn: the goal is set before the player even thinks about goals. Motivation does the rest.' },
        { id: 'risk', title: 'Risk after mastery', text: 'Enemies and spikes only appear in Module 02, once jumping is learned. The difficulty curve grows together with the player’s skill.' },
        { id: 'checkpoint', title: 'Failure is cheap', text: 'Checkpoints turn death into a minor correction, not a punishment. The cost of an error defines whether players dare to experiment.' },
        { id: 'stomp', title: 'Jump as attack', text: 'One way to interact with enemies: jump on top. Readable, safe when cautious, risky when greedy — the player chooses.' },
        { id: 'data', title: 'Items = data', text: 'Every collectible carries real information about the candidate. Gameplay is a delivery system for the resume: interest first, content after.' },
        { id: 'door', title: 'The door never blocks', text: 'The finale is always open: 100% collection is optional. Forcing completion frustrates, and a resume is not a grind — respect the reader’s time.' },
        { id: 'secret', title: 'The secret rewards curiosity', text: 'An illusory wall and the Konami code reward exploration. A candidate who digs deeper does the same with the company’s job posting.' },
        { id: 'fastpath', title: 'One button to the document', text: 'An HR person has 60 seconds. The game collapses into a plain resume at any moment — and back. Nobody is forced to play.' },
      ],
      contacts: {
        phone: '+375 44 783 84 89',
        email: 'kukar.yar@gmail.com',
        github: 'github.com/Kerarty',
        telegram: '@Kerarty',
      },
      docNote: 'Print version · Ctrl+P → PDF',
      fastPathNote: 'This is the fast version for those without five minutes to play. The full game is one “Play” button away.',
    },
  },
};

/* Общие для обеих языков вещи */
const META = {
  gemsTotal: 11,
  konami: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'],
};
