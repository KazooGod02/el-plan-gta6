// CAPÍTULO 8 — "El Atraco" (Día 0)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo } from '../script.js';
import { P, C, R, S, line, lines, cityAt, roomAt, mash, seat, maskedLook } from './common.js';
import { play } from '../../minigames/index.js';
import { FLOOR } from '../../interior/rooms.js';
import { rand, pick } from '../../core/util.js';

export function spawnTsuruWithCrew(place, dy = 30) {
  const c = C();
  const p = P()[place];
  let t = c.vehicles.find((v) => v.type === 'tsuru' && v.mission && !v.dead);
  if (!t) { t = c.spawnVehicle('tsuru', p.x, p.y + dy, 0, { mission: true, color: '#d8d8d0' }); t.hp = 80; }
  t.keep = true; t.minHp = 0;
  t.passengers = [];
  seat(t, maskedLook('coqui'), 'COQUI');
  seat(t, { ...maskedLook('ghenghis'), bag: true, _id: 'ghM' + S().masks.ghenghis + 'bag' }, 'GHENGHIS');
  return t;
}

export const CAP8 = [
  {
    id: 'c8_entrada', chapter: 8, chapterStart: true, title: '¡Todos al suelo!', requires: ['c7_azotea'], customRooms: true, lockRoom: true, failPlace: 'escondite',
    rating: () => ({ by: 'Coqui', stars: 4, text: 'Diez y cinco. Exacto.' }),
    *run(ctx) {
      setDay(0); setClock(9, 20);
      lock(true);
      roomAt('escondite', 120);
      const r = R();
      r.prop('plan').plan = true;
      const m = S().masks;
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 190, facing: -1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 230, facing: -1, bag: true });
      yield* fadeIn(0.6);
      music('tension');
      yield* talk([
        ['coqui', 'Es hoy.', 'serious'],
        ['coqui', 'Diez y cinco. Ni un minuto antes, ni uno después. Entramos, bóveda, mochila, salimos. Nadie improvisa.', 'serious'],
        ['ghenghis', 'Nadie improvisa. Jajaja. Qué nervios.', 'laugh'],
        ['kazoo', '¿Y si algo sale mal?', 'think'],
        ['coqui', 'Nada va a salir mal.', 'serious'],
        ['ghenghis', 'Todo va a salir mal. Pero con estilo.', 'happy'],
        ['coqui', 'Máscaras.', 'serious'],
      ]);
      audio.sfx('select');
      co.mask = m.coqui; gh.mask = m.ghenghis; r.p.mask = m.kazoo;
      UI.flash(0.4);
      yield* wait(0.8);
      yield* say('ghenghis', m.ghenghis === 'payaso' ? '¡JAJAJA! ¡Me veo increíble!' : 'Me veo serio. No me gusta. Jajaja.', 'laugh');
      S().weapons.pistol = Math.max(S().weapons.pistol || 0, 60);
      yield* fadeOut(0.4);
      const c = C();
      cityAt('escondite', 10);
      const t = spawnTsuruWithCrew('escondite', 34);
      c.putInCar(t);
      r.p.mask = null;
      yield* fadeIn(0.4);
      music('heist');
      lock(false);
      objective('Maneja al Banco Federal. ¡Llega antes de las 10:05!');
      UI.timer = { label: 'HORA', t: 190 };
      ctx.check(() => (t.dead ? '¡Destruiste el Tsuru!' : null));
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'Llegaste tarde (otra vez)' : null));
      let said = 0, tt = 0;
      const bk = P().banco;
      yield* goTo(bk.x, bk.y + 36, { r: 34, needCar: true, label: 'BANCO FEDERAL', check: () => {
        UI.timer.t -= 1 / 60; tt += 1 / 60;
        if (said === 0 && tt > 6) { said = 1; G.story._lineQ = ['coqui', 'Kazoo. A tiempo. Por una vez en tu vida.', 'serious']; }
        if (said === 1 && tt > 20) { said = 2; G.story._lineQ = ['ghenghis', '¿Alguien más siente que se le sale el corazón? Jajaja... ja.', 'laugh']; }
        if (said === 2 && tt > 40) { said = 3; G.story._lineQ = ['kazoo', '¡Voy, voy! ¡Tsurito, no me falles!', 'shock']; }
        if (G.story._lineQ && !UI.dialog) { const q = G.story._lineQ; G.story._lineQ = null; UI.say(q[0], q[1], { expr: q[2], auto: 2.4 + q[1].length / 11 }); }
      } });
      UI.timer = null;
      lock(true);
      if (c.player.car) c.exitCar(true);
      setClock(10, 5);
      yield* fadeOut(0.4);
      c.peds = c.peds.filter((q) => !q.ally);
      yield* hostagePhase(ctx);
    },
  },
  {
    id: 'c8_boveda', chapter: 8, title: 'La bóveda', requires: ['c8_entrada'], customRooms: true, lockRoom: true, failPlace: 'banco',
    rating: () => ({ by: 'Ghenghis', stars: 5, text: 'Cinco años cuidé esa puerta. Qué bonita por dentro.' }),
    *run(ctx) {
      lock(true);
      UI.fade = 1; UI.fadeTarget = 1;
      roomAt('boveda', 40);
      const r = R();
      r.noExit = true;
      const m = S().masks;
      r.p.mask = m.kazoo;
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 20, facing: 1, mask: m.ghenghis, bag: true });
      for (const [id, fac, sw] of [['bcam1', 1, 2.4], ['bcam2', -1, 2.8], ['bcam3', 1, 2.2]]) {
        const pr = r.prop(id);
        r.addEnemy({ kind: 'camera', x: pr.x + 5, y: FLOOR, facing: fac, vision: 100, sweep: sw, invisible: true, look: 'guard' });
      }
      r.stealth = true;
      r.onDetected = () => { if (!r._caught) { r._caught = true; G.story.fail('Una cámara te vio', 'fail'); } };
      music('tension');
      yield* fadeIn(0.4);
      yield* talk([
        ['ghenghis', 'El sótano. Tres cámaras que se mueven. Cuando voltee para el otro lado, pasas. Camina, no corras...', 'serious'],
        ['ghenghis', 'Y si te va a ver, métete a un locker o agáchate detrás de las cajas. Yo te sigo. A mí ya me conocen. Jajaja.', 'laugh'],
      ]);
      lock(false);
      objective('Llega a la bóveda sin que te vean las cámaras');
      gh.hidden = true;
      yield* until(() => r.p.x > 560);
      lock(true);
      r.stealth = false;
      for (const e of r.enemies) e.disabled = true;
      gh.hidden = false; gh.x = r.p.x - 30; gh.facing = 1;
      yield* talk([
        ['ghenghis', 'Ahí está. La bóveda. ¿Sabes qué es lo más chistoso?', 'normal'],
        ['ghenghis', 'Cinco años cuidé esta puerta. Y nunca supe qué había adentro.', 'sad'],
        ['kazoo', 'Pues vamos a ver.', 'serious'],
      ]);
      r.p.x = 600; r.p.facing = 1;
      objective('Taladra la puerta: presiona A cuando la aguja esté en lo verde');
      const vault = r.prop('vault');
      const prev = r.onUpdate;
      r.onUpdate = (dt) => { if (prev) prev(dt); vault.spin = (vault.spin || 0) + dt * 6; if (G.minigames.active) vault.heat = G.minigames.active.heat; };
      music('heist');
      lock(false);
      yield* play('drill', { goal: 1 });
      lock(true);
      audio.sfx('explode', { vol: 0.4 }); r.shake(4);
      vault.open = true; vault.heat = 0;
      yield* wait(0.8);
      yield* talk([
        ['ghenghis', '...', 'shock'],
        ['ghenghis', 'JAJAJAJAJA. ¡MIRA ESO! ¡MÍRALO!', 'laugh'],
        ['kazoo', '¡Llena la mochila! ¡Rápido!', 'happy'],
      ]);
      lock(false);
      objective('¡Llena la mochila! (presiona A muchas veces)');
      let total = 0;
      yield* mash(24, 'MOCHILA', () => { total += Math.floor(rand(38000, 52000)); audio.sfx('coin'); UI.toast('$' + total.toLocaleString('es-MX'), '#46d470', 0.6); });
      S().flags.botin = total;
      lock(true);
      // the alarm
      audio.sfx('alarm');
      r.shake(3);
      const cut = S().flags.alarmCut;
      yield* say('coqui', cut ? '(radio) Kazoo. La cajera apretó algo... pero no sonó nada. ¿Tú hiciste eso? ¡Bien hecho! Tenemos más tiempo, ¡suban ya!' : '(radio) ¡KAZOO! ¡La cajera apretó la alarma! ¡La policía viene en camino! ¡SUBAN YA!', cut ? 'happy' : 'angry', { name: 'COQUI (RADIO)' });
      G.story._alarmTime = cut ? 150 : 95;
      music(null);
      lock(false);
    },
  },
  {
    id: 'c8_alarma', chapter: 8, title: 'Tiroteo en el Federal', requires: ['c8_boveda'], customRooms: true, lockRoom: true, failPlace: 'banco',
    rating: () => ({ by: 'Coqui', stars: 3, text: 'Salimos. Eso es lo que cuenta.' }),
    *run(ctx) {
      lock(true);
      UI.fade = 1; UI.fadeTarget = 1;
      roomAt('banco', 820, { combat: true });
      const r = R();
      r.noExit = true;
      const m = S().masks;
      r.p.mask = m.kazoo; r.p.facing = -1;
      r.infiniteAmmo = true;
      S().weapons.pistol = Math.max(S().weapons.pistol || 0, 60);
      S().weapon = 'pistol';
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 700, facing: -1, mask: m.coqui, shooter: true, basePose: 'aim', pose: 'aim' });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 850, facing: -1, mask: m.ghenghis, bag: true, shooter: true, basePose: 'aim', pose: 'aim' });
      for (let i = 0; i < 5; i++) r.addNpc({ look: [3, 8, 13, 19, 25][i], x: 240 + i * 70, facing: 1, pose: 'down' });
      const time = G.story._alarmTime || 110;
      UI.timer = { label: 'REFUERZOS', t: time };
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'Llegaron los refuerzos' : null));
      music('chase');
      yield* fadeIn(0.4);
      yield* say('coqui', '¡Ya están aquí! ¡Agáchate detrás de algo y dispara! ¡Hay que llegar a la puerta!', 'angry');
      lock(false);
      toast('ABAJO = cubrirte. ESPACIO = disparar.', '#5adcf0', 5);
      objective('Abre paso hasta la salida');
      const waves = [[120, 200], [60, 150, 260], [90, 180, 300]];
      let wi = 0;
      const spawnWave = () => {
        for (const x of waves[wi]) r.addEnemy({ look: 'cop', x, facing: 1, hp: 38, armed: true, speed: 30, state: 'attack', vision: 500, range: rand(70, 120), dmg: 7, fireRate: 1.5 });
        audio.sfx('door'); wi++;
      };
      spawnWave();
      const prev = r.onUpdate;
      r.onUpdate = (dt) => { if (prev) prev(dt); if (UI.timer) UI.timer.t -= dt; co.facing = -1; gh.facing = -1; if (Math.abs(co.x - (r.p.x + 40)) > 10) co.x += Math.sign(r.p.x + 40 - co.x) * 50 * dt; if (Math.abs(gh.x - (r.p.x + 70)) > 10) gh.x += Math.sign(r.p.x + 70 - gh.x) * 50 * dt; };
      while (true) {
        yield;
        const alive = r.enemies.filter((e) => e.state !== 'down').length;
        if (alive === 0) { if (wi < waves.length) { yield* wait(1.2); spawnWave(); } else break; }
      }
      objective('¡Sal del banco!');
      r.noExit = false;
      let out = false;
      r.onExit = () => { out = true; return false; };
      yield* until(() => out || r.p.x < 26);
      UI.timer = null;
      lock(true);
      r.combat = false;
      yield* fadeOut(0.3);
    },
  },
];

