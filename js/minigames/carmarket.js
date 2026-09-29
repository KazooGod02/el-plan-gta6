// Capítulo 5: buscar el carro en el Marketplace.
import { W, H, G } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { money } from '../core/util.js';
import { CAR_LISTINGS } from '../data/strings.js';
import { drawVehicle } from '../data/sprites.js';

const REJECT = {
  lambo: ['ElPepe_Motors', 'jaja no we, ya lo vendí a un tiktoker. Pero tengo un Tsuru igualito... no, espérate, no tengo nada.'],
  golf: ['ClubCampestrePV', 'Solo vendemos a socios del club. ¿Eres socio? No. Qué pena. Bye.'],
  vocho: ['Vochos_Don_Beto', 'Ya no está. Se me fue el vocho. Literal, se me fue, no tenía freno de mano. Va en Oaxaca.'],
  patrulla: ['NoPreguntes22', '[NoPreguntes22 te bloqueó]'],
  camion: ['Municipio_PV_Oficial', 'Precio: $8,000 más 3 años de trámites, 14 copias de tu INE y una carta de tu abuelita.'],
};
const SPRITE = { lambo: ['sports', '#d8d8d0'], golf: ['golf', '#f4f4f0'], vocho: ['vocho', '#46b450'], patrulla: ['police', '#f4f4f0'], camion: ['garbage', '#46b450'], tsuru: ['tsuru', '#d8d8d0'] };

