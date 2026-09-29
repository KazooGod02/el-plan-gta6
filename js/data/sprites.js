// Procedural pixel-art: side-view characters, portraits, top-down people and vehicles.
import { canvas, shade, ellipse, rotate, rotations, flipH, silhouette } from '../core/gfx.js';
import { LOOKS } from './cast.js';

const DARK = '#141418';

// ---------------------------------------------------------------- SIDE VIEW (20x24)
export function drawSide(L, frame = 'idle') {
  const c = canvas(20, 24); const x = c.x;
  let dy = 0;
  const R = (X, Y, w, h, col) => { if (!col) return; x.fillStyle = col; x.fillRect(X + 2, Y + dy, w, h); };
  const skin = L.skin, sk2 = shade(skin, 0.78), hc = L.hc, hl = shade(hc, 1.35), sh = L.shirt, sh2 = shade(sh, 0.72);
  const pa = L.pants, pa2 = shade(pa, 0.72), sho = L.shoes, sho2 = shade(sho, 0.7);
  const wide = L.body === 'wide', big = L.body === 'big', fem = L.body === 'fem', thin = L.body === 'thin';
  const f = frame;

  // ---- legs
  if (f === 'crouch') {
    R(4, 19, 3, 4, pa2); R(7, 19, 4, 2, pa); R(9, 20, 2, 3, pa);
    R(4, 23, 4, 1, sho2); R(9, 23, 4, 1, sho);
  } else if (f === 'sit') {
    R(5, 16, 7, 2, pa); R(10, 18, 2, 5, pa); R(10, 23, 4, 1, sho); R(4, 17, 2, 1, pa2);
  } else if (f !== 'bust') {
    let bl = 5, fl = 8, lf = 0;
    if (f === 'walk1') { bl = 4; fl = 9; }
    if (f === 'walk3') { bl = 6; fl = 7; lf = 1; }
    if (f === 'run1') { bl = 3; fl = 10; }
    if (f === 'run2') { bl = 6; fl = 7; lf = 2; }
    if (thin || fem) { bl += 0; }
    R(bl, 17, 3, 6, pa2); R(bl, 23, 4, 1, sho2);
    R(fl, 17, 3, 6 - lf, pa); R(fl, 23 - lf, 4, 1, sho);
  }
  if (f === 'crouch') dy = 5;

  // ---- back arm
  if (f !== 'hands') R(6, 10, 2, 6, sh2);

  // ---- torso
  let tx = 4, tw = 8;
  if (wide || big) { tx = 3; tw = 10; }
  if (fem || thin) { tx = 5; tw = 6; }
  if (f !== 'sit') R(tx, 16, tw, 2, pa);
  R(tx, 9, tw, 7, sh); R(tx, 9, 1, 7, sh2);
  if (big) { R(tx + tw, 12, 1, 4, sh); R(tx + tw - 1, 11, 1, 1, sh); }
  if (wide) R(tx + tw - 1, 11, 1, 5, shade(sh, 1.08));
  if (L.flannel) { R(tx, 11, tw, 1, sh2); R(tx, 14, tw, 1, sh2); R(tx + 2, 9, 1, 7, sh2); R(tx + 5, 9, 1, 7, sh2); }
  if (L.apron) { R(tx + 2, 11, tw - 1, 8, '#f4f4f0'); R(tx + 2, 11, 1, 8, '#d8d8d0'); }
  if (L.chain) { R(8, 10, 1, 1, '#ffd23f'); R(9, 11, 2, 1, '#ffd23f'); }
  if (L.tie) R(10, 10, 1, 5, L.tie);
  if (L.badge) R(9, 11, 1, 1, '#ffd23f');
  if (L.bag) { R(1, 9, 4, 8, '#3a2c20'); R(1, 9, 4, 1, '#5a4430'); R(2, 12, 2, 1, '#6a5a44'); }
  if (L.vest) { R(tx, 9, tw, 6, '#2a2a30'); R(tx + 1, 10, 1, 1, '#ffd23f'); }

  // neck
  R(7, 8, 2, 1, sk2);
  // ---- head
  R(5, 1, 6, 6, skin); R(6, 7, 4, 1, skin);
  R(11, 4, 1, 2, skin);             // nose
  R(6, 4, 2, 2, sk2);               // ear
  R(9, 6, 2, 1, sk2);               // mouth
  R(5, 1, 1, 6, sk2);
  // eye
  if (L.crazy) { R(9, 3, 2, 2, '#ffffff'); R(10, 4, 1, 1, DARK); R(8, 6, 3, 1, '#ffffff'); R(8, 6, 1, 1, sk2); }
  else R(9, 4, 1, 1, DARK);
  R(9, 3, 2, 1, shade(hc, 0.9));
  if (L.smile) R(9, 6, 2, 1, '#ffffff');
  if (L.mustache) R(9, 5, 3, 1, shade(hc, 0.8));
  if (L.scar) R(8, 5, 1, 2, '#e08c8c');
  if (L.grease) R(8, 5, 1, 1, '#4a3a2a');

  // ---- hair
  const h = L.hair;
  const cap = L.cap || '#333', cap2 = shade(cap, 0.7);
  if (h === 'curly') {
    R(5, 0, 2, 1, hc); R(8, 0, 2, 1, hc); R(4, 1, 7, 2, hc); R(4, 3, 3, 1, hc); R(10, 3, 1, 1, hc); R(4, 4, 2, 2, hc);
    R(6, 1, 1, 1, hl); R(9, 1, 1, 1, hl); R(5, 3, 1, 1, hl); R(3, 2, 1, 2, hc); R(11, 2, 1, 1, hc);
  } else if (h === 'librito') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 2, hc); R(4, 3, 2, 2, hc); R(6, 0, 3, 1, hl); R(7, 1, 3, 1, hl); R(10, 3, 1, 1, hc);
  } else if (h === 'side') {
    R(5, 0, 5, 1, hc); R(4, 1, 8, 1, hc); R(4, 2, 3, 1, hc); R(9, 2, 4, 1, hc); R(11, 3, 1, 1, hc); R(4, 3, 2, 2, hc);
    R(3, 0, 1, 1, hc); R(7, 0, 1, 1, hl); R(6, 1, 1, 1, hl); R(12, 1, 1, 1, hc);
  } else if (h === 'slick') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 1, hc); R(4, 2, 4, 1, hc); R(4, 3, 2, 3, hc); R(6, 1, 3, 1, hl);
  } else if (h === 'bun') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 1, hc); R(4, 2, 3, 1, hc); R(4, 3, 2, 4, hc); R(2, 0, 3, 3, hc); R(3, 0, 1, 1, hl);
  } else if (h === 'short') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 1, hc); R(4, 2, 3, 1, hc); R(10, 2, 1, 1, hc); R(4, 3, 2, 2, hc); R(6, 0, 2, 1, hl);
  } else if (h === 'pony') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 1, hc); R(4, 2, 3, 1, hc); R(4, 3, 2, 2, hc); R(2, 2, 2, 6, hc); R(3, 2, 1, 1, '#c83c3c');
  } else if (h === 'long') {
    R(5, 0, 5, 1, hc); R(4, 1, 7, 2, hc); R(3, 3, 3, 8, hc); R(10, 2, 1, 2, hc); R(6, 1, 2, 1, hl);
  } else if (h === 'cap') {
    R(5, 0, 5, 1, cap); R(4, 1, 7, 2, cap); R(10, 2, 3, 1, cap2); R(4, 3, 2, 2, hc); R(6, 1, 1, 1, shade(cap, 1.4));
  } else if (h === 'police' || h === 'guard') {
    R(4, 0, 7, 1, cap); R(4, 1, 7, 2, cap); R(10, 2, 3, 1, DARK); R(8, 1, 1, 1, h === 'police' ? '#ffd23f' : '#d0d0d0'); R(4, 3, 2, 2, hc);
  } else if (h === 'beanie') {
    R(5, 0, 5, 1, cap); R(4, 1, 7, 2, cap); R(4, 2, 7, 1, cap2); R(4, 3, 2, 1, hc);
  } else if (h === 'bald') {
    R(4, 3, 2, 2, hc); R(7, 1, 1, 1, shade(skin, 1.25));
  } else if (h === 'mohawk') {
    R(5, -1, 5, 3, hc); R(4, 2, 1, 2, sk2); R(6, 0, 2, 1, hl);
  }
  if (L.glasses) { R(8, 3, 4, 3, '#141414'); R(9, 4, 2, 1, '#9cd0ec'); R(6, 4, 2, 1, '#141414'); }
  if (L.shades) { R(8, 3, 4, 2, '#141414'); R(6, 3, 2, 1, '#141414'); }

  // ---- masks
  if (L.mask) drawMaskSide(R, L.mask);

  // ---- front arm
  const arm = shade(sh, 0.88);
  if (f === 'aim' || f === 'shoot') {
    R(8, 10, 5, 2, arm); R(13, 10, 2, 2, skin); R(14, 9, 4, 2, '#2a2a2e'); R(15, 11, 1, 1, '#2a2a2e');
    if (f === 'shoot') { R(18, 8, 2, 3, '#ffd23f'); R(18, 9, 2, 1, '#ffffff'); }
  } else if (f === 'punch') {
    R(8, 10, 6, 2, arm); R(14, 10, 2, 2, skin);
  } else if (f === 'hands') {
    R(9, 2, 2, 8, arm); R(9, 1, 2, 1, skin); R(5, 2, 2, 8, sh2); R(5, 1, 2, 1, sk2);
  } else if (f === 'dig') {
    R(8, 11, 4, 2, arm); R(12, 11, 1, 2, skin); R(12, 6, 1, 17, '#8c5a32'); R(11, 21, 3, 2, '#9a9aa2');
  } else if (f === 'carry') {
    R(8, 11, 4, 2, arm); R(12, 11, 1, 2, skin);
  } else if (f === 'phone') {
    R(8, 10, 2, 3, arm); R(10, 5, 1, 5, arm); R(10, 4, 1, 2, skin); R(11, 3, 1, 3, '#222');
  } else {
    let ax = 7;
    if (f === 'walk1' || f === 'run1') ax = 8;
    if (f === 'walk3' || f === 'run2') ax = 6;
    R(ax, 10, 2, 5, arm); R(ax, 15, 2, 1, skin);
  }
  if (L.silhouette) return silhouette(c, '#0a0a10');
  return c;
}

