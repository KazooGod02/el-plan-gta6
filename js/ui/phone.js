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

// APPS[0] ("Misión") is the wide widget at the top of the home screen; the rest is a 3x3 grid
const APPS = [
  { id: 'mision', name: 'Misión', icon: '#ff7a3c', glyph: '►' },
  { id: 'chat', name: 'Chat', icon: '#46b450', glyph: '✉' },
  { id: 'market', name: 'Market', icon: '#3c64dc', glyph: '$' },
  { id: 'map', name: 'Mapa', icon: '#28b4a0', glyph: '▲' },
  { id: 'debt', name: 'Deuda', icon: '#d8323c', glyph: '!' },
  { id: 'radio', name: 'Radio', icon: '#f08c28', glyph: '♪' },
  { id: 'lore', name: 'Cintas', icon: '#e0a82e', glyph: '■' },
  { id: 'logros', name: 'Logros', icon: '#ffd23f', glyph: '★' },
  { id: 'ajustes', name: 'Ajustes', icon: '#6e6e82', glyph: '*' },
  { id: 'guardar', name: 'Guardar', icon: '#8c46c8', glyph: '♦' },
];

const PX = 174, PY = 4, PW = 142, PH = 172;
const SX = PX + 8, SY = PY + 18, SW = PW - 16, SH = PH - 34;

