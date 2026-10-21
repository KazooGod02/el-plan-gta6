// Casino La Fortuna: roulette, blackjack, video poker, horse races and slots.
// Every game takes your real money (G.state.money). Minimum bet $50.
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp, rand, pick, money } from '../core/util.js';
import { unlock } from '../story/achievements.js';

const BETS = [50, 100, 250, 500, 1000, 2500];
const L = (s) => (input.label ? input.label(s) : s.replace(/\{A\}/g, 'E').replace(/\{B\}/g, 'ESPACIO'));

// ---------------------------------------------------------------- shared bits
function felt(ctx, title) {
  ctx.fillStyle = '#0e3a22'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#145a32'; for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < W; x += 4) ctx.fillRect(x, y, 1, 1);
  ctx.fillStyle = '#c8a040'; ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, H - 2, W, 2); ctx.fillRect(0, 0, 2, H); ctx.fillRect(W - 2, 0, 2, H);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(2, 2, W - 4, 14);
  font.text(ctx, title, 8, 5, '#ffd23f');
  font.text(ctx, money(G.state.money), W - 8, 5, '#46d470', { align: 'right' });
}
function hint(ctx, s) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(2, H - 15, W - 4, 13);
  font.text(ctx, L(s), W / 2, H - 12, '#c8c8d8', { align: 'center' });
}
function banner(ctx, text, col) {
  const w = font.measure(text) * 2 + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(Math.round(W / 2 - w / 2), 64, w, 26);
  font.text(ctx, text, W / 2, 70, col, { align: 'center', scale: 2, outline: '#101018' });
}
// the bet you can afford, closest to what you had picked
function fitBet(i) { while (i > 0 && BETS[i] > G.state.money) i--; return i; }
function pay(amount) { G.state.money = Math.max(0, G.state.money - amount); audio.sfx('chips'); }
function win(bet, total) {
  // total = what comes back (bet included); profit = total - bet
  G.state.money += total; audio.sfx(total > bet ? 'pass' : 'coin');
  const s = G.state.stats; s.casino = (s.casino || 0) + (total - bet);
  if (total - bet >= 1000) unlock('casino');
}
function lose(bet) { const s = G.state.stats; s.casino = (s.casino || 0) - bet; audio.sfx('fail'); }
function betRow(ctx, y, i, sel) {
  font.text(ctx, 'APUESTA', 8, y, sel ? '#ffd23f' : '#a8a8b8');
  BETS.forEach((b, k) => {
    const x = 70 + k * 40, on = k === i, ok = b <= G.state.money;
    ctx.fillStyle = on ? '#ffd23f' : ok ? '#2a2a3a' : '#1a1a20'; ctx.fillRect(x, y - 2, 36, 11);
    font.text(ctx, '$' + b, x + 18, y, on ? '#101018' : ok ? '#f4f4f0' : '#4a4a5a', { align: 'center' });
  });
}

