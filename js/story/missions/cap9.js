// CAPÍTULO 9 — "La Huida" + final + post-créditos
import { G, setScene } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, setClock, music, walkNpc } from '../script.js';
import { P, C, R, S, line, lines, cityAt, roomAt } from './common.js';
import { spawnTsuruWithCrew } from './cap8.js';
import { FLOOR } from '../../interior/rooms.js';
import { rand, dist } from '../../core/util.js';
import { unlock } from '../achievements.js';
import { CHAPTERS } from './index.js';

export const CAP9 = [
  {
    id: 'c9_huida', chapter: 9, title: 'La huida', requires: ['c8_alarma'], customRooms: true, failPlace: 'banco', final: true, silent: true,
    *run(ctx) {
      lock(true);
      UI.fade = 1; UI.fadeTarget = 1;
      const c = C(), bk = P().banco;
      cityAt(bk, 20, { a: 0 });
      c.clearMission();
      const t = spawnTsuruWithCrew('banco', 40);
      t.x = bk.x + 20; t.y = bk.y + 40; t.a = 0;
      t.hp = 80; t.minHp = 14; t.invuln = false;
      c.putInCar(t);
      c.wanted = 4; c.wantedLocked = true; c.noEvade = true; c.policeKnows = true; c.maxWanted = 4;
      for (let i = 0; i < 2; i++) { const pc = c.spawnVehicle('police', bk.x - 80 - i * 40, bk.y + 40, 0, { ai: 'police' }); pc.sirenOn = true; }
      G.weatherLock = true; S().weather = 'sun';
      setClock(10, 22);
      music('chase');
      yield* fadeIn(0.3);
      const ch = CHAPTERS[9];
      UI.showCard(ch.title, ch.label, 3, 'chapter'); audio.sfx('star');
      lock(false);
      objective('¡Huye! Sal de la ciudad hacia la carretera vieja (Las Afueras)');
      ctx.check(() => (c.player.car !== t && !t.dead && dist(c.player.x, c.player.y, t.x, t.y) > 200 ? 'Abandonaste a tus compas' : null));
      ctx.check(() => (t.dead ? 'El Tsuru explotó' : null));
      const lineSet = [
        [8, [['coqui', '¡Arranca, arranca, ARRANCA!', 'angry'], ['kazoo', '¡ESO ESTOY HACIENDO!', 'shock']]],
        [22, [['coqui', 'Tranquilos. Está bien. El carro aguanta. Aguanta.', 'serious']]],
        [38, [['coqui', '¡¿Por qué nos siguen si ya los perdimos?!', 'angry'], ['ghenghis', '¡Porque así es la vida, wey! ¡JAJAJA!', 'laugh']]],
        [55, [['ghenghis', '¿Alguien más huele a quemado?', 'think'], ['kazoo', 'Es su personalidad.', 'sad']]],
        [72, [['kazoo', '¡Aguanta, Tsurito! ¡Aguanta!', 'shock']]],
        [90, [['coqui', 'Kazoo... ¿de dónde sacaste este carro?', 'serious'], ['kazoo', '¡AHORITA NO, COQUI!', 'angry']]],
        [110, [['ghenghis', 'Oigan... si nos separamos... ya saben. Pa\' allá.', 'serious'], ['coqui', '¿Pa\' dónde?', 'think'], ['ghenghis', 'Pa\' donde sea. Jajaja.', 'laugh']]],
      ];
      const fin = P().caminoFin;
      const mk = c.addMarker({ x: fin.x, y: fin.y, r: 26, color: '#ffd23f', label: 'EL CAMINO', needCar: true });
      let tt = 0, li = 0;
      while (!mk.inside) {
        const dt = yield; tt += dt;
        if (c.player.car === t) {
          t.hp = Math.max(t.minHp, t.hp - dt * 0.55);
          t.forceSmoke = t.hp < 30 ? 'black' : t.hp < 55 ? 'gray' : null;
        }
        if (li < lineSet.length && tt > lineSet[li][0]) { const L = lineSet[li][1]; li++; for (const q of L) { UI.say(q[0], q[1], { expr: q[2], auto: 1.4 + q[1].length / 17 }); const d = UI.dialog; while (UI.dialog === d) yield; } }
        if (tt > 20 && S().unlocked.afueras && c.zone === 'afueras') objective('¡Toma el camino de terracería hacia el campo!');
      }
      c.removeMarker(mk);
      // ---------- the car dies
      lock(true);
      t.engineOff = true; t.forceSmoke = 'black';
      audio.sfx('engine_die');
      music(null);
      c.wantedLocked = false; c.wanted = 0; c.policeKnows = false;
      c.vehicles = c.vehicles.filter((v) => v.ai !== 'police');
      c.peds = c.peds.filter((q) => !q.cop);
      yield* until(() => t.speed < 5, 4);
      yield* wait(1.2);
      yield* fadeOut(0.8);
      yield* caminoScene();
    },
  },
];

