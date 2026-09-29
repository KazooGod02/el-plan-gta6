// HUD, dialogue boxes, toasts, cards, fades.
import { G, W, H } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { frameBox, shade } from '../core/gfx.js';
import { clamp, money, clock } from '../core/util.js';
import { portrait } from '../data/sprites.js';
import { LOOKS } from '../data/cast.js';
import { MAP, TS, MW, MH } from '../world/map.js';

const BAD = [
  [/\bpendejos?\b/gi, 'p#%&$'], [/\bverga\b/gi, 'v#%&$'], [/\bcabr[oó]n(es)?\b/gi, 'c#%&$'], [/\bchingad[oa]s?\b/gi, 'ch#%&$'],
  [/\bchingues\b/gi, 'ch#%&$'], [/\bputa\b/gi, 'p#%&'], [/\bputo\b/gi, 'p#%&'], [/\bmierda\b/gi, 'm#%&$'], [/\bculero\b/gi, 'c#%&$'],
  [/\bpinche\b/gi, 'p#%&$'], [/\bmadres\b/gi, 'm#%&$'], [/\bcabrona\b/gi, 'c#%&$'],
];
export function censor(s) {
  if (!G.settings?.streamer) return s;
  let out = s; for (const [re, rep] of BAD) out = out.replace(re, rep); return out;
}

