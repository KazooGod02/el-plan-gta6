// CAPÍTULO 2 — "La Última Risa" (Día -17)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, goTo } from '../script.js';
import { P, C, R, S, line, lines, ally, unlockZone, cityAt, roomAt } from './common.js';
import { play } from '../../minigames/index.js';
import { FLOOR } from '../../interior/rooms.js';
import { dist } from '../../core/util.js';

export const CAP2 = [
  {
    id: 'c2_bar', chapter: 2, chapterStart: true, title: 'La Última Risa', requires: ['c1_tuercas'], customRooms: true,
    rating: () => ({ by: 'Ghenghis', stars: 5, text: '¡Nadie me había ganado! Jajaja.' }),
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
        ['coqui', 'Estuve pensando. Necesitamos dinero. Mucho. Tú le debes 50 mil a Don Chuy, y yo no tengo ni para unos tenis.', 'normal'],
        ['kazoo', '...¿Cómo sabes lo de Don Chuy?', 'shock'],
        ['coqui', 'Tienes el aviso de desalojo pegado en la puerta, Kazoo. Y 14 llamadas perdidas de "NO CONTESTAR (CHUY)".', 'smug'],
        ['coqui', 'El Banco Federal.', 'serious'],
        ['kazoo', '¿EL BANCO FEDERAL? ¿Estás loco?', 'shock'],
        ['coqui', 'Estoy quebrado. Se parece mucho.', 'serious'],
        ['coqui', 'Pero necesitamos a alguien que conozca el banco por dentro. Los guardias, las cámaras, los horarios.', 'think'],
        ['kazoo', '...Conozco a alguien. Ghenghis. Era guardia ahí. Lo corrieron.', 'think'],
        ['coqui', '¿Por qué lo corrieron?', 'serious'],
        ['kazoo', 'Se quedó dormido en la caseta. Él dice que estaba meditando.', 'normal'],
        ['coqui', '...¿Es de confianza?', 'serious'],
        ['kazoo', 'Es de confianza. Está medio loco. Pero de confianza.', 'happy'],
        ['coqui', '¿Dónde lo encontramos?', 'normal'],
        ['kazoo', 'En La Última Risa. El bar de El Centro. Prácticamente vive ahí.', 'normal'],
      ]);
      r.removeNpc(co);
      lock(false);
      objective('Ve con Coqui al bar La Última Risa (El Centro)');
      yield* until(() => G.scene === C());
      const c = C();
      const p = c.pos();
      const coqui = ally('coqui', p.x + 12, p.y + 4, 'COQUI');
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
      const gh = rb.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 70, facing: -1, pose: 'idle' });
      rb.addNpc({ look: 11, x: 440, facing: 1 }); rb.addNpc({ look: 21, x: 480, facing: -1, pose: 'sit', y: FLOOR - 2 });
      yield* fadeIn(0.4);
      yield* walkNpc(cq, 30, 40);
      yield* talk([
        ['narrator', 'En la maquinita de Kazoo Kart, alguien se ríe solo. Muy fuerte.', 'normal'],
        ['kazoo', '¡Ghenghis!', 'happy'],
        ['ghenghis', '¡KAZOO! ¡Mi compa! ¿Vienes a perder otra vez? ¡Jajaja!', 'laugh'],
        ['coqui', 'Venimos a hablar de negocios.', 'serious'],
        ['ghenghis', '¿Y este quién es? ¿Tu contador? ¿Tu papá? ¿Tu contador-papá?', 'crazy'],
        ['kazoo', 'Es Coqui.', 'normal'],
        ['ghenghis', '¡El famoso Coqui! ¡El que cayó! ¡JAJAJA!', 'laugh'],
        ['coqui', '...', 'angry'],
        ['kazoo', 'Wey...', 'sad'],
        ['ghenghis', 'Ya, ya. Perdón. Me río de todo. Es una condición. Mi doctor dice que es "nervios". Yo digo que es talento.', 'happy'],
        ['ghenghis', 'Si quieren hablar, primero me ganan en Kazoo Kart. Mi récord: 3,000. Nadie me gana. NADIE.', 'crazy'],
        ['coqui', 'No tenemos tiempo para...', 'angry'],
        ['kazoo', 'Yo le gano.', 'smug'],
      ]);
      let target = 3000, tries = 0;
      while (true) {
        const score = yield* play('kart', { target, time: 50 });
        if (score >= target) break;
        tries++;
        if (tries === 1) yield* say('ghenghis', '¡JAJAJA! ¡Otra, otra! Me encanta verte perder.', 'laugh');
        else { target = 2000; yield* say('ghenghis', 'Ándale, te la dejo en 2,000. Me das lástima. Jajaja.', 'happy'); }
      }
      yield* talk([
        ['ghenghis', '...', 'shock'],
        ['ghenghis', 'Nadie me había ganado. Nunca.', 'shock'],
        ['ghenghis', '¡JAJAJA! ¡Me caes bien, Kazoo! Siempre me has caído bien. Pero ahorita más.', 'laugh'],
        ['coqui', 'Queremos el Banco Federal.', 'serious'],
        ['ghenghis', '¿Robar el Banco Federal? Jajaja. Wey, nos van a agarrar.', 'laugh'],
        ['coqui', '¿Entonces no?', 'serious'],
        ['ghenghis', 'No, sí. Nomás digo que nos van a agarrar. De todos modos esto iba a pasar algún día.', 'normal'],
        ['kazoo', '¿Qué cosa?', 'think'],
        ['ghenghis', 'Todo, wey. Todo.', 'serious'],
      ]);
      lock(false);
    },
  },
  {
    id: 'c2_pelea', chapter: 2, title: 'Tres caídas', requires: ['c2_bar'], customRooms: true, lockRoom: true, failPlace: 'bar',
    rating: () => ({ by: 'El Cantinero', stars: 3, text: 'Rompieron dos sillas. Las cobro.' }),
    *run(ctx) {
      lock(true);
      if (G.scene !== R() || R().roomId !== 'bar') { roomAt('bar', 60); }
      const r = R();
      r.room.music = 'bar';
      r.npcs = r.npcs.filter((n) => n.id !== 'ghenghis' && n.id !== 'coqui' && n.id !== 'kazoo');
      if (!r.npc('cantinero')) r.addNpc({ id: 'cantinero', look: 'bartender', x: 320, facing: -1 });
      r.p.x = 90; r.p.facing = -1;
      const cq = r.addNpc({ id: 'coqui', look: 'coqui', x: 40, facing: 1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 64, facing: 1 });
      audio.sfx('door');
      const thugs = [];
      for (let i = 0; i < 4; i++) thugs.push(r.addNpc({ look: 'thug', x: 180 + i * 18, facing: -1 }));
      music('tension');
      yield* talk([
        ['thug', '¡KAZOO! ¡Te estábamos buscando!', 'angry', { name: 'MALANDRO' }],
        ['kazoo', '¡Hola! ...¿Quién eres?', 'shock'],
        ['thug', '¡La apuesta del fut, wey! ¡La del América! ¡Cinco mil!', 'angry', { name: 'MALANDRO' }],
        ['kazoo', '...Ah. Esa apuesta.', 'sad'],
        ['coqui', '¿Apostaste cinco mil pesos que no tienes?', 'angry'],
        ['kazoo', '¡El América iba ganando! ¡Hasta el minuto 94!', 'sad'],
        ['ghenghis', '...Jejeje. Déjamelos a mí.', 'crazy'],
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
      toast('Juegas como GHENGHIS. B (Espacio) = golpe', '#e0504a', 4);
      objective('Dale una lección a los malandros');
      music('heist');
      yield* until(() => r.enemies.every((e) => e.state === 'down'));
      lock(true);
      r.combat = false;
      S().weapon = prevW === 'fists' ? 'fists' : prevW;
      music('bar');
      yield* wait(0.8);
      yield* talk([
        ['ghenghis', '¡JAJAJA! ¿Vieron eso? ¡Ni sudé!', 'laugh'],
        ['coqui', '...Está bien. Estás adentro.', 'serious'],
        ['ghenghis', '¡Sí! ¡Equipo!', 'happy'],
      ]);
      // the finger-gun seed
      const ghN = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: r.p.x, facing: -1 });
      r.p.look = 'kazoo'; r.p.x = kz.x; r.removeNpc(kz);
      ghN.pose = 'aim'; ghN.facing = Math.sign(r.p.x - ghN.x) || -1;
      yield* say('ghenghis', 'Y tú, Kazoo... ¡bang! ¡Jajaja!', 'crazy');
      yield* talk([
        ['kazoo', '...No me apuntes, wey. Ni de broma.', 'serious'],
        ['ghenghis', '¡Jajaja! Relájate, es de dedo.', 'laugh'],
        ['kazoo', 'Aun así.', 'serious'],
      ]);
      ghN.pose = null;
      lock(false);
    },
  },
  {
    id: 'c2_banco', chapter: 2, title: 'Visita guiada', requires: ['c2_pelea'], customRooms: true,
    rating: () => ({ by: 'Coqui', stars: 4, text: 'Por fin tenemos equipo.' }),
    *run(ctx) {
      lock(true);
      const c = C(), bar = P().bar;
      yield* fadeOut(0.4);
      cityAt(bar, 14);
      const v = c.spawnVehicle('sedan', bar.x + 30, bar.y + 36, 0, { mission: true, color: '#1a1a2e' });
      v.keep = true; v.label = 'CARRO';
      const coqui = ally('coqui', bar.x - 12, bar.y + 16, 'COQUI');
      const gh = ally('ghenghis', bar.x + 12, bar.y + 16, 'GHENGHIS');
      yield* fadeIn(0.4);
      yield* say('ghenghis', 'Vamos a darles el tour. Súbanse. Yo les enseño el banco... desde afuera. Adentro ya no me dejan entrar.', 'laugh');
      lock(false);
      objective('Sube a los dos al carro');
      yield* until(() => c.player.car && c.player.car.passengers.includes(coqui) && c.player.car.passengers.includes(gh));
      v.label = null;
      objective('Pasa despacio frente al Banco Federal');
      const bk = P().banco;
      yield* goTo(bk.x, bk.y + 40, { r: 40, needCar: true, label: 'BANCO FEDERAL' });
      yield* lines([
        ['ghenghis', 'Ahí está. El Banco Federal. Mi ex. Jajaja.', 'laugh'],
        ['ghenghis', 'El último viernes del mes, la bóveda guarda la lana de los blindados. Mucha lana.', 'serious'],
        ['ghenghis', 'Tres guardias. Seis cámaras. La cámara cuatro está chueca desde que la acomodé con el hombro.', 'normal'],
        ['coqui', '¿Con el hombro?', 'think'],
        ['ghenghis', 'Me estaba estirando.', 'happy'],
        ['coqui', 'Eso nos deja un punto ciego.', 'serious'],
        ['ghenghis', 'Y la puerta de la bóveda... taladro industrial. Unos quince minutos.', 'normal'],
        ['coqui', 'Necesitamos máscaras. Armas. Un taladro. Y un carro.', 'think'],
        ['kazoo', '¡Yo me encargo del carro!', 'happy'],
        ['coqui', '...No. Tú no.', 'serious'],
        ['kazoo', '¡Oye!', 'angry'],
        ['ghenghis', '¡JAJAJA!', 'laugh'],
      ]);
      objective('Deja a Ghenghis en su casa (La Colonia)');
      const home = { x: 44 * 16, y: 91 * 16 + 8 };
      yield* goTo(home.x, home.y, { r: 30, needCar: true, label: 'CASA DE GHENGHIS' });
      lock(true);
      yield* lines([
        ['coqui', 'En tres días. En El Puerto. Hay un taller abandonado. Ahí nos vemos.', 'serious'],
        ['ghenghis', 'Un taller abandonado. Qué romántico. Jajaja. Ahí estaré.', 'laugh'],
      ]);
      const car = c.player.car;
      if (car) { const i = car.passengers.indexOf(gh); if (i >= 0) car.passengers.splice(i, 1); }
      c.removePed(gh);
      lock(false);
      yield* fadeOut(0.8);
      setDay(-14); setClock(9, 30);
      if (car) { const i = car.passengers.indexOf(coqui); if (i >= 0) car.passengers.splice(i, 1); }
      c.removePed(coqui);
      unlockZone('puerto');
      yield* wait(0.4);
    },
  },
];
