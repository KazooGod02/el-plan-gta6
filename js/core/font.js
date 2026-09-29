// 5x7 proportional bitmap font with Spanish characters.
// Rows are listed top→bottom; baseline is row 6. Rows 7-8 are descenders.
const RAW = {
  'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
  'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
  'D': '####.|#...#|#...#|#...#|#...#|#...#|####.',
  'E': '#####|#....|#....|####.|#....|#....|#####',
  'F': '#####|#....|#....|####.|#....|#....|#....',
  'G': '.###.|#...#|#....|#.###|#...#|#...#|.####',
  'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  'I': '###|.#.|.#.|.#.|.#.|.#.|###',
  'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  'L': '#....|#....|#....|#....|#....|#....|#####',
  'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  'N': '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  'P': '####.|#...#|#...#|####.|#....|#....|#....',
  'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  'S': '.####|#....|#....|.###.|....#|....#|####.',
  'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  'W': '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
  'a': '....|....|.###|...#|.###|#..#|.###',
  'b': '#...|#...|###.|#..#|#..#|#..#|###.',
  'c': '....|....|.###|#...|#...|#...|.###',
  'd': '...#|...#|.###|#..#|#..#|#..#|.###',
  'e': '....|....|.##.|#..#|####|#...|.###',
  'f': '..##|.#..|.#..|###.|.#..|.#..|.#..',
  'g': '....|....|.###|#..#|#..#|#..#|.###|...#|.##.',
  'h': '#...|#...|###.|#..#|#..#|#..#|#..#',
  'i': '.#|..|##|.#|.#|.#|.#',
  'j': '..#|...|.##|..#|..#|..#|..#|#.#|.#.',
  'k': '#...|#...|#..#|#.#.|##..|#.#.|#..#',
  'l': '##|.#|.#|.#|.#|.#|.#',
  'm': '.....|.....|####.|#.#.#|#.#.#|#.#.#|#.#.#',
  'n': '....|....|###.|#..#|#..#|#..#|#..#',
  'o': '....|....|.##.|#..#|#..#|#..#|.##.',
  'p': '....|....|###.|#..#|#..#|#..#|###.|#...|#...',
  'q': '....|....|.###|#..#|#..#|#..#|.###|...#|...#',
  'r': '....|....|#.##|##..|#...|#...|#...',
  's': '....|....|.###|#...|.##.|...#|###.',
  't': '.#..|.#..|###.|.#..|.#..|.#..|..##',
  'u': '....|....|#..#|#..#|#..#|#..#|.###',
  'v': '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
  'w': '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.',
  'x': '....|....|#..#|#..#|.##.|#..#|#..#',
  'y': '....|....|#..#|#..#|#..#|#..#|.###|...#|.##.',
  'z': '....|....|####|...#|.##.|#...|####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '.#.|##.|.#.|.#.|.#.|.#.|###',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '####.|....#|....#|.###.|....#|....#|####.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '.###.|#....|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|....#|.###.',
  '.': '.|.|.|.|.|.|#',
  ',': '..|..|..|..|..|.#|.#|#.',
  '!': '#|#|#|#|#|.|#',
  '¡': '#|.|#|#|#|#|#',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '¿': '..#..|.....|..#..|.#...|#....|#...#|.###.',
  ':': '.|#|.|.|.|#|.',
  ';': '..|.#|..|..|..|.#|.#|#.',
  '-': '....|....|....|####|....|....|....',
  '_': '.....|.....|.....|.....|.....|.....|#####',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '=': '....|....|####|....|####|....|....',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....',
  '(': '.#|#.|#.|#.|#.|#.|.#',
  ')': '#.|.#|.#|.#|.#|.#|#.',
  '[': '##|#.|#.|#.|#.|#.|##',
  ']': '##|.#|.#|.#|.#|.#|##',
  '"': '#.#|#.#|...|...|...|...|...',
  "'": '#|#|.|.|.|.|.',
  '$': '..#..|.####|#.#..|.###.|..#.#|####.|..#..',
  '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  '*': '.....|..#..|#.#.#|.###.|#.#.#|..#..|.....',
  '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.###.',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
  '|': '#|#|#|#|#|#|#',
  '~': '.....|.....|.#..#|#.##.|.....|.....|.....',
  '★': '..#..|..#..|#####|.###.|.#.#.|#...#|.....',
  '☆': '..#..|.#.#.|##.##|#...#|.#.#.|#.#.#|.....',
  '…': '.....|.....|.....|.....|.....|.....|#.#.#',
  '·': '.|.|.|#|.|.|.',
  '°': '###|#.#|###|...|...|...|...',
  '♥': '.....|##.##|#####|#####|.###.|..#..|.....',
  '♪': '..##.|..#.#|..#..|..#..|.##..|###..|.#...',
  '►': '#...|##..|###.|####|###.|##..|#...',
  '◄': '...#|..##|.###|####|.###|..##|...#',
  '▲': '.....|..#..|.###.|#####|.....|.....|.....',
  '▼': '.....|#####|.###.|..#..|.....|.....|.....',
  '■': '....|####|####|####|####|....|....',
  '✉': '#####|##.##|#.#.#|#...#|#####|.....|.....',
  '∞': '.....|.....|.#.#.|#.#.#|.#.#.|.....|.....',
  '✓': '.....|....#|...#.|#.#..|.#...|.....|.....',
  '♦': '..#..|.###.|#####|.###.|..#..|.....|.....',
  '—': '.....|.....|.....|#####|.....|.....|.....',
};

