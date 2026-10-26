/* ============================================================
   CV BELHARD — движок резюме-платформера
   Vanilla JS + Canvas 2D, без зависимостей. Классические скрипты,
   чтобы всё работало с file:// без сервера.
   ============================================================ */

(() => {
'use strict';

/* ------------------------------------------------ утилиты */
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ------------------------------------------------ константы */
const VIEW_W = 640, VIEW_H = 360;
const GRAV = 1850, MAX_FALL = 900;
const MOVE = 210, ACCEL = 2600, AIR_ACCEL = 1800, FRICTION = 2800;
const JUMP_V = 500, COYOTE = 0.09, BUFFER = 0.12, JUMP_CUT = 0.45;
const STOMP_BOUNCE = 330;

/* ------------------------------------------------ состояние игры */
const S = {
  mode: 'splash',            // splash | play | card | pause | ending | doc
  lang: 'ru',
  levelIdx: 0,
  lvl: null,                 // runtime-уровень
  player: null,
  enemies: [],
  gems: [], checks: [], signs: [],
  door: null,
  collected: new Set(),      // ключи 'lvl:x,y'
  deaths: 0,
  time: 0,
  secret: false,
  designMode: false,
  muted: false,
  cam: { x: 0, y: 0, shake: 0 },
  particles: [],
  cardQueue: [],
  respawnT: 0,
  konami: [],
  touch: { left: false, right: false, jump: false },
  splashPan: 0,
};

/* ------------------------------------------------ сохранение */
const SAVE_KEY = 'cv-belhard-save-v1';
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      level: S.levelIdx, gems: [...S.collected], deaths: S.deaths,
      time: S.time, secret: S.secret, lang: S.lang, muted: S.muted,
    }));
  } catch (e) { /* file:// без localStorage — просто играем без сохранений */ }
}
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
}

/* ------------------------------------------------ i18n */
let T = DATA.ru;
function tr(path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), T) ?? path;
}
function applyLang() {
  T = DATA[S.lang];
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('.btn-lang').forEach(b => b.textContent = S.lang.toUpperCase());
  renderDoc();
  if (S.mode === 'pause') renderPauseTabs($('#pause .tabs .active')?.dataset.tab || 'about');
  updateHud();
}

/* ------------------------------------------------ аудио (синтез) */
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
function beep(freq, dur = 0.08, type = 'square', vol = 0.05, slide = 0) {
  if (S.muted) return;
  const ac = audio(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur + 0.02);
}
const sfx = {
  jump: () => beep(240, 0.12, 'square', 0.04, 260),
  collect: () => { beep(660, 0.07, 'square', 0.05); setTimeout(() => beep(880, 0.09, 'square', 0.05), 70); setTimeout(() => beep(1320, 0.12, 'square', 0.04), 150); },
  death: () => { beep(300, 0.2, 'sawtooth', 0.05, -220); },
  stomp: () => beep(160, 0.1, 'square', 0.06, -80),
  check: () => { beep(520, 0.08, 'triangle', 0.06); setTimeout(() => beep(780, 0.12, 'triangle', 0.06), 90); },
  door: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.06), i * 110)); },
  click: () => beep(440, 0.04, 'square', 0.03),
};

/* ------------------------------------------------ пиксель-арт спрайты */
const PAL = {
  h: '#6b4a2f', f: '#f0c8a0', e: '#262626', d: '#22305c', w: '#e8e8e8',
  k: '#182242', s: '#20242c', g: '#7ac74f', G: '#4e9b32', o: '#ffffff', t: '#8a5c3b',
};
function makeSprite(rows, pal = PAL, scale = 1) {
  const w = rows[0].length, h = rows.length;
  const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
  const x = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i * scale, y * scale, scale, scale); }
    }
  });
  return c;
}
/* Кандидат в тёмном костюме — как на фото в PDF. 12x16 */
const SPR = {
  idle: makeSprite([
    '....hhhh....',
    '...hhhhhh...',
    '...hffffh...',
    '...feffef...',
    '...ffffff...',
    '....ffff....',
    '...dddddd...',
    '..ddwwwwdd..',
    '..ddwwwwdd..',
    '..dddddddd..',
    '..fddddddf..',
    '...dddddd...',
    '...dd..dd...',
    '...kk..kk...',
    '...kk..kk...',
    '..ss....ss..',
  ]),
  run1: makeSprite([
    '....hhhh....',
    '...hhhhhh...',
    '...hffffh...',
    '...feffef...',
    '...ffffff...',
    '....ffff....',
    '...dddddd...',
    '..ddwwwwdd..',
    '..ddwwwwdf..',
    '..dddddddd..',
    '..fdddddd...',
    '...dddddd...',
    '..dd...dd...',
    '..kk....kk..',
    '..kk.....kk.',
    '.ss......ss.',
  ]),
  run2: makeSprite([
    '....hhhh....',
    '...hhhhhh...',
    '...hffffh...',
    '...feffef...',
    '...ffffff...',
    '....ffff....',
    '...dddddd...',
    '..ddwwwwdd..',
    '.fdwwwwdd...',
    '..dddddddd..',
    '...ddddddf..',
    '...dddddd...',
    '...dd..dd...',
    '..kk..kk....',
    '.kk...kk....',
    'ss...ss.....',
  ]),
  jump: makeSprite([
    '....hhhh....',
    '...hhhhhh...',
    '...hffffh...',
    '...feffef...',
    '...ffffff...',
    '....ffff....',
    '...dddddd...',
    '..ddwwwwdd.f',
    '..ddwwwwddff',
    '..dddddddd..',
    '..fddddddf..',
    '...dddddd...',
    '...dd..dd...',
    '...kk..kk...',
    '..kk....kk..',
    '.ss......ss.',
  ]),
  slime1: makeSprite([
    '....gggg....',
    '..gggggggg..',
    '.gGGggggGGg.',
    '.ggeggggegg.',
    'gggggggggggg',
    'gggggggggggg',
    'gGggggggggGg',
    '.ggGGggGGgg.',
  ]),
  slime2: makeSprite([
    '............',
    '....gggg....',
    '..gggggggg..',
    '.ggeggggegg.',
    'gGGggggggGGg',
    'gggggggggggg',
    'ggGGggggGGgg',
    '.gGGggggGGg.',
  ]),
};

