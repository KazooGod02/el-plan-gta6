// Vehicles, pedestrians and projectiles for the top-down city.
import { VEHICLES, vehicleSprites, VEH_DIRS, topSprites, TOP_DIRS, CAR_COLORS } from '../data/sprites.js';
import { rotIndex } from '../core/gfx.js';
import { clamp, angDiff, rand, pick, dist } from '../core/util.js';
import { MAP, TS, solidCarPx, solidFootPx, tileAt, T, isWalkway, nodeEntry, nodeExit, DIRV, edgeBlocked, zoneOf } from './map.js';
import { civilianLook, CIVILIAN_TYPES } from '../data/cast.js';

let VID = 1;

// ================================================================= VEHICLE
export class Vehicle {
  constructor(type, x, y, a = 0, color = null) {
    this.id = VID++;
    this.type = type;
    this.spec = VEHICLES[type];
    this.x = x; this.y = y; this.a = a;
    this.vx = 0; this.vy = 0;
    this.color = color || (type === 'police' || type === 'reyes' ? (type === 'reyes' ? '#1a1a2e' : '#f4f4f0') : type === 'taxi' ? '#ffd23f' : type === 'armored' ? '#6e6e82' : type === 'moto' ? '#d8323c' : pick(CAR_COLORS));
    this.hp = this.spec.hp; this.maxHp = this.spec.hp;
    this.driver = null;     // 'player' | look object | null
    this.ai = null;         // 'traffic' | 'police' | 'parked' | 'script'
    this.passengers = [];
    this.fire = 0; this.dead = false; this.wreck = false;
    this.honk = 0; this.wait = 0; this.stun = 0;
    this.siren = type === 'police' || type === 'reyes';
    this.sirenOn = false;
    this.mission = false;
    this.throttle = 0; this.steer = 0; this.handbrake = false;
    this.invuln = false; this.minHp = 0;
    this.smokeT = 0;
  }
  get speed() { return Math.hypot(this.vx, this.vy); }
  get fwdSpeed() { return this.vx * Math.cos(this.a) + this.vy * Math.sin(this.a); }
  get radius() { return this.spec.W / 2 + 1; }

