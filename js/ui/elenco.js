// EDICIÓN ELENCO — extras that only exist in the desktop .exe (window.desktop):
// the trailer script with your own lines highlighted, and a chapter select.
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp } from '../core/util.js';
import { portrait } from '../data/sprites.js';
import { LOOKS } from '../data/cast.js';
import { UI } from './ui.js';
import { MISSIONS, CHAPTERS } from '../story/missions/index.js';
import { runner } from '../story/script.js';
import { MAP } from '../world/map.js';

export const CAST = typeof window !== 'undefined' && !!window.desktop;

// ---------------------------------------------------------------- the trailer script
// d: stage direction · s: scene header · [who, line]
// the trailer script lives in libreto-data.js, which is NOT in the public repo; it's only packed into the .exe
let LIBRETO = null;

const ROLES = ['KAZOO', 'KUISS', 'GHENGHIS'];
const ROLE_LOOK = { KAZOO: 'kazoo', KUISS: 'coqui', GHENGHIS: 'ghenghis' };
const ROLE_COL = { KAZOO: '#e0a82e', KUISS: '#5a8ce0', GHENGHIS: '#e0504a', POLICÍA: '#9ab0e0' };

let layout = null, layoutW = 0;
function buildLayout() {
  const out = [];
  const TW = W - 44;
  for (const b of LIBRETO) {
    if (b.s) { out.push({ gap: 6 }); out.push({ txt: b.s, kind: 's' }); continue; }
    if (b.d) { font.wrap(b.d, TW).forEach((l) => out.push({ txt: l, kind: 'd' })); continue; }
    const [who, line] = b;
    out.push({ txt: who, kind: 'who', who });
    font.wrap(line, TW - 10).forEach((l) => out.push({ txt: l, kind: 'line', who }));
  }
  return out;
}

export const libreto = {
  name: 'libreto', song: null,
  enter() { this.scroll = 0; this.role = G.settings.castRole ?? 0; if (!layout) import('./libreto-data.js').then((m) => { LIBRETO = m.LIBRETO; layout = buildLayout(); }).catch(() => { layout = [{ txt: 'El libreto solo viene en la Edición Elenco.', kind: 'd' }]; }); UI.hud = false; UI.fade = 0; UI.fadeTarget = 0; },
  update(dt) {
    const sp = (input.down('run') ? 260 : 110) * dt;
    if (input.down('down') || input.ay > 0.4) this.scroll += sp;
    if (input.down('up') || input.ay < -0.4) this.scroll -= sp;
    if (input.mouse.wheel) { this.scroll += input.mouse.wheel * 30; input.mouse.wheel = 0; }
    if (input.pressed('right')) { this.role = (this.role + 1) % ROLES.length; G.settings.castRole = this.role; audio.sfx('move'); }
    if (input.pressed('left')) { this.role = (this.role + ROLES.length - 1) % ROLES.length; G.settings.castRole = this.role; audio.sfx('move'); }
    // A jumps to your next line
    if (input.pressed('a')) {
      const me = ROLES[this.role];
      let y = 0, target = null;
      for (const l of layout || []) { const h = l.gap || 9; if (l.kind === 'who' && l.who === me && y > this.scroll + 2) { target = y; break; } y += h; }
      if (target !== null) { this.scroll = target - 6; audio.sfx('blip'); }
    }
    this.scroll = clamp(this.scroll, 0, Math.max(0, this.total - (H - 56)));
    if (input.pressed('back') || input.pressed('b') || input.pressed('pause')) { audio.sfx('back'); setScene('title'); }
  },
  render(ctx) {
    ctx.fillStyle = '#f2ead6'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e4d8bc'; for (let y = 34; y < H; y += 9) ctx.fillRect(0, y, W, 1);
    const me = ROLES[this.role];
    let y = 34 - this.scroll, total = 0;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 30, W, H - 42); ctx.clip();
    for (const l of layout || []) {
      const h = l.gap || 9;
      if (y > 20 && y < H && l.txt) {
        if (l.kind === 's') { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(14, y - 1, W - 28, 9); font.text(ctx, l.txt, 18, y, '#ffd23f'); }
        else if (l.kind === 'd') font.text(ctx, l.txt, 22, y, '#7a6a5a');
        else if (l.kind === 'who') {
          if (l.who === me) { ctx.fillStyle = 'rgba(255,210,63,0.55)'; ctx.fillRect(14, y - 1, W - 28, 9); }
          font.text(ctx, l.txt, 22, y, ROLE_COL[l.who] ? shadeDark(ROLE_COL[l.who]) : '#1a1a2e');
        } else {
          if (l.who === me) { ctx.fillStyle = 'rgba(255,210,63,0.35)'; ctx.fillRect(14, y - 1, W - 28, 9); }
          font.text(ctx, l.txt, 32, y, '#1a1a2e');
        }
      }
      y += h; total += h;
    }
    ctx.restore();
    this.total = total;
    // header
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, 30);
    font.text(ctx, 'LIBRETO — "EL ESCAPE"', 8, 4, '#ffd23f');
    font.text(ctx, 'Tus líneas:', 8, 16, '#a8a8b8');
    ROLES.forEach((r, i) => {
      const x = 62 + i * 58, sel = i === this.role;
      if (sel) { ctx.fillStyle = ROLE_COL[r]; ctx.fillRect(x - 3, 13, 54, 12); }
      font.text(ctx, r, x + 24, 16, sel ? '#101018' : ROLE_COL[r], { align: 'center' });
    });
    ctx.drawImage(portrait(ROLE_LOOK[me], 'serious'), W - 30, 1, 28, 28);
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, H - 12, W, 12);
    font.text(ctx, '◄► personaje  ▲▼ leer  ' + input.btn('a') + ': tu siguiente línea  ' + input.btn('back') + ': salir', W / 2, H - 9, '#c8c8d8', { align: 'center' });
  },
};
function shadeDark(hex) { const n = parseInt(hex.slice(1), 16); const f = 0.6; return '#' + [16, 8, 0].map((s) => Math.round(((n >> s) & 255) * f).toString(16).padStart(2, '0')).join(''); }

// ---------------------------------------------------------------- chapter select
export function startChapter(ch) {
  const story = G.story;
  story.init();
  story.newGame(false);
  runner.cancelWhere(() => true);
  story.active = null; G.lockInput = 0;
  const s = G.state;
  s.done = MISSIONS.filter((m) => m.chapter < ch).map((m) => m.id);
  s.unlocked = { afueras: ch >= 1, centro: ch >= 2, puerto: ch >= 3 };
  G.scenes.city.setUnlocked(s.unlocked);
  s.chapter = ch; s.chapterName = CHAPTERS[ch].short;
  s.money = [120, 300, 500, 1500, 1200, 900, 800, 800, 600, 600][ch] || 500;
  if (ch >= 3) s.weapons = { pistol: 48 };
  if (ch >= 6) s.flags.planB = true;
  G.settings.lastSlot = 2; // rehearsals save to slot 3, so the main run stays safe
  const p = MAP.places.pension;
  setScene('city', { x: p.x, y: p.y + 10, a: Math.PI / 2 });
  UI.hud = true; UI.fade = 1; UI.fadeTarget = 0;
  story.refreshTriggers(true);
}
export { CHAPTERS, LOOKS };