export const UI = {
  dialog: null,
  toasts: [],
  banner: null,
  fade: 0, fadeTarget: 0, fadeSpeed: 2,
  letterbox: 0, letterboxTarget: 0,
  card: null,
  objective: '',
  objT: 0,
  hud: true,
  flashA: 0,
  subtitle: null,
  timer: null,        // {label, t, danger}
  meter: null,        // {label, v, col}
  lastChoice: -1,

  // ------------------------------------------------ dialog
  say(who, text, opts = {}) {
    const L = LOOKS[who] || LOOKS.unknown;
    const txt = censor(text);
    this.dialog = {
      who, L, name: opts.name || L.name, expr: opts.expr || 'normal', text: txt, raw: text, shown: 0,
      lines: font.wrap(txt, 262), choices: opts.choices || null, sel: 0, done: false, t: 0, auto: opts.auto, portrait: opts.portrait !== false && who !== 'narrator',
    };
    if (who === 'narrator') this.dialog.name = opts.name || '';
    this.dialog.lines = font.wrap(txt, this.dialog.portrait ? 262 : 300);
  },
  closeDialog() { this.dialog = null; },

  toast(text, col = '#f4f4f0', t = 2.5) {
    this.toasts = this.toasts.filter((q) => q.text !== text);
    this.toasts.push({ text: censor(text), col, t, max: t });
    if (this.toasts.length > 4) this.toasts.shift();
  },
  bannerShow(text, sub) { this.banner = { text, sub, t: 3 }; },
  banner_(text) { this.bannerShow(text); },
  setObjective(text) { this.objective = text ? censor(text) : ''; this.objT = text ? 5 : 0; },
  showCard(title, sub, t = 3.5, style = 'pass') { this.card = { title, sub, t, max: t, style }; },
  flash(a = 0.8) { this.flashA = a; },

  update(dt) {
    const d = this.dialog;
    if (d) {
      d.t += dt;
      const total = d.text.length;
      if (d.shown < total) {
        const prev = Math.floor(d.shown);
        d.shown = Math.min(total, d.shown + dt * (d.fast ? 200 : 48));
        if (Math.floor(d.shown) !== prev && Math.floor(d.shown) % 2 === 0) {
          const ch = d.text[Math.floor(d.shown)] || '';
          if (ch === '#' && G.settings?.streamer) audio.sfx('bip', { dur: 0.12 });
          else if (ch !== ' ') audio.voice(d.L.voice || 400);
        }
        if (input.pressed('a') || input.pressed('b')) { d.shown = total; input.consume('a'); input.consume('b'); }
      } else if (d.choices) {
        if (input.pressed('up') || input.pressed('left')) { d.sel = (d.sel + d.choices.length - 1) % d.choices.length; audio.sfx('move'); }
        if (input.pressed('down') || input.pressed('right')) { d.sel = (d.sel + 1) % d.choices.length; audio.sfx('move'); }
        if (input.pressed('a')) { this.lastChoice = d.sel; audio.sfx('select'); d.done = true; this.dialog = null; input.consume('a'); }
      } else {
        if (d.auto && d.t > d.auto) { d.done = true; this.dialog = null; }
        else if (input.pressed('a') || input.pressed('b')) { d.done = true; this.dialog = null; input.consume('a'); input.consume('b'); audio.sfx('blip', { f: 700 }); }
      }
    }
    for (const q of this.toasts) q.t -= dt;
    this.toasts = this.toasts.filter((q) => q.t > 0);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.card) { this.card.t -= dt; if (this.card.t <= 0) this.card = null; }
    if (this.objT > 0) this.objT -= dt;
    this.fade += clamp(this.fadeTarget - this.fade, -this.fadeSpeed * dt, this.fadeSpeed * dt);
    this.letterbox += clamp(this.letterboxTarget - this.letterbox, -3 * dt, 3 * dt);
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 2);
  },

  // ------------------------------------------------ render
  // Layout (logical px, 4px margins):
  //   top-left: day/clock, chapter, car · top-right: money, stars, health/armor + weapon box
  //   top-center: timer, meter, then toasts · bottom-left: radar · bottom: objective / dialog
  render(ctx) {
    const scene = G.scene?.name;
    const play = scene === 'city' || scene === 'interior';
    if (this.letterbox > 0) {
      const h = Math.round(18 * this.letterbox);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    }
    const d = this.dialog;
    const dlgPos = d ? this.dialogPos(scene) : null;
    if (this.hud && this.letterbox < 0.1 && play) this.drawHud(ctx, scene, dlgPos);
    // objective: bottom strip, hidden while a bottom dialog is up
    if (this.objective && this.letterbox < 0.5 && play && (this.objT > 0 || !d) && dlgPos !== 'bottom' && dlgPos !== 'compact') {
      const city = scene === 'city';
      const maxW = city ? 236 : 300, cx = city ? 190 : W / 2;
      const lines = font.wrap(this.objective, maxW);
      const lw = Math.max(...lines.map((l) => font.measure(l))) + 10, lh = lines.length * 10 + 4;
      const y = H - 5 - lh;
      ctx.fillStyle = 'rgba(8,8,18,0.72)'; ctx.fillRect(Math.round(cx - lw / 2), y, lw, lh);
      const col = this.objT > 0 && Math.floor(this.objT * 4) % 2 ? '#fff08c' : '#ffd23f';
      lines.forEach((l, i) => font.text(ctx, l, cx, y + 3 + i * 10, col, { align: 'center' }));
    }
    // banner (zone names), above the objective strip
    if (this.banner) {
      const b = this.banner, a = Math.min(1, b.t * 2, (3 - b.t) * 3);
      ctx.globalAlpha = clamp(a, 0, 1);
      font.text(ctx, b.text, W - 6, H - 50, '#f4f4f0', { align: 'right', outline: '#101018', scale: 2 });
      if (b.sub) font.text(ctx, b.sub, W - 6, H - 32, '#ffd23f', { align: 'right', outline: '#101018' });
      ctx.globalAlpha = 1;
    }
    // top-center stack: timer, meter, toasts
    let ty = dlgPos === 'top' ? 58 : 4;
    if (this.timer) { this.drawTimer(ctx, ty); ty += 12; }
    if (this.meter) { this.drawMeter(ctx, ty); ty += 20; }
    // toasts go under the HUD clusters so they never cover money, stars or health
    if (play && this.hud && dlgPos !== 'top') ty = Math.max(ty + 2, 42);
    this.toasts.forEach((q, i) => {
      const a = Math.min(1, q.t * 3, (q.max - q.t) * 6);
      ctx.globalAlpha = clamp(a, 0, 1);
      const maxW = 236;
      const lines = font.measure(q.text) + 10 > maxW ? font.wrap(q.text, maxW - 10) : [q.text];
      const bw = lines.length > 1 ? maxW : font.measure(q.text) + 10, bh = lines.length * 10 + 3;
      const x = Math.round(W / 2 - bw / 2), y = ty;
      ctx.fillStyle = 'rgba(10,10,20,0.88)'; ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = q.col; ctx.fillRect(x, y + bh - 1, bw, 1);
      lines.forEach((l, k) => font.text(ctx, l, W / 2, y + 2 + k * 10, q.col, { align: 'center' }));
      ctx.globalAlpha = 1;
      ty += bh + 3;
      void i;
    });
    if (this.fade > 0.001) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    if (this.subtitle) {
      const lines = font.wrap(censor(this.subtitle), 280);
      lines.forEach((l, i) => font.text(ctx, l, W / 2, H / 2 + i * 10 - (lines.length - 1) * 5, '#c8c8d8', { align: 'center', outline: '#000' }));
    }
    if (d) this.drawDialog(ctx, dlgPos);
    if (this.card) this.drawCard(ctx);
    if (this.flashA > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flashA})`; ctx.fillRect(0, 0, W, H); }
    if (this.overFade) this.overFade(ctx);
  },

  // where the dialog box goes: interiors on top, city at the bottom; lines that play
  // while you drive/walk use a compact box that leaves the radar and the road visible
  dialogPos(scene) {
    const d = this.dialog;
    if (scene === 'interior' || this.dialogTop) return 'top';
    if (d.auto && !d.choices && scene === 'city' && !G.lockInput && this.letterbox < 0.1) return 'compact';
    return 'bottom';
  },

  drawDialog(ctx, pos) {
    const d = this.dialog;
    const shown = Math.floor(d.shown);
    if (pos === 'compact') {
      const bw = 248, x = W - 4 - bw;
      if (!d.clines) d.clines = font.wrap(d.text, bw - 12);
      const bh = 16 + d.clines.length * 10;
      const y = H - 4 - bh;
      frameBox(ctx, x, y, bw, bh, 'rgba(12,12,28,0.9)', d.L.color || '#f4f4f0', shade(d.L.color || '#888888', 0.5));
      if (d.name) font.text(ctx, d.name, x + 6, y + 4, d.L.color || '#ffd23f');
      let count = 0;
      d.clines.forEach((l, i) => {
        font.text(ctx, l.slice(0, Math.max(0, shown - count)), x + 6, y + 14 + i * 10, '#f4f4f0');
        count += l.length + 1;
      });
      // how long until it moves on
      if (d.auto) { ctx.fillStyle = d.L.color || '#ffd23f'; ctx.fillRect(x + 1, y + bh - 2, Math.round((bw - 2) * clamp(1 - d.t / d.auto, 0, 1)), 1); }
      return;
    }
    const bw = 316, lh = 10;
    const bh = Math.max(50, 18 + (d.lines.length + (d.choices ? d.choices.length : 0)) * lh + (d.choices ? 4 : 0));
    const x = 2, y = pos === 'top' ? 3 : H - bh - 3;
    frameBox(ctx, x, y, bw, bh, 'rgba(12,12,28,0.95)', d.L.color || '#f4f4f0', shade(d.L.color || '#888888', 0.5));
    let tx = x + 8;
    if (d.portrait) {
      ctx.fillStyle = shade(d.L.color || '#444444', 0.35); ctx.fillRect(x + 5, y + 5, 36, 36);
      ctx.drawImage(portrait(d.who, d.expr), x + 7, y + 7);
      ctx.fillStyle = d.L.color || '#fff'; ctx.fillRect(x + 5, y + 41, 36, 1);
      tx = x + 48;
    }
    if (d.name) font.text(ctx, d.name, tx, y + 5, d.L.color || '#ffd23f');
    let count = 0;
    d.lines.forEach((l, i) => {
      const vis = l.slice(0, Math.max(0, shown - count));
      count += l.length + 1;
      font.text(ctx, vis, tx, y + 17 + i * lh, '#f4f4f0');
    });
    if (d.choices && shown >= d.text.length) {
      d.choices.forEach((c, i) => {
        const cy = y + 17 + (d.lines.length + i) * lh + 3;
        const sel = i === d.sel;
        if (sel) { ctx.fillStyle = 'rgba(255,210,63,0.14)'; ctx.fillRect(tx - 3, cy - 2, bw - (tx - x) - 6, 10); }
        font.text(ctx, (sel ? '► ' : '  ') + censor(c), tx, cy, sel ? '#ffd23f' : '#a8a8b8');
      });
    } else if (shown >= d.text.length && Math.floor(G.time * 3) % 2) font.text(ctx, '▼', x + bw - 11, y + bh - 11, '#ffd23f');
  },

  drawCard(ctx) {
    const c = this.card;
    const a = clamp(Math.min(c.t * 2, (c.max - c.t) * 4), 0, 1);
    ctx.globalAlpha = a;
    if (c.style === 'chapter') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 50, W, 80);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 50, W, 1); ctx.fillRect(0, 129, W, 1);
      font.text(ctx, c.sub || '', W / 2, 62, '#ffd23f', { align: 'center' });
      font.text(ctx, c.title, W / 2, 80, '#f4f4f0', { align: 'center', outline: '#3a1a00', scale: 3 });
    } else if (c.style === 'fail') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 54, W, 58);
      font.text(ctx, c.title, W / 2, 62, '#d8323c', { align: 'center', outline: '#101018', scale: 3 });
      if (c.sub) font.wrap(c.sub, 290).forEach((l, i) => font.text(ctx, l, W / 2, 94 + i * 10, '#f4f4f0', { align: 'center', outline: '#101018' }));
    } else if (c.style === 'big') {
      font.text(ctx, c.title, W / 2, 70, '#f4f4f0', { align: 'center', outline: '#101018', scale: 3 });
      if (c.sub) font.text(ctx, c.sub, W / 2, 104, '#ffd23f', { align: 'center', outline: '#101018' });
    } else {
      const lines = c.sub ? font.wrap(c.sub, 280) : [];
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 50, W, 34 + lines.length * 10 + 6);
      font.text(ctx, c.title, W / 2, 56, '#ffd23f', { align: 'center', outline: '#3a1a00', scale: 2 });
      lines.forEach((l, i) => font.text(ctx, l, W / 2, 80 + i * 10, '#f4f4f0', { align: 'center', outline: '#101018' }));
    }
    ctx.globalAlpha = 1;
  },

  drawTimer(ctx, y) {
    const t = this.timer;
    const s = Math.max(0, t.t);
    const txt = `${t.label || ''} ${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const w = font.measure(txt) + 10;
    ctx.fillStyle = 'rgba(10,10,20,0.75)'; ctx.fillRect(Math.round(W / 2 - w / 2), y - 2, w, 11);
    font.text(ctx, txt, W / 2, y, s < 10 && Math.floor(G.time * 4) % 2 ? '#d8323c' : '#f4f4f0', { align: 'center' });
  },
  drawMeter(ctx, y) {
    const m = this.meter;
    const x = W / 2 - 50;
    font.text(ctx, m.label, W / 2, y, '#f4f4f0', { align: 'center', outline: '#101018' });
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y + 10, 102, 7);
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y + 11, 100, 5);
    ctx.fillStyle = m.col || '#46b450'; ctx.fillRect(x, y + 11, Math.round(100 * clamp(m.v, 0, 1)), 5);
  },

  drawHud(ctx, scene, dlgPos) {
    const s = G.state; if (!s) return;
    const top = dlgPos === 'top' ? 56 : 0;
    const c = G.scenes.city;
    const city = scene === 'city';
    // ---- right cluster: weapon box + money / stars / health / armor
    const bx = W - 4 - 24, by = 4 + top;
    drawWeaponBox(ctx, bx, by, s);
    const rx = bx - 5;
    font.text(ctx, money(s.money), rx, 4 + top, '#46d470', { align: 'right', outline: '#101018' });
    const wanted = city ? c.wanted : 0;
    const flash = c.evadeT > 2 && Math.floor(G.time * 4) % 2;
    for (let i = 0; i < 5; i++) {
      const on = i < wanted;
      font.text(ctx, '★', rx - 5 - (4 - i) * 11, 14 + top, on ? (flash ? '#7a6a2a' : '#ffd23f') : '#3a3a4a', { outline: '#101018' });
    }
    const hp = city ? c.player.hp : G.scenes.interior.p.hp;
    const bw = 52, hx = rx - bw, hy = 24 + top;
    font.text(ctx, '♥', hx - 9, hy - 1, '#d8323c', { outline: '#101018' });
    bar(ctx, hx, hy, bw, clamp(hp / 100, 0, 1), hp < 30 && Math.floor(G.time * 4) % 2 ? '#ff7a7a' : '#d8323c', '#4a1a1a');
    const armor = s.armor || 0;
    if (armor > 0) bar(ctx, hx, hy + 6, bw, clamp(armor / 100, 0, 1), '#5a9cff', '#1a2a4a');
    // ---- left cluster: day / clock, chapter, car
    font.text(ctx, `DÍA ${s.day}  ${clock(s.clock)}`, 4, 4 + top, '#f4f4f0', { outline: '#101018' });
    if (s.chapterName) font.text(ctx, s.chapterName, 4, 14 + top, '#a8a8c8', { outline: '#101018' });
    if (city) {
      const car = c.player.car;
      if (car) {
        const f = clamp(car.hp / car.maxHp, 0, 1);
        font.text(ctx, car.spec.name, 4, 26, '#f4f4f0', { outline: '#101018' });
        bar(ctx, 4, 36, 52, f, f < 0.25 ? '#d8323c' : f < 0.5 ? '#f08c28' : '#46b450', '#1a2a1a');
        if (car.passengers.length) font.text(ctx, car.passengers.map((p) => (p.lookId || 'x')[0].toUpperCase()).join(' '), 60, 34, '#ffd23f', { outline: '#101018' });
      }
      this.drawGpsArrow(ctx, c);
      this.drawRadar(ctx, c);
      if (G.settings?.speedrun && s.freeMode === false) font.text(ctx, fmtRun(s.stats.playtime), 4, car ? 44 : 26, '#5adcf0', { outline: '#101018' });
      this.drawHitTarget(ctx, c);
    }
  },

  // GTA-1 style arrow circling the player, pointing along the GPS route
  drawGpsArrow(ctx, c) {
    const g = c.gps, r = c.gpsRoute;
    if (!g || c.player.dead) return;
    const pos = c.pos();
    const d = Math.hypot(g.x - pos.x, g.y - pos.y);
    if (d < 90) return;
    const ahead = r && r.length > 3 ? r[Math.min(r.length - 1, 7)] : [g.x, g.y];
    const a = Math.atan2(ahead[1] - pos.y, ahead[0] - pos.x);
    const px = pos.x - c.cam.x, py = pos.y - c.cam.y, rad = c.player.car ? 24 : 16;
    const ax = px + Math.cos(a) * rad, ay = py + Math.sin(a) * rad;
    const pulse = 0.75 + Math.sin(G.time * 6) * 0.25;
    const tri = (s, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(ax + Math.cos(a) * 5 * s, ay + Math.sin(a) * 5 * s);
      ctx.lineTo(ax + Math.cos(a + 2.4) * 4 * s, ay + Math.sin(a + 2.4) * 4 * s);
      ctx.lineTo(ax + Math.cos(a - 2.4) * 4 * s, ay + Math.sin(a - 2.4) * 4 * s);
      ctx.closePath(); ctx.fill();
    };
    ctx.globalAlpha = pulse;
    tri(1.5, '#101018'); tri(1, g.color || '#c878f0');
    ctx.globalAlpha = 1;
  },

  // health bar over the last thing you punched / shot
  drawHitTarget(ctx, c) {
    const h = c.lastHit;
    if (!h || h.t <= 0) return;
    const q = h.q;
    const x = Math.round(q.x - c.cam.x) - 8, y = Math.round(q.y - c.cam.y) - 16;
    if (x < -20 || y < -10 || x > W || y > H) return;
    const f = q.state === 'dead' ? 0 : clamp(q.hp / (q.maxHp || 30), 0, 1);
    ctx.globalAlpha = clamp(h.t * 2, 0, 1);
    bar(ctx, x, y, 16, f, q.cop ? '#5a9cff' : '#d8323c', '#2a1a1a');
    ctx.globalAlpha = 1;
  },

  drawRadar(ctx, c) {
    const R = 27, cx = 4 + R, cy = H - 4 - R;
    const pos = c.pos();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0a1a14'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // mini map: 1 tile = 2 px
    const tpx = 2;
    const sx = pos.x / TS - R / tpx, sy = pos.y / TS - R / tpx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c.mini, sx, sy, (R * 2) / tpx, (R * 2) / tpx, cx - R, cy - R, R * 2, R * 2);
    const toR = (x, y) => [cx + (x / TS - pos.x / TS) * tpx, cy + (y / TS - pos.y / TS) * tpx];
    // GPS route
    const route = c.gpsRoute;
    if (route && route.length > 1) {
      ctx.strokeStyle = '#101018'; ctx.lineWidth = 2.5; ctx.beginPath();
      route.forEach(([x, y], i) => { const [mx, my] = toR(x, y); if (i) ctx.lineTo(mx, my); else ctx.moveTo(mx, my); });
      ctx.stroke();
      ctx.strokeStyle = c.gps.color || '#c878f0'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.lineWidth = 1;
    }
    // pickups and places
    for (const pk of c.worldPickups || []) {
      if (pk.taken) continue;
      const [mx, my] = toR(pk.x, pk.y);
      if (Math.abs(mx - cx) > R || Math.abs(my - cy) > R) continue;
      ctx.fillStyle = pk.kind === 'health' ? '#ff5a5a' : pk.kind === 'armor' ? '#5a9cff' : '#46d4c8';
      ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 2, 2);
    }
    // markers
    for (const m of c.markers) {
      if (m.hidden || m.noBlip) continue;
      let [mx, my] = toR(m.x, m.y);
      const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy);
      if (d > R - 3) { mx = cx + dx / d * (R - 3); my = cy + dy / d * (R - 3); }
      ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(mx) - 2, Math.round(my) - 2, 5, 5);
      ctx.fillStyle = m.color; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3);
    }
    if (c.waypoint) {
      let [mx, my] = toR(c.waypoint.x, c.waypoint.y);
      const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy);
      if (d > R - 3) { mx = cx + dx / d * (R - 3); my = cy + dy / d * (R - 3); }
      ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(mx) - 2, Math.round(my) - 3, 5, 6);
      ctx.fillStyle = '#c878f0'; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 2, 3, 4);
    }
    for (const v of c.vehicles) if (v.ai === 'police') { const [mx, my] = toR(v.x, v.y); ctx.fillStyle = Math.floor(G.time * 6) % 2 ? '#ff3c3c' : '#3c6cff'; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 2, 2); }
    for (const q of c.peds) if (q.ally || q.blip) { const [mx, my] = toR(q.x, q.y); ctx.fillStyle = q.blip || '#5adcf0'; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 2, 2); }
    for (const v of c.vehicles) if (v.blip) { const [mx, my] = toR(v.x, v.y); ctx.fillStyle = v.blip; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3); }
    ctx.restore();
    ctx.strokeStyle = '#101018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2); ctx.stroke();
    // player arrow
    const a = c.player.car ? c.player.car.a : c.player.a;
    ctx.fillStyle = '#f4f4f0';
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4); ctx.lineTo(cx + Math.cos(a + 2.5) * 3, cy + Math.sin(a + 2.5) * 3); ctx.lineTo(cx + Math.cos(a - 2.5) * 3, cy + Math.sin(a - 2.5) * 3); ctx.closePath(); ctx.fill();
    font.text(ctx, 'N', cx, cy - R + 1, '#f4f4f0', { align: 'center', outline: '#101018' });
    // distance to the GPS target
    if (c.gps && c.gpsDist != null) {
      const m = Math.round(c.gpsDist / 16) * 5;
      const txt = m >= 1000 ? (m / 1000).toFixed(1) + ' km' : m + ' m';
      font.text(ctx, txt, cx, cy - R - 11, c.gps.color || '#c878f0', { align: 'center', outline: '#101018' });
    }
    void MAP; void MW; void MH;
  },
};

