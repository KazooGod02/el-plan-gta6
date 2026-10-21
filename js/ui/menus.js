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
import { SONGS } from '../data/music.js';
import { trailerCode } from '../story/trailer.js';
import { CAST, CHAPTERS, startChapter } from './elenco.js';

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
  font.text(ctx, '◄ ► cambiar · {BACK} regresar', W / 2, y0 + 82, '#a8a8b8', { align: 'center' });
}

const CONTROLS = [
  ['MOVER', 'WASD / Flechas', 'Joystick', 'Stick izq. / Cruceta', 'WASD (apunta con el ratón)'],
  ['ACCIÓN / HABLAR / SUBIR AL CARRO', 'E / Enter', 'A', 'a', 'a'],
  ['GOLPEAR / DISPARAR / FRENO DE MANO', 'Espacio / J', 'B', 'b', 'b'],
  ['CORRER / CLAXON', 'Shift', 'Stick al fondo', 'run', 'run'],
  ['AGACHARSE / CUBRIRSE (interiores)', 'S / Abajo', 'Abajo', 'Abajo', 'S'],
  ['CAMBIAR ARMA / RADIO', 'Q', '🔫', 'weapon', 'weapon'],
  ['TELÉFONO', 'Tab / T', '📱', 'phone', 'phone'],
  ['MAPA (waypoint e índice)', 'M', 'Cel > Mapa', 'map', 'map'],
  ['PAUSA', 'Esc / P', 'II', 'pause', 'pause'],
];
const ACTS = ['a', 'b', 'run', 'weapon', 'phone', 'map', 'pause'];
function drawControls(ctx) {
  ctx.fillStyle = 'rgba(8,8,20,0.95)'; ctx.fillRect(10, 10, W - 20, H - 20);
  font.text(ctx, 'CÓMO JUGAR', W / 2, 16, '#ffd23f', { align: 'center' });
  const d = input.lastDevice;
  const col = d === 'pad' ? 3 : d === 'mouse' ? 4 : input.isTouch ? 2 : 1;
  const dev = { 1: 'TECLADO', 2: 'TÁCTIL', 3: input.padType === 'ps' ? 'CONTROL PLAYSTATION' : 'CONTROL XBOX', 4: 'TECLADO + RATÓN' }[col];
  font.text(ctx, dev + ' (cambia solo según lo que uses)', W / 2, 24, '#a8a8b8', { align: 'center' });
  CONTROLS.forEach((row, i) => {
    const y = 34 + i * 12;
    let v = row[col];
    if (ACTS.includes(v)) v = input.btn(v);
    font.text(ctx, row[0], 18, y, '#f4f4f0');
    font.text(ctx, v.replace('🔫', 'botón arma').replace('📱', 'botón cel'), W - 18, y, '#5adcf0', { align: 'right' });
  });
  font.text(ctx, 'Maneja: {DRIVE}. {B} = freno de mano.', W / 2, 148, '#a8a8b8', { align: 'center' });
  font.text(ctx, 'Sigue la flecha y la ruta del radar. ? = extraños y locos.', W / 2, 158, '#ffd23f', { align: 'center' });
}

// ---------------------------------------------------------------- TITLE
// First a fake PC boot (BIOS checks, "abriendo MAINGAME.EXE"), then the menu over a
// beach at sunset. Nothing on this screen gives the story away.
const BOOT = [
  [0.0, 'PV-BIOS v2.06   (C) 2003 PUERTO VICIO SYSTEMS INC.', '#c8c8d0'],
  [0.5, 'PROCESADOR: 8-BIT @ 4.77 MHz ............ OK', '#a8a8b8'],
  [0.9, 'MEMORIA: 640K .............................. OK', '#a8a8b8'],
  [1.3, 'DETECTANDO UNIDADES ....................... C: D:', '#a8a8b8'],
  [1.8, 'TARJETA DE VIDEO: VGA 320x180 ............. OK', '#a8a8b8'],
  [2.3, 'SONIDO: CHIPTUNE 4 CANALES ................ OK', '#a8a8b8'],
  [3.0, 'C:\\> INICIALIZANDO...', '#f4f4f0'],
  [3.8, 'C:\\> ABRIENDO MAINGAME.EXE', '#f4f4f0'],
  ...(CAST ? [[4.1, 'C:\\> EDICIÓN ELENCO: KAZOO · KUISS · GHENGHIS', '#ffd23f']] : []),
];
const BOOT_END = 6.2;
let comboBuf = '';

