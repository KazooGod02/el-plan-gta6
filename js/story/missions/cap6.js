// CAPÍTULO 6 — "El Jefe" (Día -4, noche)
// El Jefe sabe del atraco. Quiere su parte y un favor. Coqui los ve a los dos con su gente.
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer } from '../script.js';
import { P, C, R, S, line, lines, ally, cityAt, roomAt, talkAlong, finishTalk } from './common.js';
import { FLOOR } from '../../interior/rooms.js';
import { TS } from '../../world/map.js';
import { dist } from '../../core/util.js';

const DOCK = () => ({ x: 161 * TS + 8, y: 40 * TS });

export const CAP6 = [
  {
    id: 'c6_jefe', chapter: 6, chapterStart: true, title: 'El Jefe', requires: ['c5_coqui'], customRooms: true, lockRoom: true, failPlace: 'pension',
    rating: () => ({ by: 'El Jefe', stars: 3, text: 'Escuchan. Eso ya es más de lo que hace la mayoría.' }),
    *run(ctx) {
      setDay(-4); setClock(22, 10);
      lock(true);
      roomAt('cuarto', 120);
      G.story.populateRoom('cuarto');
      const r = R();
      r.noExit = true;
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 196, facing: -1, pose: 'sit', y: FLOOR - 4 });
      G.forceDark = 0.5;
      yield* fadeIn(0.5);
      yield* talk([
        ['ghenghis', 'Tu cuarto huele a pan.', 'think'],
        ['kazoo', 'Es la almohada.', 'normal'],
        ['ghenghis', '¿Y por qué tienes una almohada de pan?', 'think'],
        ['kazoo', 'Tenía cinco estrellas.', 'smug'],
        ['ghenghis', 'Jajaja. Te vas a morir pobre, Kazoo. Pobre y con una almohada de pan.', 'laugh'],
      ]);
      audio.sfx('door');
      yield* wait(0.6);
      const g1 = r.addNpc({ look: 'guarura', x: 14, facing: 1 });
      const g2 = r.addNpc({ look: 'guarura', x: 4, facing: 1 });
      music('tension');
      g2.goal = { x: 54, speed: 40 };
      yield* walkNpc(g1, 80, 40);
      gh.pose = null;
      yield* talk([
        ['guarura', 'Kazoo. El Jefe te quiere ver.', 'serious'],
        ['guarura', 'Y a ti también. El que se ríe.', 'serious'],
        ['ghenghis', '¿A mí? Yo ni le debo.', 'shock'],
        ['guarura', 'Todavía.', 'serious'],
      ]);
      yield* fadeOut(0.6);
      G.forceDark = undefined;
      // ---- the office
      roomAt('donchuy', 40);
      const rj = R();
      rj.noExit = true;
      G.story.jefeRoom(rj);
      const ghJ = rj.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 150, facing: 1 });
      yield* fadeIn(0.8);
      yield* walkPlayer(178, 40);
      ghJ.facing = 1;
      yield* wait(1);
      yield* talk([
        ['donchuy', 'Viernes veintinueve. Diez y cinco. Banco Federal.', 'serious'],
        ['kazoo', '...', 'shock'],
        ['donchuy', 'Un Tsuru blanco del 2003. Comprado en el Marketplace. Qué gusto tan corriente.', 'serious'],
        ['ghenghis', '¿Cómo...?', 'shock'],
        ['donchuy', 'En Puerto Vicio no se roba ni un chicle sin que yo me entere. Y ustedes van por la bóveda.', 'serious'],
        ['kazoo', 'Jefe, le juro que no es lo que...', 'shock'],
        ['donchuy', 'No me jures. Escucha.', 'serious'],
        ['donchuy', 'No los voy a detener. Ese banco me cae mal. Me cobra comisiones.', 'serious'],
        ['donchuy', 'Pero es mi ciudad. El que trabaja en mi ciudad, me paga. Mis cincuenta mil... y el veinte por ciento de lo que salga de esa bóveda.', 'serious'],
        ['ghenghis', '¿Veinte? Jajaja. ¿Y nos da factura?', 'laugh'],
        ['narrator', 'Un guarura da un paso al frente. Ghenghis deja de reírse.', 'normal'],
        ['donchuy', 'Y antes del viernes me van a hacer un favor. Para saber si son serios... o nomás unos pendejos con máscaras.', 'serious'],
        ['donchuy', 'Afuera hay un carro negro. Llévenlo al muelle del puerto. Sin policía, sin un rasguño y sin abrir la cajuela.', 'serious'],
        ['kazoo', '¿Qué hay en la cajuela?', 'think'],
        ['donchuy', 'Algo que no te debe importar. Si lo entregan limpio, hay viernes. Si no... ya no hay viernes. Para nadie.', 'serious'],
        ['donchuy', 'Y ni una palabra al de los lentes. Coqui, ¿verdad? Ese hombre ya pagó bastante por confiar en la gente.', 'serious'],
      ]);
      S().flags.jefeSabe = true;
      yield* fadeOut(0.6);
      music(null);
      cityAt('donchuy', 14);
      yield* fadeIn(0.5);
      lock(false);
    },
  },
  {
    id: 'c6_encargo', chapter: 6, title: 'El encargo', requires: ['c6_jefe'], customRooms: true, failPlace: 'donchuy',
    rating: () => ({ by: 'El Jefe', stars: 4, text: 'Limpio. No me lo esperaba de ustedes.' }),
    *run(ctx) {
      setClock(22, 50);
      const c = C(), dc = P().donchuy;
      if (G.scene !== c) cityAt('donchuy', 14);
      G.forceDark = 0.55;
      let car = c.vehicles.find((v) => v.jefeCar && !v.dead);
      if (!car) { car = c.spawnVehicle('sedan', dc.x + 30, dc.y + 26, 0, { mission: true, color: '#101014' }); car.jefeCar = true; }
      car.keep = true; car.label = 'CARRO DEL JEFE';
      for (const q of c.peds.filter((q) => q.ally && q.lookId === 'ghenghis')) c.removePed(q);
      const gh = ally('ghenghis', dc.x - 14, dc.y + 12, 'GHENGHIS');
      ctx.check(() => (car.dead ? (car.sunk ? 'Hundiste el carro del Jefe. Con todo y lo de la cajuela.' : 'Destruiste el carro del Jefe.') : null));
      const setObj = (t) => { if (UI.objective !== t) objective(t); };
      objective('Súbete al carro del Jefe con Ghenghis');
      yield* until(() => c.player.car === car && car.passengers.includes(gh));
      car.label = null;
      UI.timer = { label: 'ENTREGA', t: 170 };
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'Llegaste tarde. Al Jefe no se le hace esperar.' : null));
      const ride = talkAlong([
        ['ghenghis', '¿Qué crees que traiga en la cajuela?', 'think'],
        ['kazoo', 'No quiero saber.', 'serious'],
        ['ghenghis', 'Yo digo que es un cuate que le debía menos que tú. Jajaja.', 'laugh'],
        ['kazoo', 'No es chistoso, wey.', 'angry'],
        ['ghenghis', 'Ya sé. Por eso me río.', 'normal'],
        ['ghenghis', 'Oye, Kazoo... si un día el Jefe me paga por meterte un tiro... ¿tú crees que lo haría?', 'serious'],
        ['kazoo', '¿Qué?', 'shock'],
        ['ghenghis', 'Nomás pregunto. Jajaja. Tranquilo, yo cobro caro.', 'laugh'],
        ['kazoo', '...', 'serious'],
        ['ghenghis', 'Y a Coqui ni una palabra. Si se entera que vinimos con el Jefe sin él, se va a poner como se pone.', 'normal'],
        ['kazoo', '¿Cómo se pone?', 'think'],
        ['ghenghis', 'Como alguien al que ya vendieron una vez.', 'serious'],
      ]);
      const dk = DOCK();
      const m = c.addMarker({ x: dk.x, y: dk.y, r: 24, color: '#b8a070', label: 'MUELLE', needCar: true });
      UI.meter = { label: 'CARRO DEL JEFE', v: 1, col: '#46b450' };
      let warned = false;
      while (true) {
        const dt = yield;
        UI.timer.t -= dt;
        const f = car.hp / car.maxHp;
        UI.meter = { label: 'CARRO DEL JEFE', v: f, col: f < 0.5 ? '#d8323c' : f < 0.75 ? '#f08c28' : '#46b450' };
        const inCar = c.player.car === car && car.passengers.includes(gh);
        m.hidden = !inCar;
        setObj(!inCar ? 'Regresa al carro del Jefe (con Ghenghis)' : c.wanted > 0 ? 'Pierde a la policía antes de llegar al muelle' : 'Lleva el carro al muelle del puerto. Sin un rasguño.');
        if (m.inside && inCar) {
          if (c.wanted > 0) { if (!warned) { warned = true; toast('Con la policía atrás no se entrega nada. Piérdelos.', '#d8323c', 3); } continue; }
          break;
        }
      }
      c.removeMarker(m);
      UI.timer = null;
      const dmg = car.hp / car.maxHp;
      UI.meter = null;
      if (dmg < 0.5) ctx.fail('Entregaste el carro hecho pedazos. Al Jefe no le gustó.');
      lock(true);
      yield* finishTalk(ride);
      c.exitCar(true);
      const tk = c.spawnPed('guarura', dk.x + 24, dk.y - 18, { state: 'idle', mission: true });
      tk.a = Math.PI;
      yield* talk([
        ['guarura', 'Llegaron. Y sin un rasguño. El Jefe va a estar contento.', 'serious'],
        ['guarura', 'Bueno. Menos triste.', 'serious'],
      ]);
      car.noEnter = true;
      // across the dock, someone with the lights off
      const spy = c.spawnVehicle('sedan', dk.x - 110, dk.y + 70, -Math.PI / 2, { mission: true, color: '#1a1a2e' });
      spy.noEnter = true;
      UI.letterboxTarget = 1;
      c.camTarget = { x: spy.x, y: spy.y };
      music('tension');
      yield* wait(1.6);
      yield* say('narrator', 'Del otro lado del muelle, un carro con las luces apagadas.', 'normal');
      yield* say('coqui', '(...¿Ustedes dos? ¿Con la gente del Jefe? ¿Y a mí quién me avisó?)', 'serious');
      S().flags.coquiVio = true;
      c.camTarget = null; UI.letterboxTarget = 0;
      yield* fadeOut(0.8);
      c.removeVehicle(spy); c.removeVehicle(car); c.removePed(tk);
      for (const q of c.peds.filter((q) => q.ally && q.lookId === 'ghenghis')) c.removePed(q);
      G.forceDark = undefined;
      music(null);
      setDay(-3); setClock(10, 0);
      cityAt('pension', 10);
      yield* fadeIn(0.6);
      lock(false);
      chat('coqui', 'Escondite. Ahorita. Los dos.');
      yield* wait(1.4);
      chat('ghenghis', 'uy. ya valimos jajaja');
    },
  },
  {
    id: 'c6_coqui', chapter: 6, title: 'Nadie improvisa', requires: ['c6_encargo'], customRooms: true, lockRoom: true, failPlace: 'escondite',
    trigger: { door: 'escondite', letter: 'C', color: '#5a8ce0', label: 'COQUI' },
    rating: () => ({ by: 'Coqui', stars: 2, text: 'No les creo. A ninguno de los dos.' }),
    *run(ctx) {
      lock(true);
      yield* fadeOut(0.3);
      roomAt('escondite', 60);
      const r = R();
      r.noExit = true;
      r.prop('plan').plan = true;
      r.props.push({ t: 'tsuruside', x: 330, col: '#d8d8d0', id: 'tsuru' });
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 200, facing: -1 });
      r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 250, facing: -1, pose: 'sit', y: FLOOR - 4 });
      yield* fadeIn(0.4);
      yield* walkPlayer(150);
      music('tension');
      yield* talk([
        ['coqui', 'Siéntate.', 'serious'],
        ['kazoo', 'Estoy bien parado.', 'normal'],
        ['coqui', 'Siéntate, Kazoo.', 'angry'],
        ['coqui', '¿Dónde andaban anoche? Los dos.', 'serious'],
        ['ghenghis', 'Durmiendo. Yo duermo mucho, por eso me corrieron. Jajaja.', 'laugh'],
        ['coqui', 'En el muelle. Con un carro del Jefe. Y dos de sus gorilas.', 'serious'],
        ['narrator', 'Silencio.', 'normal'],
      ]);
      const ch = yield* ask('kazoo', '(Coqui no parpadea.)', ['"El Jefe sabe del banco. Quiere su parte."', '"Era un favor para la deuda. Nada que ver."', '"¿Nos estabas siguiendo?"']);
      if (ch === 0) {
        trust(4);
        yield* talk([
          ['kazoo', 'El Jefe sabe del banco, Coqui. Sabe el día, la hora y el carro. Quiere sus cincuenta mil y el veinte por ciento.', 'serious'],
          ['coqui', '...¿Y por qué me entero en un muelle a las once de la noche?', 'angry'],
          ['kazoo', 'Porque nos dijo que no te dijéramos.', 'sad'],
          ['coqui', '¿Y desde cuándo le hacen caso al Jefe y a mí no?', 'angry'],
          ['ghenghis', 'Desde que el Jefe tiene más gorilas que tú. Jajaja.', 'laugh'],
          ['coqui', 'Veinte por ciento... Está bien. Se lo damos.', 'serious'],
        ]);
      } else if (ch === 1) {
        trust(-5);
        yield* talk([
          ['kazoo', 'Era un favor para bajarle a la deuda. Nada que ver con el plan.', 'normal'],
          ['coqui', '¿Y por qué fue Ghenghis? Él no le debe nada al Jefe.', 'serious'],
          ['ghenghis', 'Todavía.', 'laugh'],
          ['coqui', '...Me están mintiendo. Los dos. Lo huelo desde aquí.', 'angry'],
        ]);
      } else {
        trust(-2);
        yield* talk([
          ['kazoo', '¿Nos estabas siguiendo?', 'angry'],
          ['coqui', 'Primero tú platicando con la policía. Ahora los dos con el Jefe. Claro que los estoy siguiendo.', 'angry'],
        ]);
      }
      yield* talk([
        ['coqui', 'Escúchenme bien. El Tuercas también empezó con favores. Con "nada que ver". Con "luego te cuento".', 'serious'],
        ['coqui', 'Y un día abrí una puerta y del otro lado estaba la policía.', 'sad'],
        ['ghenghis', 'Jajaja. Qué intenso, Coqui. Nadie te va a vender. Nadie te compraría.', 'laugh'],
        ['coqui', 'No me hace gracia.', 'angry'],
        ['kazoo', 'Coqui... somos nosotros.', 'sad'],
        ['coqui', 'Eso decía el Tuercas.', 'serious'],
        ['narrator', 'Coqui no deja de mirarlos. A uno. Luego al otro.', 'normal'],
      ]);
      S().flags.coquiSospecha = true;
      void co;
      music(null);
      yield* fadeOut(0.8);
      setDay(-1); setClock(9, 0);
      cityAt('pension', 10);
      lock(false);
    },
  },
];

void dist; void line; void lines; void UI;
