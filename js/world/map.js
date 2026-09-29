// Puerto Vicio — deterministic city layout, road graph and landmarks.
import { seeded } from '../core/util.js';
import { SHOPS } from '../data/shops.js';

export const T = {
  GRASS: 0, ROAD: 1, SIDEWALK: 2, WATER: 3, ROOF: 4, WALL: 5, DOOR: 6, TREE: 7, SAND: 8, DIRT: 9,
  FIELD: 10, BRIDGE: 11, PARKING: 12, FENCE: 13, PLAZA: 14, DOCK: 15, COURT: 16, BUSH: 17, BARRIER: 18, FOUNTAIN: 19, CONTAINER: 20,
};
export const MW = 176, MH = 128, TS = 16;

const SOLID_FOOT = new Set([T.WATER, T.ROOF, T.WALL, T.DOOR, T.TREE, T.FENCE, T.BARRIER, T.FOUNTAIN, T.CONTAINER, T.BUSH]);
const SOLID_CAR = new Set([T.WATER, T.ROOF, T.WALL, T.DOOR, T.TREE, T.FENCE, T.BARRIER, T.FOUNTAIN, T.CONTAINER]);

export const MAP = {
  tiles: new Uint8Array(MW * MH),
  bld: new Int16Array(MW * MH).fill(-1),
  rh: new Uint8Array(MW * MH).fill(255),
  rv: new Uint8Array(MW * MH).fill(255),
  buildings: [],
  roadsH: [], roadsV: [],
  nodes: [], edges: [],
  doors: [],
  places: {},
  barriers: { centro: [], puerto: [], afueras: [] },
  parking: [],
  collect: { cassettes: [], stars: [], graffiti: [], kazoos: [] },
  props: [],   // overhead decorations {type,x,y}
  pois: [],    // named places for the big map's index {id,name,x,y,icon,color,kind}
  pickups: [], // hearts, vests and bribe stars {kind,x,y}
};

export const idx = (x, y) => y * MW + x;
export function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MW || y >= MH) return T.WATER;
  return MAP.tiles[y * MW + x];
}
export function setTile(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) MAP.tiles[y * MW + x] = t; }
export const solidFoot = (x, y) => SOLID_FOOT.has(tileAt(x, y));
export const solidCar = (x, y) => SOLID_CAR.has(tileAt(x, y));
export const solidFootPx = (px, py) => solidFoot(Math.floor(px / TS), Math.floor(py / TS));
export const solidCarPx = (px, py) => solidCar(Math.floor(px / TS), Math.floor(py / TS));
export function isRoad(x, y) { const t = tileAt(x, y); return t === T.ROAD || t === T.BRIDGE; }
export function isWalkway(x, y) { const t = tileAt(x, y); return t === T.SIDEWALK || t === T.PLAZA || t === T.PARKING || t === T.DOCK; }

export function zoneOf(tx, ty) {
  if (ty >= 94) return 'afueras';
  if (tx >= 118) return 'puerto';
  if (ty <= 53) return 'centro';
  return 'colonia';
}
export const ZONE_NAMES = { colonia: 'LA COLONIA', centro: 'EL CENTRO', puerto: 'EL PUERTO', afueras: 'LAS AFUERAS' };

function fill(x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setTile(x, y, t);
}

function roadH(y, x1, x2) {
  MAP.roadsH.push({ y, x1, x2 });
  for (let x = x1; x <= x2; x++) for (let r = 0; r < 4; r++) {
    const i = idx(x, y + r);
    MAP.tiles[i] = MAP.tiles[i] === T.WATER || MAP.tiles[i] === T.BRIDGE ? T.BRIDGE : T.ROAD;
    MAP.rh[i] = r;
  }
}
function roadV(x, y1, y2) {
  MAP.roadsV.push({ x, y1, y2 });
  for (let y = y1; y <= y2; y++) for (let r = 0; r < 4; r++) {
    const i = idx(x + r, y);
    MAP.tiles[i] = MAP.tiles[i] === T.WATER || MAP.tiles[i] === T.BRIDGE ? T.BRIDGE : T.ROAD;
    MAP.rv[i] = r;
  }
}

