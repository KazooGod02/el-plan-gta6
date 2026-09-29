// Ending screens: "CONTINUARÁ", the "El Escape" teaser card, and the WANTED poster.
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { fmtTime, money } from '../core/util.js';
import { CONFIG } from '../config.js';
import { countdownText } from '../world/city.js';
import { portrait } from '../data/sprites.js';
import { drawSky } from '../interior/interior.js';
import { drawProp } from '../interior/props.js';

export const finale = {
  name: 'finale', song: null,
  // mode 'marathon' is kept as the id of the teaser card so older flows still work
  enter(opts = {}) { this.mode = opts.mode || 'marathon'; this.t = 0; this.onDone = opts.onDone || null; this.song = this.mode === 'marathon' ? 'sting' : this.mode === 'share' ? 'credits' : null; posterCache = null; },
  update(dt) {
    this.t += dt;
    if (this.mode === 'continuara') { if (this.t > 4) this.finish(); return; }
    if (overlayOpen()) return;
    if (this.mode === 'marathon') {
      if (this.t > 1.5 && input.pressed('b') && CONFIG.streamUrl) window.open(CONFIG.streamUrl, '_blank', 'noopener');
      if (this.t > 2 && input.pressed('a')) this.finish();
      return;
    }
    if (this.mode === 'share') {
      if (this.t > 1 && input.pressed('b')) openPosterOverlay();
      if (this.t > 1 && input.pressed('a')) this.finish();
    }
  },
  finish() { closeOverlay(); const f = this.onDone; this.onDone = null; if (f) f(); else setScene('title'); },
  render(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.mode === 'continuara') {
      ctx.globalAlpha = Math.min(1, this.t / 1.2);
      font.text(ctx, 'CONTINUARÁ...', W / 2, 78, '#f4f4f0', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      return;
    }
    if (this.mode === 'marathon') {
      // teaser card for the trailer: no dates or events until they're confirmed in config.js
      drawSky(ctx, 'night', this.t);
      drawProp(ctx, { t: 'skyline', w: 360, neon: false, col: '#1a0a2a' }, -20, 180, this.t, {});
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, this.t / 1.5);
      ctx.globalAlpha = a;
      font.text(ctx, 'KAZOOGOD02 PRESENTA', W / 2, 26, '#5adcf0', { align: 'center', outline: '#0a1a2a' });
      font.text(ctx, 'EL ESCAPE', W / 2 + 2, 46 + 2, '#3a0a3a', { align: 'center', scale: 4 });
      font.text(ctx, 'EL ESCAPE', W / 2, 46, '#ffd23f', { align: 'center', scale: 4, outline: '#3a1a00' });
      font.text(ctx, 'EL TRÁILER', W / 2, 86, '#ff7ae0', { align: 'center', scale: 2, outline: '#2a0a2a' });
      const d = CONFIG.marathonDate ? new Date(CONFIG.marathonDate).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).toUpperCase() : 'PRÓXIMAMENTE';
      font.text(ctx, d, W / 2, 112, '#f4f4f0', { align: 'center', outline: '#101018' });
      if (CONFIG.marathonDate) font.text(ctx, countdownText(), W / 2, 124, '#ffd23f', { align: 'center', outline: '#101018' });
      if (CONFIG.streamUrl) font.text(ctx, CONFIG.streamUrl.replace(/^https?:\/\//, ''), W / 2, 138, '#5adcf0', { align: 'center', outline: '#101018' });
      ctx.globalAlpha = 1;
      if (this.t > 2) font.text(ctx, (CONFIG.streamUrl ? 'B: ABRIR EL CANAL · ' : '') + 'A: CONTINUAR', W / 2, 164, '#a8a8b8', { align: 'center', outline: '#101018' });
      return;
    }
    if (this.mode === 'share') {
      // dark alley wall behind the poster
      ctx.fillStyle = '#1e1a22'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2a2430';
      for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 ? 0 : 12; x < W; x += 24) ctx.fillRect(x, y, 23, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
      const px = 18, py = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(px + 4, py + 4, POSTER_W, POSTER_H);
      ctx.drawImage(posterCanvas(1), px, py);
      // side panel
      const x0 = px + POSTER_W + 14, cx = x0 + (W - x0) / 2;
      font.text(ctx, '¡TERMINASTE', cx, 26, '#ffd23f', { align: 'center', scale: 2, outline: '#3a1a00' });
      font.text(ctx, 'EL PLAN!', cx, 44, '#ffd23f', { align: 'center', scale: 2, outline: '#3a1a00' });
      font.wrap('La policía de Puerto Vicio ya pegó tu cartel por toda la ciudad.', W - x0 - 8).forEach((l, i) => font.text(ctx, l, cx, 70 + i * 10, '#d8d8e8', { align: 'center' }));
      if (this.t > 1) {
        btn(ctx, cx, 124, 'B: DESCARGAR CARTEL', '#46d470');
        btn(ctx, cx, 142, 'A: CONTINUAR', '#a8a8b8');
      }
    }
  },
};

function btn(ctx, cx, y, label, col) {
  const w = font.measure(label) + 12;
  ctx.fillStyle = '#101018'; ctx.fillRect(Math.round(cx - w / 2), y - 3, w, 13);
  ctx.fillStyle = col; ctx.fillRect(Math.round(cx - w / 2), y + 9, w, 1);
  font.text(ctx, label, cx, y, col, { align: 'center' });
}

// ---------------------------------------------------------------- WANTED poster
const POSTER_W = 150, POSTER_H = 172;
let posterCache = null;

