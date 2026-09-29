// El taladro de la bóveda: ritmo + temperatura. Overlay sobre el interior.
import { W, H } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp, rand } from '../core/util.js';

export function drill(opts = {}) {
  return {
    overlay: true, done: false, result: null,
    progress: 0, heat: 0, pos: 0, dir: 1, speed: 1.1, zone: [0.4, 0.62], cool: 0, t: 0, hits: 0, msg: 'Presiona A cuando la aguja esté en lo verde', msgT: 3, goal: opts.goal || 1,
    update(dt) {
      this.t += dt;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.cool > 0) { this.cool -= dt; this.heat = Math.max(0, this.heat - dt * 0.35); if (this.cool <= 0) { this.msg = 'Broca nueva. ¡Sigue!'; this.msgT = 1.5; } return; }
      this.pos += this.dir * this.speed * dt;
      if (this.pos > 1) { this.pos = 1; this.dir = -1; } if (this.pos < 0) { this.pos = 0; this.dir = 1; }
      this.heat = Math.max(0, this.heat - dt * 0.12);
      if (input.pressed('a') || input.pressed('b')) {
        const [a, b] = this.zone;
        if (this.pos >= a && this.pos <= b) {
          this.progress += 0.085; this.heat += 0.16; this.hits++; audio.sfx('drill');
          const w = clamp(0.24 - this.progress * 0.1, 0.1, 0.24), c = rand(0.15 + w / 2, 0.85 - w / 2);
          this.zone = [c - w / 2, c + w / 2]; this.speed = 1.1 + this.progress * 0.9;
        } else { this.heat += 0.22; audio.sfx('jam'); this.msg = '¡Fuera de ritmo! Se calienta la broca'; this.msgT = 1; }
        if (this.heat >= 1) { this.heat = 1; this.cool = 3; audio.sfx('explode', { vol: 0.3 }); this.msg = '¡SE ROMPIÓ LA BROCA! Cambiando...'; this.msgT = 3; }
        if (this.progress >= this.goal) { this.done = true; this.result = true; audio.sfx('pass'); }
      }
    },
    render(ctx) {
      const x = 60, y = 16, w = 200;
      ctx.fillStyle = 'rgba(8,8,20,0.88)'; ctx.fillRect(x - 8, y - 4, w + 16, 52);
      font.text(ctx, 'TALADRO', x, y, '#ffd23f');
      font.text(ctx, Math.floor(this.progress / this.goal * 100) + '%', x + w, y, '#46d470', { align: 'right' });
      // rhythm bar
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, y + 11, w, 10);
      ctx.fillStyle = '#1e8c3c'; ctx.fillRect(x + Math.round(this.zone[0] * w), y + 11, Math.round((this.zone[1] - this.zone[0]) * w), 10);
      ctx.fillStyle = this.cool > 0 ? '#6a6a7a' : '#f4f4f0'; ctx.fillRect(x + Math.round(this.pos * w) - 1, y + 9, 3, 14);
      // heat
      font.text(ctx, 'CALOR', x, y + 26, '#f4f4f0');
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x + 32, y + 27, w - 32, 5);
      ctx.fillStyle = this.heat > 0.75 ? '#d8323c' : this.heat > 0.45 ? '#f08c28' : '#ffd23f'; ctx.fillRect(x + 32, y + 27, Math.round((w - 32) * this.heat), 5);
      // progress
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, y + 36, w, 4); ctx.fillStyle = '#46d470'; ctx.fillRect(x, y + 36, Math.round(w * clamp(this.progress / this.goal, 0, 1)), 4);
      if (this.msgT > 0) font.text(ctx, this.msg, W / 2, y + 52, '#fff08c', { align: 'center', outline: '#101018' });
    },
  };
}