/* ------------------------------------------------ темы оформления */
const THEMES = {
  academy: {
    sky: ['#1d2440', '#2a3358'], ground: '#3a466e', groundTop: '#5a6ca8',
    groundEdge: '#8fa0d8', plat: '#5a6ca8', platEdge: '#8fa0d8',
    far: '#252e52', deco: 'stars', accent: '#8fa0d8',
  },
  factory: {
    sky: ['#1a1d29', '#2c2430'], ground: '#4a3b45', groundTop: '#6e5560',
    groundEdge: '#a08290', plat: '#6e5560', platEdge: '#a08290',
    far: '#241f2e', deco: 'pipes', accent: '#c98a5e',
  },
  neon: {
    sky: ['#141026', '#251a4a'], ground: '#2a2150', groundTop: '#3d2f78',
    groundEdge: '#7b5cff', plat: '#3d2f78', platEdge: '#7b5cff',
    far: '#1c1440', deco: 'grid', accent: '#4cc9f0',
  },
};
const GEM_COLORS = { g: '#4cc9f0', G: '#ffb703', S: '#f72585' };

/* ------------------------------------------------ частицы */
function puff(x, y, n, color, spread = 60, up = 80) {
  for (let i = 0; i < n; i++) S.particles.push({
    x, y, vx: (Math.random() - 0.5) * spread, vy: -Math.random() * up,
    life: 0.4 + Math.random() * 0.4, t: 0, size: 1 + Math.random() * 2,
    color, grav: 300,
  });
}
function confetti(n = 120) {
  const colors = ['#4cc9f0', '#ffb703', '#f72585', '#7ac74f', '#e8e8e8'];
  const cam = S.cam;
  for (let i = 0; i < n; i++) S.particles.push({
    x: cam.x + Math.random() * VIEW_W, y: cam.y - 10, vx: (Math.random() - 0.5) * 90,
    vy: 40 + Math.random() * 120, life: 2 + Math.random() * 1.5, t: 0,
    size: 2 + Math.random() * 2, color: colors[i % colors.length], grav: 60,
  });
}

/* ------------------------------------------------ уровень: runtime */
function startLevel(idx, keepCollected = true) {
  S.levelIdx = idx;
  const def = LEVELS[idx].def, grid = LEVELS[idx];
  S.lvl = LEVELS[idx];

  S.gems = []; S.checks = []; S.signs = []; S.enemies = []; S.particles = [];
  const addGem = (x, y, kind) => {
    const key = `${idx}:${kind}:${x},${y}`;
    if (S.collected.has(key)) return;
    S.gems.push({ x: x * TILE + 4, y: y * TILE + 4, w: 8, h: 8, kind, key, t: Math.random() * 6 });
  };
  (def.gems || []).forEach(([x, y]) => addGem(x, y, 'g'));
  (def.projs || []).forEach(([x, y]) => addGem(x, y, 'G'));
  if (def.secret) addGem(def.secret[0], def.secret[1], 'S');

  (def.signs || []).forEach(([x, y, note]) => S.signs.push({ x: x * TILE, y: y * TILE, note, t: Math.random() * 6 }));
  (def.checks || []).forEach((x, i) => S.checks.push({ x: x * TILE, y: 12 * TILE, on: false, idx: i }));

  (def.enemies || []).forEach((x) => S.enemies.push({
    x: x * TILE, y: 13 * TILE - 8, w: 12, h: 8, vx: -38, range: 5 * TILE,
    x0: x * TILE, t: 0, dead: false,
  }));

  S.door = { x: def.door * TILE, y: 11 * TILE, w: 16, h: 32 };

  S.checkpoint = { x: def.player * TILE, y: 13 * TILE - 16 };
  S.player = {
    x: S.checkpoint.x, y: S.checkpoint.y, w: 10, h: 14,
    vx: 0, vy: 0, onGround: false, face: 1, coyote: 0, buffer: 0,
    anim: 0, squash: 0,
  };
  S.cam.x = clamp(S.player.x - VIEW_W / 2, 0, S.lvl.w * TILE - VIEW_W);
  S.cam.y = clamp(S.player.y - VIEW_H / 2, 0, LEVEL_H * TILE - VIEW_H);
  if (!keepCollected) { /* collected сохраняются глобально */ }
  showIntro(def);
  updateHud();
}

