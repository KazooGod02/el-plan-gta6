// PRÓLOGO — "Cinco Estrellas" (Día -21)
import { G, setScene } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { input } from '../../core/input.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, cutscene, lock, objective, toast, chat, notify, setClock, setDay, addMoney, trust, flag, goTo, music, pedTo } from '../script.js';
import { P, C, R, S, line, lines, ally, unlockZone, cityAt, roomAt, autoWalk } from './common.js';
import { deliverOne } from '../../minigames/delivery.js';
import { FLOOR } from '../../interior/rooms.js';

const hint = (t) => toast(t, '#5adcf0', 4);
const isTouch = () => input.isTouch;

export const PROLOGO = [
  {
    id: 'p_intro', chapter: 0, title: 'Cinco Estrellas', silent: true,
    *run(ctx) {
      // ---- flash-forward: the first seconds of the trailer
      lock(true);
      UI.fade = 1; UI.fadeTarget = 1; UI.hud = false;
      roomAt('cuarto', 80);
      G.freezeClock = true;
      yield* wait(1.2);
      audio.setSiren(0.5);
      UI.subtitle = '*respiraciones*'; yield* wait(1.8);
      UI.subtitle = '*pasos apresurados*'; audio.sfx('step'); yield* wait(0.4); audio.sfx('step'); yield* wait(0.4); audio.sfx('step'); yield* wait(1.2);
      UI.subtitle = '*sirenas, cada vez más cerca*'; yield* wait(2);
      UI.subtitle = null;
      yield* say('coqui', '¡Te dije que ese carro no iba a aguantar!', 'angry', { portrait: false, name: 'COQUI (fuera de cuadro)' });
      audio.setSiren(0);
      audio.sfx('bang');
      yield* wait(1);
      UI.showCard('21 DÍAS ANTES', '', 3, 'big');
      yield* wait(3.2);
      UI.showCard('CINCO ESTRELLAS', 'PRÓLOGO', 4, 'chapter'); audio.sfx('star');
      yield* wait(4);
      // ---- wake up
      const s = S();
      s.day = -21; setClock(8, 30); s.chapterName = 'PRÓLOGO';
      UI.hud = true;
      G.freezeClock = false;
      const r = R();
      r.p.x = 70; r.p.facing = 1; r.p.pose = 'down';
      G.story.populateRoom('cuarto');
      yield* fadeIn(1.2);
      yield* wait(0.6);
      notify('Marketplace', 'Tu pedido fue enviado: 1x Almohada con forma de pan');
      yield* wait(1.4);
      r.p.pose = null;
      yield* talk([
        ['kazoo', '...¿Otra vez compré dormido?', 'think'],
        ['kazoo', 'Una almohada con forma de pan. Bueno. Cinco estrellas. No puede estar mal.', 'happy'],
      ]);
      lock(false);
      hint(isTouch() ? 'Muévete con el joystick. Botón A para interactuar.' : 'Muévete con WASD o flechas. E para interactuar.');
      objective('Lee el papel pegado en la puerta');
      yield* waitAviso();
      objective('');
      chat('mari', 'Mijo, ¿vienes a trabajar hoy o te doy por muerto?');
      yield* wait(1);
      hint(isTouch() ? 'Abre tu teléfono con el botón 📱' : 'Abre tu teléfono con TAB o T');
      objective('Revisa tu teléfono');
      yield* until(() => G.phone.open, 20);
      yield* until(() => !G.phone.open);
      yield* say('kazoo', 'Doña Mari. Si no llego, me corre. Y si me corre, me tengo que mudar a la banqueta... que según el aviso ya es mi siguiente casa.', 'sad');
      objective('Sal a la calle y ve a Tacos El Compa');
      yield* until(() => G.scene === C());
      hint('Sigue la letra M en el radar. Las letras marcan la historia.');
    },
    onRoomExit(exit) { if (!S().flags.readAviso) { toast('Primero lee el aviso de la puerta', '#f4f4f0', 2); return true; } return false; },
  },
  {
    id: 'p_repartos', chapter: 0, title: 'Tacos fríos', requires: ['p_intro'],
    trigger: { door: 'taqueria', letter: 'M', color: '#f07aa8', label: 'TACOS EL COMPA' },
    rating: () => ({ by: 'Doña Mari', stars: 4, text: 'Llegaste tarde, pero llegaste.' }),
    *run(ctx) {
      lock(true);
      roomAt('taqueria', 40);
      const r = R();
      const mari = r.addNpc({ id: 'mari', look: 'mari', x: 246, facing: -1 });
      r.addNpc({ look: 5, x: 50, facing: 1, pose: 'sit', y: FLOOR - 2 });
      r.addNpc({ look: 9, x: 118, facing: -1, pose: 'sit', y: FLOOR - 2 });
      yield* wait(0.5);
      yield* talk([
        ['mari', '¡Mira nomás quién se dignó a aparecer! Son las nueve y media, Kazoo.', 'angry'],
        ['kazoo', 'Buenos días, Doña Mari. Hoy se ve más joven.', 'happy'],
        ['mari', 'Y tú más tarde. Siempre más tarde.', 'serious'],
        ['mari', 'Vino Don Chuy preguntando por ti. Con la sonrisita esa que pone.', 'serious'],
        ['kazoo', '...¿Don Chuy? ¿Y qué le dijo?', 'shock'],
        ['mari', 'Que no te había visto. Que seguro andabas muerto. No me creyó.', 'normal'],
        ['mari', 'Ándale. Hay tres pedidos. La moto está afuera. Esa que compraste por internet.', 'normal'],
        ['kazoo', 'Tiene 4.8 estrellas, Doña Mari.', 'smug'],
        ['mari', 'Y se apaga cada tres cuadras.', 'serious'],
        ['kazoo', 'Es su personalidad.', 'happy'],
      ]);
      yield* fadeOut(0.4);
      const tq = P().taqueria;
      cityAt(tq, 6);
      const c = C();
      const moto = c.spawnVehicle('moto', tq.x + 24, tq.y + 22, 0, { mission: true, color: '#d8323c' });
      moto.label = 'TU MOTO';
      yield* fadeIn(0.4);
      lock(false);
      objective('Súbete a tu moto');
      hint(isTouch() ? 'Acércate y presiona A para subirte.' : 'Acércate y presiona E para subirte.');
      yield* until(() => c.player.car === moto || (c.player.car && c.player.car.type !== 'moto'));
      moto.label = null;
      hint(isTouch() ? 'Maneja con el joystick. B = freno de mano.' : 'Arriba acelera, Abajo frena. Espacio = freno de mano. Q cambia la radio.');
      ctx.check(() => (moto.dead && c.player.car === moto ? 'Destruiste la moto de reparto' : null));
      for (let i = 0; i < 3; i++) {
        if (i > 0) toast(`Pedido ${i + 1} de 3`, '#ffd23f', 2);
        yield* deliverOne({ bonusTime: 30 });
        if (i === 0) yield* line('kazoo', 'Uno menos. Faltan dos. Y 50 mil pesos. Pero de eso no quiero pensar.', 'normal');
        if (i === 1) yield* line('kazoo', '¿Por qué todos piden tacos a las diez de la mañana? ...Bueno, yo también.', 'think');
      }
      objective('Regresa a la taquería');
      yield* goTo(tq.x, tq.y + 10, { r: 20 });
      // ---- Don Chuy
      lock(true);
      if (c.player.car) c.exitCar(true);
      const p = c.player;
      c.teleport(tq.x, tq.y + 14, Math.PI / 2);
      const chuy = c.spawnPed('donchuy', tq.x - 60, tq.y + 30, { state: 'idle', mission: true });
      const g1 = c.spawnPed('thug', tq.x - 76, tq.y + 20, { state: 'idle', mission: true });
      const g2 = c.spawnPed('thug', tq.x - 76, tq.y + 40, { state: 'idle', mission: true });
      UI.letterboxTarget = 1;
      c.camTarget = { x: tq.x - 30, y: tq.y + 24 };
      music('tension');
      yield* pedTo(chuy, tq.x - 16, tq.y + 20, 30);
      chuy.a = 0; p.a = Math.PI;
      yield* talk([
        ['donchuy', 'Kazoo, mijo. Qué gusto.', 'smug'],
        ['kazoo', 'Don Chuy... qué... sorpresa. ¿Viene por unos tacos? Invita la casa. Bueno, invita Doña Mari.', 'shock'],
        ['donchuy', 'Vengo por lo mío. Cincuenta mil. De tu negocito ese... ¿cómo se llamaba?', 'normal'],
        ['kazoo', '"Kazoo\'s Tacos Gourmet".', 'sad'],
        ['donchuy', 'Nueve días duró. Nueve. Mi perro vive más que tus negocios.', 'smug'],
        ['kazoo', 'Es que Puerto Vicio no estaba listo para el taco de mango con queso de cabra.', 'normal'],
        ['donchuy', 'Nadie está listo para un taco de 180 pesos, mijo. Nadie.', 'serious'],
        ['donchuy', 'Tres semanas. Veintiún días. Ni uno más.', 'serious'],
      ]);
      const c1 = yield* ask('kazoo', '(¿Qué le digo?)', ['"¿Y si le pago en tacos? Me sobraron como 400. Congelados."', '"Se los voy a pagar, Don Chuy. Se lo juro."', '"¿Aceptan pagos a meses sin intereses?"']);
      if (c1 === 0) yield* talk([['kazoo', '¿Y si le pago en tacos? Me sobraron como 400. Congelados. Casi nuevos.', 'happy'], ['donchuy', '(sonríe) Tres semanas, Kazoo.', 'smug']]);
      if (c1 === 1) yield* talk([['kazoo', 'Se los voy a pagar, Don Chuy. Se lo juro por... por Doña Mari.', 'serious'], ['donchuy', 'No jures por gente buena, mijo. Jura por ti. Tú vales menos si fallas.', 'smug']]);
      if (c1 === 2) { yield* talk([['kazoo', '¿Aceptan pagos a meses sin intereses?', 'normal'], ['donchuy', 'Acepto pagos a meses... con intereses. Y con dientes. Los tuyos.', 'smug']]); S().flags.dumb = (S().flags.dumb || 0) + 1; }
      audio.sfx('punch', { vol: 0.4 });
      yield* say('narrator', 'Uno de los guaruras truena los nudillos. Muy fuerte. Innecesariamente fuerte.', 'normal');
      yield* pedTo(chuy, tq.x - 120, tq.y + 30, 34);
      c.removePed(chuy); c.removePed(g1); c.removePed(g2);
      c.camTarget = null;
      music(null);
      yield* say('kazoo', '...Tres semanas.', 'sad');
      UI.letterboxTarget = 0;
      lock(false);
      addMoney(60);
      if (c.vehicles.includes(moto)) { moto.mission = false; moto.keep = true; }
    },
  },
  {
    id: 'p_noche', chapter: 0, title: 'Un mensaje', requires: ['p_repartos'], silent: false,
    rating: () => ({ by: 'Tu almohada de pan', stars: 5, text: 'Suave. Huele a bolillo.' }),
    *run(ctx) {
      setClock(19, 30);
      objective('Regresa a tu cuarto en la Pensión Las Palmas');
      const pen = P().pension;
      yield* goTo(pen.x, pen.y, { label: 'PENSIÓN' });
      lock(true);
      yield* fadeOut(0.5);
      setClock(23, 40);
      roomAt('cuarto', 90);
      G.story.populateRoom('cuarto');
      if (!S().items.includes('pan')) S().items.push('pan');
      R().p.pose = 'down';
      G.forceDark = 0.55;
      yield* fadeIn(0.8);
      yield* talk([
        ['kazoo', 'Tres semanas. Cincuenta mil pesos. Una almohada de pan.', 'sad'],
        ['kazoo', 'Kazoo, eres un genio de las finanzas.', 'sad'],
      ]);
      audio.sfx('phone');
      yield* wait(0.8);
      chat('unknown', 'Salgo mañana. Recógeme a las 10 en el penal. No llegues tarde. —C');
      yield* wait(1);
      R().p.pose = null;
      yield* talk([
        ['kazoo', '...¿"C"?', 'think'],
        ['kazoo', '...', 'shock'],
        ['kazoo', '¡¿COQUI?!', 'shock'],
        ['kazoo', 'Coqui. Mi compa de toda la vida. Tres años adentro...', 'sad'],
        ['kazoo', '...y el primer mensaje que me manda ya me está regañando.', 'happy'],
        ['kazoo', 'A las diez. Fácil. Nomás no me duermo tarde.', 'normal'],
      ]);
      yield* say('narrator', 'Se durmió a las 4:37 AM viendo videos de gente arreglando Tsurus.', 'normal');
      yield* fadeOut(1);
      G.forceDark = undefined;
      setDay(-20); setClock(9, 15);
      unlockZone('afueras');
      lock(false);
      yield* fadeIn(0.5);
    },
  },
];

function* waitAviso() {
  const r = R();
  const act = r.actions.find((a) => a.label === 'Leer aviso');
  if (act) act.fn = () => { G.state.flags.readAviso = true; act.disabled = true; };
  yield* until(() => G.state.flags.readAviso);
  yield* talk([
    ['narrator', 'AVISO DE DESALOJO: "Sr. Kazoo: debe 3 meses de renta. Tiene 30 días o sus cosas se van a la banqueta. — La administración."', 'normal', { name: 'EL PAPEL' }],
    ['narrator', '"PD: el pato de hule también."', 'normal', { name: 'EL PAPEL' }],
    ['kazoo', 'Yo no tengo pato de hule.', 'think'],
    ['kazoo', '...Todavía.', 'smug'],
  ]);
}
