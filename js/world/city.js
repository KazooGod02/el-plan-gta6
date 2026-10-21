// Top-down open world scene: Puerto Vicio.
import { G, W, H, emit } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { canvas, rotIndex, shade, silhouette } from '../core/gfx.js';
import { hash2 } from '../core/util.js';
import { events } from './events.js';
import { oozak } from './oozak.js';
import { clamp, dist, dist2, angleTo, angDiff, rand, randi, pick, chance, lerp } from '../core/util.js';
import { MAP, T, MW, MH, TS, buildMap, tileAt, solidFootPx, solidCarPx, solidSwimPx, isWaterPx, isWalkway, zoneOf, ZONE_NAMES, applyBarriers, idx, edgeBlocked } from './map.js';
import { buildTiles, drawMap, refreshTiles, miniColor } from './tiles.js';
import { Vehicle, Ped, randomCivilian } from './entities.js';
import { topSprites, TOP_DIRS, VEHICLES } from '../data/sprites.js';
import { BARKS } from '../data/strings.js';
import { CONFIG } from '../config.js';
import { shoeSpeed } from '../story/shops.js';

const DRIVABLE_BFS = (t) => t !== T.WATER && t !== T.ROOF && t !== T.WALL && t !== T.DOOR && t !== T.TREE && t !== T.FENCE && t !== T.BARRIER && t !== T.FOUNTAIN && t !== T.CONTAINER;

