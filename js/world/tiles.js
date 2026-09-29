// Tile image generation + map rendering.
import { canvas, shade } from '../core/gfx.js';
import { hash2 } from '../core/util.js';
import { MAP, T, MW, MH, TS, tileAt, idx, zoneOf } from './map.js';
import * as font from '../core/font.js';

const registry = new Map();
const images = [];
let tileImg = null;

function reg(key, make) {
  let i = registry.get(key);
  if (i === undefined) { i = images.length; images.push(make()); registry.set(key, i); }
  return i;
}

function noise(x, col, seed, n, cA, cB) {
  for (let i = 0; i < n; i++) {
    const hx = Math.floor(hash2(seed, i * 7) * 16), hy = Math.floor(hash2(i * 13, seed) * 16);
    x.fillStyle = hash2(hx + seed, hy) < 0.5 ? cA : cB;
    x.fillRect(hx, hy, 1, 1);
  }
}

const GRASS_COL = { colonia: '#3f8f45', centro: '#3a8a48', puerto: '#5a8a4a', afueras: '#6f9a3e' };

function grassTile(zone, v) {
  const c = canvas(TS, TS), x = c.x;
  const base = GRASS_COL[zone];
  x.fillStyle = base; x.fillRect(0, 0, 16, 16);
  noise(x, base, v * 31 + 5, 14, shade(base, 0.82), shade(base, 1.12));
  if (v === 3) { x.fillStyle = shade(base, 1.2); x.fillRect(5, 9, 1, 2); x.fillRect(6, 8, 1, 1); x.fillStyle = '#f4f4f0'; x.fillRect(11, 4, 1, 1); }
  return c;
}

function roadTile(flags, bridge, v) {
  const c = canvas(TS, TS), x = c.x;
  const base = bridge ? '#4c4c58' : '#43434e';
  x.fillStyle = base; x.fillRect(0, 0, 16, 16);
  noise(x, base, v * 17 + 3, 10, shade(base, 0.85), shade(base, 1.12));
  if (flags & 1) { x.fillStyle = '#e8c040'; x.fillRect(2, 15, 7, 1); x.fillRect(2, 0, 0, 0); }
  if (flags & 2) { x.fillStyle = '#e8c040'; x.fillRect(15, 2, 1, 7); }
  if (flags & 4) { x.fillStyle = '#d8d8d8'; for (let i = 1; i < 16; i += 4) x.fillRect(3, i, 10, 2); }
  if (flags & 8) { x.fillStyle = '#d8d8d8'; for (let i = 1; i < 16; i += 4) x.fillRect(i, 3, 2, 10); }
  if (flags & 16) { x.fillStyle = '#9a9aa6'; x.fillRect(0, 0, 16, 2); x.fillStyle = '#6a6a76'; x.fillRect(0, 2, 16, 1); }
  if (flags & 32) { x.fillStyle = '#9a9aa6'; x.fillRect(0, 14, 16, 2); x.fillStyle = '#6a6a76'; x.fillRect(0, 13, 16, 1); }
  if (flags & 64) { x.fillStyle = '#9a9aa6'; x.fillRect(0, 0, 2, 16); x.fillStyle = '#6a6a76'; x.fillRect(2, 0, 1, 16); }
  if (flags & 128) { x.fillStyle = '#9a9aa6'; x.fillRect(14, 0, 2, 16); x.fillStyle = '#6a6a76'; x.fillRect(13, 0, 1, 16); }
  return c;
}

function sidewalkTile(mask, v) {
  const c = canvas(TS, TS), x = c.x;
  x.fillStyle = '#a4a4b0'; x.fillRect(0, 0, 16, 16);
  x.fillStyle = '#8e8e9c'; x.fillRect(0, 7, 16, 1); x.fillRect(7, 0, 1, 16); x.fillRect(15, 0, 1, 16); x.fillRect(0, 15, 16, 1);
  noise(x, '#a4a4b0', v * 11, 5, '#98989f', '#b0b0ba');
  x.fillStyle = '#6c6c78';
  if (mask & 1) x.fillRect(0, 0, 16, 2);
  if (mask & 2) x.fillRect(14, 0, 2, 16);
  if (mask & 4) x.fillRect(0, 14, 16, 2);
  if (mask & 8) x.fillRect(0, 0, 2, 16);
  return c;
}

