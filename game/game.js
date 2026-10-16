/* Red's Delivery Run
   Plain canvas game. No build step. Spoilers for the hidden bits are in README.md. */
'use strict';
(() => {

// ---------------------------------------------------------------- config
const IMG = '../images/';
const ASSETS = {
  despo:      IMG + 'group-3-3x-mu99zchq-7psx.webp',
  vignette:   IMG + 'vig-mascot.webp',
  portrait:   IMG + 'portrait-bitmap-hd.png',
  poster0:    IMG + 'poster-shaayar.webp',
  poster1:    IMG + 'brave-and-bold-mu9lless-5lg8.webp',
  poster2:    IMG + 'art-is-you-mu9kw4ww-nc8p.webp',
};
const POSTER_NAMES = ['Shaayar', 'Brave and Bold', 'Art is you'];
// the rest of the poster section, shown on billboards along the route
const WALL_POSTERS = [
  ['The Truth', 'the-truth-mu9kxz49-0ne3.webp'], ['Flow', 'flow-mu9kzrck-174x.webp'],
  ['Recit', 'recit-mu9l22p8-nsyb.webp'], ['Makunouchi Ippo', 'makunouchi-ippo-mu9lh8ep-1t9d.webp'],
  ['Vinland Saga', 'vinland-saga1-mu9kydem-fs41.webp'], ['Democracy', 'poster-democracy.webp'],
  ['Obsession', 'poster-obsession.webp'], ['Monotony', 'poster-monotony.webp'],
  ['Nature', 'poster-nature.webp'], ['Verdant', 'poster-verdant.webp'],
  ['Monkey Man', 'poster-monkey-man.webp'], ['Devdas', 'poster-devdas.webp'],
  ['Abstract Art', 'poster-abstract-art.webp'], ['Text Style', 'poster-text-style.webp'],
  ['First Draft', 'poster-first-draft.webp'], ['Stamp', 'poster-stamp.webp'],
].map(([name, file]) => ({ name, src: IMG + file }));
const CONTACT = {
  email: 'shandi1ya.contact@gmail.com',
  line: 'Ideas start on paper, finished on screen.',
};

const LEVELS = [
  null,
  { name: 'Desportivos Grounds', theme: 'grounds', slots: 16, speed: 95,  gap: 112, spacing: 205, flyer: 'ball',   flyerChance: .35, seed: 2601 },
  { name: 'LNMIIT Campus',       theme: 'campus',  slots: 20, speed: 108, gap: 102, spacing: 195, flyer: 'pigeon', flyerChance: .45, seed: 2602 },
  { name: 'Campus at Dusk',      theme: 'dusk',    slots: 22, speed: 120, gap: 94,  spacing: 185, flyer: 'kite',   flyerChance: .55, seed: 2603 },
];

const EGGS = [
  { id: 'wink',        name: 'Wink',            note: 'Red winked back. ;)' },
  { id: 'portrait',    name: 'Pixel portrait',  note: 'You flew straight through the artist.' },
  { id: 'desportivos', name: "Desportivos '26", note: 'The mascot cheered you over the line.' },
  { id: 'vignette',    name: 'Vignette',        note: 'The octopus lent you its brush.' },
  { id: 'merch',       name: 'Ode merch',       note: 'Tumbler, badge and tote in one run.' },
  { id: 'posters',     name: 'Poster run',      note: 'Shaayar, Brave and Bold and Art is you.' },
  { id: 'sketch',      name: 'Sketch mode',     note: 'Back to paper, where it all starts.' },
  { id: 'delivered',   name: 'Delivered',       note: 'The letter reached its reader.' },
];

// physics, in logical pixels
let H = 270, GROUND = 250;   // H grows on tall portrait screens
const GRAV = 820, FLAP = -250, MAXFALL = 360;
const RED_SCALE = 2, RED_SIZE = 11 * RED_SCALE;

// ---------------------------------------------------------------- utils
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const shuffle = (arr, rnd) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let RM = motionQuery.matches;
motionQuery.addEventListener && motionQuery.addEventListener('change', e => { RM = e.matches; });

const store = {
  get(k, d) { try { const v = localStorage.getItem('red.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('red.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: play on */ } },
};

// ---------------------------------------------------------------- sprites
const INK = '#111111', BG = '#fbfbf9', SAND = '#f0efeb', ACCENT = '#ff4a1c', ACCENT_INK = '#c8330c';

const RED_ROWS = [
  'a.........a',
  'ab.......ba',
  '.abbbbbbba.',
  'ababbbbbaba',
  'abcabbbacba',
  'abcacdcacba',
  '.daccdccad.',
  'daabbbbbaad',
  'ddbbbbbbbdd',
  '.addddddda.',
  '..dad.dad..',
];
const RED_PAL = { a: '#620001', b: '#900305', c: '#dd000b', d: '#3c0100' };
const edit = (rows, changes) => { const g = rows.map(r => r.split('')); changes.forEach(([r, c, ch]) => { g[r][c] = ch; }); return g.map(r => r.join('')); };
const RED_UP = edit(RED_ROWS, [[6, 0, 'd'], [6, 10, 'd'], [8, 0, '.'], [8, 10, '.']]);
const RED_WINK = edit(RED_ROWS, [[4, 8, 'b'], [5, 8, 'a']]);

const P = { k: INK, w: BG, s: SAND, a: ACCENT, A: ACCENT_INK, g: '#9a958c', G: '#6d6a63', y: '#ffd34d', p: '#7b5ea7', q: '#a98bd1' };
const LETTER_ROWS = ['kkkkkkkkkk', 'kkwwwwwwkk', 'kwkwwwwkwk', 'kwwkwwkwwk', 'kwwwkkwwwk', 'kwwwwwwwwk', 'kkkkkkkkkk'];
const TUMBLER_ROWS = ['..kkkkkk..', '.kaaaaaak.', '..kkkkkk..', '..kwwwwk..', '..kwwwwk..', '..kaaaak..', '..kwwwwk..', '..kwwwwk..', '..kwwwwk..', '...kkkk...'];
const BADGE_ROWS = ['...kkkk...', '..kaaaak..', '.kaawwaak.', 'kaawkkwaak', 'kawkwwkwak', 'kawkwwkwak', 'kaawkkwaak', '.kaawwaak.', '..kaaaak..', '...kkkk...'];
const TOTE_ROWS = ['...kkkk...', '..k....k..', '..k....k..', 'kkkkkkkkkk', 'kwwwwwwwwk', 'kwwaaaawwk', 'kwwaaaawwk', 'kwwwwwwwwk', 'kwwwwwwwwk', 'kkkkkkkkkk'];
const BALL_ROWS = ['...kkkk...', '..kwwwwk..', '.kwwkkwwk.', 'kwwkkkkwwk', 'kwwwkkwwwk', 'kkwwwwwwkk', 'kkkwwwwkkk', '.kwwkkwwk.', '..kwkkwk..', '...kkkk...'];
const KITE_ROWS = ['....k....', '...kak...', '..kaaak..', '.kaaaaak.', 'kkkkkkkkk', '.kwwwwwk.', '..kwwwk..', '...kwk...', '....k....'];
const OCTO_ROWS = ['...kkkkkk...', '..kqqqqqqk..', '.kqppppppqk.', '.kpwkppwkpk.', '.kpkkppkkpk.', '.kppppppppk.', '..kppppppk..', '.kpkpkkpkpk.', 'kp.kp..pk.pk', 'k..kp..pk..k', '...k....k...'];
const HEART_ROWS = ['.kk.kk.', 'kaakaak', 'kaaaaak', 'kaaaaak', '.kaaak.', '..kak..', '...k...'];
const DESPO_ROWS = ['..kkkk..', '.kaaaak.', 'kawkkwak', 'kaaaaaak', '.kakkak.', 'kkaaaakk', 'k.kaak.k', '..k..k..'];

function sprite(rows, pal) {
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const col = pal[r[i]]; if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); } } });
  return c;
}
const SPR = {
  red: sprite(RED_ROWS, RED_PAL), redUp: sprite(RED_UP, RED_PAL), redWink: sprite(RED_WINK, RED_PAL),
  letter: sprite(LETTER_ROWS, P), gold: sprite(LETTER_ROWS, { ...P, w: P.y }),
  tumbler: sprite(TUMBLER_ROWS, P), badge: sprite(BADGE_ROWS, P), tote: sprite(TOTE_ROWS, P),
  ball: sprite(BALL_ROWS, P), kite: sprite(KITE_ROWS, P), octo: sprite(OCTO_ROWS, P),
  heart: sprite(HEART_ROWS, P), despo: sprite(DESPO_ROWS, P),
};