function* caminoScene() {
  const s = S();
  setClock(10, 40);
  roomAt('camino', 60);
  const r = R();
  r.noExit = true;
  const m = s.masks;
  const car = { t: 'tsuruside', x: 210, col: '#d8d8d0', id: 'tsuru' };
  r.props.push(car);
  const k0 = r.p; k0.x = 200; k0.visible = false;
  r.onUpdate = (dt) => {
    if (Math.random() < 0.5) r.fx.push({ x: 262 + rand(-3, 3), y: FLOOR - 16, vx: rand(-8, 8), vy: rand(-30, -15), life: 1.4, col: Math.random() < 0.6 ? '#1e1e24' : '#3a3a44', s: 3 });
  };
  audio.setSiren(0.08);
  yield* fadeIn(1.2);
  yield* wait(1.5);
  yield* say('narrator', '...', 'normal');
  // they get out
  audio.sfx('door');
  k0.visible = true; k0.x = 236; k0.facing = -1;
  const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 222, facing: 1 });
  audio.sfx('door');
  const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 200, facing: 1, bag: true });
  void m;
  yield* walkNpc(co, 180, 40);
  yield* walkNpc(gh, 150, 40);
  co.facing = 1; gh.facing = 1;
  yield* wait(0.6);
  yield* say('kazoo', '...¿Tsurito?', 'sad');
  audio.sfx('engine_die');
  yield* wait(1.4);
  yield* say('ghenghis', 'Jajaja... ja.', 'shock');
  const tr = s.trust;
  if (tr >= 60) yield* say('coqui', '...Estamos juntos en esto. ¿Va?', 'serious');
  else if (tr < 40) yield* say('coqui', '...¿Y ahora pa\' dónde, Kazoo? ¿Eh? ¿Pa\' dónde?', 'angry');
  else yield* say('coqui', '...', 'angry');
  audio.setSiren(0.2);
  yield* wait(1);
  co.facing = -1;
  yield* say('coqui', '(respira hondo)', 'angry');
  // ---------- BLACK
  UI.fade = 1; UI.fadeTarget = 1;
  audio.setSiren(0);
  r.onUpdate = null;
  yield* wait(1.4);
  UI.subtitle = '*respiraciones*'; yield* wait(1.6);
  UI.subtitle = '*pasos apresurados*'; audio.sfx('step'); yield* wait(0.35); audio.sfx('step'); yield* wait(0.35); audio.sfx('step'); yield* wait(0.9);
  UI.subtitle = '*una mochila moviéndose*'; yield* wait(1.6);
  UI.subtitle = null;
  audio.setSiren(0.35);
  UI.subtitle = '*sirenas, cada vez más cerca*'; yield* wait(2);
  UI.subtitle = null;
  yield* say('ghenghis', '¡Córranle, córranle!', 'shock', { portrait: false, name: 'GHENGHIS (fuera de cuadro)' });
  audio.setSiren(0);
  audio.sfx('bang');
  yield* wait(1);
  // ---------- ending screens
  unlock('fin');
  if (s.stats.playtime < 5400 && !s.flags.cheats) unlock('speed');
  s.finished = true;
  G.global.finished = true;
  G.forceDark = undefined; G.weatherLock = false;
  UI.fade = 0; UI.fadeTarget = 0;
  lock(false);
  let step = 0;
  setScene('finale', { mode: 'continuara', onDone: () => (step = 1) });
  yield* until(() => step === 1);
  setScene('finale', { mode: 'marathon', onDone: () => (step = 2) });
  yield* until(() => step === 2);
  setScene('credits', { onDone: () => (step = 3) });
  yield* until(() => step === 3);
  yield* postCredits();
  setScene('finale', { mode: 'share', onDone: () => (step = 4) });
  yield* until(() => step === 4);
  // continue free roam after the story
  s.freeMode = true;
  s.chapterName = 'DESPUÉS DEL ESCAPE';
  const pen = P().pension;
  cityAt(pen, 10);
  UI.hud = true;
  toast('Terminaste la historia. La ciudad es tuya: coleccionables, repartos y trucos.', '#ffd23f', 6);
}

function* postCredits() {
  lock(true);
  UI.hud = false;
  UI.fade = 1; UI.fadeTarget = 1;
  roomAt('comandancia', 200);
  const r = R();
  r.noExit = true;
  r.p.visible = false;
  r.camTarget = { x: 220 };
  const rey = r.addNpc({ look: 'reyes', x: 240, facing: -1 });
  const ven = r.addNpc({ look: 'vendedor', x: 206, facing: 1, pose: 'sit', y: FLOOR - 4 });
  r.props.push({ t: 'chair', x: 200 });
  music(null);
  yield* fadeIn(1);
  yield* talk([
    ['reyes', '¿Y el rastreador?', 'serious'],
    ['vendedor', 'Donde le dije, jefa. Carretera vieja. El camino de terracería, junto al campo.', 'happy'],
    ['reyes', 'Buen trabajo.', 'smug'],
  ]);
  yield* walkNpc(rey, 20, 40);
  rey.hidden = true;
  yield* say('reyes', '(radio) Unidades, al camino viejo. Ya los tenemos.', 'serious', { name: 'CMDTE. REYES (RADIO)' });
  yield* wait(1.2);
  audio.sfx('notify');
  const st = S().flags.sellerStars || 5;
  const review = st === 5 ? '"súper buen vendedor, muy amable, el carro corre chido"' : st >= 3 ? '"el carro hace un ruidito pero bien"' : '"el carro se apagó 2 veces en la prueba"';
  yield* say('narrator', `NOTIFICACIÓN: Kazoo te calificó con ${'★'.repeat(st)}${'☆'.repeat(5 - st)}: ${review}`, 'normal', { name: 'MARKETPLACE' });
  if (st === 5) yield* say('vendedor', '(sonríe) Cinco estrellas.', 'happy');
  else yield* say('vendedor', `...${st} estrellas. Qué grosero. La gente ya no tiene educación.`, 'serious');
  void ven;
  yield* wait(1);
  yield* fadeOut(1);
  UI.showCard('FIN', '', 3, 'big');
  yield* wait(3);
  UI.fade = 0; UI.fadeTarget = 0;
  lock(false);
}