export const city = {
  name: 'city',
  ready: false,
  player: null,
  vehicles: [], peds: [], bullets: [], particles: [], markers: [], pickups: [], bubbles: [], skids: [],
  cam: { x: 0, y: 0, shake: 0 },
  wanted: 0, evadeT: 0, maxWanted: 5, wantedLocked: false, policeKnows: false, noPolice: false,
  heli: null,
  field: null, fieldT: 0,
  trafficOn: true, pedsOn: true,
  zone: null,
  objective: '',
  camTarget: null,
  frozen: false,
  spawnedParking: new Set(),

  init() {
    if (this.ready) return;
    buildMap();
    buildTiles();
    this.mini = canvas(MW, MH);
    this.redrawMini();
    this.worldPickups = MAP.pickups.map((p) => ({ ...p, taken: false, t: 0 }));
    this.field = new Int16Array(MW * MH);
    this.queue = new Int32Array(MW * MH);
    this.player = { x: 0, y: 0, a: 0, hp: 100, maxHp: 100, car: null, moving: false, anim: 0, punchT: 0, shootT: 0, hurtT: 0, dead: false, arrestT: 0, doorCd: 0, stepT: 0, look: 'kazoo', invuln: false, spray: 0 };
    this.ready = true;
  },

  redrawMini() {
    const x = this.mini.x;
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { x.fillStyle = miniColor(tx, ty); x.fillRect(tx, ty, 1, 1); }
  },

  setUnlocked(unlocked) {
    applyBarriers(unlocked);
    this.gpsKey = null;
    for (const zone in MAP.barriers) for (const [bx, by] of MAP.barriers[zone]) refreshTiles(bx, by, bx, by);
    this.redrawMini();
  },

  // opts: {x,y,a, car: type|Vehicle, look}
  enter(opts = {}) {
    this.init();
    const p = this.player;
    p.dead = false; p.arrestT = 0; p.hurtT = 0;
    if (opts.look) p.look = opts.look;
    if (opts.x !== undefined) { p.x = opts.x; p.y = opts.y; }
    if (opts.a !== undefined) p.a = opts.a;
    if (p.car && !this.vehicles.includes(p.car)) p.car = null;
    if (opts.car) {
      const v = typeof opts.car === 'string' ? this.spawnVehicle(opts.car, p.x, p.y, opts.a || 0, { mission: true, color: opts.color }) : opts.car;
      if (!this.vehicles.includes(v)) this.vehicles.push(v);
      this.putInCar(v);
    } else if (opts.x !== undefined && p.car) { this.exitCar(true); }
    this.snapCam();
    this.zone = zoneOf(Math.floor(p.x / TS), Math.floor(p.y / TS));
    emit('cityEnter');
  },
  exit() { audio.setEngine(false); audio.setSiren(0); emit('cityExit'); },

  // ------------------------------------------------------------ spawning API
  spawnVehicle(type, x, y, a = 0, opts = {}) {
    const v = new Vehicle(type, x, y, a, opts.color);
    v.ai = opts.ai || 'parked';
    v.mission = !!opts.mission;
    if (opts.hp) { v.hp = opts.hp; }
    this.vehicles.push(v);
    return v;
  },
  spawnPed(look, x, y, opts = {}) {
    const p = new Ped(look, x, y);
    Object.assign(p, { mission: true, state: opts.state || 'idle', ally: !!opts.ally }, opts);
    if (opts.a !== undefined) p.a = opts.a;
    this.peds.push(p);
    return p;
  },
  removePed(p) { const i = this.peds.indexOf(p); if (i >= 0) this.peds.splice(i, 1); },
  removeVehicle(v) { const i = this.vehicles.indexOf(v); if (i >= 0) this.vehicles.splice(i, 1); if (this.player.car === v) this.player.car = null; },
  addMarker(m) { m.r ||= 14; m.color ||= '#ffd23f'; this.markers.push(m); return m; },
  removeMarker(m) { const i = this.markers.indexOf(m); if (i >= 0) this.markers.splice(i, 1); },
  clearMission() {
    this.markers = this.markers.filter((m) => m.persistent);
    this.peds = this.peds.filter((p) => !p.mission || p.keep);
    this.vehicles = this.vehicles.filter((v) => !v.mission || v === this.player.car || v.keep);
    this.pickups = this.pickups.filter((p) => !p.mission);
    this.camTarget = null;
  },
  teleport(x, y, a) {
    const p = this.player;
    if (p.car) { p.car.x = x; p.car.y = y; if (a !== undefined) p.car.a = a; p.car.vx = p.car.vy = 0; }
    p.x = x; p.y = y; if (a !== undefined) p.a = a;
    this.snapCam();
  },
  pos() { const p = this.player; return p.car ? { x: p.car.x, y: p.car.y } : { x: p.x, y: p.y }; },
  near(x, y, r) { const q = this.pos(); return dist2(q.x, q.y, x, y) < r * r; },
  say(ped, text, t = 3) { ped.bark = text; ped.barkT = t; },
  shake(n) { if (G.settings?.shake !== false) this.cam.shake = Math.max(this.cam.shake, n); },
  sfxAt(name, x, y) {
    const q = this.pos(); const d = dist(q.x, q.y, x, y);
    if (d < 260) audio.sfx(name, { vol: 1 - d / 280 });
  },
  setWanted(n) { if (this.wantedLocked) return; this.wanted = clamp(n, 0, this.maxWanted); this.evadeT = 0; this.heat = HEAT[this.wanted]; },

  // ------------------------------------------------------------ player car
  putInCar(v) {
    const p = this.player;
    p.car = v; v.driver = 'player'; v.ai = null;
    p.x = v.x; p.y = v.y;
    // board allies nearby
    for (const a of this.peds.filter((q) => q.ally && q.follow && !(q.noMoto && v.spec.style === 'moto'))) {
      if (dist(a.x, a.y, v.x, v.y) < 90 && v.passengers.length < (v.spec.style === 'moto' ? 1 : 3)) { v.passengers.push(a); this.removePed(a); }
    }
    emit('enterVehicle', v);
  },
  exitCar(force = false) {
    const p = this.player, v = p.car;
    if (!v) return;
    if (!force && v.speed > 60) return;
    const side = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
    for (const s of side) {
      const d = v.spec.W / 2 + 7;
      const ex = v.x + Math.cos(v.a + s) * d, ey = v.y + Math.sin(v.a + s) * d;
      if (!solidFootPx(ex, ey)) { p.x = ex; p.y = ey; break; }
      p.x = v.x; p.y = v.y;
    }
    p.a = v.a;
    v.driver = null; v.throttle = 0; v.steer = 0; v.handbrake = true; v.ai = 'parked';
    // a forced exit (missions, cutscenes) stops the car dead; a normal one lets it roll a
    // little. Either way it can't run over the people who just got out of it.
    if (force) { v.vx = 0; v.vy = 0; } else { v.vx *= 0.25; v.vy *= 0.25; }
    v.noHitT = 1.5;
    for (const a of v.passengers) {
      a.x = v.x + rand(-10, 10); a.y = v.y + rand(-10, 10);
      if (solidFootPx(a.x, a.y)) { a.x = p.x; a.y = p.y; }
      if (solidFootPx(a.x, a.y)) { const sh = shoreNear(a.x, a.y); a.x = sh.x; a.y = sh.y; }
      this.peds.push(a);
    }
    v.passengers = [];
    p.car = null;
    audio.setEngine(false);
    emit('exitVehicle', v);
  },

  tryEnterVehicle() {
    const p = this.player;
    if (isWaterPx(p.x, p.y)) return false;
    let best = null, bd = 26;
    for (const v of this.vehicles) {
      if (v.dead || v.wreck || v.locked || v.sinking) continue;
      const d = dist(p.x, p.y, v.x, v.y);
      if (d < bd) { bd = d; best = v; }
    }
    if (!best) return false;
    if (best.driver && best.driver !== 'player') {
      // carjack
      const drv = new Ped(best.driverLook ?? randomCivilian(), best.x + Math.cos(best.a + Math.PI / 2) * 12, best.y + Math.sin(best.a + Math.PI / 2) * 12);
      if (solidFootPx(drv.x, drv.y)) { drv.x = p.x; drv.y = p.y; }
      if (best.type === 'police' || best.type === 'reyes') { drv.lookId = 'cop'; drv.look = null; drv.cop = true; drv.state = 'chase'; drv.hp = 60; this.crime(2, best.x, best.y, true); }
      else { drv.state = 'flee'; drv.fleeFrom = { x: p.x, y: p.y }; drv.timer = 5; this.say(drv, pick(BARKS.hit)); this.crime(1, best.x, best.y, false, true); }
      this.peds.push(drv);
      best.driver = null; best.ai = null;
      G.state.stats.cars++;
    }
    if (best.mission && best.noEnter) return false;
    this.putInCar(best);
    audio.sfx('door');
    return true;
  },

  tryDoor() {
    const p = this.player;
    const tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 9) / TS);
    for (const d of MAP.doors) {
      if (Math.abs(d.x * TS + 8 - p.x) < 12 && Math.abs((d.y + 1) * TS - p.y) < 10) { emit('door', d); p.doorCd = 1; return true; }
    }
    return tx < 0 && ty < 0;
  },

  // ------------------------------------------------------------ crime & police
  copsNear(x, y, r) {
    for (const v of this.vehicles) if ((v.type === 'police' || v.type === 'reyes') && v.ai === 'police' && dist2(v.x, v.y, x, y) < r * r) return true;
    for (const p of this.peds) if (p.cop && p.state !== 'dead' && p.state !== 'down' && dist2(p.x, p.y, x, y) < r * r) return true;
    return false;
  },
  // Crimes add "heat". A star is only earned once enough heat piles up, and never
  // faster than one star every few seconds, so a single mistake doesn't snowball.
  // a cop only "sees" you when close and with nothing big in between
  copsSee(x, y) {
    for (const v of this.vehicles) if ((v.type === 'police' || v.type === 'reyes') && v.ai === 'police' && dist2(v.x, v.y, x, y) < 190 * 190 && clearLine(v.x, v.y, x, y)) return true;
    for (const p of this.peds) if (p.cop && p.state !== 'dead' && p.state !== 'down' && dist2(p.x, p.y, x, y) < 150 * 150 && clearLine(p.x, p.y, x, y)) return true;
    if (this.heli && dist2(this.heli.x, this.heli.y, x, y) < 120 * 120) return true;
    return false;
  },
  crime(sev, x, y, always = false, needCop = false) {
    if (this.noPolice || this.wantedLocked) return;
    const copSaw = this.copsNear(x, y, 200);
    const witness = always || copSaw || (!needCop && chance(0.15 + sev * 0.1));
    if (!witness) return;
    G.state.stats.crimes = (G.state.stats.crimes || 0) + 1;
    this.heat = (this.heat || 0) + [0.4, 1, 1.6][Math.min(2, sev)] * (copSaw ? 1.5 : 1);
    if (this.wanted > 0) this.evadeT = Math.min(this.evadeT, 2);
    const need = [1, 3, 5, 8, 12][this.wanted] ?? 99;
    if (this.heat < need || (this.starCd || 0) > 0) return;
    const target = Math.min(this.maxWanted, this.wanted + 1);
    if (target > this.wanted) {
      this.wanted = target; this.evadeT = 0; this.starCd = 5 + this.wanted * 1.5;
      audio.sfx('star'); emit('wanted', this.wanted);
    }
  },

  onCrash(v, imp) {
    if (v === this.player.car) { this.shake(Math.min(6, imp / 30)); this.sfxAt('crash', v.x, v.y); }
  },
  onVehicleDestroyed(v) {
    if (v === this.player.car) G.ui?.toast('¡El carro se está quemando! ¡Bájate!', '#ff5a3c');
  },

  explode(x, y) {
    audio.sfx('explode'); this.shake(8);
    for (let i = 0; i < 28; i++) this.particles.push({ x, y, vx: rand(-80, 80), vy: rand(-80, 80), life: rand(0.4, 1.0), max: 1, col: pick(['#ffd23f', '#f08c28', '#d8323c', '#fff08c']), size: randi(2, 4), drag: 3 });
    for (let i = 0; i < 12; i++) this.particles.push({ x, y, vx: rand(-20, 20), vy: rand(-20, 20), life: rand(1.2, 2.2), max: 2, col: '#2a2a2a', size: randi(3, 6), drag: 1, smoke: true });
    const p = this.player;
    for (const v of this.vehicles) { const d = dist(v.x, v.y, x, y); if (d < 50 && d > 1) { v.vx += (v.x - x) / d * 90; v.vy += (v.y - y) / d * 90; v.damage(60 * (1 - d / 50), this); } }
    const mine = !this._exploding || this._exploding === p.car || this._exploding.lastHitBy === 'player';
    for (const q of this.peds) { const d = dist(q.x, q.y, x, y); if (d < 45) this.hurtPed(q, 80, x, y, mine); }
    const pp = this.pos(); const dp = dist(pp.x, pp.y, x, y);
    if (dp < 45 && !p.car) this.hurtPlayer(70 * (1 - dp / 45));
    else if (dp < 45 && p.car && p.car !== this._exploding) p.car.damage(25, this);
    if (mine) this.crime(1, x, y);
  },

  hurtPed(q, dmg, fx, fy, byPlayer = true) {
    if (q.state === 'dead' || q.invuln) return;
    if (byPlayer && q.npcFighter && !q.brawler) {
      q.brawler = true; q.state = 'brawl'; q.speed = 50; q.mission = true;
      const f = q.foe; q.foe = null;
      if (f && f.state === 'npcfight') { f.state = 'flee'; f.timer = 5; f.fleeFrom = { x: q.x, y: q.y }; f.foe = null; }
      this.say(q, pick(['¿Y tú qué, metiche?', '¡Tú también quieres!', '¡Ahora contigo!']), 2);
    }
    if (q.brawler) {
      // street fight: no police, no fleeing — just a K.O. at zero
      if (q.state === 'down') return;
      q.hp -= dmg; q.flash = 0.15; if (byPlayer) this.lastHit = { q, t: 2.5 };
      for (let i = 0; i < 6; i++) this.particles.push({ x: q.x, y: q.y - 4, vx: rand(-40, 40), vy: rand(-50, 0), life: 0.25, max: 0.25, col: i % 2 ? '#fff08c' : '#f4f4f0', size: 1 });
      if (q.hp <= 0) { q.state = 'down'; q.timer = q.npcFighter ? 8 : 999; this.say(q, pick(['¡Me rindo!', 'Ya, ya, ya...', '¡Mamá!']), 2); }
      return;
    }
    if (byPlayer) this.lastHit = { q, t: 2.5 };
    q.maxHp = Math.max(q.maxHp || 30, q.hp);
    q.hp -= dmg; q.flash = 0.15;
    if (q.ally) { q.hp = Math.max(q.hp, 1); return; }
    if (q.hp <= 0) {
      q.state = 'dead'; q.timer = 25; q.bark = null;
      G.state.stats.peds = (G.state.stats.peds || 0) + 1;
      if (byPlayer && !q.criminal) this.crime(q.cop ? 2 : 1, q.x, q.y, q.cop);
      emit('pedDown', q);
    } else {
      if (q.cop) { q.state = 'chase'; if (byPlayer) this.crime(2, q.x, q.y, true); }
      else { q.state = 'flee'; q.timer = 6; q.fleeFrom = { x: fx, y: fy }; if (chance(0.5)) this.say(q, pick(BARKS.scared)); }
    }
  },

  hurtPlayer(dmg) {
    const p = this.player;
    if (p.invuln || p.dead || G.cheatGod) return;
    dmg = absorbArmor(dmg);
    p.hp -= dmg; p.hurtT = 0.3;
    audio.sfx('hurt');
    if (p.hp <= 0) { p.hp = 0; this.wasted(); }
  },
  wasted() {
    const p = this.player;
    if (p.dead) return;
    p.dead = true;
    if (p.car) this.exitCar(true);
    emit('wasted');
  },
  busted() {
    const p = this.player;
    if (p.dead) return;
    p.dead = true;
    if (p.car) this.exitCar(true);
    emit('busted');
  },

  // ------------------------------------------------------------ flow field (for police)
  updateField() {
    const f = this.field; f.fill(-1);
    const q = this.queue; let head = 0, tail = 0;
    const s = this.pos();
    const sx = clamp(Math.floor(s.x / TS), 0, MW - 1), sy = clamp(Math.floor(s.y / TS), 0, MH - 1);
    const si = sy * MW + sx; f[si] = 0; q[tail++] = si;
    const tiles = MAP.tiles;
    while (head < tail) {
      const i = q[head++]; const d = f[i];
      if (d > 90) continue;
      const x = i % MW, y = (i / MW) | 0;
      if (x > 0) { const j = i - 1; if (f[j] < 0 && DRIVABLE_BFS(tiles[j])) { f[j] = d + 1; q[tail++] = j; } }
      if (x < MW - 1) { const j = i + 1; if (f[j] < 0 && DRIVABLE_BFS(tiles[j])) { f[j] = d + 1; q[tail++] = j; } }
      if (y > 0) { const j = i - MW; if (f[j] < 0 && DRIVABLE_BFS(tiles[j])) { f[j] = d + 1; q[tail++] = j; } }
      if (y < MH - 1) { const j = i + MW; if (f[j] < 0 && DRIVABLE_BFS(tiles[j])) { f[j] = d + 1; q[tail++] = j; } }
    }
  },
  fieldStep(x, y, steps = 3) {
    let tx = Math.floor(x / TS), ty = Math.floor(y / TS);
    const f = this.field;
    for (let k = 0; k < steps; k++) {
      const cur = f[ty * MW + tx];
      if (cur <= 0) break;
      let best = null, bv = cur;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
        const v = f[ny * MW + nx];
        if (v >= 0 && v < bv) {
          if (dx && dy && (f[ty * MW + nx] < 0 || f[ny * MW + tx] < 0)) continue;
          bv = v; best = [nx, ny];
        }
      }
      if (!best) break;
      [tx, ty] = best;
    }
    return { x: tx * TS + 8, y: ty * TS + 8 };
  },

  // ------------------------------------------------------------ update
  update(dt) {
    if (!this.ready) return;
    const p = this.player;
    const ctl = !G.lockInput && !this.frozen && !p.dead && !G.paused;
    if (p.doorCd > 0) p.doorCd -= dt;
    if (this.lastHit) { this.lastHit.t -= dt; if (this.lastHit.t <= 0) this.lastHit = null; }
    if (p.barkT > 0) { p.barkT -= dt; if (p.barkT <= 0) p.bark = null; }
    if (p.hurtT > 0) p.hurtT -= dt;

    if (ctl) {
      if (p.car) this.driveControls(dt); else this.footControls(dt);
    } else if (p.car) { p.car.throttle = 0; p.car.steer = 0; p.car.handbrake = !this.scriptDrive; }
    else p.moving = false;

    // rain fades in and out instead of switching on like a light
    const wth = G.state?.weather;
    this.rainAmt = lerp(this.rainAmt || 0, wth === 'storm' ? 1 : wth === 'rain' ? 0.7 : 0, Math.min(1, dt * 0.4));
    // vehicles
    for (const v of this.vehicles) this.updateVehicle(v, dt);
    this.collideVehicles();
    for (const s of this.skids) s.life -= dt;
    if (this.skids.length && this.skids[0].life <= 0) this.skids = this.skids.filter((s) => s.life > 0);
    events.update(this, dt);
    oozak.update(this, dt);
    if (p.car) { p.x = p.car.x; p.y = p.car.y; if (p.car.dead && p.car.fire < 2 && !p.dead) { /* player must get out */ } }

    // peds
    for (const q of this.peds) this.updatePed(q, dt);
    // bullets & particles
    this.updateBullets(dt);
    for (const pt of this.particles) {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= Math.max(0, 1 - (pt.drag || 0) * dt); pt.vy *= Math.max(0, 1 - (pt.drag || 0) * dt);
      if (pt.grav) pt.vy += pt.grav * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);

    // markers
    const pos = this.pos();
    for (const m of this.markers.slice()) {
      if (m.hidden) continue;
      if (m.needCar === true && !p.car) continue;
      if (m.needCar === false && p.car) continue;
      if (dist2(pos.x, pos.y, m.x, m.y) < m.r * m.r && !p.dead) {
        if (!m.inside) { m.inside = true; if (m.onEnter) m.onEnter(m); }
      } else m.inside = false;
    }
    // collectibles
    if (!p.dead) this.checkCollectibles(pos);
    for (const pk of this.worldPickups) if (pk.taken && (pk.t -= dt) <= 0 && !isVisible(this, pk.x, pk.y, 20)) pk.taken = false;

    // police / wanted
    this.fieldT -= dt;
    if (this.wanted > 0 && this.fieldT <= 0) { this.updateField(); this.fieldT = 0.4; }
    this.updateWanted(dt);
    this.managePopulation(dt);

    // zone change banner
    const z = zoneOf(Math.floor(pos.x / TS), Math.floor(pos.y / TS));
    if (z !== this.zone) { this.zone = z; emit('zone', z); G.ui?.bannerShow(ZONE_NAMES[z]); }

    // sounds
    if (p.car && !p.dead) audio.setEngine(true, p.car.speed, p.car.spec.style === 'moto' ? 'moto' : p.car.spec.style === 'truck' || p.car.spec.style === 'bus' ? 'truck' : 'car');
    else audio.setEngine(false);
    let sirenNear = 0;
    for (const v of this.vehicles) if (v.sirenOn) { const d = dist(pos.x, pos.y, v.x, v.y); if (d < 350) sirenNear = Math.max(sirenNear, 1 - d / 350); }
    audio.setSiren(sirenNear);

    this.updateGps(dt);
    this.updateCamera(dt);
  },

  // ------------------------------------------------------------ GPS
  // target priority: your own waypoint > the current mission marker > the next story mission
  gpsPick() {
    if (this.waypoint) return { x: this.waypoint.x, y: this.waypoint.y, color: '#c878f0', kind: 'waypoint' };
    let best = null;
    for (const m of this.markers) if (!m.hidden && !m.persistent && !m.noBlip && !m.noGps) best = m;
    if (best) return { x: best.x, y: best.y, color: best.color || '#ffd23f', kind: 'mission' };
    const pos = this.pos();
    let bd = Infinity;
    for (const m of this.markers) if (m.persistent && m.mission && !m.hidden) { const d = dist2(m.x, m.y, pos.x, pos.y); if (d < bd) { bd = d; best = m; } }
    if (best) return { x: best.x, y: best.y, color: best.color || '#ffd23f', kind: 'story' };
    return null;
  },
  updateGps(dt) {
    this.gpsT = (this.gpsT || 0) - dt;
    if (this.gpsT > 0) return;
    this.gpsT = 0.2;
    const pos = this.pos();
    if (this.waypoint && dist(pos.x, pos.y, this.waypoint.x, this.waypoint.y) < 40) { this.waypoint = null; G.ui?.toast('Llegaste a tu destino', '#c878f0', 2); audio.sfx('select'); }
    const g = this.gpsPick();
    this.gps = g;
    if (!g) { this.gpsRoute = null; this.gpsDist = null; return; }
    const tx = clamp(Math.floor(g.x / TS), 0, MW - 1), ty = clamp(Math.floor(g.y / TS), 0, MH - 1);
    const key = tx + ',' + ty;
    if (key !== this.gpsKey) { this.gpsKey = key; this.gpsField = gpsField(tx, ty); }
    const r = gpsTrace(this.gpsField, pos.x, pos.y);
    this.gpsRoute = r.route; this.gpsDist = r.len;
  },

  footControls(dt) {
    const p = this.player;
    let ax = input.ax, ay = input.ay;
    if (G.drunkT > 0 && (ax || ay)) { const f = Math.min(1, G.drunkT / 8) * 0.4; ax += Math.sin(G.time * 2.3) * f; ay += Math.cos(G.time * 1.9) * f; }
    const mag = Math.hypot(ax, ay);
    const run = input.down('run') || mag > 0.95 && input.stick.on;
    const swim = isWaterPx(p.x, p.y);
    if (swim && !p.wasSwim) this.splash(p.x, p.y);
    p.wasSwim = swim;
    const sp = (swim ? (run ? 44 : 32) : run ? 92 * shoeSpeed() : 52) * (G.cheatFast ? 1.6 : 1);
    if (mag > 0.15) {
      p.a = Math.atan2(ay, ax);
      const nx = ax / Math.max(1, mag) * sp * dt, ny = ay / Math.max(1, mag) * sp * dt;
      this.movePlayer(nx, ny);
      p.moving = true; p.anim += dt * (run ? 1.6 : 1);
      p.stepT -= dt * (run ? 1.6 : 1);
      if (p.stepT <= 0) { p.stepT = swim ? 0.55 : 0.32; if (swim) audio.sfx('splash', { vol: 0.25 }); else audio.sfx('step', { vol: 0.5 }); }
      // walking into a door
      if (ay < -0.5 && p.doorCd <= 0 && !swim) this.tryDoor();
    } else p.moving = false;

    if (p.punchT > 0) p.punchT -= dt;
    if (p.shootT > 0) p.shootT -= dt;

    const dlg = !!G.ui?.dialog;
    if (swim) {
      if (input.pressed('a') && !dlg) G.ui?.toast('Nada hasta una orilla con espacio para salir', '#5adcf0', 2);
      return;
    }
    if (input.pressed('a') && !dlg) {
      if (!this.tryInteract()) if (!this.tryEnterVehicle()) this.tryDoor();
    }
    if (input.pressed('weapon')) this.cycleWeapon();
    const w = G.state.weapon;
    if (!dlg && (w === 'fists' ? input.pressed('b') : input.down('b'))) this.attack();
  },

  splash(x, y) {
    this.sfxAt('splash', x, y);
    for (let i = 0; i < 14; i++) this.particles.push({ x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-40, 40), vy: rand(-50, 10), life: rand(0.3, 0.6), max: 0.6, col: i % 2 ? '#9ad0f0' : '#e8f4ff', size: randi(1, 2), drag: 2 });
  },

  tryInteract() {
    const p = this.player;
    // graffiti spots
    for (let i = 0; i < MAP.collect.graffiti.length; i++) {
      const g = MAP.collect.graffiti[i];
      if (G.state.collect.graffiti.includes(i)) continue;
      if (dist(p.x, p.y, g.x, g.y + 12) < 16) { this.sprayGraffiti(i); return true; }
    }
    // interactive markers / peds
    for (const m of this.markers) if (m.onAction && dist(p.x, p.y, m.x, m.y) < (m.r || 16)) { m.onAction(m); return true; }
    for (const q of this.peds) if (q.onTalk && dist(p.x, p.y, q.x, q.y) < 20 && q.state !== 'dead') { q.onTalk(q); return true; }
    return false;
  },

  sprayGraffiti(i) {
    G.state.collect.graffiti.push(i);
    audio.sfx('pickup');
    const g = MAP.collect.graffiti[i];
    for (let k = 0; k < 16; k++) this.particles.push({ x: g.x + rand(-6, 6), y: g.y + rand(-4, 4), vx: rand(-10, 10), vy: rand(-10, 10), life: 0.6, max: 0.6, col: pick(['#ffd23f', '#ff3cc8', '#5adcf0']), size: 1 });
    emit('collect', 'graffiti', i);
  },

  movePlayer(dx, dy) {
    const p = this.player, r = 3.5;
    // Kazoo can walk off a dock into the water and swim; he only climbs out where the shore is free
    const free = (x, y) => !solidSwimPx(x - r, y - r) && !solidSwimPx(x + r, y - r) && !solidSwimPx(x - r, y + r) && !solidSwimPx(x + r, y + r) && !this.carAt(x, y);
    if (G.cheatGhost) { p.x += dx; p.y += dy; return; }
    if (free(p.x + dx, p.y)) p.x += dx;
    if (free(p.x, p.y + dy)) p.y += dy;
    p.x = clamp(p.x, 8, MW * TS - 8); p.y = clamp(p.y, 8, MH * TS - 8);
  },
  carAt(x, y) {
    for (const v of this.vehicles) {
      if (v === this.player.car) continue;
      const dx = x - v.x, dy = y - v.y;
      if (dx * dx + dy * dy > 400) continue;
      const c = Math.cos(v.a), s = Math.sin(v.a);
      const lx = dx * c + dy * s, ly = -dx * s + dy * c;
      if (Math.abs(lx) < v.spec.L / 2 + 2 && Math.abs(ly) < v.spec.W / 2 + 2) return v;
    }
    return null;
  },

  cycleWeapon() {
    const s = G.state;
    const owned = ['fists', ...['pistol', 'shotgun'].filter((w) => s.weapons[w] !== undefined)];
    const i = owned.indexOf(s.weapon);
    s.weapon = owned[(i + 1) % owned.length];
    audio.sfx('reload');
    G.ui?.toast(s.weapon === 'fists' ? 'PUÑOS' : s.weapon === 'pistol' ? 'BLASTER NERF' : 'NERF MEGA', '#ffd23f', 1);
  },

  attack() {
    const p = this.player, s = G.state;
    if (input.mouseGameplay && input.mouseActive() && !p.car) p.a = Math.atan2(this.cam.y + input.mouse.y - p.y, this.cam.x + input.mouse.x - p.x);
    if (this.noWeapons || isWaterPx(p.x, p.y)) return;
    if (s.weapon === 'fists') {
      if (p.punchT > 0) return;
      p.punchT = 0.35;
      audio.sfx('punch', { vol: 0.6 });
      const hx = p.x + Math.cos(p.a) * 10, hy = p.y + Math.sin(p.a) * 10;
      for (const q of this.peds) {
        if (q.state === 'dead' || q.ally) continue;
        if (dist(q.x, q.y, hx, hy) < 10) {
          audio.sfx('hit');
          q.x += Math.cos(p.a) * 6; q.y += Math.sin(p.a) * 6;
          this.hurtPed(q, 12, p.x, p.y);
          if (q.state !== 'dead' && !q.cop && !q.brawler && !q.criminal) this.crime(0, q.x, q.y, false, true);
        }
      }
      return;
    }
    if (p.shootT > 0) return;
    const ammo = s.weapons[s.weapon] || 0;
    if (ammo <= 0 && !G.cheatAmmo) { p.shootT = 0.4; audio.sfx('jam'); G.ui?.toast('SIN BALAS', '#d8323c', 1); return; }
    if (!G.cheatAmmo) s.weapons[s.weapon] = ammo - 1;
    const shotgun = s.weapon === 'shotgun';
    p.shootT = shotgun ? 0.8 : 0.28;
    // auto-aim
    let aim = p.a, best = 0.6;
    for (const q of this.peds) {
      if (q.state === 'dead' || q.state === 'down' || q.ally) continue;
      const d = dist(p.x, p.y, q.x, q.y);
      if (d > 170) continue;
      const da = Math.abs(angDiff(p.a, angleTo(p.x, p.y, q.x, q.y)));
      const score = da + d / 400 - (q.cop || q.hostile ? 0.2 : 0);
      if (da < 0.55 && score < best) { best = score; aim = angleTo(p.x, p.y, q.x, q.y); }
    }
    const n = shotgun ? 5 : 1;
    for (let i = 0; i < n; i++) {
      const a = aim + (shotgun ? rand(-0.18, 0.18) : rand(-0.03, 0.03));
      this.bullets.push({ x: p.x + Math.cos(a) * 8, y: p.y + Math.sin(a) * 8, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 0.5, owner: 'player', dmg: shotgun ? 22 : 30 });
    }
    audio.sfx(shotgun ? 'shotgun' : 'shot');
    this.particles.push({ x: p.x + Math.cos(aim) * 10, y: p.y + Math.sin(aim) * 10, vx: 0, vy: 0, life: 0.06, max: 0.06, col: '#fff08c', size: 3 });
    // panic
    for (const q of this.peds) if (!q.cop && !q.ally && q.state !== 'dead' && dist2(q.x, q.y, p.x, p.y) < 160 * 160) { q.state = 'flee'; q.timer = 6; q.fleeFrom = { x: p.x, y: p.y }; if (chance(0.15)) this.say(q, pick(BARKS.scared)); }
    this.crime(0, p.x, p.y, false, true);
    emit('shot');
  },

  driveControls(dt) {
    const p = this.player, v = p.car;
    if (v.dead) { v.throttle = 0; v.steer = 0; if (input.pressed('a')) this.exitCar(true); return; }
    // touch and controller drive by screen direction: push the stick where you want to go
    // and the car turns that way and accelerates (keyboard keeps classic tank controls)
    if (input.stick.on || input.lastDevice === 'touch' || input.lastDevice === 'pad') {
      const mag = Math.hypot(input.ax, input.ay);
      if (mag > 0.25) {
        const target = Math.atan2(input.ay, input.ax);
        const diff = angDiff(v.a, target);
        if (Math.abs(diff) > 2.4 && v.fwdSpeed < 25) { v.throttle = -mag; v.steer = clamp(-diff, -1, 1); }
        else { v.steer = clamp(diff * 2.2, -1, 1); v.throttle = mag * (Math.abs(diff) > 1.4 ? 0.35 : 1); }
      } else { v.throttle = 0; v.steer = 0; }
    } else {
      v.throttle = (input.down('up') ? 1 : 0) - (input.down('down') ? 1 : 0);
      v.steer = (input.down('right') ? 1 : 0) - (input.down('left') ? 1 : 0);
    }
    v.handbrake = input.down('b');
    if (G.drunkT > 0 && v.throttle) v.steer = clamp(v.steer + Math.sin(G.time * 1.7) * 0.3 * Math.min(1, G.drunkT / 8), -1, 1);
    // cars with the secret turbo use Shift to fire it; everybody else honks
    if (v.turbo) {
      const on = input.down('run') && v.throttle > 0 && !v.dead;
      v.boost = on ? 1.6 : 1;
      if (on) {
        v.flameT = (v.flameT || 0) - dt;
        if (v.flameT <= 0) { v.flameT = 0.03; const bx = v.x - Math.cos(v.a) * v.spec.L * 0.55, by = v.y - Math.sin(v.a) * v.spec.L * 0.55; this.particles.push({ x: bx, y: by, vx: -Math.cos(v.a) * 60 + rand(-10, 10), vy: -Math.sin(v.a) * 60 + rand(-10, 10), life: 0.18, max: 0.18, col: pick(['#ffd23f', '#f08c28', '#5adcf0']), size: 2 }); }
        if (!v.turboSnd) { v.turboSnd = true; audio.sfx('turbo'); input.rumble(0.4, 0.6, 200); }
      } else v.turboSnd = false;
    } else if (input.pressed('run')) this.sfxAt('horn', v.x, v.y);
    if (input.pressed('a') && !this.lockCar && !G.ui?.dialog) this.exitCar();
  },

  updateVehicle(v, dt) {
    if (v.noHitT > 0) v.noHitT -= dt;
    if (v.air) { this.airStep(v, dt); return; }
    if (v === this.player.car && !v.dead && this.onRamp(v)) { this.startJump(v); return; }
    if (!v.sinking && !v.wreck && isWaterPx(v.x, v.y)) { v.sinking = 0.001; v.throttle = 0; this.splash(v.x, v.y); if (v === this.player.car) this.shake(2); }
    if (v.sinking) { this.sinkStep(v, dt); return; }
    if (v.wreck) { v.vx *= 0.9; v.vy *= 0.9; v.fire -= dt; if (v.fire > 0 && chance(0.3)) this.particles.push({ x: v.x + rand(-6, 6), y: v.y + rand(-4, 4), vx: rand(-5, 5), vy: rand(-25, -10), life: 1.2, max: 1.2, col: '#3a3a3a', size: 3, smoke: true }); return; }
    if (v.ai === 'traffic' && v.driver) v.trafficStep(dt, this);
    else if (v.ai === 'police') { this.policeDrive(v, dt); v.physics(dt, this); }
    else if (v.ai === 'script' && v.scriptTarget) { this.scriptDriveStep(v, dt); v.physics(dt, this); }
    else if (v.ai === 'npcchase') { this.npcChaseStep(v, dt); v.physics(dt, this); }
    else { if (v.driver !== 'player') { v.throttle = 0; v.steer = 0; v.handbrake = true; } v.physics(dt, this); }
    if (v.ai !== 'traffic') this.skidStep(v, dt);
    // smoke / fire
    v.smokeT -= dt;
    const hpf = v.hp / v.maxHp;
    if ((hpf < 0.45 || v.forceSmoke) && v.smokeT <= 0) {
      v.smokeT = hpf < 0.2 || v.forceSmoke === 'black' ? 0.05 : 0.12;
      const bx = v.x + Math.cos(v.a) * v.spec.L * 0.35, by = v.y + Math.sin(v.a) * v.spec.L * 0.35;
      const black = hpf < 0.2 || v.forceSmoke === 'black';
      this.particles.push({ x: bx, y: by, vx: rand(-8, 8) - v.vx * 0.2, vy: rand(-25, -12) - v.vy * 0.2, life: 1.1, max: 1.1, col: black ? '#1e1e24' : v.forceSmoke === 'gray' || hpf < 0.3 ? '#6a6a72' : '#c8c8cc', size: black ? 4 : 3, smoke: true, drag: 1 });
    }
    if (v.dead) {
      v.fire -= dt;
      if (chance(0.5)) this.particles.push({ x: v.x + rand(-5, 5), y: v.y + rand(-4, 4), vx: rand(-10, 10), vy: rand(-40, -20), life: 0.5, max: 0.5, col: pick(['#ffd23f', '#f08c28', '#d8323c']), size: 2 });
      if (v.fire <= 0) {
        v.wreck = true; v.fire = 8; this._exploding = v; this.explode(v.x, v.y); this._exploding = null;
        if (this.player.car === v) { this.exitCar(true); this.hurtPlayer(200); }
      }
    }
  },

  // ---- stunt ramps: hit one fast enough and the car flies (the river jump in the final chase)
  onRamp(v) {
    for (const r of MAP.ramps) {
      if (v.x < r.x0 || v.x > r.x1 || v.y < r.y0 || v.y > r.y1) continue;
      const along = v.vx * Math.cos(r.a) + v.vy * Math.sin(r.a);
      if (along > 60) return true;
    }
    return false;
  },
  startJump(v) {
    const sp = v.speed;
    v.air = { t: 0, dur: clamp(sp / 100, 0.75, 1.4) };
    audio.sfx('kick'); this.shake(3); input.rumble(0.6, 0.3, 160);
    if (!G.slowmo) { G.slowmo = 0.55; v.air.slow = true; }
    G.ui?.toast('¡SALTO!', '#ffd23f', 1.5);
  },
  airStep(v, dt) {
    const a = v.air;
    a.t += dt;
    v.x += v.vx * dt; v.y += v.vy * dt;
    if (a.t >= a.dur) {
      v.air = null;
      if (a.slow && G.slowmo === 0.55) G.slowmo = 0;
      this.shake(5); audio.sfx('crash'); input.rumble(0.9, 0.5, 220);
      v.damage(3, this);
      if (v.collides(v.x, v.y, v.a)) v.unstick();
      if (!isWaterPx(v.x, v.y) && v === this.player.car) { G.state.stats.jumps = (G.state.stats.jumps || 0) + 1; import('../story/achievements.js').then((m) => m.unlock('salto')); }
    }
  },
  // ---- drifting: rear wheels leave marks and smoke when the car slides (handbrake = Space)
  skidStep(v, dt) {
    const c = Math.cos(v.a), s = Math.sin(v.a);
    const lat = Math.abs(-v.vx * s + v.vy * c);
    const sliding = v.speed > 30 && (lat > 26 || (v.handbrake && v.speed > 40) || (v.boost > 1 && v.fwdSpeed < v.spec.max * 0.4));
    const back = v.spec.L * 0.32, side = v.spec.W * 0.36;
    const rear = [[v.x - c * back - s * side, v.y - s * back + c * side], [v.x - c * back + s * side, v.y - s * back - c * side]];
    if (sliding && v.lastRear && v.spec.style !== 'moto') {
      for (let i = 0; i < 2; i++) this.skids.push({ x: v.lastRear[i][0], y: v.lastRear[i][1], x2: rear[i][0], y2: rear[i][1], life: 14 });
      if (this.skids.length > 700) this.skids.splice(0, this.skids.length - 700);
      if (chance(0.3)) this.particles.push({ x: rear[0][0], y: rear[0][1], vx: rand(-6, 6), vy: rand(-12, -4), life: 0.7, max: 0.7, col: '#c8c8cc', size: 3, smoke: true, drag: 1 });
      if (v === this.player.car) { v.skidSnd = (v.skidSnd || 0) - dt; if (v.skidSnd <= 0) { v.skidSnd = 0.18; audio.sfx('skid'); } }
    }
    v.lastRear = rear;
  },

  // a car that went into the water: it floats for a moment, everybody swims out, it goes under
  sinkStep(v, dt) {
    v.sinking += dt;
    const k = Math.max(0, 1 - 2.2 * dt);
    v.vx *= k; v.vy *= k;
    v.x += v.vx * dt; v.y += v.vy * dt;
    if (chance(0.35)) this.particles.push({ x: v.x + rand(-6, 6), y: v.y + rand(-4, 4), vx: rand(-4, 4), vy: rand(-12, -4), life: 0.6, max: 0.6, col: '#c8e8ff', size: 1, drag: 1 });
    const p = this.player;
    if (p.car === v && v.sinking > 0.6) {
      p.car = null; p.x = v.x; p.y = v.y; p.a = v.a;
      v.driver = null; audio.setEngine(false);
      G.ui?.toast('¡El carro se hunde! Nada hasta la orilla', '#5adcf0', 3);
      emit('exitVehicle', v);
    }
    if (v.passengers.length && v.sinking > 0.8) {
      // the others swim out on their own and wait on the shore
      for (const a of v.passengers) { const sh = shoreNear(v.x, v.y); a.x = sh.x; a.y = sh.y; a.state = a.ally ? 'follow' : 'flee'; a.timer = 5; this.peds.push(a); }
      v.passengers = [];
    }
    if (v.sinking > 1.5 && !v.dead) { v.dead = true; v.sunk = true; v.fire = Infinity; v.hp = 0; }
    if (v.sinking > 4.5) this.removeVehicle(v);
  },

  scriptDriveStep(v, dt) {
    const t = v.scriptTarget;
    const d = dist(v.x, v.y, t.x, t.y);
    const aim = angleTo(v.x, v.y, t.x, t.y);
    const diff = angDiff(v.a, aim);
    v.steer = clamp(diff * 2.5, -1, 1);
    v.throttle = d < 20 ? -0.5 * Math.sign(v.fwdSpeed) : clamp(d / 80, 0.3, t.speed || 0.8) * (Math.abs(diff) > 1.3 ? 0.4 : 1);
    v.handbrake = d < 8;
    if (d < 12 && t.onArrive) { const f = t.onArrive; t.onArrive = null; f(); }
  },

  // a patrol following a fleeing car's trail (random event, not about you)
  npcChaseStep(v, dt) {
    const tr = v.trail || [];
    while (tr.length > 1 && dist(v.x, v.y, tr[0].x, tr[0].y) < 20) tr.shift();
    const tg = tr[0] || v.chaseTarget;
    if (!tg) { v.throttle = 0; return; }
    const diff = angDiff(v.a, angleTo(v.x, v.y, tg.x, tg.y));
    v.steer = clamp(diff * 2.4, -1, 1);
    v.throttle = Math.abs(diff) > 1.4 ? 0.4 : 0.95;
    v.handbrake = false;
    if (v.speed < 10 && Math.abs(v.throttle) > 0.3) v.stuckT = (v.stuckT || 0) + dt; else v.stuckT = 0;
    if (v.stuckT > 1.5) { v.x = tg.x; v.y = tg.y; v.stuckT = 0; tr.shift(); }
  },
  // is there a siren close by? (traffic pulls over)
  sirenNear(x, y, r) {
    for (const v of this.vehicles) if (v.sirenOn && dist2(v.x, v.y, x, y) < r * r) return v;
    return null;
  },
  // like obstacleNear, but says what's in the way
  obstacleAt(x, y, r, self) {
    const r2 = r * r;
    for (const v of this.vehicles) if (v !== self && !v.wreck && dist2(v.x, v.y, x, y) < r2 + v.spec.L * 3) return { kind: v === this.player.car ? 'player' : 'car', v };
    const p = this.player;
    if (!p.car && dist2(p.x, p.y, x, y) < r2) return { kind: 'player' };
    for (const q of this.peds) if (q.state !== 'dead' && dist2(q.x, q.y, x, y) < r2 * 0.6) return { kind: 'ped', q };
    return null;
  },

  policeDrive(v, dt) {
    const pos = this.pos();
    const d = dist(v.x, v.y, pos.x, pos.y);
    v.sirenOn = true;
    if (this.wanted === 0 && !this.policeKnows) {
      v.throttle = 0.4; v.steer = 0; v.leaveT = (v.leaveT || 0) + dt;
      return;
    }
    const pl = this.player;
    // deploy officers when close and player on foot
    if ((!pl.car || pl.car.speed < 12) && d < 85 && !v.deployed && v.speed < 60) {
      v.deployed = true; v.throttle = 0; v.handbrake = true;
      for (const s of [1, -1]) {
        const ox = v.x + Math.cos(v.a + s * Math.PI / 2) * 12, oy = v.y + Math.sin(v.a + s * Math.PI / 2) * 12;
        if (!solidFootPx(ox, oy)) { const c = new Ped('cop', ox, oy); c.cop = true; c.state = 'chase'; c.hp = 50; c.speed = 70; c.fromCar = v; this.peds.push(c); this.say(c, pick(BARKS.cop), 2); }
      }
      return;
    }
    if (v.deployed) { v.throttle = 0; v.handbrake = true; if (pl.car && d > 120) v.deployed = false; else return; }
    v.handbrake = false;
    let tx, ty;
    const direct = d < 110 && clearLine(v.x, v.y, pos.x, pos.y);
    if (direct) { const lead = pl.car ? 0.25 : 0.1; tx = pos.x + (pl.car ? pl.car.vx * lead : 0); ty = pos.y + (pl.car ? pl.car.vy * lead : 0); }
    else { const s = this.fieldStep(v.x, v.y, 4); tx = s.x; ty = s.y; }
    const aim = angleTo(v.x, v.y, tx, ty);
    const diff = angDiff(v.a, aim);
    // stuck recovery
    if (v.speed < 12 && Math.abs(v.throttle) > 0.3) v.stuckT = (v.stuckT || 0) + dt; else v.stuckT = Math.max(0, (v.stuckT || 0) - dt);
    if (v.reverseT > 0) { v.reverseT -= dt; v.throttle = -0.8; v.steer = -Math.sign(diff); return; }
    if (v.stuckT > 1.2) { v.reverseT = 0.9; v.stuckT = 0; return; }
    v.steer = clamp(diff * 2.4, -1, 1);
    v.throttle = Math.abs(diff) > 2.2 ? 0.3 : Math.abs(diff) > 1.2 ? 0.6 : 0.9;
    if (!pl.car && d < 50) v.throttle = 0.2;
    // tail the player instead of ramming: only 4+ stars get the aggressive cops
    if (pl.car && d < 60) {
      const keep = this.wanted >= 4 ? 20 : 38;
      const rel = pl.car.fwdSpeed;
      v.throttle = d < keep ? (v.fwdSpeed > rel ? -0.4 : 0) : clamp(0.3 + (rel - v.fwdSpeed) / 80, 0, 0.85);
    }
  },

  collideVehicles() {
    const vs = this.vehicles;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i];
      if (a.sinking) continue;
      for (let j = i + 1; j < vs.length; j++) {
        const b = vs[j];
        if (b.sinking) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy > 1600) continue;
        // two circles per vehicle
        const ca = circles(a), cb = circles(b);
        let hit = false, nx = 0, ny = 0, overlap = 0;
        for (const p of ca) for (const q of cb) {
          const ddx = q[0] - p[0], ddy = q[1] - p[1], rr = p[2] + q[2];
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < rr * rr) { const d = Math.sqrt(d2) || 1; const o = rr - d; if (o > overlap) { overlap = o; nx = ddx / d; ny = ddy / d; hit = true; } }
        }
        if (!hit) continue;
        const aKin = a.ai === 'traffic' && a.driver, bKin = b.ai === 'traffic' && b.driver;
        const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
        const vn = rvx * nx + rvy * ny;
        const imp = Math.abs(vn);
        // separate the cars, but never shove one into a wall (that's how cars "went through" houses)
        if (!aKin && !bKin) {
          const okA = nudge(a, -nx * overlap / 2, -ny * overlap / 2), okB = nudge(b, nx * overlap / 2, ny * overlap / 2);
          if (!okA) nudge(b, nx * overlap / 2, ny * overlap / 2);
          if (!okB) nudge(a, -nx * overlap / 2, -ny * overlap / 2);
        }
        else if (aKin && !bKin) nudge(b, nx * overlap, ny * overlap);
        else if (!aKin && bKin) nudge(a, -nx * overlap, -ny * overlap);
        if (vn < 0) {
          const e = 0.35;
          const ma = a.spec.hp, mb = b.spec.hp;
          const jimp = -(1 + e) * vn / (1 / ma + 1 / mb);
          if (!aKin) { a.vx -= jimp * nx / ma; a.vy -= jimp * ny / ma; }
          if (!bKin) { b.vx += jimp * nx / mb; b.vy += jimp * ny / mb; }
          if (aKin && imp > 20) { a.stun = 0.8; }
          if (bKin && imp > 20) { b.stun = 0.8; }
        }
        if (imp > 40) {
          if (imp > 55) { a.damage((imp - 50) * 0.07, this); b.damage((imp - 50) * 0.07, this); }
          const pc = this.player.car;
          if (a === pc || b === pc) {
            this.shake(Math.min(5, imp / 35)); this.sfxAt('crash', a.x, a.y);
            const other = a === pc ? b : a;
            // only the player's fault if they were the one driving into the cop
            if ((other.type === 'police' || other.type === 'reyes') && imp > 50 && pc.speed > 40 && pc.speed > other.speed && Math.abs(pc.throttle) > 0.1) this.crime(1, other.x, other.y, true);
            if (other.ai === 'traffic' && other.driver && chance(0.5)) { other.honk = 2; this.sfxAt('horn', other.x, other.y); }
          }
        }
      }
      // vehicle vs peds / player
      const sp = a.speed;
      if (sp > 22) {
        for (const q of this.peds) {
          if (q.state === 'dead' || q.state === 'down' && sp < 60) continue;
          if (this.inCarRect(a, q.x, q.y, 3)) {
            if (q.ally || q.invuln || a.noHitT > 0) { q.x += a.vx * 0.05; q.y += a.vy * 0.05; continue; }
            q.state = 'down'; q.timer = 3; q.a = Math.atan2(a.vy, a.vx);
            q.x += a.vx * 0.12; q.y += a.vy * 0.12;
            if (solidFootPx(q.x, q.y)) { q.x -= a.vx * 0.12; q.y -= a.vy * 0.12; }
            const mine = a === this.player.car && Math.abs(a.throttle) > 0.1;
            this.hurtPed(q, sp * 0.45, a.x, a.y, mine);
            if (q.state !== 'dead') q.state = 'down';
            if (mine) { this.sfxAt('hit', q.x, q.y); this.crime(1, q.x, q.y); a.damage(2, this); }
          }
        }
        const p = this.player;
        if (!p.car && !p.dead && a !== p.car && !(a.noHitT > 0) && this.inCarRect(a, p.x, p.y, 3)) {
          this.hurtPlayer(sp * 0.25);
          p.x += a.vx * 0.1; p.y += a.vy * 0.1;
          if (solidFootPx(p.x, p.y)) { p.x -= a.vx * 0.1; p.y -= a.vy * 0.1; }
          p.hurtT = 0.4;
        }
      }
    }
  },
  inCarRect(v, x, y, pad = 0) {
    const dx = x - v.x, dy = y - v.y;
    const c = Math.cos(v.a), s = Math.sin(v.a);
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    return Math.abs(lx) < v.spec.L / 2 + pad && Math.abs(ly) < v.spec.W / 2 + pad;
  },

  obstacleNear(x, y, r, self) {
    const r2 = r * r;
    for (const v of this.vehicles) if (v !== self && !v.wreck && dist2(v.x, v.y, x, y) < r2 + v.spec.L * 3) return v === this.player.car ? 'player' : 'car';
    const p = this.player;
    if (!p.car && dist2(p.x, p.y, x, y) < r2) return 'player';
    for (const q of this.peds) if (q.state !== 'dead' && dist2(q.x, q.y, x, y) < r2 * 0.6) return 'ped';
    return null;
  },

  // ------------------------------------------------------------ peds
  updatePed(q, dt) {
    if (q.flash > 0) q.flash -= dt;
    if (q.punchAnim > 0) q.punchAnim -= dt;
    if (q.barkT > 0) { q.barkT -= dt; if (q.barkT <= 0) q.bark = null; }
    q.anim += dt;
    const p = this.player, pos = this.pos();
    switch (q.state) {
      case 'dead': q.timer -= dt; q.moving = false; return;
      case 'down': q.timer -= dt; q.moving = false; if (q.timer <= 0) { q.state = q.cop ? 'chase' : q.ally ? 'follow' : 'flee'; q.timer = 5; q.fleeFrom = pos; } return;
      case 'idle': q.moving = false; q.timer -= dt; if (!q.mission && q.timer <= 0) q.state = 'walk'; break;
      case 'walk': q.wander(dt); break;
      case 'flee': {
        q.timer -= dt;
        const f = q.fleeFrom || pos;
        const a = Math.atan2(q.y - f.y, q.x - f.x) + Math.sin(q.anim * 3) * 0.4;
        if (!q.goTo(q.x + Math.cos(a) * 20, q.y + Math.sin(a) * 20, 75, dt, false) && q.stuck > 0.3) { q.fleeFrom = { x: q.x + rand(-30, 30), y: q.y + rand(-30, 30) }; }
        if (q.timer <= 0) { q.state = q.mission ? 'idle' : 'walk'; q.target = null; }
        break;
      }
      case 'follow': {
        const tgt = q.followTarget || pos;
        const d = dist(q.x, q.y, tgt.x, tgt.y);
        if (isWaterPx(tgt.x, tgt.y)) { q.moving = false; break; }
        if (d > 22) q.goTo(tgt.x, tgt.y, d > 60 ? 95 : 60, dt, false); else q.moving = false;
        if (q.stuck > 1.5 && d > 40) { q.x = tgt.x - Math.cos(p.a) * 14; q.y = tgt.y - Math.sin(p.a) * 14; if (solidFootPx(q.x, q.y)) { q.x = tgt.x; q.y = tgt.y; } q.stuck = 0; }
        if (d > 400) { q.x = tgt.x; q.y = tgt.y; }
        break;
      }
      case 'goto': {
        if (q.goal && q.goTo(q.goal.x, q.goal.y, q.goal.speed || 45, dt, false)) { q.state = 'idle'; const f = q.goal.onArrive; q.goal = null; if (f) f(q); }
        break;
      }
      case 'chase': this.copStep(q, dt); break;
      case 'npcfight': {
        const f = q.foe;
        if (!f || f.state === 'dead' || f.state === 'down' || !this.peds.includes(f)) { q.state = 'walk'; q.foe = null; if (f) this.say(q, pick(['¡Y no vuelvas!', 'Pa\' que aprendas.', '¿Alguien más?']), 2); break; }
        const d = dist(q.x, q.y, f.x, f.y);
        if (d > 10) q.goTo(f.x, f.y, 40, dt, false);
        else {
          q.moving = false; q.a = angleTo(q.x, q.y, f.x, f.y);
          q.punchT = (q.punchT ?? rand(0.2, 0.8)) - dt;
          if (q.punchT <= 0) {
            q.punchT = rand(0.7, 1.3); q.punchAnim = 0.22;
            f.hp -= rand(4, 9); f.flash = 0.12;
            f.x += Math.cos(q.a) * 3; f.y += Math.sin(q.a) * 3; if (solidFootPx(f.x, f.y)) { f.x -= Math.cos(q.a) * 3; f.y -= Math.sin(q.a) * 3; }
            this.sfxAt('punch', f.x, f.y);
            if (chance(0.3)) this.say(q, pick(['¡Toma!', '¡Ándale!', '¡Para que aprendas!', '¿Qué? ¿Qué?']), 1.3);
            if (f.hp <= 0) { f.state = 'down'; f.timer = 8; f.foe = null; this.say(f, pick(['Ya, ya...', '¡Me rindo!']), 2); }
          }
        }
        break;
      }
      case 'brawl': {
        const d = dist(q.x, q.y, pos.x, pos.y);
        q.punchT = (q.punchT || 0) - dt;
        if (d > 11) { q.goTo(pos.x, pos.y, q.speed || 55, dt, false); }
        else {
          q.moving = false; q.a = angleTo(q.x, q.y, pos.x, pos.y);
          if (q.punchT <= 0 && !p.car && !p.dead) {
            q.punchT = rand(0.8, 1.2); q.punchAnim = 0.22; audio.sfx('punch', { vol: 0.6 });
            this.hurtPlayer(7); p.x += Math.cos(q.a) * 5; p.y += Math.sin(q.a) * 5;
            if (solidFootPx(p.x, p.y)) { p.x -= Math.cos(q.a) * 5; p.y -= Math.sin(q.a) * 5; }
            if (chance(0.3)) this.say(q, pick(['¡Toma!', '¡Llave china!', '¡Ahí te va!', '¡De a tres caídas!']), 1.2);
          }
        }
        break;
      }
      default: break;
    }
    // barks near player
    if (!q.bark && !q.mission && !q.cop && q.state === 'walk' && dist2(q.x, q.y, pos.x, pos.y) < 1600 && chance(0.004)) {
      const z = zoneOf(Math.floor(q.x / TS), Math.floor(q.y / TS));
      const night = isNight();
      this.say(q, pick(z === 'afueras' && chance(0.5) ? BARKS.afueras : night && chance(0.3) ? BARKS.night : BARKS.generic), 3.5);
    }
  },

  copStep(q, dt) {
    const p = this.player, pos = this.pos();
    if (this.wanted === 0 && !this.policeKnows) { q.state = 'walk'; q.cop = true; q.returnT = (q.returnT || 0) + dt; return; }
    const d = dist(q.x, q.y, pos.x, pos.y);
    if (q.fromCar && p.car && d > 60 && !q.fromCar.dead) {
      // go back to car
      if (q.goTo(q.fromCar.x, q.fromCar.y, 80, dt, false) || dist(q.x, q.y, q.fromCar.x, q.fromCar.y) < 14) { q.fromCar.deployed = false; this.removePed(q); }
      return;
    }
    const shoots = this.wanted >= 3 || q.hostile;
    if (shoots && d < 130 && d > 18) {
      q.a = angleTo(q.x, q.y, pos.x, pos.y);
      q.moving = false;
      q.shootT -= dt;
      if (q.shootT <= 0) {
        q.shootT = rand(0.9, 1.6);
        const a = q.a + rand(-0.12, 0.12);
        this.bullets.push({ x: q.x + Math.cos(a) * 6, y: q.y + Math.sin(a) * 6, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, life: 0.5, owner: 'cop', dmg: 7 });
        this.sfxAt('shot', q.x, q.y);
      }
      if (d > 90) q.goTo(pos.x, pos.y, q.speed, dt, false);
      return;
    }
    if (d > 8) {
      const t = d < 90 ? pos : this.fieldStep(q.x, q.y, 2);
      q.goTo(t.x, t.y, q.speed || 70, dt, false);
    }
    // arrest
    if (!p.dead && d < 12 && (!p.car || p.car.speed < 10)) {
      p.arrestT += dt;
      if (p.arrestT > (p.car ? 1.6 : 1.0)) this.busted();
    }
  },

  updateBullets(dt) {
    const p = this.player;
    for (const b of this.bullets) {
      const steps = 3;
      for (let s = 0; s < steps && b.life > 0; s++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (solidCarPx(b.x, b.y) && tileAt(Math.floor(b.x / TS), Math.floor(b.y / TS)) !== T.WATER) { b.life = 0; this.particles.push({ x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.2, max: 0.2, col: '#fff08c', size: 1 }); break; }
        for (const v of this.vehicles) {
          if (v === p.car && b.owner === 'player') continue;
          if (!v.wreck && this.inCarRect(v, b.x, b.y)) {
            b.life = 0; v.damage(b.dmg * 0.4, this); if (b.owner === 'player') v.lastHitBy = 'player';
            this.particles.push({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.15, max: 0.15, col: '#ffd23f', size: 1 });
            if (b.owner === 'player' && (v.type === 'police' || v.type === 'reyes')) this.crime(2, v.x, v.y, true);
            break;
          }
        }
        if (b.life <= 0) break;
        for (const q of this.peds) {
          if (q.state === 'dead') continue;
          if (b.owner === 'cop' && (q.cop || q.ally)) continue;
          if (b.owner === 'player' && q.ally) continue;
          if (dist2(q.x, q.y, b.x, b.y) < 36) { b.life = 0; this.hurtPed(q, b.dmg, b.x - b.vx, b.y - b.vy, b.owner === 'player'); break; }
        }
        if (b.life <= 0) break;
        if (b.owner !== 'player') {
          const pos = this.pos();
          if (p.car ? this.inCarRect(p.car, b.x, b.y) : dist2(p.x, p.y, b.x, b.y) < 30) {
            b.life = 0;
            if (p.car) p.car.damage(b.dmg * 0.5, this); else this.hurtPlayer(b.dmg);
            if (!p.car) this.particles.push({ x: pos.x, y: pos.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.2, max: 0.2, col: '#d8323c', size: 1 });
          }
        }
      }
      b.life -= dt;
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  },

  // ------------------------------------------------------------ wanted
  updateWanted(dt) {
    const pos = this.pos();
    if (this.starCd > 0) this.starCd -= dt;
    if (this.wanted > 0) {
      this.heat = Math.max(this.heat || 0, HEAT[this.wanted]);
      if (this.noEvade || this.wanted >= 5) this.evadeT = 0;
      else if (this.copsSee(pos.x, pos.y)) this.evadeT = 0;
      else {
        this.evadeT += dt;
        if (this.evadeT > 5 + this.wanted * 3) {
          this.wanted--; this.evadeT = 0; this.heat = HEAT[this.wanted]; emit('wanted', this.wanted);
          if (this.wanted === 0) G.ui?.toast('Los perdiste', '#46b450', 2);
        }
      }
      // spawn police (slowly, and never right on top of the player)
      const cars = this.vehicles.filter((v) => v.ai === 'police');
      const want = Math.min(6, [0, 1, 2, 3, 4, 5][this.wanted] + (this.extraCops || 0));
      this.policeSpawnT = (this.policeSpawnT || 0) - dt;
      if (cars.length < want && this.policeSpawnT <= 0) {
        this.policeSpawnT = this.wanted >= 4 ? 3.5 : 6;
        this.spawnPoliceCar(this.wanted >= 4 && !cars.some((c) => c.type === 'reyes') ? 'reyes' : 'police');
      }
      // heli at 5 stars
      if (this.wanted >= 5) {
        if (!this.heli) this.heli = { x: pos.x - 300, y: pos.y - 200, a: 0, shootT: 2 };
        const h = this.heli;
        h.x = lerp(h.x, pos.x, dt * 0.8); h.y = lerp(h.y, pos.y - 20, dt * 0.8); h.a += dt * 25;
        h.shootT -= dt;
        if (h.shootT <= 0 && dist(h.x, h.y, pos.x, pos.y) < 100) {
          h.shootT = 1.8;
          const a = angleTo(h.x, h.y + 20, pos.x, pos.y) + rand(-0.1, 0.1);
          this.bullets.push({ x: h.x, y: h.y + 20, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 0.6, owner: 'cop', dmg: 6 });
          this.sfxAt('shot', h.x, h.y);
        }
      } else this.heli = null;
      // busted-in-car check handled in copStep
    } else {
      this.heli = null;
      this.heat = Math.max(0, (this.heat || 0) - dt * 0.08);
      if (this.player.arrestT > 0) this.player.arrestT = Math.max(0, this.player.arrestT - dt);
    }
    // police without wanted return to patrol / despawn
    for (const v of this.vehicles) {
      if (v.ai === 'police' && this.wanted === 0 && !this.policeKnows) { v.sirenOn = false; if (dist(v.x, v.y, pos.x, pos.y) > 380 || (v.leaveT || 0) > 12) this.removeVehicle(v); }
    }
    for (const q of this.peds.slice()) if (q.cop && this.wanted === 0 && !this.policeKnows && !q.mission && dist(q.x, q.y, pos.x, pos.y) > 260) this.removePed(q);
  },

  spawnPoliceCar(type = 'police') {
    const pos = this.pos();
    const cands = MAP.nodes.filter((n) => { const d = dist(n.x, n.y, pos.x, pos.y); return d > 360 && d < 640 && !isVisible(this, n.x, n.y, 110); });
    const lockedTile = (n) => tileAt(Math.floor(n.x / TS), Math.floor(n.y / TS)) === T.BARRIER;
    const valid = cands.filter((n) => !lockedTile(n) && MAP.unlocked && reachable(this, n));
    const n = pick(valid.length ? valid : cands);
    if (!n) return;
    const v = this.spawnVehicle(type, n.x, n.y, angleTo(n.x, n.y, pos.x, pos.y), { ai: 'police' });
    v.sirenOn = true;
    return v;
  },

  // ------------------------------------------------------------ population
  managePopulation(dt) {
    this.popT = (this.popT || 0) - dt;
    if (this.popT > 0) return;
    this.popT = 0.25;
    const pos = this.pos();
    const zone = zoneOf(Math.floor(pos.x / TS), Math.floor(pos.y / TS));
    // despawn far
    this.vehicles = this.vehicles.filter((v) => v.mission || v === this.player.car || v.ai === 'police' || (v.passengers && v.passengers.length) || (dist2(v.x, v.y, pos.x, pos.y) < 700 * 700 && !(v.giveUp && !isVisible(this, v.x, v.y, 30))));
    this.peds = this.peds.filter((q) => q.mission || q.ally || dist2(q.x, q.y, pos.x, pos.y) < 480 * 480 && !(q.state === 'dead' && q.timer <= 0));
    for (const k of [...this.spawnedParking]) { const pk = MAP.parking[k]; if (dist2(pk.x, pk.y, pos.x, pos.y) > 720 * 720) this.spawnedParking.delete(k); }
    // traffic
    const traffic = this.vehicles.filter((v) => v.ai === 'traffic' && v.driver).length;
    const wantT = !this.trafficOn ? 0 : zone === 'afueras' ? 3 : 12;
    if (traffic < wantT) {
      for (let tries = 0; tries < 6; tries++) {
        const e = pick(MAP.edges);
        if (edgeBlocked(e)) continue;
        const frac = Math.random();
        const x = lerp(e.from.x, e.to.x, frac), y = lerp(e.from.y, e.to.y, frac);
        const d = dist(x, y, pos.x, pos.y);
        if (d < 220 || d > 520 || isVisible(this, x, y, 30)) continue;
        const v = new Vehicle(pick(['sedan', 'sedan', 'compact', 'compact', 'vocho', 'pickup', 'taxi', 'van', 'truck', 'sports', 'bus', 'tsuru', 'lowrider', 'muscle', 'jeep', 'convertible', zone === 'centro' ? 'limo' : 'sedan', chance(0.3) ? 'helados' : 'compact']), x, y, 0);
        v.driver = randomCivilian(); v.driverLook = v.driver;
        v.placeOnEdge(e, frac);
        if (v.collides(v.x, v.y, v.a) || this.obstacleNear(v.x, v.y, 30, v)) continue;
        this.vehicles.push(v);
        break;
      }
    }
    // parked cars
    MAP.parking.forEach((pk, k) => {
      if (this.spawnedParking.has(k)) return;
      const d = dist2(pk.x, pk.y, pos.x, pos.y);
      if (d < 600 * 600 && d > 200 * 200) { this.spawnedParking.add(k); const v = new Vehicle(pick(['sedan', 'compact', 'vocho', 'pickup', 'sports', 'van', 'lowrider', 'muscle', 'jeep', 'convertible']), pk.x, pk.y, pk.a); v.ai = 'parked'; this.vehicles.push(v); }
    });
    // peds
    const peds = this.peds.filter((q) => !q.mission && !q.cop).length;
    const wantP = !this.pedsOn ? 0 : zone === 'afueras' ? 3 : isNight() ? 10 : 20;
    if (peds < wantP) {
      for (let tries = 0; tries < 10; tries++) {
        const tx = Math.floor(pos.x / TS) + randi(-22, 22), ty = Math.floor(pos.y / TS) + randi(-15, 15);
        const px = tx * TS + 8, py = ty * TS + 8;
        const walkOk = isWalkway(tx, ty) || (zone === 'afueras' && [T.GRASS, T.DIRT].includes(tileAt(tx, ty)));
        if (!walkOk || isVisible(this, px, py, 10) || dist(px, py, pos.x, pos.y) < 150) continue;
        const q = new Ped(randomCivilian(), px, py);
        this.peds.push(q);
        break;
      }
    }
  },

  // ------------------------------------------------------------ collectibles
  checkCollectibles(pos) {
    const st = G.state.collect;
    for (const kind of ['cassettes', 'stars', 'kazoos']) {
      const list = MAP.collect[kind];
      for (let i = 0; i < list.length; i++) {
        if (st[kind].includes(i)) continue;
        const c = list[i];
        if (dist2(c.x, c.y, pos.x, pos.y) < 144) { st[kind].push(i); audio.sfx(kind === 'stars' ? 'star' : 'pickup'); emit('collect', kind, i); }
      }
    }
    for (const pk of this.pickups) {
      if (pk.taken) continue;
      if (dist2(pk.x, pk.y, pos.x, pos.y) < 150 && (!pk.needFoot || !this.player.car)) { pk.taken = true; audio.sfx('pickup'); if (pk.onTake) pk.onTake(pk); }
    }
    this.pickups = this.pickups.filter((p) => !p.taken);
    // hearts / vests / bribe stars: only grabbed when they'd actually do something
    const s = G.state, p = this.player;
    for (const pk of this.worldPickups) {
      if (pk.taken || dist2(pk.x, pk.y, pos.x, pos.y) > 196) continue;
      if (pk.kind === 'health') { if (p.hp >= 100) continue; p.hp = Math.min(100, p.hp + 50); G.ui?.toast('+50 VIDA', '#ff5a5a', 1.5); }
      else if (pk.kind === 'armor') { if ((s.armor || 0) >= 100) continue; s.armor = 100; G.ui?.toast('CHALECO ANTIBALAS', '#5a9cff', 1.8); }
      else { if (this.wanted <= 0 || this.wantedLocked) continue; this.setWanted(this.wanted - 1); G.ui?.toast('SOBORNO: -1 ESTRELLA', '#46d4c8', 2); }
      pk.taken = true; pk.t = 150;
      audio.sfx(pk.kind === 'bribe' ? 'coin' : 'pickup');
      for (let k = 0; k < 10; k++) this.particles.push({ x: pk.x, y: pk.y, vx: rand(-30, 30), vy: rand(-40, 0), life: 0.5, max: 0.5, col: pk.kind === 'health' ? '#ff5a5a' : pk.kind === 'armor' ? '#5a9cff' : '#46d4c8', size: 1 });
    }
  },

  // ------------------------------------------------------------ camera
  snapCam() {
    const p = this.pos();
    this.cam.x = clamp(p.x - W / 2, 0, MW * TS - W); this.cam.y = clamp(p.y - H / 2, 0, MH * TS - H);
  },
  updateCamera(dt) {
    let tx, ty;
    if (this.camTarget) { tx = this.camTarget.x; ty = this.camTarget.y; }
    else {
      const p = this.player;
      if (p.car) { tx = p.car.x + clamp(p.car.vx * 0.45, -90, 90); ty = p.car.y + clamp(p.car.vy * 0.35, -55, 55); }
      else { tx = p.x; ty = p.y; }
    }
    const k = this.camTarget ? 2.5 : 5;
    this.cam.x = lerp(this.cam.x, clamp(tx - W / 2, 0, MW * TS - W), Math.min(1, dt * k));
    this.cam.y = lerp(this.cam.y, clamp(ty - H / 2, 0, MH * TS - H), Math.min(1, dt * k));
    if (this.cam.shake > 0) this.cam.shake = Math.max(0, this.cam.shake - dt * 20);
  },

  // ------------------------------------------------------------ render
  render(ctx) {
    const cx = Math.round(this.cam.x + (this.cam.shake ? rand(-this.cam.shake, this.cam.shake) : 0));
    const cy = Math.round(this.cam.y + (this.cam.shake ? rand(-this.cam.shake, this.cam.shake) : 0));
    drawMap(ctx, cx, cy, W, H, G.time);
    const vis = (x, y, m = 40) => x > cx - m && y > cy - m && x < cx + W + m && y < cy + H + m;
    const t = G.time;
    drawGround(ctx, this, cx, cy, t);

    // graffiti
    MAP.collect.graffiti.forEach((g, i) => {
      if (!vis(g.x, g.y)) return;
      const done = G.state.collect.graffiti.includes(i);
      const sx = g.x - cx - 8, sy = g.y - cy - 6;
      if (done) drawTag(ctx, sx, sy, i);
      else if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = 'rgba(255,60,200,0.6)'; ctx.fillRect(sx + 6, sy + 2, 4, 6); ctx.fillStyle = '#f4f4f0'; ctx.fillRect(sx + 7, sy, 2, 2); }
    });

    // markers (ground)
    for (const m of this.markers) {
      if (m.hidden || !vis(m.x, m.y, 60)) continue;
      drawMarker(ctx, m.x - cx, m.y - cy, m, t);
    }
    // collectibles
    const st = G.state.collect;
    for (const kind of ['cassettes', 'stars', 'kazoos']) MAP.collect[kind].forEach((c, i) => {
      if (st[kind].includes(i) || !vis(c.x, c.y)) return;
      drawCollectible(ctx, c.x - cx, c.y - cy + Math.sin(t * 3 + i) * 1.5, kind, t);
    });
    for (const pk of this.pickups) if (vis(pk.x, pk.y)) drawPickup(ctx, pk.x - cx, pk.y - cy + Math.sin(t * 4) * 1.5, pk, t);
    for (const pk of this.worldPickups) if (!pk.taken && vis(pk.x, pk.y)) drawWorldPickup(ctx, pk.x - cx, pk.y - cy + Math.sin(t * 3 + pk.x) * 1.5, pk.kind, t);

    // peds (down first)
    const peds = this.peds.filter((q) => vis(q.x, q.y));
    peds.sort((a, b) => (a.state === 'dead' || a.state === 'down' ? -1 : 0) - (b.state === 'dead' || b.state === 'down' ? -1 : 0));
    for (const q of peds) {
      const s = q.sprite();
      if (q.state !== 'dead' && q.state !== 'down') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(q.x - cx - 3), Math.round(q.y - cy + 3), 7, 2); }
      ctx.drawImage(s, Math.round(q.x - cx - s.width / 2), Math.round(q.y - cy - s.height / 2));
      if (q.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(Math.round(q.x - cx - 4), Math.round(q.y - cy - 4), 8, 8); }
      if (q.ally && q.label) font.text(ctx, q.label, q.x - cx, q.y - cy - 14, q.labelColor || '#ffd23f', { align: 'center', outline: '#000' });
    }
    // vehicles
    for (const v of this.vehicles) {
      if (!vis(v.x, v.y)) continue;
      const s = v.sprite(t);
      if (v.sinking) {
        const k = Math.min(1, v.sinking / 4.5);
        ctx.globalAlpha = Math.max(0, 1 - k * 0.9);
        ctx.drawImage(s, Math.round(v.x - cx - s.width / 2), Math.round(v.y - cy - s.height / 2));
        ctx.globalAlpha = 0.25 + k * 0.5; ctx.fillStyle = '#2a5a9e';
        ctx.fillRect(Math.round(v.x - cx - s.width / 2), Math.round(v.y - cy - s.height / 2), s.width, s.height);
        ctx.globalAlpha = 0.7; ctx.strokeStyle = '#c8e8ff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(Math.round(v.x - cx), Math.round(v.y - cy), 10 + k * 8 + Math.sin(t * 6) * 1.5, 7 + k * 5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      // a real dark shadow (it used to be a see-through copy of the car: it looked like a reflection)
      const sh = shadowOf(s);
      const lift = v.air ? Math.sin(Math.PI * Math.min(1, v.air.t / v.air.dur)) : 0;
      ctx.globalAlpha = 0.32 - lift * 0.12;
      ctx.drawImage(sh, Math.round(v.x - cx - s.width / 2 + 2 + lift * 12), Math.round(v.y - cy - s.height / 2 + 2 + lift * 16));
      ctx.globalAlpha = 1;
      if (lift > 0) {
        const k = 1 + lift * 0.5;
        ctx.save(); ctx.translate(Math.round(v.x - cx), Math.round(v.y - cy - lift * 6)); ctx.scale(k, k);
        ctx.drawImage(s, -s.width / 2, -s.height / 2); ctx.restore();
      } else ctx.drawImage(s, Math.round(v.x - cx - s.width / 2), Math.round(v.y - cy - s.height / 2));
      // traffic turn signals
      if (v.turnSide && v.ai === 'traffic' && Math.floor(t * 3) % 2 === 0) {
        const c = Math.cos(v.a), sn = Math.sin(v.a), hl = v.spec.L / 2 - 1, hw = (v.spec.W / 2) * v.turnSide;
        ctx.fillStyle = '#ffb02a';
        for (const f of [hl, -hl]) ctx.fillRect(Math.round(v.x - cx + c * f - sn * hw), Math.round(v.y - cy + sn * f + c * hw), 1, 1);
      }
      if (v.label) font.text(ctx, v.label, v.x - cx, v.y - cy - 16, '#ffd23f', { align: 'center', outline: '#000' });
    }
    // player on foot
    const p = this.player;
    if (!p.car && !p.hidden && isWaterPx(p.x, p.y) && !p.dead) {
      // swimming: only the head shows, with rings around it
      const s = topSprites(p.look), img = s[0][rotIndex(p.a, TOP_DIRS)];
      const sx = Math.round(p.x - cx), sy = Math.round(p.y - cy), st = p.moving ? Math.floor(p.anim * 6) % 2 : 0;
      ctx.strokeStyle = 'rgba(200,232,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(sx + 0.5, sy + 0.5, 6 + Math.sin(t * 5) * 1, 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, sx - img.width / 2, sy - img.height / 2);
      ctx.restore();
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(sx + Math.round(Math.cos(p.a + (st ? 1.3 : -1.3)) * 5), sy + Math.round(Math.sin(p.a + (st ? 1.3 : -1.3)) * 5), 2, 1);
    } else if (!p.car && !p.hidden) {
      const s = topSprites(p.look);
      const punching = p.punchT > 0.1 && G.state.weapon === 'fists';
      const fr = p.dead ? 3 : punching ? 4 : p.moving ? 1 + (Math.floor(p.anim * 8) % 2) : 0;
      const img = fr === 3 ? s[3][0] : s[fr][rotIndex(p.a, TOP_DIRS)];
      if (punching && p.punchT > 0.22) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(p.x - cx), Math.round(p.y - cy), 9, p.a - 0.7, p.a + 0.7); ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(p.x - cx - 3), Math.round(p.y - cy + 3), 7, 2);
      ctx.drawImage(img, Math.round(p.x - cx - img.width / 2), Math.round(p.y - cy - img.height / 2));
      if (p.hurtT > 0 && Math.floor(t * 20) % 2) { ctx.fillStyle = 'rgba(255,60,60,0.5)'; ctx.fillRect(Math.round(p.x - cx - 4), Math.round(p.y - cy - 4), 8, 8); }
      if (G.state.weapon !== 'fists' && !p.dead) { ctx.fillStyle = '#2a2a2e'; ctx.fillRect(Math.round(p.x - cx + Math.cos(p.a) * 6), Math.round(p.y - cy + Math.sin(p.a) * 6), 2, 2); }
    }
    // bullets
    // your side shoots Nerf darts (orange with a blue tip); the cops shoot the real thing
    for (const b of this.bullets) {
      const bx = Math.round(b.x - cx), by = Math.round(b.y - cy);
      if (b.owner === 'player') { ctx.fillStyle = '#f08c28'; ctx.fillRect(bx, by, 2, 2); ctx.fillStyle = '#3c64dc'; ctx.fillRect(bx + Math.sign(b.vx), by + Math.sign(b.vy), 1, 1); }
      else { ctx.fillStyle = '#fff08c'; ctx.fillRect(bx, by, 2, 2); }
    }
    // particles
    for (const pt of this.particles) {
      if (!vis(pt.x, pt.y, 10)) continue;
      const a = pt.smoke ? Math.min(1, pt.life / pt.max) * 0.8 : 1;
      ctx.globalAlpha = a;
      const sz = pt.smoke ? Math.round(pt.size * (1.6 - pt.life / pt.max)) : pt.size;
      ctx.fillStyle = pt.col; ctx.fillRect(Math.round(pt.x - cx - sz / 2), Math.round(pt.y - cy - sz / 2), sz, sz);
    }
    ctx.globalAlpha = 1;
    // overhead props
    for (const pr of MAP.props) if (pr.type !== 'ramp' && vis(pr.x, pr.y, 80)) drawProp(ctx, pr, pr.x - cx, pr.y - cy, t);
    if (this.extraDraw) this.extraDraw(ctx, cx, cy);

    // night & weather
    drawAtmosphere(ctx, this, cx, cy);

    // heli
    if (this.heli) drawHeli(ctx, this.heli.x - cx, this.heli.y - cy, t, this.pos(), cx, cy);

    // bubbles
    for (const q of peds) if (q.bark && q.state !== 'dead') drawBubble(ctx, q.x - cx, q.y - cy - 10, q.bark);
    if (p.bark) drawBubble(ctx, p.x - cx, p.y - cy - 10, p.bark);
  },
};