function showIntro(def) {
  const el = $('#intro');
  $('#intro-name').textContent = def.name[S.lang];
  $('#intro-text').textContent = def.intro[S.lang];
  el.classList.add('show');
  clearTimeout(showIntro._t);
  showIntro._t = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ------------------------------------------------ ввод */
const keys = {};
const KONAMI = META.konami;
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();

  /* Konami-код */
  S.konami.push(e.code); S.konami = S.konami.slice(-KONAMI.length);
  if (S.konami.join(',') === KONAMI.join(',')) {
    S.konami = [];
    if (!S.secret) {
      S.secret = true; save();
      toast(tr('ui.konami'));
      sfx.collect(); confetti(90);
    }
  }

  if (e.code === 'KeyC' && (S.mode === 'play')) { CV.design(); }
  if (e.code === 'KeyM') { S.muted = !S.muted; updateHud(); }
  if (e.code === 'Escape') {
    if (S.mode === 'play') openPause();
    else if (S.mode === 'pause') closePause();
  }
  if (e.code === 'Tab' && S.mode === 'play') { openPause(); }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (S.mode === 'card') { nextCard(); return; }
    if (S.mode === 'ending') { return; }
  }
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

/* Тач-кнопки */
function bindTouch(id, prop) {
  const el = $(id);
  const on = (ev) => { ev.preventDefault(); S.touch[prop] = true; if (prop === 'jump') keys.Space = true; };
  const off = (ev) => { ev.preventDefault(); S.touch[prop] = false; if (prop === 'jump') keys.Space = false; };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
}
bindTouch('#t-left', 'left'); bindTouch('#t-right', 'right'); bindTouch('#t-jump', 'jump');
window.addEventListener('touchstart', () => $('#touch').classList.add('visible'), { once: true, passive: true });

function inputDir() {
  let d = 0;
  if (keys.KeyA || keys.ArrowLeft || S.touch.left) d -= 1;
  if (keys.KeyD || keys.ArrowRight || S.touch.right) d += 1;
  return clamp(d, -1, 1);
}

/* ------------------------------------------------ физика игрока */
function solidAt(px, py, prevBottom, vy) {
  const ch = S.lvl.at(Math.floor(px / TILE), Math.floor(py / TILE));
  if (ch === '#') return 'solid';
  if (ch === 'X') {
    const top = Math.floor(py / TILE) * TILE;
    return (vy >= 0 && prevBottom <= top + 4) ? 'oneway' : null;
  }
  return null;
}

function movePlayer(dt) {
  const p = S.player;
  const dir = inputDir();
  const accel = p.onGround ? ACCEL : AIR_ACCEL;

  if (dir !== 0) {
    p.vx += dir * accel * dt;
    p.vx = clamp(p.vx, -MOVE, MOVE);
    p.face = dir;
  } else if (p.onGround) {
    const s = Math.sign(p.vx);
    p.vx -= s * FRICTION * dt;
    if (Math.sign(p.vx) !== s) p.vx = 0;
  } else {
    p.vx *= (1 - 0.6 * dt);
  }

  /* прыжок: coyote time + input buffer */
  p.coyote = p.onGround ? COYOTE : Math.max(0, p.coyote - dt);
  const jumpHeld = keys.Space || keys.KeyW || keys.ArrowUp || S.touch.jump;
  p.buffer = jumpHeld ? BUFFER : Math.max(0, p.buffer - dt);
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -JUMP_V; p.coyote = 0; p.buffer = 0; p.onGround = false;
    p.squash = -0.25; sfx.jump();
    puff(p.x + 5, p.y + 14, 4, '#ffffff88', 40, 40);
  }
  if (!jumpHeld && p.vy < 0) p.vy *= (1 - (1 - JUMP_CUT) * dt * 18); // короткий тап = низкий прыжок

  p.vy = Math.min(p.vy + GRAV * dt, MAX_FALL);

  /* X-проходка */
  const prevBottom = p.y + p.h;
  let nx = p.x + p.vx * dt;
  if (p.vx !== 0) {
    const edge = p.vx > 0 ? nx + p.w : nx;
    const hit = solidAt(edge, p.y + p.h / 2, prevBottom, 0) || solidAt(edge, p.y + 2, prevBottom, 0);
    if (hit === 'solid') { nx = p.vx > 0 ? Math.floor((p.x + p.w) / TILE) * TILE + TILE - p.w - 0.01 : Math.floor(p.x / TILE) * TILE + TILE + 0.01; p.vx = 0; }
  }
  p.x = clamp(nx, 0, S.lvl.w * TILE - p.w);

  /* Y-проходка */
  let ny = p.y + p.vy * dt;
  p.onGround = false;
  if (p.vy > 0) {
    const foot = ny + p.h;
    const hit = solidAt(p.x + p.w / 2, foot, prevBottom, p.vy) || solidAt(p.x + 2, foot, prevBottom, p.vy) || solidAt(p.x + p.w - 2, foot, prevBottom, p.vy);
    if (hit) {
      ny = Math.floor(foot / TILE) * TILE - p.h - 0.01;
      if (p.vy > 340) { puff(p.x + 5, ny + p.h, 5, '#ffffff66', 70, 30); p.squash = 0.25; S.cam.shake = Math.min(4, p.vy / 260); }
      p.vy = 0; p.onGround = true;
    }
  } else if (p.vy < 0) {
    const head = ny;
    const hit = solidAt(p.x + p.w / 2, head, prevBottom, 0) || solidAt(p.x + 2, head, prevBottom, 0) || solidAt(p.x + p.w - 2, head, prevBottom, 0);
    if (hit === 'solid') { ny = Math.floor(head / TILE) * TILE + TILE + 0.01; p.vy = 0; }
  }
  p.y = ny;

  p.anim += (Math.abs(p.vx) > 10 && p.onGround ? Math.abs(p.vx) * dt * 0.06 : 0);
  p.squash *= (1 - 10 * dt);

  /* шипы */
  const feet = S.lvl.at(Math.floor((p.x + p.w / 2) / TILE), Math.floor((p.y + p.h + 2) / TILE));
  const body = S.lvl.at(Math.floor((p.x + p.w / 2) / TILE), Math.floor((p.y + p.h / 2) / TILE));
  if (feet === '^' || body === '^') die();
  /* падение в пропасть (теоретически) */
  if (p.y > LEVEL_H * TILE + 40) die();

  /* сбор гемов */
  for (const gem of S.gems) {
    if (!gem.taken && aabb(p, gem)) {
      gem.taken = true;
      S.collected.add(gem.key);
      sfx.collect();
      puff(gem.x + 4, gem.y + 4, 12, GEM_COLORS[gem.kind], 90, 110);
      queueCard(gem);
      updateHud();
    }
  }

  /* чекпоинты */
  for (const c of S.checks) {
    if (!c.on && Math.abs(p.x - c.x) < 14) {
      c.on = true;
      S.checkpoint = { x: c.x, y: 13 * TILE - 16 };
      sfx.check(); save();
      puff(c.x + 8, c.y + 4, 8, '#7ac74f', 60, 90);
    }
  }

  /* дверь */
  if (S.door && aabb(p, S.door)) finishLevel();

  /* таблички дизайн-комментариев */
  let nearSign = null;
  if (S.designMode) {
    for (const sg of S.signs) {
      if (Math.abs(p.x - sg.x) < 26 && Math.abs(p.y - sg.y) < 40) { nearSign = sg; break; }
    }
  }
  if (nearSign !== S.nearSign) {
    S.nearSign = nearSign;
    if (nearSign) {
      const note = T.resume.designNotes[nearSign.note];
      toast('◆ ' + note.title + ' — ' + note.text, 4200);
      beep(700, 0.05, 'triangle', 0.03);
    }
  }
}