// ---------------------------------------------------------------- themes
const THEMES = {
  // Desportivos ground: daytime turf, warm Jaipur sky
  grounds: {
    sky: ['#fbfbf9', '#f8f2ea', '#fbe8dd', '#fddbca'], sun: '#ffe2d2', cloud: '#ffffff', cloudShade: '#f1e5dc',
    hill1: '#f3dccf', hill2: '#ebc8b5', wall: '#e2b49c',
    stand: '#ebe6dd', standDark: '#d6cec2', crowd: [ACCENT, INK, '#fbfbf9', '#ffb199', '#6d6a63', ACCENT_INK],
    bld: '#f2c9b4', bldDark: '#e0a68c', bldWin: '#9b4a32', roof: '#eab49b',
    tree: '#b2cb95', treeDark: '#93b179', trunk: '#7a5a43',
    grass: '#cfe3b4', grass2: '#c1d9a3', soil: '#f0efeb', chalk: '#ffffff',
    line: INK, pillar: BG, trim: ACCENT, window: INK, accent: ACCENT,
  },
  // LNMIIT campus: pink-sandstone blocks, chhatris, neem trees
  campus: {
    sky: ['#fbfbf9', '#f5f1ea', '#f9eadf', '#fcdccd'], sun: '#ffe2d2', cloud: '#ffffff', cloudShade: '#efe4db',
    hill1: '#f1d9cb', hill2: '#e7c2ae', wall: '#dcab93',
    stand: '#ebe6dd', standDark: '#d6cec2', crowd: [ACCENT, INK, '#fbfbf9'],
    bld: '#f2c6b0', bldDark: '#dc9f85', bldWin: '#8f4330', roof: '#e9b096',
    tree: '#a9c48f', treeDark: '#8aa872', trunk: '#7a5a43',
    grass: '#bfd8a3', grass2: '#adcb8f', soil: '#f0efeb', chalk: '#e2ddd3',
    line: INK, pillar: SAND, trim: ACCENT_INK, window: INK, accent: ACCENT,
  },
  // Campus at dusk: striped sunset, silhouettes, lit windows
  dusk: {
    sky: ['#2e1a28', '#5c2436', '#a3363a', '#e5583c', '#ff8a5c'], sun: '#ffc06b', cloud: '#7b2d3c', cloudShade: '#5c2436',
    hill1: '#6b2c38', hill2: '#4a1f2b', wall: '#3b1822',
    stand: '#2f1b20', standDark: '#24151a', crowd: ['#ffc06b', ACCENT, '#7b2d3c'],
    bld: '#2f1b20', bldDark: '#24151a', bldWin: '#ffc06b', roof: '#3a2026',
    tree: '#1f1416', treeDark: '#170f11', trunk: '#170f11',
    grass: '#24151a', grass2: '#2a191e', soil: '#1d1215', chalk: '#3a2026',
    line: '#000000', pillar: '#1d1a19', trim: ACCENT, window: '#ffc86b', accent: ACCENT, stars: true, sunset: true,
  },
};
// Vignette's paintbrush
const PAINT = {
  sky: ['#eef3ff', '#e2ebff', '#d9f0ea', '#c8ece0'], sun: '#ffe9a8', cloud: '#ffffff', cloudShade: '#dfe6f7',
  hill1: '#cbd9f3', hill2: '#b3c7ec', wall: '#9fb3e0',
  stand: '#e3d9f3', standDark: '#cbbbe6', crowd: ['#2ec4b6', '#7b5ea7', '#ffd34d', '#ffffff'],
  bld: '#d4c1ef', bldDark: '#a98bd1', bldWin: '#4b3575', roof: '#bba2e2',
  tree: '#8fd6c4', treeDark: '#5fbfaa', trunk: '#6a4c93',
  grass: '#c8ece0', grass2: '#b5e2d4', soil: '#efe7fa', chalk: '#ffffff',
  line: '#2b1d3d', pillar: '#7b5ea7', trim: '#2ec4b6', window: '#fff4c2', accent: '#2ec4b6',
};

// ---------------------------------------------------------------- dom
const app = $('#app'), stage = $('#stage'), cv = $('#cv');
let ctx = cv.getContext('2d');
const screens = ['loading', 'menu', 'levels', 'pause', 'result', 'eggs', 'letter'];
function show(id) { screens.forEach(s => { $('#' + s).hidden = s !== id; }); }
const hud = $('#hud'), hint = $('#hint');

$('#loadRed').getContext('2d').drawImage(SPR.red, 0, 0);
document.documentElement.style.setProperty('--heart', `url(${SPR.heart.toDataURL()})`);
document.documentElement.style.setProperty('--env', `url(${SPR.letter.toDataURL()})`);

// ---------------------------------------------------------------- state
let W = 480, scale = 1, RX = 120;
const images = {};
let portraitPts = [];
let found = new Set(store.get('eggs', []));
let unlocked = store.get('unlocked', 1);    // 1..3 levels, endless opens once level 1 is done
let best = store.get('best', 0);
let levelBest = store.get('levelBest', {}); // best score per finished level

const G = {
  state: 'loading', mode: 'level', level: 1, def: LEVELS[1], theme: 'grounds',
  t: 0, camX: 0, speed: 100, ents: [], parts: [],
  hearts: 3, score: 0, carry: 0, cap: 1, combo: 0, delivered: 0, letters: 0,
  speedT: 0, shield: false, invuln: 0, shake: 0,
  merch: new Set(), posters: new Set(), painted: false, sketch: false,
  slot: 0, nextX: 0, endSpawned: false, totalX: 1, plan: null, rnd: Math.random,
  posterSeq: [],
  title: { clicks: 0, lastClick: 0, wink: 0 }, finale: null, endless: { vignette: false },
};
const red = { y: 120, vy: 0, flapT: 0 };

// ---------------------------------------------------------------- audio
const sfx = (() => {
  let ac = null, on = store.get('sound', true);
  function ensure() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function tone(f, d, type = 'square', vol = .04, slide = 0, delay = 0) {
    if (!on || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02);
  }
  return {
    ensure, get on() { return on; },
    toggle() { on = !on; store.set('sound', on); },
    flap: () => tone(420, .07, 'square', .025, 220),
    pick: () => { tone(880, .07); tone(1320, .08, 'square', .03, 0, .06); },
    deliver: () => { tone(660, .08); tone(880, .08, 'square', .04, 0, .07); tone(1320, .14, 'square', .04, 0, .14); },
    hit: () => tone(220, .25, 'sawtooth', .05, -160),
    power: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, .08, 'square', .035, 0, i * .05)); },
    egg: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .12, 'triangle', .06, 0, i * .08)); },
    hoot: () => { tone(330, .18, 'triangle', .07, -40); tone(300, .28, 'triangle', .07, -60, .24); },
    chime: () => tone(1046, .12, 'triangle', .05),
  };
})();

// ---------------------------------------------------------------- layout
const sk = document.createElement('canvas');
const skx = sk.getContext('2d', { willReadFrequently: true });
let skOut = null, lumBuf = null, noise = null;

function resize() {
  const r = app.getBoundingClientRect();
  const cs = getComputedStyle(app);
  const aw = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const portrait = aw / ah < 1;
  app.classList.toggle('portrait', portrait);
  if (portrait) { W = 320; H = Math.round(clamp(W * ah / aw * .62, 270, 460)); }
  else { H = 270; W = Math.round(clamp(H * aw / ah, 320, 600)); }
  GROUND = H - 20;
  const s = Math.min(aw / W, ah / H);
  stage.style.width = Math.floor(W * s) + 'px';
  stage.style.height = Math.floor(H * s) + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * s * dpr);
  cv.height = Math.round(H * s * dpr);
  scale = cv.width / W;
  RX = Math.round(W * .26);
  sk.width = W; sk.height = H; skOut = null;
}
window.addEventListener('resize', resize);

// ---------------------------------------------------------------- eggs
function findEgg(id) {
  if (found.has(id)) return;
  found.add(id);
  store.set('eggs', [...found]);
  const egg = EGGS.find(e => e.id === id);
  toast(`Egg found · ${found.size}/8`, egg.name);
  sfx.egg();
  syncMenu();
}
let toastTimer = 0;
function toast(text, sub) {
  const el = $('#toast');
  el.innerHTML = '';
  el.append(text);
  if (sub) { const s = document.createElement('small'); s.textContent = sub; el.append(s); }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// Konami: sketch mode
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiAt = 0;
function konami(code) {
  konamiAt = code === KONAMI[konamiAt] ? konamiAt + 1 : (code === KONAMI[0] ? 1 : 0);
  if (konamiAt === KONAMI.length) {
    konamiAt = 0;
    G.sketch = !G.sketch;
    document.body.classList.toggle('sketch', G.sketch);
    if (found.has('sketch')) toast(G.sketch ? 'Sketch mode' : 'Ink mode'); else findEgg('sketch');
  }
}

// ---------------------------------------------------------------- menus
function scramble(el) {
  if (RM || el._scrambling) return;
  const node = textNode(el);
  if (!node) return;
  const target = el.dataset.label || node.nodeValue;
  el.dataset.label = target;
  const chars = '!<>-_\\/[]{}=+*^?#01';
  let frame = 0; const total = 14;
  el._scrambling = true;
  const tick = () => {
    const done = Math.floor(target.length * frame / total);
    let out = '';
    for (let i = 0; i < target.length; i++) out += i < done || target[i] === ' ' ? target[i] : chars[(Math.random() * chars.length) | 0];
    node.nodeValue = out;
    if (frame++ < total) requestAnimationFrame(tick); else { node.nodeValue = target; el._scrambling = false; }
  };
  tick();
}
function bindScramble(root) {
  root.querySelectorAll('.scramble').forEach(el => {
    if (el._bound) return; el._bound = true;
    el.addEventListener('mouseenter', () => scramble(el));
    el.addEventListener('focus', () => scramble(el));
  });
}
function textNode(el) { return [...el.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim()) || null; }
function setLabel(el, text) {
  el.dataset.label = text;
  const n = textNode(el);
  if (n) n.nodeValue = text; else el.prepend(text);
}
function syncMenu() {
  setLabel($('#soundBtn'), 'Sound: ' + (sfx.on ? 'on' : 'off'));
  const eb = $('#eggsBtn');
  eb.hidden = found.size === 0;
  setLabel(eb, `Eggs found ${found.size}/8`);
}
function buildLevelList() {
  const list = $('#levelList');
  list.innerHTML = '';
  const add = (label, sub, num, enabled, act) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'menu-item scramble';
    b.disabled = !enabled;
    b.append(label);
    if (num) { const n = document.createElement('span'); n.className = 'num'; n.textContent = num; b.prepend(n); }
    const s = document.createElement('small'); s.textContent = enabled ? sub : 'Locked'; b.append(s);
    b.addEventListener('click', act);
    list.append(b);
  };
  for (let i = 1; i <= 3; i++) add(LEVELS[i].name, `${LEVELS[i].slots} gates`, 'L' + i, i <= unlocked, () => startRun(i));
  add('Endless', best ? `Best ${best}` : 'No best yet', '∞', unlocked >= 2, () => startRun('endless'));
  bindScramble(list);
}
function buildEggList() {
  const ol = $('#eggList');
  ol.innerHTML = '';
  EGGS.forEach(e => {
    const li = document.createElement('li');
    const has = found.has(e.id);
    li.className = has ? '' : 'locked';
    const b = document.createElement('b'); b.textContent = has ? e.name : '???';
    const s = document.createElement('span'); s.textContent = has ? e.note : 'Not found yet';
    li.append(b, s); ol.append(li);
  });
  $('#eggsCount').textContent = `Eggs found ${found.size}/8`;
}
function toMenu() {
  G.state = 'title';
  G.ents = []; G.parts = []; G.painted = false; G.theme = 'grounds';
  hud.hidden = true; hint.hidden = true;
  syncMenu();
  show('menu');
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  sfx.ensure();
  const act = el.dataset.act;
  if (act === 'play') { buildLevelList(); show('levels'); focusFirst('#levels'); }
  else if (act === 'sound') { sfx.toggle(); syncMenu(); }
  else if (act === 'eggs') { buildEggList(); show('eggs'); }
  else if (act === 'menu') toMenu();
  else if (act === 'resume') resume();
  else if (act === 'restart') startRun(G.mode === 'endless' ? 'endless' : G.level);
});
function focusFirst(sel) { const b = $(sel).querySelector('button:not([disabled])'); if (b && matchMedia('(pointer: fine)').matches) b.focus({ preventScroll: true }); }
$('#pauseBtn').addEventListener('pointerdown', e => e.stopPropagation());
$('#pauseBtn').addEventListener('click', () => { if (G.state === 'play' || G.state === 'ready') pause(); });

