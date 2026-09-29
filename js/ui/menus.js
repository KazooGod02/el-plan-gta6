// Title screen, pause overlay, options, controls, credits.
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp } from '../core/util.js';
import { listSlots, saveSettings, deleteSlot } from '../core/save.js';
import { portrait } from '../data/sprites.js';
import { canvas, silhouette, shade } from '../core/gfx.js';
import { drawProp } from '../interior/props.js';
import { drawSky } from '../interior/interior.js';
import { UI } from './ui.js';
import { CONFIG } from '../config.js';
import { countdownText } from '../world/city.js';
import { VIGNETTES, PW, PH } from '../story/cinematics.js';

// ---------------------------------------------------------------- options list (shared)
function optionsRows() {
  const st = G.settings;
  const bar = (v) => '■'.repeat(Math.round(v * 10)) + '·'.repeat(10 - Math.round(v * 10));
  return [
    { k: 'MÚSICA', v: bar(st.music), adj: (d) => { st.music = clamp(Math.round((st.music + d * 0.1) * 10) / 10, 0, 1); audio.setVolumes(st.music, st.sfx); } },
    { k: 'EFECTOS', v: bar(st.sfx), adj: (d) => { st.sfx = clamp(Math.round((st.sfx + d * 0.1) * 10) / 10, 0, 1); audio.setVolumes(st.music, st.sfx); audio.sfx('coin'); } },
    { k: 'MODO STREAMER (censura)', v: st.streamer ? 'SÍ' : 'NO', tog: () => (st.streamer = !st.streamer) },
    { k: 'TEMBLOR DE CÁMARA', v: st.shake ? 'SÍ' : 'NO', tog: () => (st.shake = !st.shake) },
    { k: 'TIMER SPEEDRUN', v: st.speedrun ? 'SÍ' : 'NO', tog: () => (st.speedrun = !st.speedrun) },
  ];
}
function updateOptions(o) {
  const rows = optionsRows();
  if (input.pressed('down')) { o.sel = (o.sel + 1) % rows.length; audio.sfx('move'); }
  if (input.pressed('up')) { o.sel = (o.sel + rows.length - 1) % rows.length; audio.sfx('move'); }
  const r = rows[o.sel];
  const d = input.pressed('right') ? 1 : input.pressed('left') ? -1 : 0;
  if (r.adj && d) r.adj(d);
  if (r.tog && (input.pressed('a') || d)) { r.tog(); audio.sfx('select'); }
  if (input.cancel()) { saveSettings(G.settings); return true; }
  return false;
}
function drawOptions(ctx, o, y0 = 50) {
  ctx.fillStyle = 'rgba(8,8,20,0.92)'; ctx.fillRect(30, y0 - 14, W - 60, 110);
  font.text(ctx, 'OPCIONES', W / 2, y0 - 10, '#ffd23f', { align: 'center' });
  optionsRows().forEach((r, i) => {
    const y = y0 + 6 + i * 14, sel = i === o.sel;
    font.text(ctx, (sel ? '► ' : '  ') + r.k, 44, y, sel ? '#ffd23f' : '#f4f4f0');
    font.text(ctx, r.v, W - 44, y, '#5adcf0', { align: 'right' });
  });
  font.text(ctx, '◄ ► cambiar · B regresar', W / 2, y0 + 82, '#a8a8b8', { align: 'center' });
}

