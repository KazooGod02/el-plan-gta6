// Shared helpers for missions.
import { G, setScene } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { input } from '../../core/input.js';
import { LOOKS } from '../../data/cast.js';
import { Ped } from '../../world/entities.js';
import { MAP, TS } from '../../world/map.js';
import { say, wait, until } from '../script.js';
import { dist } from '../../core/util.js';

export const P = () => MAP.places;
export const C = () => G.scenes.city;
export const R = () => G.scenes.interior;
export const S = () => G.state;

// auto-advancing line (for dialogue while driving / walking)
export function* line(who, text, expr = 'normal') {
  yield* say(who, text, expr, { auto: 1.6 + text.length / 17 });
}
export function* lines(list) { for (const l of list) yield* line(l[0], l[1], l[2]); }

export function maskedLook(id) {
  const m = S().masks[id];
  return { ...LOOKS[id], mask: m, _id: id + 'M' + m };
}

// ally ped that follows the player in the city
export function ally(look, x, y, label) {
  const c = C();
  const lookId = typeof look === 'string' ? look : null;
  const p = c.spawnPed(look, x, y, { ally: true, follow: true, state: 'follow', keep: true, invuln: true, label: label || null, labelColor: (LOOKS[lookId] || {}).color });
  p.hp = 999;
  return p;
}
// put an ally directly inside a vehicle
export function seat(v, look, label) {
  const p = new Ped(look, v.x, v.y);
  Object.assign(p, { ally: true, follow: true, state: 'follow', keep: true, invuln: true, mission: true, label: label || null, hp: 999 });
  v.passengers.push(p);
  return p;
}
export function carHas(v, ped) { return v && v.passengers.includes(ped); }
export function playerCar() { return C().player.car; }

// press A repeatedly (for kicking the moto, digging, filling the bag...)
export function* mash(n, label, onPress) {
  let k = 0;
  UI.meter = { label, v: 0, col: '#ffd23f' };
  while (k < n) {
    if (input.pressed('a') || input.pressed('b')) { k++; UI.meter.v = k / n; if (onPress) onPress(k); }
    yield;
  }
  UI.meter = null;
}

export function unlockZone(zone) {
  const s = S();
  if (s.unlocked[zone]) return;
  s.unlocked[zone] = true;
  C().setUnlocked(s.unlocked);
  const names = { centro: 'EL CENTRO', puerto: 'EL PUERTO', afueras: 'LAS AFUERAS' };
  UI.toast(names[zone] + ' desbloqueado', '#46d470', 4);
  audio.sfx('star');
}

// Walk the player (city top-down) somewhere automatically
export function* autoWalk(x, y, speed = 45) {
  const p = C().player;
  let t = 0;
  while (dist(p.x, p.y, x, y) > 3 && t < 8) {
    const dt = yield; t += dt;
    const a = Math.atan2(y - p.y, x - p.x);
    p.a = a; p.moving = true; p.anim += dt;
    const st = Math.min(dist(p.x, p.y, x, y), speed * dt);
    p.x += Math.cos(a) * st; p.y += Math.sin(a) * st;
  }
  p.moving = false;
}

// place player and ensure a scene
export function cityAt(place, dy = 10, opts = {}) {
  const p = typeof place === 'string' ? P()[place] : place;
  setScene('city', { x: p.x, y: p.y + dy, a: opts.a ?? Math.PI / 2, ...opts });
}
export function roomAt(room, x, opts = {}) {
  setScene('interior', { room, x, ...opts });
}

export function* waitScene(name) { yield* until(() => G.scene === G.scenes[name]); }

export function pedsNear(x, y, r) { return C().peds.filter((q) => dist(q.x, q.y, x, y) < r); }

export function dumb() { S().flags.dumb = (S().flags.dumb || 0) + 1; if (S().flags.dumb >= 10) import('../achievements.js').then((m) => m.unlock('realq')); }
