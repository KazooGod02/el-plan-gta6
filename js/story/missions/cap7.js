// CAPÍTULO 7 — "La Noche Antes" (Día -1)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo } from '../script.js';
import { P, C, R, S, line, lines, cityAt, roomAt } from './common.js';
import { FLOOR } from '../../interior/rooms.js';

export const CAP7 = [
  {
    id: 'c7_libre', chapter: 7, chapterStart: true, title: 'Pendientes', requires: ['c6_coqui'], customRooms: true, allowShops: true,
    rating: () => ({ by: 'Doña Mari', stars: 5, text: 'Cuídate, mijo.' }),
    onDoor(d, ctx) {
      const st = ctx.st;
      if (d.room === 'taqueria' && !st.mari) { st.goMari = true; return true; }
      if (d.room === 'donchuy' && !st.chuy) { st.goChuy = true; return true; }
      return false;
    },
    *run(ctx) {
      setDay(-1); setClock(9, 30);
      const st = ctx.st = { mari: false, chuy: false };
      if (G.scene !== C()) cityAt(P().pension, 10);
      chat('coqui', 'Mañana es el día. Hoy descansen. En la noche: azotea de la pensión. Los tres. Y nadie llega acompañado.');
      yield* wait(1.2);
      chat('ghenghis', 'última cena jajaja');
      yield* wait(1.2);
      chat('coqui', 'No digas eso.');
      yield* wait(1.2);
      chat('ghenghis', 'ok. penúltima cena');
      yield* wait(1);
      toast('Día libre: haz lo que quieras antes de la noche', '#ffd23f', 4);
      const c = C();
      const mk1 = c.addMarker({ x: P().taqueria.x, y: P().taqueria.y, r: 14, letter: 'M', color: '#f07aa8', label: 'DOÑA MARI', onEnter: () => (st.goMari = !st.mari) });
      const mk2 = c.addMarker({ x: P().donchuy.x, y: P().donchuy.y, r: 14, letter: 'J', color: '#b8a070', label: 'EL JEFE', onEnter: () => (st.goChuy = !st.chuy) });
      const upd = () => objective(`Pendientes: ${st.mari ? '✓' : '·'} Visitar a Doña Mari  ${st.chuy ? '✓' : '·'} Ver al Jefe`);
      upd();
      while (!(st.mari && st.chuy)) {
        yield;
        if (st.goMari) {
          st.goMari = false; st.mari = true; c.removeMarker(mk1);
          if (c.player.car) c.exitCar(true);
          yield* mariScene();
          upd();
        }
        if (st.goChuy) {
          st.goChuy = false; st.chuy = true; c.removeMarker(mk2);
          if (c.player.car) c.exitCar(true);
          yield* chuyScene();
          upd();
        }
      }
      toast('Cuando estés listo, ve a la azotea de la pensión', '#ffd23f', 4);
    },
  },
  {
    id: 'c7_azotea', chapter: 7, title: 'Por el plan', requires: ['c7_libre'], customRooms: true,
    trigger: { door: 'cuarto', letter: 'A', color: '#8c46c8', label: 'AZOTEA' },
    rating: () => ({ by: 'Los tres', stars: 5, text: 'Nadie improvisa.' }),
    *run(ctx) {
      lock(true);
      yield* fadeOut(0.5);
      setClock(22, 30);
      roomAt('azotea', 60);
      const r = R();
      r.noExit = true;
      r.p.pose = 'sit'; r.p.x = 190; r.p.facing = 1;
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 164, facing: 1, pose: 'sit' });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 216, facing: -1, pose: 'sit' });
      r.camTarget = { x: 190 };
      music('sad');
      UI.letterboxTarget = 1;
      yield* fadeIn(1.2);
      yield* wait(1.5);
      yield* talk([
        ['ghenghis', 'Mañana a esta hora ya somos ricos.', 'happy'],
        ['coqui', 'O estamos presos.', 'serious'],
        ['ghenghis', 'O muertos. Jajaja.', 'laugh'],
        ['kazoo', 'Wey.', 'sad'],
        ['ghenghis', 'De todos modos esto va a salir mal.', 'normal'],
        ['coqui', 'Ya cállate.', 'angry'],
        ['ghenghis', 'No, déjame acabar.', 'serious'],
        ['ghenghis', 'Va a salir mal. Pero qué chido que sea con ustedes. Si me van a meter un tiro, que sea entre amigos.', 'happy'],
        ['narrator', '(Silencio. La ciudad hace ruido allá abajo. Aquí arriba, no.)', 'normal'],
        ['kazoo', 'Wey, no digas cosas bonitas, me da miedo.', 'sad'],
        ['coqui', 'Cuando me agarraron, pensé que nunca iba a volver a ver la ciudad así. Desde arriba.', 'sad'],
        ['kazoo', 'Tres años.', 'sad'],
        ['coqui', 'Tres años. Y a la semana de salir ya estoy otra vez viendo de quién cuidarme.', 'serious'],
      ]);
      const tr = S().trust;
      if (tr >= 60) {
        yield* talk([
          ['coqui', 'Kazoo. Ghenghis.', 'serious'],
          ['coqui', 'Mañana, pase lo que pase... no sean el Tuercas.', 'sad'],
          ['ghenghis', 'Jajaja. Bajita la mano, Kuiss.', 'laugh'],
          ['kazoo', 'Nunca, wey.', 'happy'],
          ['narrator', 'Kuiss sonríe. Pero no deja de mirarlos a los dos.', 'normal'],
        ]);
        S().flags.azotea = 'bien';
      } else if (tr >= 40) {
        yield* say('coqui', 'Oigan... ¿hay algo más que me quieran decir? Los dos.', 'think');
        const ch = yield* ask('kazoo', '(Ghenghis te mira de reojo.)', ['"No, nada."', '(Mirar a Ghenghis)', '"Kuiss... lo del Jefe..."']);
        if (ch === 2) {
          yield* talk([
            ['kazoo', 'Kuiss... lo del Jefe...', 'sad'],
            ['ghenghis', '¡Que ya le pagamos la renta del miedo! Eso. Jajaja. ¿Verdad, Kazoo?', 'laugh'],
            ['kazoo', '...Eso.', 'sad'],
            ['coqui', '...Ya.', 'serious'],
          ]);
        } else yield* talk([['ghenghis', 'Que te queremos, wey. Jajaja.', 'laugh'], ['coqui', '...Ya. Eso dicen todos. Antes.', 'serious']]);
        S().flags.azotea = 'casi';
      } else {
        yield* talk([
          ['coqui', 'Si alguno de ustedes me está ocultando algo...', 'serious'],
          ['coqui', 'mañana es el último día para decirlo. Después ya no hay perdón. Hay plomo.', 'angry'],
          ['ghenghis', '¡Jajaja! Qué intenso, Kuiss.', 'laugh'],
          ['kazoo', '...', 'sad'],
          ['narrator', 'Kuiss no se ríe. Mira a uno. Luego al otro.', 'normal'],
        ]);
        S().flags.azotea = 'mal';
      }
      yield* talk([
        ['kazoo', 'Oigan... ¿y si no lo hacemos?', 'think'],
        ['coqui', '¿Y el Jefe?', 'serious'],
        ['ghenghis', '¿Y la renta?', 'normal'],
        ['coqui', '¿Y los tres años?', 'sad'],
        ['kazoo', '...Ya sé. Nomás preguntaba.', 'sad'],
      ]);
      gh.pose = null; audio.sfx('select');
      yield* say('ghenghis', '¡Por el plan!', 'happy');
      co.pose = null; r.p.pose = null;
      audio.sfx('coin');
      yield* talk([
        ['coqui', 'Por el plan.', 'normal'],
        ['kazoo', 'Por el plan... y porque nadie improvise.', 'happy'],
        ['coqui', '(sonríe) Nadie improvisa.', 'happy'],
      ]);
      yield* wait(1.5);
      yield* fadeOut(1.5);
      UI.letterboxTarget = 0;
      r.camTarget = null;
      setDay(0); setClock(9, 20);
      lock(false);
    },
  },
];