// ================================================================= helpers
function nudge(v, dx, dy) {
  if (v.collides(v.x + dx, v.y + dy, v.a)) return false;
  v.x += dx; v.y += dy; return true;
}
function circles(v) {
  const r = v.spec.W / 2 + 0.5, off = v.spec.L / 2 - r;
  const c = Math.cos(v.a), s = Math.sin(v.a);
  if (off <= 1) return [[v.x, v.y, Math.max(r, v.spec.L / 2)]];
  return [[v.x + c * off, v.y + s * off, r], [v.x - c * off, v.y - s * off, r], [v.x, v.y, r]];
}

const HEAT = [0, 1, 3, 5, 8, 12];

// GPS: cost field flowing out of the target (roads are cheap, sidewalks/grass cost more)
const GPS_INF = 65535;
function gpsCost(t) {
  if (t === T.ROAD || t === T.BRIDGE) return 2;
  if (t === T.WATER || t === T.ROOF || t === T.WALL || t === T.TREE || t === T.FENCE || t === T.BARRIER || t === T.FOUNTAIN || t === T.CONTAINER) return 0;
  return t === T.GRASS || t === T.BUSH || t === T.FIELD ? 7 : 5;
}
export function gpsField(tx, ty) {
  const f = new Uint16Array(MW * MH).fill(GPS_INF);
  const buckets = [];
  const push = (i, d) => { (buckets[d] ||= []).push(i); };
  const start = ty * MW + tx;
  f[start] = 0; push(start, 0);
  const tiles = MAP.tiles;
  for (let d = 0; d < buckets.length; d++) {
    const b = buckets[d];
    if (!b) continue;
    for (let k = 0; k < b.length; k++) {
      const i = b[k];
      if (f[i] !== d) continue;
      const x = i % MW, y = (i / MW) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < MW - 1 ? i + 1 : -1, y > 0 ? i - MW : -1, y < MH - 1 ? i + MW : -1];
      for (const j of nb) {
        if (j < 0) continue;
        const c = gpsCost(tiles[j]);
        if (!c && j !== start) continue;
        const nd = d + (c || 1);
        if (nd < f[j]) { f[j] = nd; push(j, nd); }
      }
    }
    buckets[d] = null;
  }
  return f;
}
export function gpsTrace(f, px, py, max = 400) {
  let x = clamp(Math.floor(px / TS), 0, MW - 1), y = clamp(Math.floor(py / TS), 0, MH - 1);
  // standing on something solid (e.g. a door): step to the best neighbour first
  const route = [[px, py]];
  let len = 0;
  for (let k = 0; k < max; k++) {
    const cur = f[y * MW + x];
    if (cur === 0) break;
    let bx = -1, by = -1, bv = cur;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const v = f[ny * MW + nx];
      if (v < bv) { bv = v; bx = nx; by = ny; }
    }
    if (bx < 0) break;
    x = bx; y = by; len += TS;
    route.push([x * TS + 8, y * TS + 8]);
  }
  return { route, len: f[y * MW + x] === 0 || route.length > 1 ? len : null };
}
// the bulletproof vest soaks up most of the damage until it breaks
export function absorbArmor(dmg) {
  const s = G.state;
  if (!s || !(s.armor > 0)) return dmg;
  const soak = Math.min(s.armor, dmg * 0.75);
  s.armor = Math.max(0, s.armor - soak);
  if (s.armor <= 0) G.ui?.toast('¡Se rompió el chaleco!', '#5a9cff', 1.5);
  return dmg - soak;
}
function clearLine(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 12);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidCarPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) && tileAt(Math.floor((x0 + (x1 - x0) * t) / TS), Math.floor((y0 + (y1 - y0) * t) / TS)) !== T.WATER) return false; }
  return true;
}

