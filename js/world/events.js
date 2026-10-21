// Random street events: a fight, a mugging, a police chase, a fender bender.
// They happen around you but never during a story mission, and they leave you alone
// unless you get involved (hit someone, and they're your problem now).
import { G } from '../core/game.js';
import { Ped, Vehicle, randomCivilian } from './entities.js';
import { MAP, TS, tileAt, T, isWalkway, edgeBlocked } from './map.js';
import { dist, rand, pick, chance, lerp } from '../core/util.js';

const ONLOOKER = ['¡Pégale!', '¡Ya sepárense!', 'Uy, eso dolió.', '¡Grábalo, grábalo!', '¡Llamen a alguien!', 'Ese se lo buscó.'];
const ARGUE = ['¡Tú te me cerraste!', '¡Ni siquiera traes luces!', '¡Mi carro es nuevo, wey!', '¿Y el seguro? ¿Tienes seguro?', '¡Voy a llamar a mi primo!', '¡Fue tu culpa!'];

// a walkable spot some distance from the player, off screen
function walkSpot(c, minD, maxD) {
  const pos = c.pos();
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, d = rand(minD, maxD);
    const x = pos.x + Math.cos(a) * d, y = pos.y + Math.sin(a) * d;
    const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    if (!isWalkway(tx, ty)) continue;
    if (x > c.cam.x - 20 && y > c.cam.y - 20 && x < c.cam.x + 340 && y < c.cam.y + 200) continue;
    if (!MAP.unlocked || !zoneOpen(tx, ty)) continue;
    return { x: tx * TS + 8, y: ty * TS + 8 };
  }
  return null;
}
function zoneOpen(tx, ty) {
  const z = ty >= 94 ? 'afueras' : tx >= 118 ? 'puerto' : ty <= 53 ? 'centro' : 'colonia';
  return z === 'colonia' || MAP.unlocked[z];
}
// a stretch of road off screen (for cars)
function roadSpot(c, minD, maxD) {
  const pos = c.pos();
  for (let i = 0; i < 30; i++) {
    const e = pick(MAP.edges);
    if (!e || edgeBlocked(e)) continue;
    const f = rand(0.2, 0.8);
    const x = lerp(e.from.x, e.to.x, f), y = lerp(e.from.y, e.to.y, f), d = dist(x, y, pos.x, pos.y);
    if (d < minD || d > maxD) continue;
    if (x > c.cam.x - 30 && y > c.cam.y - 30 && x < c.cam.x + 350 && y < c.cam.y + 210) continue;
    if (!zoneOpen(Math.floor(x / TS), Math.floor(y / TS))) continue;
    return { e, f, x, y };
  }
  return null;
}
function civ(x, y, extra = {}) {
  const q = new Ped(randomCivilian(), x, y);
  Object.assign(q, { mission: true, eventPed: true }, extra);
  return q;
}