function die() {
  if (S.respawnT > 0) return;
  S.respawnT = 0.55;
  S.deaths++;
  sfx.death();
  puff(S.player.x + 5, S.player.y + 7, 16, '#f72585', 140, 160);
  S.cam.shake = 6;
  updateHud();
}

function respawn() {
  const p = S.player;
  p.x = S.checkpoint.x; p.y = S.checkpoint.y;
  p.vx = 0; p.vy = 0; p.face = 1;
}

/* ------------------------------------------------ враги */
function moveEnemies(dt) {
  for (const e of S.enemies) {
    if (e.dead) continue;
    e.t += dt;
    const nx = e.x + e.vx * dt;

    /* разворот: стена, шипы, край платформы или границы патруля */
    const aheadX = Math.floor((e.vx > 0 ? nx + e.w + 1 : nx - 1) / TILE);
    const bodyAhead = S.lvl.at(aheadX, 12);   // стена или шипы на уровне тела
    const floorAhead = S.lvl.at(aheadX, 13);  // пропасть под ногами
    const atRange = Math.abs(nx - e.x0) > e.range;
    if (bodyAhead === '#' || bodyAhead === '^' || floorAhead !== '#' || atRange) {
      e.vx *= -1;
    } else {
      e.x = nx;
    }
    e.y = 13 * TILE - e.h; // патрулируют по земле

    /* столкновение с игроком */
    const p = S.player;
    if (S.mode === 'play' && S.respawnT <= 0 && aabb(p, e)) {
      if (p.vy > 120 && (p.y + p.h) - e.y < 9) {
        e.dead = true;
        p.vy = -STOMP_BOUNCE;
        sfx.stomp();
        puff(e.x + 6, e.y + 4, 14, '#7ac74f', 120, 140);
        S.cam.shake = 3;
      } else {
        die();
      }
    }
  }
}