// ---------------------------------------------------------------- run setup
function buildPlan(def, seed) {
  const rnd = mulberry(seed);
  const plan = { special: {}, power: {} };
  if (G.mode === 'endless') return plan;
  const n = def.slots;
  // one of each merch per level, spread out
  const kinds = shuffle(['tumbler', 'badge', 'tote'], rnd);
  const thirds = [2 + Math.floor(rnd() * 3), Math.floor(n / 2) + Math.floor(rnd() * 2) - 1, n - 4 + Math.floor(rnd() * 2)];
  thirds.forEach((s, i) => { plan.power[s] = kinds[i]; });
  if (G.level === 2) {
    plan.special[4] = 'poster0'; plan.special[9] = 'poster1'; plan.special[15] = 'poster2';
    plan.special[12] = 'portrait';
    if (Math.random() < .4) plan.special[6 + Math.floor(Math.random() * 2)] = 'octo';
  }
  if (G.level === 3 && Math.random() < .25) plan.special[5 + Math.floor(Math.random() * 10)] = 'octo';
  // keep merch out of special slots
  Object.keys(plan.special).forEach(s => { if (plan.power[s]) { plan.power[+s + 1] = plan.power[s]; delete plan.power[s]; } });
  return plan;
}

function shufflePosters() {
  const ids = WALL_POSTERS.map((_, i) => i), seq = [];
  while (seq.length < ids.length * 6) {
    const round = shuffle(ids.slice(), Math.random);
    if (seq.length && round[0] === seq[seq.length - 1]) round.push(round.shift());
    seq.push(...round);
  }
  G.posterSeq = seq;
}

function startRun(which) {
  sfx.ensure();
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
  G.mode = which === 'endless' ? 'endless' : 'level';
  G.level = which === 'endless' ? 0 : which;
  G.def = which === 'endless'
    ? { name: 'Endless', theme: 'campus', speed: 100, gap: 112, spacing: 200, flyer: 'pigeon', flyerChance: .4 }
    : LEVELS[which];
  G.theme = G.def.theme;
  G.rnd = G.mode === 'endless' ? Math.random : mulberry(G.def.seed * 7);
  G.plan = buildPlan(G.def, G.def.seed || 1);
  Object.assign(G, {
    camX: 0, speed: G.def.speed, ents: [], parts: [], hearts: 3, score: 0, carry: 0, cap: 1,
    combo: 0, delivered: 0, letters: 0, speedT: 0, shield: false, invuln: 0, shake: 0,
    slot: 0, nextX: W + 60, endSpawned: false, painted: false, finale: null,
  });
  shufflePosters();
  G.merch = new Set(); G.posters = new Set(); G.endless = { vignette: false };
  G.totalX = G.mode === 'endless' ? 1 : (G.def.slots * G.def.spacing + 120);
  red.y = H * .42; red.vy = 0; red.flapT = 0;
  G.state = 'ready';
  show(null);
  hud.hidden = false; hint.hidden = false;
  $('#lvlName').textContent = G.def.name;
  hudCache = {};
}

function pause() { if (G.state !== 'play' && G.state !== 'ready') return; G.prevState = G.state; G.state = 'paused'; show('pause'); focusFirst('#pause'); }
function resume() { if (G.state !== 'paused') return; G.state = G.prevState || 'play'; show(null); document.activeElement && document.activeElement.blur(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ---------------------------------------------------------------- spawning
function curGap() { return G.mode === 'endless' ? Math.max(86, 112 - G.slot * .9) : G.def.gap; }
function curSpacing() { return G.mode === 'endless' ? Math.max(170, 205 - G.slot * .8) : G.def.spacing; }

function spawnNext() {
  const def = G.def, rnd = G.rnd, x = G.nextX, i = G.slot, sp = curSpacing();
  if (G.mode === 'level' && i >= def.slots) {
    G.endSpawned = true;
    if (G.level === 3) G.ents.push({ type: 'final', x: x + 40, w: 32, done: false });
    else {
      G.ents.push({ type: 'finish', x: x + 40, w: 64, done: false });
      if (G.level === 1) G.ents.push({ type: 'despo', x: x + 118, cheer: 0 });
    }
    return;
  }

  // endless: rotate themes, scatter the specials
  let special = G.plan.special[i];
  let power = G.plan.power[i];
  if (G.mode === 'endless') {
    G.theme = Math.floor(i / 14) % 3 === 2 ? 'dusk' : (Math.floor(i / 14) % 3 === 1 ? 'grounds' : 'campus');
    G.def.flyer = { campus: 'pigeon', grounds: 'ball', dusk: 'kite' }[G.theme];
    G.def.flyerChance = Math.min(.7, .35 + i * .01);
    G.speed = Math.min(180, 100 + i * 1.6);
    if (i > 2 && i % 7 === 0) power = ['tumbler', 'badge', 'tote'][Math.floor(rnd() * 3)];
    const posterIdx = [5, 12, 19].indexOf(i % 24);
    if (posterIdx >= 0) special = 'poster' + posterIdx;
    else if (i % 30 === 26) special = 'portrait';
    else if (i > 10 && !G.endless.vignette && rnd() < .06) { special = 'octo'; G.endless.vignette = true; }
  }

  const gap = curGap();
  const gapC = clamp(40 + gap / 2 + rnd() * (GROUND - 80 - gap), gap / 2 + 18, GROUND - gap / 2 - 14);

  if (special && special.startsWith('poster')) {
    const id = +special.slice(-1);
    G.ents.push({ type: 'poster', id, x, y: GROUND - 128 - id * 12, w: 56, h: 78, hit: false, flash: 0 });
  } else if (special === 'portrait') {
    G.ents.push(makePortrait(x - 10, 22 + rnd() * 30));
  } else if (special === 'octo') {
    G.ents.push({ type: 'octo', x, y: 70 + rnd() * 60, y0: 0, w: 34, h: 34, t: 0, taken: false, vy: 0 });
  } else {
    const w = G.theme === 'grounds' ? 22 : 30;
    G.ents.push({ type: 'gate', x, w, top: gapC - gap / 2, bot: gapC + gap / 2 });
    // a letter waits in the gap
    G.ents.push({ type: 'letter', x: x + w / 2 - 5, y: gapC - 3, w: 10, h: 7, t: rnd() * 6, gold: false });
  }
  if (special) G.ents.push({ type: 'letter', x: x + 70, y: 90 + rnd() * 70, w: 10, h: 7, t: 0, gold: false });

  // mailbox every other gap
  if (i % 2 === 1) G.ents.push({ type: 'mailbox', x: x + sp * .6, w: 16, done: false, got: false, flag: 0 });

  if (power) G.ents.push({ type: 'power', kind: power, x: x + sp * .42, y: 70 + rnd() * 90, w: 14, h: 14, t: 0 });
  else if (!special && rnd() < def.flyerChance && i > 0) {
    const y0 = 50 + rnd() * (GROUND - 110);
    const f = { type: def.flyer, x: x + sp * .5, y0, y: y0, ph: rnd() * 6, t: 0 };
    if (def.flyer === 'ball') { f.w = 10; f.h = 10; f.y0 = GROUND - 12; }
    else if (def.flyer === 'pigeon') { f.w = 13; f.h = 8; }
    else { f.w = 9; f.h = 9; }
    G.ents.push(f);
  }

  G.slot++;
  G.nextX += sp;
}

function makePortrait(x, y) {
  const parts = portraitPts.map(p => ({ hx: p.hx, hy: p.hy, a: p.a, sx: p.hx + (Math.random() - .5) * 160, sy: p.hy + (Math.random() - .5) * 120, x: 0, y: 0, vx: 0, vy: 0 }));
  parts.forEach(q => { q.x = q.sx; q.y = q.sy; });
  return { type: 'portrait', x, y, w: 70, h: 70, state: 'far', t: 0, parts };
}

function buildPortrait() {
  const N = 44, pts = [], im = images.portrait;
  if (im) {
    try {
      const c = document.createElement('canvas'); c.width = N; c.height = N;
      const x = c.getContext('2d');
      const s = Math.min(im.naturalWidth, im.naturalHeight);
      x.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, N, N);
      const d = x.getImageData(0, 0, N, N).data;
      const lums = [];
      for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 100) lums.push((d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11) / 255);
      const sorted = lums.slice().sort((a, b) => a - b);
      const thr = Math.min(.6, sorted[Math.floor(sorted.length * .5)] || .6);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = (j * N + i) * 4;
        if (d[k + 3] <= 100) continue;
        const l = (d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11) / 255;
        if (l <= thr) pts.push({ hx: i * 1.6, hy: j * 1.6, a: clamp(1.2 - l, .45, 1) });
      }
    } catch (e) { pts.length = 0; }
  }
  if (pts.length < 40) {
    // fallback: a pixel cloud
    const blobs = [[.3, .6, .24], [.52, .45, .3], [.74, .6, .22]];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N;
      if (blobs.some(([bx, by, br]) => Math.hypot(u - bx, (v - by) * 1.3) < br) && (i + j) % 2 === 0) pts.push({ hx: i * 1.6, hy: j * 1.6, a: .75 });
    }
  }
  portraitPts = pts;
}