function stats() {
  const s = G.state;
  const f = s.flags || {};
  return [
    ['Tiempo de la run', fmtTime(s.stats.playtime)],
    ['Muertes', s.stats.deaths],
    ['Arrestos', s.stats.busted],
    ['Carros "prestados"', s.stats.cars],
    ['Delitos', s.stats.crimes || 0],
    ['Cassettes', s.collect.cassettes.length + '/15'],
    ['Estrellas doradas', s.collect.stars.length + '/10'],
    ['Grafitis', s.collect.graffiti.length + '/20'],
    ['Reseña al vendedor', '★'.repeat(f.sellerStars || 5)],
  ];
}

// draws the poster at `res` times its size (1 for the screen, 6 for the download)
function posterCanvas(res) {
  if (res === 1 && posterCache) return posterCache;
  const c = document.createElement('canvas');
  c.width = POSTER_W * res; c.height = POSTER_H * res;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.setTransform(res, 0, 0, res, 0, 0);
  drawPoster(x);
  if (res === 1) posterCache = c;
  return c;
}

function drawPoster(x) {
  const s = G.state;
  const w = POSTER_W, h = POSTER_H;
  const R = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); };
  // old paper with burnt edges and torn corners
  R(0, 0, w, h, '#e6cf98');
  for (let i = 0; i < 260; i++) { const a = (i * 97) % w, b = (i * 57 + i * i) % h; R(a, b, 1, 1, i % 3 ? '#d8bc80' : '#f0dcae'); }
  const edge = '#b08850';
  R(0, 0, w, 2, edge); R(0, h - 2, w, 2, edge); R(0, 0, 2, h, edge); R(w - 2, 0, 2, h, edge);
  R(2, 2, w - 4, 1, '#c8a468'); R(2, h - 3, w - 4, 1, '#c8a468');
  x.clearRect(0, 0, 4, 2); x.clearRect(0, 0, 2, 4); x.clearRect(w - 5, h - 2, 5, 2); x.clearRect(w - 2, h - 6, 2, 6);
  R(w / 2 - 2, 3, 4, 4, '#6a6a74'); R(w / 2 - 1, 4, 2, 2, '#9a9aa6');
  const ink = '#3a1e0e';
  font.text(x, 'SE BUSCA', w / 2, 9, ink, { align: 'center', scale: 3 });
  font.text(x, 'VIVO O EN TSURU', w / 2, 31, '#8c1c28', { align: 'center' });
  // mugshot + name
  R(9, 41, 38, 38, ink); R(10, 42, 36, 36, '#c8b080');
  for (let yy = 44; yy < 78; yy += 5) R(10, yy, 36, 1, '#b8a070');
  x.drawImage(portrait('kazoo', 'smug'), 12, 44);
  font.text(x, 'KAZOO', 54, 42, ink, { scale: 2 });
  font.text(x, 'Alias: "5 estrellas"', 54, 57, '#5a3a1e');
  const reward = Math.max(50000, (s.flags && s.flags.botin) || 0);
  font.text(x, 'RECOMPENSA:', 54, 66, '#8c1c28');
  font.text(x, money(reward), 54, 75, '#8c1c28');
  R(8, 85, w - 16, 1, '#b08850');
  stats().forEach(([k, v], i) => {
    const yy = 89 + i * 9;
    font.text(x, k, 9, yy, '#5a3a1e');
    font.text(x, String(v), w - 9, yy, ink, { align: 'right' });
  });
  void h;
}

// ---------------------------------------------------------------- download
// Pressing B opens a real HTML overlay: the button inside is a genuine tap/click, which
// browsers (and phones) require before they allow a download or the share sheet.
let overlay = null, blobUrl = null;
function overlayOpen() { return !!overlay; }
function closeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
}
function makePosterBlob(cb) {
  // export big (900x1032) so it looks sharp when shared
  const c = posterCanvas(6);
  if (c.toBlob) c.toBlob((b) => cb(b, c), 'image/png');
  else cb(null, c);
}
function openPosterOverlay() {
  if (overlay) return;
  audio.sfx('camera');
  makePosterBlob((blob, c) => {
    const url = blob ? (blobUrl = URL.createObjectURL(blob)) : c.toDataURL('image/png');
    const file = blob && typeof File !== 'undefined' ? new File([blob], 'kazoo-se-busca.png', { type: 'image/png' }) : null;
    overlay = document.createElement('div');
    overlay.id = 'poster';
    overlay.innerHTML = `
      <div class="pbox">
        <img alt="Cartel de SE BUSCA de Kazoo" src="${url}">
        <div class="pbtns">
          <a class="pbtn pdl" download="kazoo-se-busca.png" href="${url}">Descargar</a>
          <button class="pbtn psh" type="button" hidden>Compartir</button>
          <button class="pbtn pcl" type="button">Cerrar</button>
        </div>
        <p class="phint">En el celular también puedes dejar presionada la imagen para guardarla.</p>
      </div>`;
    document.body.appendChild(overlay);
    const sh = overlay.querySelector('.psh');
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      sh.hidden = false;
      sh.addEventListener('click', () => { navigator.share({ files: [file], title: 'SE BUSCA: Kazoo', text: CONFIG.hashtag || '' }).catch(() => {}); });
    }
    overlay.querySelector('.pcl').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    const onKey = (e) => { if (!overlay) { window.removeEventListener('keydown', onKey, true); return; } if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { e.stopImmediatePropagation(); closeOverlay(); window.removeEventListener('keydown', onKey, true); } };
    window.addEventListener('keydown', onKey, true);
  });
}
