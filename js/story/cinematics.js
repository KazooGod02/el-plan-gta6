// Little animated scenes from the story, played next to the credits.
// Each vignette paints into a 168x96 panel (floor at y = 80).
import * as font from '../core/font.js';
import { side } from '../data/sprites.js';
import { LOOKS } from '../data/cast.js';
import { drawProp } from '../interior/props.js';
import { drawSky } from '../interior/interior.js';

export const PW = 168, PH = 96;
const FL = 80;

const masked = (id, mask, bag) => ({ ...LOOKS[id], mask, bag, _id: 'cine_' + id + mask + (bag ? 'b' : '') });
const walk = (t, speed = 8) => ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(t * speed) % 4];
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
function person(c, look, frame, x, facing = 1, y = FL) { c.drawImage(side(look, frame, facing), Math.round(x - 10), Math.round(y - 24)); }
function ground(c, col, line) { R(c, 0, FL, PW, PH - FL, col); if (line) R(c, 0, FL, PW, 1, line); }
function sky(c, mode, t) {
  // drawSky paints the whole 320-wide screen; scale it into the panel
  c.save(); c.scale(PW / 320, FL / 150); drawSky(c, mode, t); c.restore();
}
function moto(c, x, y, t, smoke) {
  R(c, x, y - 7, 20, 3, '#d8323c'); R(c, x + 12, y - 12, 6, 5, '#d8323c'); R(c, x + 2, y - 10, 8, 3, '#1a1a1a');
  R(c, x + 16, y - 15, 2, 4, '#9a9aa6'); R(c, x - 1, y - 4, 6, 4, '#1a1a1a'); R(c, x + 16, y - 4, 6, 4, '#1a1a1a');
  if (smoke) for (let i = 0; i < 4; i++) { const k = (t * 1.5 + i / 4) % 1; c.globalAlpha = 1 - k; R(c, x - 4 - k * 14, y - 8 - k * 18, 3 + k * 5, 3 + k * 5, '#6a6a72'); c.globalAlpha = 1; }
}
function bubble(c, x, y, text) {
  const w = font.measure(text) + 6;
  x = Math.max(w / 2 + 2, Math.min(PW - w / 2 - 2, x));
  R(c, x - w / 2 - 1, y - 1, w + 2, 12, '#101018'); R(c, x - w / 2, y, w, 10, '#f4f4f0'); R(c, x - 1, y + 10, 3, 2, '#f4f4f0');
  font.text(c, text, x - w / 2 + 3, y + 2, '#101018');
}