// ---------------------------------------------------------------- input
function flap() {
  sfx.ensure();
  if (G.state === 'ready') { G.state = 'play'; hint.hidden = true; }
  if (G.state !== 'play') return;
  red.vy = FLAP; red.flapT = .14;
  sfx.flap();
}
window.addEventListener('keydown', e => {
  konami(e.code);
  const flapKey = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
  if (flapKey && (G.state === 'play' || G.state === 'ready')) { e.preventDefault(); if (!e.repeat) flap(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (G.state === 'play' || G.state === 'ready') pause();
    else if (G.state === 'paused') resume();
    else if (['levels', 'eggs'].some(id => !$('#' + id).hidden)) toMenu();
  }
  if (e.code === 'KeyM') { sfx.toggle(); syncMenu(); toast('Sound ' + (sfx.on ? 'on' : 'off')); }
});
app.addEventListener('pointerdown', e => {
  if (e.target.closest('button, a, .panel')) return;
  if (G.state === 'play' || G.state === 'ready') { e.preventDefault(); flap(); }
  else if (G.state === 'title') titleClick(e);
});
function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
function titlePos() { return { x: app.classList.contains('portrait') ? W / 2 - 22 : W * .3 - 22, y: H * .36 }; }
function titleClick(e) {
  const p = toLogical(e), tp = titlePos(), T = G.title;
  const bob = RM ? 0 : Math.sin(G.t * 3) * 3;
  if (p.x < tp.x - 6 || p.x > tp.x + 50 || p.y < tp.y + bob - 6 || p.y > tp.y + bob + 50) return;
  sfx.ensure();
  const now = performance.now();
  T.clicks = now - T.lastClick < 900 ? T.clicks + 1 : 1;
  T.lastClick = now;
  T.squish = .12;
  if (T.clicks >= 5) { T.clicks = 0; T.wink = 1.4; sfx.hoot(); findEgg('wink'); }
  else sfx.chime();
}
// cursor: small dot, grows on things you can press
const cursor = $('#cursor');
window.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  cursor.classList.toggle('big', !!e.target.closest('button:not([disabled]), a'));
  cursor.classList.remove('gone');
}, { passive: true });
document.addEventListener('mouseleave', () => cursor.classList.add('gone'));

// ---------------------------------------------------------------- gameplay
function redBox() { return { x: G.camX + RX + 4, y: red.y + 5, w: RED_SIZE - 8, h: RED_SIZE - 8 }; }

function burst(x, y, n, colors, spread = 90, g = 160) {
  const k = RM ? Math.ceil(n / 3) : n;
  for (let i = 0; i < k; i++) {
    const a = Math.random() * Math.PI * 2, v = spread * (.3 + Math.random() * .7);
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g, life: .5 + Math.random() * .5, max: 1, c: colors[i % colors.length], s: Math.random() < .5 ? 2 : 1 });
  }
}

function hurt() {
  if (G.invuln > 0) return;
  if (G.shield) { G.shield = false; G.invuln = .9; sfx.chime(); burst(G.camX + RX + 11, red.y + 11, 14, [ACCENT, INK]); return; }
  G.hearts--;
  if (G.carry > 0) burst(G.camX + RX + 11, red.y + 11, 10, [BG, INK], 70);
  G.carry = 0; G.combo = 0; G.invuln = 1.4;
  if (!RM) G.shake = .3;
  sfx.hit();
  if (G.hearts <= 0) gameOver();
}

function deliver(m) {
  const mult = 1 + Math.min(4, G.combo) * .5;
  G.score += Math.round(G.carry * 100 * mult * (G.speedT > 0 ? 2 : 1));
  G.delivered += G.carry; G.carry = 0; G.combo++;
  m.got = true; m.done = true;
  burst(m.x + 8, GROUND - 32, 16, [ACCENT, INK, BG]);
  sfx.deliver();
}

function applyPower(kind) {
  G.merch.add(kind);
  if (kind === 'tumbler') G.speedT = 5;
  if (kind === 'badge') G.shield = true;
  if (kind === 'tote') G.cap = 3;
  sfx.power();
  if (G.merch.size === 3) findEgg('merch');
}

function update(dt) {
  G.t += dt;
  const T = G.title;
  if (T.wink > 0) T.wink -= dt;
  if (T.squish > 0) T.squish -= dt;

  // particles always move
  for (const p of G.parts) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  if (G.shake > 0) G.shake -= dt;

  if (G.state === 'title') { G.camX += 18 * dt; return; }
  if (G.state === 'ready') { red.y = H * .42 + (RM ? 0 : Math.sin(G.t * 4) * 4); return; }
  if (G.state === 'complete') { G.camX += 20 * dt; tickEnts(dt, false); return; }
  if (G.state === 'finale') { updateFinale(dt); return; }
  if (G.state !== 'play') return;

  const spd = G.speed * (G.speedT > 0 ? 1.5 : 1);
  G.camX += spd * dt;
  while (!G.endSpawned && G.nextX < G.camX + W + 90) spawnNext();

  red.vy = Math.min(MAXFALL, red.vy + GRAV * dt);
  red.y += red.vy * dt;
  if (red.flapT > 0) red.flapT -= dt;
  if (red.y < 0) { red.y = 0; red.vy = Math.max(0, red.vy); }
  if (red.y + RED_SIZE > GROUND) { red.y = GROUND - RED_SIZE; red.vy = -230; hurt(); }
  if (G.state !== 'play') return; // game over from the ground hit

  if (G.invuln > 0) G.invuln -= dt;
  if (G.speedT > 0) G.speedT -= dt;
  tickEnts(dt, true);
  G.ents = G.ents.filter(e => !e.dead && (e.x + (e.w || 60) + 80 > G.camX || e.type === 'final'));
}

function tickEnts(dt, live) {
  const rb = redBox(), rx = G.camX + RX + RED_SIZE / 2;
  for (const e of G.ents) {
    switch (e.type) {
      case 'gate':
        if (live && (overlap(rb, { x: e.x, y: -40, w: e.w, h: e.top + 40 }) || overlap(rb, { x: e.x, y: e.bot, w: e.w, h: GROUND - e.bot }))) hurt();
        break;
      case 'letter':
        e.t += dt;
        if (live && G.carry < G.cap && overlap(rb, { x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 })) {
          e.dead = true;
          if (e.gold) { G.score += 1000; burst(e.x + 5, e.y, 22, [P.y, ACCENT, INK]); sfx.egg(); }
          else { G.carry++; G.letters++; G.score += 10; sfx.pick(); burst(e.x + 5, e.y + 3, 6, [BG, INK], 50, 60); }
        }
        break;
      case 'mailbox':
        if (e.got) e.flag = Math.min(1, e.flag + dt * 5);
        if (!live || e.done) break;
        if (rx > e.x - 4 && rx < e.x + e.w + 8 && red.y + RED_SIZE > GROUND - 96 && G.carry > 0) deliver(e);
        else if (rx > e.x + e.w + 8) e.done = true;
        break;
      case 'power':
        e.t += dt;
        if (live && overlap(rb, { x: e.x - 3, y: e.y - 3, w: e.w + 6, h: e.h + 6 })) { e.dead = true; applyPower(e.kind); burst(e.x + 7, e.y + 7, 14, [ACCENT, INK, SAND]); }
        break;
      case 'ball':
        e.t += dt; e.x -= 34 * dt;
        e.y = e.y0 - Math.abs(Math.sin(e.t * 2.6 + e.ph)) * 70;
        if (live && overlap(rb, e)) hurt();
        break;
      case 'pigeon':
        e.t += dt; e.x -= 42 * dt;
        e.y = e.y0 + Math.sin(e.t * 2.4 + e.ph) * 18;
        if (live && overlap(rb, e)) hurt();
        break;
      case 'kite':
        e.t += dt; e.x -= 12 * dt;
        e.y = e.y0 + Math.sin(e.t * 1.3 + e.ph) * 32;
        if (live && overlap(rb, e)) hurt();
        break;
      case 'poster':
        if (e.flash > 0) e.flash -= dt;
        if (live && !e.hit && overlap(rb, e)) {
          e.hit = true; e.flash = .5; G.posters.add(e.id); sfx.chime();
          if (G.posters.size === 3) {
            findEgg('posters');
            G.ents.push({ type: 'letter', x: G.camX + W + 20, y: 110, w: 10, h: 7, t: 0, gold: true });
          }
        }
        break;
      case 'portrait': updatePortrait(e, dt, rb, live); break;
      case 'octo':
        e.t += dt;
        e.x += G.speed * .45 * dt;        // drifts along with Red for a while
        if (e.taken) { e.vy -= 60 * dt; e.y += e.vy * dt; if (e.y < -60) e.dead = true; }
        else {
          e.y += Math.sin(e.t * 2) * 10 * dt;
          if (live && overlap(rb, { x: e.x - 18, y: e.y + 20, w: 16, h: 9 })) {
            e.taken = true; G.painted = true; findEgg('vignette');
            burst(e.x - 10, e.y + 24, 30, [PAINT.trim, PAINT.pillar, PAINT.window, ACCENT], 120, 40);
          }
        }
        if (e.x - G.camX > W + 80 && e.t > 6) e.dead = true;
        break;
      case 'finish':
        if (live && !e.done && rx > e.x + 32) { e.done = true; levelComplete(); }
        break;
      case 'despo':
        if (e.x - G.camX < W) e.cheer += dt;
        break;
      case 'final':
        if (live && !G.finale && e.x - G.camX < RX + 230) startFinale(e);
        break;
    }
  }
}

