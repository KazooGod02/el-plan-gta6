// CAPÍTULO 2 — "La Última Risa" (Día -17)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, goTo } from '../script.js';
import { P, C, R, S, line, lines, ally, unlockZone, cityAt, roomAt, talkAlong, finishTalk, RUTA3, RUTA3_CARRETERA } from './common.js';
import { play } from '../../minigames/index.js';
import { FLOOR } from '../../interior/rooms.js';
import { TS } from '../../world/map.js';

export const CAP2 = [
  {
    id: 'c2_bar', chapter: 2, chapterStart: true, title: 'La Última Risa', requires: ['c1_tuercas'], customRooms: true,
    rating: () => ({ by: 'Ghenghis', stars: 5, text: 'Nadie me había ganado. Te voy a cobrar eso algún día.' }),
    onDoor(d) { if (d.room === 'bar') return false; return false; },
    *run(ctx) {
      lock(true);
      setDay(-17); setClock(8, 40);
      roomAt('cuarto', 120);
      G.story.populateRoom('cuarto');
      const r = R();
      const co = r.addNpc({ look: 'coqui', x: 200, facing: -1, pose: 'sit', y: FLOOR - 4 });
      r.props.push({ t: 'papel', x: 188, y: 98 }, { t: 'papel', x: 214, y: 92 });
      yield* fadeIn(0.5);
      yield* talk([
        ['kazoo', '¿Dormiste algo?', 'think'],
        ['coqui', 'Desde las cinco estoy despierto. Tres años levantándome a las cinco. El cuerpo no olvida.', 'serious'],
        ['coqui', 'Estuve pensando. Necesitamos lana. Mucha. Tú le debes cincuenta mil al Jefe, y yo no tengo ni para unos calzones.', 'normal'],
        ['kazoo', '...¿Cómo sabes lo del Jefe?', 'shock'],
        ['coqui', 'Tienes un aviso de desalojo en la puerta y catorce llamadas perdidas de "NO CONTESTAR (JEFE)". Y anoche un carro negro se estacionó enfrente dos horas.', 'smug'],
        ['kazoo', '...¿Dos horas?', 'shock'],
        ['coqui', 'Dos horas y diez minutos. Las conté.', 'serious'],
        ['coqui', 'El Banco Federal.', 'serious'],
        ['kazoo', '¿EL BANCO FEDERAL? ¿Estás pendejo?', 'shock'],
        ['coqui', 'Estoy quebrado. Se parece mucho.', 'serious'],
        ['coqui', 'Pero necesitamos a alguien que conozca el banco por dentro. Guardias, cámaras, horarios.', 'think'],
        ['kazoo', '...Conozco a alguien. Ghenghis. Era guardia ahí. Lo corrieron.', 'think'],
        ['coqui', '¿Por qué lo corrieron?', 'serious'],
        ['kazoo', 'Lo encontraron dormido en la caseta. Él dice que estaba meditando.', 'normal'],
        ['coqui', '...¿Es de confianza?', 'serious'],
        ['kazoo', 'Está medio loco. Pero de confianza.', 'happy'],
        ['coqui', 'Eso mismo decía yo del Tuercas.', 'serious'],
        ['kazoo', '...', 'sad'],
        ['coqui', '¿Dónde lo encontramos?', 'normal'],
        ['kazoo', 'En La Última Risa, el bar de El Centro. Prácticamente vive ahí. Le deberían cobrar renta.', 'normal'],
      ]);
      r.removeNpc(co);
      lock(false);
      objective('Ve con Kuiss al bar La Última Risa (El Centro)');
      yield* until(() => G.scene === C());
      const c = C();
      const p = c.pos();
      const coqui = ally('coqui', p.x + 12, p.y + 4, 'KUISS');
      const bar = P().bar;
      yield* goTo(bar.x, bar.y, { label: 'LA ÚLTIMA RISA', r: 16, check: () => {} });
      if (c.player.car) c.exitCar(true);
      lock(true);
      yield* fadeOut(0.4);
      c.removePed(coqui);
      setClock(21, 10);
      roomAt('bar', 40);
      const rb = R();
      rb.room.music = 'bar';
      rb.addNpc({ id: 'cantinero', look: 'bartender', x: 320, facing: -1 });
      const cq = rb.addNpc({ id: 'coqui', look: 'coqui', x: 24, facing: 1 });
      rb.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 70, facing: -1, pose: 'idle' });
      rb.addNpc({ look: 11, x: 440, facing: 1 }); rb.addNpc({ look: 21, x: 480, facing: -1, pose: 'sit', y: FLOOR - 2 });
      yield* fadeIn(0.4);
      yield* walkNpc(cq, 30, 40);
      yield* talk([
        ['narrator', 'En la maquinita de Kazoo Kart, alguien se ríe solo. Muy fuerte. Nadie se le acerca.', 'normal'],
        ['kazoo', '¡Ghenghis!', 'happy'],
        ['ghenghis', '¡KAZOO! ¿Vienes a perder otra vez? Jajaja.', 'laugh'],
        ['coqui', 'Venimos a hablar de negocios.', 'serious'],
        ['ghenghis', '¿Y este quién es? ¿Tu contador? ¿Tu papá? ¿Tu agente de libertad condicional?', 'crazy'],
        ['kazoo', 'Es Kuiss.', 'normal'],
        ['ghenghis', '¡El famoso Kuiss! ¡El que cayó porque su socio lo vendió! ¡JAJAJA!', 'laugh'],
        ['coqui', '...', 'angry'],
        ['kazoo', 'Wey...', 'sad'],
        ['ghenghis', 'Ya, ya. Perdón. Me río de todo. Mi doctor dice que son nervios. Yo digo que la vida es un chiste y nadie más se ríe.', 'happy'],
        ['ghenghis', '¿Quieren hablar? Primero me ganan en Kazoo Kart. Mi récord: 3,000. Nadie me gana.', 'crazy'],
        ['coqui', 'No tenemos tiempo para pendejadas.', 'angry'],
        ['kazoo', 'Yo le gano.', 'smug'],
      ]);
      let target = 3000, tries = 0;
      while (true) {
        const score = yield* play('kart', { target, time: 50 });
        if (score >= target) break;
        tries++;
        if (tries === 1) yield* say('ghenghis', '¡JAJAJA! ¡Otra! Verte perder es como ver un choque en cámara lenta.', 'laugh');
        else { target = 2000; yield* say('ghenghis', 'Ándale, te la dejo en 2,000. Me das lástima. Y yo no le tengo lástima a nadie.', 'happy'); }
      }
      yield* talk([
        ['ghenghis', '...', 'shock'],
        ['ghenghis', 'Nadie me había ganado. Nunca.', 'shock'],
        ['ghenghis', 'Jajaja. Me caes bien, Kazoo. Siempre me has caído bien. Algún día eso te va a salir caro.', 'laugh'],
        ['coqui', 'Queremos el Banco Federal.', 'serious'],
        ['ghenghis', '¿El Federal? Jajaja. Wey, nos van a agarrar.', 'laugh'],
        ['coqui', '¿Entonces no?', 'serious'],
        ['ghenghis', 'No, sí. Nomás digo que nos van a agarrar. De todos modos esto iba a pasar algún día.', 'normal'],
        ['kazoo', '¿Qué cosa?', 'think'],
        ['ghenghis', 'Todo, wey. Todo.', 'serious'],
        ['ghenghis', 'Pero antes de que me digan que sí, vamos a revisar el banco. Yo les enseño por dónde. Nadie roba lo que no ha visto.', 'serious'],
        ['coqui', '...Por fin alguien que piensa.', 'normal'],
      ]);
      lock(false);
    },
  },
  {
    id: 'c2_pelea', chapter: 2, title: 'Tres caídas', requires: ['c2_bar'], customRooms: true, lockRoom: true, failPlace: 'bar',
    rating: () => ({ by: 'El Cantinero', stars: 3, text: 'Rompieron dos sillas y un diente. Las sillas las cobro.' }),
    *run(ctx) {
      lock(true);
      if (G.scene !== R() || R().roomId !== 'bar') { roomAt('bar', 60); }
      const r = R();
      r.room.music = 'bar';
      r.npcs = r.npcs.filter((n) => n.id !== 'ghenghis' && n.id !== 'coqui' && n.id !== 'kazoo');
      if (!r.npc('cantinero')) r.addNpc({ id: 'cantinero', look: 'bartender', x: 320, facing: -1 });
      r.p.x = 90; r.p.facing = -1;
      r.addNpc({ id: 'coqui', look: 'coqui', x: 40, facing: 1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 64, facing: 1 });
      audio.sfx('door');
      const thugs = [];
      for (let i = 0; i < 4; i++) thugs.push(r.addNpc({ look: 'thug', x: 180 + i * 18, facing: -1 }));
      music('tension');
      yield* talk([
        ['thug', '¡KAZOO! ¡Te andábamos buscando, cabrón!', 'angry', { name: 'MALANDRO' }],
        ['kazoo', '¡Hola! ...¿Quién eres?', 'shock'],
        ['thug', '¡La apuesta del fut, pendejo! ¡La del América! ¡Cinco mil!', 'angry', { name: 'MALANDRO' }],
        ['kazoo', '...Ah. Esa apuesta.', 'sad'],
        ['coqui', '¿Apostaste cinco mil pesos que no tienes? ¿Debiéndole al Jefe?', 'angry'],
        ['kazoo', '¡El América iba ganando! ¡Hasta el minuto 94!', 'sad'],
        ['ghenghis', '...Jejeje. Déjenmelos a mí.', 'crazy'],
      ]);
      // switch to Ghenghis
      for (const t of thugs) r.removeNpc(t);
      r.removeNpc(gh);
      const kz = r.addNpc({ id: 'kazoo', look: 'kazoo', x: r.p.x - 20, facing: 1 });
      r.p.look = 'ghenghis'; r.p.x = 110; r.p.facing = 1; r.p.hp = 100;
      r.combat = true;
      const prevW = S().weapon; S().weapon = 'fists';
      for (let i = 0; i < 4; i++) r.addEnemy({ look: 'thug', x: 190 + i * 28, facing: -1, hp: 32, armed: false, speed: 34 + i * 3, dmg: 7, state: 'attack', vision: 400 });
      lock(false);
      toast('Juegas como GHENGHIS. {B} = golpe', '#e0504a', 4);
      objective('Dale una lección a los malandros');
      music('heist');
      yield* until(() => r.enemies.every((e) => e.state === 'down'));
      lock(true);
      r.combat = false;
      S().weapon = prevW === 'fists' ? 'fists' : prevW;
      music('bar');
      yield* wait(0.8);
      yield* talk([
        ['ghenghis', '¡JAJAJA! ¿Vieron? ¡Ni sudé!', 'laugh'],
        ['coqui', '...Está bien. Estás adentro.', 'serious'],
        ['ghenghis', 'Equipo. Qué bonito. Ya nomás falta ver quién traiciona a quién. Jajaja.', 'happy'],
        ['coqui', 'No es chistoso.', 'serious'],
      ]);
      // the finger-gun seed
      const ghN = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: r.p.x, facing: -1 });
      r.p.look = 'kazoo'; r.p.x = kz.x; r.removeNpc(kz);
      ghN.pose = 'aim'; ghN.facing = Math.sign(r.p.x - ghN.x) || -1;
      yield* say('ghenghis', 'Y tú, Kazoo... ¡bang! Jajaja.', 'crazy');
      yield* talk([
        ['kazoo', '...No me apuntes, wey. Ni de broma.', 'serious'],
        ['ghenghis', 'Relájate, es de dedo. Todavía.', 'laugh'],
        ['kazoo', 'Aun así.', 'serious'],
      ]);
      ghN.pose = null;
      lock(false);
    },
  },
  {
    id: 'c2_banco', chapter: 2, title: 'Visita guiada', requires: ['c2_pelea'], customRooms: true,
    rating: () => ({ by: 'Kuiss', stars: 4, text: 'Ruta tres. Ahora sí tenemos por dónde correr.' }),
    *run(ctx) {
      lock(true);
      const c = C(), bar = P().bar;
      yield* fadeOut(0.4);
      cityAt(bar, 14);
      const v = c.spawnVehicle('sedan', bar.x + 30, bar.y + 36, 0, { mission: true, color: '#1a1a2e' });
      v.keep = true; v.label = 'CARRO';
      const coqui = ally('coqui', bar.x - 12, bar.y + 16, 'KUISS');
      const gh = ally('ghenghis', bar.x + 12, bar.y + 16, 'GHENGHIS');
      yield* fadeIn(0.4);
      yield* say('ghenghis', 'Súbanse. Les enseño el banco... desde afuera. Adentro ya no me dejan entrar. Ni a sacar dinero.', 'laugh');
      lock(false);
      const both = () => c.player.car && c.player.car.passengers.includes(coqui) && c.player.car.passengers.includes(gh);
      // only touch the objective when it changes, or it would blink forever
      const setObj = (t) => { if (UI.objective !== t) objective(t); };
      const keepBoth = (goal) => () => setObj(both() ? goal : 'Sube a los dos al carro');
      objective('Sube a los dos al carro');
      yield* until(both);
      v.label = null;
      objective('Pasa despacio frente al Banco Federal');
      const bk = P().banco;
      // Ghenghis starts the tour on the way; arriving early just waits for him to finish
      const tour = talkAlong([
        ['ghenghis', 'El Banco Federal. Mi ex. Me dejó por quedarme dormido.', 'laugh'],
        ['ghenghis', 'El último viernes del mes la bóveda guarda la lana de los blindados. Mucha lana.', 'serious'],
        ['ghenghis', 'Tres guardias. Seis cámaras. La cuatro está chueca desde que la acomodé con el hombro.', 'normal'],
        ['coqui', '¿Con el hombro?', 'think'],
        ['ghenghis', 'Me estaba estirando.', 'happy'],
        ['coqui', 'Eso nos deja un punto ciego.', 'serious'],
        ['ghenghis', 'Y la puerta de la bóveda... taladro industrial. Unos quince minutos, si nadie la caga.', 'normal'],
        ['coqui', 'Necesitamos máscaras. Armas. Un taladro. Y un carro.', 'think'],
        ['kazoo', 'Yo me encargo del carro.', 'happy'],
        ['coqui', 'No. Tú no.', 'serious'],
        ['kazoo', '¿Por qué no?', 'angry'],
        ['coqui', 'Porque te conozco.', 'serious'],
        ['ghenghis', 'JAJAJA.', 'laugh'],
      ]);
      yield* goTo(bk.x, bk.y + 40, { r: 40, needCar: true, label: 'BANCO FEDERAL' });
      objective('Da una vuelta despacio por el banco');
      yield* finishTalk(tour);
      let pending = talkAlong([
        ['coqui', 'Ya vimos el banco. Ahora hay que trazar de una vez la ruta de escape. Si salimos de ahí con la lana, no va a haber tiempo de pensar.', 'serious'],
        ['coqui', 'Tengo tres opciones. Maneja. Yo te digo.', 'normal'],
      ]);
      // ---- the escape route: three options, Kuiss only likes the third one
      const routes = [
        { x: 84 * TS, y: 4 * TS + 8, label: 'RUTA 1', obj: 'Ruta 1: sal por el norte de El Centro', talk: [
          ['coqui', 'No. Esto es el Centro: semáforos, cámaras en cada esquina y la comandancia a cuatro cuadras.', 'serious'],
          ['ghenghis', 'Imagínate huir en el tráfico de las diez. Jajaja. Nos agarran sacando el boleto del estacionamiento.', 'laugh'],
          ['coqui', 'Siguiente.', 'serious'],
        ] },
        { x: P().gasolinera.x, y: P().gasolinera.y, label: 'RUTA 2', obj: 'Ruta 2: la carretera vieja, por la gasolinera', talk: [
          ['coqui', 'Tampoco. Carretera recta, abierta, sin dónde meterse. Nos ven desde un helicóptero a tres kilómetros.', 'serious'],
          ['kazoo', '¿Y si vamos bien rápido?', 'think'],
          ['coqui', '¿En qué? ¿En tu moto de cuatro punto ocho?', 'smug'],
          ['coqui', 'Hay un camino más. Pero ese se aprende desde la puerta del banco. Regrésate.', 'normal'],
        ] },
      ];
      for (const rt of routes) {
        objective(rt.obj);
        yield* goTo(rt.x, rt.y, { r: 34, needCar: true, label: rt.label, check: keepBoth(rt.obj) });
        yield* finishTalk(pending);
        pending = talkAlong(rt.talk);
      }
      // ---- route 3, checkpoint by checkpoint from the bank door: the same streets as the escape
      const OBJ3 = 'Ruta 3: sigue los puntos de control';
      objective('Regresa al Banco Federal: de ahí sale la ruta 3');
      yield* goTo(bk.x, bk.y + 40, { r: 40, needCar: true, label: 'BANCO FEDERAL', check: keepBoth('Regresa al Banco Federal: de ahí sale la ruta 3') });
      pending = talkAlong([['coqui', 'Ruta tres. Saliendo del banco, al revés: hacia el poniente. Nadie espera que huyas para el otro lado.', 'serious']], pending);
      const along = {
        1: [['coqui', 'Aquí, a la izquierda. Derecho al sur por toda la avenida, cruzando el canal.', 'normal'], ['ghenghis', '¿No es más rápido por el Centro?', 'think'], ['coqui', 'Más rápido para que nos agarren.', 'serious']],
        4: [['coqui', 'Y aquí, a la izquierda otra vez: la avenida de La Colonia.', 'normal']],
        5: [['coqui', 'Ahora zigzag: izquierda, derecha y de vuelta a la avenida. En línea recta te sigue cualquiera.', 'serious'], ['ghenghis', 'Como cuando huyo de mis deudas. Jajaja.', 'laugh']],
        9: [['ghenghis', '¿Y ese puente del fondo? Lleva como tres años en obra. Igualito que yo. Jajaja.', 'laugh'], ['coqui', 'Por ahí no se puede. Antes del puente, a la derecha: a la carretera vieja.', 'serious']],
        13: [['coqui', 'La carretera vieja. Cruzamos el canal y luego a la derecha, la terracería.', 'normal']],
      };
      const path = [...RUTA3, ...RUTA3_CARRETERA];
      for (let i = 0; i < path.length; i++) {
        objective(OBJ3);
        yield* goTo(path[i].x, path[i].y, { r: 30, needCar: true, label: 'RUTA 3', check: keepBoth(OBJ3) });
        audio.sfx('pickup');
        if (along[i]) pending = talkAlong(along[i], pending);
      }
      objective('Ruta 3: el camino de terracería de Las Afueras');
      const campo = P().campo;
      yield* goTo(campo.x, campo.y, { r: 30, needCar: true, label: 'RUTA 3', check: keepBoth('Ruta 3: el camino de terracería de Las Afueras') });
      yield* finishTalk(pending);
      lock(true);
      const car = c.player.car;
      if (car) { car.vx *= 0.2; car.vy *= 0.2; }
      UI.letterboxTarget = 1;
      c.camTarget = { x: P().arbol.x - 30, y: P().arbol.y - 10 };
      music('sad');
      yield* wait(1.2);
      yield* talk([
        ['coqui', 'Aquí.', 'serious'],
        ['coqui', 'Terracería, árboles, nadie. Un camino que ni la policía conoce. Si algo sale mal, aquí se pierde cualquiera.', 'serious'],
        ['ghenghis', '¿Y qué hay más allá?', 'think'],
        ['coqui', 'Nada. Por eso.', 'serious'],
        ['kazoo', 'Pa\' allá no hay nada... me gusta. Se parece a mi cuenta de banco.', 'smug'],
        ['coqui', 'Ruta tres. Apréndansela. Si nos separamos, por aquí. Nadie improvisa.', 'serious'],
        ['ghenghis', 'Nadie improvisa. Jajaja. Ya los quiero ver el día que todo se vaya a la verga.', 'laugh'],
      ]);
      S().flags.ruta = true;
      c.camTarget = null; UI.letterboxTarget = 0; music(null);
      lock(false);
      objective('Deja a Ghenghis en su casa (La Colonia)');
      const home = { x: 44 * 16, y: 91 * 16 + 8 };
      yield* goTo(home.x, home.y, { r: 30, needCar: true, label: 'CASA DE GHENGHIS', check: keepBoth('Deja a Ghenghis en su casa (La Colonia)') });
      lock(true);
      yield* lines([
        ['coqui', 'En tres días. En El Puerto hay un taller abandonado. Ahí nos vemos.', 'serious'],
        ['ghenghis', 'Un taller abandonado. Qué romántico. Si no llego, búsquenme en la cajuela de alguien. Jajaja.', 'laugh'],
      ]);
      const car2 = c.player.car;
      if (car2) { const i = car2.passengers.indexOf(gh); if (i >= 0) car2.passengers.splice(i, 1); }
      c.removePed(gh);
      lock(false);
      yield* fadeOut(0.8);
      setDay(-14); setClock(9, 30);
      if (car2) { const i = car2.passengers.indexOf(coqui); if (i >= 0) car2.passengers.splice(i, 1); }
      c.removePed(coqui);
      unlockZone('puerto');
      yield* wait(0.4);
    },
  },
];