// nearest dry, walkable spot to a point in the water (for people swimming out of a sunk car)
function shoreNear(x, y) {
  const tx0 = Math.floor(x / TS), ty0 = Math.floor(y / TS);
  for (let r = 1; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const px = (tx0 + dx) * TS + 8, py = (ty0 + dy) * TS + 8;
    if (!solidFootPx(px, py)) return { x: px, y: py };
  }
  return { x, y };
}

function isVisible(c, x, y, m) { return x > c.cam.x - m && y > c.cam.y - m && x < c.cam.x + W + m && y < c.cam.y + H + m; }
function reachable(c, n) { if (!c.field) return true; const i = Math.floor(n.y / TS) * MW + Math.floor(n.x / TS); return c.field[i] >= 0 || c.fieldT > 0; }

export function isNight() {
  const m = (G.state?.clock ?? 720) % 1440;
  return m < 6 * 60 || m > 20 * 60;
}
export function darkness() {
  const m = (G.state?.clock ?? 720) % 1440, h = m / 60;
  if (h >= 7 && h <= 18) return 0;
  if (h > 18 && h < 20.5) return (h - 18) / 2.5 * 0.62;
  if (h >= 20.5 || h < 5) return 0.62;
  return (7 - h) / 2 * 0.62;
}

function drawAtmosphere(ctx, c, cx, cy) {
  const dk = G.forceDark ?? darkness();
  const weather = G.state?.weather || 'sun';
  if (dk > 0.01) {
    ctx.fillStyle = `rgba(10,12,48,${dk})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // street lights at intersections
    for (const n of MAP.nodes) {
      const sx = n.x - cx, sy = n.y - cy;
      if (sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60 || n.dead) continue;
      for (const [ox, oy] of [[-34, -34], [34, 34]]) glow(ctx, sx + ox, sy + oy, 34, `rgba(255,210,120,${dk * 0.35})`);
    }
    for (const v of c.vehicles) {
      const sx = v.x - cx, sy = v.y - cy;
      if (sx < -80 || sy < -80 || sx > W + 80 || sy > H + 80 || v.wreck || v.sinking) continue;
      const lit = v.driver || v.ai === 'police' || v.ai === 'npcchase';
      if (lit && !v.engineOff && !v.dead) drawHeadlights(ctx, v, sx, sy, dk);
      // tail lights: brighter when braking
      if (lit || v.ai === 'script') {
        const c2 = Math.cos(v.a), s2 = Math.sin(v.a), hl = v.spec.L / 2, hw = v.spec.W / 2 - 2;
        const braking = v.handbrake || v.throttle < -0.1 || (v.ai === 'traffic' && (v.curSpeed || 0) < 8);
        for (const sd of [hw, -hw]) glow(ctx, sx - c2 * hl - s2 * sd, sy - s2 * hl + c2 * sd, braking ? 9 : 5, `rgba(255,30,30,${dk * (braking ? 0.75 : 0.4)})`);
      }
      if (v.sirenOn) {
        const red = Math.floor(G.time * 6) % 2;
        glow(ctx, sx, sy, 34, red ? `rgba(255,40,40,${dk * 0.65})` : `rgba(40,80,255,${dk * 0.65})`);
        glow(ctx, sx + rand(-2, 2), sy, 14, `rgba(255,255,255,${dk * 0.25})`);
      }
    }
    // neon signs
    for (const b of MAP.buildings) if (b.neon || b.sign) { const sx = b.x * TS + b.w * 8 - cx, sy = (b.y + b.h - 1) * TS - cy; if (sx > -60 && sy > -60 && sx < W + 60 && sy < H + 60) glow(ctx, sx, sy, b.neon ? 30 : 16, b.neon ? `rgba(255,60,200,${dk * 0.5})` : `rgba(255,220,120,${dk * 0.3})`); }
    const p = c.player;
    if (!p.car) glow(ctx, p.x - cx, p.y - cy, 22, `rgba(255,230,180,${dk * 0.18})`);
    ctx.globalCompositeOperation = 'source-over';
  }
  const rain = c.rainAmt || 0;
  if (rain > 0.02) {
    const t = G.time;
    // grey-blue wash
    ctx.fillStyle = `rgba(30,40,70,${0.22 * rain})`; ctx.fillRect(0, 0, W, H);
    // splashes on the ground: little rings that pop and fade
    ctx.strokeStyle = `rgba(200,220,255,${0.5 * rain})`; ctx.lineWidth = 1;
    for (let i = 0; i < Math.floor(26 * rain); i++) {
      const ph = (t * 1.7 + i * 0.37) % 1, k = Math.floor(t * 1.7 + i * 0.37);
      const x = Math.round((hash2(i * 13 + k, 7) * (W + 40)) - 20 - (cx % 40) * 0), y = Math.round(hash2(i * 29, k * 3) * H);
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.ellipse(x, y, 1 + ph * 4, 0.6 + ph * 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // two layers of slanted streaks: far ones thin and slow, near ones long and fast
    const wind = 0.28;
    for (const [n, len, sp, col] of [[70, 5, 300, `rgba(170,190,240,${0.35 * rain})`], [Math.floor(60 * rain), 9, 470, `rgba(210,225,255,${0.55 * rain})`]]) {
      ctx.strokeStyle = col; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const y = ((i * 53 + t * sp) % (H + 30)) - 15, x = ((i * 97 + 31 * (len > 6 ? 1 : 0) - y * wind + t * sp * wind * 0.2) % (W + 40) + W + 40) % (W + 40) - 20;
        ctx.moveTo(Math.round(x) + 0.5, Math.round(y)); ctx.lineTo(Math.round(x - len * wind) + 0.5, Math.round(y + len));
      }
      ctx.stroke();
    }
    if (weather === 'storm') {
      const f = (t * 0.37) % 7;
      const flash = f < 0.08 || (f > 0.16 && f < 0.2);
      if (flash) { ctx.fillStyle = 'rgba(230,235,255,0.5)'; ctx.fillRect(0, 0, W, H); }
      if (f < 0.02 && !c.thunderT) { c.thunderT = 1; setTimeout(() => audio.sfx('thunder'), 400); }
      if (f > 1) c.thunderT = 0;
    }
  }
}

// headlights: two soft cones of light in front of the car
function drawHeadlights(ctx, v, sx, sy, dk) {
  const c = Math.cos(v.a), s = Math.sin(v.a), hl = v.spec.L / 2, len = v.spec.style === 'moto' ? 34 : 46;
  for (const sd of v.spec.style === 'moto' ? [0] : [-v.spec.W / 2 + 2, v.spec.W / 2 - 2]) {
    const x0 = sx + c * hl - s * sd, y0 = sy + s * hl + c * sd;
    const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, len);
    g.addColorStop(0, `rgba(255,248,210,${dk * 0.55})`); g.addColorStop(1, 'rgba(255,248,210,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(v.a - 0.32) * len, y0 + Math.sin(v.a - 0.32) * len);
    ctx.lineTo(x0 + Math.cos(v.a + 0.32) * len, y0 + Math.sin(v.a + 0.32) * len);
    ctx.closePath(); ctx.fill();
    glow(ctx, x0, y0, 4, `rgba(255,255,230,${dk * 0.8})`);
  }
}

// building shadows, tire marks and rain puddles, drawn right on top of the street
function drawGround(ctx, c, cx, cy, t) {
  const tx0 = Math.floor(cx / TS) - 1, ty0 = Math.floor(cy / TS) - 1, tx1 = tx0 + Math.ceil(W / TS) + 2, ty1 = ty0 + Math.ceil(H / TS) + 2;
  const tall = (x, y) => { const q = tileAt(x, y); return q === T.ROOF || q === T.WALL || q === T.DOOR || q === T.CONTAINER; };
  ctx.fillStyle = 'rgba(0,0,20,0.22)';
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    if (tall(x, y) || tileAt(x, y) === T.WATER) continue;
    const px = x * TS - cx, py = y * TS - cy;
    if (tall(x - 1, y)) ctx.fillRect(px, py, 5, TS);
    if (tall(x, y - 1)) ctx.fillRect(px + (tall(x - 1, y) ? 5 : 0), py, TS - (tall(x - 1, y) ? 5 : 0), 4);
    else if (tall(x - 1, y - 1)) ctx.fillRect(px, py, 5, 4);
  }
  // things painted on the ground (the canal ramp)
  for (const pr of MAP.props) if (pr.type === 'ramp' && pr.x > cx - 60 && pr.x < cx + W + 10 && pr.y > cy - 70 && pr.y < cy + H + 10) drawProp(ctx, pr, pr.x - cx, pr.y - cy, t);
  // rain puddles on the road and sidewalks (always in the same spots)
  const rain = c.rainAmt || 0;
  if (rain > 0.05) for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
    const q = tileAt(x, y);
    if ((q !== T.ROAD && q !== T.SIDEWALK && q !== T.PARKING && q !== T.PLAZA) || hash2(x * 7, y * 13) > 0.07) continue;
    const px = x * TS - cx + 8, py = y * TS - cy + 8, w = 4 + hash2(x, y * 3) * 5;
    ctx.fillStyle = `rgba(40,60,110,${0.45 * rain})`; ctx.beginPath(); ctx.ellipse(px, py, w * rain + 1, (w * rain + 1) * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(200,220,255,${0.35 * rain})`; ctx.fillRect(Math.round(px - w * 0.4), Math.round(py - 1), Math.round(w * 0.5), 1);
  }
  // tire marks
  if (c.skids.length) {
    ctx.lineWidth = 1.5;
    for (const s of c.skids) {
      if (s.x < cx - 20 || s.x > cx + W + 20 || s.y < cy - 20 || s.y > cy + H + 20) continue;
      ctx.strokeStyle = `rgba(20,20,24,${Math.min(0.5, s.life / 14 * 0.5)})`;
      ctx.beginPath(); ctx.moveTo(s.x - cx, s.y - cy); ctx.lineTo(s.x2 - cx, s.y2 - cy); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}

// a solid dark copy of a sprite, cached, for drop shadows
const shadowCache = new WeakMap();
function shadowOf(s) {
  let sh = shadowCache.get(s);
  if (!sh) { sh = silhouette(s, '#000008'); shadowCache.set(s, sh); }
  return sh;
}
function glow(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawMarker(ctx, x, y, m, t) {
  const r = m.r;
  const pulse = 0.5 + Math.sin(t * 5) * 0.5;
  ctx.strokeStyle = m.color; ctx.globalAlpha = 0.5 + pulse * 0.4; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(Math.round(x) + 0.5, Math.round(y) + 0.5, r, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.18; ctx.fillStyle = m.color; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  if (m.letter) {
    const by = Math.round(y - 16 - Math.abs(Math.sin(t * 3)) * 4);
    ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(x) - 6, by - 1, 12, 11);
    ctx.fillStyle = m.color; ctx.fillRect(Math.round(x) - 5, by, 10, 9);
    font.text(ctx, m.letter, Math.round(x), by + 1, '#101018', { align: 'center' });
  } else {
    const by = Math.round(y - 12 - Math.abs(Math.sin(t * 3)) * 3);
    ctx.fillStyle = m.color; ctx.fillRect(Math.round(x) - 2, by, 5, 5); ctx.fillRect(Math.round(x) - 1, by + 5, 3, 2); ctx.fillRect(Math.round(x), by + 7, 1, 1);
  }
  if (m.label) font.text(ctx, m.label, Math.round(x), Math.round(y) + 9, m.color, { align: 'center', outline: '#000' });
}

function drawCollectible(ctx, x, y, kind, t) {
  x = Math.round(x); y = Math.round(y);
  if (kind === 'cassettes') {
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 5, y - 4, 10, 7);
    ctx.fillStyle = '#e0a82e'; ctx.fillRect(x - 4, y - 3, 8, 5);
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 3, y - 2, 2, 2); ctx.fillRect(x + 1, y - 2, 2, 2); ctx.fillRect(x - 2, y + 1, 4, 1);
  } else if (kind === 'stars') {
    const c = Math.floor(t * 6) % 2 ? '#ffd23f' : '#fff08c';
    font.text(ctx, '★', x, y - 4, c, { align: 'center', outline: '#5a3a00' });
  } else {
    ctx.fillStyle = '#5a3a00'; ctx.fillRect(x - 5, y - 2, 11, 5);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 4, y - 1, 9, 3); ctx.fillRect(x + 1, y - 3, 2, 2);
    ctx.fillStyle = '#fff08c'; ctx.fillRect(x - 3, y - 1, 4, 1);
  }
}