function canPlace(x, y, w, h) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const t = tileAt(xx, yy);
    if (t !== T.GRASS || MAP.bld[idx(xx, yy)] >= 0) return false;
  }
  return true;
}

function building(b) {
  const id = MAP.buildings.length;
  b.id = id;
  MAP.buildings.push(b);
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
    MAP.tiles[idx(x, y)] = y === b.y + b.h - 1 ? T.WALL : T.ROOF;
    MAP.bld[idx(x, y)] = id;
  }
  if (b.door) {
    MAP.tiles[idx(b.door.x, b.door.y)] = T.DOOR;
    if (b.room) MAP.doors.push({ x: b.door.x, y: b.door.y, room: b.room, bid: id, name: b.name });
    if (b.door2) { MAP.tiles[idx(b.door2.x, b.door2.y)] = T.DOOR; }
  }
  return b;
}

const ROOFS = {
  colonia: ['#e07a5a', '#f0c850', '#5ac8b4', '#f08c28', '#e86aa0', '#a0dc50', '#d8d0c0', '#c8644a', '#78a8e0'],
  centro: ['#8a8a9a', '#6a7a8e', '#9aa0b0', '#5a6478', '#b0a898', '#7a6a8a', '#4a5a6e'],
  puerto: ['#8a7a6a', '#6e6e82', '#9a6a4a', '#7a8a8a', '#5a5a64', '#a08a6a'],
  afueras: ['#9a6a4a', '#c8a064', '#8a8a7a'],
};

