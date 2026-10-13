// PRÓLOGO — "Cinco Estrellas" (Día -21)
import { G, setScene } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { input } from '../../core/input.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, cutscene, lock, objective, toast, chat, notify, setClock, setDay, addMoney, trust, flag, goTo, music, pedTo, walkPlayer } from '../script.js';
import { P, C, R, S, line, lines, ally, unlockZone, cityAt, roomAt, autoWalk, dumb } from './common.js';
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
        ['kazoo', 'Una almohada con forma de pan. Debo cincuenta mil pesos y me compro un pan que no se come.', 'sad'],
        ['kazoo', 'Eso, Kazoo. Pinche genio financiero.', 'smug'],
      ]);
      lock(false);
      hint(isTouch() ? 'Muévete con el joystick. Botón A para interactuar.' : 'Muévete con WASD o flechas. E para interactuar.');
      objective('Lee el papel pegado en la puerta');
      yield* waitAviso();
      objective('');
      // scripts don't run while the phone is up, so watch the open counter instead of phone.open
      const opens = G.phone.opens;
      chat('mari', 'Mijo, ¿vienes a trabajar hoy o ya te doy por muerto?');
      yield* wait(1);
      hint(isTouch() ? 'Abre tu teléfono con el botón 📱' : 'Abre tu teléfono con TAB o T');
      objective('Revisa tu teléfono');
      yield* until(() => G.phone.opens > opens || G.bigmap.open, 20);
      yield* until(() => !G.phone.open && !G.bigmap.open);
      yield* say('kazoo', 'Doña Mari. Si no llego me corre, y si me corre me toca vivir en la banqueta. Que según el aviso ya es mi dirección del mes que entra.', 'sad');
      objective('Sal a la calle y ve a Tacos El Compa');
      yield* until(() => G.scene === C());
      hint('Sigue la letra M en el radar. Las letras marcan la historia.');
    },
    onRoomExit(exit) { if (!S().flags.readAviso) { toast('Primero lee el aviso de la puerta', '#f4f4f0', 2); return true; } return false; },
  },
  {
    id: 'p_repartos', chapter: 0, title: 'Tacos fríos', requires: ['p_intro'],
    trigger: { door: 'taqueria', letter: 'M', color: '#f07aa8', label: 'TACOS EL COMPA' },
    rating: () => ({ by: 'Doña Mari', stars: 4, text: 'Llegaste tarde, pero llegaste vivo.' }),
    *run(ctx) {
      lock(true);
      roomAt('taqueria', 40);
      const r = R();
      const mari = r.addNpc({ id: 'mari', look: 'mari', x: 246, facing: -1 });
      r.addNpc({ look: 5, x: 50, facing: 1, pose: 'sit', y: FLOOR - 2 });
      r.addNpc({ look: 9, x: 118, facing: -1, pose: 'sit', y: FLOOR - 2 });
      void mari;
      yield* wait(0.5);
      yield* talk([
        ['mari', '¡Mira nomás quién resucitó! Son las nueve y media, Kazoo.', 'angry'],
        ['kazoo', 'Buenos días, Doña Mari. Hoy amaneció más guapa.', 'happy'],
        ['mari', 'Y tú amaneciste más tarde. Como siempre.', 'serious'],
        ['mari', 'Vinieron a buscarte dos señores de traje. De los del Jefe.', 'serious'],
        ['kazoo', '...¿Los del Jefe? ¿Y qué les dijo?', 'shock'],
        ['mari', 'Que no te había visto. Que seguro andabas muerto en una zanja.', 'normal'],
        ['mari', 'No me creyeron. Dijeron que si estuvieras muerto, el Jefe ya lo sabría.', 'serious'],
        ['kazoo', 'Qué reconfortante.', 'sad'],
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
        if (i === 0) yield* line('kazoo', 'Uno menos. Faltan dos pedidos y cincuenta mil pesos. Prioridades.', 'normal');
        if (i === 1) yield* line('kazoo', '¿Quién chingados pide tacos a las diez de la mañana? ...Bueno, yo.', 'think');
      }
      objective('Regresa a la taquería');
      yield* goTo(tq.x, tq.y + 10, { r: 20 });
      // ---- El Jefe's men: they don't ask, they invite
      lock(true);
      if (c.player.car) c.exitCar(true);
      const p = c.player;
      c.teleport(tq.x, tq.y + 14, Math.PI / 2);
      const g1 = c.spawnPed('guarura', tq.x - 70, tq.y + 26, { state: 'idle', mission: true });
      const g2 = c.spawnPed('guarura', tq.x - 84, tq.y + 38, { state: 'idle', mission: true });
      const car = c.spawnVehicle('sedan', tq.x - 60, tq.y + 52, 0, { mission: true, color: '#101014' });
      car.noEnter = true;
      UI.letterboxTarget = 1;
      c.camTarget = { x: tq.x - 30, y: tq.y + 24 };
      music('tension');
      yield* pedTo(g1, tq.x - 14, tq.y + 18, 34);
      g1.a = 0; p.a = Math.PI;
      yield* talk([
        ['guarura', 'Kazoo. Súbete al carro.', 'serious'],
        ['kazoo', '¿A dónde?', 'shock'],
        ['guarura', 'El Jefe te quiere ver.', 'serious'],
        ['kazoo', 'Ah, qué bien, justo hoy tenía la agenda libre. ...¿Me van a matar?', 'shock'],
        ['guarura', 'Hoy no.', 'serious'],
      ]);
      yield* fadeOut(0.6);
      c.removePed(g1); c.removePed(g2); c.removeVehicle(car);
      c.camTarget = null;
      // ---- the office: a chair turned away, a window burning behind it
      roomAt('donchuy', 40);
      const rj = R();
      rj.noExit = true;
      G.story.jefeRoom(rj);
      yield* fadeIn(0.8);
      yield* walkPlayer(196, 40);
      yield* wait(0.8);
      yield* talk([
        ['donchuy', 'Kazoo.', 'serious'],
        ['kazoo', 'Jefe. Qué... qué gusto. ¿Cómo está la familia?', 'shock'],
        ['donchuy', 'Viva. La tuya también. Por ahora.', 'serious'],
        ['donchuy', 'Cincuenta mil pesos. Te los presté para tu changarro. ¿Cómo se llamaba?', 'serious'],
        ['kazoo', '"Kazoo\'s Tacos Gourmet".', 'sad'],
        ['donchuy', 'Nueve días. Te presté para un negocio y me devolviste un chiste.', 'serious'],
        ['kazoo', 'Es que Puerto Vicio no estaba listo para el taco de mango con queso de cabra.', 'normal'],
        ['donchuy', 'Nadie está listo para un taco de ciento ochenta pesos. Ni yo, y yo vendo cosas mucho peores.', 'serious'],
        ['donchuy', 'Veintiún días. No me importa de dónde lo saques. Me importa que lo traigas.', 'serious'],
      ]);
      const c1 = yield* ask('kazoo', '(¿Qué le dices a una silla?)', ['"¿Y si le pago en tacos? Me sobraron como 400."', '"Se lo voy a pagar, Jefe. Se lo juro."', '"¿Acepta pagos a meses sin intereses?"']);
      if (c1 === 0) yield* talk([['kazoo', '¿Y si le pago en tacos? Me sobraron como cuatrocientos. Congelados. Casi nuevos.', 'happy'], ['narrator', 'Silencio. Uno de los guaruras se truena el cuello. El otro se ríe. Nadie más se ríe.', 'normal'], ['donchuy', 'Veintiún días, Kazoo.', 'serious']]);
      if (c1 === 1) yield* talk([['kazoo', 'Se lo voy a pagar, Jefe. Se lo juro por mi madre.', 'serious'], ['donchuy', 'Tu madre no me debe nada. Jura por algo que te pueda quitar.', 'serious']]);
      if (c1 === 2) { yield* talk([['kazoo', '¿Acepta pagos a meses sin intereses?', 'normal'], ['donchuy', 'Acepto pagos a meses. Con intereses. Los intereses son tus dedos. Uno por semana.', 'serious']]); dumb(); }
      audio.sfx('punch', { vol: 0.4 });
      yield* say('donchuy', 'Ya vete. Y Kazoo... la próxima vez que te mande traer, ojalá sea para darte las gracias.', 'serious');
      yield* fadeOut(0.6);
      cityAt(tq, 14);
      UI.letterboxTarget = 0;
      music(null);
      yield* fadeIn(0.6);
      yield* say('kazoo', '...Veintiún días.', 'sad');
      lock(false);
      addMoney(60);
      if (c.vehicles.includes(moto)) { moto.mission = false; moto.keep = true; }
    },
  },
  {
    id: 'p_noche', chapter: 0, title: 'Un mensaje', requires: ['p_repartos'], silent: false,
    rating: () => ({ by: 'Tu almohada de pan', stars: 5, text: 'Suave. Huele a bolillo y a deudas.' }),
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
        ['kazoo', 'Y un señor sin cara que sabe dónde vivo.', 'sad'],
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
        ['kazoo', 'Coqui. Mi compa de toda la vida. Tres años adentro por culpa de un soplón...', 'sad'],
        ['kazoo', '...y el primer mensaje que me manda ya viene regañándome.', 'happy'],
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
