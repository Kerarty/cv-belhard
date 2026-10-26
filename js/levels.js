/* ============================================================
   CV BELHARD — уровни
   Уровни описываются декларативно (координаты в тайлах) и
   собираются билдером в символьную сетку. Так геометрия не
   разъезжается: каждый прыжок посчитан под высоту прыжка ~4 тайла.
   ============================================================ */

const TILE = 16;
const LEVEL_H = 15; // строк в сетке

/*
  def = {
    w, theme, name, intro,
    floors: [[x1, x2, topRow]]      — земля от topRow до низа
    plats:  [[x1, x2, row]]         — односторонние платформы
    spikes: [[x1, x2]]              — шипы на земле (строка 12)
    towers: [[x1, x2, topRow]]      — то же, что floors (для башен)
    room:   { x1, x2, topRow }      — секретная комната: крыша + иллюзорные стены
    player: x,
    gems:   [[x, y]],               — гемы-навыки
    projs:  [[x, y]],               — гемы-проекты
    secret: [x, y],                 — секретный гем
    signs:  [[x, y, noteIndex]],
    checks: [x],
    enemies:[x],
    door:   x
  }
*/

const LEVEL_DEFS = [

  /* ---------------- МОДУЛЬ 01 — Основы: безопасное обучение ------- */
  {
    w: 130, theme: 'academy', player: 2,
    name: { ru: 'Модуль 01 · Основы', en: 'Module 01 · Foundations' },
    intro: {
      ru: 'Безопасная зона. Учимся прыгать — и собираем первые данные о кандидате.',
      en: 'Safe zone. Learn to jump — and collect the first candidate data.',
    },
    floors: [[0, 129, 13], [22, 24, 12], [26, 28, 11], [30, 32, 10], [82, 84, 10]],
    plats: [[38, 41, 10], [54, 57, 11]],
    spikes: [],
    player_: null,
    gems: [[12, 12], [31, 9], [83, 9]],
    projs: [],
    signs: [[7, 12, 0], [16, 12, 2], [39, 9, 1], [118, 12, 7]],
    checks: [60],
    enemies: [],
    door: 124,
  },

  /* ---------------- МОДУЛЬ 02 — Проекты: риск и враги ------------- */
  {
    w: 150, theme: 'factory', player: 2,
    name: { ru: 'Модуль 02 · Проекты', en: 'Module 02 · Projects' },
    intro: {
      ru: 'Появляются шипы и патрули. Каждый риск окупается карточкой проекта.',
      en: 'Spikes and patrols appear here. Every risk pays off with a project card.',
    },
    floors: [[0, 149, 13], [116, 118, 9]],
    plats: [[45, 47, 10], [50, 52, 10], [64, 66, 10], [72, 74, 8], [85, 87, 10], [90, 92, 9], [112, 114, 11]],
    spikes: [[14, 16], [44, 52], [76, 77], [84, 92], [100, 101], [108, 109]],
    gems: [],
    projs: [[36, 12], [65, 9], [91, 8], [117, 8]],
    signs: [[6, 12, 3], [24, 12, 5], [34, 12, 6], [56, 12, 4], [130, 12, 9]],
    checks: [58, 96],
    enemies: [26, 70, 104],
    door: 142,
  },

  /* ---------------- МОДУЛЬ 03 — Финал: неон и секретка ------------ */
  {
    w: 150, theme: 'neon', player: 2,
    name: { ru: 'Модуль 03 · Финал', en: 'Module 03 · Finale' },
    intro: {
      ru: 'Последний модуль: ещё немного баланса — и дверь, которая никого не блокирует.',
      en: 'The last module: a bit more balance — and a door that blocks no one.',
    },
    floors: [[0, 149, 13]],
    plats: [[18, 20, 10], [24, 26, 10], [30, 32, 8], [47, 49, 10], [52, 54, 9], [76, 78, 10], [104, 106, 10], [110, 112, 8]],
    spikes: [[14, 15], [46, 54], [60, 61], [68, 69], [116, 117]],
    room: { x1: 84, x2: 92, topRow: 8 },
    gems: [[19, 9], [31, 7], [53, 8]],
    projs: [],
    secret: [88, 11],
    signs: [[6, 12, 7], [86, 12, 8]],
    checks: [40, 98],
    enemies: [28, 64, 122],
    door: 140,
  },
];

/* Собирает символьную сетку уровня из декларации. */
function buildLevel(def) {
  const g = Array.from({ length: LEVEL_H }, () => Array(def.w).fill(' '));

  const fill = (x1, x2, topRow, ch) => {
    for (let x = Math.max(0, x1); x <= Math.min(def.w - 1, x2); x++)
      for (let y = Math.max(0, topRow); y < LEVEL_H; y++) g[y][x] = ch;
  };

  (def.floors || []).forEach(([a, b, top]) => fill(a, b, top, '#'));
  (def.plats || []).forEach(([a, b, y]) => { for (let x = a; x <= b; x++) g[y][x] = 'X'; });
  (def.spikes || []).forEach(([a, b]) => { for (let x = a; x <= b; x++) g[12][x] = '^'; });

  if (def.room) {
    const { x1, x2, topRow } = def.room;
    for (let x = x1; x <= x2; x++) g[topRow][x] = '#';            // крыша
    for (let y = topRow + 1; y <= 12; y++) { g[y][x1] = 'w'; g[y][x2] = 'w'; } // иллюзорные стены
  }

  return {
    def,
    grid: g,
    w: def.w,
    h: LEVEL_H,
    at(x, y) {
      if (x < 0 || x >= this.w) return '#'; // края мира — стены
      if (y < 0) return ' ';
      if (y >= LEVEL_H) return ' ';         // ниже дна — пусто (падение=шипы снизу не нужны: пол непрерывен)
      return this.grid[y][x];
    },
  };
}

const LEVELS = LEVEL_DEFS.map(buildLevel);