export function buildMap() {
  const rnd = seeded(20260928);
  const t = MAP.tiles;
  t.fill(T.GRASS);

  // ---------- water
  fill(164, 0, 175, 127, T.WATER);
  fill(0, 53, 113, 56, T.WATER);          // canal A
  fill(114, 0, 117, 127, T.WATER);        // canal B
  fill(160, 0, 163, 93, T.DOCK);          // port quay
  for (const py of [20, 50, 80]) fill(164, py, 171, py + 3, T.DOCK);
  fill(160, 94, 163, 127, T.SAND); fill(164, 110, 165, 127, T.SAND);

  // ---------- roads
  for (const y of [2, 32, 47]) roadH(y, 2, 105);
  for (const y of [60, 90]) roadH(y, 2, 105);
  roadH(17, 2, 159); roadH(75, 2, 159);
  for (const y of [2, 32, 47, 60, 90]) roadH(y, 122, 159);
  roadH(110, 2, 159);                      // carretera vieja
  for (const x of [2, 42, 82]) { roadV(x, 2, 50); roadV(x, 60, 93); }
  roadV(22, 2, 116); roadV(62, 2, 113); roadV(102, 2, 113);
  roadV(122, 2, 93); roadV(156, 2, 93); roadV(140, 2, 113);
  // dirt path to the field (the trailer's "camino")
  fill(128, 114, 129, 123, T.DIRT);

  // ---------- sidewalks (urban)
  for (let y = 0; y < 94; y++) for (let x = 0; x < 164; x++) {
    if (t[idx(x, y)] !== T.GRASS) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const tt = tileAt(x + dx, y + dy);
      if (tt === T.ROAD || tt === T.BRIDGE) { near = true; break; }
    }
    if (near) t[idx(x, y)] = T.SIDEWALK;
  }
  // map border trees
  for (let x = 0; x < 164; x++) { if (t[idx(x, 0)] === T.GRASS) t[idx(x, 0)] = T.TREE; }
  for (let y = 0; y < 128; y++) { if (t[idx(0, y)] === T.GRASS) t[idx(0, y)] = T.TREE; }

  // ---------- landmarks
  const L = (b) => building(b);
  // Colonia
  L({ x: 29, y: 70, w: 8, h: 4, roof: '#e07a5a', name: 'PENSIÓN LAS PALMAS', sign: 'PENSIÓN', door: { x: 32, y: 73 }, room: 'cuarto', awning: '#2c8c5a' });
  L({ x: 48, y: 70, w: 7, h: 4, roof: '#46b450', name: 'TACOS EL COMPA', sign: 'TACOS', door: { x: 51, y: 73 }, room: 'taqueria', awning: '#d8323c' });
  L({ x: 9, y: 70, w: 6, h: 4, roof: '#f4f4f0', name: 'ABARROTES LUPITA', sign: 'LUPITA', door: { x: 11, y: 73 }, room: 'tiendita', awning: '#28b4a0' });
  L({ x: 88, y: 70, w: 8, h: 4, roof: '#f4f4f0', name: 'CLÍNICA', sign: 'CLÍNICA', door: { x: 91, y: 73 }, cross: true });
  L({ x: 68, y: 83, w: 11, h: 6, roof: '#f46eaa', name: 'CASA DE DON CHUY', sign: 'DON CHUY', door: { x: 73, y: 88 }, room: 'donchuy', fancy: true });
  L({ x: 88, y: 84, w: 8, h: 5, roof: '#3c64dc', name: 'PINTA Y OLVIDA', sign: 'PINTA Y OLVIDA', door: { x: 92, y: 88 }, garage: true, awning: '#ffd23f' });
  fill(47, 80, 60, 88, T.COURT);
  // Centro
  L({ x: 47, y: 22, w: 14, h: 9, roof: '#c8c8d0', name: 'BANCO FEDERAL', sign: 'BANCO FEDERAL', door: { x: 53, y: 30 }, door2: { x: 54, y: 30 }, room: 'banco', marble: true });
  L({ x: 68, y: 41, w: 9, h: 5, roof: '#6a2a8a', name: 'LA ÚLTIMA RISA', sign: 'LA ÚLTIMA RISA', door: { x: 72, y: 45 }, room: 'bar', neon: '#ff3cc8' });
  L({ x: 29, y: 42, w: 7, h: 4, roof: '#f08c28', name: 'DISFRACES CARNAVAL', sign: 'DISFRACES', door: { x: 32, y: 45 }, room: 'disfraces', awning: '#8c46c8' });
  L({ x: 87, y: 22, w: 14, h: 9, roof: '#1e2c78', name: 'COMANDANCIA', sign: 'POLICÍA', door: { x: 93, y: 30 }, room: 'comandancia', police: true });
  L({ x: 7, y: 22, w: 14, h: 4, roof: '#e8e0d0', name: 'PLAZA VICIO', sign: 'PLAZA VICIO', door: { x: 13, y: 25 }, awning: '#f46eaa' });
  fill(7, 26, 20, 30, T.PARKING);
  fill(27, 7, 40, 15, T.PLAZA);
  fill(47, 7, 60, 15, T.PLAZA);
  fill(52, 10, 55, 12, T.FOUNTAIN);
  for (const [x, y] of [[48, 8], [59, 8], [48, 14], [59, 14], [28, 8], [39, 8]]) setTile(x, y, T.TREE);
  L({ x: 67, y: 7, w: 14, h: 5, roof: '#d8323c', name: 'CINE VICIO', sign: 'CINE VICIO', door: { x: 73, y: 11 }, awning: '#ffd23f' });
  L({ x: 88, y: 42, w: 8, h: 4, roof: '#3c64dc', name: 'PINTA Y OLVIDA', sign: 'PINTA Y OLVIDA', door: { x: 92, y: 45 }, garage: true, awning: '#ffd23f' });
  // Puerto
  L({ x: 128, y: 41, w: 9, h: 5, roof: '#6e5a4a', name: 'TALLER ABANDONADO', sign: 'TALLER', door: { x: 132, y: 45 }, room: 'escondite', rusty: true });
  L({ x: 145, y: 69, w: 9, h: 5, roof: '#5a6a3a', name: 'GALPÓN', sign: '', door: { x: 149, y: 73 }, room: 'galpon', rusty: true });
  L({ x: 145, y: 26, w: 10, h: 5, roof: '#a8a8b8', name: 'BODEGA 7', sign: 'BODEGA 7', door: { x: 149, y: 30 }, room: 'bodega', warehouse: true });
  // Afueras
  L({ x: 70, y: 102, w: 10, h: 6, roof: '#8c5a32', name: 'TALLER EL TUERCAS', sign: 'EL TUERCAS', door: { x: 74, y: 107 }, room: 'tuercas', rusty: true });
  L({ x: 88, y: 103, w: 9, h: 5, roof: '#f4f4f0', name: 'GASOLINERA', sign: 'GAS', door: null, awning: '#d8323c' });
  // Penal
  fill(4, 117, 40, 117, T.FENCE); fill(4, 127, 40, 127, T.FENCE); fill(4, 117, 4, 127, T.FENCE); fill(40, 117, 40, 127, T.FENCE);
  fill(5, 118, 39, 126, T.DIRT);
  building({ x: 8, y: 120, w: 12, h: 5, roof: '#7a7a82', name: 'PENAL', sign: 'CERESO PV' });
  building({ x: 27, y: 120, w: 10, h: 5, roof: '#7a7a82', name: 'PENAL' });
  MAP.props.push({ type: 'tower', x: 5 * TS, y: 118 * TS }, { type: 'tower', x: 39 * TS, y: 118 * TS });
  MAP.props.push({ type: 'gate', x: 22 * TS, y: 117 * TS });
  // Field
  fill(118, 114, 159, 127, T.FIELD); fill(128, 114, 129, 123, T.DIRT);
  MAP.props.push({ type: 'bigtree', x: 146 * TS + 8, y: 121 * TS + 8 });
  setTile(146, 121, T.TREE);
  MAP.props.push({ type: 'billboard', x: 34 * TS, y: 11 * TS });

  // keep a clear path in front of every landmark door
  for (const b of MAP.buildings) if (b.door) {
    let y = b.door.y + 1;
    while (tileAt(b.door.x, y) === T.GRASS) { setTile(b.door.x, y, T.PLAZA); y++; }
  }

  // ---------- barriers (zone locks)
  const bar = (zone, x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) MAP.barriers[zone].push([x, y]); };
  for (const x of [22, 62, 102]) bar('centro', x, 57, x + 3, 57);
  bar('puerto', 113, 17, 113, 20); bar('puerto', 113, 75, 113, 78); bar('puerto', 140, 95, 143, 95);
  for (const x of [22, 62, 102]) bar('afueras', x, 95, x + 3, 95);

  // ---------- generic blocks
  const westX = [2, 22, 42, 62, 82, 102], westYc = [2, 17, 32, 47], westYl = [60, 75, 90];
  const puertoX = [122, 140, 156], puertoY = [2, 17, 32, 47, 60, 75, 90];
  const blocks = [];
  const addBlocks = (xs, ys, zone) => {
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++)
      blocks.push({ x0: xs[i] + 5, y0: ys[j] + 5, x1: xs[i + 1] - 2, y1: ys[j + 1] - 2, zone });
  };
  addBlocks(westX, westYc, 'centro'); addBlocks(westX, westYl, 'colonia'); addBlocks(puertoX, puertoY, 'puerto');
  // east strip blocks (next to canal)
  for (const ys of [westYc, westYl]) for (let j = 0; j < ys.length - 1; j++) blocks.push({ x0: 107, y0: ys[j] + 5, x1: 112, y1: ys[j + 1] - 2, zone: ys === westYc ? 'centro' : 'colonia' });

  for (const b of blocks) {
    const h = b.y1 - b.y0 + 1;
    const roll = rnd();
    if (b.zone === 'colonia' && roll < 0.12) { park(b, rnd); continue; }
    if (b.zone === 'centro' && roll < 0.08) { parkingLot(b, rnd); continue; }
    if (b.zone === 'puerto' && roll < 0.3) { containerYard(b, rnd); continue; }
    const rows = h >= 9 ? [[b.y0, 4], [b.y1 - 3, 4]] : [[b.y0, Math.min(4, h)]];
    for (const [ry, rh] of rows) {
      let x = b.x0;
      while (x <= b.x1 - 2) {
        const maxW = b.zone === 'puerto' ? 9 : b.zone === 'centro' ? 7 : 5;
        let w = Math.min(rnd.int(b.zone === 'colonia' ? 3 : 4, maxW), b.x1 - x + 1);
        if (b.x1 - (x + w) < 2) w = b.x1 - x + 1;
        if (w >= 3 && canPlace(x, ry, w, rh)) {
          building({ x, y: ry, w, h: rh, roof: rnd.pick(ROOFS[b.zone]), zone: b.zone, door: { x: x + Math.floor(w / 2), y: ry + rh - 1 }, generic: true, warehouse: b.zone === 'puerto' });
        }
        x += w + (rnd() < 0.3 ? 1 : 0);
      }
    }
    // alley decoration
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) {
      if (tileAt(x, y) === T.GRASS && rnd() < (b.zone === 'colonia' ? 0.12 : 0.05)) setTile(x, y, rnd() < 0.5 ? T.TREE : T.BUSH);
    }
  }

  // ---------- afueras scenery
  for (let i = 0; i < 260; i++) {
    const x = rnd.int(2, 163), y = rnd.int(95, 127);
    if (tileAt(x, y) === T.GRASS) setTile(x, y, rnd() < 0.7 ? T.TREE : T.BUSH);
  }
  for (let i = 0; i < 14; i++) {
    const x = rnd.int(44, 110), y = rnd.int(115, 124), w = rnd.int(4, 9), h = rnd.int(2, 4);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (tileAt(xx, yy) === T.GRASS) setTile(xx, yy, T.FIELD);
  }
  for (let i = 0; i < 40; i++) {
    const x = rnd.int(2, 110), y = rnd.int(96, 127);
    if (tileAt(x, y) === T.GRASS) setTile(x, y, T.DIRT);
  }
  // make sure the field near the tree stays clear
  for (let y = 116; y <= 126; y++) for (let x = 140; x <= 152; x++) if (tileAt(x, y) === T.TREE || tileAt(x, y) === T.BUSH) setTile(x, y, T.FIELD);
  setTile(146, 121, T.TREE);

  placeShops();
  applyBarriers({ centro: false, puerto: false, afueras: false });
  buildGraph();
  collectParking(rnd);
  placeCollectibles(rnd);
  definePlaces();
  placePickups();
}