const CONTROLS = [
  ['MOVER', 'WASD / Flechas / Stick', 'Joystick'],
  ['ACCIÓN / HABLAR / SUBIR AL CARRO', 'E / Enter', 'A'],
  ['GOLPEAR / DISPARAR / FRENO DE MANO', 'Espacio / J', 'B'],
  ['CORRER / CLAXON', 'Shift', 'Stick al fondo'],
  ['AGACHARSE / CUBRIRSE (interiores)', 'S / Abajo', 'Abajo'],
  ['CAMBIAR ARMA / RADIO', 'Q', '🔫'],
  ['TELÉFONO', 'Tab / T', '📱'],
  ['MAPA (waypoint e índice)', 'M', 'Cel > Mapa'],
  ['PAUSA', 'Esc / P', 'II'],
];
function drawControls(ctx) {
  ctx.fillStyle = 'rgba(8,8,20,0.95)'; ctx.fillRect(10, 10, W - 20, H - 20);
  font.text(ctx, 'CÓMO JUGAR', W / 2, 16, '#ffd23f', { align: 'center' });
  const touch = input.isTouch;
  CONTROLS.forEach(([a, k, t], i) => {
    const y = 30 + i * 12;
    font.text(ctx, a, 18, y, '#f4f4f0');
    font.text(ctx, (touch ? t : k).replace('🔫', 'botón arma').replace('📱', 'botón cel'), W - 18, y, '#5adcf0', { align: 'right' });
  });
  font.text(ctx, 'Maneja: Arriba acelera, Abajo frena/reversa. B = freno de mano.', W / 2, 148, '#a8a8b8', { align: 'center' });
  font.text(ctx, 'Sigue la flecha y la ruta del radar. ? = extraños y locos.', W / 2, 158, '#ffd23f', { align: 'center' });
}