function roofTile(b, mask, v) {
  const c = canvas(TS, TS), x = c.x;
  const col = b.roof, dk = shade(col, 0.7), lt = shade(col, 1.18);
  x.fillStyle = col; x.fillRect(0, 0, 16, 16);
  if (b.container) {
    x.fillStyle = dk; for (let i = 1; i < 16; i += 3) x.fillRect(i, 0, 1, 16);
  } else if (b.warehouse || b.rusty) {
    x.fillStyle = dk; for (let i = 0; i < 16; i += 4) x.fillRect(i, 0, 1, 16);
    if (b.rusty) { x.fillStyle = '#8c5030'; x.fillRect((v * 5) % 12, (v * 7) % 12, 3, 2); if (v === 2) { x.fillStyle = '#1a1a1a'; x.fillRect(6, 6, 3, 3); } }
  } else if (b.marble) {
    x.fillStyle = lt; x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
  } else {
    noise(x, col, v * 23 + 1, 8, shade(col, 0.9), lt);
    if (v === 1 && !b.fancy) { x.fillStyle = '#9a9aa6'; x.fillRect(4, 5, 6, 5); x.fillStyle = '#6a6a76'; x.fillRect(5, 6, 4, 1); x.fillRect(5, 8, 4, 1); }
    if (v === 2) { x.fillStyle = '#3c3c48'; x.fillRect(10, 3, 3, 3); }
    if (b.zone === 'colonia' && v === 3) { x.fillStyle = '#2c2c34'; x.fillRect(3, 3, 5, 4); x.fillStyle = '#3c64dc'; x.fillRect(4, 4, 3, 2); }
  }
  x.fillStyle = dk;
  if (mask & 1) x.fillRect(0, 0, 16, 2);
  if (mask & 2) x.fillRect(14, 0, 2, 16);
  if (mask & 8) x.fillRect(0, 0, 2, 16);
  x.fillStyle = lt;
  if (mask & 1) x.fillRect(mask & 8 ? 2 : 0, 2, 16, 1);
  return c;
}

function wallTile(b, xpos, door) {
  const c = canvas(TS, TS), x = c.x;
  const wcol = b.container ? shade(b.roof, 0.6) : b.police ? '#d8d8e0' : b.marble ? '#e8e8ec' : b.warehouse || b.rusty ? '#8a8a8e' : shade(b.roof, 0.55);
  x.fillStyle = shade(b.roof, 0.45); x.fillRect(0, 0, 16, 2);
  x.fillStyle = wcol; x.fillRect(0, 2, 16, 14);
  x.fillStyle = shade(wcol, 0.8); x.fillRect(0, 14, 16, 2);
  if (door) {
    if (b.garage) { x.fillStyle = '#5a5a64'; x.fillRect(1, 4, 14, 12); x.fillStyle = '#48484f'; for (let i = 5; i < 16; i += 2) x.fillRect(1, i, 14, 1); }
    else if (b.marble) { x.fillStyle = '#6a8cac'; x.fillRect(1, 4, 14, 12); x.fillStyle = '#c8a040'; x.fillRect(7, 4, 2, 12); }
    else { x.fillStyle = '#5a3218'; x.fillRect(4, 5, 8, 11); x.fillStyle = '#7a4a28'; x.fillRect(5, 6, 6, 10); x.fillStyle = '#ffd23f'; x.fillRect(9, 11, 1, 1); }
    if (b.awning) { x.fillStyle = b.awning; x.fillRect(0, 2, 16, 3); x.fillStyle = '#f4f4f0'; for (let i = 0; i < 16; i += 4) x.fillRect(i, 2, 2, 3); }
  } else if (!b.container) {
    x.fillStyle = b.warehouse ? '#6a6a70' : '#2c3c58';
    if (xpos % 2 === 0 || b.marble || b.police) { x.fillRect(3, 5, 4, 6); x.fillRect(10, 5, 4, 6); x.fillStyle = '#6a8cb0'; x.fillRect(3, 5, 2, 2); x.fillRect(10, 5, 2, 2); }
    else { x.fillRect(5, 5, 6, 6); x.fillStyle = '#6a8cb0'; x.fillRect(5, 5, 2, 2); }
    if (b.neon) { x.fillStyle = b.neon; x.fillRect(0, 12, 16, 1); }
  }
  return c;
}