// turn the generic building closest to each shop's `near` spot into that business
function placeShops() {
  const used = new Set();
  for (const sh of SHOPS) {
    let best = null, bd = Infinity;
    for (const b of MAP.buildings) {
      if (!b.generic || !b.door || used.has(b.id) || b.w < 4) continue;
      const d = Math.hypot(b.door.x - sh.near[0], b.door.y - sh.near[1]);
      if (d < bd) { bd = d; best = b; }
    }
    if (!best) continue;
    used.add(best.id);
    Object.assign(best, { name: sh.name, sign: sh.sign, room: sh.id, roof: sh.roof, awning: sh.awning, shop: sh.id, warehouse: false });
    MAP.doors.push({ x: best.door.x, y: best.door.y, room: sh.id, bid: best.id, name: sh.name });
    sh.bid = best.id;
  }
}

function park(b, rnd) {
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
    const edge = y === b.y0 || y === b.y1 || x === b.x0 || x === b.x1;
    if ((x + y) % 5 === 0 && !edge && rnd() < 0.6) setTile(x, y, T.TREE);
    else if (y === Math.floor((b.y0 + b.y1) / 2) || x === Math.floor((b.x0 + b.x1) / 2)) setTile(x, y, T.PLAZA);
  }
}
function parkingLot(b) { for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) setTile(x, y, T.PARKING); }
function containerYard(b, rnd) {
  for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) setTile(x, y, T.PARKING);
  for (let y = b.y0 + 1; y < b.y1; y += 3) for (let x = b.x0 + 1; x < b.x1 - 2; x += 5) {
    if (rnd() < 0.8) {
      const col = rnd.pick(['#d8323c', '#3c64dc', '#46b450', '#f08c28', '#28b4a0', '#8c46c8']);
      const id = MAP.buildings.length;
      MAP.buildings.push({ id, x, y, w: 4, h: 2, roof: col, container: true });
      for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 4; xx++) { setTile(xx, yy, T.CONTAINER); MAP.bld[idx(xx, yy)] = id; }
    }
  }
}

