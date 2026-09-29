// CAPÍTULO 3 — "El Plan" (Día -14)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo, addMoney } from '../script.js';
import { P, C, R, S, line, lines, ally, cityAt, roomAt, dumb } from './common.js';
import { play } from '../../minigames/index.js';
import { FLOOR } from '../../interior/rooms.js';
import { unlock } from '../achievements.js';

const MASK_NAME = { luchador: 'de luchador', presidente: 'de presidente', payaso: 'de payaso', calavera: 'de calavera', pasamontanas: 'pasamontañas' };

export const CAP3 = [
  {
    id: 'c3_escondite', chapter: 3, chapterStart: true, title: 'El plan', requires: ['c2_banco'], customRooms: true,
    rating: () => ({ by: 'Coqui', stars: 5, text: 'Nadie improvisa.' }),
    *run(ctx) {
      setDay(-14); setClock(9, 30);
      const pen = P().pension;
      if (G.scene !== C()) cityAt(pen, 10);
      chat('coqui', 'Taller abandonado. El Puerto. 10 AM. No llegues tarde.');
      yield* wait(1.2);
      chat('ghenghis', 'jajaja va a llegar tarde');
      yield* wait(1.2);
      chat('kazoo', 'no voy a llegar tarde');
      yield* wait(1);
      chat('kazoo', 'bueno tantito');
      objective('Ve al escondite: el taller abandonado de El Puerto');
      const esc = P().escondite;
      yield* goTo(esc.x, esc.y, { label: 'ESCONDITE', r: 14 });
      const c = C();
      if (c.player.car) c.exitCar(true);
      lock(true);
      yield* fadeOut(0.4);
      roomAt('escondite', 40);
      const r = R();
      r.room.music = null;
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 150, facing: -1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 260, facing: -1, pose: 'sit', y: FLOOR - 4 });
      yield* fadeIn(0.4);
      yield* walkPlayer(110);
      yield* talk([
        ['coqui', 'Bienvenido a la oficina.', 'normal'],
        ['ghenghis', 'Huele a gato muerto.', 'happy'],
        ['coqui', 'Es el precio de la discreción.', 'serious'],
      ]);
      co.facing = 1;
      yield* walkNpc(co, 196, 40);
      r.prop('plan').plan = true;
      audio.sfx('select');
      music('tension');
      r.camTarget = { x: 190 };
      yield* talk([
        ['coqui', 'El plan. Último viernes del mes. Entramos a las 10:05, justo después de que llega el blindado. La bóveda está llena.', 'serious'],
        ['coqui', 'Ghenghis: tú conoces el banco. Tú guías adentro, te encargas de los guardias... y cargas la mochila.', 'normal'],
        ['ghenghis', '¿Por qué yo la mochila?', 'think'],
        ['coqui', 'Porque eres el único que no la va a perder.', 'serious'],
        ['kazoo', '¡Oye!', 'angry'],
        ['coqui', 'Yo: la ruta. Entrada, salida, tiempos. Todo.', 'normal'],
        ['coqui', 'Kazoo: herramientas, disfraces... y el carro.', 'normal'],
        ['kazoo', '¿No que yo no el carro?', 'shock'],
        ['coqui', 'Lo pensé mejor. No hay presupuesto para otro miembro.', 'sad'],
        ['kazoo', '¡Wuuu! ¡Confían en mí!', 'happy'],
        ['coqui', 'Un carro. Confiable. Que no llame la atención.', 'serious'],
        ['kazoo', 'Confiable. Anotado.', 'smug'],
        ['coqui', 'No anotaste nada.', 'serious'],
        ['kazoo', 'Lo anoté aquí. (se toca la cabeza)', 'happy'],
        ['coqui', 'Eso me preocupa más.', 'sad'],
        ['coqui', 'Regla número uno: nadie improvisa. NADIE. Si alguien improvisa, se cae todo.', 'angry'],
        ['ghenghis', '¿Y si improviso bien?', 'crazy'],
        ['kazoo', '¡Eso mismo dije yo en 2019!', 'happy'],
        ['coqui', 'Y mira cómo acabé.', 'serious'],
        ['narrator', '(Silencio incómodo)', 'normal'],
        ['coqui', 'Necesitamos tres cosas. Máscaras: Disfraces Carnaval, en El Centro. Armas: la Tía Gris, aquí en El Puerto.', 'normal'],
        ['coqui', 'Y un taladro industrial. En la Bodega 7 hay uno. De noche no hay casi nadie.', 'normal'],
        ['ghenghis', 'Yo conozco a la Tía Gris. Me da miedo. Me cae bien.', 'happy'],
        ['coqui', 'Toma, Kazoo. Mil quinientos. Para las máscaras y lo que salga. No te lo gastes en el Marketplace.', 'serious'],
        ['kazoo', '(¿Cómo sabe?)', 'shock'],
      ]);
      r.camTarget = null;
      addMoney(1500);
      music(null);
      lock(false);
      toast('Tres misiones nuevas en el mapa: M, T y B', '#ffd23f', 4);
    },
  },
  {
    id: 'c3_mascaras', chapter: 3, title: 'Máscaras', requires: ['c3_escondite'], customRooms: true,
    trigger: { door: 'disfraces', letter: 'M', color: '#f08c28', label: 'MÁSCARAS' },
    rating: () => ({ by: 'El dependiente', stars: 3, text: 'No quiero saber para qué eran.' }),
    *run(ctx) {
      lock(true);
      roomAt('disfraces', 40);
      const r = R();
      r.addNpc({ id: 'clerk', look: 'clerk', x: 300, facing: -1 });
      yield* walkPlayer(250);
      yield* talk([
        ['clerk', 'Bienvenido a Disfraces Carnaval. ¿Buscas algo para fiesta?', 'normal'],
        ['kazoo', 'Sí. Para una fiesta. En un banco.', 'happy'],
        ['clerk', '...¿Una fiesta en un banco?', 'shock'],
        ['kazoo', '¡Digo, CON el banco! Una fiesta... temática. De banco. Todos vamos de... clientes.', 'shock'],
        ['clerk', 'No quiero saber. Las máscaras están ahí. Tres, ¿verdad? Todos los que vienen a comprar tres máscaras dicen lo mismo.', 'smug'],
      ]);
      const res = yield* play('costume');
      const m = S().masks;
      yield* talk([
        ['clerk', 'Son $600. Sin factura, ¿verdad?', 'smug'],
        ['kazoo', 'Sin factura.', 'normal'],
      ]);
      S().money = Math.max(0, S().money - 600); audio.sfx('coin');
      lock(false);
      chat('kazoo', 'Ya tengo las máscaras');
      yield* wait(1);
      chat('ghenghis', '¿cuál me tocó?');
      yield* wait(1);
      chat('kazoo', 'Una ' + MASK_NAME[m.ghenghis] + ' jajaja');
      yield* wait(1.2);
      if (m.ghenghis === 'payaso') chat('ghenghis', 'LA QUERÍA DE PAYASO. TE AMO');
      else chat('ghenghis', 'yo quería la de payaso pero ok');
      yield* wait(1);
      chat('coqui', 'Y la mía?');
      yield* wait(1);
      chat('kazoo', 'Sorpresa ' + (m.coqui === 'payaso' ? '🙂'.replace('🙂', ':)') : ':)'));
      yield* wait(1);
      chat('coqui', m.coqui === 'payaso' ? 'KAZOO NO' : 'Kazoo.');
      void res;
    },
  },
  {
    id: 'c3_tia', chapter: 3, title: 'Regla número uno', requires: ['c3_escondite'], customRooms: true,
    trigger: { door: 'galpon', letter: 'T', color: '#a0b070', label: 'LA TÍA GRIS' },
    rating: () => ({ by: 'La Tía Gris', stars: 3, text: 'Dudaste poquito. Poquito es mucho.' }),
    *run(ctx) {
      lock(true);
      roomAt('galpon', 40);
      const r = R();
      const tia = r.addNpc({ id: 'tia', look: 'tia', x: 214, facing: -1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 140, facing: 1 });
      yield* walkPlayer(170);
      yield* talk([
        ['tia', 'Ghenghis. Te dije que no volvieras.', 'serious'],
        ['ghenghis', 'Y aquí estoy. Jajaja.', 'laugh'],
        ['tia', '¿Y este?', 'serious'],
        ['kazoo', 'Kazoo. Mucho gusto.', 'happy'],
        ['tia', 'No es mucho.', 'serious'],
        ['tia', '¿Qué necesitan?', 'normal'],
        ['ghenghis', 'Tres. De las que no fallan.', 'serious'],
        ['tia', 'Todas fallan, niño. Las que no fallan son las personas.', 'serious'],
        ['tia', 'Antes de venderte algo, vas a disparar. Si no le atinas a una silueta, no te vendo ni una resortera.', 'smug'],
        ['tia', 'Y escúchame bien, porque lo digo una vez.', 'serious'],
        ['tia', 'Regla número uno. Si te apuntan, tú disparas primero. Los que dudan no cuentan la historia.', 'angry'],
        ['kazoo', '¿Y la regla número dos?', 'think'],
        ['tia', 'No hay regla dos. Los que llegan a la dos ya se murieron.', 'serious'],
      ]);
      let res = null;
      for (let tries = 0; tries < 10; tries++) {
        res = yield* play('range', { time: 40 });
        if (res.civ > 0) yield* say('tia', 'Le diste a un civil. En la vida real eso no se borra, niño.', 'angry');
        if (res.score >= 400) break;
        yield* say('tia', 'Otra vez. Y esta vez no cierres los ojos.', 'serious');
      }
      if (res.perfect) yield* say('tia', '...Perfecto. No dudaste. Eso me asusta un poquito. Pero me gusta.', 'smug');
      else yield* say('tia', 'Nada mal. Dudaste poquito. Poquito es mucho.', 'serious');
      yield* say('tia', 'Coqui ya pagó. Tres pistolas y balas. Te doy la tuya.', 'normal');
      S().weapons.pistol = (S().weapons.pistol || 0) + 36;
      S().weapon = 'pistol';
      audio.sfx('reload');
      toast('PISTOLA — Q cambia de arma. Espacio dispara.', '#ffd23f', 4);
      gh.pose = 'aim'; gh.facing = 1;
      yield* say('ghenghis', 'Oye Kazoo, mira. ¡Bang! Jajaja.', 'crazy');
      tia.facing = -1;
      yield* talk([
        ['tia', '¡NO SE LE APUNTA A LA GENTE, ANIMAL!', 'angry'],
        ['ghenghis', 'Jajaja, relájese, no está cargada.', 'laugh'],
        ['tia', 'TODAS están cargadas. Siempre. Hasta las de juguete.', 'angry'],
        ['kazoo', '...', 'serious'],
      ]);
      gh.pose = null;
      S().weapon = 'fists';
      lock(false);
    },
  },
  {
    id: 'c3_taladro', chapter: 3, title: 'El taladro', requires: ['c3_escondite'], customRooms: true, lockRoom: true, failPlace: 'bodega',
    trigger: { door: 'bodega', letter: 'B', color: '#a8a8b8', label: 'BODEGA 7' },
    rating: () => ({ by: 'Coqui', stars: 4, text: 'Silencioso. Como debe ser.' }),
    *run(ctx) {
      lock(true);
      yield* fadeOut(0.5);
      setClock(23, 30);
      roomAt('bodega', 40);
      const r = R();
      r.noExit = true;
      r.stealth = true;
      r.addEnemy({ look: 'guard', x: 200, patrol: [96, 290], speed: 22, vision: 110, flashlight: true, facing: 1, pauseT: 2.5 });
      r.addEnemy({ look: 'guard', x: 470, patrol: [390, 580], speed: 24, vision: 110, flashlight: true, facing: -1, pauseT: 2 });
      r.addEnemy({ look: 'guard', x: 700, patrol: [640, 830], speed: 20, vision: 110, flashlight: true, facing: 1, pauseT: 3 });
      r.onDetected = (e) => { if (!r._caught) { r._caught = true; e.bark = '¡¿Quién anda ahí?!'; e.barkT = 2; G.story.fail('Un guardia te vio', 'fail'); } };
      music('tension');
      yield* fadeIn(0.5);
      yield* say('narrator', 'Bodega 7. Medianoche. Tres guardias con linterna. Sin ruido, Kazoo.', 'normal');
      lock(false);
      toast('En lo oscuro solo te ven con la linterna o si estás muy cerca.', '#5adcf0', 5);
      objective('Toma el taladro del fondo de la bodega');
      let got = false;
      const act = r.addAction({ x: 878, r: 16, label: 'Tomar el taladro', fn: () => { got = true; act.disabled = true; r.prop('drill').hidden = true; audio.sfx('pickup'); } });
      yield* until(() => got);
      toast('¡Tienes el taladro! Ahora sal sin que te vean.', '#46d470', 3);
      objective('Sal de la bodega (puerta de la izquierda)');
      r.noExit = false;
      let out = false;
      r.onExit = () => { out = true; return false; };
      yield* until(() => r.p.x < 30 || out);
      lock(true);
      r.stealth = false;
      music(null);
      yield* fadeOut(0.4);
      const bd = P().bodega;
      cityAt(bd, 12);
      yield* fadeIn(0.4);
      lock(false);
      objective('Lleva el taladro al escondite');
      const esc = P().escondite;
      yield* goTo(esc.x, esc.y, { label: 'ESCONDITE', r: 16 });
      toast('Taladro entregado', '#46d470', 2);
    },
    onRoomExit(exit) { return true; },
  },
  {
    id: 'c3_fin', chapter: 3, title: 'Casi listos', requires: ['c3_mascaras', 'c3_tia', 'c3_taladro'], customRooms: true,
    rating: () => ({ by: 'Ghenghis', stars: 5, text: 'Esto va a salir mal. Qué emoción.' }),
    *run(ctx) {
      lock(true);
      yield* fadeOut(0.4);
      setClock(18, 0);
      roomAt('escondite', 150);
      const r = R();
      r.prop('plan').plan = true;
      r.props.push({ t: 'drill', x: 60, y: 132 });
      const co = r.addNpc({ id: 'coqui', look: 'coqui', x: 200, facing: -1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 250, facing: -1, mask: S().masks.ghenghis });
      yield* fadeIn(0.4);
      const m = S().masks;
      yield* talk([
        ['ghenghis', '¿Cómo me veo?', 'happy'],
        ['coqui', 'Como alguien que va a asaltar un banco... ' + (m.ghenghis === 'payaso' ? 'en una fiesta infantil.' : 'con mucha confianza.'), 'serious'],
        ['coqui', 'Máscaras, listo. Armas, listo. Taladro, listo.', 'normal'],
        ['coqui', 'Solo falta el carro.', 'serious'],
        ['kazoo', 'Yo me encargo.', 'smug'],
        ['coqui', 'Confiable, Kazoo.', 'serious'],
        ['kazoo', 'Confiable. Anotado.', 'happy'],
        ['coqui', 'Y otra cosa: hay que ver el banco por dentro. De cerca. Las cámaras, la alarma, los guardias.', 'think'],
        ['ghenghis', 'A mí me conocen ahí. Me corrieron, ¿te acuerdas? Jajaja.', 'laugh'],
        ['coqui', 'A mí me conoce media policía de Puerto Vicio.', 'serious'],
        ['narrator', 'Coqui y Ghenghis voltean a ver a Kazoo. Muy lentamente.', 'normal'],
        ['kazoo', '¿Qué? ...¿Yo?', 'shock'],
        ['coqui', 'Tú eres repartidor. Nadie ve a los repartidores.', 'normal'],
        ['kazoo', '¡Eso es muy triste y muy cierto!', 'sad'],
      ]);
      gh.mask = null;
      yield* fadeOut(0.8);
      setDay(-10); setClock(10, 0);
      lock(false);
    },
  },
];