function* hostagePhase(ctx) {
  const m = S().masks;
  roomAt('banco', 60);
  const r = R();
  r.noExit = true;
  r.p.mask = m.kazoo;
  const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 36, facing: 1, mask: m.coqui, pose: 'aim' });
  const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 84, facing: 1, mask: m.ghenghis, bag: true, pose: 'aim' });
  const hostages = [];
  const xs = [180, 230, 290, 360, 420, 480];
  xs.forEach((x, i) => hostages.push(r.addNpc({ look: [3, 8, 13, 19, 25, 31][i], x, facing: i % 2 ? -1 : 1 })));
  const teller = r.addNpc({ id: 'teller', look: 'teller', x: 600, facing: -1 });
  const g1 = r.addNpc({ look: 'guard', x: 320, facing: -1 });
  const g2 = r.addNpc({ look: 'guard', x: 780, facing: -1 });
  yield* fadeIn(0.3);
  music('heist');
  yield* say('ghenghis', '¡TODOS AL SUELO! ¡ESTO ES UN ASALTO! ¡JAJAJA!', 'crazy');
  audio.sfx('shot'); r.shake(3);
  for (const h of hostages) h.pose = 'down';
  g1.pose = 'hands'; g2.pose = 'hands'; teller.pose = 'hands';
  yield* talk([
    ['coqui', '¡Nadie se mueve y nadie sale lastimado!', 'angry'],
    ['kazoo', '¡Buenos días a todos! ...Digo, ¡AL SUELO!', 'shock'],
    ['coqui', 'Ghenghis, los guardias y el gerente. Kazoo, que nadie se levante. Yo cuido la puerta.', 'serious'],
  ]);
  g1.pose = 'down'; g2.pose = 'down';
  yield* walkNpc(gh, 300, 70);
  // the joke that isn't a joke
  gh.facing = -1; gh.pose = 'aim';
  r.p.facing = 1;
  yield* say('ghenghis', 'Oye, Kazoo... ¡bang! Jajaja.', 'crazy');
  yield* talk([
    ['kazoo', '¡WEY! ¡NO ME APUNTES!', 'angry'],
    ['ghenghis', 'Jajaja, tranquilo, tranquilo.', 'laugh'],
    ['coqui', '¡CONCÉNTRENSE!', 'angry'],
  ]);
  gh.pose = null;
  gh.goal = { x: 740, speed: 60 };
  lock(false);
  objective('Mantén a los rehenes en el suelo: acércate y presiona B (Espacio) para gritar');
  let comp = 0, t = 0, riseT = 3;
  const rising = new Set();
  r.onShout = () => {
    audio.sfx('hurt', { vol: 0.4 });
    r.p.bark = pick(['¡AL SUELO!', '¡QUIETOS!', '¡ABAJO!', '¡NI SE MUEVAN!']); r.p.barkT = 1;
    for (const h of rising) if (Math.abs(h.x - r.p.x) < 64) { rising.delete(h); h.pose = 'down'; h.bark = pick(['¡Perdón, perdón!', 'Ya, ya...', 'Nomás me picaba la pierna']); h.barkT = 1.2; }
  };
  const prevUpd = r.onUpdate;
  r.onUpdate = (dt) => {
    if (prevUpd) prevUpd(dt);
    if (r.p.barkT > 0) { r.p.barkT -= dt; if (r.p.barkT <= 0) r.p.bark = null; }
  };
  UI.meter = { label: 'COMPLICACIONES 0/3', v: 0, col: '#d8323c' };
  UI.timer = { label: 'GHENGHIS EN LA BÓVEDA', t: 40 };
  while (UI.timer.t > 0) {
    const dt = yield; t += dt; UI.timer.t -= dt;
    riseT -= dt;
    if (riseT <= 0) {
      riseT = rand(3.6, 5.2);
      // never more than two getting up at once, and each one gives you time to walk over
      const cand = hostages.filter((h) => !rising.has(h));
      if (cand.length && rising.size < 2) { const h = pick(cand); rising.add(h); h.pose = 'crouch'; h.riseT = 5.5; h.bark = '!'; h.barkT = 5.5; audio.sfx('blip', { f: 900 }); }
    }
    for (const h of [...rising]) {
      h.riseT -= dt;
      if (h.riseT <= 0) {
        rising.delete(h); comp++; h.pose = null; h.bark = pick(['¡YO ME VOY!', '¡AUXILIO!', '¡MAMÁ!']); h.barkT = 1.5;
        UI.meter = { label: `COMPLICACIONES ${comp}/3`, v: comp / 3, col: '#d8323c' };
        audio.sfx('fail');
        h.goal = { x: 20, speed: 60 };
        setTimeout(() => { h.goal = null; h.pose = 'down'; h.bark = 'Ay, ya, ya me acuesto...'; h.barkT = 1.5; }, 1400);
        if (comp >= 3) { UI.meter = null; UI.timer = null; ctx.fail('Se salió de control'); }
      }
    }
  }
  UI.timer = null; UI.meter = null; r.onShout = null;
  lock(true);
  yield* say('ghenghis', '(desde el fondo) ¡YA TENGO LAS LLAVES DEL GERENTE! ¡KAZOO, A LA BÓVEDA!', 'laugh');
  yield* say('coqui', 'Ve. Yo me quedo con ellos. Rápido.', 'serious');
  yield* fadeOut(0.3);
  void co;
}