export const phone = {
  open: false,
  opens: 0,       // times the phone was opened: missions can't watch `open` (scripts pause while it's up)
  app: null, sel: 0, scroll: 0, tab: 0, sub: 0, confirm: null, anim: 0,

  toggle() {
    if (this.open) this.close();
    else {
      if (G.lockInput || G.paused) return;
      this.open = true; this.opens++; this.app = null; this.sel = 0; this.anim = 0; G.paused = true; G.phoneBadge = 0;
      audio.sfx('phone');
    }
  },
  close() { this.open = false; this.app = null; G.paused = false; audio.sfx('back'); if (G.settings) saveSettings(G.settings); },

  update(dt) {
    if (!this.open) return;
    this.anim = Math.min(1, this.anim + dt * 6);
    if (input.pressed('phone')) { this.close(); return; }
    if (!this.app) {
      const cols = 3, n = APPS.length;
      if (input.pressed('right')) { this.sel = (this.sel + 1) % n; audio.sfx('move'); }
      if (input.pressed('left')) { this.sel = (this.sel + n - 1) % n; audio.sfx('move'); }
      // widget (0) sits above the first grid row (1..3)
      if (input.pressed('down')) { this.sel = this.sel === 0 ? 1 : this.sel + cols < n ? this.sel + cols : 0; audio.sfx('move'); }
      if (input.pressed('up')) { this.sel = this.sel === 0 ? n - cols : this.sel <= cols ? 0 : this.sel - cols; audio.sfx('move'); }
      if (input.pressed('a') && APPS[this.sel].id === 'map') { this.close(); G.bigmap.show(); input.consume('a'); return; }
      if (input.pressed('a')) { this.app = APPS[this.sel].id; this.scroll = 0; this.sub = 0; this.tab = 0; this.confirm = null; audio.sfx('select'); if (this.app === 'chat') this.scroll = 9999; }
      if (input.pressed('back') || input.pressed('b') || input.pressed('pause')) this.close();
      return;
    }
    const back = input.pressed('back') || input.pressed('b') || input.pressed('pause');
    const f = this['u_' + this.app];
    if (f) f.call(this, back); else if (back) this.app = null;
  },

  u_mision(back) {
    const story = G.story;
    if (this.confirm !== null) {
      if (input.pressed('a')) {
        this.confirm = null; this.close(); input.consume('a');
        if (!story.restartMission()) UI.toast('No hay misión que reiniciar', '#d8323c', 2);
      } else if (back) { this.confirm = null; audio.sfx('back'); }
      return;
    }
    if (back) { this.app = null; audio.sfx('back'); return; }
    if (input.pressed('a')) {
      if (story.active) { this.confirm = 'restart'; audio.sfx('select'); return; }
      this.close(); input.consume('a');
      const t = story.findNextMission();
      if (!t) UI.toast('No hay misión disponible ahorita', '#f4f4f0', 2);
    }
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
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    const oy = Math.round((1 - this.anim) * 60);
    ctx.save(); ctx.translate(0, oy);
    // body: rounded case with a bezel and side buttons
    rr(ctx, PX - 2, PY - 2, PW + 4, PH + 4, 10, '#07070c');
    rr(ctx, PX, PY, PW, PH, 9, '#23232e');
    rr(ctx, PX + 1, PY + 1, PW - 2, 3, 2, '#3a3a4a');
    ctx.fillStyle = '#15151c'; ctx.fillRect(PX - 3, PY + 30, 2, 14); ctx.fillRect(PX - 3, PY + 50, 2, 10); ctx.fillRect(PX + PW + 1, PY + 38, 2, 18);
    rr(ctx, SX - 1, SY - 13, SW + 2, SH + 16, 5, '#05050a');
    // screen + wallpaper
    const s = G.state;
    ctx.save(); ctx.beginPath(); roundPath(ctx, SX, SY - 12, SW, SH + 14, 4); ctx.clip();
    wallpaper(ctx, this.app);
    // notch + status bar
    ctx.fillStyle = '#05050a'; ctx.fillRect(SX + SW / 2 - 14, SY - 12, 28, 5); ctx.fillRect(SX + SW / 2 - 12, SY - 7, 24, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(SX, SY - 12, SW, 11);
    font.text(ctx, clock(s.clock), SX + 3, SY - 10, '#f4f4f0');
    // signal + battery
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < 3 ? '#f4f4f0' : '#6a6a7a'; ctx.fillRect(SX + SW - 30 + i * 3, SY - 4 - i * 2, 2, 2 + i * 2); }
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(SX + SW - 16, SY - 9, 12, 6); ctx.fillStyle = '#05050a'; ctx.fillRect(SX + SW - 15, SY - 8, 10, 4);
    ctx.fillStyle = '#d8323c'; ctx.fillRect(SX + SW - 15, SY - 8, 2, 4); ctx.fillStyle = '#f4f4f0'; ctx.fillRect(SX + SW - 4, SY - 7, 1, 2);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(SX, SY, SW, SH); ctx.clip();
    if (!this.app) this.r_home(ctx);
    else { const f = this['r_' + this.app]; if (f) f.call(this, ctx); }
    ctx.restore();
    // cracked glass (Kazoo bought it used)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(SX + SW - 12, SY - 12); ctx.lineTo(SX + SW - 22, SY + 8); ctx.lineTo(SX + SW - 10, SY + 20); ctx.moveTo(SX + SW - 22, SY + 8); ctx.lineTo(SX + SW - 36, SY + 13); ctx.stroke();
    // home bar + hint
    rr(ctx, PX + PW / 2 - 14, PY + PH - 9, 28, 3, 1, '#6a6a7a');
    font.text(ctx, this.app ? 'B: ATRÁS' : 'B: CERRAR', PX + PW / 2, PY + PH + 4, '#a8a8b8', { align: 'center', outline: '#101018' });
    ctx.restore();
  },

  header(ctx, title, col = '#ffd23f') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(SX, SY, SW, 13);
    ctx.fillStyle = col; ctx.fillRect(SX, SY + 12, SW, 1);
    font.text(ctx, '◄', SX + 3, SY + 3, '#a8a8b8');
    font.text(ctx, title, SX + SW / 2 + 3, SY + 3, col, { align: 'center' });
  },

  r_home(ctx) {
    const s = G.state;
    // mission widget (replaces the old big clock: the time is already in the status bar)
    const info = G.story.missionInfo();
    const wsel = this.sel === 0;
    if (wsel) rr(ctx, SX + 1, SY + 1, SW - 2, 29, 5, '#f4f4f0');
    rr(ctx, SX + 2, SY + 2, SW - 4, 27, 4, 'rgba(10,10,24,0.78)');
    font.text(ctx, '► MISIÓN', SX + 6, SY + 5, wsel ? '#ffd23f' : '#ff9a5a');
    font.text(ctx, `Día ${s.day}`, SX + SW - 6, SY + 5, '#a8a8b8', { align: 'right' });
    let line = info.active ? (info.objective || info.active) : info.next.length ? 'Siguiente: ' + info.next[0].title : info.finished ? 'Historia terminada' : 'Sin misión por ahora';
    line = censor(line.replace(/ — sigue la flecha.*$/, ''));
    const l1 = font.wrap(line, SW - 12)[0] || '';
    font.text(ctx, l1 + (l1.length < line.length ? '…' : ''), SX + 6, SY + 16, '#f4f4f0');
    APPS.slice(1).forEach((a, k) => {
      const i = k + 1;
      const cx = SX + Math.round((SW - 102) / 2) + (k % 3) * 40, cy = SY + 33 + Math.floor(k / 3) * 34;
      const sel = i === this.sel;
      if (sel) rr(ctx, cx - 3, cy - 3, 28, 28, 6, '#f4f4f0');
      rr(ctx, cx - 1, cy - 1, 24, 24, 5, '#05050a');
      rr(ctx, cx, cy, 22, 22, 5, a.icon);
      rr(ctx, cx, cy, 22, 9, 5, shade(a.icon, 1.25));
      ctx.fillStyle = a.icon; ctx.fillRect(cx, cy + 7, 22, 3);
      font.text(ctx, a.glyph, cx + 11, cy + 4, '#101018', { align: 'center', scale: 2 });
      font.text(ctx, a.name, cx + 11, cy + 25, sel ? '#ffd23f' : '#f4f4f0', { align: 'center', shadow: 'rgba(0,0,0,0.7)' });
      if (a.id === 'chat' && G.phoneBadge) { rr(ctx, cx + 15, cy - 4, 10, 10, 5, '#d8323c'); font.text(ctx, String(Math.min(9, G.phoneBadge)), cx + 20, cy - 2, '#fff', { align: 'center' }); }
    });
  },

  r_mision(ctx) {
    const info = G.story.missionInfo();
    this.header(ctx, 'MISIÓN', '#ff9a5a');
    let y = SY + 16;
    const put = (txt, col, max = 6) => { for (const l of font.wrap(censor(txt), SW - 8).slice(0, max)) { font.text(ctx, l, SX + 4, y, col); y += 9; } };
    put(info.chapter, '#a8a8b8', 2);
    put(`Día ${info.day}`, '#a8a8b8', 1);
    y += 3;
    if (info.active) {
      put(info.side ? 'EXTRAÑOS Y LOCOS:' : 'EN CURSO:', '#ff9a5a', 1);
      put(info.active, '#f4f4f0', 2);
      y += 3;
      put('OBJETIVO:', '#ff9a5a', 1);
      put(info.objective || 'Sigue la escena.', '#ffd23f', 5);
    } else if (info.next.length) {
      put('SIGUIENTE:', '#ff9a5a', 1);
      for (const n of info.next.slice(0, 4)) put('► ' + n.title + (n.locked ? ' (PRÓXIMAMENTE)' : n.where && n.where !== n.title ? ' — ' + n.where : ''), n.locked ? '#6a6a7a' : '#ffd23f', 2);
    } else put(info.finished ? '¡Terminaste la historia! La ciudad es tuya.' : 'No hay misión de historia por ahora. Recorre la ciudad.', '#f4f4f0', 3);
    // action bar
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(SX, SY + SH - 13, SW, 13);
    font.text(ctx, info.active ? 'A: REINICIAR MISIÓN' : 'A: MARCAR EN EL GPS', SX + SW / 2, SY + SH - 10, '#5adcf0', { align: 'center' });
    if (this.confirm !== null) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(SX + 4, SY + 40, SW - 8, 50);
      font.text(ctx, '¿Reiniciar la misión?', SX + SW / 2, SY + 46, '#f4f4f0', { align: 'center' });
      font.text(ctx, 'Empieza desde el inicio.', SX + SW / 2, SY + 58, '#a8a8b8', { align: 'center' });
      font.text(ctx, 'A: SÍ   B: NO', SX + SW / 2, SY + 74, '#ffd23f', { align: 'center' });
    }
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
    const top = Math.max(0, Math.min(this.sub - 2, items.length - 4));
    items.slice(top, top + 4).forEach((it, k) => {
      const i = top + k, y = SY + 15 + k * 24;
      const sel = i === this.sub, owned = G.state.items.includes(it.id);
      ctx.fillStyle = sel ? '#3a3a6a' : '#22223a'; ctx.fillRect(SX + 2, y, SW - 4, 22);
      font.text(ctx, it.name.length > 23 ? it.name.slice(0, 22) + '…' : it.name, SX + 5, y + 2, owned ? '#6a6a7a' : '#f4f4f0');
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

function roundPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function rr(ctx, x, y, w, h, r, col) { ctx.fillStyle = col; ctx.beginPath(); roundPath(ctx, x, y, w, h, Math.min(r, w / 2, h / 2)); ctx.fill(); }

// Puerto Vicio sunset behind the icons; apps get a calmer dark gradient
function wallpaper(ctx, app) {
  const g = ctx.createLinearGradient(0, SY - 12, 0, SY + SH);
  if (app) { g.addColorStop(0, '#1a1a34'); g.addColorStop(1, '#241a3a'); }
  else { g.addColorStop(0, '#2a1a5a'); g.addColorStop(0.55, '#c8508a'); g.addColorStop(1, '#f0a050'); }
  ctx.fillStyle = g; ctx.fillRect(SX, SY - 12, SW, SH + 14);
  if (app) return;
  ctx.fillStyle = 'rgba(255,230,160,0.8)'; ctx.beginPath(); ctx.arc(SX + SW / 2, SY + SH - 22, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0e2a';
  const bs = [[0, 22], [10, 34], [20, 26], [30, 44], [42, 30], [54, 38], [66, 24], [76, 40], [88, 28], [98, 34], [108, 20]];
  for (const [x, h] of bs) ctx.fillRect(SX + x, SY + SH - h, 10, h);
  for (const px of [SX + 6, SX + SW - 10]) { ctx.fillRect(px, SY + SH - 40, 2, 40); ctx.fillRect(px - 5, SY + SH - 42, 12, 2); }
}

function bar(v) { return '■'.repeat(Math.round(v * 5)) + '·'.repeat(5 - Math.round(v * 5)); }