function drawPickup(ctx, x, y, pk, t) {
  x = Math.round(x); y = Math.round(y);
  const col = pk.color || '#46b450';
  ctx.fillStyle = '#101018'; ctx.fillRect(x - 5, y - 5, 10, 10);
  ctx.fillStyle = col; ctx.fillRect(x - 4, y - 4, 8, 8);
  if (pk.icon) font.text(ctx, pk.icon, x, y - 3, '#101018', { align: 'center' });
}

function drawWorldPickup(ctx, x, y, kind, t) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 4, y + 6, 9, 2);
  if (kind === 'health') {
    font.text(ctx, '♥', x, y - 4, Math.floor(t * 4) % 2 ? '#ff5a5a' : '#d8323c', { align: 'center', outline: '#3a0a0a' });
  } else if (kind === 'armor') {
    // little blue vest
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 5, y - 5, 11, 11);
    ctx.fillStyle = '#3c64dc'; ctx.fillRect(x - 4, y - 4, 9, 9);
    ctx.fillStyle = '#5a9cff'; ctx.fillRect(x - 4, y - 4, 3, 9); ctx.fillRect(x + 2, y - 4, 3, 9);
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 4, 3, 3);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x - 3, y + 1, 7, 1);
  } else {
    // bribe: a teal star, clearly not the yellow collectible ones
    font.text(ctx, '★', x, y - 4, Math.floor(t * 5) % 2 ? '#46d4c8' : '#8af0e0', { align: 'center', outline: '#0a2a2a' });
    font.text(ctx, '$', x + 5, y - 9, '#46d470', { align: 'center', outline: '#101018' });
  }
}