export const VIGNETTES = [
  {
    cap: 'Día -21 · "Tenía 4.8 estrellas"',
    draw(c, t) {
      sky(c, 'day', t); ground(c, '#43434e', '#9a9aa6');
      for (let i = 0; i < PW; i += 24) R(c, i + 4, FL + 8, 12, 2, '#e8c040');
      const kick = Math.floor(t * 3) % 2;
      moto(c, 60, FL, t, true);
      person(c, 'kazoo', t > 1.2 ? (kick ? 'punch' : 'idle') : 'idle', 46, 1);
      if (t > 0.6) bubble(c, 50, 22, t > 2.8 ? '¡CUATRO PUNTO OCHO!' : '¡Ahorita no, bonita!');
    },
  },
  {
    cap: 'Día -20 · Coqui sale del penal',
    draw(c, t) {
      sky(c, 'day', t); ground(c, '#9a7a50');
      R(c, 96, 26, 72, 54, '#7a7a82'); R(c, 96, 26, 72, 3, '#5a5a64');
      for (let i = 100; i < 168; i += 12) R(c, i, 34, 6, 8, '#3a3a44');
      drawProp(c, { t: 'fence', w: 96 }, 0, FL, t);
      const cx = Math.min(112, 170 - t * 22);
      person(c, 'coqui', cx > 112 ? walk(t) : 'idle', cx, -1);
      const kx = Math.min(78, -20 + t * 40);
      person(c, 'kazoo', kx < 78 ? walk(t, 12) : 'idle', kx, 1);
      if (t > 3) bubble(c, cx, 20, 'Dos horas, Kazoo.');
    },
  },
  {
    cap: 'La Última Risa · Ghenghis',
    draw(c, t) {
      R(c, 0, 0, PW, FL, '#2a1038');
      for (let y = 0; y < FL; y += 6) for (let x = (y / 6) % 2 ? 0 : 8; x < PW; x += 16) R(c, x, y, 15, 1, '#3a1a4a');
      drawProp(c, { t: 'sign', text: 'LA ÚLTIMA RISA', neon: true, col: '#ff3cc8' }, 30, 16, t);
      ground(c, '#2a1a1a', '#1a0a0a');
      drawProp(c, { t: 'bar', w: 70 }, 90, FL, t);
      person(c, 'ghenghis', Math.floor(t * 4) % 2 ? 'idle' : 'hands', 60, 1);
      person(c, 'kazoo', 'idle', 36, 1);
      if (Math.floor(t * 2) % 2) font.text(c, 'JAJAJA', 64, 24 - (t * 4) % 6, '#ff7ae0', { align: 'center', outline: '#101018' });
    },
  },
  {
    cap: 'El plan · "Nadie improvisa"',
    draw(c, t) {
      R(c, 0, 0, PW, FL, '#5a5a5e');
      drawProp(c, { t: 'whiteboard', plan: true }, 54, 18, t);
      ground(c, '#3a3a3e', '#2a2a2e');
      person(c, 'coqui', t % 2 < 1 ? 'aim' : 'idle', 42, 1);
      person(c, 'kazoo', 'idle', 124, -1);
      person(c, 'ghenghis', Math.floor(t * 3) % 2 ? 'idle' : 'hands', 146, -1);
      if (t > 2) bubble(c, 42, 6, 'Nadie improvisa.');
    },
  },
  {
    cap: 'Día -1 · La azotea',
    draw(c, t) {
      sky(c, 'night', t);
      drawProp(c, { t: 'moon' }, 128, 8, t);
      c.save(); c.scale(0.55, 0.55); drawProp(c, { t: 'skyline', w: 320, col: '#1a1a3a' }, 0, FL / 0.55, t); c.restore();
      R(c, 0, FL - 4, PW, PH - FL + 4, '#4a4a54'); R(c, 0, FL - 4, PW, 1, '#6a6a74');
      person(c, 'coqui', 'sit', 56, 1, FL - 2); person(c, 'kazoo', 'sit', 82, 1, FL - 2); person(c, 'ghenghis', 'sit', 108, 1, FL - 2);
      if (t > 1.5) bubble(c, 82, 20, 'Por el plan.');
    },
  },
  {
    cap: 'Día 0 · El atraco',
    draw(c, t) {
      R(c, 0, 0, PW, FL, '#b0a898'); R(c, 0, 52, PW, 2, '#c8a040');
      drawProp(c, { t: 'vault', open: t > 1.4, spin: t * 6 }, 110, FL, t);
      ground(c, '#e8e0d0', '#c8c0b0');
      person(c, masked('kazoo', 'luchador'), 'aim', 40, 1);
      person(c, masked('ghenghis', 'payaso', true), t > 1.4 ? 'hands' : 'aim', 80, 1);
      if (t > 1.4) for (let i = 0; i < 8; i++) { const k = ((t - 1.4) * 0.8 + i / 8) % 1; R(c, 132 - k * 110 + Math.sin(i * 3 + t * 4) * 8, 40 - k * 20 + (k * k) * 60, 5, 3, '#46b450'); }
    },
  },
  {
    cap: 'La huida · Tsurito, no me falles',
    draw(c, t) {
      sky(c, 'day', t); ground(c, '#43434e', '#9a9aa6');
      for (let i = 0; i < PW + 30; i += 30) R(c, ((i - t * 160) % (PW + 30) + PW + 30) % (PW + 30) - 15, FL + 8, 14, 2, '#e8c040');
      const bob = Math.round(Math.sin(t * 20));
      drawProp(c, { t: 'tsuruside', col: '#d8d8d0' }, 70, FL + 2 + bob, t);
      for (let i = 0; i < 5; i++) { const k = (t * 1.2 + i / 5) % 1; c.globalAlpha = 1 - k; R(c, 64 - k * 40, FL - 12 - k * 20, 3 + k * 6, 3 + k * 6, '#2a2a30'); c.globalAlpha = 1; }
      // patrol car right behind, lights flashing
      const f = Math.floor(t * 6) % 2, px = -34 + Math.sin(t * 1.3) * 6;
      drawProp(c, { t: 'carside', col: '#f4f4f0' }, px, FL + 2, t);
      R(c, px + 12, FL - 22, 32, 3, '#1e2c50');
      R(c, px + 24, FL - 25, 5, 3, f ? '#ff3c3c' : '#5a1a1a'); R(c, px + 30, FL - 25, 5, 3, f ? '#1a2a5a' : '#3c6cff');
      c.globalAlpha = 0.25; R(c, px + 10, FL - 40, 40, 20, f ? '#ff3c3c' : '#3c6cff'); c.globalAlpha = 1;
      font.text(c, '★★★★', 150, 6, '#ffd23f', { align: 'right', outline: '#101018' });
    },
  },
  {
    cap: 'El árbol solitario · Plan B',
    draw(c, t) {
      sky(c, 'dusk', t); ground(c, '#6f9a3e', '#5a8030');
      drawProp(c, { t: 'bigtree' }, 96, FL, t);
      drawProp(c, { t: 'hole', d: 6 }, 64, FL, t);
      person(c, 'ghenghis', Math.floor(t * 2.5) % 2 ? 'punch' : 'idle', 54, 1);
      drawProp(c, { t: 'shovel' }, 66 + (Math.floor(t * 2.5) % 2 ? 2 : 0), FL - 2, t);
      drawProp(c, { t: 'bag' }, 80, FL, t);
      drawProp(c, { t: 'grassfg', w: PW }, 0, PH, t);
    },
  },
];
