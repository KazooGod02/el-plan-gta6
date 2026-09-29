// Side-view prop painters. Each painter draws with its bottom-left at (x, y).
import { shade } from '../core/gfx.js';
import * as font from '../core/font.js';

const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };

// width of each prop (for cover/interaction ranges)
export const PROP_W = {
  bed: 40, tv: 20, table: 28, chair: 10, sofa: 36, fridge: 16, stove: 18, counter: 48, trompo: 14, shelf: 32, register: 14,
  arcade: 16, bar: 64, stool: 8, bottles: 40, pool: 44, jukebox: 16, safe: 18, vault: 44, desk: 30, computer: 12, plant: 10,
  crate: 18, crates: 30, barrel: 12, carside: 60, tsuruside: 60, toolwall: 40, workbench: 36, locker: 14, camera: 10, alarm: 8, teller: 40,
  rope: 30, bench: 30, poster: 16, window: 28, door: 20, whiteboard: 60, mirror: 16, rack: 30, masks: 40, target: 12, gunrack: 30,
  bars: 60, showcase: 30, forklift: 36, boxes: 34, drill: 20, money: 30, bag: 12, lamp: 8, fan: 20, calendar: 12, wanted: 14,
  lava: 6, trophy: 8, cuadro: 16, pato: 14, disco: 10, pan: 14, kazooGold: 10, cartel: 60, stairs: 24, ladder: 12, sign: 40,
  tree: 60, fence: 40, bush: 16, moon: 20, skyline: 320, ac: 16, antenna: 10, clothes: 30, tank: 14, lightpole: 8, cones: 20,
  cell: 50, sink: 16, toilet: 12, wc: 12, papel: 20, atm: 14, flag: 10, doorOpen: 20, hole: 20, shovel: 6, cooler: 16, fire: 16,
  bigtree: 70, grassfg: 320, tv2: 20, radio: 12, microwave: 14, fan2: 8,
};

export function drawProp(c, p, x, y, t, env = {}) {
  const f = PAINT[p.t];
  if (f) f(c, Math.round(x), Math.round(y), p, t, env);
}

