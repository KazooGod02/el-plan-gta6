// Full-screen map of Puerto Vicio: pan, zoom, drop a waypoint, and an index of places.
import { G, W, H } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp } from '../core/util.js';
import { MAP, TS, MW, MH, zoneOf, ZONE_NAMES } from '../world/map.js';
import { gpsTrace } from '../world/city.js';
import { UI } from './ui.js';

const MAPW = 214;                 // map viewport width (the index panel takes the rest)
const ZOOMS = [1.2, 2, 3];        // screen px per tile
const CATS = [
  ['todo', 'TODO'], ['mision', 'MISIONES'], ['ropa', 'ROPA'], ['comida', 'COMIDA'], ['bar', 'BARES'], ['tienda', 'TIENDAS'], ['servicio', 'SERVICIOS'], ['extra', 'EXTRAÑOS'], ['lugar', 'LUGARES'],
];

export const bigmap = {
  open: false,
  cx: 0, cy: 0, zoom: 1, focus: 'map', sel: 0, cat: 0, t: 0,

  show() {
    if (!G.state) return;
    const c = G.scenes.city;
    c.init();
    const p = c.pos();
    this.cx = p.x; this.cy = p.y; this.open = true; this.focus = 'map'; this.t = 0; this.sel = 0;
    G.paused = true;
    audio.sfx('phone');
  },
  hide() { this.open = false; G.paused = !!(G.phone && G.phone.open); audio.sfx('back'); },

  // everything listed in the index (and drawn on the map)
  entries() {
    const c = G.scenes.city, out = [];
    for (const m of c.markers) {
      if (m.hidden || m.noBlip) continue;
      const name = m.title ? m.label + ': ' + m.title : m.label || (m.mission ? 'Misión' : 'Objetivo');
      out.push({ name: (m.letter ? '[' + m.letter + '] ' : '') + titleCase(name), x: m.x, y: m.y, icon: m.letter || '!', color: m.color, kind: m.side ? 'extra' : 'mision' });
    }
    for (const p of MAP.pois) out.push(p);
    return out;
  },
  filtered() {
    const k = CATS[this.cat][0];
    return this.entries().filter((e) => k === 'todo' || e.kind === k);
  },

  update(dt) {
    this.t += dt;
    const c = G.scenes.city;
    if (input.pressed('phone') || input.pressed('map')) { this.hide(); return; }
    if (input.pressed('pause') || input.pressed('run')) { this.focus = this.focus === 'map' ? 'list' : 'map'; audio.sfx('move'); return; }
    if (input.pressed('weapon')) { this.zoom = (this.zoom + 1) % ZOOMS.length; audio.sfx('move'); }
    if (this.focus === 'list') {
      const list = this.filtered();
      if (input.pressed('back') || input.pressed('b')) { this.focus = 'map'; audio.sfx('back'); return; }
      if (input.pressed('down')) { this.sel = (this.sel + 1) % Math.max(1, list.length); audio.sfx('move'); }
      if (input.pressed('up')) { this.sel = (this.sel + Math.max(1, list.length) - 1) % Math.max(1, list.length); audio.sfx('move'); }
      if (input.pressed('left') || input.pressed('right')) { this.cat = (this.cat + (input.pressed('right') ? 1 : CATS.length - 1)) % CATS.length; this.sel = 0; audio.sfx('move'); }
      const e = list[this.sel];
      if (e) { this.cx += (e.x - this.cx) * Math.min(1, dt * 10); this.cy += (e.y - this.cy) * Math.min(1, dt * 10); }
      if (input.pressed('a') && e) { this.setWaypoint(e.x, e.y, e.name); this.focus = 'map'; }
      return;
    }
    if (input.pressed('back') || input.pressed('b')) { this.hide(); return; }
    const z = ZOOMS[this.zoom];
    const sp = (input.down('run') ? 2 : 1) * 160 / z * TS / 10;
    this.cx = clamp(this.cx + input.ax * sp * dt * 6, 0, MW * TS);
    this.cy = clamp(this.cy + input.ay * sp * dt * 6, 0, MH * TS);
    if (input.pressed('a')) {
      const w = c.waypoint;
      if (w && Math.hypot(w.x - this.cx, w.y - this.cy) < 10 * TS / z) { c.waypoint = null; UI.toast('Waypoint quitado', '#c878f0', 1.5); audio.sfx('back'); }
      else { const near = this.nearest(); this.setWaypoint(near ? near.x : this.cx, near ? near.y : this.cy, near ? near.name : null); }
    }
  },

  setWaypoint(x, y, name) {
    const c = G.scenes.city;
    c.waypoint = { x, y, name };
    c.gpsKey = null; c.gpsT = 0;
    UI.toast('Ruta marcada' + (name ? ': ' + name : ''), '#c878f0', 2);
    audio.sfx('select');
  },

  nearest() {
    const z = ZOOMS[this.zoom];
    let best = null, bd = 7 / z * TS;
    for (const e of this.entries()) { const d = Math.hypot(e.x - this.cx, e.y - this.cy); if (d < bd) { bd = d; best = e; } }
    return best;
  },

  // ------------------------------------------------ render
  render(ctx) {
    if (!this.open) return;
    const c = G.scenes.city, z = ZOOMS[this.zoom];
    ctx.fillStyle = '#070b12'; ctx.fillRect(0, 0, W, H);
    // view window (world px → screen)
    const vw = MAPW / z * TS, vh = H / z * TS;
    let ox = this.cx - vw / 2, oy = this.cy - vh / 2;
    if (vw >= MW * TS) ox = (MW * TS - vw) / 2; else ox = clamp(ox, 0, MW * TS - vw);
    if (vh >= MH * TS) oy = (MH * TS - vh) / 2; else oy = clamp(oy, 0, MH * TS - vh);
    const S = (x, y) => [(x - ox) / TS * z, (y - oy) / TS * z];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, MAPW, H); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    const [mx, my] = S(0, 0);
    ctx.drawImage(c.mini, mx, my, MW * z, MH * z);
    // locked zones
    const un = G.state.unlocked;
    const shadeZone = (x0, y0, x1, y1, zone) => {
      if (un[zone]) return;
      const [a, b] = S(x0 * TS, y0 * TS), [e, f] = S(x1 * TS, y1 * TS);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(a, b, e - a, f - b);
      font.text(ctx, 'BLOQUEADO', (a + e) / 2, (b + f) / 2 - 3, '#f08c28', { align: 'center', outline: '#101018' });
    };
    shadeZone(0, 0, 114, 54, 'centro'); shadeZone(118, 0, 164, 94, 'puerto'); shadeZone(0, 94, 176, 128, 'afueras');
    // route
    const g = c.gps;
    let route = c.gpsRoute;
    if (g && c.gpsField) route = gpsTrace(c.gpsField, c.pos().x, c.pos().y, 2000).route;
    if (route && route.length > 1) {
      ctx.strokeStyle = '#101018'; ctx.lineWidth = Math.max(2, z * 1.4); ctx.beginPath();
      route.forEach(([x, y], i) => { const [sx, sy] = S(x, y); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
      ctx.stroke(); ctx.strokeStyle = g.color || '#c878f0'; ctx.lineWidth = Math.max(1, z * 0.8); ctx.stroke(); ctx.lineWidth = 1;
    }
    // pickups
    for (const pk of c.worldPickups || []) {
      if (pk.taken) continue;
      const [sx, sy] = S(pk.x, pk.y);
      ctx.fillStyle = pk.kind === 'health' ? '#ff5a5a' : pk.kind === 'armor' ? '#5a9cff' : '#46d4c8';
      ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3);
    }
    // places & markers
    const list = this.entries();
    const hl = this.focus === 'list' ? this.filtered()[this.sel] : this.nearest();
    for (const e of list) {
      const [sx, sy] = S(e.x, e.y);
      if (sx < -8 || sy < -8 || sx > MAPW + 8 || sy > H + 8) continue;
      const locked = !un[zoneOf(Math.floor(e.x / TS), Math.floor(e.y / TS))] && zoneOf(Math.floor(e.x / TS), Math.floor(e.y / TS)) !== 'colonia';
      icon(ctx, Math.round(sx), Math.round(sy), e.icon, locked ? '#5a5a6a' : e.color, e === hl);
    }
    // waypoint
    if (c.waypoint) {
      const [sx, sy] = S(c.waypoint.x, c.waypoint.y);
      ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 12, 3, 12);
      ctx.fillStyle = '#c878f0'; ctx.fillRect(Math.round(sx), Math.round(sy) - 11, 1, 11); ctx.fillRect(Math.round(sx) + 1, Math.round(sy) - 11, 6, 5);
    }
    // player
    const p = c.pos();
    const [px, py] = S(p.x, p.y);
    const a = c.player.car ? c.player.car.a : c.player.a;
    ctx.fillStyle = '#101018'; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = Math.floor(this.t * 4) % 2 ? '#ffffff' : '#ffd23f';
    ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4); ctx.lineTo(px + Math.cos(a + 2.5) * 3, py + Math.sin(a + 2.5) * 3); ctx.lineTo(px + Math.cos(a - 2.5) * 3, py + Math.sin(a - 2.5) * 3); ctx.closePath(); ctx.fill();
    // cursor
    if (this.focus === 'map') {
      const [cx, cy] = S(this.cx, this.cy);
      ctx.fillStyle = '#f4f4f0';
      ctx.fillRect(Math.round(cx) - 6, Math.round(cy), 4, 1); ctx.fillRect(Math.round(cx) + 3, Math.round(cy), 4, 1);
      ctx.fillRect(Math.round(cx), Math.round(cy) - 6, 1, 4); ctx.fillRect(Math.round(cx), Math.round(cy) + 3, 1, 4);
      const near = this.nearest();
      const zn = ZONE_NAMES[zoneOf(Math.floor(this.cx / TS), Math.floor(this.cy / TS))];
      const label = near ? near.name : zn;
      const w = font.measure(label) + 8;
      const lx = clamp(Math.round(cx - w / 2), 2, MAPW - w - 2), ly = cy > 24 ? Math.round(cy) - 20 : Math.round(cy) + 10;
      ctx.fillStyle = 'rgba(8,8,18,0.88)'; ctx.fillRect(lx, ly, w, 11);
      font.text(ctx, label, lx + 4, ly + 2, near ? near.color || '#ffd23f' : '#c8c8d8');
    }
    ctx.restore();
    ctx.fillStyle = '#6a6a7a'; ctx.fillRect(MAPW, 0, 1, H);
    this.drawIndex(ctx);
  },

  drawIndex(ctx) {
    const x0 = MAPW + 1, w = W - x0;
    ctx.fillStyle = '#10121e'; ctx.fillRect(x0, 0, w, H);
    font.text(ctx, 'PUERTO VICIO', x0 + w / 2, 4, '#5adcf0', { align: 'center' });
    const listFocus = this.focus === 'list';
    ctx.fillStyle = listFocus ? '#2a2a4a' : '#1a1a2a'; ctx.fillRect(x0 + 3, 15, w - 6, 11);
    font.text(ctx, '◄ ' + CATS[this.cat][1] + ' ►', x0 + w / 2, 17, listFocus ? '#ffd23f' : '#a8a8b8', { align: 'center' });
    const list = this.filtered();
    const rows = 10, top = clamp(this.sel - 5, 0, Math.max(0, list.length - rows));
    list.slice(top, top + rows).forEach((e, k) => {
      const i = top + k, y = 30 + k * 11, sel = listFocus && i === this.sel;
      if (sel) { ctx.fillStyle = 'rgba(255,210,63,0.16)'; ctx.fillRect(x0 + 2, y - 1, w - 4, 11); }
      icon(ctx, x0 + 8, y + 4, e.icon, e.color, false);
      let name = e.name;
      while (font.measure(name) > w - 20 && name.length > 3) name = name.slice(0, -2) + '…';
      font.text(ctx, name, x0 + 15, y + 1, sel ? '#ffd23f' : '#d8d8e8');
    });
    if (!list.length) font.text(ctx, 'Nada por aquí', x0 + w / 2, 60, '#6a6a7a', { align: 'center' });
    // controls
    const hints = listFocus ? ['A: marcar ruta', '◄►: categoría', 'B: volver al mapa'] : ['A: waypoint  Q: zoom', 'II/Shift: índice', 'B: cerrar'];
    hints.forEach((h, i) => font.text(ctx, h, x0 + 4, H - 32 + i * 10, '#8a8aa0'));
  },
};

function icon(ctx, x, y, glyph, col, hl) {
  ctx.fillStyle = hl ? '#ffffff' : '#101018'; ctx.fillRect(x - 5, y - 5, 11, 11);
  ctx.fillStyle = col || '#ffd23f'; ctx.fillRect(x - 4, y - 4, 9, 9);
  font.text(ctx, glyph, x + 1, y - 3, '#101018', { align: 'center' });
}
function titleCase(s) { return String(s).toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()); }