// ---------------------------------------------------------------- cards
const SUITS = [['♠', '#101018'], ['♥', '#d8323c'], ['♦', '#d8323c'], ['♣', '#101018']];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function deck() { const d = []; for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) d.push({ r, s }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
function drawCard(ctx, x, y, card, hidden, hl) {
  ctx.fillStyle = '#101018'; ctx.fillRect(x - 1, y - 1, 26, 36);
  if (hidden) {
    ctx.fillStyle = '#8c1c28'; ctx.fillRect(x, y, 24, 34);
    ctx.fillStyle = '#c8a040'; for (let i = 2; i < 22; i += 4) for (let j = 2; j < 32; j += 4) ctx.fillRect(x + i, y + j, 2, 2);
    return;
  }
  ctx.fillStyle = hl ? '#fff8c0' : '#f4f4f0'; ctx.fillRect(x, y, 24, 34);
  const [sym, col] = SUITS[card.s];
  font.text(ctx, RANKS[card.r], x + 2, y + 2, col);
  font.text(ctx, sym, x + 12, y + 13, col, { align: 'center', scale: 2 });
  font.text(ctx, RANKS[card.r], x + 22, y + 25, col, { align: 'right' });
}

// ---------------------------------------------------------------- ROULETTE
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RTYPES = ['ROJO', 'NEGRO', 'PAR', 'IMPAR', '1-18', '19-36', 'NÚMERO'];
function numCol(n) { return n === 0 ? '#2c8c3a' : REDS.has(n) ? '#d8323c' : '#101018'; }
export function roulette() {
  return {
    done: false, result: null, phase: 'bet', row: 0, type: 0, num: 17, bet: fitBet(1), ang: 0, spd: 0, out: null, msg: '', t: 0,
    update(dt) {
      this.t += dt;
      if (this.phase === 'bet') {
        if (input.pressed('b') || input.pressed('back') || input.pressed('pause')) { this.done = true; return; }
        const rows = this.type === 6 ? 3 : 2;
        if (input.pressed('down')) { this.row = (this.row + 1) % rows; audio.sfx('move'); }
        if (input.pressed('up')) { this.row = (this.row + rows - 1) % rows; audio.sfx('move'); }
        const d = input.pressed('right') ? 1 : input.pressed('left') ? -1 : 0;
        if (d) {
          audio.sfx('move');
          const r = this.type === 6 ? ['type', 'num', 'bet'][this.row] : ['type', 'bet'][this.row];
          if (r === 'type') { this.type = (this.type + d + RTYPES.length) % RTYPES.length; if (this.type !== 6 && this.row > 1) this.row = 1; }
          if (r === 'num') this.num = (this.num + d + 37) % 37;
          if (r === 'bet') this.bet = clamp(this.bet + d, 0, BETS.length - 1);
        }
        if (input.pressed('a')) {
          const b = BETS[this.bet];
          if (b > G.state.money) { audio.sfx('jam'); this.msg = 'No te alcanza para esa apuesta'; return; }
          pay(b); this.stake = b; this.phase = 'spin'; this.spd = rand(9, 12); this.t = 0; this.msg = '';
        }
      } else if (this.phase === 'spin') {
        this.ang += this.spd * dt;
        this.spd = Math.max(0, this.spd - dt * 3.2);
        this.tick = (this.tick || 0) + this.spd * dt;
        if (this.tick > 0.5) { this.tick = 0; audio.sfx('wheel'); }
        if (this.spd <= 0) {
          const k = ((Math.round(-this.ang / (Math.PI * 2 / 37)) % 37) + 37) % 37;
          const n = WHEEL[k];
          this.out = n;
          const t = RTYPES[this.type];
          const hit = t === 'ROJO' ? REDS.has(n) : t === 'NEGRO' ? n > 0 && !REDS.has(n) : t === 'PAR' ? n > 0 && n % 2 === 0 : t === 'IMPAR' ? n % 2 === 1 : t === '1-18' ? n >= 1 && n <= 18 : t === '19-36' ? n >= 19 : n === this.num;
          if (hit) { const tot = this.stake * (t === 'NÚMERO' ? 36 : 2); win(this.stake, tot); this.msg = `¡GANASTE ${money(tot - this.stake)}!`; this.good = true; }
          else { lose(this.stake); this.msg = 'La casa gana'; this.good = false; }
          this.phase = 'result'; this.t = 0;
        }
      } else if (this.phase === 'result' && this.t > 0.8) {
        if (input.pressed('a')) { this.phase = 'bet'; this.bet = fitBet(this.bet); this.msg = ''; }
        if (input.pressed('b') || input.pressed('back')) this.done = true;
      }
    },
    render(ctx) {
      felt(ctx, 'RULETA');
      // the wheel
      const cx = 86, cy = 92, R = 52, seg = Math.PI * 2 / 37;
      ctx.fillStyle = '#5a3218'; ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 37; i++) {
        ctx.fillStyle = numCol(WHEEL[i]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, this.ang + i * seg - Math.PI / 2 - seg / 2, this.ang + (i + 1) * seg - Math.PI / 2 - seg / 2); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6a4a1a'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) { const a = this.ang * 1.3 + i * Math.PI / 2; ctx.fillStyle = '#e8d080'; ctx.fillRect(Math.round(cx + Math.cos(a) * 14) - 1, Math.round(cy + Math.sin(a) * 14) - 1, 3, 3); }
      // the ball sits at the top: that's the pointer
      ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.arc(cx, cy - R + 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 1, cy - R - 8, 3, 5);
      // bet panel
      const x0 = 160;
      const rows = this.type === 6 ? ['type', 'num', 'bet'] : ['type', 'bet'];
      font.text(ctx, 'TIPO', x0, 34, this.phase === 'bet' && rows[this.row] === 'type' ? '#ffd23f' : '#a8a8b8');
      font.text(ctx, '◄ ' + RTYPES[this.type] + ' ►', x0 + 80, 34, '#f4f4f0', { align: 'center' });
      font.text(ctx, this.type === 6 ? 'PAGA 35 A 1' : 'PAGA 1 A 1', x0 + 80, 44, '#a0dc50', { align: 'center' });
      if (this.type === 6) {
        font.text(ctx, 'NÚMERO', x0, 58, rows[this.row] === 'num' ? '#ffd23f' : '#a8a8b8');
        ctx.fillStyle = numCol(this.num); ctx.fillRect(x0 + 66, 55, 28, 12);
        font.text(ctx, '◄ ' + this.num + ' ►', x0 + 80, 57, '#f4f4f0', { align: 'center' });
      }
      ctx.save(); ctx.translate(0, 0);
      const by = this.type === 6 ? 80 : 64;
      font.text(ctx, 'APUESTA', x0, by, rows[this.row] === 'bet' ? '#ffd23f' : '#a8a8b8');
      font.text(ctx, '◄ ' + money(BETS[this.bet]) + ' ►', x0 + 80, by, BETS[this.bet] <= G.state.money ? '#f4f4f0' : '#d8323c', { align: 'center' });
      ctx.restore();
      if (this.out !== null && this.phase !== 'spin') {
        ctx.fillStyle = numCol(this.out); ctx.fillRect(x0 + 50, 104, 60, 26);
        font.text(ctx, String(this.out), x0 + 80, 108, '#f4f4f0', { align: 'center', scale: 2 });
      }
      if (this.msg) font.text(ctx, this.msg, x0 + 80, 138, this.good ? '#46d470' : '#ff7a7a', { align: 'center' });
      hint(ctx, this.phase === 'bet' ? '↑↓ ELEGIR · ◄► CAMBIAR · {A} GIRAR · {B} SALIR' : this.phase === 'spin' ? 'NO VA MÁS...' : '{A} OTRA · {B} SALIR');
    },
  };
}

// ---------------------------------------------------------------- BLACKJACK
function score(hand) {
  let t = 0, aces = 0;
  for (const c of hand) { const v = c.r === 0 ? 11 : c.r >= 9 ? 10 : c.r + 1; t += v; if (c.r === 0) aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
}
export function blackjack() {
  return {
    done: false, result: null, phase: 'bet', bet: fitBet(1), d: null, me: [], dl: [], msg: '', t: 0, dealT: 0,
    deal() { if (!this.d || this.d.length < 15) this.d = deck(); return this.d.pop(); },
    update(dt) {
      this.t += dt;
      if (this.phase === 'bet') {
        if (input.pressed('b') || input.pressed('back') || input.pressed('pause')) { this.done = true; return; }
        if (input.pressed('right')) { this.bet = clamp(this.bet + 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('left')) { this.bet = clamp(this.bet - 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('a')) {
          const b = BETS[this.bet];
          if (b > G.state.money) { audio.sfx('jam'); this.msg = 'No te alcanza'; return; }
          pay(b); this.stake = b; this.msg = '';
          this.me = [this.deal(), this.deal()]; this.dl = [this.deal(), this.deal()];
          audio.sfx('select');
          if (score(this.me) === 21) this.finish(); else this.phase = 'play';
        }
      } else if (this.phase === 'play') {
        if (input.pressed('a')) { this.me.push(this.deal()); audio.sfx('select'); if (score(this.me) >= 21) this.finish(); }
        else if (input.pressed('b')) this.finish();
        else if (input.pressed('up') && this.me.length === 2 && G.state.money >= this.stake) {
          pay(this.stake); this.stake *= 2; this.doubled = true; this.me.push(this.deal()); audio.sfx('select'); this.finish();
        }
      } else if (this.phase === 'dealer') {
        this.dealT -= dt;
        if (this.dealT <= 0) {
          this.dealT = 0.6;
          if (score(this.dl) < 17 && score(this.me) <= 21) { this.dl.push(this.deal()); audio.sfx('select'); }
          else this.settle();
        }
      } else if (this.phase === 'result' && this.t > 0.8) {
        if (input.pressed('a')) { this.phase = 'bet'; this.me = []; this.dl = []; this.doubled = false; this.bet = fitBet(this.bet); this.msg = ''; }
        if (input.pressed('b') || input.pressed('back')) this.done = true;
      }
    },
    finish() { this.phase = 'dealer'; this.dealT = 0.7; },
    settle() {
      const me = score(this.me), dl = score(this.dl), bj = me === 21 && this.me.length === 2;
      if (me > 21) { lose(this.stake); this.msg = 'Te pasaste. La casa gana.'; this.good = false; }
      else if (bj && !(dl === 21 && this.dl.length === 2)) { const tot = Math.floor(this.stake * 2.5); win(this.stake, tot); this.msg = `¡BLACKJACK! +${money(tot - this.stake)}`; this.good = true; }
      else if (dl > 21 || me > dl) { win(this.stake, this.stake * 2); this.msg = `¡Ganaste ${money(this.stake)}!`; this.good = true; }
      else if (me === dl) { win(this.stake, this.stake); this.msg = 'Empate. Te regresan tu apuesta.'; this.good = true; }
      else { lose(this.stake); this.msg = 'La casa gana.'; this.good = false; }
      this.phase = 'result'; this.t = 0;
    },
    render(ctx) {
      felt(ctx, 'BLACKJACK · LA CASA SE PLANTA EN 17');
      const hideHole = this.phase === 'play';
      font.text(ctx, 'CRUPIER' + (this.dl.length && !hideHole ? ': ' + score(this.dl) : ''), 12, 24, '#f4f4f0');
      this.dl.forEach((c, i) => drawCard(ctx, 12 + i * 28, 34, c, hideHole && i === 1));
      font.text(ctx, 'TÚ' + (this.me.length ? ': ' + score(this.me) : ''), 12, 82, '#ffd23f');
      this.me.forEach((c, i) => drawCard(ctx, 12 + i * 28, 92, c));
      if (this.phase === 'bet') betRow(ctx, 140, this.bet, true);
      else font.text(ctx, 'APUESTA: ' + money(this.stake) + (this.doubled ? ' (DOBLADA)' : ''), W - 10, 82, '#a8a8b8', { align: 'right' });
      if (this.msg) font.text(ctx, this.msg, W - 10, 100, this.good ? '#46d470' : '#ff7a7a', { align: 'right' });
      hint(ctx, this.phase === 'bet' ? '◄► APUESTA · {A} REPARTIR · {B} SALIR' : this.phase === 'play' ? '{A} PEDIR · {B} PLANTARSE · ↑ DOBLAR' : this.phase === 'dealer' ? 'EL CRUPIER JUEGA...' : '{A} OTRA MANO · {B} SALIR');
    },
  };
}

// ---------------------------------------------------------------- VIDEO POKER (Jacks or Better)
const PAYS = [['ESCALERA REAL', 250], ['ESCALERA DE COLOR', 50], ['PÓKER', 25], ['FULL', 9], ['COLOR', 6], ['ESCALERA', 4], ['TERCIA', 3], ['DOS PARES', 2], ['PAR DE J O MÁS', 1]];
function rankHand(h) {
  const rs = h.map((c) => (c.r === 0 ? 13 : c.r)).sort((a, b) => a - b);
  const flush = h.every((c) => c.s === h[0].s);
  const uniq = [...new Set(rs)];
  let straight = uniq.length === 5 && rs[4] - rs[0] === 4;
  if (!straight && uniq.length === 5 && rs.join() === '1,2,3,4,13') straight = true; // A-2-3-4-5
  const counts = {}; for (const r of rs) counts[r] = (counts[r] || 0) + 1;
  const cs = Object.values(counts).sort((a, b) => b - a);
  if (straight && flush && rs[0] === 9) return 0;
  if (straight && flush) return 1;
  if (cs[0] === 4) return 2;
  if (cs[0] === 3 && cs[1] === 2) return 3;
  if (flush) return 4;
  if (straight) return 5;
  if (cs[0] === 3) return 6;
  if (cs[0] === 2 && cs[1] === 2) return 7;
  if (cs[0] === 2) { const pr = +Object.keys(counts).find((r) => counts[r] === 2); if (pr >= 10) return 8; }
  return -1;
}
export function poker() {
  return {
    done: false, result: null, phase: 'bet', bet: fitBet(1), d: null, hand: [], hold: [false, false, false, false, false], sel: 0, msg: '', t: 0, res: -1,
    update(dt) {
      this.t += dt;
      if (this.phase === 'bet') {
        if (input.pressed('b') || input.pressed('back') || input.pressed('pause')) { this.done = true; return; }
        if (input.pressed('right')) { this.bet = clamp(this.bet + 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('left')) { this.bet = clamp(this.bet - 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('a')) {
          const b = BETS[this.bet];
          if (b > G.state.money) { audio.sfx('jam'); this.msg = 'No te alcanza'; return; }
          pay(b); this.stake = b; this.d = deck(); this.hand = [0, 1, 2, 3, 4].map(() => this.d.pop());
          this.hold = [false, false, false, false, false]; this.sel = 0; this.phase = 'hold'; this.msg = ''; this.res = -1; audio.sfx('select');
        }
      } else if (this.phase === 'hold') {
        if (input.pressed('right')) { this.sel = (this.sel + 1) % 5; audio.sfx('move'); }
        if (input.pressed('left')) { this.sel = (this.sel + 4) % 5; audio.sfx('move'); }
        if (input.pressed('a') || input.pressed('up')) { this.hold[this.sel] = !this.hold[this.sel]; audio.sfx('blip'); }
        if (input.pressed('b')) {
          for (let i = 0; i < 5; i++) if (!this.hold[i]) this.hand[i] = this.d.pop();
          audio.sfx('select');
          this.res = rankHand(this.hand);
          if (this.res >= 0) { const tot = this.stake * PAYS[this.res][1]; win(this.stake, tot); this.msg = `${PAYS[this.res][0]}: ${money(tot)}`; this.good = true; }
          else { lose(this.stake); this.msg = 'Nada. La casa gana.'; this.good = false; }
          this.phase = 'result'; this.t = 0;
        }
      } else if (this.phase === 'result' && this.t > 0.8) {
        if (input.pressed('a')) { this.phase = 'bet'; this.bet = fitBet(this.bet); this.msg = ''; }
        if (input.pressed('b') || input.pressed('back')) this.done = true;
      }
    },
    render(ctx) {
      felt(ctx, 'PÓKER · JOTAS O MÁS');
      PAYS.forEach(([n, m], i) => {
        const y = 22 + i * 9, on = i === this.res && this.phase === 'result';
        if (on) { ctx.fillStyle = 'rgba(255,210,63,0.25)'; ctx.fillRect(196, y - 1, 118, 9); }
        font.text(ctx, n, 200, y, on ? '#ffd23f' : '#c8c8d8');
        font.text(ctx, 'x' + m, 310, y, on ? '#ffd23f' : '#a0dc50', { align: 'right' });
      });
      if (this.hand.length) this.hand.forEach((c, i) => {
        const x = 12 + i * 36, y = 40;
        drawCard(ctx, x, y, c, false, this.phase === 'hold' && i === this.sel);
        if (this.hold[i]) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y + 37, 24, 9); font.text(ctx, 'FIJA', x + 12, y + 38, '#101018', { align: 'center' }); }
        if (this.phase === 'hold' && i === this.sel) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 10, y - 6, 4, 3); }
      });
      if (this.phase === 'bet') betRow(ctx, 140, this.bet, true);
      if (this.msg) font.text(ctx, this.msg, 98, 112, this.good ? '#46d470' : '#ff7a7a', { align: 'center' });
      hint(ctx, this.phase === 'bet' ? '◄► APUESTA · {A} REPARTIR · {B} SALIR' : this.phase === 'hold' ? '◄► CARTA · {A} FIJAR · {B} CAMBIAR LAS DEMÁS' : '{A} OTRA MANO · {B} SALIR');
    },
  };
}

// ---------------------------------------------------------------- HORSE RACES
const HORSES = [['Relámpago', 2, '#d8323c'], ['Tsurito Veloz', 3, '#f4f4f0'], ['La Comadre', 4, '#ffd23f'], ['Cinco Estrellas', 6, '#3c64dc'], ['El Tuercas', 10, '#8c46c8'], ['Pa\'llá', 20, '#46b450']];
export function horses() {
  return {
    done: false, result: null, phase: 'pick', pick: 0, bet: fitBet(1), x: HORSES.map(() => 0), sp: HORSES.map(() => 0), win: -1, msg: '', t: 0,
    update(dt) {
      this.t += dt;
      if (this.phase === 'pick') {
        if (input.pressed('b') || input.pressed('back') || input.pressed('pause')) { this.done = true; return; }
        if (input.pressed('down')) { this.pick = (this.pick + 1) % HORSES.length; audio.sfx('move'); }
        if (input.pressed('up')) { this.pick = (this.pick + HORSES.length - 1) % HORSES.length; audio.sfx('move'); }
        if (input.pressed('right')) { this.bet = clamp(this.bet + 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('left')) { this.bet = clamp(this.bet - 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('a')) {
          const b = BETS[this.bet];
          if (b > G.state.money) { audio.sfx('jam'); this.msg = 'No te alcanza'; return; }
          pay(b); this.stake = b; this.msg = '';
          // the favourite is faster on average, but anything can happen
          this.x = HORSES.map(() => 0);
          this.base = HORSES.map(([, odds]) => 30 + 20 / Math.sqrt(odds) + rand(-3, 3));
          this.phase = 'race'; this.t = 0; audio.sfx('star');
        }
      } else if (this.phase === 'race') {
        let leader = -1;
        HORSES.forEach((h, i) => {
          this.sp[i] = this.base[i] + Math.sin(this.t * (1.3 + i * 0.37) + i * 2) * 9 + rand(-6, 6);
          this.x[i] += Math.max(8, this.sp[i]) * dt;
          if (this.x[i] >= 240 && leader < 0) leader = i;
        });
        if (Math.random() < dt * 6) audio.sfx('step', { vol: 0.4 });
        if (leader >= 0) {
          this.win = leader;
          if (leader === this.pick) { const tot = this.stake * (HORSES[leader][1] + 1); win(this.stake, tot); this.msg = `¡GANÓ ${HORSES[leader][0].toUpperCase()}! +${money(tot - this.stake)}`; this.good = true; }
          else { lose(this.stake); this.msg = `Ganó ${HORSES[leader][0]}. Tu caballo sigue corriendo.`; this.good = false; }
          this.phase = 'result'; this.t = 0;
        }
      } else if (this.phase === 'result' && this.t > 0.8) {
        if (input.pressed('a')) { this.phase = 'pick'; this.bet = fitBet(this.bet); this.msg = ''; this.win = -1; this.x = HORSES.map(() => 0); }
        if (input.pressed('b') || input.pressed('back')) this.done = true;
      }
    },
    render(ctx) {
      felt(ctx, 'CARRERA DE CABALLOS');
      const x0 = 50, lane = 15;
      ctx.fillStyle = '#7a5a36'; ctx.fillRect(x0 - 4, 22, 262, HORSES.length * lane + 4);
      ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x0 + 246, 22, 2, HORSES.length * lane + 4);
      HORSES.forEach(([name, odds, col], i) => {
        const y = 24 + i * lane, sel = i === this.pick;
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x0 - 4, y + lane - 2, 262, 1);
        font.text(ctx, String(i + 1), 8, y + 3, sel ? '#ffd23f' : '#a8a8b8');
        font.text(ctx, odds + ':1', 40, y + 3, '#a0dc50', { align: 'right' });
        const hx = Math.round(x0 + this.x[i]), gal = Math.floor(this.t * 12 + i) % 2;
        ctx.fillStyle = '#5a3218'; ctx.fillRect(hx, y + 4, 10, 4); ctx.fillRect(hx + 9, y + 1, 3, 4); ctx.fillRect(hx + 1 + gal, y + 8, 1, 3); ctx.fillRect(hx + 7 - gal, y + 8, 1, 3);
        ctx.fillStyle = col; ctx.fillRect(hx + 3, y + 1, 4, 3);
        if (sel) { ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(x0 - 3.5, y + 0.5, 260, lane - 2); }
      });
      const by = 24 + HORSES.length * lane + 8;
      font.text(ctx, 'CABALLO: ' + HORSES[this.pick][0], 8, by, '#ffd23f');
      font.text(ctx, '◄ ' + money(BETS[this.bet]) + ' ►', W - 10, by, BETS[this.bet] <= G.state.money ? '#f4f4f0' : '#d8323c', { align: 'right' });
      if (this.msg) font.text(ctx, this.msg, W / 2, by + 14, this.good ? '#46d470' : '#ff7a7a', { align: 'center' });
      hint(ctx, this.phase === 'pick' ? '↑↓ CABALLO · ◄► APUESTA · {A} ARRANCAN · {B} SALIR' : this.phase === 'race' ? '¡ARRANCAN!' : '{A} OTRA CARRERA · {B} SALIR');
    },
  };
}

// ---------------------------------------------------------------- SLOTS
const SYMS = [['7', '#d8323c', 20], ['BAR', '#f4f4f0', 10], ['★', '#ffd23f', 8], ['♦', '#5adcf0', 5], ['♥', '#f46eaa', 3], ['K', '#a0dc50', 50]];
export function slots() {
  return {
    done: false, result: null, phase: 'bet', bet: fitBet(0), reels: [0, 2, 4], spin: [0, 0, 0], stopT: [0, 0, 0], msg: '', t: 0,
    update(dt) {
      this.t += dt;
      if (this.phase === 'bet') {
        if (input.pressed('b') || input.pressed('back') || input.pressed('pause')) { this.done = true; return; }
        if (input.pressed('right')) { this.bet = clamp(this.bet + 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('left')) { this.bet = clamp(this.bet - 1, 0, BETS.length - 1); audio.sfx('move'); }
        if (input.pressed('a')) {
          const b = BETS[this.bet];
          if (b > G.state.money) { audio.sfx('jam'); this.msg = 'No te alcanza'; return; }
          pay(b); this.stake = b; this.msg = ''; this.phase = 'spin'; this.stopT = [0.9, 1.5, 2.1]; this.t = 0;
          // weighted reels: the kazoo (K) almost never comes up
          this.target = [0, 1, 2].map(() => { const r = Math.random(); return r < 0.02 ? 5 : r < 0.1 ? 0 : r < 0.25 ? 1 : r < 0.45 ? 2 : r < 0.7 ? 3 : 4; });
        }
      } else if (this.phase === 'spin') {
        let all = true;
        for (let i = 0; i < 3; i++) {
          if (this.t < this.stopT[i]) { all = false; this.reels[i] = Math.floor(this.t * 14 + i * 2) % SYMS.length; }
          else if (this.reels[i] !== this.target[i]) { this.reels[i] = this.target[i]; audio.sfx('select'); }
        }
        if (Math.floor(this.t * 14) !== Math.floor((this.t - dt) * 14) && !all) audio.sfx('wheel');
        if (all) {
          const [a, b, c] = this.reels;
          let mult = 0;
          if (a === b && b === c) mult = SYMS[a][2];
          else if ([a, b, c].filter((x) => x === 4).length === 2) mult = 2;
          if (mult) { const tot = this.stake * mult; win(this.stake, tot); this.msg = `¡PREMIO! ${money(tot)}`; this.good = true; }
          else { lose(this.stake); this.msg = 'Nada. Otra, otra...'; this.good = false; }
          this.phase = 'result'; this.t = 0;
        }
      } else if (this.phase === 'result' && this.t > 0.6) {
        if (input.pressed('a')) { this.phase = 'bet'; this.bet = fitBet(this.bet); this.msg = ''; }
        if (input.pressed('b') || input.pressed('back')) this.done = true;
      }
    },
    render(ctx) {
      felt(ctx, 'TRAGAMONEDAS');
      ctx.fillStyle = '#8c1c28'; ctx.fillRect(70, 26, 180, 96); ctx.fillStyle = '#ffd23f'; ctx.fillRect(70, 26, 180, 3); ctx.fillRect(70, 119, 180, 3);
      for (let i = 0; i < 3; i++) {
        const x = 84 + i * 54, [sym, col] = SYMS[this.reels[i]];
        ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x, 40, 44, 62);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x, 40, 44, 8); ctx.fillRect(x, 94, 44, 8);
        font.text(ctx, sym, x + 22, 62, col === '#f4f4f0' ? '#101018' : col, { align: 'center', scale: 2 });
      }
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(254, 40, 3, 40); ctx.fillStyle = '#d8323c'; ctx.fillRect(252, 34, 7, 7);
      font.text(ctx, '7 7 7 x20 · BAR x10 · ★ x8 · ♦ x5 · ♥ x3 · K K K x50 · ♥♥ x2', W / 2, 128, '#c8c8d8', { align: 'center' });
      if (this.phase === 'bet') betRow(ctx, 142, this.bet, true);
      if (this.msg) font.text(ctx, this.msg, W / 2, 142, this.good ? '#46d470' : '#ff7a7a', { align: 'center' });
      hint(ctx, this.phase === 'bet' ? '◄► APUESTA · {A} JALAR · {B} SALIR' : this.phase === 'spin' ? '...' : '{A} OTRA · {B} SALIR');
    },
  };
}
