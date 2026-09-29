// Elegir máscaras para el atraco.
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { portrait } from '../data/sprites.js';
import { LOOKS } from '../data/cast.js';

const MASKS = ['luchador', 'presidente', 'payaso', 'calavera', 'pasamontanas'];
const NAMES = { luchador: 'LUCHADOR', presidente: 'PRESIDENTE', payaso: 'PAYASO', calavera: 'CALAVERA', pasamontanas: 'PASAMONTAÑAS' };
const COMMENTS = {
  kazoo: { luchador: '¡El Místico de Puerto Vicio!', presidente: 'Con esta nadie me va a votar.', payaso: 'Me siento... representado.', calavera: 'Muy Día de Muertos. Muy yo.', pasamontanas: 'Clásico. Aburrido. Pero clásico.' },
  coqui: { luchador: 'No. Me aprieta la dignidad.', presidente: 'Serio. Profesional. Me gusta.', payaso: 'Ni muerto.', calavera: 'Tétrico, pero funciona.', pasamontanas: 'Discreto. Como debe ser.' },
  ghenghis: { luchador: '¡Tres caídas sin límite de tiempo!', presidente: 'Le robo al banco con cara de gobierno. Qué irónico.', payaso: 'JAJAJA ESTE. ESTE ES MÍO.', calavera: 'Pa\' que sepan que ya valimos.', pasamontanas: 'Muy serio pa\' mí.' },
};

export function costume(opts = {}) {
  const crew = ['kazoo', 'coqui', 'ghenghis'];
  const cur = { ...(G.state?.masks || { kazoo: 'luchador', coqui: 'presidente', ghenghis: 'payaso' }) };
  return {
    song: 'mari', done: false, result: null, who: 0, t: 0, cur, bounce: 0,
    update(dt) {
      this.t += dt; if (this.bounce > 0) this.bounce -= dt;
      const id = crew[this.who];
      const i = MASKS.indexOf(this.cur[id]);
      if (input.pressed('right')) { this.cur[id] = MASKS[(i + 1) % MASKS.length]; audio.sfx('move'); this.bounce = 0.15; }
      if (input.pressed('left')) { this.cur[id] = MASKS[(i + MASKS.length - 1) % MASKS.length]; audio.sfx('move'); this.bounce = 0.15; }
      if (input.pressed('down')) { this.who = (this.who + 1) % 3; audio.sfx('move'); }
      if (input.pressed('up')) { this.who = (this.who + 2) % 3; audio.sfx('move'); }
      if (input.pressed('a')) {
        if (this.who < 2) { this.who++; audio.sfx('select'); }
        else { audio.sfx('pass'); if (G.state) G.state.masks = { ...this.cur }; this.result = { ...this.cur }; this.done = true; }
      }
    },
    render(ctx) {
      ctx.fillStyle = '#5a2a18'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#6a3a28'; for (let y = 0; y < H; y += 10) for (let x = (y % 20) ? 0 : 5; x < W; x += 10) { ctx.fillRect(x + 2, y, 2, 1); ctx.fillRect(x + 1, y + 1, 4, 1); ctx.fillRect(x + 2, y + 2, 2, 1); }
      font.text(ctx, 'DISFRACES CARNAVAL — ELIGE LAS MÁSCARAS', W / 2, 6, '#ffd23f', { align: 'center', outline: '#2a0a00' });
      crew.forEach((id, k) => {
        const x = 20 + k * 100, y = 26, sel = k === this.who;
        ctx.fillStyle = sel ? '#ffd23f' : '#2a1a10'; ctx.fillRect(x - 2, y - 2, 84, 124);
        ctx.fillStyle = '#1a0e08'; ctx.fillRect(x, y, 80, 120);
        const L = { ...LOOKS[id], mask: this.cur[id], _id: 'cos' + id + this.cur[id] };
        const s = portrait(L, 'normal');
        const b = sel && this.bounce > 0 ? -2 : 0;
        ctx.drawImage(s, x + 8, y + 8 + b, 64, 64);
        font.text(ctx, LOOKS[id].name, x + 40, y + 76, LOOKS[id].color, { align: 'center' });
        font.text(ctx, (sel ? '◄ ' : '') + NAMES[this.cur[id]] + (sel ? ' ►' : ''), x + 40, y + 88, '#f4f4f0', { align: 'center' });
        font.wrap(COMMENTS[id][this.cur[id]], 76).forEach((l, i) => font.text(ctx, l, x + 40, y + 100 + i * 8, '#c8c8a8', { align: 'center' }));
      });
      font.text(ctx, '◄ ► cambiar máscara · ▲▼ persona · A confirmar', W / 2, H - 12, '#f4f4f0', { align: 'center', outline: '#2a0a00' });
    },
  };
}