function drawMaskSide(R, m) {
  if (m === 'luchador') {
    R(4, 0, 7, 8, '#d8323c'); R(8, 3, 3, 2, '#ffd23f'); R(9, 4, 1, 1, DARK); R(9, 6, 2, 1, '#ffd23f'); R(5, 1, 2, 5, '#ffd23f'); R(11, 4, 1, 2, '#d8323c');
  } else if (m === 'presidente') {
    R(4, 0, 7, 8, '#e8c8a8'); R(4, 0, 7, 2, '#e8e8e8'); R(9, 4, 1, 1, DARK); R(9, 6, 2, 1, '#a0605a'); R(11, 4, 1, 2, '#e8c8a8'); R(8, 3, 3, 1, '#b0b0b0');
  } else if (m === 'payaso') {
    R(4, 0, 7, 8, '#f4f4f0'); R(3, 0, 3, 3, '#46b450'); R(11, 4, 2, 2, '#d8323c'); R(9, 3, 1, 2, '#3c64dc'); R(8, 6, 3, 1, '#d8323c');
  } else if (m === 'calavera') {
    R(4, 0, 7, 8, '#f0f0e8'); R(8, 3, 2, 2, DARK); R(9, 6, 2, 1, DARK); R(11, 4, 1, 2, '#f0f0e8');
  } else if (m === 'pasamontanas') {
    R(4, 0, 7, 8, '#1a1a1e'); R(8, 3, 3, 2, '#c48a5e'); R(9, 4, 1, 1, DARK); R(11, 4, 1, 2, '#1a1a1e');
  }
}