const KINDS = {
  // two people fighting; a couple of onlookers cheer
  fight(c) {
    const s = walkSpot(c, 170, 260);
    if (!s) return null;
    const a = civ(s.x - 6, s.y, { state: 'npcfight', hp: 40, maxHp: 40, npcFighter: true });
    const b = civ(s.x + 6, s.y, { state: 'npcfight', hp: 40, maxHp: 40, npcFighter: true });
    a.foe = b; b.foe = a;
    const crowd = [civ(s.x - 4, s.y - 18, { state: 'idle', timer: 999 }), civ(s.x + 16, s.y + 14, { state: 'idle', timer: 999 })];
    c.peds.push(a, b, ...crowd);
    c.say(a, pick(['¿Qué me ves?', '¡Ahorita sí, cabrón!', '¡Repítelo!']), 2);
    return { kind: 'fight', x: s.x, y: s.y, max: 40, peds: [a, b, ...crowd], cars: [],
      update(c, e) {
        for (const q of crowd) { q.a = Math.atan2(s.y - q.y, s.x - q.x); if (!q.bark && chance(0.006)) c.say(q, pick(ONLOOKER), 1.6); }
        if ([a, b].every((q) => q.state !== 'npcfight')) e.wind = (e.wind || 0) + 1 / 60;
        if (e.wind > 6) e.done = true;
      } };
  },
  // a thug robs someone and runs; knock him down and the wallet is yours
  mugging(c) {
    const s = walkSpot(c, 170, 250);
    if (!s) return null;
    const victim = civ(s.x, s.y, { state: 'idle', timer: 999 });
    const thug = new Ped('thug', s.x + 40, s.y + 10);
    Object.assign(thug, { mission: true, eventPed: true, criminal: true, hp: 30, maxHp: 30, state: 'goto', loot: Math.round(rand(80, 220)) });
    thug.goal = { x: s.x + 6, y: s.y, speed: 55, onArrive: () => {
      victim.state = 'flee'; victim.timer = 6; victim.fleeFrom = { x: thug.x, y: thug.y }; c.say(victim, '¡AUXILIO! ¡ME ROBARON!', 2.5);
      thug.state = 'flee'; thug.timer = 20; thug.fleeFrom = { x: victim.x, y: victim.y }; thug.speed = 60; c.say(thug, pick(['¡Gracias, jefe!', 'Ni modo.']), 1.5);
    } };
    c.peds.push(victim, thug);
    return { kind: 'mugging', x: s.x, y: s.y, max: 45, peds: [victim, thug], cars: [],
      update(c, e) {
        if (!e.dropped && (thug.state === 'dead' || thug.state === 'down') && thug.loot) {
          e.dropped = true;
          const loot = thug.loot;
          c.pickups.push({ x: thug.x + 4, y: thug.y + 4, color: '#46d470', icon: '$', onTake: () => { G.state.money += loot; G.ui?.toast(`Recuperaste una cartera: +$${loot}`, '#46d470', 2.5); } });
        }
      } };
  },
  // a patrol chasing a speeding car through traffic (not after you)
  chase(c) {
    const r = roadSpot(c, 260, 420);
    if (!r) return null;
    const run = new Vehicle(pick(['sedan', 'sports', 'compact', 'muscle', 'pickup']), r.x, r.y, 0);
    run.driver = randomCivilian(); run.driverLook = run.driver;
    run.placeOnEdge(r.e, r.f); run.cruise = 120; run.mission = true; run.eventCar = true; run.reckless = true;
    const back = { x: run.x - Math.cos(run.a) * 34, y: run.y - Math.sin(run.a) * 34 };
    const cop = new Vehicle('police', back.x, back.y, run.a);
    cop.ai = 'npcchase'; cop.chaseTarget = run; cop.sirenOn = true; cop.mission = true; cop.eventCar = true; cop.trail = [];
    if (run.collides(run.x, run.y, run.a) || cop.collides(cop.x, cop.y, cop.a)) return null;
    c.vehicles.push(run, cop);
    return { kind: 'chase', x: run.x, y: run.y, max: 40, peds: [], cars: [run, cop], follow: run,
      update(c, e) {
        cop.trailT = (cop.trailT || 0) - 1 / 60;
        if (cop.trailT <= 0) { cop.trailT = 0.15; cop.trail.push({ x: run.x, y: run.y }); if (cop.trail.length > 30) cop.trail.shift(); }
        if (run.dead || run.wreck) e.done = true;
      } };
  },
  // a little crash: two dented cars, two drivers yelling at each other
  crash(c) {
    const r = roadSpot(c, 230, 380);
    if (!r) return null;
    const a = new Vehicle(pick(['sedan', 'compact', 'vocho', 'taxi']), r.x, r.y, 0);
    a.placeOnEdge(r.e, r.f); a.ai = 'parked'; a.hp = a.maxHp * 0.45; a.mission = true; a.eventCar = true;
    const b = new Vehicle(pick(['pickup', 'van', 'sedan', 'jeep']), a.x + Math.cos(a.a) * 24, a.y + Math.sin(a.a) * 24, a.a + 0.5);
    b.ai = 'parked'; b.hp = b.maxHp * 0.5; b.mission = true; b.eventCar = true; b.forceSmoke = 'gray';
    if (a.collides(a.x, a.y, a.a) || b.collides(b.x, b.y, b.a)) return null;
    const side = { x: -Math.sin(a.a) * 16, y: Math.cos(a.a) * 16 };
    const d1 = civ(a.x + side.x, a.y + side.y, { state: 'idle', timer: 999 }), d2 = civ(b.x + side.x, b.y + side.y, { state: 'idle', timer: 999 });
    c.vehicles.push(a, b); c.peds.push(d1, d2);
    return { kind: 'crash', x: a.x, y: a.y, max: 50, peds: [d1, d2], cars: [a, b],
      update(c) {
        d1.a = Math.atan2(d2.y - d1.y, d2.x - d1.x); d2.a = d1.a + Math.PI;
        for (const q of [d1, d2]) if (q.state === 'idle' && !q.bark && chance(0.012)) c.say(q, pick(ARGUE), 1.8);
      } };
  },
};

export const events = {
  t: 25, list: [],
  update(c, dt) {
    for (const e of this.list.slice()) {
      e.t = (e.t || 0) + dt;
      if (e.follow) { e.x = e.follow.x; e.y = e.follow.y; }
      if (e.update) e.update(c, e, dt);
      const p = c.pos();
      if (e.done || e.t > e.max || dist(p.x, p.y, e.x, e.y) > 620) this.end(c, e);
    }
    // nothing happens around a story mission, a cutscene or in free fall
    if (G.story?.active) { if (this.list.length) this.clear(c); return; }
    if (G.lockInput || c.frozen || G.state?.freeMode === undefined) return;
    this.t -= dt;
    if (this.t > 0 || this.list.length) return;
    this.t = rand(30, 70);
    const k = pick(['fight', 'fight', 'mugging', 'chase', 'crash']);
    const e = KINDS[k](c);
    if (e) this.list.push(e); else this.t = 5;
  },
  // when it's over, the people go back to being regular pedestrians and the cars to traffic
  end(c, e) {
    const i = this.list.indexOf(e); if (i >= 0) this.list.splice(i, 1);
    for (const q of e.peds) {
      if (!c.peds.includes(q)) continue;
      q.mission = false; q.eventPed = false;
      if (q.state === 'npcfight' || q.state === 'idle') { q.state = 'walk'; q.foe = null; }
    }
    for (const v of e.cars) {
      if (!c.vehicles.includes(v)) continue;
      if (v.ai === 'npcchase') { v.ai = 'police'; c.removeVehicle(v); continue; }
      v.mission = false; v.cruise = v.reckless ? 75 : v.cruise; v.reckless = false;
    }
  },
  clear(c) {
    for (const e of this.list.slice()) {
      for (const q of e.peds) c.removePed(q);
      for (const v of e.cars) if (v !== c.player.car) c.removeVehicle(v);
    }
    this.list = [];
    this.t = 20;
  },
};