export const title = {
  name: 'title',
  song: 'title',
  enter() {
    this.t = 0; this.sel = 0; this.mode = G.titleStarted ? 'menu' : 'boot'; this.opt = { sel: 0 }; this.slotSel = 0; this.confirm = null;
    this.song = this.mode === 'boot' ? null : 'title';
    comboBuf = '';
    UI.fade = this.mode === 'boot' ? 0 : 1; UI.fadeTarget = 0; UI.hud = false; UI.letterbox = 0; UI.letterboxTarget = 0; UI.objective = ''; UI.dialog = null;
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
    if (CAST) out.push({ id: 'chapters', t: 'CAPÍTULOS' }, { id: 'ensayo', t: 'ENSAYO: EL ESCAPE' }, { id: 'libreto', t: 'LIBRETO DEL TRÁILER' });
    out.push({ id: 'options', t: 'OPCIONES' }, { id: 'controls', t: 'CÓMO JUGAR' }, { id: 'credits', t: 'CRÉDITOS' });
    if (CAST) out.push({ id: 'quit', t: 'SALIR' });
    return out;
  },
  toMenu() { G.titleStarted = true; this.mode = 'menu'; this.t = 0; this.song = 'title'; UI.fade = 1; UI.fadeTarget = 0; audio.init(); },
  // the secret: a button sequence typed on the menu
  combo() {
    for (const [a, l] of [['up', 'U'], ['down', 'D'], ['left', 'L'], ['right', 'R'], ['a', 'A'], ['b', 'B']]) if (input.pressed(a)) comboBuf = (comboBuf + l).slice(-9);
    if (comboBuf.length === 9 && trailerCode(comboBuf)) { comboBuf = ''; input.consume('a'); audio.sfx('star'); setScene('trailer'); return true; }
    return false;
  },
  update(dt) {
    this.t += dt;
    if (audio.songName !== this.song && !G.state) { if (this.song) audio.play(this.song, SONGS); else audio.stop(); }
    if (this.mode === 'boot') {
      const before = BOOT.filter((b) => b[0] <= this.t - dt).length, now = BOOT.filter((b) => b[0] <= this.t).length;
      if (now > before) audio.sfx('type');
      if (this.t > 0.3 && (input.pressed('a') || input.pressed('b') || input.pressed('pause'))) { input.consume('a'); this.toMenu(); return; }
      if (this.t > BOOT_END) this.toMenu();
      return;
    }
    if (this.mode === 'options') { if (updateOptions(this.opt)) this.mode = 'menu'; return; }
    if (this.mode === 'controls' || this.mode === 'credits') { if (input.cancel() || input.pressed('a')) this.mode = 'menu'; return; }
    if (this.mode === 'chapters') {
      if (input.pressed('down')) { this.chSel = (this.chSel + 1) % CHAPTERS.length; audio.sfx('move'); }
      if (input.pressed('up')) { this.chSel = (this.chSel + CHAPTERS.length - 1) % CHAPTERS.length; audio.sfx('move'); }
      if (input.cancel()) { this.mode = 'menu'; audio.sfx('back'); }
      if (input.pressed('a')) { audio.sfx('select'); startChapter(this.chSel); }
      return;
    }
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
    if (this.combo()) return;
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
      else if (it.id === 'chapters') { this.mode = 'chapters'; this.chSel = this.chSel || 0; }
      else if (it.id === 'ensayo') setScene('trailer');
      else if (it.id === 'libreto') setScene('libreto');
      else if (it.id === 'quit') window.desktop.quit();
    }
  },
  render(ctx) {
    const t = this.t;
    if (this.mode === 'boot') { drawBoot(ctx, t); return; }
    drawBeach(ctx, G.time);
    // logo: centered, clean
    const lx = W / 2;
    font.text(ctx, 'EL PLAN', lx + 2, 14 + 2, 'rgba(20,6,30,0.6)', { align: 'center', scale: 4 });
    font.text(ctx, 'EL PLAN', lx, 14, '#fff4e0', { align: 'center', scale: 4, outline: '#2a0a2a' });
    ctx.fillStyle = '#ff3cc8'; ctx.fillRect(lx - 44, 46, 88, 1);
    font.text(ctx, CAST ? 'PUERTO VICIO · EDICIÓN ELENCO' : 'PUERTO VICIO', lx, 50, '#ffd890', { align: 'center', outline: '#2a0a2a' });
    ctx.globalAlpha = 0.6;
    font.text(ctx, '@KazooGod02', W - 5, H - 11, '#f4f4f0', { align: 'right', outline: '#101018' });
    ctx.globalAlpha = 1;
    if (CONFIG.marathonDate) font.text(ctx, 'EL ESCAPE: ' + countdownText(), 5, H - 11, '#5adcf0', { outline: '#101018' });
    if (this.mode === 'menu') {
      const items = this.items();
      const step = items.length > 9 ? 10 : items.length > 7 ? 11 : 13, bw = 132, y0 = Math.max(64, Math.round(H / 2 + 12 - (items.length * step) / 2));
      ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.fillRect(Math.round(lx - bw / 2), y0 - 7, bw, items.length * step + 9);
      this.selY = this.selY ?? y0;
      this.selY += (y0 + this.sel * step - this.selY) * 0.3;
      const hy = Math.round(this.selY) - 3;
      const hh = step - 1;
      ctx.fillStyle = 'rgba(255,210,63,0.18)'; ctx.fillRect(Math.round(lx - bw / 2), hy, bw, hh);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(Math.round(lx - bw / 2), hy, 2, hh); ctx.fillRect(Math.round(lx + bw / 2) - 2, hy, 2, hh);
      items.forEach((it, i) => {
        const sel = i === this.sel;
        font.text(ctx, it.t, lx, y0 + i * step, sel ? '#ffd23f' : '#f4f4f0', { align: 'center', outline: '#101018' });
      });
    }
    if (this.mode === 'options') drawOptions(ctx, this.opt, 90);
    if (this.mode === 'controls') drawControls(ctx);
    if (this.mode === 'chapters') {
      const bx = Math.round(lx - 110);
      ctx.fillStyle = 'rgba(8,8,20,0.94)'; ctx.fillRect(bx, 58, 220, 118);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx, 58, 2, 118);
      font.text(ctx, 'CAPÍTULOS (se guarda en la ranura 3)', bx + 8, 62, '#ffd23f');
      CHAPTERS.forEach((c, i) => {
        const sel = i === this.chSel;
        font.text(ctx, (sel ? '► ' : '  ') + c.label + ' · ' + c.title, bx + 8, 74 + i * 10, sel ? '#ffd23f' : '#f4f4f0');
      });
    }
    if (this.mode === 'slots') {
      const bx = Math.round(lx - 104);
      ctx.fillStyle = 'rgba(8,8,20,0.94)'; ctx.fillRect(bx, 64, 208, 100);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx, 64, 2, 100);
      font.text(ctx, this.slotMode === 'load' ? 'CARGAR PARTIDA' : 'NUEVA PARTIDA: ELIGE RANURA', bx + 8, 70, '#ffd23f');
      const slots = listSlots();
      slots.forEach((m, i) => {
        const y = 86 + i * 18, sel = i === this.slotSel;
        const txt = m ? `${i + 1}. ${m.chapter || '—'} · ${fmt(m.play)}` : `${i + 1}. VACÍA`;
        font.text(ctx, (sel ? '► ' : '  ') + txt, bx + 8, y, sel ? '#ffd23f' : '#f4f4f0');
        if (m) font.text(ctx, new Date(m.t).toLocaleDateString('es-MX'), bx + 200, y + 9, '#a8a8b8', { align: 'right' });
      });
      if (this.confirm !== null && this.slotMode === 'new') font.text(ctx, '¿Sobrescribir? Presiona {A} otra vez', bx + 8, 150, '#d8323c');
    }
  },
};

