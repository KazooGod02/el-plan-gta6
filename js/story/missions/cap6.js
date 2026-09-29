// CAPÍTULO 6 — "La Otra Mochila" (Día -4, noche)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo, addMoney } from '../script.js';
import { P, C, R, S, line, lines, ally, cityAt, roomAt, mash } from './common.js';
import { FLOOR } from '../../interior/rooms.js';

export const CAP6 = [
  {
    id: 'c6_planb', chapter: 6, chapterStart: true, title: 'Plan B', requires: ['c5_coqui'], customRooms: true, failPlace: 'pension',
    rating: () => ({ by: 'Ghenghis', stars: 5, text: 'Lupita piensa que enterramos a alguien.' }),
    *run(ctx) {
      setDay(-4); setClock(22, 10);
      lock(true);
      roomAt('cuarto', 100);
      G.story.populateRoom('cuarto');
      const r = R();
      r.p.pose = 'down';
      yield* fadeIn(0.5);
      yield* say('narrator', 'Coqui salió "a ver a alguien". No dijo a quién.', 'normal');
      chat('ghenghis', 'wey. estás despierto?', true);
      yield* wait(1.5);
      chat('ghenghis', 'voy para allá. no le digas a coqui', true);
      yield* wait(1.2);
      r.p.pose = null;
      audio.sfx('door');
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 20, facing: 1 });
      yield* walkNpc(gh, 150, 50);
      gh.facing = -1;
      yield* talk([
        ['ghenghis', 'Wey. Esto va a salir mal.', 'serious'],
        ['kazoo', 'Gracias. Qué motivador.', 'sad'],
        ['ghenghis', 'No, en serio. Escúchame.', 'serious'],
        ['narrator', 'Ghenghis no se está riendo. Kazoo nunca lo había visto así.', 'normal'],
        ['ghenghis', 'Siempre sale mal. Siempre. Mi abuelo decía: "el que no tiene plan B, tiene plan de velorio".', 'serious'],
        ['kazoo', 'Tu abuelo era muy intenso.', 'think'],
        ['ghenghis', 'Mi abuelo era un genio. Murió en un velorio. Se tropezó con el ataúd. Irónico.', 'normal'],
        ['ghenghis', 'Una mochila. Ropa, agua, lana. Enterrada donde nadie sepa. Por si nos separamos.', 'serious'],
        ['kazoo', '¿Y Coqui?', 'think'],
        ['ghenghis', 'Si le decimos, va a pensar que lo queremos traicionar. Ya lo conoces. Tres años pensando en traiciones.', 'sad'],
      ]);
      const ch = yield* ask('kazoo', '(¿Qué le dices?)', ['"Tienes razón. Entre menos sepa, mejor."', '"Deberíamos decirle..."', '"¿Y por qué yo?"']);
      if (ch === 0) yield* talk([['kazoo', 'Tienes razón. Entre menos sepa, mejor.', 'serious'], ['ghenghis', 'Eso. Es por su bien. Y por el nuestro. Y por el de la mochila.', 'normal']]);
      if (ch === 1) { S().flags.wantedToTell = true; trust(2); yield* talk([['kazoo', 'Deberíamos decirle, wey. Es Coqui.', 'sad'], ['ghenghis', 'Le decimos después. Cuando todo salga bien. Si sale bien. Jaja... ja.', 'sad']]); }
      if (ch === 2) yield* talk([['kazoo', '¿Y por qué yo?', 'think'], ['ghenghis', 'Porque eres el único que me va a decir que sí sin preguntar mucho.', 'happy'], ['kazoo', '...Eso es verdad.', 'sad']]);
      yield* talk([
        ['ghenghis', 'Primero la tiendita. Luego el campo. Conozco un árbol. Bien solito. Como yo. Jajaja.', 'laugh'],
      ]);
      r.removeNpc(gh);
      lock(false);
      objective('Compra provisiones en Abarrotes Lupita');
      yield* until(() => G.scene === C());
      const c = C();
      let ally1 = ally('ghenghis', c.player.x + 12, c.player.y, 'GHENGHIS');
      const tien = P().tiendita;
      yield* goTo(tien.x, tien.y, { label: 'ABARROTES LUPITA', r: 14 });
      if (c.player.car) c.exitCar(true);
      lock(true);
      yield* fadeOut(0.3);
      c.removePed(ally1);
      roomAt('tiendita', 60);
      const rt = R();
      rt.addNpc({ id: 'lupita', look: 'lupita', x: 250, facing: -1 });
      rt.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 110, facing: 1 });
      yield* fadeIn(0.3);
      yield* walkPlayer(200);
      yield* talk([
        ['kazoo', 'Buenas noches, Lupita. Dos aguas, unas galletas, una muda de ropa...', 'normal'],
        ['ghenghis', '¡Y una pala!', 'happy'],
        ['lupita', '¿A esta hora? ¿Agua, galletas, ropa y una pala?', 'think'],
        ['lupita', '...¿Van a enterrar a alguien?', 'shock'],
        ['ghenghis', '¡Sí! ¡A nuestro futuro! ¡JAJAJA!', 'laugh'],
        ['lupita', 'Son $340. Y no quiero saber nada.', 'serious'],
      ]);
      S().money = Math.max(0, S().money - 340); audio.sfx('coin');
      yield* fadeOut(0.3);
      cityAt(tien, 10);
      ally1 = ally('ghenghis', tien.x + 14, tien.y + 12, 'GHENGHIS');
      yield* fadeIn(0.3);
      lock(false);
    },
  },
  {
    id: 'c6_campo', chapter: 6, title: 'El árbol solitario', requires: ['c6_planb'], customRooms: true, failPlace: 'pension',
    rating: () => ({ by: 'Ghenghis', stars: 5, text: 'Nadie nos vio. Seguro.' }),
    *run(ctx) {
      const c = C();
      let gh = c.peds.find((q) => q.lookId === 'ghenghis' && q.ally);
      if (!gh) { const p = c.pos(); gh = ally('ghenghis', p.x + 12, p.y, 'GHENGHIS'); }
      G.forceDark = 0.62;
      objective('Consigue un carro y lleva a Ghenghis a EL CAMPO (Las Afueras)');
      yield* until(() => c.player.car && c.player.car.passengers.includes(gh));
      const campo = P().campo;
      const m = c.addMarker({ x: campo.x, y: campo.y, r: 28, color: '#ffd23f', label: 'EL CAMPO', needCar: true });
      const talks = [
        [['ghenghis', '¿Sabes por qué me río de todo, Kazoo?', 'serious'], ['kazoo', '¿Por qué?', 'think']],
        [['ghenghis', 'Porque si no me río, me pongo a pensar. Y cuando pienso... pienso que todo se va a acabar.', 'sad'], ['kazoo', '...Wey.', 'sad']],
        [['ghenghis', '¡JAJA! ¡Ves! Por eso me río. Es más barato que el psicólogo.', 'laugh']],
      ];
      let k = 0, t = 0;
      objective('Lleva a Ghenghis a EL CAMPO (Las Afueras)');
      while (!m.inside) {
        const dt = yield; t += dt;
        if (k < talks.length && t > 8 + k * 14) { yield* lines(talks[k]); k++; }
        m.hidden = !(c.player.car && c.player.car.passengers.includes(gh));
      }
      c.removeMarker(m);
      lock(true);
      while (k < talks.length) { yield* lines(talks[k]); k++; }
      yield* fadeOut(0.5);
      const car = c.player.car;
      if (car) c.exitCar(true);
      c.removePed(c.peds.find((q) => q.lookId === 'ghenghis' && q.ally));
      roomAt('campo', 60);
      const r = R();
      r.noExit = true;
      const g = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 36, facing: 1, bag: true });
      music('night');
      yield* fadeIn(0.8);
      lock(false);
      g.follow = true;
      objective('Camina hasta el árbol solitario');
      yield* until(() => r.p.x > 340);
      lock(true);
      g.follow = false;
      yield* walkNpc(g, 390, 40);
      g.facing = -1;
      yield* say('ghenghis', 'Aquí. Nadie viene nunca aquí. Ni las víboras. Dicen que se aburren.', 'normal');
      lock(false);
      objective('Cava (presiona A/E varias veces)');
      r.p.pose = 'dig';
      const hole = { t: 'hole', x: 358, y: 150, d: 1 };
      r.props.push(hole);
      yield* mash(14, 'CAVANDO', (n) => { audio.sfx('dig'); hole.d = 1 + Math.floor(n / 2); r.shake(0.5); });
      r.p.pose = null;
      lock(true);
      g.bag = false;
      r.props.push({ t: 'bag', x: 362, y: 152 });
      audio.sfx('dig');
      yield* wait(0.6);
      r.props = r.props.filter((q) => q.t !== 'bag');
      hole.d = 2;
      yield* talk([
        ['ghenghis', 'Listo. Ropa, agua, dos mil pesos y unas galletas de animalito.', 'normal'],
        ['ghenghis', 'Si todo sale mal... aquí va a estar. Pase lo que pase, corre pa\'cá. Sin voltear.', 'serious'],
        ['kazoo', '¿Y tú?', 'sad'],
        ['ghenghis', 'Yo siempre llego. Tarde, pero llego. Jajaja.', 'laugh'],
        ['kazoo', 'Eso lo digo yo.', 'happy'],
        ['ghenghis', 'Ya lo sé. Te lo robé. Como todo lo bueno.', 'happy'],
      ]);
      // walk back, the camera finds someone on the hill
      g.follow = true;
      lock(false);
      objective('Regresa al carro');
      yield* until(() => r.p.x < 200);
      lock(true);
      g.follow = false;
      r.frozen = true;
      r.p.facing = -1; g.facing = -1;
      const sil = r.addNpc({ id: 'sil', look: 'unknown', x: 610, facing: -1 });
      r.camTarget = { x: 600 };
      music(null);
      yield* wait(2.2);
      yield* say('narrator', '...', 'normal');
      yield* wait(1.2);
      sil.facing = 1;
      yield* walkNpc(sil, 660, 30);
      r.removeNpc(sil);
      r.camTarget = null;
      yield* wait(0.8);
      yield* say('kazoo', '¿Escuchaste algo?', 'think');
      yield* say('ghenghis', 'Una vaca. O un fantasma. Jajaja. Vámonos.', 'laugh');
      S().flags.planB = true;
      yield* fadeOut(1);
      r.frozen = false;
      G.forceDark = undefined;
      setDay(-1); setClock(9, 0);
      const pen = P().pension;
      cityAt(pen, 10);
      lock(false);
    },
  },
];