export function applyBarriers(unlocked) {
  for (const zone in MAP.barriers) {
    for (const [x, y] of MAP.barriers[zone]) {
      const road = MAP.rh[idx(x, y)] !== 255 || MAP.rv[idx(x, y)] !== 255;
      setTile(x, y, unlocked[zone] ? (road ? T.ROAD : T.GRASS) : T.BARRIER);
    }
  }
  MAP.unlocked = { ...unlocked };
}

// ---------------------------------------------------------------- road graph
function buildGraph() {
  const nodes = [], key = new Map();
  const nodeAt = (px, py, h, v, dead) => {
    const k = px + ',' + py;
    let n = key.get(k);
    if (!n) { n = { id: nodes.length, x: px, y: py, h, v, dead: !!dead, out: [null, null, null, null] }; nodes.push(n); key.set(k, n); }
    if (h && !n.h) n.h = h; if (v && !n.v) n.v = v;
    return n;
  };
  for (const h of MAP.roadsH) for (const v of MAP.roadsV) {
    if (v.x >= h.x1 && v.x + 3 <= h.x2 && h.y >= v.y1 && h.y + 3 <= v.y2) nodeAt((v.x + 2) * TS, (h.y + 2) * TS, h, v);
  }
  const edges = [];
  const link = (a, b, dir, road) => {
    const e = { id: edges.length, from: a, to: b, dir, road };
    edges.push(e); a.out[dir] = e;
  };
  for (const h of MAP.roadsH) {
    const on = nodes.filter((n) => n.h === h || (n.v && n.y === (h.y + 2) * TS && n.x >= h.x1 * TS && n.x <= (h.x2 + 1) * TS));
    on.forEach((n) => (n.h ||= h));
    on.sort((a, b) => a.x - b.x);
    // dead ends
    if (!on.length || on[0].x > (h.x1 + 2) * TS) on.unshift(nodeAt((h.x1 + 1) * TS, (h.y + 2) * TS, h, null, true));
    if (on[on.length - 1].x < (h.x2 - 1) * TS) on.push(nodeAt((h.x2) * TS, (h.y + 2) * TS, h, null, true));
    for (let i = 0; i < on.length - 1; i++) { link(on[i], on[i + 1], 0, h); link(on[i + 1], on[i], 2, h); }
  }
  for (const v of MAP.roadsV) {
    const on = nodes.filter((n) => n.v === v);
    on.sort((a, b) => a.y - b.y);
    if (!on.length || on[0].y > (v.y1 + 2) * TS) on.unshift(nodeAt((v.x + 2) * TS, (v.y1 + 1) * TS, null, v, true));
    if (on[on.length - 1].y < (v.y2 - 1) * TS) on.push(nodeAt((v.x + 2) * TS, (v.y2) * TS, null, v, true));
    for (let i = 0; i < on.length - 1; i++) { link(on[i], on[i + 1], 1, v); link(on[i + 1], on[i], 3, v); }
  }
  MAP.nodes = nodes; MAP.edges = edges;
}