// accented variants built from bases
const ACC_LOWER = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
const ACC_UPPER = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };

function parse(s) { return s.split('|'); }

const GLYPHS = {};
function addGlyph(ch, rows, top = 0) {
  let w = 0;
  rows.forEach((r) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') w = Math.max(w, i + 1); });
  const width = Math.max(rows[0] ? rows[0].length : 1, 1);
  GLYPHS[ch] = { rows, top, w: Math.max(w, 1), width };
}

for (const ch in RAW) if (ch.length === 1) addGlyph(ch, parse(RAW[ch]));
addGlyph(' ', ['..', '..', '..', '..', '..', '..', '..']);
GLYPHS[' '].w = 2;

for (const ch in ACC_LOWER) {
  const base = parse(RAW[ACC_LOWER[ch]]).slice();
  const w = base[0].length;
  if (ACC_LOWER[ch] === 'i') { base[0] = '.#'; base[1] = '#.'; base[0] = '.#'; }
  else { base[0] = '.'.repeat(w - 2) + '#.' ; base[1] = '.'.repeat(w - 3) + '#..'; base[1] = base[1].slice(-w); }
  addGlyph(ch, base);
}
{
  const n = parse(RAW.n).slice(); n[0] = '.#.#'; n[1] = '#.#.'; addGlyph('ñ', n);
  const u = parse(RAW.u).slice(); u[0] = '#..#'; addGlyph('ü', u);
}
for (const ch in ACC_UPPER) {
  const base = parse(RAW[ACC_UPPER[ch]]);
  const w = base[0].length;
  const acc = '.'.repeat(Math.max(0, Math.floor(w / 2))) + '#' + '.'.repeat(Math.max(0, w - Math.floor(w / 2) - 1));
  addGlyph(ch, [acc, '.'.repeat(w), ...base], -2);
}
{
  const N = parse(RAW.N);
  addGlyph('Ñ', ['.##.#', '#..#.', ...N], -2);
  const U = parse(RAW.U);
  addGlyph('Ü', ['.#.#.', '.....', ...U], -2);
}

// Pre-rendered atlases by color. The main canvas is drawn at a higher internal
// resolution (see G.res), so there is also a smoothed "HD" atlas per resolution:
// each glyph is upscaled with Scale2x/Scale3x, which rounds the diagonals and keeps
// the exact same metrics as the 5x7 font.
const CELL_W = 6, CELL_H = 12, OFF_Y = 2; // top of glyph row 0 at y=2 in cell
const chars = Object.keys(GLYPHS);
const index = {};
chars.forEach((c, i) => (index[c] = i));
const COLS = 32;
const atlases = new Map();

function glyphGrid(g) {
  const grid = [];
  for (let y = 0; y < CELL_H; y++) grid.push(new Array(CELL_W).fill(0));
  g.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') { const yy = OFF_Y + g.top + ry; if (yy >= 0 && yy < CELL_H && rx < CELL_W) grid[yy][rx] = 1; }
  });
  return grid;
}
function px(g, x, y) { return y < 0 || x < 0 || y >= g.length || x >= g[0].length ? 0 : g[y][x]; }
function scale2x(g) {
  const h = g.length, w = g[0].length, o = [];
  for (let y = 0; y < h * 2; y++) o.push(new Array(w * 2).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const B = px(g, x, y - 1), D = px(g, x - 1, y), E = g[y][x], F = px(g, x + 1, y), Hh = px(g, x, y + 1);
    let e0 = E, e1 = E, e2 = E, e3 = E;
    if (B !== Hh && D !== F) { e0 = D === B ? D : E; e1 = B === F ? F : E; e2 = D === Hh ? D : E; e3 = Hh === F ? F : E; }
    // additive only: fill the inner steps of diagonals, never shave square corners (a "D" must stay a "D")
    o[y * 2][x * 2] = E | e0; o[y * 2][x * 2 + 1] = E | e1; o[y * 2 + 1][x * 2] = E | e2; o[y * 2 + 1][x * 2 + 1] = E | e3;
  }
  return o;
}
function scale3x(g) {
  const h = g.length, w = g[0].length, o = [];
  for (let y = 0; y < h * 3; y++) o.push(new Array(w * 3).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const A = px(g, x - 1, y - 1), B = px(g, x, y - 1), C = px(g, x + 1, y - 1), D = px(g, x - 1, y), E = g[y][x], F = px(g, x + 1, y), G2 = px(g, x - 1, y + 1), Hh = px(g, x, y + 1), I = px(g, x + 1, y + 1);
    let e = [E, E, E, E, E, E, E, E, E];
    if (B !== Hh && D !== F) {
      e = [
        D === B ? D : E,
        (D === B && E !== C) || (B === F && E !== A) ? B : E,
        B === F ? F : E,
        (D === B && E !== G2) || (D === Hh && E !== A) ? D : E,
        E,
        (B === F && E !== I) || (Hh === F && E !== C) ? F : E,
        D === Hh ? D : E,
        (D === Hh && E !== I) || (Hh === F && E !== G2) ? Hh : E,
        Hh === F ? F : E,
      ];
    }
    for (let k = 0; k < 9; k++) o[y * 3 + Math.floor(k / 3)][x * 3 + (k % 3)] = E | e[k];
  }
  return o;
}
const hdGrids = new Map();
function hdGrid(ch, k) {
  const key = ch + '|' + k;
  let g = hdGrids.get(key);
  if (!g) {
    g = glyphGrid(GLYPHS[ch]);
    if (k === 2) g = scale2x(g);
    else if (k === 3) g = scale3x(g);
    else if (k === 4) g = scale2x(scale2x(g));
    else if (k === 6) g = scale2x(scale3x(g));
    else if (k === 8) g = scale2x(scale2x(scale2x(g)));
    hdGrids.set(key, g);
  }
  return g;
}