const sideCache = new Map();
// get side sprite (key: look id or look object with id), facing 1 right / -1 left
export function side(look, frame = 'idle', facing = 1) {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  const id = (typeof look === 'string' ? look : (look._id ||= 'l' + Math.random().toString(36).slice(2))) + (L.mask || '') + (L.bag ? 'B' : '') + (L.vest ? 'V' : '');
  const key = id + '|' + frame + '|' + facing;
  let s = sideCache.get(key);
  if (!s) {
    if (frame === 'down') {
      const base = drawSide(L, 'idle');
      s = rotate(base, -Math.PI / 2);
      if (facing < 0) s = flipH(s);
    } else {
      s = drawSide(L, frame);
      if (facing < 0) s = flipH(s);
    }
    sideCache.set(key, s);
  }
  return s;
}
export function clearLookCache(prefix) { for (const k of sideCache.keys()) if (k.startsWith(prefix)) sideCache.delete(k); }

// ---------------------------------------------------------------- PORTRAITS (32x32)
export function drawPortrait(L, expr = 'normal') {
  const c = canvas(32, 32); const x = c.x;
  const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const E = (cx, cy, rx, ry, col) => ellipse(x, cx, cy, rx, ry, col);
  const skin = L.skin, sk2 = shade(skin, 0.8), sk3 = shade(skin, 0.65), hc = L.hc, hd = shade(hc, 0.75), hl = shade(hc, 1.3);
  const sh = L.shirt, sh2 = shade(sh, 0.72);
  const wide = L.body === 'wide', big = L.body === 'big', fem = L.body === 'fem', thin = L.body === 'thin';
  let rx = 8; if (wide) rx = 9; if (big) rx = 10; if (thin || fem) rx = 7;
  const h = L.hair;
  const cap = L.cap || '#333', cap2 = shade(cap, 0.7);

  // back hair
  if (h === 'long') { R(16 - rx - 2, 6, rx * 2 + 4, 22, hd); }
  if (h === 'bun') { E(16, 2, 4, 3, hc); R(15, 1, 2, 1, hl); }
  if (h === 'pony') { R(16 + rx - 1, 10, 3, 14, hd); }

  // shoulders
  const shw = big ? 16 : wide ? 15 : fem || thin ? 12 : 14;
  E(16, 31, shw, 7, sh); E(16, 31, shw - 2, 6, sh);
  R(16 - shw, 29, 3, 3, sh2);
  if (L.flannel) { for (let i = -shw; i < shw; i += 4) R(16 + i, 25, 1, 7, sh2); R(0, 28, 32, 1, sh2); }
  if (L.apron) { R(11, 25, 10, 7, '#f4f4f0'); R(10, 24, 1, 3, '#f4f4f0'); R(21, 24, 1, 3, '#f4f4f0'); }
  R(13, 21, 6, 5, sk2);
  R(14, 25, 4, 2, sk2); R(15, 27, 2, 1, sk2);
  if (L.tie) { R(15, 25, 2, 7, L.tie); R(12, 24, 3, 2, '#f0f0f0'); R(17, 24, 3, 2, '#f0f0f0'); }
  if (L.chain) { for (let i = 0; i < 8; i++) R(12 + i, 26 + (i === 0 || i === 7 ? -1 : 0) + (i > 2 && i < 5 ? 1 : 0), 1, 1, '#ffd23f'); }
  if (L.badge) { R(21, 27, 3, 3, '#ffd23f'); R(22, 28, 1, 1, '#c89020'); }

  // head
  E(16, 14, rx, 10, sk2);
  E(15, 14, rx - 1, 10, skin);
  R(16 - rx - 1, 13, 2, 4, skin); R(16 + rx, 13, 2, 4, sk2);
  R(16 - rx, 14, 1, 2, sk3); R(16 + rx + 1, 14, 1, 2, sk3);

  // eyes
  const eye = (cx, big2) => {
    const ww = big2 ? 4 : 3;
    if (expr === 'happy' || expr === 'laugh') {
      R(cx - 1, 14, 1, 1, DARK); R(cx, 13, 1, 1, DARK); R(cx + 1, 14, 1, 1, DARK);
    } else if (expr === 'serious' || expr === 'smug') {
      R(cx - 1, 14, 3, 1, '#ffffff'); R(cx, 14, 1, 1, DARK); R(cx - 1, 13, 3, 1, sk3);
    } else if (expr === 'shock') {
      R(cx - 1, 12, 3, 3, '#ffffff'); R(cx, 13, 1, 1, DARK);
    } else if (expr === 'sad') {
      R(cx - 1, 14, 3, 2, '#ffffff'); R(cx, 15, 1, 1, DARK);
    } else if (expr === 'think') {
      R(cx - 1, 13, 3, 2, '#ffffff'); R(cx - 1, 13, 1, 1, DARK);
    } else {
      R(cx - 1 - (big2 ? 1 : 0), 13 - (big2 ? 1 : 0), ww, big2 ? 4 : 2, '#ffffff');
      R(cx, 13, 1, big2 ? 1 : 2, DARK);
    }
  };
  const crazy = L.crazy && expr !== 'happy' && expr !== 'laugh';
  eye(12, crazy && expr !== 'serious');
  eye(20, false);
  // brows
  const bc = shade(hc, 0.85);
  if (expr === 'angry') { R(10, 10, 2, 1, bc); R(12, 11, 2, 1, bc); R(18, 11, 2, 1, bc); R(20, 10, 2, 1, bc); }
  else if (expr === 'sad') { R(10, 11, 2, 1, bc); R(12, 10, 2, 1, bc); R(18, 10, 2, 1, bc); R(20, 11, 2, 1, bc); }
  else if (expr === 'shock') { R(10, 9, 4, 1, bc); R(18, 9, 4, 1, bc); }
  else if (crazy) { R(10, 9, 4, 1, bc); R(18, 11, 4, 1, bc); }
  else { R(10, 11, 4, 1, bc); R(18, 11, 4, 1, bc); }

  // nose
  R(15, 16, 2, 2, sk2); R(17, 17, 1, 1, sk3);
  // mouth
  const my = 19;
  if (L.mustache) { R(12, 18, 8, 2, hd); R(11, 19, 1, 1, hd); R(20, 19, 1, 1, hd); }
  if (expr === 'happy' || L.smile) { R(13, my, 6, 1, DARK); R(12, my - 1, 1, 1, DARK); R(19, my - 1, 1, 1, DARK); R(14, my, 4, 1, '#ffffff'); }
  else if (expr === 'laugh') { R(13, my - 1, 6, 3, DARK); R(14, my - 1, 4, 1, '#ffffff'); R(14, my + 1, 4, 1, '#d05050'); }
  else if (expr === 'angry') { R(13, my + 1, 6, 1, DARK); R(12, my + 2, 1, 1, DARK); R(19, my + 2, 1, 1, DARK); }
  else if (expr === 'shock') { R(14, my - 1, 4, 3, DARK); R(15, my, 2, 1, '#8a3030'); }
  else if (expr === 'sad') { R(13, my + 1, 6, 1, DARK); R(12, my + 2, 1, 1, DARK); R(19, my + 2, 1, 1, DARK); }
  else if (expr === 'smug') { R(14, my, 5, 1, DARK); R(19, my - 1, 1, 1, DARK); }
  else if (crazy) { R(12, my - 1, 8, 2, '#ffffff'); R(12, my + 1, 8, 1, DARK); R(11, my - 2, 1, 2, DARK); R(20, my - 2, 1, 2, DARK); for (let i = 13; i < 20; i += 2) R(i, my - 1, 1, 2, '#d8d8d0'); }
  else if (expr === 'think') { R(16, my, 3, 1, DARK); }
  else R(13, my, 6, 1, sk3);
  if (L.scar) { R(21, 15, 1, 4, '#e08c8c'); R(22, 16, 1, 1, '#e08c8c'); }
  if (L.grease) { R(10, 17, 2, 1, '#5a4a3a'); R(21, 12, 1, 2, '#5a4a3a'); }

  // hair (front)
  if (h === 'curly') {
    E(16, 7, 10, 5, hc);
    for (const bx of [6, 9, 13, 17, 21, 25]) E(bx, 4 + (bx % 3), 2, 2, hc);
    for (const bx of [7, 11, 15, 19, 23]) E(bx, 9, 2, 1, hc);
    R(6, 7, 3, 7, hc); R(23, 7, 3, 7, hc);
    for (const [px, py] of [[8, 3], [12, 4], [17, 3], [22, 5], [10, 7], [19, 6], [24, 8], [7, 10]]) R(px, py, 1, 1, hl);
    for (const [px, py] of [[14, 5], [20, 4], [9, 6], [25, 6]]) R(px, py, 1, 1, hd);
  } else if (h === 'librito') {
    E(16, 7, 9, 4, hc); R(7, 6, 18, 3, hc); R(7, 8, 2, 5, hc); R(23, 8, 2, 5, hc);
    R(12, 3, 1, 6, sk2);
    R(13, 4, 9, 1, hl); R(14, 6, 8, 1, hl); R(8, 5, 3, 1, hl);
    R(13, 9, 11, 1, hc); R(9, 9, 3, 1, hc);
  } else if (h === 'side') {
    E(16, 7, 10, 4, hc); R(6, 7, 3, 6, hc);
    R(8, 2, 2, 3, hc); R(12, 1, 2, 3, hc); R(19, 2, 2, 3, hc); R(23, 3, 2, 3, hc);
    R(9, 8, 16, 2, hc); R(14, 10, 12, 1, hc); R(18, 11, 8, 1, hc); R(21, 12, 4, 1, hc);
    R(11, 5, 5, 1, hl); R(17, 8, 5, 1, hl); R(13, 2, 1, 1, hl);
  } else if (h === 'slick') {
    E(16, 7, 9, 4, hc); R(7, 7, 2, 6, hc); R(23, 7, 2, 6, hc); R(15, 9, 2, 1, hc);
    R(10, 4, 12, 1, hl); R(9, 6, 14, 1, hl);
  } else if (h === 'bun') {
    E(16, 7, 9, 4, hc); R(7, 7, 2, 9, hc); R(23, 7, 2, 9, hc); R(11, 5, 10, 1, hl);
  } else if (h === 'short') {
    E(16, 7, 9, 4, hc); R(7, 7, 2, 5, hc); R(23, 7, 2, 5, hc); R(9, 9, 2, 2, hc); R(12, 9, 2, 1, hc); R(16, 9, 2, 1, hc); R(11, 4, 8, 1, hl);
  } else if (h === 'pony') {
    E(16, 7, 9, 4, hc); R(7, 7, 2, 7, hc); R(23, 7, 2, 7, hc); R(16, 4, 1, 5, hd); R(10, 5, 5, 1, hl);
  } else if (h === 'long') {
    E(16, 7, 9, 4, hc); R(7, 7, 3, 12, hc); R(22, 7, 3, 12, hc); R(10, 8, 6, 2, hc); R(11, 5, 7, 1, hl);
  } else if (h === 'cap') {
    E(16, 6, 10, 4, cap); R(6, 7, 20, 2, cap); R(5, 9, 22, 2, cap2); R(14, 5, 4, 2, '#f4f4f0'); R(7, 11, 2, 3, hc); R(23, 11, 2, 3, hc);
  } else if (h === 'police' || h === 'guard') {
    E(16, 5, 11, 4, cap); R(5, 6, 22, 3, cap); R(5, 9, 22, 2, DARK); R(14, 4, 4, 3, h === 'police' ? '#ffd23f' : '#d0d0d0'); R(7, 11, 2, 3, hc); R(23, 11, 2, 3, hc);
  } else if (h === 'beanie') {
    E(16, 6, 10, 5, cap); R(6, 8, 20, 3, cap2); R(15, 1, 2, 1, cap);
  } else if (h === 'bald') {
    R(7, 11, 2, 4, hc); R(23, 11, 2, 4, hc); R(12, 5, 3, 1, shade(skin, 1.25)); R(13, 6, 1, 1, shade(skin, 1.25));
  } else if (h === 'mohawk') {
    R(13, 0, 6, 9, hc); R(14, 0, 2, 8, hl); R(7, 8, 2, 4, sk3); R(23, 8, 2, 4, sk3);
  }
  if (L.glasses) {
    const g = '#141414';
    const frame = (gx) => { R(gx, 11, 6, 1, g); R(gx, 16, 6, 1, g); R(gx, 11, 1, 6, g); R(gx + 5, 11, 1, 6, g); R(gx + 1, 12, 4, 1, 'rgba(180,220,255,0.35)'); };
    frame(9); frame(17); R(15, 12, 2, 1, g); R(7, 12, 2, 1, g); R(23, 12, 2, 1, g);
  }
  if (L.shades) { R(9, 12, 6, 3, '#141414'); R(17, 12, 6, 3, '#141414'); R(15, 12, 2, 1, '#141414'); R(10, 12, 2, 1, '#5a5a6a'); R(18, 12, 2, 1, '#5a5a6a'); }
  if (L.mask) drawMaskPortrait(R, E, L.mask, rx);
  if (L.silhouette) return silhouette(c, '#0a0a10');
  return c;
}