  corners(x = this.x, y = this.y, a = this.a, shrink = 0) {
    const hl = this.spec.L / 2 - shrink, hw = this.spec.W / 2 - shrink;
    const c = Math.cos(a), s = Math.sin(a);
    const pts = [];
    for (const [lx, ly] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw]]) pts.push([x + lx * c - ly * s, y + lx * s + ly * c]);
    return pts;
  }
  collides(x, y, a) { return this.corners(x, y, a, 1).some(([px, py]) => solidCarPx(px, py)); }

  // physics step with controls
  physics(dt, city) {
    const sp = this.spec;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    let vf = this.vx * c + this.vy * s;
    let vl = -this.vx * s + this.vy * c;
    const th = this.dead || this.engineOff ? 0 : this.throttle;
    const maxS = sp.max * (this.hp < this.maxHp * 0.2 ? 0.75 : 1) * (this.boost || 1);
    if (th > 0) vf += (vf < 0 ? sp.acc * 2.2 : sp.acc) * th * dt;
    else if (th < 0) vf += (vf > 5 ? -sp.acc * 2 : -sp.acc * 0.6) * -th * dt;
    else vf *= Math.max(0, 1 - 0.9 * dt);
    if (this.handbrake) vf *= Math.max(0, 1 - 1.6 * dt);
    vf = clamp(vf, -maxS * 0.4, maxS);
    const off = this.onRough ? 0.6 : 1;
    if (this.onRough && Math.abs(vf) > maxS * 0.6) vf *= Math.max(0, 1 - 1.5 * dt);
    const grip = this.handbrake ? 1.4 : sp.grip * off;
    vl *= Math.max(0, 1 - grip * dt);
    const tr = (sp.style === 'moto' ? 3.4 : 2.7) * (this.handbrake ? 1.35 : 1);
    this.a += this.steer * tr * dt * clamp(vf / 55, -1, 1);
    const c2 = Math.cos(this.a), s2 = Math.sin(this.a);
    this.vx = c2 * vf - s2 * vl; this.vy = s2 * vf + c2 * vl;
    this.move(dt, city);
  }

  move(dt, city) {
    const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    if (!this.collides(nx, ny, this.a)) { this.x = nx; this.y = ny; }
    else {
      const imp = this.speed;
      if (!this.collides(nx, this.y, this.a)) { this.x = nx; this.vy *= -0.2; }
      else if (!this.collides(this.x, ny, this.a)) { this.y = ny; this.vx *= -0.2; }
      else { this.vx *= -0.3; this.vy *= -0.3; }
      if (imp > 55) { this.damage((imp - 45) * 0.18, city); if (city) city.onCrash(this, imp); }
      if (this.collides(this.x, this.y, this.a)) this.unstick();
    }
    const tt = tileAt(Math.floor(this.x / TS), Math.floor(this.y / TS));
    this.onRough = tt === T.GRASS || tt === T.FIELD || tt === T.DIRT || tt === T.SAND;
  }

  unstick() {
    for (let r = 2; r < 40; r += 2) for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      const x = this.x + Math.cos(ang) * r, y = this.y + Math.sin(ang) * r;
      if (!this.collides(x, y, this.a)) { this.x = x; this.y = y; return; }
    }
  }

  damage(n, city) {
    if (this.invuln || this.wreck) return;
    this.hp = Math.max(this.minHp, this.hp - n);
    if (this.hp <= 0 && !this.dead) { this.dead = true; this.fire = 4.5; this.throttle = 0; if (city) city.onVehicleDestroyed(this); }
  }

  sprite(time) {
    const variant = this.siren && this.sirenOn ? Math.floor(time * 6) % 2 : 0;
    let type = this.type;
    const sprites = vehicleSprites(type, this.wreck ? '#2a2a2a' : this.color, this.type === 'moto' && this.driver ? 1 : variant);
    return sprites[rotIndex(this.a, VEH_DIRS)];
  }

  // ---------- traffic path following
  initTraffic(edge) {
    this.ai = 'traffic';
    this.edge = edge;
    const p0 = nodeExit(edge.from, edge.dir), p1 = nodeEntry(edge.to, edge.dir);
    this.seg = { p0, p1, c: null, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), t: 0, kind: 'edge' };
    this.cruise = rand(55, 80);
    this.x = p0.x; this.y = p0.y; this.a = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }
  placeOnEdge(edge, frac) {
    this.initTraffic(edge);
    this.seg.t = this.seg.len * frac;
    this.followPos();
  }
  followPos() {
    const s = this.seg; const u = s.len > 0 ? clamp(s.t / s.len, 0, 1) : 1;
    if (!s.c) { this.x = s.p0.x + (s.p1.x - s.p0.x) * u; this.y = s.p0.y + (s.p1.y - s.p0.y) * u; this.a = Math.atan2(s.p1.y - s.p0.y, s.p1.x - s.p0.x); }
    else {
      const iu = 1 - u;
      this.x = iu * iu * s.p0.x + 2 * iu * u * s.c.x + u * u * s.p1.x;
      this.y = iu * iu * s.p0.y + 2 * iu * u * s.c.y + u * u * s.p1.y;
      const dx = 2 * iu * (s.c.x - s.p0.x) + 2 * u * (s.p1.x - s.c.x), dy = 2 * iu * (s.c.y - s.p0.y) + 2 * u * (s.p1.y - s.c.y);
      if (dx || dy) this.a = Math.atan2(dy, dx);
    }
  }
  nextSegment() {
    const s = this.seg;
    if (s.kind === 'edge') {
      const n = this.edge.to, din = this.edge.dir;
      const opts = n.out.filter((e) => e && e.dir !== (din + 2) % 4 && !edgeBlocked(e));
      let e2 = opts.length ? pick(opts) : n.out[(din + 2) % 4];
      if (!e2 || edgeBlocked(e2)) e2 = n.out.find((e) => e && !edgeBlocked(e)) || null;
      if (!e2) { this.seg.t = this.seg.len; this.cruise = 0; return; }
      const p0 = nodeEntry(n, din), p1 = nodeExit(n, e2.dir);
      let c = null;
      if (e2.dir === din) c = null;
      else if (e2.dir === (din + 2) % 4) {
        c = din % 2 === 0 ? { x: p0.x + DIRV[din][0] * 40, y: (p0.y + p1.y) / 2 } : { x: (p0.x + p1.x) / 2, y: p0.y + DIRV[din][1] * 40 };
      }
      else c = (din % 2 === 0) ? { x: p1.x, y: p0.y } : { x: p0.x, y: p1.y };
      const len = c ? (Math.hypot(c.x - p0.x, c.y - p0.y) + Math.hypot(p1.x - c.x, p1.y - c.y)) * 0.9 : Math.hypot(p1.x - p0.x, p1.y - p0.y);
      this.seg = { p0, p1, c, len: Math.max(1, len), t: 0, kind: 'turn' };
      this.nextEdge = e2;
    } else {
      const e = this.nextEdge; this.edge = e;
      const p0 = nodeExit(e.from, e.dir), p1 = nodeEntry(e.to, e.dir);
      this.seg = { p0, p1, c: null, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), t: 0, kind: 'edge' };
    }
  }
  trafficStep(dt, city) {
    if (this.stun > 0) { this.stun -= dt; this.vx *= 0.9; this.vy *= 0.9; return; }
    // look ahead for obstacles
    const ax = this.x + Math.cos(this.a) * 20, ay = this.y + Math.sin(this.a) * 20;
    let blocked = city.obstacleNear(ax, ay, 13, this);
    let target = this.cruise;
    if (blocked) {
      target = 0; this.wait += dt;
      if (this.wait > 1.2 && this.honk <= 0 && blocked === 'player') { this.honk = 3; city.sfxAt('horn', this.x, this.y); }
      if (this.wait > 6) { target = this.cruise * 0.5; }
    } else this.wait = 0;
    if (this.honk > 0) this.honk -= dt;
    this.curSpeed = (this.curSpeed || 0) + clamp(target - (this.curSpeed || 0), -140 * dt, 70 * dt);
    const turnSlow = this.seg.kind === 'turn' && this.seg.c ? 0.6 : 1;
    this.seg.t += this.curSpeed * turnSlow * dt;
    while (this.seg.t >= this.seg.len) { const over = this.seg.t - this.seg.len; this.nextSegment(); this.seg.t += over; if (this.cruise === 0) break; }
    const px = this.x, py = this.y;
    this.followPos();
    this.vx = (this.x - px) / dt; this.vy = (this.y - py) / dt;
  }
}