/* ------------------------------------------------ карточки (резюме) */
function queueCard(gem) {
  const kind = gem.kind === 'g' ? 'skill' : gem.kind === 'G' ? 'project' : 'secret';
  let title, text;
  if (kind === 'skill') {
    // привязка: гемы Модуля 01 → skills[0..2], Модуля 03 → skills[3..5] (порядок в DATA)
    let skillIdx;
    if (S.levelIdx === 0) { skillIdx = S.skillCounter1 ?? 0; S.skillCounter1 = skillIdx + 1; }
    else { skillIdx = 3 + (S.skillCounter3 ?? 0); S.skillCounter3 = (S.skillCounter3 ?? 0) + 1; }
    const sk = T.resume.skills[clamp(skillIdx, 0, T.resume.skills.length - 1)];
    title = sk.name; text = sk.note;
  } else if (kind === 'project') {
    const projIdx = S.projCounter = (S.projCounter ?? 0);
    S.projCounter++;
    const pr = T.resume.projects[clamp(projIdx, 0, T.resume.projects.length - 1)];
    title = pr.name; text = pr.kind + '. ' + pr.text;
  } else {
    title = S.lang === 'ru' ? 'Пасхалка найдена' : 'Easter egg found';
    text = S.lang === 'ru'
      ? 'Секретные комнаты вознаграждают любопытство. Так же я исследую продукт компании перед собеседованием: докопаться до сути — часть работы геймдизайнера.'
      : 'Secret rooms reward curiosity. That is how I research a company’s product before an interview: digging to the essence is part of a game designer’s job.';
  }
  S.cardQueue.push({ kind, title, text });
  if (S.mode === 'play') showNextCard();
}
function showNextCard() {
  if (!S.cardQueue.length) { S.mode = 'play'; $('#card').classList.remove('show'); return; }
  S.mode = 'card';
  const c = S.cardQueue[0];
  $('#card-badge').textContent = tr('ui.' + (c.kind === 'skill' ? 'skill' : c.kind === 'project' ? 'project' : 'secret'));
  $('#card').dataset.kind = c.kind;
  $('#card-title').textContent = c.title;
  $('#card-text').textContent = c.text;
  $('#card-hint').textContent = tr('ui.nextHint');
  $('#card').classList.add('show');
}
function nextCard() {
  S.cardQueue.shift();
  sfx.click();
  showNextCard();
}

/* ------------------------------------------------ финал уровня */
function finishLevel() {
  if (S.mode !== 'play') return;
  sfx.door();
  const last = S.levelIdx === LEVELS.length - 1;
  if (last) {
    S.mode = 'ending';
    confetti(160);
    $('#end-gems').textContent = `${[...S.collected].length} / ${META.gemsTotal}`;
    $('#end-deaths').textContent = S.deaths;
    $('#end-time').textContent = fmtTime(S.time);
    $('#end-secret').textContent = S.secret ? '✔' : '—';
    $('#ending').classList.add('show');
    save();
  } else {
    startLevel(S.levelIdx + 1);
  }
}
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ------------------------------------------------ HUD и оверлеи */
function updateHud() {
  if (S.mode === 'splash' || S.mode === 'doc') { $('#hud').classList.remove('show'); return; }
  $('#hud').classList.add('show');
  const def = LEVELS[S.levelIdx].def;
  $('#hud-level').textContent = def.name[S.lang];
  $('#hud-gems').textContent = `◆ ${[...S.collected].length}/${META.gemsTotal}`;
  $('#hud-design').textContent = S.designMode ? tr('ui.designOn') : tr('ui.designOff');
  $('#hud-design').classList.toggle('on', S.designMode);
  $('#btn-mute').textContent = S.muted ? '🔇' : '🔊';
}
function toast(text, ms = 2600) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