function updatePortrait(e, dt, rb, live) {
  const sx = e.x - G.camX;
  if (e.state === 'far' && sx < W + 10) { e.state = 'assemble'; e.t = 0; }
  if (e.state === 'far') return;
  e.t += dt;
  if (e.state === 'assemble' || e.state === 'idle') {
    const k = RM ? 1 : clamp(e.t / 1.3, 0, 1), ease = 1 - Math.pow(1 - k, 3);
    const wob = e.state === 'idle' && !RM ? .4 : 0;
    for (const p of e.parts) { p.x = lerp(p.sx, p.hx, ease) + Math.sin(G.t * 2 + p.hy) * wob; p.y = lerp(p.sy, p.hy, ease); }
    if (k >= 1) e.state = 'idle';
    if (live && overlap(rb, { x: e.x, y: e.y, w: e.w, h: e.h })) {
      e.state = 'scatter'; e.t = 0;
      const cx = rb.x + rb.w / 2 - e.x, cy = rb.y + rb.h / 2 - e.y;
      for (const p of e.parts) {
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
        p.vx = dx / d * (60 + Math.random() * 120) + G.speed; p.vy = dy / d * (60 + Math.random() * 120);
      }
      findEgg('portrait'); sfx.chime();
    }
  } else if (e.state === 'scatter') {
    for (const p of e.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy = p.vy * .97 + 40 * dt; }
    if (e.t > 1.6) e.dead = true;
  }
}

function levelComplete() {
  G.state = 'complete';
  const bonus = G.hearts * 250;
  G.score += bonus;
  if (G.level === 1) {
    findEgg('desportivos');
    const d = G.ents.find(e => e.type === 'despo');
    burst(d ? d.x + 16 : G.camX + W / 2, GROUND - 50, 40, [ACCENT, INK, P.y, BG], 140);
  }
  sfx.deliver();
  levelBest[G.level] = Math.max(levelBest[G.level] || 0, G.score);
  store.set('levelBest', levelBest);
  unlocked = Math.max(unlocked, Math.min(3, G.level + 1));
  if (G.level === 1) unlocked = Math.max(unlocked, 2);
  store.set('unlocked', unlocked);
  setTimeout(() => {
    showResult(`Level ${G.level} complete`, G.def.name, [['Delivered', G.delivered], ['Lives bonus', bonus], ['Score', G.score]],
      G.level < 3 ? 'Next level' : 'Play again', () => startRun(G.level < 3 ? G.level + 1 : 3));
  }, 900);
}

function gameOver() {
  G.state = 'over';
  const stats = [['Delivered', G.delivered], ['Score', G.score]];
  let eyebrow = G.def.name;
  if (G.mode === 'endless') {
    if (G.score > best) { best = G.score; store.set('best', best); eyebrow = 'New best'; }
    stats.push(['Best', best]);
  }
  setTimeout(() => showResult('Red dropped the mail', eyebrow, stats, 'Try again', () => startRun(G.mode === 'endless' ? 'endless' : G.level)), 700);
}

function showResult(title, eyebrow, stats, primary, onPrimary) {
  hint.hidden = true;
  $('#resultTitle').textContent = title;
  $('#resultEyebrow').textContent = eyebrow;
  const dl = $('#resultStats'); dl.innerHTML = '';
  stats.forEach(([k, v]) => { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); });
  const btn = $('#resultPrimary');
  btn.textContent = primary;
  btn.onclick = onPrimary;
  show('result');
  focusFirst('#result');
}

// final delivery: Red slows, lands by the big mailbox, then the letter opens
function startFinale(e) { G.state = 'finale'; G.finale = { t: 0, said: false, box: e }; G.invuln = 0; G.speedT = 0; }
function updateFinale(dt) {
  const F = G.finale;
  F.t += dt;
  const k = clamp(1 - F.t / 1.6, 0, 1);
  G.camX += G.speed * k * dt;
  red.vy = 0;
  red.y = lerp(red.y, GROUND - 64, Math.min(1, dt * 3));
  if (F.t > 1.6 && !F.said) { F.said = true; sfx.hoot(); }
  if (F.t > 3.4 && !F.open) {
    F.open = true;
    G.score += G.hearts * 250;
    levelBest[3] = Math.max(levelBest[3] || 0, G.score);
    store.set('levelBest', levelBest);
    findEgg('delivered');
    openLetter();
  }
}
function openLetter() {
  G.state = 'letter';
  hud.hidden = true;
  $('#mailText').textContent = CONTACT.email;
  $('#tagline').textContent = CONTACT.line;
  $('#mailLink').href = 'mailto:' + CONTACT.email;
  const env = $('#envelope');
  env.classList.remove('open');
  show('letter');
  requestAnimationFrame(() => requestAnimationFrame(() => env.classList.add('open')));
}
$('#copyMail').addEventListener('click', e => {
  const btn = e.currentTarget;
  const done = () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy email'; }, 1600); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents($('#mailText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Email selected'; };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(CONTACT.email).then(done, fallback); else fallback();
});

// ---------------------------------------------------------------- drawing
function pal() { const t = THEMES[G.theme]; return G.painted ? { ...t, ...PAINT, stars: t.stars } : t; }
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function boxed(x, y, w, h, fill, line, lw = 2) { rect(x, y, w, h, line); rect(x + lw, y + lw, w - lw * 2, h - lw * 2, fill); }
function spr(img, x, y, s = 1) { ctx.drawImage(img, Math.round(x), Math.round(y), img.width * s, img.height * s); }
function layer(off, tileW, fn) { const start = Math.floor(off / tileW) - 1; for (let i = start; i * tileW - off < W + tileW; i++) fn(i, Math.round(i * tileW - off)); }
function coverImage(img, x, y, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const r = Math.max(w / iw, h / ih);
  const sw = w / r, sh = h / r;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}
function font(size, weight = 700, fam = '"Bricolage Grotesque", Figtree, system-ui, sans-serif') { ctx.font = `${weight} ${size}px ${fam}`; }

// sky: banded and dithered like an 8-bit gradient, cached per palette and size
let skyCache = { key: '', c: null };
function skyCanvas(p) {
  const key = p.sky.join() + W + 'x' + GROUND;
  if (skyCache.key === key) return skyCache.c;
  const c = document.createElement('canvas'); c.width = W; c.height = GROUND;
  const x = c.getContext('2d'), n = p.sky.length, bh = GROUND / n;
  for (let i = 0; i < n; i++) { x.fillStyle = p.sky[i]; x.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1); }
  for (let i = 1; i < n; i++) {
    const y0 = Math.floor(i * bh);
    x.fillStyle = p.sky[i];
    for (let y = y0 - 8; y < y0; y += 2) {
      const step = y < y0 - 4 ? 8 : 4;
      for (let xx = (y / 2) % 2 ? step / 2 : 0; xx < W; xx += step) x.fillRect(xx, y, 2, 2);
    }
    x.fillStyle = p.sky[i - 1];
    for (let y = y0; y < y0 + 4; y += 2) for (let xx = (y / 2) % 2 ? 4 : 0; xx < W; xx += 8) x.fillRect(xx, y, 2, 2);
  }
  skyCache = { key, c };
  return c;
}

function pixelDisc(cx, cy, r, color, stripes) {
  for (let dy = -r; dy <= r; dy += 2) {
    if (stripes && dy > 0 && (dy % 8) < 2 + dy / 7) continue; // retro sunset cuts
    const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)) / 2) * 2;
    rect(cx - hw, cy + dy, hw * 2, 2, color);
  }
}

const hillH = (wx, seed, amp, base) => Math.round((base + amp * (Math.sin(wx * .009 + seed) * .55 + Math.sin(wx * .023 + seed * 2) * .3 + Math.sin(wx * .051 + seed * 3) * .15)) / 3) * 3;
function drawHills(off, color, seed, amp, base, wall) {
  for (let x = -(off % 3); x < W; x += 3) {
    const wx = x + off, h = hillH(wx, seed, amp, base);
    rect(x, GROUND - h, 3, h, color);
    if (wall) {
      // fort walls along some ridges, Nahargarh style
      const zone = Math.floor(wx / 260), local = ((wx % 260) + 260) % 260;
      if (hash(zone * 5.1 + seed) > .5 && local > 40 && local < 170) {
        rect(x, GROUND - h - 5, 3, 5, wall);
        if (Math.floor(wx / 3) % 2 === 0) rect(x, GROUND - h - 8, 3, 3, wall);
        if (local > 40 && local < 52) rect(x, GROUND - h - 14, 3, 14, wall);
      }
    }
  }
}