// lane helpers
export function laneY(h, dir) { return dir === 0 ? (h.y + 3) * TS : (h.y + 1) * TS; }
export function laneX(v, dir) { return dir === 1 ? (v.x + 1) * TS : (v.x + 3) * TS; }
export const DIRV = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// point where a car traveling `dir` leaves/enters node n
export function nodeExit(n, dir) {
  const half = n.dead ? 0 : 32;
  if (dir === 0) return { x: n.x + half, y: laneY(n.h, 0) };
  if (dir === 2) return { x: n.x - half, y: laneY(n.h, 2) };
  if (dir === 1) return { x: laneX(n.v, 1), y: n.y + half };
  return { x: laneX(n.v, 3), y: n.y - half };
}
export function nodeEntry(n, dir) {
  const half = n.dead ? 0 : 32;
  if (dir === 0) return { x: n.x - half, y: laneY(n.h, 0) };
  if (dir === 2) return { x: n.x + half, y: laneY(n.h, 2) };
  if (dir === 1) return { x: laneX(n.v, 1), y: n.y - half };
  return { x: laneX(n.v, 3), y: n.y + half };
}

export function edgeBlocked(e) {
  // edge is blocked if any barrier tile lies on it
  const a = e.from, b = e.to;
  const x0 = Math.min(a.x, b.x) / TS, x1 = Math.max(a.x, b.x) / TS, y0 = Math.min(a.y, b.y) / TS, y1 = Math.max(a.y, b.y) / TS;
  if (e.dir === 0 || e.dir === 2) {
    const y = Math.floor(laneY(e.road, e.dir) / TS);
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (tileAt(x, y) === T.BARRIER || tileAt(x, y - 1) === T.BARRIER) return true;
  } else {
    const x = Math.floor(laneX(e.road, e.dir) / TS);
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) if (tileAt(x, y) === T.BARRIER || tileAt(x - 1, y) === T.BARRIER) return true;
  }
  return false;
}

