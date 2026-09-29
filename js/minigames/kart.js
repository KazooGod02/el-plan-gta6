// KAZOO KART — vertical scrolling arcade racer (played on the bar's machine).
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { vehicleSprites } from '../data/sprites.js';
import { rand, pick, clamp } from '../core/util.js';
import { unlock } from '../story/achievements.js';

const ROAD_X = 90, ROAD_W = 140;

export function kart(opts = {}) {
  const st = {
    song: 'arcade', done: false, result: 0,
    phase: 'intro', t: 0, time: opts.time || 60,
    x: W / 2, speed: 120, scroll: 0, dist: 0, score: 0, coins: [], cars: [], spawnT: 1, coinT: 0.5, crashT: 0, lives: 3, target: opts.target || 0,
    update(dt) {
      this.t += dt;
      if (this.phase === 'intro') { if (this.t > 2 || input.pressed('a')) { this.phase = 'race'; this.t = 0; } return; }
      if (this.phase === 'over') { if (this.t > 1.2 && (input.pressed('a') || input.pressed('b'))) { this.done = true; this.result = Math.floor(this.score); } return; }
      this.time -= dt;
      if (this.time <= 0 || this.lives <= 0) { this.phase = 'over'; this.t = 0; audio.sfx(this.score >= this.target ? 'pass' : 'fail'); if (this.score >= 5000) unlock('kart'); if (this.score > (G.state?.bestKart || 0) && G.state) G.state.bestKart = Math.floor(this.score); return; }
      const acc = input.down('up') || input.ay < -0.3 ? 1 : input.down('down') ? -1 : 0;
      this.speed = clamp(this.speed + acc * 160 * dt - (acc === 0 ? 20 * dt : 0), 90, 320);
      if (this.crashT > 0) { this.crashT -= dt; this.speed = Math.min(this.speed, 90); }
      this.x = clamp(this.x + input.ax * 150 * dt, ROAD_X + 8, ROAD_X + ROAD_W - 8);
      this.scroll += this.speed * dt; this.dist += this.speed * dt;
      this.score += this.speed * dt * 0.5;
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = rand(0.4, 1.1) * (220 / this.speed);
        this.cars.push({ x: ROAD_X + 14 + Math.floor(rand(0, 4)) * 32 + 4, y: -30, sp: rand(40, 110), type: pick(['sedan', 'compact', 'vocho', 'taxi', 'police', 'pickup']), col: pick(['#d8323c', '#3c64dc', '#46b450', '#f4f4f0', '#8c46c8']) });
      }
      this.coinT -= dt;
      if (this.coinT <= 0) { this.coinT = rand(0.3, 0.9); this.coins.push({ x: ROAD_X + 12 + rand(0, ROAD_W - 24), y: -10 }); }
      for (const c of this.cars) c.y += (this.speed - c.sp) * dt;
      for (const c of this.coins) c.y += this.speed * dt;
      for (const c of this.cars) if (!c.hit && Math.abs(c.x - this.x) < 11 && Math.abs(c.y - 150) < 20 && this.crashT <= 0) { c.hit = true; this.crashT = 1.2; this.lives--; audio.sfx('crash'); }
      for (const c of this.coins) if (!c.got && Math.abs(c.x - this.x) < 10 && Math.abs(c.y - 150) < 14) { c.got = true; this.score += 150; audio.sfx('coin'); }
      this.cars = this.cars.filter((c) => c.y < H + 40 && c.y > -60);
      this.coins = this.coins.filter((c) => c.y < H + 20 && !c.got);
      if (input.pressed('back') || input.pressed('pause')) { this.phase = 'over'; this.t = 0; }
    },
    render(ctx) {
      ctx.fillStyle = '#0a0a18'; ctx.fillRect(0, 0, W, H);
      // grass & road
      ctx.fillStyle = '#1e6e3c'; ctx.fillRect(ROAD_X - 30, 0, ROAD_W + 60, H);
      ctx.fillStyle = '#3a3a44'; ctx.fillRect(ROAD_X, 0, ROAD_W, H);
      const off = this.scroll % 32;
      ctx.fillStyle = '#e8c040';
      for (let i = 1; i < 4; i++) for (let y = -32; y < H; y += 32) ctx.fillRect(ROAD_X + i * 35 - 1, y + off, 2, 16);
      ctx.fillStyle = '#f4f4f0'; for (let y = -32; y < H; y += 16) { ctx.fillRect(ROAD_X - 3, y + off, 3, 8); ctx.fillRect(ROAD_X + ROAD_W, y + off, 3, 8); }
      for (let y = -40; y < H; y += 40) { ctx.fillStyle = '#2a8a3a'; ctx.fillRect(ROAD_X - 22, y + (this.scroll % 40), 8, 8); ctx.fillRect(ROAD_X + ROAD_W + 14, y + 20 + (this.scroll % 40), 8, 8); }
      for (const c of this.coins) { ctx.fillStyle = '#5a3a00'; ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y) - 3, 7, 7); ctx.fillStyle = '#ffd23f'; ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 2, 5, 5); }
      for (const c of this.cars) { const s = vehicleSprites(c.type, c.col, 0)[24]; ctx.drawImage(s, Math.round(c.x - s.width / 2), Math.round(c.y - s.height / 2)); }
      const me = vehicleSprites('sports', '#e0a82e', 0)[24];
      if (!(this.crashT > 0 && Math.floor(this.t * 12) % 2)) ctx.drawImage(me, Math.round(this.x - me.width / 2), Math.round(150 - me.height / 2));
      // hud
      ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, 80, H); ctx.fillRect(W - 80, 0, 80, H);
      font.text(ctx, 'KAZOO', 40, 10, '#ffd23f', { align: 'center', scale: 2 });
      font.text(ctx, 'KART', 40, 26, '#ff3cc8', { align: 'center', scale: 2 });
      font.text(ctx, 'PUNTOS', 40, 60, '#a8a8b8', { align: 'center' });
      font.text(ctx, String(Math.floor(this.score)), 40, 70, '#f4f4f0', { align: 'center' });
      font.text(ctx, 'TIEMPO', 40, 90, '#a8a8b8', { align: 'center' });
      font.text(ctx, String(Math.ceil(Math.max(0, this.time))), 40, 100, this.time < 10 ? '#d8323c' : '#f4f4f0', { align: 'center' });
      font.text(ctx, 'VIDAS', 40, 120, '#a8a8b8', { align: 'center' });
      font.text(ctx, '♥'.repeat(Math.max(0, this.lives)), 40, 130, '#d8323c', { align: 'center' });
      font.text(ctx, 'VEL', W - 40, 60, '#a8a8b8', { align: 'center' });
      font.text(ctx, Math.floor(this.speed / 2) + ' km/h', W - 40, 70, '#5adcf0', { align: 'center' });
      if (this.target) { font.text(ctx, 'META', W - 40, 90, '#a8a8b8', { align: 'center' }); font.text(ctx, String(this.target), W - 40, 100, this.score >= this.target ? '#46d470' : '#ffd23f', { align: 'center' }); }
      font.text(ctx, 'RÉCORD', W - 40, 120, '#a8a8b8', { align: 'center' });
      font.text(ctx, String(G.state?.bestKart || 0), W - 40, 130, '#f4f4f0', { align: 'center' });
      if (this.phase === 'intro') { font.text(ctx, '¡LISTOS!', W / 2, 70, '#ffd23f', { align: 'center', scale: 3, outline: '#101018' }); font.text(ctx, 'Esquiva coches, junta monedas. ↑ acelera', W / 2, 100, '#f4f4f0', { align: 'center', outline: '#101018' }); }
      if (this.phase === 'over') {
        font.text(ctx, 'FIN DEL JUEGO', W / 2, 60, '#ffd23f', { align: 'center', scale: 2, outline: '#101018' });
        font.text(ctx, 'PUNTOS: ' + Math.floor(this.score), W / 2, 86, '#f4f4f0', { align: 'center', outline: '#101018' });
        if (this.target) font.text(ctx, this.score >= this.target ? '¡LE GANASTE!' : 'NO ALCANZASTE LA META', W / 2, 100, this.score >= this.target ? '#46d470' : '#d8323c', { align: 'center', outline: '#101018' });
        if (this.t > 1.2) font.text(ctx, 'A: continuar', W / 2, 120, '#a8a8b8', { align: 'center', outline: '#101018' });
      }
    },
  };
  return st;
}
