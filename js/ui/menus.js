// Title screen, pause overlay, options, controls, credits.
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp } from '../core/util.js';
import { listSlots, saveSettings, deleteSlot } from '../core/save.js';
import { side } from '../data/sprites.js';
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
    drawSky(ctx, 'dusk', t);
    // city skyline parallax
    drawProp(ctx, { t: 'skyline', w: 520, neon: false, col: '#2a1a4a' }, -((t * 6) % 140), 150, t, {});
    ctx.fillStyle = '#12091e'; ctx.fillRect(0, 150, W, 30);
    // palm trees
    for (const px of [18, 292]) {
      ctx.fillStyle = '#1a0e24'; ctx.fillRect(px, 96, 3, 56);
      for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55 + Math.sin(t + i) * 0.05; ctx.fillRect(Math.round(px + 1 + Math.cos(a) * 14), Math.round(96 + Math.sin(a) * 8), 12, 2); }
    }
    // crew on the rooftop
    const crew = [['coqui', 128], ['kazoo', 150], ['ghenghis', 172]];
    for (const [id, x] of crew) ctx.drawImage(side(id, 'idle', id === 'coqui' ? 1 : id === 'ghenghis' ? -1 : 1), x, 128);
    // logo
    const bob = Math.round(Math.sin(t * 2) * 2);
    font.text(ctx, 'EL PLAN', W / 2 + 3, 20 + bob + 3, '#3a0a3a', { align: 'center', scale: 5 });
    font.text(ctx, 'EL PLAN', W / 2, 20 + bob, '#ffd23f', { align: 'center', scale: 5, outline: '#5a1a00' });
    font.text(ctx, 'UNA PRECUELA DE "EL ESCAPE"', W / 2, 60, '#f4f4f0', { align: 'center', outline: '#2a0a2a' });
    font.text(ctx, 'KAZOOGOD02', W / 2, 70, '#ff7ae0', { align: 'center', outline: '#2a0a2a' });

    if (this.mode === 'press') {
      if (Math.floor(t * 2) % 2 === 0) font.text(ctx, input.isTouch ? 'TOCA LA PANTALLA' : 'PRESIONA CUALQUIER BOTÓN', W / 2, 100, '#f4f4f0', { align: 'center', outline: '#101018' });
      if (CONFIG.marathonDate) font.text(ctx, 'EL ESCAPE: ' + countdownText(), W / 2, 164, '#5adcf0', { align: 'center', outline: '#101018' });
      return;
    }
    if (this.mode === 'menu') {
      const items = this.items();
      items.forEach((it, i) => {
        const y = 84 + i * 11, sel = i === this.sel;
        font.text(ctx, sel ? '► ' + it.t + ' ◄' : it.t, W / 2, y, sel ? '#ffd23f' : '#f4f4f0', { align: 'center', outline: '#101018' });
      });
      if (CONFIG.marathonDate) font.text(ctx, 'EL ESCAPE: ' + countdownText(), W / 2, 168, '#5adcf0', { align: 'center', outline: '#101018' });
    }
    if (this.mode === 'options') drawOptions(ctx, this.opt, 90);
    if (this.mode === 'controls') drawControls(ctx);
    if (this.mode === 'slots') {
      ctx.fillStyle = 'rgba(8,8,20,0.92)'; ctx.fillRect(40, 80, W - 80, 84);
      font.text(ctx, this.slotMode === 'load' ? 'CARGAR PARTIDA' : 'NUEVA PARTIDA — ELIGE RANURA', W / 2, 84, '#ffd23f', { align: 'center' });
      const slots = listSlots();
      slots.forEach((m, i) => {
        const y = 100 + i * 18, sel = i === this.slotSel;
        const txt = m ? `${i + 1}. ${m.chapter || '—'} · ${fmt(m.play)}` : `${i + 1}. VACÍA`;
        font.text(ctx, (sel ? '► ' : '  ') + txt, 54, y, sel ? '#ffd23f' : '#f4f4f0');
        if (m) font.text(ctx, new Date(m.t).toLocaleDateString('es-MX'), W - 54, y, '#a8a8b8', { align: 'right' });
      });
      if (this.confirm !== null && this.slotMode === 'new') font.text(ctx, '¿Sobrescribir? Presiona A otra vez', W / 2, 154, '#d8323c', { align: 'center' });
    }
  },
};
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