const PAINT = {
  bed(c, x, y, o) {
    R(c, x, y - 14, 40, 10, '#5a3218'); R(c, x, y - 4, 3, 4, '#3a2010'); R(c, x + 37, y - 4, 3, 4, '#3a2010');
    R(c, x + 1, y - 17, 38, 5, o.col || '#3c64dc'); R(c, x + 1, y - 17, 38, 1, shade(o.col || '#3c64dc', 1.3));
    R(c, x + 30, y - 20, 9, 4, '#f4f4f0'); R(c, x - 1, y - 26, 4, 22, '#5a3218');
    if (o.messy) { R(c, x + 8, y - 19, 10, 3, shade(o.col || '#3c64dc', 0.8)); R(c, x + 20, y - 18, 3, 2, '#e0a82e'); }
  },
  tv(c, x, y, o, t) {
    R(c, x + 2, y - 10, 16, 10, '#3a2a1a');
    R(c, x, y - 26, 20, 16, '#2a2a30'); R(c, x + 2, y - 24, 14, 12, o.off ? '#101018' : ['#3c64dc', '#46b450', '#d8323c', '#ffd23f'][Math.floor(t * 3) % 4]);
    R(c, x + 17, y - 22, 2, 2, '#888'); R(c, x + 17, y - 18, 2, 2, '#888'); R(c, x + 6, y - 30, 1, 4, '#888'); R(c, x + 12, y - 31, 1, 5, '#888');
    if (!o.off) R(c, x + 3, y - 23, 4, 1, 'rgba(255,255,255,0.5)');
  },
  tv2(c, x, y, o, t) { // wall mounted TV showing the teaser
    R(c, x, y, 22, 14, '#1a1a1e'); R(c, x + 1, y + 1, 20, 12, '#0a0a14');
    const f = Math.floor(t * 2) % 6;
    if (f < 2) { R(c, x + 3, y + 8, 3, 4, '#e0a82e'); R(c, x + 8, y + 8, 3, 4, '#3c64dc'); R(c, x + 13, y + 8, 3, 4, '#b8323c'); }
    else if (f < 4) { R(c, x + 2, y + 2, 18, 10, Math.floor(t * 8) % 2 ? '#d8323c' : '#2850e0'); }
    else { font.text(c, 'VI', x + 11, y + 3, '#ff3cc8', { align: 'center' }); }
  },
  table(c, x, y, o) { R(c, x, y - 14, o.w || 28, 3, o.col || '#8c5a32'); R(c, x + 2, y - 11, 2, 11, shade(o.col || '#8c5a32', 0.7)); R(c, x + (o.w || 28) - 4, y - 11, 2, 11, shade(o.col || '#8c5a32', 0.7)); if (o.cloth) R(c, x, y - 14, o.w || 28, 5, o.cloth); },
  chair(c, x, y, o) { R(c, x, y - 9, 10, 2, o.col || '#6a4a2a'); R(c, x, y - 7, 2, 7, '#4a3018'); R(c, x + 8, y - 7, 2, 7, '#4a3018'); R(c, x + (o.flip ? 8 : 0), y - 20, 2, 11, '#4a3018'); },
  sofa(c, x, y, o) { const col = o.col || '#8c46c8'; R(c, x, y - 16, 36, 12, col); R(c, x, y - 22, 36, 7, shade(col, 0.8)); R(c, x - 2, y - 18, 5, 14, shade(col, 0.7)); R(c, x + 33, y - 18, 5, 14, shade(col, 0.7)); R(c, x + 2, y - 4, 3, 4, '#2a1a10'); R(c, x + 31, y - 4, 3, 4, '#2a1a10'); if (o.stain) R(c, x + 14, y - 14, 6, 3, '#6a5a2a'); },
  fridge(c, x, y) { R(c, x, y - 36, 16, 36, '#e8e8ec'); R(c, x, y - 24, 16, 1, '#b0b0b8'); R(c, x + 13, y - 32, 1, 6, '#888'); R(c, x + 13, y - 20, 1, 8, '#888'); R(c, x + 3, y - 34, 3, 3, '#ffd23f'); R(c, x + 7, y - 33, 3, 3, '#d8323c'); },
  stove(c, x, y, o, t) { R(c, x, y - 16, 18, 16, '#b0b0b8'); R(c, x, y - 17, 18, 2, '#3a3a44'); R(c, x + 2, y - 12, 14, 8, '#3a3a44'); if (o.on) { R(c, x + 3, y - 19, 4, 2, Math.floor(t * 8) % 2 ? '#f08c28' : '#ffd23f'); R(c, x + 11, y - 19, 4, 2, Math.floor(t * 8 + 1) % 2 ? '#f08c28' : '#ffd23f'); } },
  counter(c, x, y, o) {
    const w = o.w || 48, col = o.col || '#d8323c', h = o.h || 15;
    R(c, x, y - h, w, h, col); R(c, x - 1, y - h - 2, w + 2, 3, '#e8e8e8'); R(c, x, y - h + 1, w, 2, shade(col, 0.7));
    for (let i = 4; i < w - 4; i += 10) R(c, x + i, y - h + 5, 6, h - 8, shade(col, 1.15));
    if (o.tiles) for (let i = 0; i < w; i += 6) R(c, x + i, y - h + 3, 3, 2, '#f4f4f0');
  },
  trompo(c, x, y, o, t) {
    R(c, x + 6, y - 44, 2, 24, '#888');
    R(c, x + 2, y - 40, 10, 16, '#c86432'); R(c, x + 3, y - 38, 8, 12, '#e08040'); R(c, x + 4, y - 42, 6, 3, '#f0c040');
    R(c, x + 1 + Math.floor(t * 4) % 3, y - 35, 2, 2, '#f4a060');
    R(c, x + 12, y - 38, 2, 14, Math.floor(t * 10) % 2 ? '#f08c28' : '#d8323c');
  },
  shelf(c, x, y, o) {
    const w = o.w || 32, h = o.h || 40;
    R(c, x, y - h, w, h, '#6a4a2a'); R(c, x + 1, y - h + 1, w - 2, h - 2, '#4a3018');
    const cols = ['#d8323c', '#ffd23f', '#3c64dc', '#46b450', '#f08c28', '#f4f4f0', '#8c46c8'];
    for (let r = 0; r < Math.floor(h / 10); r++) {
      R(c, x, y - h + r * 10 + 9, w, 1, '#8c6a44');
      for (let i = 2; i < w - 3; i += 4) R(c, x + i, y - h + r * 10 + 3 + ((i + r) % 2), 3, 6 - ((i + r) % 2), cols[(i + r * 3) % cols.length]);
    }
  },
  register(c, x, y) { R(c, x, y - 30, 14, 8, '#3a3a44'); R(c, x + 2, y - 36, 10, 6, '#2a2a30'); R(c, x + 3, y - 35, 8, 3, '#46b450'); R(c, x + 2, y - 28, 10, 3, '#9a9aa6'); },
  arcade(c, x, y, o, t) {
    R(c, x, y - 36, 16, 36, '#1e2c78'); R(c, x - 1, y - 38, 18, 4, '#ff3cc8');
    R(c, x + 2, y - 32, 12, 10, '#0a0a14');
    R(c, x + 3 + (Math.floor(t * 4) % 8), y - 26, 2, 2, '#ffd23f'); R(c, x + 4, y - 30, 8, 1, '#46b450');
    R(c, x + 1, y - 20, 14, 4, '#3a3a44'); R(c, x + 4, y - 22, 1, 3, '#d8323c'); R(c, x + 9, y - 19, 2, 1, '#ffd23f');
    font.text(c, 'KK', x + 8, y - 13, '#ffd23f', { align: 'center' });
  },
  bar(c, x, y, o) { const w = o.w || 64; R(c, x, y - 15, w, 15, '#5a3218'); R(c, x - 2, y - 17, w + 4, 3, '#8c5a32'); for (let i = 3; i < w; i += 12) R(c, x + i, y - 12, 8, 9, '#6e4424'); },
  stool(c, x, y, o) { R(c, x, y - 12, 8, 2, o.col || '#d8323c'); R(c, x + 3, y - 10, 2, 10, '#888'); R(c, x + 1, y - 1, 6, 1, '#888'); },
  bottles(c, x, y, o) {
    const w = o.w || 40;
    R(c, x, y, w, 2, '#6e4424'); R(c, x, y + 14, w, 2, '#6e4424');
    const cols = ['#46b450', '#8c5a32', '#d8a040', '#f4f4f0', '#3c64dc', '#d8323c'];
    for (let i = 2; i < w - 2; i += 5) { const h = 6 + (i % 3) * 2; R(c, x + i, y - h, 3, h, cols[i % cols.length]); R(c, x + i + 1, y - h - 2, 1, 2, cols[i % cols.length]); R(c, x + i, y + 14 - h + 2, 3, h - 2, cols[(i + 2) % cols.length]); }
  },
  pool(c, x, y) { R(c, x, y - 16, 44, 4, '#5a3218'); R(c, x + 1, y - 17, 42, 2, '#2c8c5a'); R(c, x + 2, y - 12, 3, 12, '#3a2010'); R(c, x + 39, y - 12, 3, 12, '#3a2010'); R(c, x + 10, y - 19, 2, 2, '#d8323c'); R(c, x + 25, y - 19, 2, 2, '#ffd23f'); R(c, x + 30, y - 19, 2, 2, '#f4f4f0'); },
  jukebox(c, x, y, o, t) { R(c, x, y - 30, 16, 30, '#d8323c'); R(c, x + 2, y - 28, 12, 10, Math.floor(t * 4) % 2 ? '#ffd23f' : '#f08c28'); R(c, x + 2, y - 16, 12, 10, '#3a2010'); R(c, x + 1, y - 32, 14, 3, '#ffd23f'); },
  safe(c, x, y, o) { R(c, x, y - 20, 18, 20, '#4a4a54'); R(c, x + 1, y - 19, 16, 18, '#5a5a64'); R(c, x + 7, y - 13, 5, 5, '#2a2a30'); R(c, x + 9, y - 11, 1, 1, '#ffd23f'); if (o.open) { R(c, x + 1, y - 19, 16, 18, '#1a1a20'); if (!o.empty) R(c, x + 4, y - 8, 10, 6, '#46b450'); } },
  vault(c, x, y, o, t) {
    R(c, x, y - 70, 44, 70, '#7a7a84');
    c.fillStyle = '#9a9aa4'; c.beginPath(); c.arc(x + 22, y - 36, 20, 0, Math.PI * 2); c.fill();
    c.fillStyle = o.open ? '#1a1a20' : '#b0b0bc'; c.beginPath(); c.arc(x + 22, y - 36, 17, 0, Math.PI * 2); c.fill();
    if (!o.open) {
      c.strokeStyle = '#6a6a74'; c.lineWidth = 2; const a = (o.spin || 0);
      for (let i = 0; i < 3; i++) { const aa = a + i * 2.09; c.beginPath(); c.moveTo(x + 22, y - 36); c.lineTo(x + 22 + Math.cos(aa) * 14, y - 36 + Math.sin(aa) * 14); c.stroke(); }
      R(c, x + 19, y - 39, 6, 6, '#5a5a64');
      if (o.heat) { c.fillStyle = `rgba(255,${120 - o.heat * 100},40,${o.heat * 0.6})`; c.beginPath(); c.arc(x + 22, y - 36, 8, 0, Math.PI * 2); c.fill(); }
    } else { R(c, x + 10, y - 30, 24, 14, '#46b450'); R(c, x + 12, y - 28, 20, 2, '#2c8c3a'); R(c, x + 14, y - 44, 16, 10, '#ffd23f'); }
  },
  desk(c, x, y, o) { const w = o.w || 30; R(c, x, y - 16, w, 3, '#6e4424'); R(c, x + 1, y - 13, 10, 13, '#5a3218'); R(c, x + w - 3, y - 13, 2, 13, '#5a3218'); R(c, x + 3, y - 10, 6, 1, '#ffd23f'); if (o.papers) { R(c, x + 14, y - 18, 8, 2, '#f4f4f0'); R(c, x + 16, y - 19, 6, 1, '#e8e8e0'); } },
  computer(c, x, y, o, t) { R(c, x, y - 12, 12, 9, '#d8d8d0'); R(c, x + 1, y - 11, 10, 7, o.off ? '#1a1a2a' : '#1e3c78'); R(c, x + 2, y - 10, 4, 1, '#5adcf0'); R(c, x + 4, y - 3, 4, 2, '#b0b0a8'); },
  plant(c, x, y) { R(c, x + 2, y - 8, 6, 8, '#b05a32'); R(c, x + 1, y - 9, 8, 2, '#c86a42'); R(c, x + 4, y - 20, 2, 12, '#2c6a30'); R(c, x, y - 18, 4, 3, '#3c8a40'); R(c, x + 6, y - 22, 4, 3, '#3c8a40'); R(c, x + 1, y - 13, 3, 3, '#46a050'); R(c, x + 6, y - 15, 3, 3, '#46a050'); },
  crate(c, x, y, o) { const s = o.s || 18; R(c, x, y - s, s, s, '#8c6a44'); R(c, x + 1, y - s + 1, s - 2, s - 2, '#a8845a'); R(c, x + 1, y - s + 1, s - 2, 2, '#8c6a44'); R(c, x + 1, y - 3, s - 2, 2, '#8c6a44'); c.fillStyle = '#8c6a44'; for (let i = 0; i < s - 4; i++) c.fillRect(x + 2 + i, y - 3 - i, 2, 1); },
  crates(c, x, y, o) { PAINT.crate(c, x, y, { s: 16 }); PAINT.crate(c, x + 14, y, { s: 16 }); PAINT.crate(c, x + 7, y - 16, { s: 16 }); },
  barrel(c, x, y, o) { const col = o.col || '#3c64dc'; R(c, x, y - 18, 12, 18, col); R(c, x, y - 15, 12, 1, shade(col, 0.6)); R(c, x, y - 4, 12, 1, shade(col, 0.6)); R(c, x + 2, y - 17, 2, 14, shade(col, 1.2)); },
  carside(c, x, y, o) { sideCar(c, x, y, o.col || '#3c64dc', o); },
  tsuruside(c, x, y, o, t) { sideCar(c, x, y, o.col || '#d8d8d0', o, t); },
  toolwall(c, x, y) { R(c, x, y, 40, 26, '#6a5a44'); for (let i = 3; i < 40; i += 6) for (let j = 3; j < 26; j += 6) R(c, x + i, y + j, 1, 1, '#3a3020'); R(c, x + 4, y + 4, 2, 12, '#9a9aa6'); R(c, x + 3, y + 4, 4, 3, '#d8323c'); R(c, x + 12, y + 6, 8, 2, '#9a9aa6'); R(c, x + 22, y + 3, 2, 14, '#8c5a32'); R(c, x + 21, y + 3, 4, 3, '#9a9aa6'); R(c, x + 30, y + 5, 6, 6, '#ffd23f'); R(c, x + 31, y + 8, 4, 1, '#3a3a44'); },
  workbench(c, x, y) { R(c, x, y - 18, 36, 4, '#8c5a32'); R(c, x + 2, y - 14, 3, 14, '#5a3218'); R(c, x + 31, y - 14, 3, 14, '#5a3218'); R(c, x + 6, y - 22, 8, 4, '#3a3a44'); R(c, x + 20, y - 20, 10, 2, '#9a9aa6'); R(c, x + 4, y - 6, 28, 2, '#5a3218'); },
  locker(c, x, y, o) { R(c, x, y - 34, 14, 34, '#5a6a8a'); R(c, x + 1, y - 33, 12, 32, o.hiding ? '#4a5a7a' : '#6a7a9a'); R(c, x + 3, y - 30, 8, 1, '#3a4a6a'); R(c, x + 3, y - 28, 8, 1, '#3a4a6a'); R(c, x + 10, y - 18, 2, 3, '#c8c8d0'); },
  camera(c, x, y, o, t) {
    R(c, x + 4, y, 2, 4, '#3a3a44'); R(c, x, y + 4, 10, 5, '#d8d8d0'); R(c, x + (o.face < 0 ? -2 : 8), y + 5, 4, 3, '#3a3a44');
    R(c, x + 3, y + 5, 1, 1, Math.floor(t * 2) % 2 ? '#d8323c' : '#5a1a1a');
    if (o.photo) { R(c, x - 2, y - 2, 14, 1, '#46b450'); }
  },
  alarm(c, x, y, o, t) { R(c, x, y, 8, 8, '#d8323c'); R(c, x + 2, y + 2, 4, 4, o.off ? '#5a1a1a' : Math.floor(t * 3) % 2 ? '#ff5a5a' : '#d8323c'); if (o.off) R(c, x - 1, y + 3, 10, 1, '#1a1a1a'); },
  teller(c, x, y, o) { const w = o.w || 40; R(c, x, y - 15, w, 15, '#c8c8d0'); R(c, x - 1, y - 17, w + 2, 3, '#8a6a3a'); R(c, x, y - 40, w, 23, 'rgba(160,210,240,0.22)'); R(c, x, y - 40, w, 1, '#c8c8d0'); for (let i = 0; i < w; i += 25) R(c, x + i, y - 40, 1, 23, '#9a9aa6'); },
  rope(c, x, y) { R(c, x, y - 14, 3, 14, '#c8a040'); R(c, x + 27, y - 14, 3, 14, '#c8a040'); c.strokeStyle = '#a82030'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2, y - 12); c.quadraticCurveTo(x + 15, y - 6, x + 28, y - 12); c.stroke(); },
  bench(c, x, y, o) { R(c, x, y - 10, 30, 3, o.col || '#8c5a32'); R(c, x + 2, y - 7, 2, 7, '#3a3a44'); R(c, x + 26, y - 7, 2, 7, '#3a3a44'); if (o.back) R(c, x, y - 18, 30, 3, o.col || '#8c5a32'); },
  poster(c, x, y, o) {
    // grow to fit the caption and keep it readable on dark posters
    const bg = o.col || '#f4f4f0', w = Math.max(16, o.text ? font.measure(o.text) + 4 : 16), dark = parseInt(bg.slice(1, 3), 16) < 90;
    R(c, x, y, w, 22, bg); R(c, x + 2, y + 2, w - 4, 11, o.col2 || '#3c64dc');
    if (o.text) font.text(c, o.text, x + w / 2, y + 14, dark ? '#f4f4f0' : '#101018', { align: 'center' });
  },
  window(c, x, y, o, t, env) {
    const w = o.w || 28, h = o.h || 22;
    R(c, x - 2, y - 2, w + 4, h + 4, '#e8e0d0');
    R(c, x, y, w, h, env.sky || '#5ab4f0');
    if (env.night) { for (let i = 0; i < 6; i++) R(c, x + ((i * 7 + 3) % (w - 2)), y + ((i * 5) % (h - 8)) + 1, 1, 1, '#f4f4f0'); }
    // skyline
    const sc = env.night ? '#1a1a3a' : '#7a8aa8';
    for (let i = 0; i < w; i += 5) { const bh = 5 + ((i * 7 + (o.seed || 0)) % 9); R(c, x + i, y + h - bh, 5, bh, sc); if (env.night && i % 10 === 0) R(c, x + i + 2, y + h - bh + 2, 1, 1, '#ffd23f'); }
    R(c, x + w / 2 - 1, y, 2, h, '#e8e0d0'); R(c, x, y + h / 2 - 1, w, 2, '#e8e0d0');
    if (o.curtain) { R(c, x - 3, y - 3, 6, h + 6, o.curtain); R(c, x + w - 3, y - 3, 6, h + 6, o.curtain); }
  },
  door(c, x, y, o) {
    const col = o.col || '#6e4424';
    R(c, x - 2, y - 34, 24, 34, '#3a2a1a'); R(c, x, y - 32, 20, 32, col); R(c, x + 2, y - 30, 16, 12, shade(col, 1.15)); R(c, x + 2, y - 16, 16, 14, shade(col, 1.15)); R(c, x + 15, y - 17, 2, 2, '#ffd23f');
    if (o.label) { const w = font.measure(o.label) + 4; R(c, x + 10 - w / 2, y - 44, w, 9, '#101018'); font.text(c, o.label, x + 10, y - 43, '#ffd23f', { align: 'center' }); }
    if (o.exit) { const w = font.measure('SALIDA') + 4; R(c, x + 10 - w / 2, y - 45, w, 10, '#1e8c3c'); font.text(c, 'SALIDA', x + 10, y - 43, '#f4f4f0', { align: 'center' }); }
  },
  doorOpen(c, x, y, o) { R(c, x - 2, y - 34, 24, 34, '#3a2a1a'); R(c, x, y - 32, 20, 32, o.inside || '#0a0a10'); R(c, x + 16, y - 32, 4, 32, '#6e4424'); },
  whiteboard(c, x, y, o, t) {
    R(c, x, y, 60, 36, '#8a8a94'); R(c, x + 2, y + 2, 56, 32, '#f0f0ec');
    if (o.plan) {
      R(c, x + 5, y + 6, 14, 10, '#1e2c78'); font.text(c, '$', x + 12, y + 8, '#ffd23f', { align: 'center' });
      c.strokeStyle = '#d8323c'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 20, y + 11); c.lineTo(x + 34, y + 11); c.lineTo(x + 34, y + 24); c.lineTo(x + 50, y + 24); c.stroke();
      R(c, x + 44, y + 20, 10, 8, '#46b450'); R(c, x + 30, y + 5, 8, 4, '#ffd23f');
      font.text(c, 'K', x + 8, y + 22, '#e0a82e'); font.text(c, 'C', x + 16, y + 22, '#3c64dc'); font.text(c, 'G', x + 24, y + 22, '#b8323c');
      if (o.step >= 1) { R(c, x + 40, y + 6, 14, 6, '#d8d8d8'); font.text(c, 'X', x + 47, y + 5, '#d8323c', { align: 'center' }); }
    }
    if (o.scribble) for (let i = 0; i < 5; i++) R(c, x + 6, y + 6 + i * 5, 20 + (i * 13) % 28, 1, '#3c64dc');
  },
  mirror(c, x, y) { R(c, x, y, 16, 20, '#c8a040'); R(c, x + 2, y + 2, 12, 16, '#9ad0e8'); R(c, x + 4, y + 4, 2, 6, '#e0f0f8'); },
  rack(c, x, y, o) { R(c, x, y - 34, 30, 2, '#888'); R(c, x + 2, y - 34, 1, 34, '#666'); R(c, x + 27, y - 34, 1, 34, '#666'); const cols = ['#d8323c', '#46b450', '#ffd23f', '#8c46c8', '#3c64dc', '#f08c28']; for (let i = 3; i < 27; i += 4) { R(c, x + i, y - 32, 3, 16, cols[i % cols.length]); R(c, x + i + 1, y - 34, 1, 2, '#aaa'); } },
  masks(c, x, y, o) {
    R(c, x, y, 40, 24, '#5a3a2a');
    const m = [['#d8323c', '#ffd23f'], ['#e8c8a8', '#b0b0b0'], ['#f4f4f0', '#46b450'], ['#f0f0e8', '#1a1a1a'], ['#1a1a1e', '#c48a5e'], ['#8c46c8', '#ffd23f']];
    m.forEach(([a, b], i) => { const mx = x + 3 + (i % 3) * 12, my = y + 2 + Math.floor(i / 3) * 11; R(c, mx, my, 9, 9, a); R(c, mx + 2, my + 3, 2, 2, b); R(c, mx + 5, my + 3, 2, 2, b); R(c, mx + 3, my + 6, 3, 1, b); });
  },
  target(c, x, y, o) { R(c, x + 5, y - 8, 2, 8, '#6e4424'); R(c, x, y - 30, 12, 22, o.civil ? '#e8c8a8' : '#f4f4f0'); R(c, x + 3, y - 29, 6, 6, o.civil ? '#3c64dc' : '#1a1a1a'); if (!o.civil) { R(c, x + 3, y - 20, 6, 8, '#1a1a1a'); R(c, x + 5, y - 17, 2, 2, '#d8323c'); } else { R(c, x + 2, y - 20, 8, 8, '#46b450'); } },
  gunrack(c, x, y) { R(c, x, y, 30, 22, '#5a3a2a'); for (let i = 3; i < 28; i += 6) { R(c, x + i, y + 3, 2, 16, '#2a2a2e'); R(c, x + i - 1, y + 14, 4, 4, '#6e4424'); } },
  bars(c, x, y, o) { const w = o.w || 60; R(c, x, y - 40, w, 2, '#6a6a74'); R(c, x, y - 2, w, 2, '#6a6a74'); for (let i = 0; i < w; i += 5) R(c, x + i, y - 40, 2, 40, '#8a8a94'); },
  showcase(c, x, y, o, t) { R(c, x, y - 18, 30, 18, '#5a3218'); R(c, x, y - 28, 30, 10, o.broken ? 'rgba(0,0,0,0)' : 'rgba(180,220,255,0.35)'); R(c, x, y - 29, 30, 1, '#c8c8d0'); if (!o.empty) { for (let i = 3; i < 28; i += 6) R(c, x + i, y - 21, 3, 2, Math.floor(t * 3 + i) % 3 ? '#ffd23f' : '#fff8c0'); R(c, x + 12, y - 23, 3, 3, '#5adcf0'); } if (o.broken) for (let i = 0; i < 5; i++) R(c, x + 3 + i * 6, y - 20 + (i % 2), 2, 1, '#c8e8f8'); },
  forklift(c, x, y) { R(c, x, y - 20, 24, 14, '#ffd23f'); R(c, x + 4, y - 32, 14, 12, 'rgba(0,0,0,0)'); R(c, x + 4, y - 32, 2, 12, '#3a3a44'); R(c, x + 16, y - 32, 2, 12, '#3a3a44'); R(c, x + 4, y - 33, 14, 2, '#3a3a44'); R(c, x + 24, y - 36, 3, 36, '#3a3a44'); R(c, x + 27, y - 4, 9, 2, '#3a3a44'); R(c, x + 2, y - 6, 8, 6, '#1a1a1a'); R(c, x + 15, y - 6, 8, 6, '#1a1a1a'); },
  boxes(c, x, y) { R(c, x, y - 40, 34, 40, '#6a5a44'); for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) { R(c, x + 1 + i * 11, y - 39 + r * 10, 10, 9, '#b08a5a'); R(c, x + 3 + i * 11, y - 36 + r * 10, 6, 1, '#8a6a3a'); } },
  drill(c, x, y, o) { R(c, x, y - 12, 20, 12, '#ffd23f'); R(c, x + 2, y - 10, 16, 8, '#3a3a44'); R(c, x + 18, y - 8, 6, 3, '#9a9aa6'); R(c, x + 4, y - 16, 3, 4, '#3a3a44'); font.text(c, 'DRL', x + 10, y - 9, '#ffd23f', { align: 'center' }); },
  money(c, x, y, o) { const n = o.n ?? 6; for (let i = 0; i < n; i++) { const mx = x + (i % 3) * 10, my = y - 5 - Math.floor(i / 3) * 5; R(c, mx, my, 9, 5, '#46b450'); R(c, mx + 1, my + 1, 7, 3, '#2c8c3a'); R(c, mx + 3, my + 2, 3, 1, '#a0dc50'); } },
  bag(c, x, y, o) { R(c, x, y - 12, 12, 12, '#3a2c20'); R(c, x + 1, y - 11, 10, 3, '#5a4430'); R(c, x + 3, y - 15, 6, 3, '#3a2c20'); if (o.money) { R(c, x + 2, y - 13, 8, 2, '#46b450'); } },
  lamp(c, x, y, o, t) { R(c, x + 3, y - 20, 2, 20, '#3a3a44'); R(c, x, y - 26, 8, 6, o.col || '#ffd23f'); R(c, x + 1, y - 1, 6, 1, '#3a3a44'); },
  fan(c, x, y, o, t) { R(c, x + 9, y, 2, 6, '#3a3a44'); const f = Math.floor(t * 12) % 2; R(c, x + (f ? 0 : 4), y + 6, f ? 20 : 12, 2, '#6a5a44'); R(c, x + 8, y + 5, 4, 4, '#5a4a34'); },
  calendar(c, x, y, o) { R(c, x, y, 12, 14, '#f4f4f0'); R(c, x, y, 12, 4, '#d8323c'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(c, x + 2 + i * 3, y + 6 + j * 3, 2, 2, '#9a9aa6'); if (o.mark) R(c, x + 8, y + 12, 2, 2, '#d8323c'); },
  wanted(c, x, y, o) { R(c, x, y, 14, 18, '#e8d8b0'); font.text(c, 'SE', x + 7, y + 1, '#5a3218', { align: 'center' }); R(c, x + 3, y + 8, 8, 8, '#5a3218'); R(c, x + 5, y + 9, 4, 4, '#c8a078'); },
  lava(c, x, y, o, t) { R(c, x + 1, y - 2, 4, 2, '#3a3a44'); R(c, x, y - 12, 6, 10, '#8c46c8'); R(c, x + 2, y - 10 + Math.floor(t * 2) % 4, 2, 2, '#ff5a3c'); R(c, x + 1, y - 13, 4, 1, '#3a3a44'); },
  trophy(c, x, y) { R(c, x + 2, y - 2, 4, 2, '#8a6a10'); R(c, x + 3, y - 5, 2, 3, '#ffd23f'); R(c, x, y - 11, 8, 6, '#ffd23f'); R(c, x + 1, y - 10, 2, 3, '#fff08c'); },
  cuadro(c, x, y) { R(c, x, y, 16, 12, '#8c6a44'); R(c, x + 1, y + 1, 14, 10, '#1a1a3a'); R(c, x + 10, y + 2, 3, 3, '#f4f4f0'); R(c, x + 3, y + 6, 6, 3, '#f08c28'); R(c, x + 4, y + 5, 1, 1, '#1a1a1a'); },
  pato(c, x, y) { R(c, x + 2, y - 10, 12, 10, '#ffd23f'); R(c, x + 8, y - 16, 6, 6, '#ffd23f'); R(c, x + 14, y - 13, 3, 2, '#f08c28'); R(c, x + 11, y - 14, 1, 1, '#1a1a1a'); },
  disco(c, x, y, o, t) { R(c, x + 4, y, 1, 6, '#888'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(c, x + 1 + i * 3, y + 6 + j * 3, 3, 3, (i + j + Math.floor(t * 6)) % 2 ? '#e8e8f0' : '#8a8aa0'); },
  pan(c, x, y) { R(c, x, y - 6, 14, 6, '#d8a040'); R(c, x + 1, y - 7, 12, 1, '#e8b860'); R(c, x + 4, y - 5, 1, 3, '#b07a28'); R(c, x + 9, y - 5, 1, 3, '#b07a28'); },
  kazooGold(c, x, y, o, t) { R(c, x, y - 4, 10, 4, '#ffd23f'); R(c, x + 6, y - 6, 2, 2, '#ffd23f'); if (Math.floor(t * 3) % 3 === 0) R(c, x + 2, y - 4, 1, 1, '#ffffff'); },
  cartel(c, x, y, o) { const w = Math.max(o.w || 60, font.measure(o.text || '') + 8); R(c, x, y, w, 12, o.bg || '#101018'); R(c, x, y + 11, w, 1, o.col || '#ffd23f'); font.text(c, o.text || '', x + w / 2, y + 3, o.col || '#ffd23f', { align: 'center' }); },
  sign(c, x, y, o, t) { const w = font.measure(o.text) + 8; R(c, x, y, w, 12, '#1a0a24'); const col = o.neon && Math.floor(t * 2) % 7 === 0 ? '#ffffff' : o.col || '#ff3cc8'; R(c, x, y, w, 1, col); R(c, x, y + 11, w, 1, col); font.text(c, o.text, x + 4, y + 3, col); },
  stairs(c, x, y, o) { for (let i = 0; i < 8; i++) R(c, x + i * 3, y - (i + 1) * 10, 24 - i * 3, 2, '#8a8a94'); },
  ladder(c, x, y, o) { const h = o.h || 80; R(c, x, y - h, 2, h, '#8a6a3a'); R(c, x + 10, y - h, 2, h, '#8a6a3a'); for (let i = 4; i < h; i += 8) R(c, x, y - i, 12, 2, '#8a6a3a'); },
  tree(c, x, y, o) { R(c, x + 26, y - 50, 8, 50, '#4a3018'); R(c, x + 30, y - 40, 14, 3, '#4a3018'); const col = o.col || '#1e4a24'; c.fillStyle = col; c.beginPath(); c.ellipse(x + 30, y - 62, 32, 22, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = shade(col, 1.3); c.beginPath(); c.ellipse(x + 20, y - 68, 14, 9, 0, 0, Math.PI * 2); c.fill(); },
  bigtree(c, x, y, o) {
    const col = o.col || '#12301a';
    R(c, x + 30, y - 70, 10, 70, '#2a1a10'); R(c, x + 36, y - 52, 20, 4, '#2a1a10'); R(c, x + 14, y - 44, 18, 4, '#2a1a10');
    c.fillStyle = col; for (const [ox, oy, rx, ry] of [[35, -82, 40, 24], [12, -70, 20, 14], [58, -70, 22, 14], [35, -100, 26, 16]]) { c.beginPath(); c.ellipse(x + ox, y + oy, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = shade(col, 1.4); c.beginPath(); c.ellipse(x + 26, y - 94, 10, 5, 0, 0, Math.PI * 2); c.fill();
  },
  fence(c, x, y, o) { const w = o.w || 40; R(c, x, y - 18, w, 2, '#6a5a44'); R(c, x, y - 10, w, 2, '#6a5a44'); for (let i = 0; i < w; i += 10) R(c, x + i, y - 22, 3, 22, '#5a4a34'); },
  bush(c, x, y, o) { c.fillStyle = o.col || '#1e4a24'; c.beginPath(); c.ellipse(x + 8, y - 6, 9, 7, 0, 0, Math.PI * 2); c.fill(); },
  moon(c, x, y) { c.fillStyle = '#f4f0d8'; c.beginPath(); c.arc(x + 10, y + 10, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = '#d8d4b8'; R(c, x + 6, y + 6, 3, 3, '#d8d4b8'); R(c, x + 12, y + 12, 2, 2, '#d8d4b8'); },
  skyline(c, x, y, o, t) {
    const w = o.w || 320, dark = o.col || '#12122a';
    for (let i = 0; i < w; i += 14) {
      const h = 20 + ((i * 37) % 50);
      R(c, x + i, y - h, 13, h, dark);
      for (let yy = y - h + 4; yy < y - 4; yy += 6) for (let xx = 2; xx < 12; xx += 4) if (((i + yy + xx) * 7) % 5 === 0) R(c, x + i + xx, yy, 2, 2, (i + yy) % 3 ? '#ffd23f' : '#ff7ae0');
    }
    if (o.neon) { R(c, x + 120, y - 58, 30, 6, Math.floor(t * 2) % 2 ? '#ff3cc8' : '#c02090'); }
  },
  ac(c, x, y) { R(c, x, y - 12, 16, 12, '#9a9aa6'); R(c, x + 2, y - 10, 12, 8, '#6a6a76'); for (let i = 3; i < 13; i += 2) R(c, x + i, y - 10, 1, 8, '#9a9aa6'); },
  antenna(c, x, y) { R(c, x + 4, y - 30, 2, 30, '#6a6a76'); R(c, x, y - 28, 10, 1, '#6a6a76'); R(c, x + 1, y - 22, 8, 1, '#6a6a76'); },
  clothes(c, x, y, o) { R(c, x, y - 36, 30, 1, '#c8c8d0'); const cols = ['#e0a82e', '#3c64dc', '#b8323c', '#f4f4f0']; for (let i = 0; i < 4; i++) R(c, x + 2 + i * 7, y - 35, 5, 8 + (i % 2) * 3, cols[i]); },
  tank(c, x, y) { R(c, x, y - 26, 14, 18, '#2a2a2e'); R(c, x + 1, y - 27, 12, 2, '#3a3a44'); R(c, x + 2, y - 8, 2, 8, '#3a3a44'); R(c, x + 10, y - 8, 2, 8, '#3a3a44'); },
  lightpole(c, x, y, o, t) { R(c, x + 3, y - 60, 2, 60, '#3a3a44'); R(c, x + 3, y - 60, 10, 2, '#3a3a44'); R(c, x + 10, y - 59, 5, 3, '#fff08c'); },
  cones(c, x, y) { for (let i = 0; i < 3; i++) { R(c, x + i * 7 + 2, y - 8, 2, 8, '#f08c28'); R(c, x + i * 7, y - 2, 6, 2, '#f08c28'); R(c, x + i * 7 + 2, y - 5, 2, 1, '#f4f4f0'); } },
  cell(c, x, y) { PAINT.bars(c, x, y, { w: 50 }); R(c, x + 6, y - 10, 20, 4, '#6a6a74'); },
  sink(c, x, y) { R(c, x, y - 22, 16, 4, '#e8e8ec'); R(c, x + 6, y - 18, 4, 18, '#c8c8d0'); R(c, x + 7, y - 26, 2, 4, '#9a9aa6'); },
  atm(c, x, y, o, t) { R(c, x, y - 34, 14, 34, '#3c64dc'); R(c, x + 2, y - 30, 10, 8, '#0a1a3a'); R(c, x + 3, y - 29, 8, 1, '#46b450'); R(c, x + 3, y - 18, 8, 4, '#2a2a30'); font.text(c, '$', x + 7, y - 12, '#ffd23f', { align: 'center' }); },
  flag(c, x, y) { R(c, x, y - 40, 1, 40, '#888'); R(c, x + 1, y - 40, 4, 10, '#2c8c3a'); R(c, x + 5, y - 40, 4, 10, '#f4f4f0'); R(c, x + 9, y - 40, 4, 10, '#d8323c'); },
  hole(c, x, y, o) { R(c, x, y, 20, o.d || 6, '#3a2410'); R(c, x + 2, y + 1, 16, (o.d || 6) - 1, '#1a1008'); },
  shovel(c, x, y) { R(c, x + 2, y - 30, 2, 26, '#8c5a32'); R(c, x, y - 6, 6, 6, '#9a9aa6'); },
  cooler(c, x, y) { R(c, x, y - 14, 16, 14, '#3c64dc'); R(c, x, y - 15, 16, 3, '#f4f4f0'); },
  fire(c, x, y, o, t) { for (let i = 0; i < 5; i++) { const h = 6 + ((i * 3 + Math.floor(t * 10)) % 6); R(c, x + i * 3, y - h, 3, h, ['#d8323c', '#f08c28', '#ffd23f'][(i + Math.floor(t * 8)) % 3]); } },
  grassfg(c, x, y, o, t) { for (let i = 0; i < (o.w || 320); i += 3) { const h = 4 + ((i * 7) % 7) + Math.round(Math.sin(t * 2 + i * 0.3)); R(c, x + i, y - h, 2, h, (i % 9) ? '#2a4a1a' : '#3a6a24'); } },
  radio(c, x, y, o, t) { R(c, x, y - 8, 12, 8, '#3a3a44'); R(c, x + 1, y - 7, 4, 4, '#1a1a1e'); R(c, x + 7, y - 6, 4, 1, '#ffd23f'); R(c, x + 3, y - 12, 1, 4, '#888'); },
  microwave(c, x, y) { R(c, x, y - 9, 14, 9, '#e8e8ec'); R(c, x + 1, y - 8, 8, 7, '#2a2a30'); R(c, x + 10, y - 7, 3, 1, '#46b450'); },
  fan2(c, x, y, o, t) { R(c, x + 3, y - 8, 2, 8, '#6a6a76'); const f = Math.floor(t * 14) % 2; R(c, x + (f ? 0 : 2), y - 14, f ? 8 : 4, 6, '#b0b0bc'); },
  toilet(c, x, y) { R(c, x, y - 10, 12, 4, '#f4f4f0'); R(c, x + 2, y - 6, 8, 6, '#e8e8ec'); R(c, x + 9, y - 20, 3, 10, '#e8e8ec'); },
  papel(c, x, y, o) { R(c, x, y, 20, 14, '#f4f0d8'); for (let i = 0; i < 4; i++) R(c, x + 2, y + 2 + i * 3, 12 + (i % 2) * 4, 1, '#8a8a94'); if (o.red) { R(c, x + 12, y + 8, 6, 5, '#d8323c'); } },
};

// side-view car (Tsuru), ~60x26
export function sideCar(c, x, y, col, o = {}, t = 0) {
  const d = shade(col, 0.7), l = shade(col, 1.15), glass = '#3a5470';
  const f = o.face || 1; // 1 facing right
  const X = (px) => (f > 0 ? x + px : x + 60 - px);
  const RR = (px, py, w, h, cc) => { c.fillStyle = cc; c.fillRect(Math.round(f > 0 ? x + px : x + 60 - px - w), Math.round(y + py), w, h); };
  RR(2, -16, 56, 10, col); RR(0, -12, 60, 6, col); RR(12, -24, 32, 9, col);
  RR(14, -23, 13, 7, glass); RR(29, -23, 13, 7, glass); RR(15, -23, 3, 7, '#6a8cac');
  RR(0, -8, 60, 2, d); RR(27, -16, 1, 9, d); RR(44, -15, 1, 8, d);
  RR(56, -13, 4, 3, '#fff6b0'); RR(0, -13, 3, 3, '#e02828');
  RR(8, -8, 12, 8, '#1a1a1a'); RR(42, -8, 12, 8, '#1a1a1a'); RR(11, -5, 6, 3, '#9a9aa6'); RR(45, -5, 6, 3, '#9a9aa6');
  RR(2, -16, 56, 1, l);
  if (o.dent) { RR(46, -16, 6, 3, d); }
  if (o.hoodOpen) { RR(44, -30, 16, 3, col); RR(46, -28, 2, 12, d); }
  void X;
}