function openPause() {
  S.mode = 'pause';
  $('#pause').classList.add('show');
  renderPauseTabs('about');
  sfx.click();
}
function closePause() {
  S.mode = 'play';
  $('#pause').classList.remove('show');
  sfx.click();
}
function renderPauseTabs(tab) {
  document.querySelectorAll('#pause .tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const box = $('#pause-content');
  const r = T.resume;
  if (tab === 'about') {
    box.innerHTML = r.about.map(p => `<p>${p}</p>`).join('');
  } else if (tab === 'skills') {
    box.innerHTML = `<ul class="list">${r.skills.map(s => `<li><b>${s.name}</b><span>${s.note}</span></li>`).join('')}</ul>`;
  } else if (tab === 'projects') {
    box.innerHTML = r.projects.map(p => `<div class="mini"><b>${p.name}</b><i>${p.kind}</i><p>${p.text}</p></div>`).join('');
  } else if (tab === 'design') {
    box.innerHTML = r.designNotes.map(n => `<div class="mini"><b>◆ ${n.title}</b><p>${n.text}</p></div>`).join('');
  } else if (tab === 'contacts') {
    box.innerHTML = `
      <p>📞 <a href="tel:${r.contacts.phone.replace(/\s/g, '')}">${r.contacts.phone}</a></p>
      <p>✉ <a href="mailto:${r.contacts.email}">${r.contacts.email}</a></p>
      <p>⌥ <a href="https://${r.contacts.github}" target="_blank" rel="noopener">${r.contacts.github}</a></p>`;
  }
}

/* ------------------------------------------------ документ-режим (fast path) */
function renderDoc() {
  const r = T.resume, u = T.ui;
  const el = $('#doc');
  el.innerHTML = `
    <div class="doc-inner">
      <header class="doc-hero">
        <div>
          <h1>${u.title}</h1>
          <p class="doc-role">${u.role}</p>
          <p class="doc-tagline">${u.tagline}</p>
        </div>
        <div class="doc-cta no-print">
          <p class="doc-note">${r.fastPathNote}</p>
          <div class="row">
            <button class="btn primary" onclick="CV.play()">${T.ui.newGame}</button>
            <button class="btn" onclick="window.print()">${T.ui.pdf}</button>
          </div>
        </div>
      </header>

      <section>
        <h2>${u.tabs.about}</h2>
        ${r.about.map(p => `<p>${p}</p>`).join('')}
      </section>

      <section>
        <h2>${u.tabs.skills}</h2>
        <ul class="doc-skills">
          ${r.skills.map(s => `<li><b>${s.name}</b><span>${s.note}</span></li>`).join('')}
        </ul>
      </section>

      <section>
        <h2>${u.tabs.projects}</h2>
        ${r.projects.map(p => `<div class="doc-proj"><h3>${p.name}</h3><i>${p.kind}</i><p>${p.text}</p></div>`).join('')}
      </section>

      <section>
        <h2>${u.tabs.design}</h2>
        <p class="doc-note">${S.lang === 'ru'
          ? 'Это резюме — игра. Ниже — дизайнерские решения, принятые в ней: они показывают, как я мыслю, лучше любого списка навыков.'
          : 'This resume is a game. Below are the design decisions behind it: they show how I think better than any skill list.'}</p>
        ${r.designNotes.map(n => `<div class="doc-note-item"><h3>◆ ${n.title}</h3><p>${n.text}</p></div>`).join('')}
      </section>

      <section>
        <h2>${u.tabs.contacts}</h2>
        <div class="doc-contacts">
          <a href="tel:${r.contacts.phone.replace(/\s/g, '')}">📞 ${r.contacts.phone}</a>
          <a href="mailto:${r.contacts.email}">✉ ${r.contacts.email}</a>
          <a href="https://${r.contacts.github}" target="_blank" rel="noopener">⌥ ${r.contacts.github}</a>
        </div>
      </section>
      <footer><p>${r.docNote} · <a href="assets/Yaroslav_Kukar_CV.pdf" target="_blank" rel="noopener">${S.lang === 'ru' ? 'Оригинальный CV (PDF)' : 'Original CV (PDF)'}</a></p><p>© 2026 ${u.title}</p></footer>
    </div>`;
}

function openDoc() {
  S.mode = 'doc';
  renderDoc();
  $('#splash').classList.remove('show');
  $('#doc').classList.add('show');
  $('#hud').classList.remove('show');
  $('#touch').classList.remove('visible');
  document.body.classList.add('doc-open');
  sfx.click();
}
function closeDoc() {
  S.mode = 'splash';
  $('#doc').classList.remove('show');
  $('#splash').classList.add('show');
  document.body.classList.remove('doc-open');
  sfx.click();
}

/* Экспорт колбэков для inline onclick */
window.CV = {
  play(fromSave) {
    audio();
    $('#splash').classList.remove('show');
    $('#doc').classList.remove('show');
    document.body.classList.remove('doc-open');
    if (!fromSave) {
      S.collected = new Set(); S.deaths = 0; S.time = 0;
      S.skillCounter1 = 0; S.skillCounter3 = 0; S.projCounter = 0;
    } else {
      S.skillCounter1 = [...S.collected].filter(k => k.startsWith('0:g')).length;
      S.skillCounter3 = [...S.collected].filter(k => k.startsWith('2:g')).length;
      S.projCounter = [...S.collected].filter(k => k.startsWith('1:G')).length;
    }
    startLevel(S.levelIdx, true);
    S.mode = 'play';
    updateHud();
    sfx.click();
  },
  doc() { openDoc(); },
  docBack() { closeDoc(); },
  pause() { openPause(); },
  resume() { closePause(); },
  restart() {
    $('#pause').classList.remove('show'); $('#ending').classList.remove('show');
    S.collected = new Set(); S.deaths = 0; S.time = 0; S.skillCounter1 = 0; S.skillCounter3 = 0; S.projCounter = 0;
    startLevel(0, false);
    S.mode = 'play'; updateHud(); sfx.click();
  },
  toDoc() {
    $('#pause').classList.remove('show'); $('#ending').classList.remove('show');
    openDoc();
  },
  tab(tab) { renderPauseTabs(tab); sfx.click(); },
  design() { S.designMode = !S.designMode; updateHud(); sfx.click(); },
  cardNext() { nextCard(); },
  lang() { S.lang = S.lang === 'ru' ? 'en' : 'ru'; save(); applyLang(); sfx.click(); },
  mute() { S.muted = !S.muted; save(); updateHud(); },
  print() { window.print(); },
};

/* ------------------------------------------------ фон и рендер */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

function drawBackground(ctx, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const rnd = seeded(theme.deco + S.levelIdx);
  if (theme.deco === 'stars') {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const x = (rnd() * 900 - S.cam.x * 0.25) % 900, y = rnd() * 220;
      ctx.globalAlpha = 0.25 + rnd() * 0.5;
      ctx.fillRect(((x % 900) + 900) % 900 - 100, y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  } else if (theme.deco === 'pipes') {
    ctx.fillStyle = theme.far;
    for (let i = 0; i < 14; i++) {
      const x = ((rnd() * 1000 - S.cam.x * 0.3) % 1000 + 1000) % 1000 - 100;
      const w = 20 + rnd() * 40, h = 120 + rnd() * 180;
      ctx.fillRect(x, VIEW_H - h, w, h);
      ctx.fillRect(x - 4, VIEW_H - h, w + 8, 6);
    }
  } else if (theme.deco === 'grid') {
    ctx.strokeStyle = 'rgba(123,92,255,0.18)'; ctx.lineWidth = 1;
    const off = (S.cam.x * 0.3) % 48;
    for (let x = -off; x < VIEW_W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke(); }
    for (let y = (S.cam.y * 0.2) % 48; y < VIEW_H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke(); }
  }

  /* далёкий силуэт города */
  ctx.fillStyle = theme.far;
  const r2 = seeded('city' + S.levelIdx);
  for (let i = 0; i < 30; i++) {
    const bw = 30 + r2() * 60, bh = 30 + r2() * 90;
    const bx = ((r2() * 1100 - S.cam.x * 0.45) % 1100 + 1100) % 1100 - 100;
    ctx.fillRect(bx, VIEW_H - 40 - bh, bw, bh);
  }
}

function drawTile(ctx, ch, x, y, theme) {
  const px = x * TILE, py = y * TILE;
  if (ch === '#') {
    const above = S.lvl.at(x, y - 1) !== '#' && S.lvl.at(x, y - 1) !== 'w';
    ctx.fillStyle = theme.ground;
    ctx.fillRect(px, py, TILE, TILE);
    if (above) {
      ctx.fillStyle = theme.groundTop; ctx.fillRect(px, py, TILE, 4);
      ctx.fillStyle = theme.groundEdge; ctx.fillRect(px, py, TILE, 1.5);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 3, py + 5, 2, 2);
    }
  } else if (ch === 'X') {
    ctx.fillStyle = theme.plat; ctx.fillRect(px, py, TILE, 6);
    ctx.fillStyle = theme.platEdge; ctx.fillRect(px, py, TILE, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px + 2, py + 6, TILE - 4, 1);
  } else if (ch === '^') {
    ctx.fillStyle = '#c94f4f';
    for (let i = 0; i < 2; i++) {
      const sx = px + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx + 1, py + TILE); ctx.lineTo(sx + 4, py + 4); ctx.lineTo(sx + 7, py + TILE);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#8a2f2f'; ctx.fillRect(px, py + TILE - 2, TILE, 2);
  } else if (ch === 'w') {
    /* иллюзорная стена: выглядит как земля; в D-режиме становится призрачной */
    if (S.designMode) {
      ctx.globalAlpha = 0.22 + Math.sin(performance.now() / 300) * 0.08;
      ctx.fillStyle = theme.ground; ctx.fillRect(px, py, TILE, TILE);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#f72585'; ctx.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);
    } else {
      ctx.fillStyle = theme.ground; ctx.fillRect(px, py, TILE, TILE);
    }
  }
}

function drawGem(ctx, gem) {
  const t = performance.now() / 400 + gem.t;
  const bob = Math.sin(t) * 2;
  const cx = gem.x + 4, cy = gem.y + 4 + bob;
  const col = GEM_COLORS[gem.kind];
  const size = gem.kind === 'G' ? 6 : gem.kind === 'S' ? 6 : 5;
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = S.designMode ? 10 : 6;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size); ctx.lineTo(cx + size, cy); ctx.lineTo(cx, cy + size); ctx.lineTo(cx - size, cy);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(cx - 1, cy - size + 2, 1.5, 2);
}

