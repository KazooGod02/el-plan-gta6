// Mission manager, doors, respawns, free-roam activities, saving.
import { G, setScene, on, emit } from '../core/game.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { UI } from '../ui/ui.js';
import { runner, MissionFail, wait, say, ask, fadeOut, fadeIn, card, lock, talk } from './script.js';
import { MISSIONS, CHAPTERS } from './missions/index.js';
import { MAP, TS, zoneOf } from '../world/map.js';
import { ROOMS, FLOOR } from '../interior/rooms.js';
import { saveSlot, loadSlot, saveGlobal } from '../core/save.js';
import { newState } from './state.js';
import { unlock } from './achievements.js';
import { CONFIG } from '../config.js';
import { SONGS } from '../data/music.js';
import { RADIO_STATIONS, CASSETTES, BARKS, MARKET_ITEMS } from '../data/strings.js';
import { dist, pick, money, clamp } from '../core/util.js';
import { minigames } from '../minigames/index.js';

export const story = {
  active: null,
  triggers: [],
  failCounts: {},
  ready: false,

  init() {
    if (this.ready) return; this.ready = true;
    on('door', (d) => this.onDoor(d));
    on('roomExitDoor', (e, roomId) => this.onRoomExit(e, roomId));
    on('wasted', () => this.onDeath('wasted'));
    on('busted', () => this.onDeath('busted'));
    on('collect', (k, i) => this.onCollect(k, i));
    on('wanted', (n) => { if (n >= 5) unlock('bro'); });
    on('zone', (z) => { if (z === 'afueras') { const p = G.scenes.city.pos(); if (dist(p.x, p.y, MAP.places.arbol.x, MAP.places.arbol.y) < 300 && G.state.chapter < 6) unlock('paalla'); } });
    on('enterVehicle', () => { G.radioShowT = 3; });
  },

  // ------------------------------------------------------------ game start
  newGame() {
    G.state = newState();
    this.failCounts = {};
    this.active = null;
    G.scenes.city.init();
    G.scenes.city.setUnlocked(G.state.unlocked);
    G.scenes.city.vehicles = []; G.scenes.city.peds = []; G.scenes.city.markers = [];
    G.scenes.city.wanted = 0;
    G.scenes.city.player.hp = 100;
    this.refreshTriggers(true);
  },

  loadGame(slot) {
    const data = loadSlot(slot);
    if (!data) return false;
    G.state = { ...newState(), ...data.state };
    G.state.stats = { ...newState().stats, ...data.state.stats };
    G.settings.lastSlot = slot;
    this.active = null;
    const c = G.scenes.city;
    c.init();
    c.setUnlocked(G.state.unlocked);
    c.vehicles = []; c.peds = []; c.markers = []; c.wanted = 0; c.player.hp = 100; c.player.car = null;
    const pos = G.state.pos;
    if (pos.scene === 'interior' && ROOMS[pos.room]) { setScene('interior', { room: pos.room, x: pos.x }); this.populateRoom(pos.room); }
    else setScene('city', { x: pos.x, y: pos.y });
    this.refreshTriggers(true);
    UI.fade = 1; UI.fadeTarget = 0;
    return true;
  },

  save(slot = G.settings.lastSlot || 0) {
    const s = G.state;
    const c = G.scenes.city;
    if (G.scene === G.scenes.interior) s.pos = { scene: 'interior', room: G.scenes.interior.roomId, x: Math.round(G.scenes.interior.p.x) };
    else { const p = c.pos(); s.pos = { scene: 'city', x: Math.round(p.x), y: Math.round(p.y) }; }
    const ok = saveSlot(slot, s);
    G.settings.lastSlot = slot;
    return ok;
  },

  // ------------------------------------------------------------ missions
  isDone(id) { return G.state.done.includes(id); },
  available() {
    return MISSIONS.filter((m) => !this.isDone(m.id) && (m.requires || []).every((r) => this.isDone(r)));
  },
  episodeLock(m) {
    for (const ep of CONFIG.episodes || []) {
      if (m.chapter >= ep.chapter && ep.date && Date.now() < new Date(ep.date).getTime()) return ep;
    }
    return null;
  },

  refreshTriggers(startAuto = false) {
    const c = G.scenes.city;
    for (const t of this.triggers) c.removeMarker(t);
    this.triggers = [];
    if (this.active || G.state.freeMode) return;
    for (const m of this.available()) {
      const lockEp = this.episodeLock(m);
      if (!m.trigger) {
        if (startAuto && !lockEp && !this.active) { this.startMission(m, 'auto'); return; }
        continue;
      }
      const pos = this.triggerPos(m);
      if (!pos) continue;
      const mk = c.addMarker({
        x: pos.x, y: pos.y, r: 14, letter: m.trigger.letter || 'K', color: lockEp ? '#6a6a7a' : m.trigger.color || '#ffd23f',
        label: lockEp ? 'PRÓXIMAMENTE' : m.trigger.label || null, persistent: true, mission: m.id,
        onEnter: () => {
          if (lockEp) { UI.toast('Disponible el ' + new Date(lockEp.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }), '#ffd23f', 4); return; }
          if (!this.active && G.lockInput === 0) this.startMission(m, 'marker');
        },
      });
      this.triggers.push(mk);
    }
    if (!this.active && UI.fadeTarget > 0 && G.lockInput === 0) UI.fadeTarget = 0;
  },
  triggerPos(m) {
    const t = m.trigger;
    if (t.place) return MAP.places[t.place];
    if (t.door) return MAP.places[t.door];
    if (t.x !== undefined) return { x: t.x, y: t.y };
    return null;
  },

  startMission(m, via) {
    if (this.active) return;
    const c = G.scenes.city;
    for (const t of this.triggers) c.removeMarker(t);
    this.triggers = [];
    const ctx = {
      m, via, fails: [],
      check: (fn) => ctx.fails.push(fn),
      fail: (reason) => { throw new MissionFail(reason); },
    };
    G.state.chapter = Math.max(G.state.chapter, m.chapter);
    G.state.chapterName = CHAPTERS[m.chapter]?.short || '';
    this.active = { m, ctx };
    const self = this;
    function* wrapper() {
      if (m.chapterStart) {
        if (UI.card) yield* wait(Math.max(0, UI.card.t - 0.3));
        const ch = CHAPTERS[m.chapter];
        yield* fadeOut(0.5);
        lock(true);
        UI.showCard(ch.title, ch.label, 4.2, 'chapter'); audio.sfx('star');
        yield* wait(4.2);
        lock(false);
        if (m.chapterStart !== 'keepDark') yield* fadeIn(0.5);
      }
      yield* m.run(ctx);
    }
    const task = runner.run(wrapper(), m.id);
    this.active.task = task;
    task.onDone = () => self.complete(m);
    task.onError = (e) => self.fail(e instanceof MissionFail ? e.reason : 'Algo salió mal', 'fail');
  },

  complete(m) {
    this.active = null;
    G.lockInput = 0;
    UI.letterboxTarget = 0; UI.timer = null; UI.meter = null; UI.setObjective('');
    G.musicOverride = null;
    G.scenes.city.clearMission();
    G.scenes.city.wantedLocked = false; G.scenes.city.noEvade = false; G.scenes.city.maxWanted = 5; G.scenes.city.policeKnows = false; G.scenes.city.noPolice = false;
    G.scenes.city.trafficOn = true; G.scenes.city.pedsOn = true; G.scenes.city.frozen = false; G.scenes.city.lockCar = false; G.scenes.city.extraDraw = null;
    G.forceDark = undefined;
    if (!G.state.done.includes(m.id)) G.state.done.push(m.id);
    if (!m.silent) {
      const r = m.rating ? m.rating(G.state) : null;
      audio.sfx('pass');
      UI.showCard('MISIÓN SUPERADA', r ? `${r.by} te calificó ${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}: ${r.text}` : m.title, 4, 'pass');
      if (m.reward) { G.state.money += m.reward; }
    }
    this.save();
    const g = G.global;
    if (m.final) { g.finished = true; saveGlobal(g); }
    this.refreshTriggers(true);
  },

  fail(reason, kind) {
    const a = this.active;
    if (!a) return;
    runner.cancel(a.task);
    this.active = null;
    G.lockInput = 0;
    UI.closeDialog(); UI.letterboxTarget = 0; UI.timer = null; UI.meter = null; UI.setObjective(''); UI.overFade = null;
    G.musicOverride = null; G.forceDark = undefined;
    const c = G.scenes.city;
    c.wantedLocked = false; c.noEvade = false; c.maxWanted = 5; c.policeKnows = false; c.noPolice = false; c.frozen = false; c.lockCar = false; c.extraDraw = null;
    c.trafficOn = true; c.pedsOn = true;
    this.failCounts[a.m.id] = (this.failCounts[a.m.id] || 0) + 1;
    if (this.failCounts[a.m.id] >= 3) unlock('again');
    G.state.stats.missionsFailed++;
    audio.sfx('fail');
    const self = this;
    runner.run((function* () {
      lock(true);
      UI.showCard('MISIÓN FALLIDA', reason, 3.2, 'fail');
      yield* wait(3.2);
      yield* fadeOut(0.5);
      c.clearMission();
      for (const v of c.vehicles.slice()) if (v.mission) c.removeVehicle(v);
      if (kind !== 'wasted' && kind !== 'busted') {
        const back = a.m.failPlace ? MAP.places[a.m.failPlace] : null;
        if (G.scene !== c || back) {
          const p = back || self.triggerPos(a.m) || MAP.places.pension;
          setScene('city', { x: p.x, y: p.y + 14 });
        }
      }
      lock(false);
      yield* fadeIn(0.5);
      self.refreshTriggers(true);
    })(), 'fail');
  },

  onDeath(kind) {
    const s = G.state;
    if (kind === 'wasted') s.stats.deaths++; else s.stats.busted++;
    const wasActive = !!this.active;
    if (wasActive) {
      const a = this.active; runner.cancel(a.task); this.active = null;
      this.failCounts[a.m.id] = (this.failCounts[a.m.id] || 0) + 1;
      if (this.failCounts[a.m.id] >= 3) unlock('again');
      s.stats.missionsFailed++;
    }
    const self = this;
    const c = G.scenes.city;
    runner.run((function* () {
      lock(true);
      UI.closeDialog(); UI.timer = null; UI.meter = null; UI.letterboxTarget = 0; UI.setObjective(''); UI.overFade = null;
      G.musicOverride = null; G.forceDark = undefined;
      audio.sfx('fail');
      G.slowmo = 0.35;
      UI.showCard(kind === 'wasted' ? 'TE MORISTE WEY' : 'TE AGARRARON', wasActive ? 'MISIÓN FALLIDA' : '', 3, 'fail');
      yield* wait(1.2);
      G.slowmo = 0;
      yield* wait(1.8);
      yield* fadeOut(0.6);
      c.clearMission();
      for (const v of c.vehicles.slice()) if (v.mission) c.removeVehicle(v);
      c.wanted = 0; c.heli = null; c.wantedLocked = false; c.noEvade = false; c.maxWanted = 5; c.policeKnows = false; c.noPolice = false; c.frozen = false; c.lockCar = false; c.extraDraw = null;
      c.trafficOn = true; c.pedsOn = true;
      c.peds = c.peds.filter((q) => !q.cop);
      c.vehicles = c.vehicles.filter((v) => v.ai !== 'police');
      const fee = Math.min(500, Math.floor(s.money * 0.1));
      s.money -= fee;
      if (kind === 'busted') { s.weapons = {}; s.weapon = 'fists'; }
      const place = kind === 'wasted' ? MAP.places.clinica : MAP.places.comandancia;
      c.player.hp = 100; c.player.dead = false; c.player.car = null;
      G.scenes.interior.p && (G.scenes.interior.p.hp = 100, G.scenes.interior.p.dead = false);
      setScene('city', { x: place.x, y: place.y + 10, a: Math.PI / 2 });
      s.clock = (s.clock + 180) % 1440;
      lock(false);
      yield* fadeIn(0.6);
      UI.toast(kind === 'wasted' ? `Cuenta de la clínica: -$${fee}` : `Multa: -$${fee}. Te quitaron las armas.`, '#d8323c', 4);
      self.refreshTriggers(true);
    })(), 'death');
  },

  // ------------------------------------------------------------ doors & rooms
  onDoor(d) {
    const a = this.active;
    if (a && a.m.onDoor) { if (a.m.onDoor(d, a.ctx) !== false) return; }
    if (a && a.m.blockDoors) { UI.toast('Ahorita no. Tienes algo que hacer.', '#f4f4f0', 2); return; }
    // pending mission triggered by this door
    if (!a) for (const m of this.available()) if (m.trigger && m.trigger.door === d.room && !this.episodeLock(m)) { this.startMission(m, 'door'); return; }
    this.enterRoom(d.room);
  },

  enterRoom(roomId, opts = {}) {
    const s = G.state;
    const closed = {
      banco: 'El Banco Federal. Todavía no es momento...', bodega: 'Bodega 7. Cerrada con candado.', tuercas: 'El taller está cerrado. Un letrero dice: "Salí a comer. Regreso nunca."',
      comandancia: s.chapter < 9 ? 'Mejor no entres a la comandancia, Kazoo.' : null,
      escondite: s.chapter < 3 ? 'Un taller abandonado. Huele a aceite y a malas decisiones.' : null,
      galpon: s.chapter < 3 ? 'Un galpón cerrado. Se escuchan disparos adentro... mejor no.' : null,
      bar: s.chapter < 2 ? 'LA ÚLTIMA RISA — Abre en la noche. (O cuando la historia te traiga.)' : null,
      disfraces: s.chapter < 3 ? 'DISFRACES CARNAVAL — "Cerrado por inventario".' : null,
    };
    if (closed[roomId]) { UI.toast(closed[roomId], '#f4f4f0', 3); return false; }
    audio.sfx('door');
    const room = ROOMS[roomId];
    const ex = room.exits[0];
    G.cityHp = G.scenes.city.player.hp;
    setScene('interior', { room: roomId, x: opts.x ?? (ex ? ex.x + ex.w + 12 : 40), facing: 1 });
    G.cityHp = undefined;
    this.populateRoom(roomId);
    return true;
  },

  onRoomExit(exit, roomId) {
    const a = this.active;
    if (a && a.m.onRoomExit) { if (a.m.onRoomExit(exit, roomId, a.ctx) !== false) return; }
    if (a && a.m.lockRoom) { UI.toast('No puedes salir ahorita.', '#f4f4f0', 2); return; }
    if (exit.to === 'city') {
      const p = MAP.places[exit.place] || MAP.places.pension;
      G.scenes.city.player.hp = G.scenes.interior.p.hp;
      setScene('city', { x: p.x, y: p.y + 4, a: Math.PI / 2 });
    } else {
      setScene('interior', { room: exit.to, x: exit.spawnX || 40 });
      this.populateRoom(exit.to);
    }
  },

  populateRoom(id) {
    const r = G.scenes.interior, s = G.state;
    if (this.active && this.active.m.customRooms) return;
    const talkMenu = (who, fn) => (n) => { if (!this.active || this.active.m.allowShops) runner.run(fn(n), 'npc'); };
    switch (id) {
      case 'cuarto': {
        this.decorateCuarto();
        r.addAction({ x: 76, label: 'Dormir / Guardar', fn: () => runner.run(this.sleepMenu(), 'sleep') });
        r.addAction({ x: 46, r: 12, label: 'Leer aviso', fn: () => runner.run(talk([['narrator', 'AVISO DE DESALOJO: "Sr. Kazoo: debe 3 meses de renta. Tiene 30 días o sus cosas se van a la banqueta. — La administración. PD: el pato de hule también."']]), 'aviso') });
        if (s.items.includes('arcade')) r.addAction({ x: 330, label: 'Jugar Kazoo Kart', fn: () => minigames.start('kart') });
        break;
      }
      case 'taqueria': {
        const mari = r.addNpc({ id: 'mari', look: 'mari', x: 246, facing: -1, prompt: 'Hablar', onTalk: talkMenu('mari', () => this.mariMenu()) });
        void mari;
        r.addNpc({ look: 3, x: 60, facing: 1, pose: 'sit', y: FLOOR - 2 });
        this.teaserWatch(r, 160);
        break;
      }
      case 'tiendita':
        r.addNpc({ id: 'lupita', look: 'lupita', x: 250, facing: -1, onTalk: talkMenu('lupita', () => this.shopMenu()) });
        break;
      case 'bar':
        r.addNpc({ id: 'cantinero', look: 'bartender', x: 320, facing: -1, onTalk: talkMenu('bartender', () => this.barMenu()) });
        r.addNpc({ look: 7, x: 430, facing: 1 }); r.addNpc({ look: 12, x: 470, facing: -1, pose: 'sit' });
        r.addAction({ x: 58, label: 'Jugar Kazoo Kart', fn: () => { if (!this.active || this.active.m.allowShops) minigames.start('kart'); } });
        this.teaserWatch(r, 260);
        break;
      case 'disfraces':
        r.addNpc({ id: 'clerk', look: 'clerk', x: 300, facing: -1, onTalk: talkMenu('clerk', () => this.masksMenu()) });
        break;
      case 'galpon':
        r.addNpc({ id: 'tia', look: 'tia', x: 214, facing: -1, onTalk: talkMenu('tia', () => this.tiaMenu()) });
        break;
      case 'donchuy':
        r.addNpc({ id: 'chuy', look: 'donchuy', x: 110, facing: 1, pose: 'sit', y: FLOOR - 4, onTalk: talkMenu('donchuy', () => this.chuyMenu()) });
        r.addNpc({ look: 'thug', x: 60, facing: 1 }); r.addNpc({ look: 'thug', x: 290, facing: -1 });
        break;
      case 'escondite':
        r.prop('plan').plan = s.chapter >= 3;
        if (s.chapter >= 5 && !this.isDone('c8_entrada')) r.props.push({ t: 'tsuruside', x: 330, col: '#d8d8d0', id: 'tsuru' });
        break;
      case 'comandancia':
        r.addNpc({ look: 'cop', x: 200, facing: -1, onTalk: () => runner.run(say('cop', '¿Qué se le ofrece? ...¿No lo conozco de algún lado?', 'serious'), 'cop') });
        break;
      case 'clinica':
        r.addNpc({ look: 'teller', x: 270, facing: -1, name: 'ENFERMERA', onTalk: () => runner.run(say('teller', 'Ya estás bien. Más o menos. Trata de no morirte tan seguido, ¿sí?', 'normal', { name: 'ENFERMERA' }), 'nurse') });
        break;
      default: break;
    }
  },

  teaserWatch(r, tvx) {
    let t = 0;
    const prev = r.onUpdate;
    r.onUpdate = (dt) => {
      if (prev) prev(dt);
      if (Math.abs(r.p.x - tvx) < 40 && !r.p.moving) { t += dt; if (t > 10) unlock('teaser'); } else t = 0;
    };
  },

  decorateCuarto() {
    const r = G.scenes.interior, s = G.state;
    const slots = { pan: { x: 88, y: 131 }, lava: { x: 176, y: 136 }, planta: { x: 140 }, kazoo: { x: 186, y: 136 }, tele: { x: 196 }, sillon: { x: 210 }, disco: { x: 230, y: 62 }, pato: { x: 110 }, arcade: { x: 330 }, trofeo: { x: 166, y: 136 }, cuadro: { x: 20, y: 110 }, poster: { x: 244, y: 104 } };
    const map = { pan: 'pan', lava: 'lava', planta: 'plant', kazoo: 'kazooGold', tele: 'tv', sillon: 'sofa', disco: 'disco', pato: 'pato', arcade: 'arcade', trofeo: 'trophy', cuadro: 'cuadro', poster: 'poster' };
    for (const it of s.items) if (slots[it]) r.props.push({ t: map[it], ...slots[it], col: '#6a5a3a', stain: it === 'sillon', text: it === 'poster' ? 'VC' : undefined, col2: '#ff3cc8' });
  },

  // ------------------------------------------------------------ free-roam menus
  *sleepMenu() {
    if (this.active && !this.active.m.allowSleep) { yield* say('kazoo', 'No puedo dormir ahorita, tengo cosas que hacer.', 'normal'); return; }
    const c = yield* ask('kazoo', '¿Qué hago?', ['Dormir hasta la mañana', 'Dormir hasta la noche', 'Guardar partida', 'Nada']);
    if (c === 0 || c === 1) {
      yield* fadeOut(0.8);
      G.state.clock = c === 0 ? 8 * 60 : 20 * 60;
      G.scenes.interior.p.hp = 100; G.scenes.city.player.hp = 100;
      yield* wait(0.6);
      yield* fadeIn(0.8);
      this.save();
      UI.toast('Partida guardada', '#46d470', 2);
    } else if (c === 2) {
      const slot = yield* ask('narrator', 'Elige una ranura:', ['Ranura 1', 'Ranura 2', 'Ranura 3', 'Cancelar']);
      if (slot < 3) { this.save(slot); UI.toast('Guardado en ranura ' + (slot + 1), '#46d470', 2); }
    }
  },

  *mariMenu() {
    const s = G.state;
    const opts = ['Unos tacos ($30)', 'Hacer repartos', 'Jugar lotería ($50)', 'Nada, gracias'];
    const lines = ['¿Qué vas a querer, mijo?', 'Ándale, que se enfrían.', '¿Otra vez tú? Pásale.', 'Si no compras, al menos no estorbes.'];
    const c = yield* ask('mari', pick(lines), opts, 'happy');
    if (c === 0) {
      if (s.money < 30) { yield* say('mari', 'No te alcanza, mijo. Ándale, te fío uno. Nomás uno.', 'sad'); G.scenes.interior.p.hp = Math.min(100, G.scenes.interior.p.hp + 25); return; }
      s.money -= 30; audio.sfx('coin'); G.scenes.interior.p.hp = 100;
      yield* say('kazoo', pick(['Mmm. Esto es arte.', 'Doña Mari, cásese conmigo.', 'Con estos tacos hasta se me olvida que debo 50 mil.']), 'happy');
    } else if (c === 1) {
      minigames.start('delivery');
    } else if (c === 2) {
      if (s.money < 50) { yield* say('mari', 'Sin dinero no hay lotería, mijo.', 'normal'); return; }
      minigames.start('loteria');
    }
  },

  *shopMenu() {
    const s = G.state;
    const items = [['Refresco', 15, 15], ['Papitas', 12, 10], ['Tortas de jamón', 40, 35], ['Botiquín', 150, 100]];
    const c = yield* ask('lupita', '¡Bienvenido a Abarrotes Lupita! Si no lo tenemos, se acabó.', [...items.map(([n, p]) => `${n} ($${p})`), 'Nada']);
    if (c < items.length) {
      const [n, p, hp] = items[c];
      if (s.money < p) { yield* say('lupita', 'No te alcanza. ¿Quieres que te apunte en la libreta? ...No, mejor no.', 'normal'); return; }
      s.money -= p; audio.sfx('coin');
      G.scenes.interior.p.hp = Math.min(100, G.scenes.interior.p.hp + hp);
      UI.toast(`${n}: +${hp} vida`, '#46d470', 2);
    }
  },

  *barMenu() {
    const c = yield* ask('bartender', '¿Qué te sirvo? Aquí nadie se ríe, pero todos toman.', ['Un chisme', 'Un agua mineral ($20)', 'Nada']);
    if (c === 0) {
      const s = G.state;
      const tips = [
        'Dicen que hay cassettes perdidos por toda la ciudad. Con grabaciones raras. Cosas de la policía, de Coqui... ',
        'Un compa jura que hay estrellas doradas escondidas. Si juntas las diez, te enteras de algo.',
        'Hay unos kazoos tirados por ahí. Si los juntas todos, suenan una canción. O eso dicen los borrachos.',
        'Ese vendedor del Marketplace, VendeRápido... viene aquí a veces. Siempre paga con billetes nuevecitos.',
        'La Tía Gris vende... cosas. En el puerto. No le digas que yo te dije.',
        'Si traes a la tira atrás, métete a un Pinta y Olvida. Te pintan el carro y ya no te reconocen. Así de listos son.',
      ];
      yield* say('bartender', pick(tips), 'normal');
      void s;
    } else if (c === 1) {
      if (G.state.money >= 20) { G.state.money -= 20; audio.sfx('coin'); G.scenes.interior.p.hp = Math.min(100, G.scenes.interior.p.hp + 15); yield* say('bartender', 'Agua mineral. En La Última Risa. Qué valiente.', 'smug'); }
    }
  },

  *masksMenu() {
    if (G.state.chapter < 3 || !this.isDone('c3_mascaras')) { yield* say('clerk', 'Bienvenido a Disfraces Carnaval. Todo al 2x1. Menos lo bonito.', 'normal'); return; }
    const c = yield* ask('clerk', '¿Otra vez las máscaras? ¿Quieres cambiar algo?', ['Cambiar máscaras', 'Nada']);
    if (c === 0) minigames.start('costume');
  },

  *tiaMenu() {
    const s = G.state;
    if (!this.isDone('c3_tia')) { yield* say('tia', 'No te conozco. Lárgate.', 'serious'); return; }
    const opts = ['Balas de pistola x12 ($120)', 'Escopeta ($1,800)', 'Cartuchos x8 ($200)', 'Campo de tiro', 'Nada'];
    const c = yield* ask('tia', 'Kazoo. ¿Qué necesitas? Rápido, que el tiempo cuesta.', opts, 'serious');
    const buy = (price, fn) => { if (s.money < price) { UI.toast('No te alcanza', '#d8323c', 2); return false; } s.money -= price; audio.sfx('reload'); fn(); return true; };
    if (c === 0) buy(120, () => { s.weapons.pistol = (s.weapons.pistol || 0) + 12; });
    if (c === 1) { if (s.weapons.shotgun !== undefined) { yield* say('tia', 'Ya tienes una. ¿Para qué quieres dos? No contestes.', 'serious'); } else buy(1800, () => { s.weapons.shotgun = 8; }); }
    if (c === 2) { if (s.weapons.shotgun === undefined) yield* say('tia', 'No tienes escopeta. ¿Los vas a aventar con la mano?', 'smug'); else buy(200, () => { s.weapons.shotgun += 8; }); }
    if (c === 3) minigames.start('range', { free: true });
  },

  *chuyMenu() {
    const s = G.state;
    const left = s.debt - s.paid;
    if (left <= 0) { yield* say('donchuy', 'Kazoo, mijo. Estamos a mano. Qué raro se siente, ¿verdad? A mí también.', 'happy'); return; }
    const c = yield* ask('donchuy', `Kazoo. Me debes ${money(left)}. ¿Vienes a abonar o a visitarme? Porque de visita no se aceptan.`, ['Abonar $500', 'Abonar $2,000', 'Abonar todo lo que traigo', 'Me voy']);
    let amt = [500, 2000, s.money, 0][c];
    amt = Math.min(amt, s.money, left);
    if (amt <= 0) { if (c < 3) yield* say('donchuy', 'No traes nada. Qué decepción. Otra más.', 'serious'); return; }
    s.money -= amt; s.paid += amt; audio.sfx('coin');
    if (s.paid >= s.debt) { unlock('deuda'); yield* say('donchuy', '...Pagaste todo. Toda la vida cobrando y nunca me había pasado. Me dan ganas de llorar. No lo voy a hacer. Pero me dan.', 'shock'); }
    else yield* say('donchuy', `Muy bien. Te faltan ${money(s.debt - s.paid)}. El reloj sigue caminando, mijo.`, 'smug');
  },

  // ------------------------------------------------------------ collectibles
  onCollect(kind, i) {
    const s = G.state;
    if (kind === 'cassettes') {
      const n = s.collect.cassettes.length;
      const cs = CASSETTES[i % CASSETTES.length];
      UI.toast(`CASSETTE ${n}/15 — revisa tu teléfono`, '#e0a82e', 3);
      runner.run(say('narrator', cs.t + ': ' + cs.b, 'normal', { name: 'CASSETTE' }), 'cassette');
      if (n >= 15) unlock('cassettes');
    } else if (kind === 'stars') {
      const n = s.collect.stars.length;
      UI.toast(`ESTRELLA DORADA ${n}/10`, '#ffd23f', 3);
      if (n >= 10) { unlock('losabia'); runner.run(this.starsReveal(), 'stars'); }
    } else if (kind === 'kazoos') {
      const n = s.collect.kazoos.length;
      UI.toast(`KAZOO ${n}/5 ♪`, '#ffd23f', 3);
      const notes = [523, 659, 784, 880, 1047];
      audio.tone && audio.ctx && audio.tone(0.125, notes[(n - 1) % 5], audio.ctx.currentTime, 0.5, 0.12);
      if (n >= 5) { unlock('kazoos'); G.musicOverride = 'sting'; setTimeout(() => { if (G.musicOverride === 'sting') G.musicOverride = null; }, 5000); }
    } else if (kind === 'graffiti') {
      const n = s.collect.graffiti.length;
      UI.toast(`GRAFITI ${n}/20`, '#ff3cc8', 2);
      if (n >= 20) { unlock('tags'); UI.toast('Desbloqueaste el outfit MARATHON', '#ff3cc8', 4); s.outfitMarathon = true; }
    }
  },

  *starsReveal() {
    yield* wait(1);
    yield* talk([
      ['narrator', 'Juntaste las 10 estrellas doradas. En la última hay algo escrito...', 'normal', { name: 'ESTRELLA DORADA' }],
      ['narrator', '"VendeRápido_5E — Informante #0005 — Comandancia de Puerto Vicio. Pago por cada carro con rastreador: $2,000."', 'normal', { name: 'ESTRELLA DORADA' }],
      ['kazoo', '...¿Rastreador? ¿Cuál rastreador? ...¿El estéreo?', 'shock'],
    ]);
    G.state.flags.knowsTracker = true;
  },

  // ------------------------------------------------------------ per-frame
  update(dt) {
    const s = G.state;
    if (!s) return;
    if (G.scene === G.scenes.city || G.scene === G.scenes.interior) {
      s.stats.playtime += dt;
      if (!G.freezeClock && !G.paused) s.clock = (s.clock + dt * (G.scene === G.scenes.city ? 2 : 1)) % 1440;
      // weather changes
      this.weatherT = (this.weatherT || 60) - dt;
      if (this.weatherT <= 0 && !G.weatherLock) { this.weatherT = 90 + Math.random() * 120; const r = Math.random(); s.weather = r < 0.62 ? 'sun' : r < 0.8 ? 'cloudy' : r < 0.95 ? 'rain' : 'storm'; }
    }
    // Pinta y Olvida: lose the police by repainting the car
    const cc = G.scenes.city;
    if (G.scene === cc && cc.player.car && cc.wanted > 0 && !cc.wantedLocked) {
      this.pintaCd = (this.pintaCd || 0) - dt;
      for (const k of ['pintaCol', 'pintaCen']) {
        const pl = MAP.places[k];
        if (this.pintaCd <= 0 && dist(cc.player.car.x, cc.player.car.y, pl.x, pl.y) < 22) {
          this.pintaCd = 5;
          if (s.money < 300) { UI.toast('Pinta y Olvida: $300. No te alcanza.', '#d8323c', 2); break; }
          s.money -= 300; cc.wanted = 0; cc.heli = null;
          cc.player.car.color = pick(['#d8323c', '#3c64dc', '#46b450', '#ffd23f', '#8c46c8', '#f4f4f0', '#1a1a2e']);
          audio.sfx('pass'); UI.flash(0.5);
          UI.toast('PINTA Y OLVIDA: -$300. Carro nuevo, vida nueva.', '#ffd23f', 3);
          unlock('pinta');
        }
      }
    }
    // mission fail checks
    const a = this.active;
    if (a && a.ctx.fails.length) {
      for (const f of a.ctx.fails) { const r = f(); if (r) { this.fail(r, 'fail'); break; } }
    }
    this.updateMusic();
  },

  updateMusic() {
    const c = G.scenes.city;
    let song = null;
    if (G.musicOverride !== undefined && G.musicOverride !== null) song = G.musicOverride || null;
    else if (G.scene === c && c.player.car && !c.player.dead) {
      const st = RADIO_STATIONS[G.state.radio % RADIO_STATIONS.length];
      song = st.song;
    } else if (G.scene === G.scenes.interior) song = G.scenes.interior.room?.music || null;
    else if (G.scene === c) song = c.wanted > 0 ? 'wanted' : null;
    if (G.scene && G.scene.song !== undefined) song = G.scene.song;
    if (audio.songName !== song) audio.play(song, SONGS);
  },
};

export function radioNext() {
  const s = G.state;
  s.radio = (s.radio + 1) % RADIO_STATIONS.length;
  G.radioShowT = 3;
  audio.sfx('move');
}
