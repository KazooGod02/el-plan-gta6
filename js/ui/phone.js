// Kazoo's phone: the in-game menu.
import { G, W, H } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { shade } from '../core/gfx.js';
import { clamp, money, clock } from '../core/util.js';
import { MARKET_ITEMS, RADIO_STATIONS, CASSETTES } from '../data/strings.js';
import { ACHIEVEMENTS, unlock } from '../story/achievements.js';
import { MAP, TS, MW, MH, ZONE_NAMES } from '../world/map.js';
import { saveSettings } from '../core/save.js';
import { LOOKS } from '../data/cast.js';
import { UI, censor } from './ui.js';

const APPS = [
  { id: 'chat', name: 'Chat', icon: '#46b450', glyph: '✉' },
  { id: 'market', name: 'Market', icon: '#3c64dc', glyph: '$' },
  { id: 'map', name: 'Mapa', icon: '#28b4a0', glyph: '▲' },
  { id: 'debt', name: 'Deuda', icon: '#d8323c', glyph: '!' },
  { id: 'radio', name: 'Radio', icon: '#f08c28', glyph: '♪' },
  { id: 'lore', name: 'Cassettes', icon: '#e0a82e', glyph: '■' },
  { id: 'logros', name: 'Logros', icon: '#ffd23f', glyph: '★' },
  { id: 'ajustes', name: 'Ajustes', icon: '#6e6e82', glyph: '*' },
  { id: 'guardar', name: 'Guardar', icon: '#8c46c8', glyph: '♦' },
];

const PX = 186, PY = 4, PW = 128, PH = 172;
const SX = PX + 8, SY = PY + 18, SW = PW - 16, SH = PH - 34;

