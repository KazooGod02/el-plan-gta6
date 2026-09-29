// CAPÍTULO 5 — "Marketplace" (Día -7)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo, addMoney } from '../script.js';
import { P, C, R, S, line, lines, cityAt, roomAt, dumb, seat } from './common.js';
import { play } from '../../minigames/index.js';
import { FLOOR } from '../../interior/rooms.js';
import { unlock } from '../achievements.js';
import { TS } from '../../world/map.js';

export const CAP5 = [
  {
    id: 'c5_market', chapter: 5, chapterStart: true, title: 'Marketplace', requires: ['c4_reporte'], customRooms: true,
    rating: () => ({ by: 'VendeRápido_5E', stars: 5, text: '¡Excelente comprador! Muy confiado.' }),
    *run(ctx) {
      setDay(-7); setClock(11, 0);
      lock(true);
      roomAt('cuarto', 120);
      G.story.populateRoom('cuarto');
      const r = R();
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 160, facing: -1 });
      yield* fadeIn(0.4);
      yield* talk([
        ['coqui', 'Kazoo. Esto es todo lo que juntamos. Lo de Ghenghis, lo mío, lo que le sacamos a la Tía de cambio.', 'serious'],
        ['coqui', 'Ocho mil quinientos pesos.', 'serious'],
        ['kazoo', '¡Wow! ¿Todo para mí?', 'happy'],
        ['coqui', 'Para el CARRO. Un carro. Confiable. Que no llame la atención.', 'angry'],
        ['kazoo', 'Confiable.', 'smug'],
        ['coqui', 'Kazoo, mírame.', 'serious'],
        ['coqui', 'No. Lo. Compres. En. El. Marketplace.', 'angry'],
        ['kazoo', 'Obvio, wey. Obvio. ¿Por quién me tomas?', 'happy'],
        ['coqui', 'Por ti. Te tomo por ti. Ese es el problema.', 'serious'],
      ]);
      addMoney(8500);
      yield* walkNpc(co, 10, 50);
      r.removeNpc(co);
      audio.sfx('door');
      yield* wait(0.8);
      yield* talk([
        ['kazoo', '...', 'think'],
        ['kazoo', 'Nomás voy a ver. Ver no es comprar.', 'smug'],
      ]);
      yield* play('carmarket', { budget: 8500 });
      yield* talk([
        ['kazoo', 'Cinco estrellas. Quinientas reseñas.', 'happy'],
        ['kazoo', 'Esto es básicamente un concesionario.', 'smug'],
      ]);
      lock(false);
    },
  },
  {
    id: 'c5_vendedor', chapter: 5, title: 'Cinco estrellas', requires: ['c5_market'], customRooms: true, failPlace: 'plazavicio',
    rating: () => ({ by: 'VendeRápido_5E', stars: 5, text: 'Cliente ideal. Nunca va a regresar a quejarse.' }),
    *run(ctx) {
      setClock(17, 20);
      objective('Ve al estacionamiento de Plaza Vicio (El Centro) a las 6');
      const pv = P().plazavicio, c = C();
      yield* goTo(pv.x, pv.y, { label: 'PLAZA VICIO', r: 22 });
      if (c.player.car) c.exitCar(true);
      lock(true);
      setClock(18, 0);
      const tsuru = c.spawnVehicle('tsuru', pv.x + 40, pv.y, Math.PI, { mission: true, color: '#d8d8d0' });
      tsuru.keep = true; tsuru.hp = 70; tsuru.label = 'TSURU 2003';
      const vend = c.spawnPed('vendedor', pv.x + 22, pv.y + 12, { state: 'idle', mission: true });
      c.camTarget = { x: pv.x + 20, y: pv.y + 6 };
      UI.letterboxTarget = 1;
      yield* wait(0.8);
      yield* talk([
        ['vendedor', '¡Tú debes ser Kazoo! ¡Mucho gusto, amigo! VendeRápido. Cinco estrellas. Quinientas reseñas.', 'happy'],
        ['kazoo', 'Wow. ¿Quinientas?', 'shock'],
        ['vendedor', 'Quinientas. Todas de cinco. ¿Sabes por qué?', 'happy'],
        ['kazoo', '¿Por qué?', 'think'],
        ['vendedor', 'Porque nunca nadie ha regresado a quejarse.', 'happy'],
        ['kazoo', '...Eso es muy bueno, ¿verdad?', 'think'],
        ['vendedor', '¡Buenísimo! Ahí está. Tsuru 2003. Como nuevo. ¿Una vuelta de prueba? Maneja tú, yo te acompaño.', 'happy'],
      ]);
      c.camTarget = null; UI.letterboxTarget = 0;
      tsuru.label = null;
      c.removePed(vend);
      const vp = seat(tsuru, 'vendedor', null);
      c.putInCar(tsuru);
      lock(false);
      objective('Prueba de manejo: sigue los puntos');
      const pts = [{ x: 24 * TS, y: 34 * TS }, { x: 44 * TS, y: 49 * TS }, { x: 24 * TS, y: 19 * TS }, { x: pv.x, y: pv.y }];
      for (let i = 0; i < pts.length; i++) {
        yield* goTo(pts[i].x, pts[i].y, { r: 30, needCar: true, label: i === 3 ? 'REGRESAR' : 'PRUEBA ' + (i + 1), check: () => { if (c.player.car !== tsuru) objective('Súbete otra vez al Tsuru'); else objective('Prueba de manejo: sigue los puntos'); } });
        if (i === 0) {
          tsuru.forceSmoke = 'gray';
          yield* lines([['kazoo', '¿Eso es humo?', 'shock'], ['vendedor', 'Vapor. Es el aire acondicionado. Muy moderno.', 'happy']]);
          tsuru.forceSmoke = null;
        }
        if (i === 1) {
          tsuru.engineOff = true;
          audio.sfx('engine_die');
          yield* line('kazoo', '¡Se apagó!', 'shock');
          yield* line('vendedor', '¡Ah! Espérate tantito. Déjame nomás...', 'happy');
          UI.subtitle = 'El vendedor mete la mano debajo del tablero...';
          yield* wait(1.4);
          audio.sfx('bip', { dur: 0.08 });
          UI.subtitle = '*bip*';
          yield* wait(1);
          UI.subtitle = null;
          if (S().flags.knowsTracker) yield* lines([['kazoo', '...¿Qué fue ese bip?', 'think'], ['vendedor', 'El estéreo. Es un estéreo muy... sensible.', 'happy']]);
          tsuru.engineOff = false;
          yield* line('vendedor', '¡Listo! Como nuevo. Hace un ruidito, pero es su personalidad.', 'happy');
          yield* line('kazoo', '¡Yo digo lo mismo de mi moto!', 'happy');
        }
      }
      lock(true);
      c.exitCar(true);
      const i = tsuru.passengers.indexOf(vp); if (i >= 0) tsuru.passengers.splice(i, 1);
      const v2 = c.peds.find((q) => q.lookId === 'vendedor'); if (v2) { v2.state = 'idle'; v2.ally = false; v2.follow = false; }
      yield* talk([
        ['vendedor', '¿Y? ¿Qué te pareció?', 'happy'],
        ['kazoo', 'Tiene personalidad.', 'happy'],
        ['vendedor', 'Mucha. Son $8,499.', 'happy'],
        ['kazoo', 'Traigo $8,500 exactos. ¿Tienes cambio de un peso?', 'normal'],
        ['vendedor', 'Quédate con el peso. Por las cinco estrellas. Porque me vas a dejar mis cinco estrellas, ¿verdad?', 'happy'],
      ]);
      S().money = Math.max(0, S().money - 8499); audio.sfx('coin');
      unlock('oferta');
      const stars = yield* ask('vendedor', 'Califica a VendeRápido_5E en el Marketplace:', ['★★★★★ (5)', '★★★★☆ (4)', '★★★☆☆ (3)', '★☆☆☆☆ (1)']);
      S().flags.sellerStars = [5, 4, 3, 1][stars];
      if (stars === 0) yield* say('vendedor', '¡Cinco estrellas! Eres de los buenos, Kazoo. De los que no regresan.', 'happy');
      else { yield* say('vendedor', '...¿' + S().flags.sellerStars + '? Hm. Bueno. Nadie es perfecto. Ni tú. Sobre todo tú.', 'serious'); dumb(); }
      if (v2) c.removePed(v2);
      lock(false);
      chat('kazoo', 'Ya tengo carro');
      yield* wait(1.2); chat('coqui', 'De dónde?');
      yield* wait(1.2); chat('kazoo', 'De un conocido');
      yield* wait(1.2); chat('ghenghis', 'qué conocido jajaja');
      yield* wait(1.2); chat('kazoo', 'Un conocido muy recomendado');
      yield* wait(1.2); chat('coqui', 'Tráelo al escondite. Ya.');
    },
  },
  {
    id: 'c5_coqui', chapter: 5, title: '"Está bien. Aguanta."', requires: ['c5_vendedor'], customRooms: true, failPlace: 'escondite',
    rating: () => ({ by: 'Coqui', stars: 3, text: 'Aguanta. Un rato.' }),
    *run(ctx) {
      const c = C();
      let tsuru = c.vehicles.find((v) => v.type === 'tsuru' && v.mission);
      if (!tsuru) { const pv = P().plazavicio; tsuru = c.spawnVehicle('tsuru', pv.x + 40, pv.y, Math.PI, { mission: true, color: '#d8d8d0' }); tsuru.hp = 70; }
      tsuru.keep = true;
      ctx.check(() => (tsuru.dead ? '¡Destruiste el Tsuru!' : null));
      objective('Lleva el Tsuru al escondite');
      const esc = P().escondite;
      yield* goTo(esc.x, esc.y + 10, { r: 22, needCar: true, label: 'ESCONDITE', check: () => { objective(c.player.car === tsuru ? 'Lleva el Tsuru al escondite' : 'Súbete al Tsuru'); } });
      if (c.player.car !== tsuru) { yield* until(() => c.player.car === tsuru); }
      lock(true);
      c.exitCar(true);
      c.removeVehicle(tsuru);
      yield* fadeOut(0.3);
      roomAt('escondite', 280);
      const r = R();
      r.prop('plan').plan = true;
      const car = { t: 'tsuruside', x: 330, col: '#d8d8d0', id: 'tsuru' };
      r.props.push(car);
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 240, facing: 1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 420, facing: -1 });
      yield* fadeIn(0.3);
      yield* talk([
        ['ghenghis', '¡JAJAJA! ¿ESO es el carro?', 'laugh'],
        ['kazoo', 'Tsuru 2003. Como nuevo.', 'smug'],
        ['coqui', '¿De dónde lo sacaste?', 'serious'],
      ]);
      const ch = yield* ask('kazoo', '(Coqui te está mirando fijamente.)', ['"De un conocido. Muy recomendado."', '"Del Mark... de un conocido."', '"Del Marketplace, wey. Cinco estrellas."']);
      if (ch === 0) yield* talk([['kazoo', 'De un conocido. Muy recomendado.', 'normal'], ['coqui', '...', 'serious']]);
      if (ch === 1) { trust(-3); yield* talk([['kazoo', 'Del Mark... de un conocido.', 'shock'], ['coqui', '¿Del qué?', 'angry'], ['kazoo', 'Del... Marcos. Un conocido. Se llama Marcos.', 'sad']]); dumb(); }
      if (ch === 2) { trust(-5); yield* talk([['kazoo', 'Del Marketplace, wey. Cinco estrellas.', 'happy'], ['coqui', '¡¿DEL QUÉ?!', 'angry'], ['kazoo', '¡Es broma! Es broma. Jajaja. De un conocido. Qué risa.', 'shock'], ['coqui', 'No es gracioso, Kazoo.', 'serious']]); }
      car.hoodOpen = true;
      audio.sfx('door');
      yield* talk([
        ['coqui', '(abre el cofre) Motor... aceite... ¿eso es cinta de aislar?', 'think'],
        ['kazoo', 'Es... decorativa.', 'sad'],
        ['coqui', '...', 'think'],
      ]);
      car.hoodOpen = false; audio.sfx('door');
      yield* talk([
        ['coqui', 'Está bien. Aguanta.', 'serious'],
        ['coqui', '...Un rato.', 'serious'],
        ['ghenghis', 'Está bien feo.', 'happy'],
        ['kazoo', 'Tiene personalidad.', 'happy'],
        ['ghenghis', 'Hace un ruidito.', 'crazy'],
        ['kazoo', '¡ES SU PERSONALIDAD!', 'angry'],
      ]);
      void co; void gh;
      yield* fadeOut(0.8);
      setDay(-4); setClock(22, 0);
      lock(false);
    },
  },
];
