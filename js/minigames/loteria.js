// Lotería con Doña Mari.
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { pick } from '../core/util.js';
import { portrait } from '../data/sprites.js';
import { unlock } from '../story/achievements.js';

const CARDS = [
  ['EL GALLO', '#d8323c'], ['EL DIABLITO', '#8c1c28'], ['LA DAMA', '#f46eaa'], ['EL CATRÍN', '#1a1a2e'], ['EL PARAGUAS', '#3c64dc'],
  ['LA SIRENA', '#28b4a0'], ['LA ESCALERA', '#8c5a32'], ['LA BOTELLA', '#46b450'], ['EL BARRIL', '#6e4424'], ['EL ÁRBOL', '#1e6e3c'],
  ['EL MELÓN', '#a0dc50'], ['EL VALIENTE', '#d8323c'], ['LA MUERTE', '#f4f4f0'], ['LA PERA', '#c8dc50'], ['LA BANDERA', '#2c8c3a'],
  ['LA LUNA', '#fff08c'], ['EL CORAZÓN', '#d8323c'], ['LA SANDÍA', '#46b450'], ['EL TAMBOR', '#f08c28'], ['LA ESTRELLA', '#ffd23f'],
  ['EL NOPAL', '#2c8c3a'], ['LA ROSA', '#f46eaa'], ['LA CALAVERA', '#f4f4f0'], ['EL SOL', '#ffd23f'], ['LA CORONA', '#e0a82e'],
  ['EL TSURU', '#d8d8d0'], ['LA MOCHILA', '#3a2c20'], ['EL KAZOO', '#ffd23f'], ['LA PATRULLA', '#1e2c78'], ['5 ESTRELLAS', '#ffd23f'],
];
const CALLS = {
  'EL GALLO': 'El que le cantó a San Pedro...', 'EL DIABLITO': 'Pórtate bien cuatito...', 'LA DAMA': 'Puliendo el paso...', 'LA MUERTE': 'La muerte, tilica y flaca...',
  'EL TSURU': 'El que nunca aguanta...', 'LA MOCHILA': 'La que carga Ghenghis...', 'EL KAZOO': 'El instrumento de los dioses...', 'LA PATRULLA': 'La que siempre llega...',
  '5 ESTRELLAS': 'Las que no significan nada...', 'LA LUNA': 'El farol de los enamorados...', 'EL CORAZÓN': 'No me extrañes corazón...', 'EL VALIENTE': 'Por qué le corres cobarde...',
};

function tabla() {
  const ids = [...Array(CARDS.length).keys()].sort(() => Math.random() - 0.5).slice(0, 16);
  return ids.map((id) => ({ id, marked: false }));
}
function line(tb) {
  const m = (i) => tb[i].marked;
  for (let r = 0; r < 4; r++) if ([0, 1, 2, 3].every((c) => m(r * 4 + c))) return true;
  for (let c = 0; c < 4; c++) if ([0, 1, 2, 3].every((r) => m(r * 4 + c))) return true;
  if ([0, 5, 10, 15].every(m) || [3, 6, 9, 12].every(m)) return true;
  if ([0, 3, 12, 15].every(m)) return true;
  return false;
}