function drawMaskPortrait(R, E, m, rx) {
  if (m === 'luchador') {
    E(16, 13, rx + 1, 11, '#d8323c');
    R(9, 12, 6, 4, '#ffd23f'); R(17, 12, 6, 4, '#ffd23f'); R(10, 13, 4, 2, '#ffffff'); R(18, 13, 4, 2, '#ffffff'); R(12, 13, 1, 2, DARK); R(20, 13, 1, 2, DARK);
    R(13, 18, 6, 3, '#ffd23f'); R(14, 19, 4, 1, DARK); R(15, 3, 2, 8, '#ffd23f');
  } else if (m === 'presidente') {
    E(16, 13, rx + 1, 11, '#e8c8a8'); E(16, 5, rx, 4, '#e8e8e8');
    R(10, 13, 4, 2, DARK); R(18, 13, 4, 2, DARK); R(9, 11, 5, 1, '#b0b0b0'); R(18, 11, 5, 1, '#b0b0b0');
    R(15, 15, 2, 3, '#d8b090'); R(12, 19, 8, 2, '#a0605a'); R(13, 19, 6, 1, '#f0f0f0');
  } else if (m === 'payaso') {
    E(16, 13, rx + 1, 11, '#f4f4f0'); E(8, 5, 4, 4, '#46b450'); E(24, 5, 4, 4, '#46b450');
    R(10, 12, 4, 3, '#3c64dc'); R(18, 12, 4, 3, '#3c64dc'); R(11, 13, 2, 1, DARK); R(19, 13, 2, 1, DARK);
    E(16, 16, 2, 2, '#d8323c'); R(11, 19, 10, 2, '#d8323c'); R(10, 18, 2, 1, '#d8323c'); R(20, 18, 2, 1, '#d8323c');
  } else if (m === 'calavera') {
    E(16, 13, rx + 1, 11, '#f0f0e8'); E(12, 13, 2, 2, DARK); E(20, 13, 2, 2, DARK); R(15, 16, 2, 2, DARK);
    for (let i = 11; i < 21; i += 2) R(i, 19, 1, 2, DARK);
  } else if (m === 'pasamontanas') {
    E(16, 13, rx + 1, 11, '#1a1a1e'); R(9, 12, 14, 4, '#c48a5e'); R(11, 13, 2, 2, DARK); R(19, 13, 2, 2, DARK); R(13, 18, 6, 2, '#c48a5e');
  }
}