export function carmarket(opts = {}) {
  const imgs = {};
  for (const k in SPRITE) imgs[k] = drawVehicle(SPRITE[k][0], SPRITE[k][1]);
  return {
    song: null, done: false, result: null, sel: 0, mode: 'list', t: 0, popup: null, tries: 0, chat: [], chatT: 0, chatI: 0,
    budget: opts.budget || 8500,
    update(dt) {
      this.t += dt;
      const L = CAR_LISTINGS;
      if (this.popup) { if (input.pressed('a') || input.pressed('b')) { this.popup = null; this.mode = 'list'; audio.sfx('back'); } return; }
      if (this.mode === 'list') {
        if (input.pressed('down')) { this.sel = (this.sel + 1) % L.length; audio.sfx('move'); }
        if (input.pressed('up')) { this.sel = (this.sel + L.length - 1) % L.length; audio.sfx('move'); }
        if (input.pressed('a')) { this.mode = 'detail'; audio.sfx('select'); }
      } else if (this.mode === 'detail') {
        if (input.pressed('b') || input.pressed('back')) { this.mode = 'list'; audio.sfx('back'); return; }
        if (input.pressed('a')) {
          const it = L[this.sel];
          if (it.id !== 'tsuru') {
            this.tries++;
            const [who, msg] = REJECT[it.id];
            this.popup = { who, msg, hint: this.tries >= 2 ? 'Este vendedor tiene ' + it.stars + ' estrella' + (it.stars === 1 ? '' : 's') + '. VendeRápido_5E tiene 5. ¿Seguro?' : null };
            audio.sfx('notify');
            if (G.state) G.state.flags.dumb = (G.state.flags.dumb || 0) + 1;
          } else {
            this.mode = 'chat'; this.chatI = 0; this.chatT = 0.6;
            this.chat = [
              ['kazoo', 'Hola. ¿Sigue disponible el Tsuru?'],
              ['vendedor', '¡Claro que sí, amigo! Disponible y esperándote. Servicio 5 estrellas.'],
              ['kazoo', '¿Por qué está tan barato?'],
              ['vendedor', 'Porque me caes bien. Y porque me urge. Pero más porque me caes bien.'],
              ['kazoo', '¿Tiene algún detalle?'],
              ['vendedor', 'Nada, nada. Hace un ruidito, pero es su personalidad. ¿Nos vemos en el estacionamiento de Plaza Vicio? Hoy, 6 de la tarde.'],
              ['kazoo', 'Va. Ahí nos vemos.'],
              ['vendedor', '¡Excelente! Recuerda dejarme mis 5 estrellas.'],
            ];
          }
        }
      } else if (this.mode === 'chat') {
        this.chatT -= dt;
        if (this.chatT <= 0 && this.chatI < this.chat.length) { this.chatI++; this.chatT = 1.3; audio.sfx(this.chat[this.chatI - 1][0] === 'kazoo' ? 'type' : 'notify'); }
        if (this.chatI >= this.chat.length && (input.pressed('a') || this.chatT < -2.5)) { this.done = true; this.result = 'tsuru'; }
        if (input.pressed('a') && this.chatI < this.chat.length) this.chatT = 0;
      }
    },
    render(ctx) {
      ctx.fillStyle = '#0e1430'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3c64dc'; ctx.fillRect(0, 0, W, 16);
      font.text(ctx, 'MARKETPLACE PV › VEHÍCULOS', 6, 4, '#f4f4f0');
      font.text(ctx, 'Presupuesto: ' + money(this.budget), W - 6, 4, '#46d470', { align: 'right' });
      const L = CAR_LISTINGS;
      if (this.mode === 'list' || this.popup) {
        L.forEach((it, i) => {
          const y = 22 + i * 25, sel = i === this.sel;
          ctx.fillStyle = sel ? '#2a3c7a' : '#18204a'; ctx.fillRect(6, y, W - 12, 23);
          ctx.drawImage(imgs[it.id], 12, y + 5);
          font.text(ctx, it.name, 56, y + 3, '#f4f4f0');
          font.text(ctx, money(it.price) + '  · ' + it.seller, 56, y + 13, it.price <= this.budget ? '#46d470' : '#d8323c');
          font.text(ctx, '★'.repeat(it.stars) + '☆'.repeat(5 - it.stars), W - 12, y + 8, '#ffd23f', { align: 'right' });
        });
      } else if (this.mode === 'detail') {
        const it = L[this.sel];
        ctx.fillStyle = '#18204a'; ctx.fillRect(10, 24, W - 20, 146);
        ctx.save(); ctx.translate(30, 36); ctx.scale(3, 3); ctx.drawImage(imgs[it.id], 0, 0); ctx.restore();
        font.text(ctx, it.name, 130, 34, '#f4f4f0');
        font.text(ctx, money(it.price), 130, 46, '#46d470', { scale: 2 });
        font.text(ctx, 'Vendedor: ' + it.seller, 130, 66, '#5adcf0');
        font.text(ctx, '★'.repeat(it.stars) + '☆'.repeat(5 - it.stars), 130, 76, '#ffd23f');
        font.wrap(it.desc, W - 40).forEach((l, i) => font.text(ctx, l, 20, 100 + i * 10, '#c8c8d8'));
        ctx.fillStyle = '#3c64dc'; ctx.fillRect(W / 2 - 60, 146, 120, 16);
        font.text(ctx, 'A: CONTACTAR VENDEDOR', W / 2, 150, '#f4f4f0', { align: 'center' });
        font.text(ctx, 'B: atrás', W - 16, 160, '#a8a8b8', { align: 'right' });
      } else if (this.mode === 'chat') {
        font.text(ctx, 'Chat con VendeRápido_5E ★★★★★', W / 2, 22, '#ffd23f', { align: 'center' });
        let y = 36;
        for (let i = Math.max(0, this.chatI - 6); i < this.chatI; i++) {
          const [who, msg] = this.chat[i];
          const me = who === 'kazoo';
          const lines = font.wrap(msg, 200);
          const w = Math.max(...lines.map((l) => font.measure(l))) + 8, h = lines.length * 9 + 4;
          const x = me ? W - w - 10 : 10;
          ctx.fillStyle = me ? '#1e6e3c' : '#4a2a5a'; ctx.fillRect(x, y, w, h);
          lines.forEach((l, k) => font.text(ctx, l, x + 4, y + 3 + k * 9, '#f4f4f0'));
          y += h + 4;
        }
        if (this.chatI < this.chat.length && Math.floor(this.t * 3) % 2) font.text(ctx, 'escribiendo...', 12, H - 12, '#a8a8b8');
        if (this.chatI >= this.chat.length) font.text(ctx, 'A: continuar', W - 10, H - 12, '#ffd23f', { align: 'right' });
      }
      if (this.popup) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f4f4f0'; ctx.fillRect(30, 50, W - 60, 80);
        font.text(ctx, this.popup.who, 38, 56, '#3c64dc');
        font.wrap(this.popup.msg, W - 80).forEach((l, i) => font.text(ctx, l, 38, 68 + i * 9, '#101018'));
        if (this.popup.hint) font.wrap(this.popup.hint, W - 80).forEach((l, i) => font.text(ctx, l, 38, 104 + i * 9, '#d8323c'));
      }
    },
  };
}