// ---------------------------------------------------------------- TITLE
export const title = {
  name: 'title',
  song: 'title',
  enter() {
    this.t = 0; this.sel = 0; this.mode = G.titleStarted ? 'menu' : 'press'; this.opt = { sel: 0 }; this.slotSel = 0; this.confirm = null;
    UI.fade = 1; UI.fadeTarget = 0; UI.hud = false; UI.letterbox = 0; UI.letterboxTarget = 0; UI.objective = ''; UI.dialog = null;
    G.lockInput = 0; G.paused = false;
  },
  items() {
    const slots = listSlots();
    const any = slots.some(Boolean);
    const out = [];
    if (any) out.push({ id: 'continue', t: 'CONTINUAR' });
    out.push({ id: 'new', t: 'NUEVA PARTIDA' });
    if (any) out.push({ id: 'load', t: 'CARGAR PARTIDA' });
    if (G.global.finished) out.push({ id: 'free', t: 'MODO LIBRE' });
    out.push({ id: 'options', t: 'OPCIONES' }, { id: 'controls', t: 'CÓMO JUGAR' }, { id: 'credits', t: 'CRÉDITOS' });
    return out;
  },
  update(dt) {
    this.t += dt;
    if (this.mode === 'press') { if (input.anyPressed && (input.pressed('a') || input.pressed('b') || input.pressed('pause') || this.t > 0.2 && input.anyPressed)) { input.anyPressed = false; G.titleStarted = true; this.mode = 'menu'; audio.init(); audio.sfx('select'); } return; }
    if (this.mode === 'options') { if (updateOptions(this.opt)) this.mode = 'menu'; return; }
    if (this.mode === 'controls' || this.mode === 'credits') { if (input.cancel() || input.pressed('a')) this.mode = 'menu'; return; }
    if (this.mode === 'slots') {
      if (input.pressed('down')) { this.slotSel = (this.slotSel + 1) % 3; audio.sfx('move'); }
      if (input.pressed('up')) { this.slotSel = (this.slotSel + 2) % 3; audio.sfx('move'); }
      if (input.cancel()) { this.mode = 'menu'; audio.sfx('back'); }
      if (input.pressed('a')) {
        const slots = listSlots();
        if (this.slotMode === 'load') { if (slots[this.slotSel]) { audio.sfx('select'); G.startLoad(this.slotSel); } else audio.sfx('jam'); }
        else {
          if (slots[this.slotSel] && this.confirm !== this.slotSel) { this.confirm = this.slotSel; audio.sfx('move'); return; }
          audio.sfx('select'); deleteSlot(this.slotSel); G.settings.lastSlot = this.slotSel; G.startNew(false);
        }
      }
      return;
    }
    const items = this.items();
    this.sel = clamp(this.sel, 0, items.length - 1);
    if (input.pressed('down')) { this.sel = (this.sel + 1) % items.length; audio.sfx('move'); }
    if (input.pressed('up')) { this.sel = (this.sel + items.length - 1) % items.length; audio.sfx('move'); }
    if (input.pressed('a')) {
      const it = items[this.sel];
      audio.sfx('select');
      if (it.id === 'continue') { const s = listSlots(); let best = 0, bt = -1; s.forEach((m, i) => { if (m && m.t > bt) { bt = m.t; best = i; } }); G.startLoad(best); }
      else if (it.id === 'new') { this.mode = 'slots'; this.slotMode = 'new'; this.confirm = null; }
      else if (it.id === 'load') { this.mode = 'slots'; this.slotMode = 'load'; }
      else if (it.id === 'free') G.startNew(true);
      else if (it.id === 'options') { this.mode = 'options'; this.opt.sel = 0; }
      else if (it.id === 'controls') this.mode = 'controls';
      else if (it.id === 'credits') { setScene('credits', { back: 'title' }); }
    }
  },
  render(ctx) {
    const t = this.t;
    // ---- background: the city at dusk, dimmed on the left so the menu reads well
    drawSky(ctx, 'dusk', t);
    drawProp(ctx, { t: 'skyline', w: 520, neon: false, col: '#2a1a4a' }, -((t * 6) % 140), 150, t, {});
    ctx.fillStyle = '#12091e'; ctx.fillRect(0, 150, W, 30);
    const g = ctx.createLinearGradient(0, 0, 190, 0);
    g.addColorStop(0, 'rgba(8,4,18,0.88)'); g.addColorStop(0.75, 'rgba(8,4,18,0.55)'); g.addColorStop(1, 'rgba(8,4,18,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 190, H);
    // ---- right: rotating character art
    drawHeroArt(ctx, t);
    // ---- left: logo
    const bob = Math.round(Math.sin(t * 2) * 1.5);
    font.text(ctx, 'EL PLAN', 12 + 3, 10 + bob + 3, '#3a0a3a', { scale: 4 });
    font.text(ctx, 'EL PLAN', 12, 10 + bob, '#ffd23f', { scale: 4, outline: '#5a1a00' });
    font.text(ctx, 'UNA PRECUELA DE "EL ESCAPE"', 13, 44, '#f4f4f0', { outline: '#2a0a2a' });
    ctx.fillStyle = '#ff3cc8'; ctx.fillRect(13, 55, 60, 1); ctx.fillStyle = '#ffd23f'; ctx.fillRect(13, 55, 24, 1);
    // ---- bottom-right signature, small and see-through
    ctx.globalAlpha = 0.55;
    font.text(ctx, '@KazooGod02', W - 5, H - 11, '#f4f4f0', { align: 'right', outline: '#101018' });
    ctx.globalAlpha = 1;
    if (CONFIG.marathonDate) font.text(ctx, 'EL ESCAPE: ' + countdownText(), 13, H - 11, '#5adcf0', { outline: '#101018' });

    if (this.mode === 'press') {
      if (Math.floor(t * 2) % 2 === 0) font.text(ctx, input.isTouch ? 'TOCA LA PANTALLA' : 'PRESIONA CUALQUIER BOTÓN', 13, 76, '#f4f4f0', { outline: '#101018' });
      return;
    }
    if (this.mode === 'menu') {
      const items = this.items();
      this.selY = this.selY ?? 0;
      const y0 = 66, step = 13;
      this.selY += (y0 + this.sel * step - this.selY) * 0.3;
      // highlight bar slides between entries
      const hy = Math.round(this.selY) - 3;
      ctx.fillStyle = 'rgba(255,210,63,0.16)'; ctx.fillRect(8, hy, 150, 12);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(8, hy, 2, 12);
      items.forEach((it, i) => {
        const y = y0 + i * step, sel = i === this.sel;
        const x = sel ? 18 + Math.round(Math.sin(t * 6) * 1) : 14;
        font.text(ctx, sel ? '► ' + it.t : it.t, x, y, sel ? '#ffd23f' : '#d8d8e8', { outline: '#101018' });
      });
    }
    if (this.mode === 'options') drawOptions(ctx, this.opt, 90);
    if (this.mode === 'controls') drawControls(ctx);
    if (this.mode === 'slots') {
      ctx.fillStyle = 'rgba(8,8,20,0.94)'; ctx.fillRect(8, 60, 200, 100);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(8, 60, 2, 100);
      font.text(ctx, this.slotMode === 'load' ? 'CARGAR PARTIDA' : 'NUEVA PARTIDA: ELIGE RANURA', 16, 66, '#ffd23f');
      const slots = listSlots();
      slots.forEach((m, i) => {
        const y = 82 + i * 18, sel = i === this.slotSel;
        const txt = m ? `${i + 1}. ${m.chapter || '—'} · ${fmt(m.play)}` : `${i + 1}. VACÍA`;
        font.text(ctx, (sel ? '► ' : '  ') + txt, 16, y, sel ? '#ffd23f' : '#f4f4f0');
        if (m) font.text(ctx, new Date(m.t).toLocaleDateString('es-MX'), 200, y + 9, '#a8a8b8', { align: 'right' });
      });
      if (this.confirm !== null && this.slotMode === 'new') font.text(ctx, '¿Sobrescribir? Presiona A otra vez', 16, 146, '#d8323c');
    }
  },
};

// ---------------------------------------------------------------- title art
// Loading-screen style panels of the three leads, swapping every few seconds with a
// wipe + RGB glitch, a light sweep over the face, halftone dots and speed lines.
const HEROES = [
  { id: 'kazoo', name: 'KAZOO', tag: 'EL QUE DEBE', col: '#e0a82e', col2: '#ff3cc8', exprs: ['happy', 'smug'] },
  { id: 'coqui', name: 'COQUI', tag: 'EL QUE SALIÓ', col: '#3c64dc', col2: '#5adcf0', exprs: ['serious', 'angry'] },
  { id: 'ghenghis', name: 'GHENGHIS', tag: 'EL QUE CUIDABA', col: '#d8323c', col2: '#ffd23f', exprs: ['laugh', 'crazy'] },
];
const HERO_T = 4.6;
let artBuf = null;
function heroCanvas(hero, expr, sweep) {
  // the face (4x) plus a light sweep that only lands on the drawn pixels
  artBuf ||= canvas(128, 128);
  const x = artBuf.x;
  x.clearRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'source-over';
  x.imageSmoothingEnabled = false;
  x.drawImage(portrait(hero.id, expr), 0, 0, 128, 128);
  if (sweep >= 0 && sweep <= 1) {
    x.globalCompositeOperation = 'source-atop';
    const sx = -60 + sweep * 250;
    const gr = x.createLinearGradient(sx, 0, sx + 40, 40);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,240,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.globalCompositeOperation = 'source-over';
  }
  return artBuf;
}
const silCache = new Map();
function heroSil(id, expr, col) {
  const key = id + '|' + expr + '|' + col;
  let c = silCache.get(key);
  if (!c) {
    const big = canvas(128, 128); big.x.imageSmoothingEnabled = false; big.x.drawImage(portrait(id, expr), 0, 0, 128, 128);
    c = silhouette(big, col); silCache.set(key, c);
  }
  return c;
}
function drawHeroArt(ctx, t) {
  const k = Math.floor(t / HERO_T), lt = t - k * HERO_T;
  const hero = HEROES[k % HEROES.length], prev = HEROES[(k + HEROES.length - 1) % HEROES.length];
  const ease = (v) => 1 - Math.pow(1 - Math.min(1, Math.max(0, v)), 3);
  const inT = ease(lt / 0.55);
  const X0 = 150;
  const panel = (h, slide, alpha) => {
    const off = Math.round((1 - slide) * 190);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(X0 + 34 + off, 0); ctx.lineTo(W + 10 + off, 0); ctx.lineTo(W + 10 + off, H); ctx.lineTo(X0 + off, H); ctx.closePath();
    ctx.clip();
    const gg = ctx.createLinearGradient(X0, 0, W, H);
    gg.addColorStop(0, shade(h.col, 0.45)); gg.addColorStop(1, shade(h.col2, 0.55));
    ctx.fillStyle = gg; ctx.fillRect(X0 + off, 0, W, H);
    // halftone dots, bigger toward the bottom
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let yy = 4; yy < H; yy += 6) for (let xx = X0 + ((yy / 6) % 2 ? 0 : 3); xx < W + 10; xx += 6) { const r = 0.5 + yy / H * 1.6; ctx.fillRect(Math.round(xx + off), yy, r, r); }
    // speed lines
    for (let i = 0; i < 7; i++) {
      const ly = (i * 29 + Math.floor(t * 60)) % (H + 20) - 10;
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(X0 + off, ly, W, 1);
    }
    ctx.restore();
    // bright edge stripe
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X0 + 34 + off, 0); ctx.lineTo(X0 + off, H); ctx.stroke();
    ctx.strokeStyle = h.col2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0 + 39 + off, 0); ctx.lineTo(X0 + 5 + off, H); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  if (lt < 0.55) panel(prev, 1, 1);
  panel(hero, inT, 1);
  // the face: slides in, breathes, blinks to a second expression now and then
  const expr = lt > 2.6 && lt < 3.4 ? hero.exprs[1] : hero.exprs[0];
  const art = heroCanvas(hero, expr, (lt - 1.1) / 0.9);
  const ax = Math.round(186 + (1 - inT) * 150), ay = Math.round(H - 124 + Math.sin(t * 1.6) * 1.5);
  const sil = heroSil(hero.id, expr, '#101018'), glow = heroSil(hero.id, expr, hero.col2);
  ctx.globalAlpha = 0.9; ctx.drawImage(glow, ax + 5, ay + 3); ctx.globalAlpha = 1;
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.drawImage(sil, ax + dx, ay + dy);
  // RGB split glitch on the way in
  if (lt < 0.8) {
    const gl = Math.round((1 - lt / 0.8) * 7);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(heroSil(hero.id, expr, '#ff2a6a'), ax - gl, ay);
    ctx.drawImage(heroSil(hero.id, expr, '#2ae0ff'), ax + gl, ay);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(art, ax, ay);
  // name tag
  const nx = W - 8, ny = 14 + Math.round((1 - inT) * -30);
  // long names drop a size so they never run into the logo
  const sc = font.measure(hero.name) * 3 > W - 196 ? 2 : 3;
  font.text(ctx, hero.name, nx + 2, ny + 2, 'rgba(0,0,0,0.5)', { align: 'right', scale: sc });
  font.text(ctx, hero.name, nx, ny, '#f4f4f0', { align: 'right', scale: sc, outline: '#101018' });
  const tw = font.measure(hero.tag) + 8, ty = ny + sc * 7 + 4;
  ctx.fillStyle = hero.col; ctx.fillRect(nx - tw, ty, tw, 11);
  font.text(ctx, hero.tag, nx - 4, ty + 2, '#101018', { align: 'right' });
  // sparks drifting up
  for (let i = 0; i < 14; i++) {
    const px = 176 + ((i * 53) % 140), py = H - ((t * (18 + (i % 5) * 6) + i * 37) % (H + 10));
    ctx.fillStyle = i % 3 ? hero.col2 : '#fff08c';
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5 + i);
    ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  ctx.globalAlpha = 1;
  // quick white flash when a new hero lands
  if (lt < 0.18) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - lt / 0.18)})`; ctx.fillRect(X0, 0, W - X0, H); }
}

function fmt(sec = 0) { const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return `${h}h ${String(m).padStart(2, '0')}m`; }

// ---------------------------------------------------------------- PAUSE
export const pause = {
  open: false, sel: 0, mode: 'menu', opt: { sel: 0 }, confirm: false,
  toggle() {
    if (this.open) { this.open = false; G.paused = false; return; }
    if (G.paused) return;
    this.open = true; G.paused = true; this.sel = 0; this.mode = 'menu'; this.confirm = false; audio.sfx('select');
  },
  update() {
    if (!this.open) return;
    if (this.mode === 'options') { if (updateOptions(this.opt)) this.mode = 'menu'; return; }
    if (this.mode === 'controls') { if (input.cancel() || input.pressed('a')) this.mode = 'menu'; return; }
    const items = ['CONTINUAR', 'CÓMO JUGAR', 'OPCIONES', 'SALIR AL MENÚ'];
    if (input.pressed('down')) { this.sel = (this.sel + 1) % items.length; this.confirm = false; audio.sfx('move'); }
    if (input.pressed('up')) { this.sel = (this.sel + items.length - 1) % items.length; this.confirm = false; audio.sfx('move'); }
    if (input.pressed('pause') || input.pressed('back')) { this.toggle(); return; }
    if (input.pressed('a')) {
      audio.sfx('select');
      if (this.sel === 0) this.toggle();
      if (this.sel === 1) this.mode = 'controls';
      if (this.sel === 2) { this.mode = 'options'; this.opt.sel = 0; }
      if (this.sel === 3) { if (!this.confirm) { this.confirm = true; return; } this.open = false; G.paused = false; G.quitToTitle(); }
    }
  },
  render(ctx) {
    if (!this.open) return;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    if (this.mode === 'options') { drawOptions(ctx, this.opt); return; }
    if (this.mode === 'controls') { drawControls(ctx); return; }
    font.text(ctx, 'PAUSA', W / 2, 40, '#ffd23f', { align: 'center', scale: 3, outline: '#101018' });
    ['CONTINUAR', 'CÓMO JUGAR', 'OPCIONES', 'SALIR AL MENÚ'].forEach((t, i) => {
      const sel = i === this.sel;
      font.text(ctx, sel ? '► ' + t + ' ◄' : t, W / 2, 80 + i * 14, sel ? '#ffd23f' : '#f4f4f0', { align: 'center', outline: '#101018' });
    });
    if (this.confirm) font.text(ctx, 'Lo no guardado se pierde. A para confirmar.', W / 2, 142, '#d8323c', { align: 'center', outline: '#101018' });
    const s = G.state;
    if (s) font.text(ctx, `${s.chapterName} · Tiempo ${fmt(s.stats.playtime)}`, W / 2, 160, '#a8a8b8', { align: 'center' });
  },
};

// ---------------------------------------------------------------- CREDITS
const CREDITS = [
  ['EL PLAN', 'title'],
  ['Una precuela 8-bit de "El Escape"', ''],
  ['', ''],
  ['UNA HISTORIA DE', 'h'], ['KazooGod02', ''], ['', ''],
  ['REPARTO', 'h'], ['KAZOO — Kazoo', ''], ['COQUI — Coqui', ''], ['GHENGHIS — Ghenghis', ''], ['', ''],
  ['TAMBIÉN APARECEN', 'h'], ['Don Chuy · Doña Mari · La Tía Gris', ''], ['El Tuercas · Comandante Reyes', ''], ['VendeRápido_5E (5 estrellas)', ''], ['', ''],
  ['GUION DEL TRAILER', 'h'], ['KazooGod02', ''], ['', ''],
  ['JUEGO, PIXELES Y CHIPTUNE', 'h'], ['Hecho con código y cariño', ''], ['para los que esperan el tráiler', ''], ['', ''],
  ['GRACIAS ESPECIALES', 'h'], ['A la comunidad de KazooGod02', ''], ['A todos los que dejan reseñas honestas', ''], ['A Doña Mari, por los tacos', ''], ['', ''],
  ['Ningún Tsuru fue lastimado', ''], ['durante la producción de este juego.', ''], ['(Mentira.)', ''], ['', ''],
  ['NOS VEMOS EN "EL ESCAPE"', 'h'], ['', ''], ['', ''],
];
// credits roll on the right while little scenes from the story play on the left
const COL_X = 250, COL_W = 128, PX0 = 8, PY0 = 36;
let creditLines = null;
function buildCredits() {
  const out = [];
  for (const [txt, kind] of CREDITS) {
    if (kind === 'title') { out.push({ txt, kind, h: 22 }); continue; }
    if (!txt) { out.push({ txt: '', kind, h: 8 }); continue; }
    font.wrap(txt, COL_W).forEach((l) => out.push({ txt: l, kind, h: 11 }));
  }
  return out;
}
export const credits = {
  name: 'credits', song: 'credits',
  enter(opts = {}) { this.t = 0; this.back = opts.back || 'title'; this.onDone = opts.onDone || null; UI.hud = false; UI.fadeTarget = 0; creditLines ||= buildCredits(); },
  length() { return VIGNETTES.length * VIG_T; },
  update(dt) {
    this.t += dt * (input.down('a') || input.down('b') ? 4 : 1);
    if (this.t > this.length() + 1.5 || input.pressed('pause') || input.pressed('back')) {
      if (this.onDone) { const f = this.onDone; this.onDone = null; f(); }
      else setScene(this.back);
    }
  },
  render(ctx) {
    ctx.fillStyle = '#06060e'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = '#3a3a5a'; ctx.fillRect((i * 83) % W, (i * 47 + Math.floor(this.t * 5)) % H, 1, 1); }
    // ---- cinematics panel
    const k = Math.min(VIGNETTES.length - 1, Math.floor(this.t / VIG_T)), lt = this.t - k * VIG_T;
    const v = VIGNETTES[k];
    ctx.fillStyle = '#000'; ctx.fillRect(PX0 - 2, PY0 - 2, PW + 4, PH + 4);
    ctx.fillStyle = '#3a3a5a'; ctx.fillRect(PX0 - 3, PY0 - 3, PW + 6, 1); ctx.fillRect(PX0 - 3, PY0 + PH + 2, PW + 6, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(PX0, PY0, PW, PH); ctx.clip(); ctx.translate(PX0, PY0);
    v.draw(ctx, lt);
    // film grain + fade between scenes
    ctx.fillStyle = 'rgba(255,240,200,0.05)'; ctx.fillRect(0, 0, PW, PH);
    const fade = Math.max(0, 1 - lt / 0.5, (lt - (VIG_T - 0.5)) / 0.5);
    if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; ctx.fillRect(0, 0, PW, PH); }
    ctx.restore();
    // sprocket holes
    for (let x = PX0; x < PX0 + PW; x += 12) { ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x + 3, PY0 - 10, 6, 4); ctx.fillRect(x + 3, PY0 + PH + 6, 6, 4); }
    font.text(ctx, v.cap, PX0 + PW / 2, PY0 + PH + 14, '#ffd23f', { align: 'center' });
    // ---- credits column
    const total = creditLines.reduce((a, l) => a + l.h, 0);
    let y = H + 4 - (this.t / this.length()) * (total + H - 20);
    for (const l of creditLines) {
      if (y > -24 && y < H + 10) {
        if (l.kind === 'title') font.text(ctx, l.txt, COL_X, y, '#ffd23f', { align: 'center', scale: 2, outline: '#5a1a00' });
        else font.text(ctx, l.txt, COL_X, y, l.kind === 'h' ? '#ff7ae0' : '#f4f4f0', { align: 'center' });
      }
      y += l.h;
    }
    if (CONFIG.streamUrl) font.text(ctx, CONFIG.streamUrl, W / 2, H - 10, '#5adcf0', { align: 'center' });
    font.text(ctx, 'A: adelantar', 4, H - 10, '#4a4a6a');
  },
};
const VIG_T = 5.4;