function simpleTile(type, zone, v) {
  const c = canvas(TS, TS), x = c.x;
  const g = GRASS_COL[zone];
  switch (type) {
    case T.WATER: {
      const frames = [0, 1].map((f) => {
        const w = canvas(TS, TS);
        w.x.fillStyle = '#2a5a9e'; w.x.fillRect(0, 0, 16, 16);
        w.x.fillStyle = '#3c74b8';
        for (let i = 0; i < 4; i++) { const yy = (i * 4 + f * 2 + v) % 16; w.x.fillRect((i * 5 + v * 3 + f * 3) % 12, yy, 4, 1); }
        w.x.fillStyle = '#2a4c88'; w.x.fillRect((v * 7 + f * 5) % 14, (v * 3 + 9) % 16, 2, 1);
        return w;
      });
      return frames;
    }
    case T.TREE: {
      x.fillStyle = g; x.fillRect(0, 0, 16, 16);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(3, 5, 12, 11);
      const leaf = zone === 'afueras' ? '#2c6a2c' : '#2a7a3a';
      x.fillStyle = shade(leaf, 0.75); x.fillRect(2, 2, 12, 12); x.fillRect(1, 4, 14, 8); x.fillRect(4, 1, 8, 14);
      x.fillStyle = leaf; x.fillRect(3, 3, 10, 9); x.fillRect(2, 5, 12, 5);
      x.fillStyle = shade(leaf, 1.35); x.fillRect(4, 3, 3, 2); x.fillRect(8, 5, 2, 2); x.fillRect(4, 7, 2, 1);
      if (zone === 'colonia' || zone === 'puerto') {
        if (v === 2) { x.fillStyle = g; x.fillRect(0, 0, 16, 16); x.fillStyle = '#6a4a2a'; x.fillRect(7, 6, 2, 4); x.fillStyle = '#3c9a3c'; for (const [a, b2] of [[1, 3], [9, 2], [2, 9], [10, 9], [5, 1]]) x.fillRect(a, b2, 6, 3); x.fillStyle = '#58b458'; x.fillRect(6, 5, 4, 3); }
      }
      return c;
    }
    case T.BUSH: {
      x.fillStyle = g; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#2c6a30'; x.fillRect(3, 5, 10, 8); x.fillRect(5, 4, 6, 10);
      x.fillStyle = '#3c8a40'; x.fillRect(4, 6, 6, 4);
      if (v === 1) { x.fillStyle = '#f46eaa'; x.fillRect(6, 7, 1, 1); x.fillRect(9, 9, 1, 1); }
      return c;
    }
    case T.SAND: x.fillStyle = '#e2c68a'; x.fillRect(0, 0, 16, 16); noise(x, '', v * 3, 10, '#d0b070', '#f0d8a0'); return c;
    case T.DIRT: x.fillStyle = '#9a7048'; x.fillRect(0, 0, 16, 16); noise(x, '', v * 9, 12, '#80593a', '#b08458'); return c;
    case T.FIELD: {
      x.fillStyle = '#9aa83c'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#7a8a2c'; for (let i = 0; i < 7; i++) x.fillRect((i * 5 + v * 3) % 16, (i * 7 + v) % 12, 1, 4);
      x.fillStyle = '#c0c85a'; for (let i = 0; i < 5; i++) x.fillRect((i * 7 + v * 5 + 2) % 16, (i * 3 + v * 2) % 13, 1, 3);
      return c;
    }
    case T.PARKING: {
      x.fillStyle = '#4c4c56'; x.fillRect(0, 0, 16, 16); noise(x, '', v * 5, 8, '#44444e', '#56565f');
      x.fillStyle = '#d8d8d8'; if (v % 3 === 0) x.fillRect(0, 0, 1, 12);
      return c;
    }
    case T.FENCE: {
      x.fillStyle = zone === 'afueras' ? '#9a7048' : g; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#8a8a96'; for (let i = 0; i < 16; i += 3) { x.fillRect(i, 0, 1, 16); x.fillRect(0, i, 16, 1); }
      x.fillStyle = '#5a5a66'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1);
      return c;
    }
    case T.PLAZA: {
      x.fillStyle = '#c88a5e'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#b07448'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 8, 16, 1); x.fillRect(0, 0, 1, 8); x.fillRect(8, 8, 1, 8);
      return c;
    }
    case T.DOCK: {
      x.fillStyle = '#8c6a44'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#6e5234'; for (let i = 3; i < 16; i += 4) x.fillRect(0, i, 16, 1);
      x.fillStyle = '#3a2a1a'; x.fillRect((v * 5) % 14, 1, 1, 1); x.fillRect((v * 3 + 7) % 14, 9, 1, 1);
      return c;
    }
    case T.COURT: {
      x.fillStyle = '#2c8c5a'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#e8e8e8';
      if (v & 1) x.fillRect(0, 0, 16, 1); if (v & 2) x.fillRect(15, 0, 1, 16); if (v & 4) x.fillRect(0, 15, 16, 1); if (v & 8) x.fillRect(0, 0, 1, 16);
      if (v & 16) x.fillRect(7, 0, 2, 16);
      return c;
    }
    case T.BARRIER: {
      x.fillStyle = '#43434e'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#f4f4f0'; x.fillRect(0, 5, 16, 6);
      x.fillStyle = '#f08c28'; for (let i = 0; i < 16; i += 6) x.fillRect(i, 5, 3, 6);
      x.fillStyle = '#2a2a2a'; x.fillRect(2, 11, 2, 4); x.fillRect(12, 11, 2, 4);
      return c;
    }
    case T.FOUNTAIN: {
      x.fillStyle = '#c88a5e'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#d8d8e0'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#5a9ad8'; x.fillRect(2, 2, 12, 12);
      x.fillStyle = '#9ad0f0'; x.fillRect(5, 5, 3, 1); x.fillRect(9, 9, 3, 1);
      return c;
    }
    default:
      x.fillStyle = '#ff00ff'; x.fillRect(0, 0, 16, 16); return c;
  }
}