function drawSign(ctx, sg, theme) {
  const t = performance.now() / 600 + sg.t;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(sg.x + 6, sg.y + 4, 2, 12);
  ctx.fillStyle = S.designMode ? '#f72585' : 'rgba(255,255,255,0.35)';
  if (S.designMode) { ctx.shadowColor = '#f72585'; ctx.shadowBlur = 6 + Math.sin(t * 2) * 3; }
  ctx.fillRect(sg.x + 1, sg.y, 12, 8);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1a2e';
  ctx.font = '7px monospace'; ctx.textAlign = 'center';
  ctx.fillText('C', sg.x + 7, sg.y + 6.5);
}

function drawCheck(ctx, c) {
  ctx.fillStyle = '#8888aa';
  ctx.fillRect(c.x + 7, c.y - 12, 2, 28);
  ctx.fillStyle = c.on ? '#7ac74f' : '#555577';
  const wave = c.on ? Math.sin(performance.now() / 200) * 1.5 : 0;
  ctx.beginPath();
  ctx.moveTo(c.x + 9, c.y - 12); ctx.lineTo(c.x + 20 + wave, c.y - 8); ctx.lineTo(c.x + 9, c.y - 4);
  ctx.closePath(); ctx.fill();
}

function drawDoor(ctx, d, theme) {
  ctx.fillStyle = '#0d0f1e';
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.strokeStyle = theme.accent; ctx.lineWidth = 2;
  ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 350) * 0.2;
  ctx.fillRect(d.x + 3, d.y + 3, d.w - 6, d.h - 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0d0f1e';
  ctx.font = '6px monospace'; ctx.textAlign = 'center';
  ctx.fillText(S.lang === 'ru' ? 'ФИНАЛ' : 'GOAL', d.x + d.w / 2, d.y + d.h / 2 + 2);
}

function drawPlayer(ctx) {
  const p = S.player;
  let spr = SPR.idle;
  if (!p.onGround) spr = SPR.jump;
  else if (Math.abs(p.vx) > 10) spr = (Math.floor(p.anim) % 2) ? SPR.run1 : SPR.run2;
  const sq = p.squash;
  const w = 12 * (1 - sq * 0.5), h = 16 * (1 + sq * 0.5);
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h);
  ctx.scale(p.face, 1);
  if (S.respawnT > 0) ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 40) * 0.3;
  ctx.drawImage(spr, -w / 2, -h, w, h);
  ctx.restore();
}