const portraitCache = new Map();
export function portrait(look, expr = 'normal') {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  const id = typeof look === 'string' ? look : (look._id ||= 'l' + Math.random().toString(36).slice(2));
  const key = id + (L.mask || '') + '|' + expr;
  let p = portraitCache.get(key);
  if (!p) { p = drawPortrait(L, expr); portraitCache.set(key, p); }
  return p;
}

// ---------------------------------------------------------------- TOP-DOWN PEOPLE (12x12, facing right)
export function drawTop(L, frame = 0) {
  const c = canvas(12, 12); const x = c.x;
  const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const sh = L.shirt, sh2 = shade(sh, 0.72), sk = L.skin, hc = L.hc, pa = L.pants, sho = L.shoes;
  const big = L.body === 'big' || L.body === 'wide';
  if (frame === 3) { // knocked down: lying, arms spread
    R(2, 5, 8, 3, sh); R(1, 5, 1, 3, pa); R(0, 4, 1, 1, sho); R(0, 8, 1, 1, sho);
    R(4, 3, 2, 2, sh2); R(4, 8, 2, 2, sh2); R(4, 2, 1, 1, sk); R(4, 10, 1, 1, sk);
    R(9, 5, 3, 3, hc); R(10, 6, 1, 1, sk);
    return c;
  }
  // feet
  if (frame === 1) { R(9, 4, 2, 1, sho); R(1, 7, 2, 1, sho); R(7, 4, 2, 1, pa); R(3, 7, 2, 1, pa); }
  if (frame === 2) { R(9, 7, 2, 1, sho); R(1, 4, 2, 1, sho); R(7, 7, 2, 1, pa); R(3, 4, 2, 1, pa); }
  // arms
  const a1 = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  R(5 + a1, 1, 2, 1, sh2); R(7 + a1, 1, 1, 1, sk);
  R(5 - a1, 10, 2, 1, sh2); R(7 - a1, 10, 1, 1, sk);
  // shoulders
  if (big) { R(3, 1, 5, 10, sh); R(2, 2, 1, 8, sh); R(3, 1, 1, 10, sh2); }
  else { R(4, 2, 4, 8, sh); R(3, 3, 1, 6, sh); R(4, 2, 1, 8, sh2); }
  if (L.bag) { R(1, 3, 3, 6, '#3a2c20'); R(1, 3, 3, 1, '#5a4430'); }
  // head
  const h = L.hair;
  const hcol = (h === 'cap' || h === 'police' || h === 'guard' || h === 'beanie') ? (L.cap || '#333') : h === 'bald' ? sk : hc;
  if (L.mask) {
    const mc = { luchador: '#d8323c', presidente: '#e8c8a8', payaso: '#f4f4f0', calavera: '#f0f0e8', pasamontanas: '#1a1a1e' }[L.mask] || '#222';
    R(4, 4, 5, 4, mc); R(5, 3, 3, 6, mc);
  } else if (h === 'curly') {
    R(3, 4, 6, 4, hc); R(4, 3, 4, 6, hc); R(3, 3, 1, 1, hc); R(8, 3, 1, 1, hc); R(3, 8, 1, 1, hc); R(8, 8, 1, 1, hc);
    R(5, 4, 1, 1, shade(hc, 1.7)); R(7, 7, 1, 1, shade(hc, 1.7)); R(9, 5, 1, 2, sk);
  } else {
    R(4, 4, 5, 4, hcol); R(5, 3, 3, 6, hcol);
    if (h === 'bald') { R(4, 4, 1, 4, hc); }
    if (h === 'librito') R(5, 3, 3, 1, shade(hc, 1.7));
    if (h === 'side') { R(8, 3, 1, 3, hc); R(6, 3, 2, 1, shade(hc, 1.6)); }
    if (h === 'long' || h === 'pony') R(2, 4, 2, 4, hc);
    if (h === 'cap' || h === 'police' || h === 'guard') R(9, 4, 1, 4, shade(hcol, 0.6));
    R(9, 5, 1, 2, sk);
  }
  if (L.glasses) R(9, 5, 1, 2, '#141414');
  if (L.silhouette) return silhouette(c, '#0a0a10');
  return c;
}