function computeKey(tx, ty) {
  const t = tileAt(tx, ty);
  const zone = zoneOf(tx, ty);
  const v = Math.floor(hash2(tx, ty) * 4);
  const i = idx(tx, ty);
  switch (t) {
    case T.GRASS: return reg('g' + zone + v, () => grassTile(zone, v));
    case T.ROAD: case T.BRIDGE: {
      const rh = MAP.rh[i], rv = MAP.rv[i];
      let f = 0;
      if (rh !== 255 && rv === 255) {
        if (rh === 1 && tx % 2 === 0) f |= 1;
        if (MAP.rv[idx(tx - 1, ty)] !== 255 && MAP.rh[idx(tx - 1, ty)] !== 255) f |= 8;
        if (MAP.rv[idx(tx + 1, ty)] !== 255 && MAP.rh[idx(tx + 1, ty)] !== 255) f |= 8;
      }
      if (rv !== 255 && rh === 255) {
        if (rv === 1 && ty % 2 === 0) f |= 2;
        if (MAP.rh[idx(tx, ty - 1)] !== 255 && MAP.rv[idx(tx, ty - 1)] !== 255) f |= 4;
        if (MAP.rh[idx(tx, ty + 1)] !== 255 && MAP.rv[idx(tx, ty + 1)] !== 255) f |= 4;
      }
      if (t === T.BRIDGE) {
        if (tileAt(tx, ty - 1) === T.WATER) f |= 16;
        if (tileAt(tx, ty + 1) === T.WATER) f |= 32;
        if (tileAt(tx - 1, ty) === T.WATER) f |= 64;
        if (tileAt(tx + 1, ty) === T.WATER) f |= 128;
      }
      return reg('r' + f + (t === T.BRIDGE ? 'b' : '') + v, () => roadTile(f, t === T.BRIDGE, v));
    }
    case T.SIDEWALK: {
      const r = (x, y) => { const q = tileAt(x, y); return q === T.ROAD || q === T.BRIDGE || q === T.BARRIER; };
      const m = (r(tx, ty - 1) ? 1 : 0) | (r(tx + 1, ty) ? 2 : 0) | (r(tx, ty + 1) ? 4 : 0) | (r(tx - 1, ty) ? 8 : 0);
      return reg('s' + m + v, () => sidewalkTile(m, v));
    }
    case T.ROOF: case T.WALL: case T.DOOR: case T.CONTAINER: {
      const b = MAP.buildings[MAP.bld[i]];
      if (!b) return reg('magenta', () => simpleTile(-1, zone, 0));
      if (t === T.ROOF || t === T.CONTAINER) {
        const same = (x, y) => MAP.bld[idx(x, y)] === b.id && (tileAt(x, y) === T.ROOF || tileAt(x, y) === T.CONTAINER);
        const m = (same(tx, ty - 1) ? 0 : 1) | (same(tx + 1, ty) ? 0 : 2) | (same(tx, ty + 1) ? 0 : 4) | (same(tx - 1, ty) ? 0 : 8);
        return reg('R' + b.id + m + v, () => roofTile(b, m, v));
      }
      const door = t === T.DOOR;
      return reg('W' + b.id + (door ? 'd' : '') + (tx % 2), () => wallTile(b, tx % 2, door));
    }
    case T.COURT: {
      const inC = (x, y) => tileAt(x, y) === T.COURT;
      let m = (inC(tx, ty - 1) ? 0 : 1) | (inC(tx + 1, ty) ? 0 : 2) | (inC(tx, ty + 1) ? 0 : 4) | (inC(tx - 1, ty) ? 0 : 8);
      if (tx === 53) m |= 16;
      return reg('c' + m, () => simpleTile(T.COURT, zone, m));
    }
    default: {
      const vv = t === T.WATER ? v : t === T.FIELD || t === T.DIRT || t === T.SAND || t === T.DOCK || t === T.BUSH ? v : t === T.PARKING ? tx % 3 : t === T.TREE ? (hash2(tx * 3, ty) < 0.3 ? 2 : 0) : 0;
      const zk = t === T.TREE || t === T.BUSH || t === T.FENCE ? zone : '';
      return reg('t' + t + zk + vv, () => simpleTile(t, zone, vv));
    }
  }
}