// ================================================================= PED
let PID = 1;
export class Ped {
  constructor(look, x, y) {
    this.id = PID++;
    this.look = typeof look === 'number' ? civilianLook(look) : look;
    this.lookId = typeof look === 'string' ? look : null;
    this.x = x; this.y = y; this.a = Math.random() * Math.PI * 2;
    this.state = 'walk';
    this.speed = rand(20, 30);
    this.hp = 30; this.maxHp = 30;
    this.anim = 0; this.moving = false;
    this.timer = 0;
    this.dir = Math.floor(Math.random() * 4);
    this.target = null;
    this.bark = null; this.barkT = 0;
    this.mission = false; this.cop = false; this.ally = false;
    this.shootT = rand(0.5, 1.5);
    this.flash = 0;
  }
  sprites() { return topSprites(this.lookId || this.look); }
  sprite() {
    const s = this.sprites();
    if (this.state === 'down' || this.state === 'dead') return s[3][rotIndex(this.a, 4)];
    const f = this.moving ? 1 + (Math.floor(this.anim * 8) % 2) : 0;
    return s[f][rotIndex(this.a, TOP_DIRS)];
  }

  moveBy(dx, dy) {
    const r = 3.5;
    const free = (x, y) => !solidFootPx(x - r, y - r) && !solidFootPx(x + r, y - r) && !solidFootPx(x - r, y + r) && !solidFootPx(x + r, y + r);
    let moved = false;
    if (free(this.x + dx, this.y)) { this.x += dx; moved = true; }
    if (free(this.x, this.y + dy)) { this.y += dy; moved = true; }
    return moved;
  }

  wander(dt) {
    // grid walk on walkways
    if (!this.target) {
      const tx = Math.floor(this.x / TS), ty = Math.floor(this.y / TS);
      const dirs = [0, 1, 2, 3].filter((d) => isWalkway(tx + DIRV[d][0], ty + DIRV[d][1]));
      if (!dirs.length) { this.target = { x: this.x + rand(-20, 20), y: this.y + rand(-20, 20) }; }
      else {
        let d = this.dir;
        const back = (this.dir + 2) % 4;
        if (!dirs.includes(d) || Math.random() < 0.15) { const fw = dirs.filter((q) => q !== back); d = fw.length ? pick(fw) : dirs[0]; }
        this.dir = d;
        this.target = { x: (tx + DIRV[d][0]) * TS + 8 + rand(-3, 3), y: (ty + DIRV[d][1]) * TS + 8 + rand(-3, 3) };
      }
      if (Math.random() < 0.04) { this.state = 'idle'; this.timer = rand(1, 3); }
    }
    this.goTo(this.target.x, this.target.y, this.speed, dt, true);
  }

  goTo(x, y, speed, dt, clearOnArrive) {
    const dx = x - this.x, dy = y - this.y, d = Math.hypot(dx, dy);
    if (d < 2) { if (clearOnArrive) this.target = null; this.moving = false; return true; }
    this.a = Math.atan2(dy, dx);
    const st = Math.min(d, speed * dt);
    const ok = this.moveBy((dx / d) * st, (dy / d) * st);
    this.moving = true;
    if (!ok) { if (clearOnArrive) this.target = null; this.stuck = (this.stuck || 0) + dt; }
    else this.stuck = 0;
    return false;
  }
}

export function randomCivilian() { return Math.floor(Math.random() * CIVILIAN_TYPES); }

export function spawnableWalk(tx, ty) {
  return isWalkway(tx, ty) && zoneOf(tx, ty) && tileAt(tx, ty) !== T.PARKING;
}