function* mariScene() {
  lock(true);
  yield* fadeOut(0.3);
  roomAt('taqueria', 150);
  const r = R();
  r.addNpc({ id: 'mari', look: 'mari', x: 246, facing: -1 });
  yield* fadeIn(0.3);
  yield* walkPlayer(200);
  yield* talk([
    ['mari', 'Mijo. Siéntate. No, mejor párate. Déjame verte.', 'think'],
    ['kazoo', '¿Qué pasa, Doña Mari?', 'normal'],
    ['mari', 'Tú no naciste para meterte en broncas, Kazoo. Naciste para llegar tarde con los tacos fríos.', 'sad'],
    ['kazoo', '¿Quién dijo que me voy a meter en broncas?', 'shock'],
    ['mari', 'Tu cara. Tu cara siempre dice todo. Y ahorita dice que vas a hacer una pendejada.', 'serious'],
    ['mari', 'Toma. Tacos para el camino. Por si te vas de viaje.', 'sad'],
    ['kazoo', '¿Qué viaje?', 'think'],
    ['mari', 'El que sea. Y si es lejos, no me digas a dónde. Así no tengo que mentir.', 'sad'],
    ['mari', '...Y así te quiero, eh. Tarde y todo.', 'happy'],
  ]);
  S().flags.mariTacos = true;
  R().p.hp = 100;
  toast('Tacos de Doña Mari: vida al máximo', '#46d470', 3);
  yield* fadeOut(0.3);
  cityAt(P().taqueria, 10);
  yield* fadeIn(0.3);
  lock(false);
}

function* chuyScene() {
  lock(true);
  yield* fadeOut(0.3);
  roomAt('donchuy', 40);
  const r = R();
  r.noExit = true;
  G.story.jefeRoom(r);
  yield* fadeIn(0.3);
  yield* walkPlayer(190);
  const s = S();
  if (s.paid >= s.debt) {
    yield* talk([
      ['donchuy', 'Kazoo. Estamos a mano. Por eso te voy a decir algo gratis. Y yo nunca digo nada gratis.', 'serious'],
      ['donchuy', 'Los viernes son mal día para los que tienen prisa.', 'serious'],
      ['kazoo', '...¿Por qué dice eso?', 'shock'],
      ['donchuy', 'Porque en esta ciudad todos hablan. Hasta los vendedores de carros. Sobre todo ellos.', 'serious'],
      ['donchuy', 'Mi veinte por ciento sigue en pie. Que estemos a mano no quiere decir que seamos amigos.', 'serious'],
    ]);
    s.flags.chuyWarning = true;
  } else {
    yield* talk([
      ['donchuy', 'Mañana es viernes, Kazoo. Veintiún días. Mis cincuenta mil y mi veinte por ciento.', 'serious'],
      ['kazoo', 'Mañana le pago todo, Jefe. Todo.', 'serious'],
      ['donchuy', 'Ya lo sé. Por eso sigues respirando.', 'serious'],
      ['donchuy', 'Y si los agarran, ustedes no me conocen. Nunca me han visto.', 'serious'],
      ['kazoo', 'Técnicamente nunca le hemos visto la cara.', 'normal'],
      ['donchuy', '...Por eso siguen vivos.', 'serious'],
    ]);
  }
  yield* fadeOut(0.3);
  cityAt(P().donchuy, 10);
  yield* fadeIn(0.3);
  lock(false);
}