function drawTag(ctx, x, y, i) {
  const cols = ['#ffd23f', '#ff3cc8', '#5adcf0', '#46b450'];
  ctx.fillStyle = cols[i % 4];
  font.text(ctx, 'KZ', x + 8, y + 1, cols[i % 4], { align: 'center', outline: '#101018' });
}

function drawBubble(ctx, x, y, text) {
  const lines = font.wrap(text, 110);
  const w = Math.max(...lines.map((l) => font.measure(l))) + 6, h = lines.length * 9 + 4;
  let bx = Math.round(x - w / 2), by = Math.round(y - h - 4);
  bx = clamp(bx, 2, W - w - 2); by = clamp(by, 2, H - h - 2);
  ctx.fillStyle = '#101018'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  ctx.fillStyle = '#f4f4f0'; ctx.fillRect(bx, by, w, h);
  lines.forEach((l, i) => font.text(ctx, l, bx + 3, by + 3 + i * 9, '#101018'));
}

function drawProp(ctx, pr, x, y, t) {
  x = Math.round(x); y = Math.round(y);
  if (pr.type === 'ramp') {
    // a wooden stunt ramp: planks getting lighter toward the lip, chevrons pointing at the canal
    for (let i = 0; i < 48; i += 3) { const k = i / 48; ctx.fillStyle = `rgb(${Math.round(110 + k * 70)},${Math.round(76 + k * 50)},${Math.round(40 + k * 30)})`; ctx.fillRect(x + i, y + 2, 3, 60); }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + 2, 48, 1); ctx.fillRect(x, y + 61, 48, 1);
    ctx.fillStyle = '#3a2a18'; for (let yy = 8; yy < 60; yy += 10) ctx.fillRect(x, y + yy, 48, 1);
    const on = Math.floor(t * 3) % 2;
    ctx.fillStyle = on ? '#ffd23f' : '#d8a020';
    for (const cy of [16, 32, 48]) for (let k = 0; k < 3; k++) { const bx = x + 12 + k * 10; ctx.fillRect(bx, y + cy - 3, 2, 2); ctx.fillRect(bx + 2, y + cy - 1, 2, 2); ctx.fillRect(bx, y + cy + 1, 2, 2); }
    ctx.fillStyle = '#d8323c'; ctx.fillRect(x + 46, y + 2, 2, 60);
    return;
  }
  if (pr.type === 'palm') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 2, y + 2, 12, 4);
    ctx.fillStyle = '#6e5234'; ctx.fillRect(x - 1, y - 1, 3, 3);
    ctx.fillStyle = '#2c6a30';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.sin(t * 0.8 + x) * 0.08; for (let k = 2; k < 9; k++) ctx.fillRect(Math.round(x + Math.cos(a) * k), Math.round(y + Math.sin(a) * k - 3), 2, 2); }
    ctx.fillStyle = '#3c8a40'; ctx.fillRect(x - 1, y - 4, 3, 3);
    return;
  }
  if (pr.type === 'granada') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 4, y + 4, 22, 22);
    ctx.fillStyle = '#c8b49a'; ctx.fillRect(x, y, 22, 22);
    ctx.fillStyle = '#c8603c'; ctx.fillRect(x + 2, y + 2, 18, 18); ctx.fillStyle = '#a8482c'; ctx.fillRect(x + 10, y + 2, 2, 18); ctx.fillRect(x + 2, y + 10, 18, 2);
    ctx.fillStyle = '#c8603c'; ctx.fillRect(x - 18, y + 6, 18, 12); ctx.fillStyle = '#a8482c'; for (let i = 0; i < 18; i += 3) ctx.fillRect(x - 18 + i, y + 6, 1, 12);
    font.text(ctx, 'RES. GRANADA', x + 11, y + 26, '#f4f4f0', { align: 'center', outline: '#101018' });
    return;
  }
  if (pr.type === 'banner') {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#7a2a3a'; ctx.fillRect(x + 2, y - 4 + Math.round(Math.sin(t * 2 + x)), 5, 3);
    return;
  }
  if (pr.type === 'bigtree') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 8, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 3, y - 4, 6, 14);
    const cs = [['#1e5a28', 24, 0, -14], ['#28702e', 18, -8, -18], ['#28702e', 16, 9, -20], ['#3a8a3a', 12, 0, -24], ['#4a9a44', 6, -6, -26]];
    for (const [c, r, ox, oy] of cs) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + ox, y + oy, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (pr.type === 'billboard') {
    const ad = ADS[(pr.ad || 0) % ADS.length];
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 34, y + 8, 3, 16); ctx.fillRect(x + 31, y + 8, 3, 16);
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 56, y - 22, 112, 32);
    const g = ctx.createLinearGradient(0, y - 21, 0, y + 9); g.addColorStop(0, ad.bg[0]); g.addColorStop(1, ad.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(x - 55, y - 21, 110, 30);
    ctx.fillStyle = ad.c[0]; ctx.fillRect(x - 55, y - 21, 110, 1);
    // dark lettering goes without the outline so it stays readable
    const ol = (c) => (parseInt(c.slice(1, 3), 16) < 80 ? {} : { outline: '#101018' });
    font.text(ctx, ad.t[0], x, y - 18, ad.c[0], { align: 'center', ...ol(ad.c[0]) });
    font.text(ctx, ad.t[1], x, y - 9, ad.c[1], { align: 'center', ...ol(ad.c[1]) });
    font.text(ctx, ad.t[2], x, y, ad.c[2] || ad.c[1], { align: 'center', ...ol(ad.c[2] || ad.c[1]) });
  } else if (pr.type === 'tower') {
    ctx.fillStyle = '#5a5a64'; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 7, y - 8, 14, 3);
    if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#fff08c'; ctx.fillRect(x - 1, y - 1, 2, 2); }
  } else if (pr.type === 'gate') {
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y + 2, 64, 12);
    ctx.fillStyle = '#6a6a74'; for (let i = 2; i < 64; i += 4) ctx.fillRect(x + i, y + 2, 2, 12);
    font.text(ctx, 'CERESO PV', x + 32, y - 8, '#f4f4f0', { align: 'center', outline: '#101018' });
  }
}

