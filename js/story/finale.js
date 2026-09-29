// Ending screens: "CONTINUARÁ", marathon card, share card.
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { canvas } from '../core/gfx.js';
import { fmtTime } from '../core/util.js';
import { CONFIG } from '../config.js';
import { countdownText } from '../world/city.js';
import { portrait, side } from '../data/sprites.js';
import { drawSky } from '../interior/interior.js';
import { drawProp } from '../interior/props.js';

export const finale = {
  name: 'finale', song: null,
  enter(opts = {}) { this.mode = opts.mode || 'marathon'; this.t = 0; this.onDone = opts.onDone || null; this.song = this.mode === 'marathon' ? 'sting' : this.mode === 'share' ? 'credits' : null; },
  update(dt) {
    this.t += dt;
    if (this.mode === 'continuara') { if (this.t > 4) this.finish(); return; }
    if (this.mode === 'marathon') {
      if (this.t > 1.5 && input.pressed('b') && CONFIG.streamUrl) window.open(CONFIG.streamUrl, '_blank', 'noopener');
      if (this.t > 2 && input.pressed('a')) this.finish();
      return;
    }
    if (this.mode === 'share') {
      if (this.t > 1 && input.pressed('b')) downloadCard();
      if (this.t > 1 && input.pressed('a')) this.finish();
    }
  },
  finish() { const f = this.onDone; this.onDone = null; if (f) f(); else setScene('title'); },
  render(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.mode === 'continuara') {
      const a = Math.min(1, this.t / 1.2);
      ctx.globalAlpha = a;
      font.text(ctx, 'CONTINUARÁ...', W / 2, 78, '#f4f4f0', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      return;
    }
    if (this.mode === 'marathon') {
      drawSky(ctx, 'night', this.t);
      drawProp(ctx, { t: 'skyline', w: 360, neon: false, col: '#1a0a2a' }, -20, 180, this.t, {});
      const pulse = 1 + Math.sin(this.t * 3) * 0.02;
      font.text(ctx, 'GTA VI', W / 2 + 2, 22 + 2, '#3a0a3a', { align: 'center', scale: 4 });
      font.text(ctx, 'GTA VI', W / 2, 22, '#ff7ae0', { align: 'center', scale: 4, outline: '#2a0a2a' });
      font.text(ctx, 'MARATHON', W / 2, 58, '#ffd23f', { align: 'center', scale: 3, outline: '#3a1a00' });
      font.text(ctx, 'KAZOOGOD02', W / 2, 88, '#5adcf0', { align: 'center', scale: 2, outline: '#0a1a2a' });
      const d = CONFIG.marathonDate ? new Date(CONFIG.marathonDate).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase() : 'FECHA POR ANUNCIAR';
      font.text(ctx, d, W / 2, 112, '#f4f4f0', { align: 'center', outline: '#101018' });
      font.text(ctx, countdownText(), W / 2, 124, '#ffd23f', { align: 'center', outline: '#101018' });
      if (CONFIG.streamUrl) font.text(ctx, CONFIG.streamUrl.replace(/^https?:\/\//, ''), W / 2, 138, '#5adcf0', { align: 'center', outline: '#101018' });
      if (this.t > 2) font.text(ctx, (CONFIG.streamUrl ? 'B: ABRIR EL STREAM · ' : '') + 'A: CONTINUAR', W / 2, 164, '#a8a8b8', { align: 'center', outline: '#101018' });
      void pulse;
      return;
    }
    if (this.mode === 'share') {
      ctx.drawImage(shareCanvas(), 0, 0);
      if (this.t > 1) font.text(ctx, 'B: DESCARGAR IMAGEN · A: CONTINUAR', W / 2, H - 9, '#f4f4f0', { align: 'center', outline: '#101018' });
    }
  },
};

let shareCache = null, shareKey = '';
function shareCanvas() {
  const s = G.state;
  const key = JSON.stringify([s.stats.playtime | 0, s.collect, s.trust]);
  if (shareCache && shareKey === key) return shareCache;
  const c = canvas(W, H), x = c.x;
  drawSky(x, 'dusk', 0);
  drawProp(x, { t: 'skyline', w: 360, neon: false, col: '#2a1a4a' }, -20, 180, 0, {});
  x.fillStyle = 'rgba(8,8,20,0.75)'; x.fillRect(10, 8, W - 20, H - 26);
  font.text(x, 'TERMINÉ "EL PLAN"', W / 2, 14, '#ffd23f', { align: 'center', scale: 2, outline: '#3a1a00' });
  font.text(x, 'La precuela 8-bit de la GTA VI Marathon', W / 2, 34, '#f4f4f0', { align: 'center' });
  x.drawImage(portrait('kazoo', 'happy'), 22, 50); x.drawImage(portrait('coqui', 'serious'), 22, 86); x.drawImage(portrait('ghenghis', 'laugh'), 22, 122);
  const rows = [
    ['Tiempo', fmtTime(s.stats.playtime)],
    ['Muertes', s.stats.deaths],
    ['Veces que te agarraron', s.stats.busted],
    ['Compras en Marketplace', s.stats.purchases + 1],
    ['Repartos', s.deliveries],
    ['Cassettes', s.collect.cassettes.length + '/15'],
    ['Estrellas doradas', s.collect.stars.length + '/10'],
    ['Grafitis', s.collect.graffiti.length + '/20'],
    ['Confianza de Coqui', '???'],
    ['Reseña al vendedor', '★'.repeat(s.flags.sellerStars || 5)],
  ];
  rows.forEach(([k, v], i) => { font.text(x, k, 64, 50 + i * 11, '#c8c8d8'); font.text(x, String(v), W - 22, 50 + i * 11, '#f4f4f0', { align: 'right' }); });
  font.text(x, CONFIG.hashtag, W / 2, 162, '#ff7ae0', { align: 'center', outline: '#101018' });
  shareCache = c; shareKey = key;
  return c;
}

function downloadCard() {
  try {
    const src = shareCanvas();
    const big = canvas(W * 4, H * 4);
    big.x.imageSmoothingEnabled = false;
    big.x.drawImage(src, 0, 0, W * 4, H * 4);
    const a = document.createElement('a');
    a.download = 'el-plan-kazoo.png';
    a.href = big.toDataURL('image/png');
    a.click();
    audio.sfx('camera');
  } catch (e) { console.warn(e); }
}
void side;
