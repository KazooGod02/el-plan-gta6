// Canvas + pixel-art helpers.
export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false;
  c.x = x;
  return c;
}

// Build a sprite from rows of chars and a palette {char: color}
export function fromRows(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const c = canvas(w, h);
  for (let y = 0; y < h; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const col = pal[r[x]];
      if (col) { c.x.fillStyle = col; c.x.fillRect(x, y, 1, 1); }
    }
  }
  return c;
}

export function flipH(src) {
  const c = canvas(src.width, src.height);
  c.x.translate(src.width, 0); c.x.scale(-1, 1);
  c.x.drawImage(src, 0, 0);
  return c;
}

// Nearest-neighbour rotation that keeps pixels crisp.
export function rotate(src, ang) {
  const sw = src.width, sh = src.height;
  const size = Math.ceil(Math.hypot(sw, sh)) + 2;
  const out = canvas(size, size);
  const sd = src.x ? src.x.getImageData(0, 0, sw, sh) : src.getContext('2d').getImageData(0, 0, sw, sh);
  const od = out.x.createImageData(size, size);
  const cos = Math.cos(-ang), sin = Math.sin(-ang);
  const cx = size / 2, cy = size / 2, scx = sw / 2, scy = sh / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const sx = Math.floor(dx * cos - dy * sin + scx);
      const sy = Math.floor(dx * sin + dy * cos + scy);
      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
      const si = (sy * sw + sx) * 4, oi = (y * size + x) * 4;
      if (sd.data[si + 3] === 0) continue;
      od.data[oi] = sd.data[si]; od.data[oi + 1] = sd.data[si + 1];
      od.data[oi + 2] = sd.data[si + 2]; od.data[oi + 3] = sd.data[si + 3];
    }
  }
  out.x.putImageData(od, 0, 0);
  return out;
}

export function rotations(src, n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(rotate(src, (i / n) * Math.PI * 2));
  return arr;
}

export function rotIndex(ang, n) {
  const t = ((ang / (Math.PI * 2)) % 1 + 1) % 1;
  return Math.round(t * n) % n;
}

// tint a sprite with a solid color (for flashes/silhouettes)
export function silhouette(src, color) {
  const c = canvas(src.width, src.height);
  c.x.drawImage(src, 0, 0);
  c.x.globalCompositeOperation = 'source-in';
  c.x.fillStyle = color; c.x.fillRect(0, 0, c.width, c.height);
  return c;
}

export function shade(hex, f) {
  // f < 1 darker, f > 1 lighter
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; }
  else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

export const PAL = {
  black: '#0b0b14', ink: '#1a1a2e', night: '#16163a', dgray: '#3c3c4e', gray: '#6e6e82', lgray: '#a8a8b8', white: '#f4f4f0',
  red: '#d8323c', dred: '#8c1c28', pink: '#f46eaa', orange: '#f08c28', yellow: '#ffd23f', lyellow: '#fff08c',
  green: '#46b450', dgreen: '#1e6e3c', lime: '#a0dc50', teal: '#28b4a0', cyan: '#5adcf0', blue: '#3c64dc', dblue: '#1e2c78',
  purple: '#8c46c8', violet: '#c878f0', brown: '#8c5a32', dbrown: '#5a3218', tan: '#d2a064', sand: '#e6c88c',
  skin1: '#f0c8a0', skin2: '#d49a6a', skin3: '#b87a4b', skin4: '#8c5530', neon: '#ff3cc8',
};

export function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
export function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }

// Pixel ellipse fill
export function ellipse(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

export function frameBox(ctx, x, y, w, h, fill = '#101028', border = '#f4f4f0', border2 = '#5a5a7a') {
  rect(ctx, x, y, w, h, fill);
  rect(ctx, x, y, w, 1, border); rect(ctx, x, y + h - 1, w, 1, border);
  rect(ctx, x, y, 1, h, border); rect(ctx, x + w - 1, y, 1, h, border);
  rect(ctx, x + 1, y + 1, w - 2, 1, border2);
}