const topCache = new Map();
export const TOP_DIRS = 16;
// returns array[frame][dirIndex]
export function topSprites(look) {
  const L = typeof look === 'string' ? LOOKS[look] : look;
  const id = (typeof look === 'string' ? look : (look._id ||= 'l' + Math.random().toString(36).slice(2))) + (L.mask || '') + (L.bag ? 'B' : '');
  let s = topCache.get(id);
  if (!s) {
    s = [0, 1, 2].map((f) => rotations(drawTop(L, f), TOP_DIRS));
    s[3] = rotations(drawTop(L, 3), 4);
    topCache.set(id, s);
  }
  return s;
}

// ---------------------------------------------------------------- VEHICLES (top-down, facing right)
export const VEHICLES = {
  tsuru:   { name: 'Tsuru 2003', L: 22, W: 12, style: 'sedan', max: 150, acc: 120, grip: 7, hp: 90, rating: 5 },
  sedan:   { name: 'Sedán', L: 24, W: 12, style: 'sedan', max: 165, acc: 135, grip: 7, hp: 100, rating: 4 },
  compact: { name: 'Compacto', L: 20, W: 11, style: 'sedan', max: 155, acc: 140, grip: 7.5, hp: 80, rating: 3 },
  vocho:   { name: 'Vocho', L: 18, W: 11, style: 'vocho', max: 130, acc: 110, grip: 6.5, hp: 85, rating: 4 },
  pickup:  { name: 'Pickup', L: 25, W: 13, style: 'pickup', max: 150, acc: 115, grip: 6, hp: 130, rating: 3 },
  van:     { name: 'Combi', L: 24, W: 13, style: 'van', max: 130, acc: 95, grip: 6, hp: 120, rating: 2 },
  sports:  { name: 'Deportivo', L: 22, W: 11, style: 'sports', max: 215, acc: 200, grip: 8.5, hp: 90, rating: 5 },
  taxi:    { name: 'Taxi', L: 23, W: 12, style: 'taxi', max: 160, acc: 130, grip: 7, hp: 100, rating: 4 },
  police:  { name: 'Patrulla', L: 24, W: 12, style: 'police', max: 158, acc: 135, grip: 7.5, hp: 150, rating: 5 },
  reyes:   { name: 'Interceptor', L: 24, W: 12, style: 'reyes', max: 180, acc: 160, grip: 8, hp: 180, rating: 5 },
  truck:   { name: 'Camión', L: 32, W: 14, style: 'truck', max: 110, acc: 70, grip: 5, hp: 220, rating: 2 },
  bus:     { name: 'Camión urbano', L: 38, W: 14, style: 'bus', max: 105, acc: 60, grip: 5, hp: 260, rating: 1 },
  armored: { name: 'Blindado', L: 28, W: 14, style: 'armored', max: 125, acc: 80, grip: 6, hp: 500, rating: 5 },
  moto:    { name: 'Moto de reparto', L: 13, W: 5, style: 'moto', max: 145, acc: 150, grip: 8, hp: 55, rating: 4 },
  golf:    { name: 'Carrito de golf', L: 15, W: 9, style: 'golf', max: 70, acc: 60, grip: 7, hp: 60, rating: 5 },
  garbage: { name: 'Camión de basura', L: 32, W: 14, style: 'garbage', max: 95, acc: 55, grip: 5, hp: 250, rating: 1 },
};