export const phone = {
  open: false,
  app: null, sel: 0, scroll: 0, tab: 0, sub: 0, confirm: null, anim: 0,

  toggle() {
    if (this.open) this.close();
    else {
      if (G.lockInput || G.paused) return;
      this.open = true; this.app = null; this.sel = 0; this.anim = 0; G.paused = true; G.phoneBadge = 0;
      audio.sfx('phone');
    }
  },
  close() { this.open = false; this.app = null; G.paused = false; audio.sfx('back'); if (G.settings) saveSettings(G.settings); },

  update(dt) {
    if (!this.open) return;
    this.anim = Math.min(1, this.anim + dt * 6);
    if (input.pressed('phone')) { this.close(); return; }
    if (!this.app) {
      const cols = 3;
      if (input.pressed('right')) { this.sel = (this.sel + 1) % APPS.length; audio.sfx('move'); }
      if (input.pressed('left')) { this.sel = (this.sel + APPS.length - 1) % APPS.length; audio.sfx('move'); }
      if (input.pressed('down')) { this.sel = (this.sel + cols) % APPS.length; audio.sfx('move'); }
      if (input.pressed('up')) { this.sel = (this.sel + APPS.length - cols) % APPS.length; audio.sfx('move'); }
      if (input.pressed('a')) { this.app = APPS[this.sel].id; this.scroll = 0; this.sub = 0; this.tab = 0; this.confirm = null; audio.sfx('select'); if (this.app === 'chat') this.scroll = 9999; }
      if (input.pressed('back') || input.pressed('b') || input.pressed('pause')) this.close();
      return;
    }
    const back = input.pressed('back') || input.pressed('b') || input.pressed('pause');
    const f = this['u_' + this.app];
    if (f) f.call(this, back); else if (back) this.app = null;
  },

  u_chat(back) {
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('left') || input.pressed('right')) { if (G.state.chatPriv.length) { this.tab = 1 - this.tab; this.scroll = 9999; audio.sfx('move'); } }
    if (input.down('up')) this.scroll -= 2;
    if (input.down('down')) this.scroll += 2;
  },
  u_market(back) {
    const items = MARKET_ITEMS;
    if (this.confirm !== null) {
      if (input.pressed('a')) {
        const it = items[this.confirm], s = G.state;
        if (s.money >= it.price) {
          s.money -= it.price; s.items.push(it.id); s.stats.purchases++; audio.sfx('coin');
          UI.toast('Compraste: ' + it.name + ' (llega a tu cuarto)', '#46d470', 3);
          if (s.stats.purchases >= 10) unlock('shopper');
        } else { audio.sfx('jam'); UI.toast('No te alcanza', '#d8323c', 2); }
        this.confirm = null;
      } else if (back) { this.confirm = null; audio.sfx('back'); }
      return;
    }
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('down')) { this.sub = Math.min(items.length - 1, this.sub + 1); audio.sfx('move'); }
    if (input.pressed('up')) { this.sub = Math.max(0, this.sub - 1); audio.sfx('move'); }
    if (input.pressed('a')) { const it = items[this.sub]; if (!G.state.items.includes(it.id)) { this.confirm = this.sub; audio.sfx('select'); } else audio.sfx('jam'); }
  },
  u_radio(back) {
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('down')) { G.state.radio = (G.state.radio + 1) % RADIO_STATIONS.length; audio.sfx('move'); }
    if (input.pressed('up')) { G.state.radio = (G.state.radio + RADIO_STATIONS.length - 1) % RADIO_STATIONS.length; audio.sfx('move'); }
  },
  u_lore(back) {
    const list = G.state.collect.cassettes;
    if (this.confirm !== null) { if (back || input.pressed('a')) { this.confirm = null; audio.sfx('back'); } return; }
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('down')) this.sub = Math.min(Math.max(0, list.length - 1), this.sub + 1);
    if (input.pressed('up')) this.sub = Math.max(0, this.sub - 1);
    if (input.pressed('a') && list.length) this.confirm = list[this.sub];
  },
  u_logros(back) {
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('down')) this.sub = Math.min(ACHIEVEMENTS.length - 1, this.sub + 1);
    if (input.pressed('up')) this.sub = Math.max(0, this.sub - 1);
  },
  u_ajustes(back) {
    const st = G.settings;
    const n = 6;
    if (back) { this.app = null; audio.sfx('back'); saveSettings(st); return; }
    if (input.pressed('down')) { this.sub = (this.sub + 1) % n; audio.sfx('move'); }
    if (input.pressed('up')) { this.sub = (this.sub + n - 1) % n; audio.sfx('move'); }
    const d = input.pressed('right') ? 1 : input.pressed('left') ? -1 : 0;
    const tog = input.pressed('a') || d !== 0;
    if (this.sub === 0 && d) { st.music = clamp(Math.round((st.music + d * 0.1) * 10) / 10, 0, 1); audio.setVolumes(st.music, st.sfx); }
    if (this.sub === 1 && d) { st.sfx = clamp(Math.round((st.sfx + d * 0.1) * 10) / 10, 0, 1); audio.setVolumes(st.music, st.sfx); audio.sfx('coin'); }
    if (this.sub === 2 && tog) { st.streamer = !st.streamer; audio.sfx('select'); }
    if (this.sub === 3 && tog) { st.shake = !st.shake; audio.sfx('select'); }
    if (this.sub === 4 && tog) { st.speedrun = !st.speedrun; audio.sfx('select'); }
    if (this.sub === 5 && tog) { st.subtitles = !st.subtitles; audio.sfx('select'); }
  },
  u_guardar(back) {
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('down')) this.sub = (this.sub + 1) % 3;
    if (input.pressed('up')) this.sub = (this.sub + 2) % 3;
    if (input.pressed('a')) {
      if (G.story.active) { UI.toast('No puedes guardar durante una misión', '#d8323c', 2); audio.sfx('jam'); return; }
      if (G.scene === G.scenes.city && G.scenes.city.wanted > 0) { UI.toast('No puedes guardar con la policía atrás', '#d8323c', 2); audio.sfx('jam'); return; }
      G.story.save(this.sub); UI.toast('Guardado en ranura ' + (this.sub + 1), '#46d470', 2); audio.sfx('select'); this.close();
    }
  },

  // ------------------------------------------------ render
  render(ctx) {
    if (!this.open) return;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    const oy = Math.round((1 - this.anim) * 60);
    ctx.save(); ctx.translate(0, oy);
    // body
    ctx.fillStyle = '#101018'; ctx.fillRect(PX - 1, PY - 1, PW + 2, PH + 2);
    ctx.fillStyle = '#2a2a38'; ctx.fillRect(PX, PY, PW, PH);
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(PX + 2, PY + 2, PW - 4, PH - 4);
    ctx.fillStyle = '#101018'; ctx.fillRect(SX - 1, SY - 12, SW + 2, SH + 14);
    // screen
    const s = G.state;
    const grad = ctx.createLinearGradient(0, SY, 0, SY + SH);
    grad.addColorStop(0, '#1e1e4a'); grad.addColorStop(1, '#4a1e5a');
    ctx.fillStyle = grad; ctx.fillRect(SX, SY - 11, SW, SH + 12);
    // cracked glass
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(SX + SW - 20, SY - 11); ctx.lineTo(SX + SW - 30, SY + 10); ctx.lineTo(SX + SW - 18, SY + 22); ctx.moveTo(SX + SW - 30, SY + 10); ctx.lineTo(SX + SW - 44, SY + 16); ctx.stroke();
    // status bar
    font.text(ctx, clock(s.clock), SX + 2, SY - 9, '#f4f4f0');
    font.text(ctx, money(s.money), SX + SW - 2, SY - 9, '#46d470', { align: 'right' });
    ctx.save(); ctx.beginPath(); ctx.rect(SX, SY, SW, SH); ctx.clip();
    if (!this.app) this.r_home(ctx);
    else { const f = this['r_' + this.app]; if (f) f.call(this, ctx); }
    ctx.restore();
    // home button
    ctx.fillStyle = '#1a1a24'; ctx.fillRect(PX + PW / 2 - 8, PY + PH - 12, 16, 8);
    font.text(ctx, 'B: ATRÁS', PX + PW / 2, PY + PH + 3, '#a8a8b8', { align: 'center' });
    ctx.restore();
  },

  header(ctx, title, col = '#ffd23f') {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(SX, SY, SW, 12);
    font.text(ctx, title, SX + SW / 2, SY + 2, col, { align: 'center' });
  },

  r_home(ctx) {
    font.text(ctx, 'KAZOOPHONE', SX + SW / 2, SY + 3, '#ffd23f', { align: 'center' });
    APPS.forEach((a, i) => {
      const cx = SX + 8 + (i % 3) * 34, cy = SY + 16 + Math.floor(i / 3) * 38;
      const sel = i === this.sel;
      if (sel) { ctx.fillStyle = '#f4f4f0'; ctx.fillRect(cx - 2, cy - 2, 28, 28); }
      ctx.fillStyle = a.icon; ctx.fillRect(cx, cy, 24, 24);
      ctx.fillStyle = shade(a.icon, 1.25); ctx.fillRect(cx, cy, 24, 3);
      font.text(ctx, a.glyph, cx + 12, cy + 7, '#101018', { align: 'center', scale: 1 });
      font.text(ctx, a.name, cx + 12, cy + 26, sel ? '#ffd23f' : '#d8d8e8', { align: 'center' });
      if (a.id === 'chat' && G.phoneBadge) { ctx.fillStyle = '#d8323c'; ctx.fillRect(cx + 18, cy - 3, 8, 8); font.text(ctx, String(Math.min(9, G.phoneBadge)), cx + 22, cy - 2, '#fff', { align: 'center' }); }
    });
  },

  r_chat(ctx) {
    const priv = this.tab === 1;
    const list = priv ? G.state.chatPriv : G.state.chat;
    this.header(ctx, priv ? 'GHENGHIS (PRIVADO)' : 'LOS DEL PLAN 🙂'.replace(' 🙂', ''), priv ? '#e0504a' : '#46b450');
    if (G.state.chatPriv.length) font.text(ctx, '◄ ►', SX + SW - 2, SY + 2, '#a8a8b8', { align: 'right' });
    // layout bubbles
    const items = [];
    let y = 0;
    for (const m of list) {
      const me = m.from === 'kazoo';
      const lines = font.wrap(censor(m.text), SW - 26);
      const h = lines.length * 9 + 12;
      items.push({ m, me, lines, y, h });
      y += h + 3;
    }
    const total = y, view = SH - 16;
    this.scroll = clamp(this.scroll, 0, Math.max(0, total - view));
    for (const it of items) {
      const by = SY + 15 + it.y - this.scroll;
      if (by > SY + SH || by + it.h < SY) continue;
      const L = LOOKS[it.m.from] || LOOKS.unknown;
      const w = Math.max(...it.lines.map((l) => font.measure(l)), font.measure(L.name)) + 6;
      const bx = it.me ? SX + SW - w - 3 : SX + 3;
      ctx.fillStyle = it.me ? '#1e6e3c' : '#2a2a44'; ctx.fillRect(bx, by, w, it.h);
      font.text(ctx, it.m.from === 'kazoo' ? 'Tú' : L.name, bx + 3, by + 2, L.color || '#ffd23f');
      it.lines.forEach((l, i) => font.text(ctx, l, bx + 3, by + 11 + i * 9, '#f4f4f0'));
    }
    if (!list.length) font.text(ctx, 'Sin mensajes', SX + SW / 2, SY + 60, '#a8a8b8', { align: 'center' });
  },

  r_market(ctx) {
    this.header(ctx, 'MARKETPLACE PV', '#5a9cff');
    const items = MARKET_ITEMS;
    const top = Math.max(0, this.sub - 3);
    items.slice(top, top + 5).forEach((it, k) => {
      const i = top + k, y = SY + 15 + k * 24;
      const sel = i === this.sub, owned = G.state.items.includes(it.id);
      ctx.fillStyle = sel ? '#3a3a6a' : '#22223a'; ctx.fillRect(SX + 2, y, SW - 4, 22);
      font.text(ctx, it.name.length > 20 ? it.name.slice(0, 19) + '…' : it.name, SX + 5, y + 2, owned ? '#6a6a7a' : '#f4f4f0');
      font.text(ctx, owned ? 'VENDIDO' : money(it.price), SX + 5, y + 12, owned ? '#6a6a7a' : '#46d470');
      font.text(ctx, '★'.repeat(it.stars), SX + SW - 5, y + 12, '#ffd23f', { align: 'right' });
    });
    const it = items[this.sub];
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(SX, SY + SH - 22, SW, 22);
    font.wrap(it.desc, SW - 6).slice(0, 2).forEach((l, i) => font.text(ctx, l, SX + 3, SY + SH - 20 + i * 9, '#c8c8d8'));
    if (this.confirm !== null) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(SX + 4, SY + 40, SW - 8, 44);
      font.text(ctx, '¿Comprar por', SX + SW / 2, SY + 46, '#f4f4f0', { align: 'center' });
      font.text(ctx, money(items[this.confirm].price) + '?', SX + SW / 2, SY + 56, '#46d470', { align: 'center' });
      font.text(ctx, 'A: SÍ   B: NO', SX + SW / 2, SY + 70, '#ffd23f', { align: 'center' });
    }
  },

  r_map(ctx) {
    this.header(ctx, 'PUERTO VICIO', '#5adcf0');
    const c = G.scenes.city;
    const sc = SW / MW;
    const mx = SX, my = SY + 14;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c.mini, 0, 0, MW, MH, mx, my, SW, MH * sc);
    for (const m of c.markers) { if (m.hidden) continue; ctx.fillStyle = '#101018'; ctx.fillRect(mx + m.x / TS * sc - 2, my + m.y / TS * sc - 2, 4, 4); ctx.fillStyle = m.color; ctx.fillRect(mx + m.x / TS * sc - 1, my + m.y / TS * sc - 1, 2, 2); }
    const p = c.pos();
    if (Math.floor(G.time * 4) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(mx + p.x / TS * sc - 1, my + p.y / TS * sc - 1, 3, 3); }
    const ly = my + MH * sc + 4;
    font.text(ctx, '■ Tú  ■ Misiones', SX + 3, ly, '#f4f4f0');
    const locked = Object.entries(G.state.unlocked).filter(([, v]) => !v).map(([k]) => ZONE_NAMES[k]);
    if (locked.length) font.wrap('Bloqueado: ' + locked.join(', '), SW - 6).forEach((l, i) => font.text(ctx, l, SX + 3, ly + 10 + i * 9, '#f08c28'));
  },

  r_debt(ctx) {
    this.header(ctx, 'DEUDA — DON CHUY', '#ff6a6a');
    const s = G.state;
    const left = Math.max(0, s.debt - s.paid);
    font.text(ctx, 'Le debes:', SX + SW / 2, SY + 22, '#f4f4f0', { align: 'center' });
    font.text(ctx, money(left), SX + SW / 2, SY + 34, left ? '#ff6a6a' : '#46d470', { align: 'center', scale: 2 });
    const f = s.paid / s.debt;
    ctx.fillStyle = '#101018'; ctx.fillRect(SX + 8, SY + 56, SW - 16, 8); ctx.fillStyle = '#46d470'; ctx.fillRect(SX + 9, SY + 57, Math.round((SW - 18) * f), 6);
    font.text(ctx, `Pagado: ${money(s.paid)}`, SX + SW / 2, SY + 68, '#a8a8b8', { align: 'center' });
    const days = Math.max(0, 0 - s.day);
    font.text(ctx, left ? `Plazo: ${days} días` : '¡LIBRE!', SX + SW / 2, SY + 84, '#ffd23f', { align: 'center' });
    font.wrap('Paga en la casa de Don Chuy (La Colonia). Él acepta efectivo, miedo y tacos no.', SW - 8).forEach((l, i) => font.text(ctx, l, SX + 4, SY + 100 + i * 9, '#c8c8d8'));
  },

  r_radio(ctx) {
    this.header(ctx, 'RADIO', '#f08c28');
    RADIO_STATIONS.forEach((st, i) => {
      const y = SY + 18 + i * 22, sel = i === G.state.radio;
      ctx.fillStyle = sel ? '#6a3a1a' : '#22223a'; ctx.fillRect(SX + 2, y, SW - 4, 20);
      font.text(ctx, (sel ? '♪ ' : '') + st.name, SX + 5, y + 2, sel ? '#ffd23f' : '#f4f4f0');
      font.text(ctx, st.dj.slice(0, 22), SX + 5, y + 11, '#a8a8b8');
    });
    font.text(ctx, 'Suena cuando manejas. Q cambia estación.', SX + SW / 2, SY + SH - 10, '#a8a8b8', { align: 'center' });
  },

  r_lore(ctx) {
    const list = G.state.collect.cassettes;
    this.header(ctx, `CASSETTES ${list.length}/15`, '#e0a82e');
    if (this.confirm !== null) {
      const cs = CASSETTES[this.confirm % CASSETTES.length];
      font.wrap(cs.t, SW - 6).forEach((l, i) => font.text(ctx, l, SX + 3, SY + 16 + i * 9, '#ffd23f'));
      font.wrap(cs.b, SW - 6).forEach((l, i) => font.text(ctx, l, SX + 3, SY + 36 + i * 9, '#f4f4f0'));
      return;
    }
    if (!list.length) { font.wrap('Encuentra cassettes escondidos por la ciudad.', SW - 10).forEach((l, i) => font.text(ctx, l, SX + SW / 2, SY + 50 + i * 9, '#a8a8b8', { align: 'center' })); return; }
    const top = Math.max(0, this.sub - 10);
    list.slice(top, top + 12).forEach((ci, k) => {
      const i = top + k, sel = i === this.sub;
      font.text(ctx, (sel ? '► ' : '  ') + CASSETTES[ci % CASSETTES.length].t.slice(0, 22), SX + 3, SY + 16 + k * 10, sel ? '#ffd23f' : '#f4f4f0');
    });
  },

  r_logros(ctx) {
    const s = G.state;
    this.header(ctx, `LOGROS ${s.achievements.length}/${ACHIEVEMENTS.length}`, '#ffd23f');
    const top = Math.max(0, Math.min(this.sub - 2, ACHIEVEMENTS.length - 5));
    ACHIEVEMENTS.slice(top, top + 5).forEach((a, k) => {
      const i = top + k, got = s.achievements.includes(a.id), sel = i === this.sub;
      const y = SY + 15 + k * 24;
      ctx.fillStyle = sel ? '#3a3a2a' : '#22223a'; ctx.fillRect(SX + 2, y, SW - 4, 22);
      font.text(ctx, (got ? '★ ' : '☆ ') + a.name.slice(0, 20), SX + 4, y + 2, got ? '#ffd23f' : '#8a8a9a');
      font.text(ctx, a.desc.slice(0, 24), SX + 4, y + 12, '#a8a8b8');
    });
    const c = s.collect;
    font.text(ctx, `Cassettes ${c.cassettes.length}/15  Estrellas ${c.stars.length}/10`, SX + 3, SY + SH - 20, '#c8c8d8');
    font.text(ctx, `Grafitis ${c.graffiti.length}/20  Kazoos ${c.kazoos.length}/5`, SX + 3, SY + SH - 10, '#c8c8d8');
  },

  r_ajustes(ctx) {
    this.header(ctx, 'AJUSTES', '#c8c8d8');
    const st = G.settings;
    const rows = [
      ['Música', bar(st.music)], ['Efectos', bar(st.sfx)], ['Modo streamer', st.streamer ? 'SÍ' : 'NO'],
      ['Temblor', st.shake ? 'SÍ' : 'NO'], ['Timer speedrun', st.speedrun ? 'SÍ' : 'NO'], ['Subtítulos', st.subtitles ? 'SÍ' : 'NO'],
    ];
    rows.forEach(([k, v], i) => {
      const y = SY + 16 + i * 16, sel = i === this.sub;
      if (sel) { ctx.fillStyle = '#3a3a6a'; ctx.fillRect(SX + 2, y - 2, SW - 4, 13); }
      font.text(ctx, k, SX + 5, y, sel ? '#ffd23f' : '#f4f4f0');
      font.text(ctx, v, SX + SW - 5, y, '#5adcf0', { align: 'right' });
    });
    font.wrap('Modo streamer: censura groserías con un bip. Ideal para transmitir.', SW - 8).forEach((l, i) => font.text(ctx, l, SX + 4, SY + 116 + i * 9, '#a8a8b8'));
  },

  r_guardar(ctx) {
    this.header(ctx, 'GUARDAR', '#c878f0');
    for (let i = 0; i < 3; i++) {
      const y = SY + 20 + i * 26, sel = i === this.sub;
      ctx.fillStyle = sel ? '#4a2a6a' : '#22223a'; ctx.fillRect(SX + 2, y, SW - 4, 22);
      font.text(ctx, 'RANURA ' + (i + 1), SX + 6, y + 7, sel ? '#ffd23f' : '#f4f4f0');
    }
    font.wrap('También puedes guardar durmiendo en tu cama.', SW - 8).forEach((l, i) => font.text(ctx, l, SX + 4, SY + 104 + i * 9, '#a8a8b8'));
  },
};

function bar(v) { return '■'.repeat(Math.round(v * 5)) + '·'.repeat(5 - Math.round(v * 5)); }