export function buildTiles() {
  tileImg = new Uint16Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) tileImg[idx(x, y)] = computeKey(x, y);
}

export function refreshTiles(x0, y0, x1, y1) {
  for (let y = Math.max(0, y0 - 1); y <= Math.min(MH - 1, y1 + 1); y++)
    for (let x = Math.max(0, x0 - 1); x <= Math.min(MW - 1, x1 + 1); x++) tileImg[idx(x, y)] = computeKey(x, y);
}

export function drawMap(ctx, camX, camY, vw, vh, time) {
  const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
  const x1 = Math.min(MW - 1, Math.floor((camX + vw) / TS)), y1 = Math.min(MH - 1, Math.floor((camY + vh) / TS));
  const wf = Math.floor(time * 1.5) % 2;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let img = images[tileImg[y * MW + x]];
      if (Array.isArray(img)) img = img[wf];
      ctx.drawImage(img, x * TS - Math.round(camX), y * TS - Math.round(camY));
    }
  }
  // signs on landmark facades
  for (const b of MAP.buildings) {
    if (!b.sign) continue;
    const bx = b.x * TS - camX, by = (b.y + b.h - 1) * TS - camY;
    if (bx > vw || by > vh || bx + b.w * TS < 0 || by + 16 < 0) continue;
    const w = font.measure(b.sign) + 6;
    const sx = Math.round(bx + (b.w * TS) / 2 - w / 2), sy = Math.round(by - 10);
    ctx.fillStyle = b.neon ? '#1a0a24' : '#1a1a2a'; ctx.fillRect(sx, sy, w, 10);
    ctx.fillStyle = b.neon || b.awning || '#ffd23f'; ctx.fillRect(sx, sy + 9, w, 1);
    font.text(ctx, b.sign, sx + 3, sy + 2, b.neon ? (Math.floor(time * 2) % 5 ? '#ff7ae0' : '#ffffff') : '#f4f4f0');
    if (b.cross) { ctx.fillStyle = '#d8323c'; ctx.fillRect(bx + b.w * 8 - 3, by - 34, 6, 18); ctx.fillRect(bx + b.w * 8 - 9, by - 28, 18, 6); }
  }
}

// minimap color per tile
export function miniColor(tx, ty) {
  const t = tileAt(tx, ty);
  switch (t) {
    case T.ROAD: case T.BRIDGE: return '#5a5a66';
    case T.SIDEWALK: case T.PLAZA: case T.PARKING: case T.DOCK: return '#8a8a96';
    case T.WATER: return '#2a5a9e';
    case T.ROOF: case T.WALL: case T.DOOR: case T.CONTAINER: { const b = MAP.buildings[MAP.bld[idx(tx, ty)]]; return b ? shade(b.roof, 0.8) : '#555'; }
    case T.TREE: case T.BUSH: return '#2a6a30';
    case T.FIELD: return '#8a983c';
    case T.DIRT: case T.SAND: return '#9a7a50';
    case T.BARRIER: return '#f08c28';
    case T.COURT: return '#2c8c5a';
    default: return zoneOf(tx, ty) === 'afueras' ? '#5a8030' : '#3a7a40';
  }
}
