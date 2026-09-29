// Campo de tiro de La Tía Gris.
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { rand, pick, clamp } from '../core/util.js';
import { unlock } from '../story/achievements.js';

const SLOTS = [50, 100, 160, 220, 270];

export function range(opts = {}) {
  return {
    song: 'heist', done: false, result: null,
    phase: 'intro', t: 0, time: opts.time || 40,
    cx: W / 2, cy: 100, targets: [], spawnT: 0.8, score: 0, hitsBad: 0, bad: 0, civHit: 0, shots: 0, missed: 0, flash: 0, msg: null, msgT: 0,
    update(dt) {
      this.t += dt;
      if (this.phase === 'intro') { if (this.t > 2.5 || input.pressed('a')) { this.phase = 'go'; this.t = 0; } return; }
      if (this.phase === 'over') { if (this.t > 1.2 && (input.pressed('a') || input.pressed('b'))) this.done = true; return; }
      this.time -= dt;
      if (this.time <= 0) {
        this.phase = 'over'; this.t = 0;
        const perfect = this.hitsBad === this.bad && this.civHit === 0 && this.bad > 0 && this.missed === 0;
        this.result = { score: this.score, perfect, civ: this.civHit, hits: this.hitsBad, bad: this.bad };
        if (perfect) unlock('feo');
        if (G.state && this.score > (G.state.bestRange || 0)) G.state.bestRange = this.score;
        audio.sfx(this.score > 0 ? 'pass' : 'fail');
        return;
      }
      const sp = 190;
      this.cx = clamp(this.cx + input.ax * sp * dt, 20, W - 20);
      this.cy = clamp(this.cy + input.ay * sp * dt, 40, 160);
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = rand(0.5, 1.1);
        const free = SLOTS.filter((x) => !this.targets.some((t) => t.x === x));
        if (free.length) {
          const civil = Math.random() < 0.28;
          const tgt = { x: pick(free), civil, t: 0, life: rand(1.1, 1.8), up: 0, hit: false, row: Math.random() < 0.5 ? 0 : 1 };
          if (!civil) this.bad++;
          this.targets.push(tgt);
        }
      }
      for (const t of this.targets) {
        t.t += dt;
        t.up = t.hit ? Math.max(0, t.up - dt * 6) : t.t < 0.15 ? t.t / 0.15 : t.t > t.life ? Math.max(0, 1 - (t.t - t.life) / 0.15) : 1;
        if (!t.hit && !t.civil && t.t > t.life + 0.15 && !t.gone) { t.gone = true; this.missed++; }
      }
      this.targets = this.targets.filter((t) => !(t.t > t.life + 0.2) && !(t.hit && t.up <= 0));
      if (input.pressed('b') || input.pressed('a')) {
        this.shots++; this.flash = 0.06; audio.sfx('shot');
        for (const t of this.targets) {
          if (t.hit || t.up < 0.6) continue;
          const ty = t.row ? 130 : 96;
          if (Math.abs(this.cx - t.x) < 11 && this.cy > ty - 34 && this.cy < ty) {
            t.hit = true;
            if (t.civil) { this.score -= 200; this.civHit++; this.msg = pick(['¡ERA UN CIVIL!', '¡NO, ESE NO!', '¡ESA ERA LA SEÑORA DE LOS TAMALES!']); this.msgT = 1.2; audio.sfx('fail'); }
            else { this.score += 100; this.hitsBad++; audio.sfx('hit'); }
            break;
          }
        }
      }
      if (this.flash > 0) this.flash -= dt;
      if (this.msgT > 0) this.msgT -= dt;
    },
    render(ctx) {
      ctx.fillStyle = '#4a4a3a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a3a2e'; for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, 170);
      ctx.fillStyle = '#6a5a3a'; ctx.fillRect(0, 100, W, 4); ctx.fillRect(0, 134, W, 4);
      ctx.fillStyle = '#2a2a20'; ctx.fillRect(0, 138, W, 50);
      for (const t of this.targets) {
        const base = t.row ? 138 : 104, h = Math.round(34 * t.up);
        if (h <= 0) continue;
        const x = t.x - 8, y = base - h;
        ctx.fillStyle = '#6e4424'; ctx.fillRect(t.x - 1, y + h - 4, 2, 4);
        if (t.civil) {
          ctx.fillStyle = '#e8c8a8'; ctx.fillRect(x + 4, y, 8, 8);
          ctx.fillStyle = '#6a3a1a'; ctx.fillRect(x + 4, y, 8, 3);
          ctx.fillStyle = t.x % 2 ? '#46b450' : '#f46eaa'; ctx.fillRect(x + 2, y + 9, 12, Math.max(0, h - 13));
          ctx.fillStyle = '#ffd23f'; if (h > 20) ctx.fillRect(x + 12, y + 12, 4, 4);
        } else {
          ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x, y, 16, h);
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 4, y + 2, 8, 8); if (h > 12) ctx.fillRect(x + 2, y + 11, 12, Math.max(0, h - 14));
          ctx.fillStyle = '#d8323c'; if (h > 18) ctx.fillRect(x + 7, y + 16, 2, 2);
        }
        if (t.hit) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(t.x - 1, y + 4, 3, 3); }
      }
      // crosshair
      const cx = Math.round(this.cx), cy = Math.round(this.cy);
      ctx.fillStyle = this.flash > 0 ? '#ffffff' : '#ff3c3c';
      ctx.fillRect(cx - 7, cy, 5, 1); ctx.fillRect(cx + 3, cy, 5, 1); ctx.fillRect(cx, cy - 7, 1, 5); ctx.fillRect(cx, cy + 3, 1, 5);
      if (this.flash > 0) { ctx.fillStyle = 'rgba(255,240,180,0.25)'; ctx.fillRect(0, 0, W, H); }
      font.text(ctx, 'PUNTOS ' + this.score, 6, 4, '#f4f4f0', { outline: '#101018' });
      font.text(ctx, 'TIEMPO ' + Math.ceil(Math.max(0, this.time)), W - 6, 4, this.time < 10 ? '#d8323c' : '#f4f4f0', { align: 'right', outline: '#101018' });
      font.text(ctx, 'Dispárale a las siluetas. NO a los civiles.', W / 2, 16, '#ffd23f', { align: 'center', outline: '#101018' });
      if (this.msgT > 0) font.text(ctx, this.msg, W / 2, 60, '#d8323c', { align: 'center', scale: 2, outline: '#101018' });
      if (this.phase === 'intro') { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 60, W, 50); font.text(ctx, 'CAMPO DE TIRO', W / 2, 68, '#ffd23f', { align: 'center', scale: 2 }); font.text(ctx, 'Mueve la mira · A/B dispara', W / 2, 92, '#f4f4f0', { align: 'center' }); }
      if (this.phase === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 50, W, 80);
        font.text(ctx, 'RESULTADO', W / 2, 56, '#ffd23f', { align: 'center', scale: 2 });
        font.text(ctx, `Puntos: ${this.score}   Blancos: ${this.hitsBad}/${this.bad}   Civiles: ${this.civHit}`, W / 2, 82, '#f4f4f0', { align: 'center' });
        if (this.result?.perfect) font.text(ctx, '¡PERFECTO! "Pues me apuntó muy feo"', W / 2, 96, '#46d470', { align: 'center' });
        if (this.t > 1.2) font.text(ctx, 'A: continuar', W / 2, 114, '#a8a8b8', { align: 'center' });
      }
    },
  };
}