// what the billboards around Puerto Vicio advertise
const ADS = [
  { t: ['CERVEZA LA SIRENA', 'BIEN FRÍA', 'COMO TU EX'], bg: ['#1e6e9e', '#0a2a4a'], c: ['#fff08c', '#f4f4f0'] },
  { t: ['LIC. TREVIÑO', '¿TE AGARRARON?', 'TEL. 555-0199'], bg: ['#8c1c28', '#2a0a10'], c: ['#ffd23f', '#f4f4f0'] },
  { t: ['BANCO FEDERAL', 'SU DINERO,', 'SIEMPRE SEGURO'], bg: ['#1e2c50', '#0a0e1e'], c: ['#c8a040', '#f4f4f0'] },
  { t: ['POLLOS EL ALEGRE', 'EL POLLO MÁS', 'FELIZ DE PV'], bg: ['#f08c28', '#8c3a10'], c: ['#fff08c', '#f4f4f0'] },
  { t: ['MARKETPLACE PV', 'TODO TIENE', '5 ESTRELLAS'], bg: ['#3c64dc', '#141e4a'], c: ['#ffd23f', '#f4f4f0'] },
  { t: ['FUNERARIA DESCANSO', 'PAQUETES 2X1', 'TRAIGA A UN AMIGO'], bg: ['#3a2a4a', '#0e0a14'], c: ['#c8c8d8', '#a8a8b8'] },
  { t: ['CINE VICIO', 'ESTRENO:', 'AMOR EN EL PENAL'], bg: ['#d8323c', '#4a0a14'], c: ['#ffd23f', '#f4f4f0'] },
  { t: ['CLÍNICA PV', 'TE COSEMOS', 'SIN PREGUNTAS'], bg: ['#28b4a0', '#0a3a34'], c: ['#f4f4f0', '#101018'] },
  { t: ['PINTA Y OLVIDA', 'CARRO NUEVO,', 'VIDA NUEVA'], bg: ['#ffd23f', '#a0700a'], c: ['#101018', '#2a1a00'] },
];

