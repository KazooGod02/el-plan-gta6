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
  render(ctx) {
    const scene = G.scene?.name;
    if (this.letterbox > 0) {
      const h = Math.round(18 * this.letterbox);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    }
    if (this.hud && this.letterbox < 0.1 && (scene === 'city' || scene === 'interior')) this.drawHud(ctx, scene);
    // objective
    if (this.objective && this.letterbox < 0.5 && (scene === 'city' || scene === 'interior')) {
      const y = scene === 'city' ? H - 12 : 2;
      const show = this.objT > 0 || !this.dialog;
      if (show && !(this.dialog && ((scene === 'city' && y > H / 2) || (scene === 'interior')))) {
        const lines = font.wrap(this.objective, 220);
        lines.forEach((l, i) => font.text(ctx, l, W / 2 + (scene === 'city' ? 26 : 0), (scene === 'city' ? y - (lines.length - 1 - i) * 9 : y + i * 9), this.objT > 0 && Math.floor(this.objT * 4) % 2 ? '#fff08c' : '#ffd23f', { align: 'center', outline: '#101018' }));
      }
    }
    // banner (zone names)
    if (this.banner) {
      const b = this.banner, a = Math.min(1, b.t * 2, (3 - b.t) * 3);
      ctx.globalAlpha = clamp(a, 0, 1);
      font.text(ctx, b.text, W - 8, H - 34, '#f4f4f0', { align: 'right', outline: '#101018', scale: 2 });
      if (b.sub) font.text(ctx, b.sub, W - 8, H - 14, '#ffd23f', { align: 'right', outline: '#101018' });
      ctx.globalAlpha = 1;
    }
    // toasts
    this.toasts.forEach((q, i) => {
      const a = Math.min(1, q.t * 3, (q.max - q.t) * 6);
      ctx.globalAlpha = clamp(a, 0, 1);
      const w = font.measure(q.text) + 8, x = Math.round(W / 2 - w / 2), y = (this.dialog && (G.scene?.name === 'interior' || this.dialogTop) ? 58 : 24) + i * 13;
      ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fillRect(x, y, w, 11);
      ctx.fillStyle = q.col; ctx.fillRect(x, y + 10, w, 1);
      font.text(ctx, q.text, x + 4, y + 2, q.col);
      ctx.globalAlpha = 1;
    });
    if (this.timer) this.drawTimer(ctx);
    if (this.meter) this.drawMeter(ctx);
    if (this.fade > 0.001) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    if (this.subtitle) {
      const lines = font.wrap(censor(this.subtitle), 280);
      lines.forEach((l, i) => font.text(ctx, l, W / 2, H / 2 + i * 9 - (lines.length - 1) * 5, '#c8c8d8', { align: 'center', outline: '#000' }));
    }
    if (this.dialog) this.drawDialog(ctx, scene === 'interior' || this.dialogTop ? 'top' : 'bottom');
    if (this.card) this.drawCard(ctx);
    if (this.flashA > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flashA})`; ctx.fillRect(0, 0, W, H); }
    if (this.overFade) this.overFade(ctx);
  },

  drawDialog(ctx, pos) {
    const d = this.dialog;
    const bw = 316, bh = d.choices ? Math.max(50, 16 + (d.lines.length + d.choices.length) * 9 + 4) : 50;
    const x = 2, y = pos === 'top' ? 3 : H - bh - 3;
    frameBox(ctx, x, y, bw, bh, 'rgba(12,12,28,0.94)', d.L.color || '#f4f4f0', shade(d.L.color || '#888888', 0.5));
    let tx = x + 8;
    if (d.portrait) {
      ctx.fillStyle = shade(d.L.color || '#444444', 0.35); ctx.fillRect(x + 5, y + 5, 36, 36);
      ctx.drawImage(portrait(d.who, d.expr), x + 7, y + 7);
      ctx.fillStyle = d.L.color || '#fff'; ctx.fillRect(x + 5, y + 41, 36, 1);
      tx = x + 47;
    }
    if (d.name) font.text(ctx, d.name, tx, y + 5, d.L.color || '#ffd23f');
    const shown = Math.floor(d.shown);
    let count = 0;
    d.lines.forEach((l, i) => {
      const vis = l.slice(0, Math.max(0, shown - count));
      count += l.length + 1;
      font.text(ctx, vis, tx, y + 16 + i * 9, '#f4f4f0');
    });
    if (d.choices && shown >= d.text.length) {
      d.choices.forEach((c, i) => {
        const cy = y + 16 + (d.lines.length + i) * 9 + 2;
        const sel = i === d.sel;
        font.text(ctx, (sel ? '► ' : '  ') + censor(c), tx, cy, sel ? '#ffd23f' : '#a8a8b8');
      });
    } else if (shown >= d.text.length && Math.floor(G.time * 3) % 2) font.text(ctx, '▼', x + bw - 10, y + bh - 10, '#ffd23f');
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
      font.text(ctx, c.title, W / 2, 62, '#d8323c', { align: 'center', outline: '#101018', scale: 3 });
      if (c.sub) font.text(ctx, c.sub, W / 2, 96, '#f4f4f0', { align: 'center', outline: '#101018' });
    } else if (c.style === 'big') {
      font.text(ctx, c.title, W / 2, 70, '#f4f4f0', { align: 'center', outline: '#101018', scale: 3 });
      if (c.sub) font.text(ctx, c.sub, W / 2, 104, '#ffd23f', { align: 'center', outline: '#101018' });
    } else {
      font.text(ctx, c.title, W / 2, 58, '#ffd23f', { align: 'center', outline: '#3a1a00', scale: 2 });
      if (c.sub) font.wrap(c.sub, 280).forEach((l, i) => font.text(ctx, l, W / 2, 84 + i * 10, '#f4f4f0', { align: 'center', outline: '#101018' }));
    }
    ctx.globalAlpha = 1;
  },

  drawTimer(ctx) {
    const t = this.timer;
    const s = Math.max(0, t.t);
    const txt = `${t.label || ''} ${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    font.text(ctx, txt, W / 2, 14, s < 10 && Math.floor(G.time * 4) % 2 ? '#d8323c' : '#f4f4f0', { align: 'center', outline: '#101018' });
  },
  drawMeter(ctx) {
    const m = this.meter;
    const x = W / 2 - 50, y = 26;
    font.text(ctx, m.label, W / 2, y - 10, '#f4f4f0', { align: 'center', outline: '#101018' });
    ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, 102, 7);
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y, 100, 5);
    ctx.fillStyle = m.col || '#46b450'; ctx.fillRect(x, y, Math.round(100 * clamp(m.v, 0, 1)), 5);
  },

  drawHud(ctx, scene) {
    const s = G.state; if (!s) return;
    const top = this.dialog && scene === 'interior' ? 56 : 0;
    // money
    font.text(ctx, money(s.money), W - 4, 3 + top, '#46d470', { align: 'right', outline: '#101018' });
    // stars
    const c = G.scenes.city;
    const wanted = scene === 'city' ? c.wanted : 0;
    const flash = c.evadeT > 2 && Math.floor(G.time * 4) % 2;
    for (let i = 0; i < 5; i++) {
      const on = i < wanted;
      font.text(ctx, '★', W - 62 + i * 12, 13 + top, on ? (flash ? '#7a6a2a' : '#ffd23f') : '#3a3a4a', { outline: '#101018' });
    }
    // health
    const hp = scene === 'city' ? c.player.hp : G.scenes.interior.p.hp;
    const hx = W - 62, hy = 24 + top;
    font.text(ctx, '♥', hx - 10, hy - 1, '#d8323c', { outline: '#101018' });
    ctx.fillStyle = '#101018'; ctx.fillRect(hx - 1, hy, 58, 5);
    ctx.fillStyle = '#4a1a1a'; ctx.fillRect(hx, hy + 1, 56, 3);
    ctx.fillStyle = hp < 30 && Math.floor(G.time * 4) % 2 ? '#ff7a7a' : '#d8323c'; ctx.fillRect(hx, hy + 1, Math.round(56 * clamp(hp / 100, 0, 1)), 3);
    // weapon
    if (s.weapon !== 'fists') {
      const ammo = s.weapons[s.weapon] ?? 0;
      font.text(ctx, (s.weapon === 'pistol' ? 'PISTOLA ' : 'ESCOPETA ') + (G.cheatAmmo ? '∞' : ammo), W - 4, 32 + top, '#f4f4f0', { align: 'right', outline: '#101018' });
    }
    // day / clock
    font.text(ctx, `DÍA ${s.day >= 0 ? s.day : s.day}  ${clock(s.clock)}`, 4, 3 + top, '#f4f4f0', { outline: '#101018' });
    if (s.chapterName) font.text(ctx, s.chapterName, 4, 12 + top, '#a8a8c8', { outline: '#101018' });
    if (scene === 'city') {
      // car health
      const car = c.player.car;
      if (car) {
        const f = clamp(car.hp / car.maxHp, 0, 1);
        font.text(ctx, car.spec.name, 4, 22, '#f4f4f0', { outline: '#101018' });
        ctx.fillStyle = '#101018'; ctx.fillRect(3, 31, 52, 5);
        ctx.fillStyle = f < 0.25 ? '#d8323c' : f < 0.5 ? '#f08c28' : '#46b450'; ctx.fillRect(4, 32, Math.round(50 * f), 3);
        if (car.passengers.length) font.text(ctx, car.passengers.map((p) => (p.lookId || 'x')[0].toUpperCase()).join(' '), 60, 30, '#ffd23f', { outline: '#101018' });
      }
      this.drawRadar(ctx, c);
      if (G.settings?.speedrun && s.freeMode === false) font.text(ctx, fmtRun(s.stats.playtime), W / 2, 3, '#5adcf0', { align: 'center', outline: '#101018' });
    }
  },

  drawRadar(ctx, c) {
    const R = 27, cx = 4 + R, cy = H - 4 - R;
    const pos = c.pos();
    const scale = 0.25; // px per world px -> 1 radar px = 4 world px... use tiles
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0a1a14'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // mini map: 1 tile = 2 px
    const tpx = 2;
    const sx = pos.x / TS - R / tpx, sy = pos.y / TS - R / tpx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c.mini, sx, sy, (R * 2) / tpx, (R * 2) / tpx, cx - R, cy - R, R * 2, R * 2);
    const toR = (x, y) => [cx + (x / TS - pos.x / TS) * tpx, cy + (y / TS - pos.y / TS) * tpx];
    // markers
    for (const m of c.markers) {
      if (m.hidden || m.noBlip) continue;
      let [mx, my] = toR(m.x, m.y);
      const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy);
      if (d > R - 3) { mx = cx + dx / d * (R - 3); my = cy + dy / d * (R - 3); }
      ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(mx) - 2, Math.round(my) - 2, 5, 5);
      ctx.fillStyle = m.color; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3);
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
    void scale; void MAP; void MW; void MH;
  },
};

function fmtRun(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; }
