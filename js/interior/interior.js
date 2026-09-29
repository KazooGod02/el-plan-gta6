// Side-view interior scene (2D de lado).
import { G, W, H, emit } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { shade } from '../core/gfx.js';
import { clamp, rand, pick, chance, lerp } from '../core/util.js';
import { side } from '../data/sprites.js';
import { LOOKS, civilianLook } from '../data/cast.js';
import { ROOMS, FLOOR, CEIL } from './rooms.js';
import { drawProp, PROP_W, sideCar } from './props.js';
import { darkness, absorbArmor } from '../world/city.js';
import { shoeSpeed } from '../story/shops.js';

export const interior = {
  name: 'interior',
  room: null, roomId: null,
  p: null,
  npcs: [], enemies: [], bullets: [], fx: [], actions: [], props: [],
  cam: { x: 0, shake: 0 },
  stealth: false, combat: false, frozen: false,
  onUpdate: null, overlay: null, onDetected: null,
  dark: 0,

  enter(opts = {}) {
    const room = ROOMS[opts.room];
    if (!room) throw new Error('Room ' + opts.room);
    this.roomId = opts.room; this.room = room;
    this.props = room.props.map((p) => ({ ...p }));
    this.npcs = []; this.enemies = []; this.bullets = []; this.fx = []; this.actions = [];
    this.stealth = false; this.combat = !!opts.combat; this.frozen = false;
    this.onUpdate = null; this.overlay = null; this.onDetected = null; this.camTarget = null; this.extraDraw = null; this.onExit = opts.onExit || null;
    this.p = {
      x: opts.x ?? 40, y: FLOOR, facing: opts.facing ?? 1, state: 'idle', anim: 0, hp: this.p?.hp ?? 100, maxHp: 100,
      crouch: false, covered: false, hidden: null, shootT: 0, punchT: 0, hurtT: 0, look: opts.look || 'kazoo', dead: false, visible: true,
    };
    if (G.cityHp !== undefined) this.p.hp = G.cityHp;
    this.dark = room.dark ? 0.72 : 0;
    this.snapCam();
    emit('roomEnter', this.roomId);
  },
  exit() { emit('roomExit', this.roomId); },

  // ------------------------------------------------ API
  prop(id) { return this.props.find((p) => p.id === id); },
  addNpc(o) {
    const n = { x: 100, y: FLOOR, facing: -1, anim: 0, pose: 'idle', look: 'kazoo', talkR: 22, ...o };
    if (typeof n.look === 'number') n.look = civilianLook(n.look);
    this.npcs.push(n); return n;
  },
  npc(id) { return this.npcs.find((n) => n.id === id); },
  removeNpc(n) { const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1); },
  addEnemy(o) {
    const e = { x: 200, y: FLOOR, facing: -1, anim: 0, hp: 40, maxHp: 40, kind: 'guard', look: 'guard', state: 'patrol', susp: 0, shootT: rand(0.6, 1.2), speed: 30, vision: 110, armed: true, dmg: 9, pause: 0, ...o };
    if (!e.patrol) e.patrol = [e.x - 40, e.x + 40];
    e.maxHp = e.hp;
    this.enemies.push(e); return e;
  },
  addAction(o) { const a = { r: 18, ...o }; this.actions.push(a); return a; },
  removeAction(a) { const i = this.actions.indexOf(a); if (i >= 0) this.actions.splice(i, 1); },
  walkTo(n, x, speed = 40) { return new Promise((res) => { n.goal = { x, speed, res }; }); },
  shake(n) { if (G.settings?.shake !== false) this.cam.shake = Math.max(this.cam.shake, n); },

  // ------------------------------------------------ update
  update(dt) {
    const p = this.p;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.shootT > 0) p.shootT -= dt;
    if (p.punchT > 0) p.punchT -= dt;
    const ctl = !G.lockInput && !this.frozen && !p.dead && !G.paused;
    if (ctl) this.controls(dt); else if (!p.scripted) { p.moving = false; if (p.state === 'walk' || p.state === 'run') p.state = 'idle'; }
    if (p.goal) this.stepGoal(p, dt);

    for (const n of this.npcs) this.updateNpc(n, dt);
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateBullets(dt);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt; f.life -= dt; }
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.onUpdate) this.onUpdate(dt);
    this.updateCam(dt);
  },

  controls(dt) {
    const p = this.p;
    if (p.hidden) {
      p.state = 'hidden';
      if (input.pressed('a') || input.pressed('up') || input.pressed('left') || input.pressed('right')) { p.hidden.hiding = false; p.hidden = null; p.state = 'idle'; audio.sfx('door', { vol: 0.4 }); }
      return;
    }
    const ax = input.ax;
    p.crouch = input.down('down') && !input.down('up') && Math.abs(input.ax) < 0.5;
    p.covered = p.crouch && this.coverAt(p.x);
    const run = input.down('run');
    if (!p.crouch && Math.abs(ax) > 0.2 && p.punchT <= 0.15) {
      const sp = (run ? 96 * shoeSpeed() : 58) * Math.sign(ax) * Math.min(1, Math.abs(ax) * 1.3);
      p.x = clamp(p.x + sp * dt, 8, this.room.w - 8);
      p.facing = Math.sign(ax);
      p.moving = true; p.anim += dt * (run ? 1.6 : 1);
      p.state = run ? 'run' : 'walk';
      p.stepT = (p.stepT || 0) - dt * (run ? 1.6 : 1);
      if (p.stepT <= 0) { p.stepT = 0.3; audio.sfx('step', { vol: 0.35 }); }
    } else { p.moving = false; p.state = p.crouch ? 'crouch' : 'idle'; }

    const dlg = !!G.ui?.dialog;
    if (!dlg && (input.pressed('a') || (input.pressed('up') && !p.crouch))) this.interact(input.pressed('up'));
    if (input.pressed('weapon') && this.combat) { const c = G.scenes.city; c.cycleWeapon(); }
    const w = G.state.weapon;
    if (!dlg && this.combat && (w === 'fists' ? input.pressed('b') : input.down('b'))) this.attack();
    if (!dlg && this.onShout && input.pressed('b')) this.onShout();
  },

  nearest(list, r, filter) {
    let best = null, bd = r;
    for (const o of list) { if (filter && !filter(o)) continue; const d = Math.abs(o.x + (o.w || 0) / 2 - this.p.x); if (d < bd) { bd = d; best = o; } }
    return best;
  },

  interactTarget() {
    const p = this.p;
    const n = this.nearest(this.npcs.filter((n) => n.onTalk && !n.hidden), 26);
    if (n) return { kind: 'npc', o: n, label: n.prompt || 'Hablar', x: n.x };
    const a = this.nearest(this.actions.filter((a) => !a.disabled), 40, (a) => Math.abs(a.x - p.x) < a.r);
    if (a) return { kind: 'action', o: a, label: a.label, x: a.x };
    const hide = this.props.find((q) => q.hide && Math.abs(q.x + (PROP_W[q.t] || 14) / 2 - p.x) < 12);
    if (hide) return { kind: 'hide', o: hide, label: 'Esconderse', x: hide.x + 7 };
    for (const e of this.room.exits) if (p.x > e.x - 6 && p.x < e.x + e.w + 6 && !this.noExit) return { kind: 'exit', o: e, label: 'Salir', x: e.x + e.w / 2 };
    return null;
  },

  interact(viaUp) {
    const t = this.interactTarget();
    if (!t) return;
    if (viaUp && t.kind === 'npc') return;
    if (t.kind === 'npc') { t.o.onTalk(t.o); }
    else if (t.kind === 'action') { t.o.fn(t.o); }
    else if (t.kind === 'hide') { this.p.hidden = t.o; t.o.hiding = true; this.p.x = t.o.x + 7; audio.sfx('door', { vol: 0.4 }); }
    else if (t.kind === 'exit') { audio.sfx('door'); if (this.onExit && this.onExit(t.o) === false) return; emit('roomExitDoor', t.o, this.roomId); }
  },

  coverAt(x) {
    for (const q of this.props) if (q.cover) { const w = q.w || PROP_W[q.t] || 20; if (x > q.x - 4 && x < q.x + w + 4) return q; }
    return null;
  },

  attack() {
    const p = this.p, s = G.state;
    if (s.weapon === 'fists') {
      if (p.punchT > 0) return;
      p.punchT = 0.3; p.state = 'punch';
      audio.sfx('punch', { vol: 0.6 });
      for (const e of this.enemies) {
        if (e.state === 'down') continue;
        if (Math.abs(e.x - (p.x + p.facing * 12)) < 12) { this.hurtEnemy(e, 14, p.facing); }
      }
      return;
    }
    if (p.shootT > 0) return;
    const ammo = s.weapons[s.weapon] || 0;
    if (ammo <= 0 && !G.cheatAmmo) { p.shootT = 0.4; audio.sfx('jam'); G.ui?.toast('SIN BALAS', '#d8323c', 1); return; }
    if (!G.cheatAmmo && !this.infiniteAmmo) s.weapons[s.weapon] = ammo - 1;
    const sg = s.weapon === 'shotgun';
    p.shootT = sg ? 0.75 : 0.3; p.state = 'shoot'; p.shootFlash = 0.08;
    const y = p.y - (p.crouch ? 10 : 15);
    for (let i = 0; i < (sg ? 3 : 1); i++) this.bullets.push({ x: p.x + p.facing * 12, y: y + (sg ? i * 2 - 2 : 0), vx: p.facing * 400, owner: 'player', dmg: sg ? 18 : 25, life: 1 });
    audio.sfx(sg ? 'shotgun' : 'shot');
    emit('shot');
  },

  hurtEnemy(e, dmg, dir) {
    if (e.state === 'down') return;
    e.hp -= dmg; e.flash = 0.15; e.x += dir * 3; e.hitT = 2.5;
    for (let i = 0; i < 5; i++) this.fx.push({ x: e.x, y: e.y - 14, vx: dir * rand(20, 60), vy: rand(-50, -10), life: 0.25, col: i % 2 ? '#fff08c' : '#f4f4f0', g: 120 });
    audio.sfx('hit');
    if (e.state === 'patrol' || e.state === 'pause') { e.state = 'attack'; e.facing = -dir; }
    if (e.hp <= 0) { e.state = 'down'; e.downT = 0; if (e.onDown) e.onDown(e); emit('enemyDown', e); }
  },

  hurtPlayer(dmg) {
    const p = this.p;
    if (p.dead || p.invuln || G.cheatGod) return;
    dmg = absorbArmor(dmg);
    p.hp -= dmg; p.hurtT = 0.35; audio.sfx('hurt'); this.shake(2);
    if (p.hp <= 0) { p.hp = 0; p.dead = true; p.state = 'down'; emit('wasted'); }
  },

  stepGoal(n, dt) {
    const g = n.goal;
    const d = g.x - n.x;
    if (Math.abs(d) < 1.5) { n.x = g.x; n.goal = null; n.moving = false; if (n === this.p) { n.scripted = false; n.state = 'idle'; } if (g.res) g.res(); return; }
    n.facing = Math.sign(d); n.moving = true; n.anim += dt;
    n.x += Math.sign(d) * Math.min(Math.abs(d), g.speed * dt);
    if (n === this.p) { n.scripted = true; n.state = g.speed > 70 ? 'run' : 'walk'; }
  },

  updateNpc(n, dt) {
    n.anim += dt;
    if (n.flash > 0) n.flash -= dt;
    if (n.barkT > 0) { n.barkT -= dt; if (n.barkT <= 0) n.bark = null; }
    if (n.goal) { this.stepGoal(n, dt); return; }
    n.moving = false;
    if (n.follow) {
      const tx = this.p.x - this.p.facing * (n.followDist || 22);
      const d = tx - n.x;
      if (Math.abs(d) > 6) { n.facing = Math.sign(d); n.moving = true; n.x += Math.sign(d) * Math.min(Math.abs(d), (Math.abs(d) > 40 ? 95 : 55) * dt); }
      else n.facing = Math.sign(this.p.x - n.x) || n.facing;
    }
    if (n.shooter && this.combat) {
      n.shootT = (n.shootT ?? 1.2) - dt;
      const target = this.enemies.find((e) => e.state !== 'down' && Math.abs(e.x - n.x) < 220);
      if (target && n.shootT <= 0) {
        n.shootT = rand(1.1, 1.8); n.facing = Math.sign(target.x - n.x); n.pose = 'shoot'; n.poseT = 0.15;
        this.bullets.push({ x: n.x + n.facing * 12, y: n.y - 15, vx: n.facing * 380, owner: 'ally', dmg: 14, life: 1 });
        audio.sfx('shot', { vol: 0.6 });
      }
      if (n.poseT > 0) { n.poseT -= dt; if (n.poseT <= 0) n.pose = n.basePose || 'aim'; }
    }
  },

  canSee(e) {
    const p = this.p;
    if (p.hidden || !p.visible) return false;
    const dx = p.x - e.x;
    if (Math.sign(dx) !== e.facing && Math.abs(dx) > 10) return false;
    const ad = Math.abs(dx);
    if (ad > e.vision) return false;
    if (p.crouch && p.covered && ad > 22) {
      // cover must be between
      const c = p.covered; const cx = c.x + (PROP_W[c.t] || 20) / 2;
      if ((cx - e.x) * (p.x - cx) > -200 || true) return false;
    }
    if (this.dark > 0.3 && !e.flashlight && ad > 36) return false;
    if (this.dark > 0.3 && e.flashlight && ad > e.vision * 0.85) return false;
    return true;
  },

  updateEnemy(e, dt) {
    e.anim += dt;
    if (e.hitT > 0) e.hitT -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.barkT > 0) { e.barkT -= dt; if (e.barkT <= 0) e.bark = null; }
    if (e.state === 'down') { e.downT += dt; return; }
    if (e.frozen) return;
    const p = this.p;
    if (e.kind === 'camera') {
      if (e.disabled) return;
      e.sweepT = (e.sweepT ?? (e.sweep || 2.5)) - dt;
      if (e.sweepT <= 0) { e.facing = -e.facing; e.sweepT = e.sweep || 2.5; }
      const seenC = !p.dead && this.canSee(e);
      if (seenC) e.susp += dt * 1.6; else e.susp = Math.max(0, e.susp - dt * 0.5);
      if (e.susp >= 1) { e.susp = 1; e.bark = '!'; e.barkT = 1; if (this.onDetected) this.onDetected(e); e.susp = 0; }
      return;
    }
    const seen = !p.dead && this.canSee(e);
    if (e.state === 'patrol' || e.state === 'pause' || e.state === 'search' || e.state === 'investigate') {
      if (seen) {
        const close = 1 - Math.abs(p.x - e.x) / e.vision;
        e.susp += dt * (0.9 + close * 2.6) * (e.alertRate || 1);
        if (!e.bark && e.susp > 0.35) { e.bark = '?'; e.barkT = 1; }
      } else e.susp = Math.max(0, e.susp - dt * 0.35);
      if (e.susp >= 1) {
        e.susp = 1; e.bark = '!'; e.barkT = 1.2;
        audio.sfx('alarm', { vol: 0.3 });
        if (this.stealth && this.onDetected) { this.onDetected(e); return; }
        e.state = 'attack';
      }
    }
    if (e.state === 'patrol') {
      const [a, b] = e.patrol;
      const tx = e.facing > 0 ? b : a;
      if (Math.abs(tx - e.x) < 2) { e.state = 'pause'; e.pause = e.pauseT || rand(1.2, 2.5); e.moving = false; }
      else { e.x += Math.sign(tx - e.x) * e.speed * dt; e.moving = true; e.facing = Math.sign(tx - e.x) || e.facing; }
    } else if (e.state === 'investigate') {
      const tx = e.inv.x;
      if (Math.abs(tx - e.x) > 3) { e.facing = Math.sign(tx - e.x); e.x += e.facing * e.speed * 1.4 * dt; e.moving = true; }
      else { e.moving = false; e.inv.t -= dt; e.facing = Math.floor(e.inv.t * 0.8) % 2 ? 1 : -1; if (e.inv.t <= 0) { e.state = 'patrol'; e.bark = '...'; e.barkT = 1; } }
    } else if (e.state === 'pause') {
      e.pause -= dt; e.moving = false;
      if (e.lookAround && Math.floor(e.pause * 1.2) % 2 === 0) e.facing = e.facing;
      if (e.pause <= 0) { e.facing = -e.facing; e.state = 'patrol'; }
    } else if (e.state === 'attack') {
      if (p.dead) { e.moving = false; return; }
      const dx = p.x - e.x; e.facing = Math.sign(dx) || e.facing;
      const ad = Math.abs(dx);
      if (e.armed) {
        const want = e.range || 90;
        if (ad > want + 20) { e.x += Math.sign(dx) * e.speed * 1.8 * dt; e.moving = true; }
        else if (ad < want - 40 && !e.holdGround) { e.x -= Math.sign(dx) * e.speed * dt; e.moving = true; }
        else e.moving = false;
        e.shootT -= dt;
        if (e.shootT <= 0 && ad < 260) {
          e.shootT = e.fireRate ? rand(e.fireRate * 0.8, e.fireRate * 1.2) : rand(0.9, 1.5);
          e.shooting = 0.12;
          this.bullets.push({ x: e.x + e.facing * 12, y: e.y - 15, vx: e.facing * 300, owner: 'enemy', dmg: e.dmg, life: 1.2 });
          audio.sfx('shot', { vol: 0.55 });
        }
        if (e.shooting > 0) e.shooting -= dt;
      } else {
        if (ad > 12) { e.x += Math.sign(dx) * e.speed * 2 * dt; e.moving = true; }
        else {
          e.moving = false; e.shootT -= dt;
          if (e.shootT <= 0) { e.shootT = 0.9; e.punching = 0.2; if (!p.hidden) { this.hurtPlayer(e.dmg); p.x += Math.sign(dx) * 6; } audio.sfx('punch'); }
        }
        if (e.punching > 0) e.punching -= dt;
      }
      e.x = clamp(e.x, 8, this.room.w - 8);
    }
  },

  updateBullets(dt) {
    const p = this.p;
    for (const b of this.bullets) {
      const steps = 3;
      for (let s = 0; s < steps && b.life > 0; s++) {
        const px = b.x;
        b.x += b.vx * dt / steps;
        // cover blocks enemy bullets when player crouches behind it
        if (b.owner === 'enemy' && p.crouch && p.covered) {
          const c = p.covered, cx0 = c.x - 4, cx1 = c.x + (c.w || PROP_W[c.t] || 20) + 4;
          if ((px - cx0) * (b.x - cx0) <= 0 || (px - cx1) * (b.x - cx1) <= 0 || (b.x > cx0 && b.x < cx1)) {
            if (Math.sign(b.vx) === Math.sign(p.x - b.x)) { b.life = 0; this.spark(b.x, b.y); break; }
          }
        }
        if (b.owner === 'enemy') {
          const top = p.y - (p.crouch ? 14 : 22);
          if (!p.hidden && !p.dead && Math.abs(b.x - p.x) < 5 && b.y > top && b.y < p.y) { b.life = 0; this.hurtPlayer(b.dmg * (p.crouch ? 0.6 : 1)); break; }
        } else {
          for (const e of this.enemies) {
            if (e.state === 'down') continue;
            const top = e.y - (e.crouch ? 14 : 22);
            if (Math.abs(b.x - e.x) < 5 && b.y > top && b.y < e.y) {
              if (e.coverProp && e.crouch && chance(0.7)) { b.life = 0; this.spark(b.x, b.y); break; }
              b.life = 0; this.hurtEnemy(e, b.dmg, Math.sign(b.vx)); break;
            }
          }
          if (b.life <= 0) break;
        }
        if (b.x < 0 || b.x > this.room.w) b.life = 0;
      }
      b.life -= dt;
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  },
  spark(x, y) { for (let i = 0; i < 4; i++) this.fx.push({ x, y, vx: rand(-40, 40), vy: rand(-40, 10), life: 0.2, col: '#fff08c', g: 100 }); },

  // ------------------------------------------------ camera
  snapCam() { this.cam.x = this.camGoal(); },
  camGoal() {
    const rw = this.room.w;
    if (rw <= W) return -(W - rw) / 2;
    const tx = this.camTarget ? this.camTarget.x : this.p.x + this.p.facing * 30;
    return clamp(tx - W / 2, 0, rw - W);
  },
  updateCam(dt) {
    this.cam.x = lerp(this.cam.x, this.camGoal(), Math.min(1, dt * 4));
    if (this.cam.shake > 0) this.cam.shake = Math.max(0, this.cam.shake - dt * 15);
  },

  // ------------------------------------------------ render
  env() {
    const clock = (G.state?.clock ?? 720) % 1440;
    const dk = G.forceDark ?? darkness();
    const night = this.room.night || dk > 0.4;
    const sky = night ? '#141438' : clock > 17 * 60 ? '#f0a060' : '#6ab8f0';
    return { night, sky, dk };
  },

  render(ctx) {
    const room = this.room, th = room.theme, t = G.time;
    const cx = Math.round(this.cam.x + (this.cam.shake ? rand(-this.cam.shake, this.cam.shake) : 0));
    const env = this.env();
    ctx.fillStyle = '#0b0b14'; ctx.fillRect(0, 0, W, H);
    if (room.outdoor) drawSky(ctx, th.sky === 'dusk' ? 'dusk' : env.night || th.sky === 'night' ? 'night' : 'day', t);
    else drawWalls(ctx, room, cx, t, env);
    // floor
    drawFloor(ctx, room, cx, t);

    const X = (x) => Math.round(x - cx);
    // back props
    for (const q of this.props) if (!q.front && !q.hidden) drawProp(ctx, q, X(q.x), q.y ?? FLOOR, t, env);
    if (this.extraBack) this.extraBack(ctx, cx);
    // characters
    for (const n of this.npcs) if (!n.hidden) this.drawChar(ctx, n.look, n, X(n.x), n.y ?? FLOOR, n.pose, n.flash);
    for (const e of this.enemies) {
      if (e.kind === 'camera') {
        if (e.disabled) continue;
        const cx0 = X(e.x), cy0 = 74, len = e.vision;
        ctx.fillStyle = e.susp > 0.3 ? 'rgba(255,60,60,0.28)' : 'rgba(255,80,80,0.14)';
        ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + e.facing * len, FLOOR); ctx.lineTo(cx0 + e.facing * 12, FLOOR); ctx.closePath(); ctx.fill();
        continue;
      }
      if (e.invisible) continue;
      this.drawChar(ctx, e.look, e, X(e.x), e.y, e.state === 'down' ? 'down' : e.shooting > 0 ? 'shoot' : e.punching > 0 ? 'punch' : e.state === 'attack' && e.armed ? 'aim' : e.pose || null, e.flash);
    }
    const p = this.p;
    if (!p.hidden && p.visible) {
      let pose = p.dead ? 'down' : p.state === 'crouch' ? 'crouch' : p.state === 'shoot' || (p.shootT > 0.12 && G.state.weapon !== 'fists') ? 'shoot' : p.state === 'punch' || p.punchT > 0.1 ? 'punch' : p.pose || null;
      if (!pose && this.combat && G.state.weapon !== 'fists' && !p.moving) pose = 'aim';
      this.drawChar(ctx, p.look, p, X(p.x), p.y, pose, p.hurtT > 0 && Math.floor(t * 20) % 2 ? 0.1 : 0);
    }
    // front props
    for (const q of this.props) if (q.front && !q.hidden) drawProp(ctx, q, X(q.x), q.y ?? FLOOR, t, env);
    if (this.extraDraw) this.extraDraw(ctx, cx);
    // bullets
    ctx.fillStyle = '#fff08c';
    for (const b of this.bullets) ctx.fillRect(X(b.x) - 1, Math.round(b.y), 3, 1);
    for (const f of this.fx) { ctx.fillStyle = f.col; ctx.fillRect(X(f.x), Math.round(f.y), f.s || 1, f.s || 1); }

    // darkness
    const dim = Math.max(this.dark, th.dim || 0, room.outdoor && env.night ? 0.35 : 0);
    if (dim > 0) this.drawDark(ctx, cx, dim, t);

    // alert indicators & bubbles
    for (const e of this.enemies) {
      if (e.state === 'down') continue;
      if (e.hitT > 0 && e.kind !== 'camera') {
        const x = X(e.x) - 8, y = e.y - 30, f = clamp(e.hp / e.maxHp, 0, 1);
        ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, 18, 5);
        ctx.fillStyle = '#2a1a1a'; ctx.fillRect(x, y, 16, 3);
        ctx.fillStyle = '#d8323c'; ctx.fillRect(x, y, Math.round(16 * f), 3);
      }
      if (e.susp > 0.05 && e.state !== 'attack') {
        const w = 12, x = X(e.x) - 6, y = e.y - 32;
        ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, w + 2, 4);
        ctx.fillStyle = e.susp > 0.7 ? '#d8323c' : '#ffd23f'; ctx.fillRect(x, y, Math.round(w * e.susp), 2);
      }
      if (e.bark) font.text(ctx, e.bark, X(e.x), e.y - 42, e.bark === '!' ? '#d8323c' : '#ffd23f', { align: 'center', outline: '#101018', scale: e.bark.length === 1 ? 2 : 1 });
    }
    for (const n of this.npcs) if (n.bark && !n.hidden) bubble(ctx, X(n.x), (n.y ?? FLOOR) - 30, n.bark);
    // someone getting up: show how long until they bolt
    for (const n of this.npcs) if (n.pose === 'crouch' && n.riseT > 0 && !n.hidden) {
      const x = X(n.x) - 9, y = (n.y ?? FLOOR) - 44, f = clamp(n.riseT / 5.5, 0, 1);
      ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, 20, 5);
      ctx.fillStyle = f < 0.35 ? '#d8323c' : '#ffd23f'; ctx.fillRect(x, y, Math.round(18 * f), 3);
    }
    if (p.bark) bubble(ctx, X(p.x), p.y - 30, p.bark);
    // prompt
    if (!G.lockInput && !this.frozen && !p.dead) {
      const it = this.interactTarget();
      if (it) {
        const lbl = (input.lastDevice === 'touch' ? 'A' : input.lastDevice === 'pad' ? 'A' : 'E') + ' ' + it.label;
        const w = font.measure(lbl) + 6, x = clamp(X(it.x) - w / 2, 2, W - w - 2), y = FLOOR - 40;
        ctx.fillStyle = '#101018'; ctx.fillRect(x, y, w, 11); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + 10, w, 1);
        font.text(ctx, lbl, x + 3, y + 2, '#f4f4f0');
      }
    }
    if (p.hidden) font.text(ctx, 'ESCONDIDO', W / 2, 44, '#5adcf0', { align: 'center', outline: '#101018' });
    if (this.overlay) this.overlay(ctx, cx);
  },

  drawChar(ctx, lookId, o, x, y, pose, flash) {
    const L = typeof lookId === 'string' ? LOOKS[lookId] : lookId;
    let frame = pose || 'idle';
    if (!pose && o.moving) {
      const k = Math.floor(o.anim * (o.state === 'run' ? 12 : 8)) % 4;
      frame = ['walk1', 'walk2', 'walk3', 'walk2'][k];
    }
    if (frame === 'aim' || frame === 'shoot' || frame === 'punch' || frame === 'crouch' || frame === 'down') { /* keep */ }
    const facing = o.facing || 1;
    const baseId = typeof lookId === 'string' ? lookId : (lookId._id ||= 'o' + Math.random().toString(36).slice(2));
    const look = o.mask || o.bag ? (o._lk && o._lkKey === baseId + (o.mask || '') + (o.bag ? 'b' : '') ? o._lk : (o._lkKey = baseId + (o.mask || '') + (o.bag ? 'b' : ''), o._lk = { ...L, mask: o.mask ?? L.mask, bag: o.bag, _id: o._lkKey })) : lookId;
    const s = side(look, frame, facing);
    const sx = frame === 'down' ? x - 12 : x - 10, sy = frame === 'down' ? y - 12 : y - 24;
    if (frame !== 'down') { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 6, y - 1, 12, 2); }
    ctx.drawImage(s, sx, sy);
    if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(s, sx, sy); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    if (o.label) font.text(ctx, o.label, x, y - 36, o.labelColor || '#ffd23f', { align: 'center', outline: '#101018' });
  },

  drawDark(ctx, cx, dim, t) {
    ctx.fillStyle = `rgba(6,6,20,${dim})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.props) if (q.light || q.t === 'lamp' || q.t === 'window') {
      const x = q.x - cx + 4, y = (q.y ?? FLOOR) - (q.t === 'lamp' ? 24 : -10);
      glow(ctx, x, y, q.t === 'window' ? 26 : 44, `rgba(255,220,150,${dim * 0.35})`);
    }
    for (const e of this.enemies) if (e.flashlight && e.state !== 'down') {
      const x = e.x - cx, y = e.y - 16, len = e.vision;
      const g = ctx.createLinearGradient(x, 0, x + e.facing * len, 0);
      g.addColorStop(0, `rgba(255,250,200,${dim * 0.6})`); g.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + e.facing * 8, y); ctx.lineTo(x + e.facing * len, y - 26); ctx.lineTo(x + e.facing * len, y + 18); ctx.closePath(); ctx.fill();
    }
    glow(ctx, this.p.x - cx, this.p.y - 12, 26, `rgba(200,200,255,${dim * 0.25})`);
    ctx.globalCompositeOperation = 'source-over';
  },
};

function glow(ctx, x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function bubble(ctx, x, y, text) {
  const lines = font.wrap(text, 120);
  const w = Math.max(...lines.map((l) => font.measure(l))) + 6, h = lines.length * 9 + 4;
  const bx = clamp(Math.round(x - w / 2), 2, W - w - 2), by = Math.round(y - h);
  ctx.fillStyle = '#101018'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  ctx.fillStyle = '#f4f4f0'; ctx.fillRect(bx, by, w, h);
  ctx.fillRect(clamp(x - 1, bx + 2, bx + w - 4), by + h, 3, 2);
  lines.forEach((l, i) => font.text(ctx, l, bx + 3, by + 3 + i * 9, '#101018'));
}

export function drawSky(ctx, mode, t) {
  let top, bot;
  if (mode === 'night') { top = '#06061a'; bot = '#1e1e4a'; }
  else if (mode === 'dusk') { top = '#3a2a6a'; bot = '#f09a50'; }
  else { top = '#3c8ce0'; bot = '#a8dcf8'; }
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, FLOOR);
  if (mode === 'night') for (let i = 0; i < 50; i++) { const x = (i * 83) % W, y = (i * 37) % 110; ctx.fillStyle = (i + Math.floor(t * 2)) % 7 ? '#c8c8e0' : '#ffffff'; ctx.fillRect(x, y, 1, 1); }
  if (mode === 'dusk') { ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.arc(250, 110, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,0.25)'; ctx.fillRect(0, 100, W, 50); }
}

function drawWalls(ctx, room, cx, t, env) {
  const th = room.theme;
  // above ceiling: building section
  ctx.fillStyle = '#12121c'; ctx.fillRect(0, 0, W, CEIL);
  const x0 = Math.round(-cx), rw = room.w;
  ctx.fillStyle = shade(th.ceil || '#2a2a3a', 0.8); ctx.fillRect(x0, CEIL - 6, rw, 6);
  ctx.fillStyle = th.wall; ctx.fillRect(x0, CEIL, rw, FLOOR - CEIL);
  const w2 = th.wall2;
  ctx.fillStyle = w2;
  const pat = th.pattern;
  if (pat === 'stripes') for (let x = 0; x < rw; x += 12) ctx.fillRect(x0 + x, CEIL, 5, FLOOR - CEIL);
  else if (pat === 'bricks') for (let y = CEIL; y < FLOOR; y += 6) for (let x = (y / 6) % 2 ? 0 : 8; x < rw; x += 16) { ctx.fillRect(x0 + x, y, 15, 1); ctx.fillRect(x0 + x, y, 1, 6); }
  else if (pat === 'tiles') for (let y = CEIL; y < FLOOR; y += 8) for (let x = 0; x < rw; x += 8) { ctx.fillRect(x0 + x, y, 8, 1); ctx.fillRect(x0 + x, y, 1, 8); }
  else if (pat === 'panels') for (let x = 0; x < rw; x += 32) { ctx.fillRect(x0 + x, CEIL, 2, FLOOR - CEIL); ctx.fillRect(x0 + x, 110, 32, 2); }
  else if (pat === 'damask') for (let y = CEIL + 6; y < FLOOR; y += 14) for (let x = (y % 28) ? 0 : 8; x < rw; x += 16) { ctx.fillRect(x0 + x + 3, y, 3, 3); ctx.fillRect(x0 + x + 4, y - 2, 1, 7); ctx.fillRect(x0 + x + 1, y + 1, 7, 1); }
  else if (pat === 'concrete') { for (let i = 0; i < rw / 5; i++) ctx.fillRect(x0 + ((i * 53) % rw), CEIL + ((i * 29) % (FLOOR - CEIL)), 2, 1); for (let x = 0; x < rw; x += 64) ctx.fillRect(x0 + x, CEIL, 1, FLOOR - CEIL); }
  else if (pat === 'corrugated') for (let x = 0; x < rw; x += 4) ctx.fillRect(x0 + x, CEIL, 1, FLOOR - CEIL);
  else if (pat === 'diamonds') for (let y = CEIL + 4; y < FLOOR; y += 10) for (let x = (y % 20) ? 0 : 5; x < rw; x += 10) { ctx.fillRect(x0 + x + 2, y, 2, 1); ctx.fillRect(x0 + x + 1, y + 1, 4, 1); ctx.fillRect(x0 + x + 2, y + 2, 2, 1); }
  else if (pat === 'marble') { ctx.fillStyle = shade(th.wall, 0.93); for (let i = 0; i < rw / 3; i++) ctx.fillRect(x0 + ((i * 71) % rw), CEIL + ((i * 43) % (FLOOR - CEIL)), 6, 1); ctx.fillStyle = '#c8a040'; ctx.fillRect(x0, 104, rw, 2); }
  // ceiling lights
  ctx.fillStyle = shade(th.ceil || '#2a2a3a', 1.2);
  for (let x = 40; x < rw; x += 110) { ctx.fillRect(x0 + x, CEIL, 18, 3); ctx.fillStyle = 'rgba(255,255,220,0.07)'; ctx.fillRect(x0 + x - 10, CEIL + 3, 38, FLOOR - CEIL - 3); ctx.fillStyle = shade(th.ceil || '#2a2a3a', 1.2); }
  // baseboard
  ctx.fillStyle = shade(th.wall, 0.6); ctx.fillRect(x0, FLOOR - 4, rw, 4);
  // outside walls
  ctx.fillStyle = '#0b0b14';
  if (x0 > 0) ctx.fillRect(0, 0, x0, H);
  if (x0 + rw < W) ctx.fillRect(x0 + rw, 0, W - x0 - rw, H);
}

function drawFloor(ctx, room, cx, t) {
  const th = room.theme;
  const x0 = room.outdoor ? 0 : Math.round(-cx), rw = room.outdoor ? W : room.w;
  if (room.outdoor && th.ground) { ctx.fillStyle = th.ground; ctx.fillRect(0, FLOOR - 16, W, 16); ctx.fillStyle = shade(th.ground, 1.2); for (let i = 0; i < W; i += 7) ctx.fillRect(i, FLOOR - 16 + ((i * 3) % 5), 2, 1); }
  ctx.fillStyle = th.floor; ctx.fillRect(x0, FLOOR, rw, H - FLOOR);
  ctx.fillStyle = shade(th.floor, 0.78);
  const ox = room.outdoor ? -(cx % 16) : x0;
  if (th.floorP === 'wood') for (let y = FLOOR + 5; y < H; y += 6) for (let x = (y % 12) ? 0 : 10; x < rw + 16; x += 20) { ctx.fillRect(ox + x, y, 19, 1); ctx.fillRect(ox + x, y - 5, 1, 5); }
  else if (th.floorP === 'checker') for (let y = FLOOR; y < H; y += 8) for (let x = ((y - FLOOR) / 8) % 2 ? 8 : 0; x < rw + 16; x += 16) ctx.fillRect(ox + x, y, 8, 8);
  else if (th.floorP === 'tiles') for (let y = FLOOR; y < H; y += 10) for (let x = 0; x < rw + 16; x += 10) { ctx.fillRect(ox + x, y, 10, 1); ctx.fillRect(ox + x, y, 1, 10); }
  else if (th.floorP === 'marble') { for (let x = 0; x < rw + 16; x += 24) ctx.fillRect(ox + x, FLOOR, 1, H - FLOOR); ctx.fillStyle = shade(th.floor, 1.1); ctx.fillRect(x0, FLOOR, rw, 2); }
  else if (th.floorP === 'concrete') for (let i = 0; i < rw / 4; i++) ctx.fillRect(ox + ((i * 37) % (rw + 16)), FLOOR + 3 + ((i * 11) % 24), 2, 1);
  else if (th.floorP === 'dirt') { for (let i = 0; i < 90; i++) ctx.fillRect(((i * 37 - cx) % W + W) % W, FLOOR + 3 + ((i * 11) % 24), 2, 1); }
  else if (th.floorP === 'roof') { ctx.fillStyle = shade(th.floor, 1.15); ctx.fillRect(x0, FLOOR, rw, 3); ctx.fillStyle = shade(th.floor, 0.7); for (let x = 0; x < rw + 16; x += 32) ctx.fillRect(ox + x, FLOOR + 3, 1, H - FLOOR); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, FLOOR, rw, 1);
}

export { sideCar };