function chhatri(x, y, p) {
  rect(x - 1, y - 2, 16, 2, p.bldDark);
  rect(x + 1, y - 8, 2, 6, p.bld); rect(x + 6, y - 8, 2, 6, p.bld); rect(x + 11, y - 8, 2, 6, p.bld);
  rect(x - 1, y - 10, 16, 2, p.bldDark);
  rect(x + 1, y - 13, 12, 3, p.roof); rect(x + 3, y - 16, 8, 3, p.roof); rect(x + 5, y - 18, 4, 2, p.roof);
  rect(x + 6, y - 21, 2, 3, p.bldDark);
}

function drawBuildings(p, cam) {
  layer(Math.floor(cam * .32), 124, (i, x) => {
    const r = hash(i * 3.1), w = 84 + Math.floor(hash(i * 7.7) * 28), h = 44 + Math.floor(r * 40), y = GROUND - h;
    rect(x, y, w, h, p.bld);
    rect(x - 2, y, w + 4, 3, p.bldDark);
    rect(x, y + 5, w, 1, p.bldDark);
    // jharokha windows
    for (let wy = y + 10; wy < GROUND - 26; wy += 15) for (let wx = x + 7; wx < x + w - 10; wx += 12) {
      rect(wx, wy + 2, 6, 8, p.bldWin); rect(wx + 1, wy, 4, 2, p.bldWin); rect(wx - 1, wy + 10, 8, 2, p.bldDark);
    }
    // arcade along the ground floor
    for (let a = x + 4; a < x + w - 9; a += 12) { rect(a, GROUND - 12, 8, 12, p.bldDark); rect(a + 1, GROUND - 14, 6, 2, p.bldDark); }
    if (r > .4) { chhatri(x + 6, y, p); chhatri(x + w - 20, y, p); }
    if (r > .75) {
      const cx = x + w / 2;
      rect(cx - 12, y - 6, 24, 6, p.bldDark);
      pixelDisc(cx, y - 14, 12, p.roof);
      rect(cx - 1, y - 30, 2, 5, p.bldDark);
    }
  });
}

function drawTrees(p, cam) {
  layer(Math.floor(cam * .62), 74, (i, x) => {
    const r = hash(i * 5.3);
    if (r > .35) {
      const s = r > .8 ? 1.25 : 1, b = GROUND;
      rect(x + 18, b - 22 * s, 4, 22 * s, p.trunk);
      rect(x + 5, b - 46 * s, 30, 8 * s, p.tree);
      rect(x, b - 40 * s, 40, 12 * s, p.tree);
      rect(x + 3, b - 30 * s, 34, 6 * s, p.treeDark);
      for (let d = 0; d < 36; d += 4) rect(x + 2 + d, b - 31 * s, 2, 2, p.tree);
      rect(x + 10, b - 50 * s, 18, 4 * s, p.tree);
    } else if (r > .18) {
      rect(x + 30, GROUND - 40, 2, 40, G.theme === 'dusk' ? '#3a2026' : '#6d6a63');
      rect(x + 26, GROUND - 42, 10, 3, G.theme === 'dusk' ? '#3a2026' : '#6d6a63');
      rect(x + 27, GROUND - 39, 8, 2, G.theme === 'dusk' ? p.window : p.accent);
    }
  });
}

function drawStands(p, cam) {
  layer(Math.floor(cam * .34), 150, (i, x) => {
    const tiers = 4, top = GROUND - 14 - tiers * 9;
    rect(x, top - 8, 142, 3, p.standDark);                      // roof
    rect(x + 4, top - 5, 2, 6, p.standDark); rect(x + 136, top - 5, 2, 6, p.standDark);
    for (let t = 0; t < tiers; t++) {
      const ty = top + t * 9;
      rect(x, ty, 142, 9, p.stand); rect(x, ty + 8, 142, 1, p.standDark);
      for (let c = 2; c < 140; c += 4) {
        const k = hash(i * 131 + t * 17 + c);
        if (k < .18) continue;
        const bob = !RM && Math.sin(G.t * 7 + c + t * 3) > .75 ? 1 : 0;
        rect(x + c, ty + 3 - bob, 2, 4, p.crowd[Math.floor(k * 97) % p.crowd.length]);
      }
    }
    rect(x, GROUND - 14, 142, 14, p.standDark);
    if (hash(i * 2.9) > .45) {
      // floodlight
      const fx = x + 146;
      rect(fx, GROUND - 130, 2, 130, p.standDark);
      rect(fx - 7, GROUND - 140, 16, 10, p.standDark);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) rect(fx - 6 + a * 5, GROUND - 139 + b * 4, 3, 3, G.theme === 'dusk' ? p.window : '#fff8e8');
    }
  });
}

function drawAdBoards(p, cam) {
  const ads = [["DESPORTIVOS '26", ACCENT, BG], ['LNMIIT JAIPUR', INK, BG], ['ODE', BG, INK], ['FLY WITH RED', ACCENT_INK, BG]];
  font(6, 700);
  layer(Math.floor(cam * .8), 72, (i, x) => {
    const [txt, bg, fg] = ads[((i % 4) + 4) % 4];
    rect(x, GROUND - 11, 70, 11, G.painted ? p.standDark : bg);
    rect(x, GROUND - 11, 70, 1, INK);
    ctx.fillStyle = G.painted ? p.line : fg; ctx.fillText(txt, x + 4, GROUND - 3);
  });
}

// a lit billboard on steel legs, used for the wall posters and the egg posters
function billboard(x, y, w, h, img, name, fallback, small) {
  const lit = G.theme === 'dusk' && !G.painted;
  const legTop = y + h + (small ? 8 : 12), legH = GROUND - legTop;
  rect(x + 8, legTop, 3, legH, INK); rect(x + w - 11, legTop, 3, legH, INK);
  rect(x + 8, legTop + Math.floor(legH / 2), w - 16, 2, INK);
  boxed(x + 3, y + h + 2, w - 6, small ? 7 : 10, INK, INK);
  font(small ? 4.5 : 6, 700); ctx.fillStyle = BG; ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), x + w / 2, y + h + (small ? 7.4 : 9.5), w - 8); ctx.textAlign = 'left';
  const arm = small ? 6 : 10;
  rect(x + 10, y - 8, 2, 6, INK); rect(x + w - 12, y - 8, 2, 6, INK);
  rect(x + 7, y - 10, arm, 3, INK); rect(x + w - 7 - arm, y - 10, arm, 3, INK);
  rect(x + 8, y - 7, arm - 2, 1, P.y); rect(x + w - 6 - arm, y - 7, arm - 2, 1, P.y);
  ctx.globalAlpha = lit ? .24 : .12; ctx.fillStyle = P.y;
  ctx.beginPath(); ctx.moveTo(x + 7, y - 7); ctx.lineTo(x + w - 7, y - 7); ctx.lineTo(x + w + 4, y + h); ctx.lineTo(x - 4, y + h); ctx.fill();
  ctx.globalAlpha = 1;
  boxed(x - 3, y - 3, w + 6, h + 6, BG, INK, small ? 2 : 3);
  ctx.imageSmoothingEnabled = true;
  if (img) coverImage(img, x, y, w, h);
  else {
    rect(x, y, w, h, fallback);
    font(small ? 6 : 9); ctx.fillStyle = fallback === SAND ? INK : BG; ctx.textAlign = 'center';
    name.split(' ').forEach((wd, n) => ctx.fillText(wd, x + w / 2, y + h * .35 + n * (small ? 7 : 11), w - 4));
    ctx.textAlign = 'left';
  }
  ctx.imageSmoothingEnabled = false;
  if (lit) { ctx.globalAlpha = .12; rect(x, y, w, h, '#2e1a28'); ctx.globalAlpha = 1; }
}

function drawWallPosters(cam, k) {
  layer(Math.floor(cam * k), 210, (i, x) => {
    if (hash(i * 6.7 + 2) < .25) return;
    const seq = G.posterSeq, idx = seq[((i % seq.length) + seq.length) % seq.length], wp = WALL_POSTERS[idx];
    const h = 50, w = 40, y = GROUND - 96 - Math.floor(hash(i * 1.9) * 14);
    billboard(x + 60, y, w, h, images['wall' + idx], wp.name, [INK, ACCENT, SAND][idx % 3], true);
  });
}