export const CAR_COLORS = ['#d8323c', '#3c64dc', '#f4f4f0', '#1a1a2e', '#46b450', '#ffd23f', '#6e6e82', '#8c46c8', '#f08c28', '#28b4a0', '#8c5a32', '#a8a8b8', '#f46eaa'];

export function drawVehicle(type, color, variant = 0) {
  const s = VEHICLES[type];
  const L = s.L, Wd = s.W;
  const c = canvas(L, Wd); const x = c.x;
  const R = (X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  const col = color, c2 = shade(col, 0.7), c3 = shade(col, 1.25), glass = '#3a5470', glassL = '#6a8cac';
  const body = () => { R(1, 0, L - 2, Wd, c2); R(0, 1, L, Wd - 2, c2); R(1, 1, L - 2, Wd - 2, col); };
  const lights = () => { R(L - 1, 1, 1, 2, '#fff6b0'); R(L - 1, Wd - 3, 1, 2, '#fff6b0'); R(0, 1, 1, 2, '#e02828'); R(0, Wd - 3, 1, 2, '#e02828'); };
  switch (s.style) {
    case 'moto': {
      R(0, 1, 3, 3, '#1a1a1a'); R(L - 3, 1, 3, 3, '#1a1a1a'); R(2, 1, L - 5, 3, col); R(3, 0, 4, 5, '#d8323c'); R(3, 1, 4, 3, '#f4f4f0');
      R(L - 4, 0, 1, 5, '#888'); R(L - 1, 2, 1, 1, '#fff6b0');
      if (variant === 1) { R(6, 1, 4, 3, '#e0a82e'); R(7, 1, 2, 3, '#241410'); }
      return c;
    }
    case 'golf': {
      R(1, 0, 3, 2, '#1a1a1a'); R(1, Wd - 2, 3, 2, '#1a1a1a'); R(L - 4, 0, 3, 2, '#1a1a1a'); R(L - 4, Wd - 2, 3, 2, '#1a1a1a');
      R(0, 1, L, Wd - 2, '#f4f4f0'); R(3, 1, 9, Wd - 2, '#dcdcd4'); R(3, 2, 9, 1, '#c8c8c0'); R(L - 1, 3, 1, 3, '#fff6b0');
      return c;
    }
    case 'vocho': {
      R(2, 0, L - 4, Wd, c2); R(0, 2, L, Wd - 4, c2); R(1, 1, L - 2, Wd - 2, col);
      R(5, 2, 8, Wd - 4, c3); R(12, 2, 2, Wd - 4, glass); R(4, 3, 1, Wd - 6, glass); R(14, 1, 3, Wd - 2, col);
      R(L - 2, 2, 1, 2, '#fff6b0'); R(L - 2, Wd - 4, 1, 2, '#fff6b0'); R(1, 3, 1, 1, '#e02828'); R(1, Wd - 4, 1, 1, '#e02828');
      return c;
    }
  }
  body();
  if (s.style === 'sedan' || s.style === 'taxi' || s.style === 'police' || s.style === 'reyes' || s.style === 'sports') {
    const ws = L - 9, roofL = s.style === 'sports' ? 5 : 7;
    R(ws, 2, 3, Wd - 4, glass); R(ws + 1, 2, 1, Wd - 4, glassL);
    R(ws - roofL, 2, roofL, Wd - 4, c3);
    R(ws - roofL - 2, 2, 2, Wd - 4, glass);
    R(L - 5, 3, 3, Wd - 6, shade(col, 1.08));
    R(ws, 0, 1, 1, c2); R(ws, Wd - 1, 1, 1, c2);
    if (s.style === 'taxi') { R(ws - 4, 4, 3, Wd - 8, '#f4f4f0'); R(ws - 3, 5, 1, Wd - 10, '#d8323c'); }
    if (s.style === 'police' || s.style === 'reyes') {
      const a = variant === 0 ? '#e02828' : '#2850e0', b = variant === 0 ? '#2850e0' : '#e02828';
      if (s.style === 'police') { R(L - 7, 1, 6, Wd - 2, '#1a1a2e'); R(1, 1, 5, Wd - 2, '#1a1a2e'); }
      R(ws - 4, 2, 2, Math.floor((Wd - 4) / 2), a); R(ws - 4, 2 + Math.floor((Wd - 4) / 2), 2, Math.ceil((Wd - 4) / 2), b);
    }
    if (s.style === 'sports') { R(0, 1, 2, Wd - 2, c2); R(1, 1, 1, Wd - 2, '#1a1a1a'); R(L - 7, Math.floor(Wd / 2) - 1, 5, 2, '#f4f4f0'); }
  } else if (s.style === 'pickup') {
    R(L - 10, 2, 3, Wd - 4, glass); R(L - 13, 2, 3, Wd - 4, c3); R(1, 1, 10, Wd - 2, c2); R(2, 2, 8, Wd - 4, shade(col, 0.5));
    for (let i = 3; i < 10; i += 2) R(i, 2, 1, Wd - 4, shade(col, 0.42));
  } else if (s.style === 'van') {
    R(L - 7, 2, 3, Wd - 4, glass); R(2, 1, L - 9, Wd - 2, c3); R(3, 2, L - 11, 1, '#f4f4f0'); R(3, Wd - 3, L - 11, 1, '#f4f4f0');
  } else if (s.style === 'truck' || s.style === 'garbage') {
    R(L - 8, 1, 7, Wd - 2, col); R(L - 5, 2, 2, Wd - 4, glass);
    const box = s.style === 'garbage' ? '#46b450' : '#e8e8e8';
    R(0, 0, L - 9, Wd, shade(box, 0.75)); R(1, 1, L - 11, Wd - 2, box);
    if (s.style === 'garbage') for (let i = 3; i < L - 10; i += 4) R(i, 1, 1, Wd - 2, shade(box, 0.8));
    else R(3, 5, L - 15, 4, '#d8323c');
  } else if (s.style === 'bus') {
    R(2, 1, L - 4, Wd - 2, col); R(L - 3, 2, 2, Wd - 4, glass);
    for (let i = 3; i < L - 5; i += 4) { R(i, 1, 3, 1, glass); R(i, Wd - 2, 3, 1, glass); }
    R(4, 4, L - 10, Wd - 8, shade(col, 1.15));
  } else if (s.style === 'armored') {
    R(L - 7, 2, 2, Wd - 4, glass); R(2, 1, L - 10, Wd - 2, shade(col, 0.85));
    for (let i = 4; i < L - 9; i += 5) R(i, 2, 1, Wd - 4, shade(col, 0.6));
    R(8, 5, 6, 4, '#ffd23f'); R(9, 6, 4, 2, '#8a6a10');
  }
  lights();
  return c;
}

const vehCache = new Map();
export const VEH_DIRS = 32;
export function vehicleSprites(type, color, variant = 0) {
  const key = type + color + variant;
  let s = vehCache.get(key);
  if (!s) { s = rotations(drawVehicle(type, color, variant), VEH_DIRS); vehCache.set(key, s); }
  return s;
}