function collectParking(rnd) {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (tileAt(x, y) === T.PARKING && x % 3 === 1 && y % 2 === 0 && tileAt(x, y + 1) === T.PARKING && rnd() < 0.35) MAP.parking.push({ x: x * TS + 8, y: y * TS + 16, a: Math.PI / 2 });
  }
}

function placeCollectibles(rnd) {
  const walk = (x, y) => [T.SIDEWALK, T.GRASS, T.PLAZA, T.PARKING, T.DOCK, T.SAND, T.DIRT, T.FIELD, T.COURT].includes(tileAt(x, y));
  const zones = ['colonia', 'centro', 'puerto', 'afueras'];
  const pickIn = (zone, test) => {
    for (let tries = 0; tries < 4000; tries++) {
      const x = rnd.int(2, 163), y = rnd.int(2, 126);
      if (zoneOf(x, y) !== zone || !test(x, y)) continue;
      if (MAP.barriers.centro.some(([bx, by]) => Math.abs(bx - x) + Math.abs(by - y) < 3)) continue;
      return { x: x * TS + 8, y: y * TS + 8 };
    }
    return null;
  };
  const hidden = (x, y) => walk(x, y) && tileAt(x, y) !== T.SIDEWALK && (solidFoot(x - 1, y) || solidFoot(x + 1, y) || solidFoot(x, y - 1));
  // 15 cassettes (4/4/4/3), 10 stars, 5 kazoos
  const counts = { cassettes: [4, 4, 4, 3], stars: [3, 3, 2, 2], kazoos: [1, 2, 1, 1] };
  for (const kind in counts) counts[kind].forEach((n, zi) => {
    for (let i = 0; i < n; i++) { const p = pickIn(zones[zi], hidden) || pickIn(zones[zi], walk); if (p) MAP.collect[kind].push({ ...p, zone: zones[zi] }); }
  });
  // 20 graffiti spots: building walls facing a walkable tile
  const walls = [];
  for (let y = 1; y < 93; y++) for (let x = 1; x < 163; x++) {
    if (tileAt(x, y) === T.WALL && walk(x, y + 1) && MAP.buildings[MAP.bld[idx(x, y)]]?.generic) walls.push([x, y]);
  }
  for (let i = 0; i < 20 && walls.length; i++) {
    const j = Math.floor(rnd() * walls.length);
    const [x, y] = walls.splice(j, 1)[0];
    MAP.collect.graffiti.push({ x: x * TS + 8, y: y * TS + 8, tx: x, ty: y, zone: zoneOf(x, y) });
  }
}

// health hearts, bulletproof vests and bribe stars (own RNG so the collectibles don't move)
function placePickups() {
  const rnd = seeded(777);
  const ok = (x, y) => [T.SIDEWALK, T.PLAZA, T.PARKING, T.DOCK, T.DIRT, T.COURT].includes(tileAt(x, y)) && !MAP.barriers.centro.concat(MAP.barriers.puerto, MAP.barriers.afueras).some(([bx, by]) => Math.abs(bx - x) + Math.abs(by - y) < 3);
  const plan = { colonia: [5, 2, 2], centro: [4, 2, 2], puerto: [3, 2, 2], afueras: [2, 1, 1] };
  const kinds = ['health', 'armor', 'bribe'];
  const taken = [];
  for (const zone in plan) plan[zone].forEach((n, k) => {
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 3000; tries++) {
        const x = rnd.int(2, 163), y = rnd.int(2, 126);
        if (zoneOf(x, y) !== zone || !ok(x, y)) continue;
        if (taken.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 14)) continue;
        taken.push([x, y]);
        MAP.pickups.push({ kind: kinds[k], x: x * TS + 8, y: y * TS + 8, zone });
        break;
      }
    }
  });
}