export function countdownText() {
  if (!CONFIG.marathonDate) return 'PRÓXIMAMENTE';
  const ms = new Date(CONFIG.marathonDate).getTime() - Date.now();
  if (ms <= 0 && ms > -12 * 3600 * 1000) return '¡EN VIVO AHORA!';
  if (ms <= 0) return '¡GRACIAS!';
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return d > 0 ? `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function drawHeli(ctx, x, y, t, pos, cx, cy) {
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, pos.x - cx, pos.y - cy, 30, 'rgba(255,255,220,0.35)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(x - 8 + 20), Math.round(y + 30), 18, 8);
  ctx.fillStyle = '#1e2c78'; ctx.fillRect(Math.round(x - 9), Math.round(y - 5), 18, 10);
  ctx.fillStyle = '#f4f4f0'; ctx.fillRect(Math.round(x - 9), Math.round(y - 1), 18, 2);
  ctx.fillStyle = '#1e2c78'; ctx.fillRect(Math.round(x + 9), Math.round(y - 1), 12, 3);
  ctx.fillStyle = '#6a8cac'; ctx.fillRect(Math.round(x - 8), Math.round(y - 4), 5, 8);
  const a = t * 30;
  ctx.strokeStyle = 'rgba(220,220,230,0.7)'; ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); ctx.lineTo(x - Math.cos(a) * 16, y - Math.sin(a) * 16);
  ctx.moveTo(x + Math.cos(a + 1.57) * 16, y + Math.sin(a + 1.57) * 16); ctx.lineTo(x - Math.cos(a + 1.57) * 16, y - Math.sin(a + 1.57) * 16);
  ctx.stroke();
}