function buildAtlas(color, k = 1) {
  const rowsN = Math.ceil(chars.length / COLS);
  const c = document.createElement('canvas');
  c.width = COLS * CELL_W * k; c.height = rowsN * CELL_H * k;
  const x = c.getContext('2d');
  x.fillStyle = color;
  chars.forEach((ch, i) => {
    const cx = (i % COLS) * CELL_W * k, cy = Math.floor(i / COLS) * CELL_H * k;
    if (k === 1) {
      const g = GLYPHS[ch];
      g.rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') x.fillRect(cx + rx, cy + OFF_Y + g.top + ry, 1, 1);
      });
    } else {
      const g = hdGrid(ch, k);
      for (let y = 0; y < g.length; y++) {
        let run = -1;
        for (let xx = 0; xx <= g[y].length; xx++) {
          const on = xx < g[y].length && g[y][xx];
          if (on && run < 0) run = xx;
          if (!on && run >= 0) { x.fillRect(cx + run, cy + y, xx - run, 1); run = -1; }
        }
      }
    }
  });
  return c;
}

function atlas(color, k) {
  const key = color + '@' + k;
  let a = atlases.get(key);
  if (!a) { a = buildAtlas(color, k); atlases.set(key, a); }
  return a;
}

export const LINE_H = 10;

export function charW(ch) {
  const g = GLYPHS[ch] || GLYPHS['?'];
  return g.w;
}

export function measure(str) {
  let w = 0;
  for (const ch of String(str)) w += charW(ch) + 1;
  return Math.max(0, w - 1);
}

// resolution of the target context (1 for offscreen canvases, 2-4 for the main one)
function resOf(ctx) {
  if (!ctx.getTransform) return 1;
  const a = ctx.getTransform().a;
  return a >= 7 ? 8 : a >= 5 ? 6 : a >= 3.5 ? 4 : a >= 2.5 ? 3 : a >= 1.5 ? 2 : 1;
}

// Draw text. opts: {align:'left'|'center'|'right', shadow:color, outline:color, scale}
export function text(ctx, str, x, y, color = '#fff', opts = {}) {
  str = String(str);
  const scale = opts.scale || 1;
  const w = measure(str) * scale;
  if (opts.align === 'center') x -= Math.floor(w / 2);
  else if (opts.align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  const k = resOf(ctx);
  if (opts.outline) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]])
      draw(ctx, str, x + dx * scale, y + dy * scale, opts.outline, scale, k);
  } else if (opts.shadow) {
    draw(ctx, str, x + scale, y + scale, opts.shadow, scale, k);
  }
  draw(ctx, str, x, y, color, scale, k);
  return w;
}

function draw(ctx, str, x, y, color, scale, k) {
  const a = atlas(color, k);
  let cx = x;
  for (const ch of str) {
    const g = GLYPHS[ch] || GLYPHS['?'];
    const i = index[GLYPHS[ch] ? ch : '?'];
    if (ch !== ' ') {
      const sx = (i % COLS) * CELL_W * k, sy = Math.floor(i / COLS) * CELL_H * k;
      ctx.drawImage(a, sx, sy, CELL_W * k, CELL_H * k, cx, y - OFF_Y * scale, CELL_W * scale, CELL_H * scale);
    }
    cx += (g.w + 1) * scale;
  }
}

// Word-wrap into lines no wider than maxW px
export function wrap(str, maxW) {
  const out = [];
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (measure(t) <= maxW || !line) line = t;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}