export function loteria(opts = {}) {
  const deck = [...Array(CARDS.length).keys()].sort(() => Math.random() - 0.5);
  return {
    song: 'mari', done: false, result: null,
    me: tabla(), mari: tabla(), deck, called: [], cur: null, t: 0, callT: 1.2, sel: 0, phase: 'play', winner: null, bet: opts.bet ?? 50, msg: null,
    update(dt) {
      this.t += dt;
      if (this.phase === 'over') { if (this.t > 1.5 && (input.pressed('a') || input.pressed('b'))) { this.done = true; } return; }
      if (input.pressed('right')) { this.sel = (this.sel + 1) % 16; audio.sfx('move'); }
      if (input.pressed('left')) { this.sel = (this.sel + 15) % 16; audio.sfx('move'); }
      if (input.pressed('down')) { this.sel = (this.sel + 4) % 16; audio.sfx('move'); }
      if (input.pressed('up')) { this.sel = (this.sel + 12) % 16; audio.sfx('move'); }
      if (input.pressed('a') || input.pressed('b')) {
        const c = this.me[this.sel];
        if (!c.marked && this.called.includes(c.id)) { c.marked = true; audio.sfx('select'); if (line(this.me)) this.finish('kazoo'); }
        else if (!c.marked) { audio.sfx('jam'); this.msg = 'Esa no ha salido, tramposo.'; }
      }
      this.callT -= dt;
      if (this.callT <= 0) {
        this.callT = 2.4;
        const id = this.deck.shift();
        if (id === undefined) { this.finish('nadie'); return; }
        this.cur = id; this.called.push(id); audio.sfx('blip', { f: 440 });
        this.msg = null;
        // Mari marks with a small delay/chance
        const mc = this.mari.find((c) => c.id === id);
        if (mc) setTimeout(() => { mc.marked = true; if (!this.winner && line(this.mari)) this.finish('mari'); }, 700 + Math.random() * 900);
      }
    },
    finish(who) {
      if (this.phase === 'over') return;
      this.phase = 'over'; this.t = 0; this.winner = who;
      if (who === 'kazoo') { audio.sfx('pass'); unlock('lotería'); if (G.state) G.state.money += this.bet * 2; }
      else { audio.sfx('fail'); if (G.state && who === 'mari') G.state.money = Math.max(0, G.state.money - this.bet); }
      this.result = who;
    },
    render(ctx) {
      ctx.fillStyle = '#8c1c28'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#6e1420'; for (let i = 0; i < W; i += 8) ctx.fillRect(i, 0, 4, H);
      font.text(ctx, '¡LOTERÍA!', 60, 6, '#ffd23f', { align: 'center', scale: 2, outline: '#3a0a10' });
      // board
      this.me.forEach((c, i) => {
        const x = 10 + (i % 4) * 30, y = 28 + Math.floor(i / 4) * 36;
        const [name, col] = CARDS[c.id];
        ctx.fillStyle = i === this.sel ? '#ffd23f' : '#101018'; ctx.fillRect(x - 1, y - 1, 30, 36);
        ctx.fillStyle = '#f4f0d8'; ctx.fillRect(x, y, 28, 34);
        ctx.fillStyle = col; ctx.fillRect(x + 4, y + 3, 20, 16);
        drawIcon(ctx, name, x + 14, y + 11);
        font.wrap(name, 28).slice(0, 2).forEach((l, k) => font.text(ctx, l.replace('EL ', '').replace('LA ', ''), x + 14, y + 21 + k * 7, '#101018', { align: 'center' }));
        if (c.marked) { ctx.fillStyle = 'rgba(80,50,20,0.85)'; ctx.fillRect(x + 8, y + 10, 12, 12); ctx.fillStyle = '#c89040'; ctx.fillRect(x + 10, y + 12, 8, 8); }
      });
      // caller
      ctx.fillStyle = '#101018'; ctx.fillRect(140, 26, 90, 110);
      font.text(ctx, 'CARTA', 185, 30, '#a8a8b8', { align: 'center' });
      if (this.cur !== null) {
        const [name, col] = CARDS[this.cur];
        ctx.fillStyle = '#f4f0d8'; ctx.fillRect(152, 42, 66, 70);
        ctx.fillStyle = col; ctx.fillRect(158, 48, 54, 40);
        drawIcon(ctx, name, 185, 68, 2);
        font.text(ctx, name, 185, 96, '#101018', { align: 'center' });
        font.wrap(CALLS[name] || '¡Se va y se corre con...!', 86).forEach((l, k) => font.text(ctx, l, 185, 116 + k * 8, '#ffd23f', { align: 'center' }));
      }
      // mari
      ctx.drawImage(portrait('mari', this.winner === 'mari' ? 'laugh' : 'happy'), 256, 30);
      font.text(ctx, 'DOÑA MARI', 272, 64, '#f07aa8', { align: 'center' });
      font.text(ctx, 'Marcadas: ' + this.mari.filter((c) => c.marked).length, 272, 74, '#f4f4f0', { align: 'center' });
      font.text(ctx, 'Apuesta: $' + this.bet, 272, 90, '#46d470', { align: 'center' });
      font.text(ctx, 'Línea de 4 gana', 272, 100, '#a8a8b8', { align: 'center' });
      if (this.msg) font.text(ctx, this.msg, W / 2, H - 10, '#fff08c', { align: 'center', outline: '#3a0a10' });
      if (this.phase === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 60, W, 60);
        const txt = this.winner === 'kazoo' ? '¡LOTERÍA! GANASTE $' + this.bet * 2 : this.winner === 'mari' ? 'DOÑA MARI: "¡LOTERÍAAA!"' : 'Se acabaron las cartas';
        font.text(ctx, txt, W / 2, 76, this.winner === 'kazoo' ? '#46d470' : '#ffd23f', { align: 'center', scale: 1 });
        if (this.t > 1.5) font.text(ctx, 'A: continuar', W / 2, 100, '#a8a8b8', { align: 'center' });
      }
    },
  };
}

function drawIcon(ctx, name, x, y, s = 1) {
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a * s), Math.round(y + b * s), w * s, h * s); };
  if (name.includes('ESTRELLA')) { R(-1, -5, 2, 10, '#fff08c'); R(-5, -1, 10, 2, '#fff08c'); R(-3, -3, 6, 6, '#fff08c'); }
  else if (name.includes('CORAZÓN')) { R(-4, -3, 3, 3, '#f4f4f0'); R(1, -3, 3, 3, '#f4f4f0'); R(-4, 0, 8, 2, '#f4f4f0'); R(-2, 2, 4, 2, '#f4f4f0'); }
  else if (name.includes('LUNA') || name.includes('SOL')) { R(-4, -4, 8, 8, name.includes('SOL') ? '#f08c28' : '#f4f4f0'); }
  else if (name.includes('CALAVERA') || name.includes('MUERTE')) { R(-3, -4, 6, 6, '#1a1a1a'); R(-2, -2, 1, 1, '#f4f4f0'); R(1, -2, 1, 1, '#f4f4f0'); R(-2, 2, 4, 2, '#1a1a1a'); }
  else if (name.includes('TSURU') || name.includes('PATRULLA')) { R(-6, -2, 12, 4, '#f4f4f0'); R(-4, -4, 7, 2, '#3a5470'); R(-5, 2, 3, 2, '#1a1a1a'); R(2, 2, 3, 2, '#1a1a1a'); }
  else if (name.includes('KAZOO')) { R(-5, -1, 10, 3, '#5a3a00'); R(2, -3, 2, 2, '#5a3a00'); }
  else if (name.includes('MOCHILA')) { R(-3, -4, 7, 8, '#6a5440'); R(-1, -5, 3, 1, '#6a5440'); R(-1, -1, 3, 1, '#46b450'); }
  else { R(-3, -4, 6, 8, 'rgba(255,255,255,0.5)'); R(-1, -2, 2, 2, 'rgba(0,0,0,0.4)'); }
}