function drawEnemy(ctx, e) {
  if (e.dead) return;
  const spr = Math.floor(e.t * 6) % 2 ? SPR.slime1 : SPR.slime2;
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h);
  ctx.scale(e.vx > 0 ? -1 : 1, 1);
  ctx.drawImage(spr, -8, -8, 16, 8);
  ctx.restore();
}

function drawParticles(ctx, dt) {
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const pt = S.particles[i];
    pt.t += dt;
    if (pt.t >= pt.life) { S.particles.splice(i, 1); continue; }
    pt.vy += pt.grav * dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    ctx.globalAlpha = 1 - pt.t / pt.life;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------ главный цикл */
const canvas = $('#game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W; canvas.height = VIEW_H;

let last = performance.now(), lastTick = performance.now();
function frame(now) {
  lastTick = now;
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  const inGame = ['play', 'card', 'pause', 'ending'].includes(S.mode);
  if (S.mode === 'doc') { /* фон статичен */ }

  if (S.mode === 'play') {
    S.time += dt;
    if (S.respawnT > 0) {
      S.respawnT -= dt;
      if (S.respawnT <= 0) respawn();
    } else {
      movePlayer(dt);
    }
    moveEnemies(dt);
  } else if (S.mode === 'splash') {
    S.splashPan += dt * 12;
    S.cam.x = S.splashPan % Math.max(1, S.lvl.w * TILE - VIEW_W);
  }

  if (inGame || S.mode === 'splash') {
    /* камера */
    if (S.mode !== 'splash') {
      const p = S.player;
      const tx = clamp(p.x + p.w / 2 - VIEW_W / 2 + p.face * 30, 0, S.lvl.w * TILE - VIEW_W);
      S.cam.x = lerp(S.cam.x, tx, Math.min(1, dt * 6));
      const ty = clamp(p.y - VIEW_H / 2 + 20, 0, LEVEL_H * TILE - VIEW_H);
      S.cam.y = lerp(S.cam.y, ty, Math.min(1, dt * 4));
    }
    S.cam.shake *= (1 - 8 * dt);

    const theme = THEMES[S.lvl.def.theme];
    ctx.save();
    const shx = (Math.random() - 0.5) * S.cam.shake * 2, shy = (Math.random() - 0.5) * S.cam.shake * 2;
    ctx.translate(-Math.round(S.cam.x) + shx, -Math.round(S.cam.y) + shy);

    drawBackground(ctx, theme);

    /* видимые тайлы */
    const x0 = Math.max(0, Math.floor(S.cam.x / TILE)), x1 = Math.min(S.lvl.w - 1, Math.ceil((S.cam.x + VIEW_W) / TILE));
    for (let y = 0; y < LEVEL_H; y++)
      for (let x = x0; x <= x1; x++) {
        const ch = S.lvl.at(x, y);
        if (ch !== ' ') drawTile(ctx, ch, x, y, theme);
      }

    S.signs.forEach(sg => drawSign(ctx, sg, theme));
    S.checks.forEach(c => drawCheck(ctx, c));
    if (S.door) drawDoor(ctx, S.door, theme);
    S.gems.forEach(gm => { if (!gm.taken) drawGem(ctx, gm); });
    S.enemies.forEach(e => drawEnemy(ctx, e));
    if (S.mode !== 'splash') drawPlayer(ctx);
    drawParticles(ctx, dt);

    ctx.restore();

    /* виньетка */
    const vg = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H / 2.4, VIEW_W / 2, VIEW_H / 2, VIEW_H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

/* ------------------------------------------------ resize */
function loop(now) { frame(now); requestAnimationFrame(loop); }
/* Fallback: rAF душится в скрытых и встроенных окнах (HR часто
   открывает страницу в превью) — если кадров нет дольше 90 мс,
   гоняем цикл по таймеру. При возврате rAF интервал сам затихает. */
setInterval(() => {
  const now = performance.now();
  if (now - lastTick > 90) frame(now);
}, 33);

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = Math.floor(VIEW_W * scale) + 'px';
  canvas.style.height = Math.floor(VIEW_H * scale) + 'px';
}
window.addEventListener('resize', resize);

/* ------------------------------------------------ init */
function init() {
  const sv = loadSave();
  S.hasSave = false;
  if (sv) {
    if (sv.lang) { S.lang = sv.lang; }
    S.muted = !!sv.muted;
    S.hasSave = (sv.gems && sv.gems.length > 0) || sv.level > 0;
    S.collected = new Set(sv.gems || []);
    S.deaths = sv.deaths || 0;
    S.time = sv.time || 0;
    S.secret = !!sv.secret;
    S.levelIdx = clamp(sv.level || 0, 0, LEVELS.length - 1);
    if (S.hasSave) $('#save-hint').textContent = tr('ui.saveFound');
  }
  $('#btn-continue').style.display = S.hasSave ? '' : 'none';
  S.lvl = LEVELS[0];
  startLevel(0, true);
  S.mode = 'splash';
  $('#splash').classList.add('show');
  applyLang();
  resize();
  requestAnimationFrame(loop);
}

init();

})();
