// oozaK: a one-of-a-kind pedestrian in a silk floral shirt. He shows up once per save,
// always in the same (random) out-of-the-way spot, and the game never says where.
// Walk up to him and he talks... then knocks you out and dumps you in the river.
// If he dies, he never comes back.
import { G } from '../core/game.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { Ped } from './entities.js';
import { MAP, TS, tileAt, T, MW, MH, solidFoot } from './map.js';
import { dist, rand } from '../core/util.js';
import { runner, say, talk, wait, fadeOut, fadeIn, lock } from '../story/script.js';

// quiet corners of Puerto Vicio (tile coords): one is picked per save
const SPOTS = [[170, 22], [161, 121], [5, 92], [157, 126], [58, 124], [100, 9], [151, 64], [3, 40], [108, 98]];

function zoneOf(tx, ty) { return ty >= 94 ? 'afueras' : tx >= 118 ? 'puerto' : ty <= 53 ? 'centro' : 'colonia'; }
function walkable(x, y) { const t = tileAt(x, y); return !solidFoot(x, y) && t !== T.WATER && t !== T.ROAD; }
function spotPos(i) {
  const [sx, sy] = SPOTS[i % SPOTS.length];
  for (let r = 0; r < 10; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (walkable(sx + dx, sy + dy)) return { x: (sx + dx) * TS + 8, y: (sy + dy) * TS + 8, tx: sx + dx, ty: sy + dy };
  }
  return { x: sx * TS + 8, y: sy * TS + 8, tx: sx, ty: sy };
}
// the closest bit of river (water you can swim out of) to a point
function riverNear(x, y) {
  const tx0 = Math.floor(x / TS), ty0 = Math.floor(y / TS);
  for (let r = 1; r < 90; r++) for (let dy = -r; dy <= r; dy += r * 2 || 1) for (let dx = -r; dx <= r; dx++) {
    for (const [ax, ay] of [[tx0 + dx, ty0 + dy], [tx0 + dy, ty0 + dx]]) {
      if (ax < 1 || ay < 1 || ax >= MW - 1 || ay >= MH - 1 || tileAt(ax, ay) !== T.WATER || MAP.rail[ay * MW + ax]) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) => walkable(ax + ex, ay + ey))) return { x: ax * TS + 8, y: ay * TS + 8 };
    }
  }
  return { x: 60 * TS, y: 54 * TS + 8 };
}

export const oozak = {
  ped: null, busy: false,
  update(c, dt) {
    const s = G.state;
    if (!s || s.flags.oozak || this.busy) return;
    if (this.ped && !c.peds.includes(this.ped)) this.ped = null;
    if (G.story?.active || G.lockInput || G.scene !== c) return;
    if (s.flags.oozakSpot === undefined) s.flags.oozakSpot = Math.floor(Math.random() * SPOTS.length);
    const spot = spotPos(s.flags.oozakSpot);
    const z = zoneOf(spot.tx, spot.ty);
    if (z !== 'colonia' && !s.unlocked[z]) return;
    const pos = c.pos();
    let q = this.ped;
    if (!q && dist(pos.x, pos.y, spot.x, spot.y) < 340) {
      q = this.ped = new Ped('oozak', spot.x, spot.y);
      Object.assign(q, { mission: true, oozak: true, state: 'idle', timer: 999, hp: 60, maxHp: 60, speed: 22 });
      c.peds.push(q);
    }
    if (!q) return;
    if (q.state === 'dead') { s.flags.oozak = 'dead'; this.ped = null; return; }
    if (dist(pos.x, pos.y, q.x, q.y) > 700) { c.removePed(q); this.ped = null; return; }
    // he paces around his corner
    if (q.state === 'idle') {
      q.paceT = (q.paceT || rand(1, 3)) - dt;
      if (q.paceT <= 0) { q.paceT = rand(2, 5); q.state = 'goto'; q.goal = { x: spot.x + rand(-24, 24), y: spot.y + rand(-16, 16), speed: 18 }; }
    }
    const p = c.player;
    if (!p.car && !p.dead && (q.state === 'idle' || q.state === 'goto') && dist(p.x, p.y, q.x, q.y) < 18) {
      this.busy = true;
      runner.run(this.meet(c, q), 'oozak');
    }
  },

  *meet(c, q) {
    try {
      lock(true);
      const p = c.player;
      p.moving = false;
      q.state = 'idle'; q.goal = null;
      q.a = Math.atan2(p.y - q.y, p.x - q.x); p.a = q.a + Math.PI;
      yield* talk([
        ['oozak', 'Hey. Tú. Bonita ciudad, ¿no? Yo la conocí cuando todavía se llamaba diferente.', 'smug'],
        ['kazoo', '...¿Perdón?', 'think'],
        ['oozak', 'Llegué en el 86. Me robaron la mercancía y el dinero en el muelle. Desde entonces no le doy la espalda a nadie.', 'serious'],
        ['kazoo', 'Qué bonita camisa.', 'normal'],
        ['oozak', 'Es de seda. ...¿Sabes qué es lo que más odio, chico?', 'serious'],
        ['kazoo', '¿Qué?', 'think'],
        ['oozak', 'Que me vean de cerca.', 'angry'],
      ]);
      q.punchAnim = 0.3;
      audio.sfx('punch'); audio.sfx('hit');
      c.shake(7); input.rumble(1, 1, 350); G.ui?.flash(0.9);
      yield* wait(0.35);
      yield* fadeOut(0.5);
      // he leaves you in the river, dizzy, a couple of hours later
      const w = riverNear(q.x, q.y);
      c.removePed(q); this.ped = null;
      G.state.flags.oozak = 'met';
      c.teleport(w.x, w.y, p.a);
      G.state.clock = (G.state.clock + 120) % 1440;
      G.drunkT = 30;
      c.player.hp = Math.max(25, c.player.hp - 30);
      yield* wait(1.4);
      yield* fadeIn(1.4);
      yield* say('kazoo', '...¿Qué pasó? ¿Quién era ese wey? ...¿Por qué huelo a coco?', 'shock');
    } finally {
      lock(false);
      this.busy = false;
    }
  },
};