// a 2003 PC booting up
function drawBoot(ctx, t) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let y = 10;
  for (const [at, txt, col] of BOOT) {
    if (t < at) break;
    const n = Math.min(txt.length, Math.floor((t - at) * 60));
    font.text(ctx, txt.slice(0, n), 8, y, col);
    y += 12;
  }
  // a little logo in the corner, like the old BIOS screens
  ctx.fillStyle = '#1e6e9e'; ctx.fillRect(W - 46, 8, 38, 22); ctx.fillStyle = '#ffd23f'; ctx.fillRect(W - 42, 12, 30, 2);
  font.text(ctx, 'PV', W - 27, 17, '#f4f4f0', { align: 'center' });
  if (t > 4.3) {
    const k = clamp((t - 4.3) / 1.5, 0, 1);
    font.text(ctx, 'CARGANDO', 8, y + 6, '#f4f4f0');
    ctx.strokeStyle = '#a8a8b8'; ctx.strokeRect(60.5, y + 5.5, 150, 8);
    ctx.fillStyle = '#c8c8d0'; for (let i = 0; i < Math.floor(k * 24); i++) ctx.fillRect(62 + i * 6, y + 7, 5, 5);
  }
  if (Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(8, y + (t > 4.3 ? 20 : 0), 5, 7); }
  font.text(ctx, 'Presiona cualquier tecla para saltar', W / 2, H - 12, '#4a4a5a', { align: 'center' });
}