function drawBackground(p) {
  const cam = G.camX;
  ctx.drawImage(skyCanvas(p), 0, 0);

  if (p.stars) {
    for (let i = 0; i < 46; i++) {
      const sx = ((hash(i) * W * 1.3 - cam * .02) % W + W) % W, sy = hash(i + 50) * GROUND * .4;
      if (RM || Math.sin(G.t * 2 + i * 1.7) > -.4) rect(sx, sy, hash(i + 9) > .85 ? 2 : 1, 1, '#fff3e0');
    }
  }
  if (p.sunset) pixelDisc(Math.round(W * .7), GROUND - 52, 40, p.sun, true);
  else pixelDisc(Math.round(W * .8), 44, 12, p.sun);

  // drifting clouds
  layer(Math.floor(cam * .05 + (RM ? 0 : G.t * 3)), 150, (i, x) => {
    const r = hash(i * 2.3);
    if (r < .35) return;
    const y = 16 + Math.floor(hash(i * 4.1) * GROUND * .25), w = 26 + Math.floor(r * 34);
    rect(x + 8, y, w - 16, 4, p.cloud); rect(x + 2, y + 4, w - 4, 4, p.cloud);
    rect(x, y + 8, w, 4, p.cloud); rect(x + 2, y + 12, w - 4, 2, p.cloudShade);
  });

  // Aravalli hills, far and near
  drawHills(Math.floor(cam * .1), p.hill1, 1.3, 26, 70, p.wall);
  drawHills(Math.floor(cam * .18), p.hill2, 4.1, 16, 40, null);

  if (G.theme === 'grounds') { drawStands(p, cam); drawWallPosters(cam, .5); drawAdBoards(p, cam); }
  else { drawBuildings(p, cam); drawWallPosters(cam, .48); drawTrees(p, cam); }

  // ground
  if (G.theme === 'grounds') {
    const off = Math.floor(cam) % 48;
    for (let x = -off; x < W; x += 48) { rect(x, GROUND, 24, H - GROUND, p.grass); rect(x + 24, GROUND, 24, H - GROUND, p.grass2); }
    rect(0, GROUND + 5, W, 1, p.chalk);
  } else {
    rect(0, GROUND, W, H - GROUND, p.soil);
    rect(0, GROUND, W, 5, p.grass);
    const off = Math.floor(cam) % 14;
    for (let x = -off; x < W; x += 14) { rect(x, GROUND - 2, 2, 2, p.grass2); rect(x + 6, GROUND - 1, 2, 1, p.grass); }
    const off2 = Math.floor(cam) % 16;
    for (let y = GROUND + 9, row = 0; y < H; y += 6, row++) for (let x = -off2 + (row % 2) * 8; x < W; x += 16) rect(x, y, 1, 5, p.chalk);
  }
  rect(0, GROUND, W, 2, p.line);
}

function drawGate(e, p) {
  const x = e.x - G.camX;
  if (x > W || x + e.w < 0) return;
  const line = G.theme === 'dusk' && !G.painted ? '#000' : p.line;
  if (G.theme === 'grounds') {
    // striped barrier poles
    for (const [y0, h] of [[-4, e.top + 4], [e.bot, GROUND - e.bot]]) {
      boxed(x, y0, e.w, h, p.pillar, line);
      for (let y = y0 + 6; y < y0 + h - 4; y += 14) rect(x + 2, y, e.w - 4, 5, p.trim);
    }
    boxed(x - 4, e.top - 8, e.w + 8, 8, p.trim, line);
    boxed(x - 4, e.bot, e.w + 8, 8, p.trim, line);
  } else {
    for (const [y0, h] of [[-4, e.top + 4], [e.bot, GROUND - e.bot]]) {
      boxed(x, y0, e.w, h, p.pillar, line);
      for (let y = y0 + 8; y < y0 + h - 8; y += 10) for (let wx = x + 6; wx < x + e.w - 6; wx += 8) rect(wx, y, 4, 5, p.window);
    }
    boxed(x - 3, e.top - 6, e.w + 6, 6, p.trim, line);
    boxed(x - 3, e.bot, e.w + 6, 6, p.trim, line);
  }
}

function drawMailbox(e, p, big = false) {
  const s = big ? 2 : 1, x = e.x - G.camX;
  if (x > W + 40 || x + 40 < 0) return;
  const top = GROUND - 30 * s;
  rect(x + 6 * s, top + 10 * s, 3 * s, 20 * s, INK);
  boxed(x, top, 16 * s, 12 * s, ACCENT, INK, 2);
  rect(x + 3 * s, top + 4 * s, 10 * s, 2 * s, INK);
  // flag: down when empty, up when delivered
  const up = e.flag || 0;
  rect(x + 16 * s, top + lerp(8, 0, up) * s, 2 * s, 8 * s, INK);
  rect(x + 18 * s, top + lerp(8, 0, up) * s, 6 * s, 4 * s, up > .5 ? ACCENT : INK);
  if (!big && !e.done && G.carry > 0 && G.state === 'play') {
    ctx.globalAlpha = .55;
    for (let y = GROUND - 96; y < top - 4; y += 8) rect(x + 7, y, 2, 4, p.accent);
    ctx.globalAlpha = 1;
    const b = RM ? 0 : Math.abs(Math.sin(G.t * 5)) * 3;
    rect(x + 4, top - 12 + b, 8, 2, p.accent); rect(x + 6, top - 10 + b, 4, 2, p.accent);
  }
}

function drawEntity(e, p) {
  const x = e.x - G.camX;
  switch (e.type) {
    case 'gate': drawGate(e, p); break;
    case 'mailbox': drawMailbox(e, p); break;
    case 'final': drawMailbox({ x: e.x, flag: G.finale && G.finale.t > 2.6 ? 1 : 0 }, p, true); break;
    case 'letter': {
      const b = RM ? 0 : Math.sin(e.t * 3) * 2;
      if (e.gold) { ctx.globalAlpha = .4; rect(x - 3, e.y - 3 + b, 16, 13, P.y); ctx.globalAlpha = 1; }
      spr(e.gold ? SPR.gold : SPR.letter, x, e.y + b);
      break;
    }
    case 'power': {
      const b = RM ? 0 : Math.sin(e.t * 4) * 2;
      ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x + 7, e.y + 7 + b, 10 + (RM ? 0 : Math.sin(e.t * 6)), 0, Math.PI * 2); ctx.stroke();
      spr(SPR[e.kind], x + 2, e.y + 2 + b);
      break;
    }
    case 'ball': spr(SPR.ball, x, e.y); break;
    case 'pigeon': {
      const up = Math.floor(e.t * 8) % 2;
      boxed(x + 2, e.y + 2, 10, 6, P.g, INK, 1);
      boxed(x, e.y, 5, 5, P.g, INK, 1);
      rect(x - 2, e.y + 2, 2, 1, ACCENT);
      rect(x + 6, up ? e.y - 3 : e.y + 6, 5, 3, P.G);
      break;
    }
    case 'kite': {
      spr(SPR.kite, x, e.y);
      for (let i = 1; i < 5; i++) rect(x + 4 + i * 4, e.y + 8 + i * 3 + Math.sin(e.t * 4 + i) * 2, 2, 2, i % 2 ? INK : ACCENT);
      break;
    }
    case 'poster': {
      if (x > W + 20 || x + e.w < -20) break;
      billboard(x, e.y, e.w, e.h, images['poster' + e.id], POSTER_NAMES[e.id], [ACCENT, SAND, INK][e.id], false);
      if (e.flash > 0) { ctx.globalAlpha = e.flash; rect(x, e.y, e.w, e.h, BG); ctx.globalAlpha = 1; }
      if (e.hit) { boxed(x + e.w - 6, e.y - 8, 12, 12, ACCENT, INK, 2); rect(x + e.w - 3, e.y - 3, 2, 2, BG); rect(x + e.w - 1, e.y - 5, 2, 2, BG); }
      break;
    }
    case 'portrait': {
      if (e.state === 'far') break;
      const fade = e.state === 'scatter' ? clamp(1 - e.t / 1.6, 0, 1) : 1;
      ctx.fillStyle = G.painted ? PAINT.pillar : INK;
      for (const pt of e.parts) { ctx.globalAlpha = pt.a * fade; ctx.fillRect(x + pt.x, e.y + pt.y, 1.6, 1.6); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'octo': {
      const img = images.vignette;
      if (img) { const h = 36, w = (img.naturalWidth || img.width) * h / (img.naturalHeight || img.height); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, x, e.y, w, h);; ctx.imageSmoothingEnabled = false; }
      else spr(SPR.octo, x, e.y + 4, 3);
      if (!e.taken) {
        // the paintbrush it holds out
        const bx = x - 18, by = e.y + 22, hue = Math.floor(e.t * 3) % 4;
        rect(bx + 6, by + 2, 12, 3, '#c79a5b'); rect(bx + 3, by + 1, 4, 5, INK);
        rect(bx, by + 1, 4, 5, [PAINT.trim, ACCENT, PAINT.pillar, P.y][hue]);
      }
      break;
    }
    case 'finish': {
      if (x > W + 10) break;
      rect(x, GROUND - 92, 4, 92, INK); rect(x + e.w - 4, GROUND - 92, 4, 92, INK);
      boxed(x - 4, GROUND - 106, e.w + 8, 18, ACCENT, INK);
      font(10); ctx.fillStyle = BG; ctx.textAlign = 'center'; ctx.fillText('FINISH', x + e.w / 2, GROUND - 93); ctx.textAlign = 'left';
      for (let i = 0; i < 8; i++) rect(x + 4 + i * 7, GROUND - 88, 4, 6, i % 2 ? INK : ACCENT);
      break;
    }
    case 'despo': {
      if (x > W + 40) break;
      const hop = e.cheer > 0 && !RM ? Math.abs(Math.sin(e.cheer * 9)) * 10 : 0;
      const img = images.despo;
      if (img) { const h = 52, w = (img.naturalWidth || img.width) * h / (img.naturalHeight || img.height); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, x, GROUND - h - hop, w, h);; ctx.imageSmoothingEnabled = false; }
      else spr(SPR.despo, x, GROUND - 32 - hop, 4);
      if (e.cheer > 0) { font(12); ctx.fillStyle = ACCENT; ctx.fillText('!!', x + 6, GROUND - 60 - hop); }
      break;
    }
  }
}

function drawRed(x, y, s, frame, tilt) {
  ctx.save();
  ctx.translate(Math.round(x + 5.5 * s), Math.round(y + 5.5 * s));
  if (tilt) ctx.rotate(tilt);
  ctx.drawImage(frame, -5.5 * s, -5.5 * s, 11 * s, 11 * s);
  ctx.restore();
}