function definePlaces() {
  const P = MAP.places;
  const doorFront = (name) => { const b = MAP.buildings.find((b) => b.name === name); return { x: b.door.x * TS + 8, y: (b.door.y + 1) * TS + 8 }; };
  P.pension = doorFront('PENSIÓN LAS PALMAS');
  P.taqueria = doorFront('TACOS EL COMPA');
  P.tiendita = doorFront('ABARROTES LUPITA');
  P.clinica = doorFront('CLÍNICA');
  P.donchuy = doorFront('CASA DE DON CHUY');
  P.banco = { x: 54 * TS, y: 31 * TS + 8 };
  P.bar = doorFront('LA ÚLTIMA RISA');
  P.disfraces = doorFront('DISFRACES CARNAVAL');
  P.comandancia = doorFront('COMANDANCIA');
  P.plazavicio = { x: 14 * TS, y: 28 * TS };
  P.escondite = doorFront('TALLER ABANDONADO');
  P.galpon = doorFront('GALPÓN');
  P.bodega = doorFront('BODEGA 7');
  P.tuercas = doorFront('TALLER EL TUERCAS');
  P.penal = { x: 24 * TS, y: 115 * TS };
  P.campo = { x: 128 * TS + 16, y: 118 * TS };
  P.arbol = { x: 146 * TS + 8, y: 122 * TS + 8 };
  P.loma = { x: 138 * TS, y: 115 * TS };
  P.caminoFin = { x: 129 * TS, y: 121 * TS };
  P.pintaCol = { x: 92 * TS + 8, y: 89 * TS + 8 };
  P.pintaCen = { x: 92 * TS + 8, y: 46 * TS + 8 };
  P.gasolinera = { x: 92 * TS, y: 109 * TS };
  P.billboard = { x: 34 * TS, y: 13 * TS };
  for (const sh of SHOPS) if (sh.bid !== undefined) { const b = MAP.buildings[sh.bid]; P[sh.id] = { x: b.door.x * TS + 8, y: (b.door.y + 1) * TS + 8 }; }
  // index for the big map
  const poi = (id, name, icon, color, kind) => P[id] && MAP.pois.push({ id, name, icon, color, kind, x: P[id].x, y: P[id].y });
  poi('pension', 'Pensión Las Palmas (tu cuarto)', 'H', '#ffd23f', 'lugar');
  poi('taqueria', 'Tacos El Compa', 'T', '#f07aa8', 'comida');
  poi('tiendita', 'Abarrotes Lupita', '$', '#28b4a0', 'tienda');
  poi('clinica', 'Clínica', '+', '#f4f4f0', 'lugar');
  poi('donchuy', 'Casa de Don Chuy', 'D', '#c8a03c', 'lugar');
  poi('pintaCol', 'Pinta y Olvida (Colonia)', 'P', '#ffd23f', 'servicio');
  poi('pintaCen', 'Pinta y Olvida (Centro)', 'P', '#ffd23f', 'servicio');
  poi('banco', 'Banco Federal', 'B', '#c8c8d0', 'lugar');
  poi('bar', 'La Última Risa (bar)', 'b', '#ff3cc8', 'bar');
  poi('disfraces', 'Disfraces Carnaval', 'M', '#f08c28', 'tienda');
  poi('comandancia', 'Comandancia de policía', '★', '#5a9cff', 'lugar');
  poi('plazavicio', 'Plaza Vicio', 'S', '#f46eaa', 'lugar');
  poi('escondite', 'Taller abandonado', 'E', '#a8a8b8', 'lugar');
  poi('galpon', 'Galpón (La Tía Gris)', 'G', '#a0b070', 'tienda');
  poi('bodega', 'Bodega 7', '7', '#a8a8b8', 'lugar');
  poi('tuercas', 'Taller El Tuercas', 'W', '#6a8cc8', 'lugar');
  poi('gasolinera', 'Gasolinera', 'g', '#d8323c', 'servicio');
  poi('penal', 'Penal (CERESO PV)', 'X', '#7a7a82', 'lugar');
  poi('campo', 'El campo', 'C', '#a0dc50', 'lugar');
  const ICON = { ropa: ['R', '#f46eaa', 'ropa'], zapateria: ['Z', '#5adcf0', 'ropa'], restaurante: ['F', '#f08c28', 'comida'], bar: ['b', '#c878f0', 'bar'] };
  for (const sh of SHOPS) { const [ic, col, kind] = ICON[sh.kind]; poi(sh.id, titleCase(sh.name), ic, col, kind); }
}
function titleCase(s) { return s.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\bPv\b/g, 'PV'); }