// sunset over the bay: sky, sun, sea, sand and palm trees
function drawBeach(ctx, t) {
  const hz = 104;
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#2a1650'); sky.addColorStop(0.45, '#c8508a'); sky.addColorStop(1, '#ffb070');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz);
  ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(W / 2, hz - 2, 26, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,150,0.35)'; ctx.beginPath(); ctx.arc(W / 2, hz - 2, 38, Math.PI, 0); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,220,230,0.22)'; ctx.fillRect(Math.round(((i * 97 + t * (4 + i)) % (W + 80)) - 60), 30 + i * 13, 50 + i * 10, 3); }
  // far skyline of the city across the bay
  ctx.fillStyle = '#3a1a4a';
  for (let x = 0; x < W; x += 9) { const h = 4 + ((x * 37) % 13); if (x < 90 || x > 230) ctx.fillRect(x, hz - h, 8, h); }
  // sea with the sun's reflection
  const sea = ctx.createLinearGradient(0, hz, 0, 146);
  sea.addColorStop(0, '#d86a8a'); sea.addColorStop(1, '#2a3a7a');
  ctx.fillStyle = sea; ctx.fillRect(0, hz, W, 46);
  for (let i = 0; i < 16; i++) {
    const yy = hz + 2 + i * 3, w = 40 - i * 2;
    ctx.fillStyle = 'rgba(255,230,180,0.5)'; ctx.fillRect(Math.round(W / 2 - w / 2 + Math.sin(t * 2 + i) * 3), yy, w, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 24; i++) { const yy = hz + 6 + ((i * 7) % 38), xx = ((i * 53 + t * 8) % (W + 20)) - 10; ctx.fillRect(Math.round(xx), yy, 6, 1); }
  // sand and the waves rolling in
  const wave = Math.sin(t * 1.4) * 2;
  ctx.fillStyle = '#e8c890'; ctx.fillRect(0, 146 + wave, W, H - 146);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, Math.round(146 + wave), W, 1);
  ctx.fillStyle = '#d8b478'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 41) % W, 152 + ((i * 13) % 26), 2, 1);
  palm(ctx, 26, H, 1, t); palm(ctx, 62, H + 6, 0.8, t + 1); palm(ctx, W - 30, H, 1.05, t + 2); palm(ctx, W - 70, H + 8, 0.75, t + 3);
}
function palm(ctx, x, y, s, t) {
  const sway = Math.sin(t * 0.9) * 2 * s;
  ctx.fillStyle = '#1a0e1e';
  for (let i = 0; i < 26; i++) { const k = i / 26; ctx.fillRect(Math.round(x + Math.sin(k * 1.6) * 10 * s + sway * k), Math.round(y - i * 3.2 * s), Math.max(2, Math.round(5 * s * (1 - k * 0.5))), Math.ceil(3.4 * s)); }
  const tx = x + Math.sin(1.6) * 10 * s + sway, ty = y - 26 * 3.2 * s;
  for (const a of [-2.6, -2.0, -1.3, -0.6, 0.1, 0.6]) {
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * 18 * s, ty + Math.sin(a) * 14 * s - 6 * s, tx + Math.cos(a) * 30 * s, ty + Math.sin(a) * 10 * s + 8 * s);
    ctx.lineWidth = 3 * s; ctx.strokeStyle = '#1a0e1e'; ctx.stroke();
  }
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
  // "REINICIAR MISIÓN" only shows up while a mission is running
  items() {
    const it = ['CONTINUAR'];
    if (G.story?.active && !G.story.dying) it.push('REINICIAR MISIÓN');
    it.push('CÓMO JUGAR', 'OPCIONES', 'SALIR AL MENÚ');
    return it;
  },
  update() {
    if (!this.open) return;
    if (this.mode === 'options') { if (updateOptions(this.opt)) this.mode = 'menu'; return; }
    if (this.mode === 'controls') { if (input.cancel() || input.pressed('a')) this.mode = 'menu'; return; }
    const items = this.items();
    this.sel = clamp(this.sel, 0, items.length - 1);
    if (input.pressed('down')) { this.sel = (this.sel + 1) % items.length; this.confirm = false; audio.sfx('move'); }
    if (input.pressed('up')) { this.sel = (this.sel + items.length - 1) % items.length; this.confirm = false; audio.sfx('move'); }
    if (input.pressed('pause') || input.pressed('back')) { this.toggle(); return; }
    if (input.pressed('a')) {
      audio.sfx('select');
      const item = items[this.sel];
      if (item === 'CONTINUAR') this.toggle();
      if (item === 'CÓMO JUGAR') this.mode = 'controls';
      if (item === 'OPCIONES') { this.mode = 'options'; this.opt.sel = 0; }
      if (item === 'REINICIAR MISIÓN') { if (!this.confirm) { this.confirm = true; return; } this.open = false; G.paused = false; input.consume('a'); G.story.restartMission(); }
      if (item === 'SALIR AL MENÚ') { if (!this.confirm) { this.confirm = true; return; } this.open = false; G.paused = false; G.quitToTitle(); }
    }
  },
  render(ctx) {
    if (!this.open) return;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    if (this.mode === 'options') { drawOptions(ctx, this.opt); return; }
    if (this.mode === 'controls') { drawControls(ctx); return; }
    font.text(ctx, 'PAUSA', W / 2, 36, '#ffd23f', { align: 'center', scale: 3, outline: '#101018' });
    const items = this.items();
    items.forEach((t, i) => {
      const sel = i === this.sel;
      font.text(ctx, sel ? '► ' + t + ' ◄' : t, W / 2, 70 + i * 14, sel ? '#ffd23f' : '#f4f4f0', { align: 'center', outline: '#101018' });
    });
    if (this.confirm) {
      const msg = items[this.sel] === 'REINICIAR MISIÓN' ? 'La misión empieza de nuevo. {A} para confirmar.' : 'Lo no guardado se pierde. {A} para confirmar.';
      font.text(ctx, msg, W / 2, 144, '#d8323c', { align: 'center', outline: '#101018' });
    }
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
  ['REPARTO', 'h'], ['KAZOO — Kazoo', ''], ['KUISS — Kuiss', ''], ['GHENGHIS — Ghenghis', ''], ['', ''],
  ['TAMBIÉN APARECEN', 'h'], ['El Jefe (de espaldas) · Doña Mari', ''], ['La Tía Gris', ''], ['El Tuercas · Comandante Reyes', ''], ['VendeRápido_5E (5 estrellas)', ''], ['', ''],
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
    font.text(ctx, '{A}: adelantar', 4, H - 10, '#4a4a6a');
  },
};
const VIG_T = 5.4;