function bar(ctx, x, y, w, f, col, bg) {
  ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, w + 2, 5);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * f), 3);
}

// the "what's in your hand" box
export function drawWeaponBox(ctx, x, y, s) {
  const w = s.weapon || 'fists';
  ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, 26, 26);
  ctx.fillStyle = 'rgba(30,30,52,0.92)'; ctx.fillRect(x, y, 24, 24);
  ctx.fillStyle = '#3a3a5a'; ctx.fillRect(x, y, 24, 1);
  drawWeaponIcon(ctx, w, x + 12, y + 10);
  if (w !== 'fists') {
    const ammo = G.cheatAmmo || G.scenes.interior?.infiniteAmmo && G.scene === G.scenes.interior ? '∞' : String(s.weapons[w] ?? 0);
    font.text(ctx, ammo, x + 23, y + 16, (s.weapons[w] ?? 0) === 0 && ammo !== '∞' ? '#d8323c' : '#f4f4f0', { align: 'right', outline: '#101018' });
  }
}
export function drawWeaponIcon(ctx, w, cx, cy) {
  const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x, cy + y, ww, hh); };
  if (w === 'pistol') {
    R(-7, -4, 12, 4, '#c8c8d8'); R(-7, -4, 12, 1, '#f4f4f0'); R(1, 0, 4, 7, '#6a4a2a'); R(-2, 0, 2, 3, '#8a8a9a'); R(-8, -3, 1, 2, '#101018');
  } else if (w === 'shotgun') {
    R(-10, -3, 14, 3, '#a8a8b8'); R(-10, -3, 14, 1, '#e8e8f0'); R(-4, 0, 6, 2, '#5a3a1a'); R(4, -3, 7, 5, '#8c5a32'); R(8, 0, 3, 3, '#6a4020');
  } else {
    // fist
    R(-5, -4, 10, 8, '#e0b080'); R(-5, -4, 10, 1, '#f0c8a0'); R(-5, -1, 10, 1, '#b8885a'); R(-5, 2, 10, 1, '#b8885a');
    R(-2, -4, 1, 3, '#b8885a'); R(1, -4, 1, 3, '#b8885a'); R(5, -2, 2, 5, '#d4a070');
  }
}

function fmtRun(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; }