function bubble(x, y, text) {
  font(10);
  const w = ctx.measureText(text).width + 14, h = 18;
  const bx = Math.round(clamp(x - w / 2, 4, W - w - 4)), by = Math.round(y - h);
  boxed(bx, by, w, h, BG, INK, 2);
  rect(x - 3, by + h - 2, 6, 3, BG); rect(x - 1, by + h, 2, 3, INK);
  ctx.fillStyle = INK; ctx.fillText(text, bx + 7, by + 13);
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const sh = G.shake > 0 ? G.shake * 10 : 0;
  ctx.setTransform(scale, 0, 0, scale, (Math.random() - .5) * sh * scale, (Math.random() - .5) * sh * scale);
  ctx.textBaseline = 'alphabetic';

  const p = pal();
  drawBackground(p);

  if (G.state === 'title' || G.state === 'loading') {
    const tp = titlePos(), T = G.title;
    const bob = RM ? 0 : Math.sin(G.t * 3) * 3;
    const sq = T.squish > 0 ? 2 : 0;
    rect(tp.x + 6, GROUND - 2, 32, 2, p.standDark);
    const frame = T.wink > 0 ? SPR.redWink : (Math.floor(G.t * 2) % 6 === 0 && !RM ? SPR.redUp : SPR.red);
    ctx.drawImage(frame, Math.round(tp.x - sq), Math.round(tp.y + bob + sq * 2), 44 + sq * 2, 44 - sq * 2);
    if (T.wink > 0) { font(16); ctx.fillStyle = INK; ctx.fillText(';)', tp.x + 48, tp.y + bob + 6); }
  } else {
    const back = [], front = [];
    for (const e of G.ents) (['poster', 'mailbox', 'finish', 'despo', 'final', 'portrait'].includes(e.type) ? back : front).push(e);
    back.forEach(e => drawEntity(e, p));
    front.forEach(e => drawEntity(e, p));

    // Red
    const visible = !(G.invuln > 0 && Math.floor(G.t * 14) % 2);
    if (G.speedT > 0 && !RM) for (let i = 3; i > 0; i--) { ctx.globalAlpha = .12 * i; drawRed(RX - i * 7, red.y, RED_SCALE, SPR.red, 0); }
    ctx.globalAlpha = 1;
    if (visible) {
      const tilt = G.state === 'play' ? clamp(red.vy / 700, -.35, .45) : 0;
      drawRed(RX, red.y, RED_SCALE, red.flapT > 0 ? SPR.redUp : SPR.red, tilt);
    }
    if (G.shield) { ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(RX + 11, red.y + 11, 16, 0, Math.PI * 2); ctx.stroke(); }
    // letters Red is carrying dangle below
    for (let i = 0; i < G.carry; i++) spr(SPR.letter, RX + 6 + i * 3, red.y + RED_SIZE - 2 + i * 2);

    if (G.finale && G.finale.said) bubble(RX + 11, red.y - 4, "I'll deliver it.");
  }

  for (const q of G.parts) { ctx.globalAlpha = clamp(q.life * 2, 0, 1); rect(q.x - G.camX, q.y, q.s, q.s, q.c); }
  ctx.globalAlpha = 1;

  if (G.sketch) sketchPass();
}

// sketch mode: edge-detect the frame into pencil lines on lined paper
function sketchPass() {
  const w = W, h = H;
  if (!skOut || skOut.width !== w || skOut.height !== h) {
    skOut = skx.createImageData(w, h); lumBuf = new Float32Array(w * h);
    noise = new Uint8Array(w * h + 8000); for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 4;
  }
  skx.imageSmoothingEnabled = true;
  skx.drawImage(cv, 0, 0, w, h);
  const src = skx.getImageData(0, 0, w, h).data, out = skOut.data, L = lumBuf;
  for (let i = 0, j = 0; i < L.length; i++, j += 4) L[i] = (src[j] * .3 + src[j + 1] * .59 + src[j + 2] * .11) / 255;
  const boil = RM ? 0 : (Math.floor(G.t * 7) % 7) * 997;
  for (let y = 0; y < h; y++) {
    const rule = y % 18 === 17, margin = 28;
    for (let x = 0; x < w; x++) {
      const i = y * w + x, k = i * 4;
      let v = 1;
      if (x > 1 && x < w - 2 && y > 1 && y < h - 2) {
        const n = noise[i + boil], ox = n & 1 ? 1 : 0, oy = n & 2 ? w : 0;
        const e = Math.abs(L[i + 1 + oy] - L[i - 1 + oy]) + Math.abs(L[i + w + ox] - L[i - w + ox]);
        v = 1 - Math.min(1, e * 2.4);
        const l = L[i];
        if (l < .5 && (x + y + (n & 1)) % 4 === 0) v -= .3;
        if (l < .25 && (x - y + 400) % 4 === 0) v -= .25;
      }
      let r = 247, g = 244, b = 236;
      if (rule) { r = 214; g = 226; b = 240; }
      if (x === margin) { r = 240; g = 190; b = 180; }
      v = clamp(v, 0, 1);
      out[k] = 52 + (r - 52) * v; out[k + 1] = 50 + (g - 50) * v; out[k + 2] = 58 + (b - 58) * v; out[k + 3] = 255;
    }
  }
  skx.putImageData(skOut, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sk, 0, 0, cv.width, cv.height);
}

// ---------------------------------------------------------------- hud
let hudCache = {};
function syncHud() {
  if (hud.hidden) return;
  const set = (k, v, fn) => { if (hudCache[k] !== v) { hudCache[k] = v; fn(v); } };
  set('score', G.score, v => { $('#score').textContent = v; });
  set('combo', G.combo, v => { $('#combo').textContent = v > 0 ? '×' + (1 + Math.min(4, v) * .5) : ''; });
  set('hearts', G.hearts, v => { $('#hearts').innerHTML = [0, 1, 2].map(i => `<i class="heart${i < v ? '' : ' off'}"></i>`).join(''); });
  set('carry', G.carry + '/' + G.cap, () => { $('#carry').innerHTML = Array.from({ length: G.cap }, (_, i) => `<i class="env${i < G.carry ? '' : ' off'}"></i>`).join(''); });
  const pw = [G.speedT > 0 ? 'Tumbler ' + Math.ceil(G.speedT) + 's' : '', G.shield ? 'Badge' : '', G.cap > 1 ? 'Tote' : ''].filter(Boolean).join('|');
  set('powers', pw, v => { $('#powers').innerHTML = v ? v.split('|').map(s => `<span class="pow">${s}</span>`).join('') : ''; });
  const prog = G.mode === 'endless' ? 1 : clamp(G.camX / G.totalX, 0, 1);
  set('prog', Math.round(prog * 100), v => { $('#progBar').style.width = v + '%'; });
}

// ---------------------------------------------------------------- loop
let last = performance.now(), acc = 0;
const STEP = 1 / 120;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  if (G.state !== 'paused') {
    acc += dt;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
  } else acc = 0;
  render();
  syncHud();
  requestAnimationFrame(frame);
}

function thumb(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  const iw = img.naturalWidth, ih = img.naturalHeight, r = Math.max(w / iw, h / ih);
  x.drawImage(img, (iw - w / r) / 2, (ih - h / r) / 2, w / r, h / r, 0, 0, w, h);
  return c;
}
function loadWallPosters() {
  WALL_POSTERS.forEach((wp, i) => {
    const im = new Image();
    im.onload = () => { try { images['wall' + i] = thumb(im, 160, 200); } catch (e) { images['wall' + i] = im; } };
    im.src = wp.src;
  });
}

// ---------------------------------------------------------------- boot
function loadAll() {
  const keys = Object.keys(ASSETS);
  let done = 0;
  const bar = $('#loadBar');
  const tick = () => { done++; bar.style.width = Math.round(done / (keys.length + 1) * 100) + '%'; };
  const imgs = keys.map(k => new Promise(res => {
    const im = new Image();
    im.onload = () => { images[k] = im; tick(); res(); };
    im.onerror = () => { images[k] = null; tick(); res(); };
    im.src = ASSETS[k];
  }));
  const fonts = document.fonts && document.fonts.load
    ? Promise.race([Promise.all([document.fonts.load('700 20px "Bricolage Grotesque"'), document.fonts.load('600 16px Figtree')]), new Promise(r => setTimeout(r, 2500))])
    : Promise.resolve();
  const minWait = new Promise(r => setTimeout(r, RM ? 300 : 1600));
  return Promise.all([...imgs, fonts.then(tick, tick), minWait]);
}

resize();
shufflePosters();
bindScramble(document);
syncMenu();
requestAnimationFrame(frame);
loadAll().then(() => {
  buildPortrait();
  for (let i = 0; i < 3; i++) if (images['poster' + i]) { try { images['poster' + i] = thumb(images['poster' + i], 224, 312); } catch (e) { /* keep original */ } }
  try {
    if (images.vignette) images.vignette = thumb(images.vignette, 200, Math.round(200 * images.vignette.naturalHeight / images.vignette.naturalWidth));
    if (images.despo) images.despo = thumb(images.despo, 140, Math.round(140 * images.despo.naturalHeight / images.despo.naturalWidth));
  } catch (e) { /* keep originals */ }
  loadWallPosters();
  G.state = 'title';
  toMenu();
  // a little hello for anyone opening devtools
  console.log('%c Red %c is on the way. Ideas start on paper.', 'background:#ff4a1c;color:#fbfbf9;font-weight:700;padding:2px 6px', 'color:#111');
});

})();
