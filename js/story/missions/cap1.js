// CAPÍTULO 1 — "El Que Salió" (Día -20)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, pedTo, walkNpc, walkPlayer } from '../script.js';
import { P, C, R, S, line, lines, ally, unlockZone, cityAt, roomAt, mash } from './common.js';
import { dist } from '../../core/util.js';
import { FLOOR } from '../../interior/rooms.js';
import { TS } from '../../world/map.js';

export const CAP1 = [
  {
    id: 'c1_penal', chapter: 1, chapterStart: true, title: 'El que salió', requires: ['p_noche'],
    rating: () => ({ by: 'Coqui', stars: 2, text: 'Dos horas tarde. DOS.' }),
    *run(ctx) {
      lock(true);
      setDay(-20); setClock(9, 15);
      roomAt('cuarto', 90);
      G.story.populateRoom('cuarto');
      const r = R();
      r.p.pose = 'down';
      yield* fadeIn(0.6);
      audio.sfx('alarm', { vol: 0.5 });
      yield* wait(1);
      r.p.pose = null;
      yield* talk([
        ['kazoo', '...¿Qué hora es?', 'think'],
        ['kazoo', '¡¿LAS NUEVE Y QUINCE?!', 'shock'],
        ['kazoo', '¡Coqui sale a las diez! ¡El penal está hasta Las Afueras!', 'shock'],
      ]);
      lock(false);
      objective('Recoge a Coqui en el penal (Las Afueras)');
      yield* until(() => G.scene === C());
      const c = C(), pen = P().pension;
      let moto = c.vehicles.find((v) => v.type === 'moto' && !v.dead && dist(v.x, v.y, pen.x, pen.y) < 300);
      if (!moto) moto = c.spawnVehicle('moto', pen.x + 26, pen.y + 20, 0, { color: '#d8323c' });
      moto.label = 'TU MOTO'; moto.keep = true;
      // custom marker loop with breakdowns
      const gate = P().penal;
      const m = c.addMarker({ x: gate.x, y: gate.y - 10, r: 30, color: '#ffd23f', label: 'PENAL' });
      const d0 = dist(pen.x, pen.y, gate.x, gate.y);
      const breaks = [0.72, 0.45, 0.2];
      const lines1 = [
        ['kazoo', 'No, no, no, no... ¡ahorita no, bonita!', 'shock'],
        ['kazoo', '¡Cuatro punto ocho estrellas, wey! ¡CUATRO PUNTO OCHO!', 'angry'],
        ['kazoo', 'Voy a dejarle una reseña de tres. No, de tres y media. No soy un monstruo.', 'sad'],
      ];
      let k = 0;
      while (!m.inside) {
        yield;
        if (moto.label && c.player.car === moto) moto.label = null;
        const car = c.player.car;
        if (k < 3 && car === moto) {
          const p = c.pos();
          if (dist(p.x, p.y, gate.x, gate.y) < d0 * breaks[k]) {
            moto.engineOff = true; c.lockCar = true;
            audio.sfx('engine_die');
            yield* line(lines1[k][0], lines1[k][1], lines1[k][2]);
            toast('¡Se apagó! Presiona A (E) varias veces para patearla', '#ffd23f', 3);
            yield* mash(6, 'PATEANDO LA MOTO', () => audio.sfx('kick'));
            moto.engineOff = false; c.lockCar = false;
            audio.sfx('select');
            k++;
          }
        }
      }
      c.removeMarker(m);
      setClock(12, 5);
      lock(true);
      if (c.player.car) c.exitCar(true);
      c.teleport(gate.x, gate.y + 6, -Math.PI / 2);
      const coqui = ally('coqui', gate.x + 14, gate.y - 12, 'COQUI');
      coqui.state = 'idle'; coqui.noMoto = true; coqui.a = Math.PI / 2;
      UI.letterboxTarget = 1;
      c.camTarget = { x: gate.x + 6, y: gate.y - 4 };
      music('sad');
      yield* wait(0.8);
      yield* talk([
        ['coqui', 'Tres años adentro. Tres años contando los días.', 'serious'],
        ['coqui', 'Y lo primero que veo cuando salgo... es tu cara. Tarde.', 'angry'],
        ['kazoo', '¡Coqui! Wey, perdón, la moto se...', 'shock'],
        ['coqui', 'Dos horas, Kazoo. DOS HORAS. Le pregunté la hora al guardia tantas veces que me ofreció quedarme otra semana.', 'angry'],
        ['kazoo', 'La moto tenía 4.8 estrellas, wey. Era un riesgo calculado.', 'normal'],
        ['coqui', '...Sigues comprando cosas en el Marketplace.', 'serious'],
        ['kazoo', 'Sigo comprando cosas en el Marketplace.', 'smug'],
        ['coqui', '...', 'serious'],
        ['coqui', 'Te extrañé, pendejo.', 'happy'],
        ['kazoo', 'Yo también, wey. Un chingo.', 'happy'],
        ['coqui', '¿Y en eso vamos a regresar? Los dos arriba de esa cosa parecemos cartel de circo.', 'smug'],
        ['kazoo', 'Cabe uno y medio. Tú eres el medio.', 'happy'],
        ['coqui', 'Consigue un carro. Hay unos allá, en el estacionamiento de las visitas.', 'normal'],
        ['kazoo', '¿Robar un carro? ¿Afuera del penal? ¿El día que saliste?', 'shock'],
        ['coqui', '"Tomar prestado". Y no me veas a mí. Yo no toco nada hoy.', 'serious'],
      ]);
      c.camTarget = null; UI.letterboxTarget = 0; music(null);
      coqui.state = 'follow';
      const cars = [['sedan', '#6e6e82'], ['vocho', '#3c64dc'], ['pickup', '#8c5a32']].map(([t, col], i) => c.spawnVehicle(t, (30 + i * 5) * TS, 114 * TS, Math.PI / 2, { mission: true, color: col }));
      cars.forEach((v) => (v.keep = true));
      lock(false);
      objective('Consigue un carro para Coqui (no la moto)');
      let warned = false;
      yield* until(() => {
        const car = c.player.car;
        if (car && car.type === 'moto' && !warned && dist(car.x, car.y, coqui.x, coqui.y) < 90) { warned = true; c.say(coqui, 'No me subo a esa cosa. Un carro, Kazoo.', 3); }
        if (car && car.type !== 'moto' && !car.passengers.includes(coqui) && dist(car.x, car.y, coqui.x, coqui.y) > 120) objective('Regresa por Coqui');
        return car && car.passengers.includes(coqui);
      });
      objective('Lleva a Coqui con "El Tuercas" (carretera vieja)');
      const tu = P().tuercas;
      const m2 = c.addMarker({ x: tu.x, y: tu.y + 20, r: 26, color: '#ffd23f', label: 'TALLER', needCar: true });
      const d1 = dist(c.pos().x, c.pos().y, tu.x, tu.y);
      const convo = [
        [0.9, [['coqui', 'Llévame con el Tuercas.', 'serious'], ['kazoo', '¿El Tuercas? ¿Tu ex socio? ¿El del taller?', 'shock'], ['coqui', 'Sí. Ese.', 'serious']]],
        [0.65, [['coqui', 'Antes de que me agarraran escondí la lana del último trabajo en su taller. Debajo del piso de su oficina.', 'normal'], ['kazoo', '¿Y crees que siga ahí?', 'think'], ['coqui', 'Más le vale.', 'angry']]],
        [0.35, [['coqui', '¿Sabes cómo me agarraron, Kazoo?', 'serious'], ['kazoo', 'Nunca me quisiste contar.', 'sad'], ['coqui', '...', 'serious']]],
      ];
      let ci = 0;
      while (!m2.inside) {
        yield;
        if (!c.player.car || !c.player.car.passengers.includes(coqui)) { objective('Regresa por Coqui'); m2.hidden = true; continue; }
        m2.hidden = false; objective('Lleva a Coqui con "El Tuercas" (carretera vieja)');
        const p = c.pos();
        if (ci < convo.length && dist(p.x, p.y, tu.x, tu.y) < d1 * convo[ci][0]) { yield* lines(convo[ci][1]); ci++; }
      }
      c.removeMarker(m2);
      lock(true);
      while (ci < convo.length) { yield* lines(convo[ci][1]); ci++; }
      yield* line('coqui', 'Hace tres años. Joyería Brillante, en El Centro. Era mi trabajo más fácil...', 'sad');
      lock(false);
    },
  },
  {
    id: 'c1_flashback', chapter: 1, title: 'Hace 3 años', requires: ['c1_penal'], silent: true, lockRoom: true, customRooms: true, failPlace: 'tuercas',
    *run(ctx) {
      lock(true);
      yield* fadeOut(0.8);
      G.story.flashback = true;
      roomAt('joyeria', 50, { look: 'coqui' });
      const r = R();
      r.p.look = 'coqui';
      r.noExit = true;
      const tu = r.addNpc({ id: 'tuercas', look: 'tuercas', x: 505, facing: -1 });
      music('flashback');
      UI.showCard('HACE 3 AÑOS', 'Joyería Brillante — El Centro', 3, 'big');
      yield* wait(1);
      yield* fadeIn(1);
      yield* wait(2);
      yield* talk([
        ['tuercas', 'Rápido, Coqui. La alarma se reactiva en un minuto y medio.', 'shock'],
        ['coqui', 'Relájate, Tuercas. Tengo todo calculado. Aquí nadie improvisa.', 'smug'],
        ['tuercas', 'Sí, sí... yo vigilo la puerta de atrás. Tú agarra todo.', 'normal'],
      ]);
      lock(false);
      toast('Juegas como COQUI', '#5a8ce0', 3);
      objective('Rompe las 5 vitrinas (acércate y presiona E varias veces)');
      let jewels = 0;
      for (const id of ['sc1', 'sc2', 'sc3', 'sc4', 'sc5']) {
        const pr = r.prop(id);
        let hits = 0;
        const a = r.addAction({ x: pr.x + 15, r: 16, label: 'Romper vitrina', fn: () => {
          hits++; audio.sfx('hit'); r.shake(1);
          if (hits >= 3) { pr.broken = true; pr.empty = true; jewels++; a.disabled = true; audio.sfx('crash'); audio.sfx('coin'); toast(`Joyas ${jewels}/5`, '#ffd23f', 1.5); }
        } });
      }
      UI.timer = { label: 'ALARMA', t: 90 };
      while (jewels < 5) {
        const dt = yield;
        UI.timer.t -= dt;
        if (UI.timer.t <= 0) { UI.timer = null; ctx.fail('Se reactivó la alarma'); }
      }
      UI.timer = null;
      audio.sfx('alarm');
      r.shake(3);
      yield* say('tuercas', '¡La alarma! ¡¿Quién la prendió?! ¡Vámonos por atrás! ¡Te espero afuera, Coqui!', 'shock');
      yield* walkNpc(tu, 560, 80);
      tu.hidden = true;
      objective('¡Escapa por la puerta trasera!');
      yield* until(() => r.p.x > 500);
      lock(true);
      r.p.facing = 1;
      audio.sfx('door');
      const reyes = r.addNpc({ look: 'reyes', x: 548, facing: -1, pose: 'aim' });
      const c1 = r.addNpc({ look: 'cop', x: 566, facing: -1, pose: 'aim' });
      const c2 = r.addNpc({ look: 'cop', x: 530, facing: -1, pose: 'aim', y: FLOOR });
      void c1; void c2; void reyes;
      music('tension');
      UI.flash(0.6);
      yield* talk([
        ['reyes', 'Buenas noches, señor Coqui. Qué bonitas joyas.', 'smug'],
        ['coqui', '¿Tuercas? ...¡TUERCAS!', 'shock'],
        ['reyes', 'Tu amigo nos habló hace una hora. Muy cooperativo. Hasta nos dejó la puerta abierta.', 'smug'],
        ['coqui', '...', 'shock'],
        ['reyes', 'Me presento. Comandante Reyes. Vamos a ser muy buenos amigos tú y yo.', 'serious'],
      ]);
      r.p.pose = 'hands';
      audio.sfx('fail');
      UI.showCard('TE AGARRARON', '', 2.5, 'fail');
      yield* wait(2.5);
      yield* fadeOut(1);
      r.p.pose = null;
      music(null);
      G.story.flashback = false;
      UI.showCard('3 AÑOS DESPUÉS', '', 2.5, 'big');
      yield* wait(2.6);
      const tq = P().tuercas;
      cityAt(tq, 22);
      const c = C();
      c.player.look = 'kazoo';
      if (!c.peds.some((q) => q.lookId === 'coqui' && q.ally)) ally('coqui', tq.x + 14, tq.y + 22, 'COQUI');
      const coqui = c.peds.find((q) => q.lookId === 'coqui' && q.ally);
      if (coqui) { coqui.x = tq.x + 14; coqui.y = tq.y + 22; coqui.state = 'idle'; coqui.a = -Math.PI / 2; }
      yield* fadeIn(0.8);
      yield* talk([
        ['coqui', 'Me vendió por dos años menos de condena. Dos años.', 'sad'],
        ['kazoo', 'Qué hijo de...', 'angry'],
        ['coqui', 'La gente no te traiciona de golpe, Kazoo. Te traiciona poquito a poquito. Y tú no te das cuenta.', 'serious'],
        ['coqui', 'Vamos por lo mío.', 'angry'],
      ]);
      lock(false);
    },
  },
  {
    id: 'c1_tuercas', chapter: 1, title: 'Tabla floja', requires: ['c1_flashback'], lockRoom: true, customRooms: true, failPlace: 'tuercas',
    rating: () => ({ by: 'Coqui', stars: 4, text: 'Casi te ven. Casi.' }),
    *run(ctx) {
      const c = C(), tq = P().tuercas;
      lock(true);
      if (G.scene !== c) cityAt(tq, 22);
      let coqui = c.peds.find((q) => q.lookId === 'coqui' && q.ally);
      if (!coqui) coqui = ally('coqui', tq.x + 14, tq.y + 22, 'COQUI');
      coqui.state = 'idle';
      yield* talk([
        ['coqui', 'Este es el plan. Yo entro por enfrente y lo entretengo. Tú entras por la puerta de atrás.', 'serious'],
        ['coqui', 'Su oficina está al fondo. Debajo del escritorio hay una tabla floja. Ahí está la lana.', 'normal'],
        ['kazoo', '¿Y si me ven?', 'shock'],
        ['coqui', 'Que no te vean.', 'serious'],
        ['kazoo', 'Gracias, Coqui. Muy útil.', 'sad'],
      ]);
      yield* fadeOut(0.5);
      c.removePed(coqui);
      roomAt('tuercas', 690, { facing: -1 });
      const r = R();
      r.noExit = true;
      r.stealth = true;
      const chavo = r.addEnemy({ look: 'chavo', x: 590, patrol: [470, 612], speed: 24, vision: 92, facing: -1, pauseT: 2.2, label: null });
      const primo = r.addEnemy({ look: 'thug', x: 440, patrol: [420, 452], speed: 18, vision: 84, facing: 1, pauseT: 3 });
      r.addNpc({ id: 'tuercasF', look: 'tuercas', x: 120, facing: -1 });
      r.addNpc({ id: 'coquiF', look: 'coqui', x: 96, facing: 1 });
      r.onDetected = (e) => { if (!r._caught) { r._caught = true; e.bark = '¡Oye tú!'; e.barkT = 2; G.story.fail(e === chavo ? 'El Chavo te vio' : 'El Primo te vio', 'fail'); } };
      let noiseCd = 0;
      r.addAction({ x: 636, r: 20, label: 'Aventar una tuerca', fn: () => {
        if (noiseCd > 0) return;
        noiseCd = 9; audio.sfx('hit');
        toast('*clank* ...allá en el frente', '#f4f4f0', 2);
        for (const e of [chavo, primo]) { e.state = 'investigate'; e.inv = { x: 300 + Math.random() * 30, t: 6 }; e.bark = '?'; e.barkT = 1.2; }
      } });
      const prevUpd = r.onUpdate;
      r.onUpdate = (dt) => { if (prevUpd) prevUpd(dt); if (noiseCd > 0) noiseCd -= dt; };
      music('tension');
      yield* fadeIn(0.5);
      yield* say('narrator', 'Kazoo rodea el taller y se mete por la puerta de atrás...', 'normal');
      lock(false);
      toast('Agáchate (S/Abajo) detrás de cajas y escritorios. Los lockers sirven para esconderse.', '#5adcf0', 6);
      objective('Llega al escritorio sin que te vean. Tip: avienta una tuerca para distraerlos.');
      let pried = 0;
      const board = r.addAction({ x: 466, r: 14, label: 'Levantar la tabla', fn: () => { pried++; audio.sfx('dig'); r.shake(1); } });
      yield* until(() => pried >= 5);
      board.disabled = true;
      lock(true);
      r.stealth = false;
      chavo.frozen = true; primo.frozen = true;
      yield* talk([
        ['kazoo', '¡Ya la tengo! Ahora sí... a ver...', 'happy'],
        ['kazoo', '...', 'shock'],
        ['kazoo', 'No hay nada. Nomás... un recibo de Elektra. De una sala. En 52 pagos.', 'shock'],
      ]);
      // Tuercas & Coqui come in
      const tuF = r.npc('tuercasF'), coF = r.npc('coquiF');
      tuF.x = 380; coF.x = 356;
      yield* walkNpc(coF, 424, 50);
      tuF.goal = { x: 440, speed: 50 };
      yield* wait(0.8);
      chavo.facing = -1; primo.facing = 1;
      yield* talk([
        ['tuercas', '¡Chavo! ¡Primo! Tranquilos, tranquilos... es... es Coqui.', 'shock'],
        ['tuercas', '¡Coqui, hermano! ¡Qué gusto! ¿Ya saliste? ¡Qué rápido pasa el tiempo!', 'happy'],
        ['coqui', 'Tres años, Tuercas. Para mí no pasó rápido.', 'serious'],
        ['kazoo', 'Coqui... no hay nada. Está vacío.', 'sad'],
        ['coqui', '¿Dónde está mi dinero?', 'angry'],
        ['tuercas', 'Mira, mira... te lo iba a guardar, de verdad. Pero luego se me descompuso la grúa, y mi señora quería una sala, y luego el Marketplace tenía unas ofertas...', 'sad'],
        ['kazoo', '...Las ofertas del Marketplace sí son muy buenas.', 'normal'],
        ['coqui', '¡KAZOO!', 'angry'],
        ['kazoo', 'Perdón.', 'sad'],
        ['tuercas', 'Me ofrecieron dos años menos, Coqui. Dos años. Tú habrías hecho lo mismo.', 'sad'],
        ['coqui', 'No. Yo no.', 'serious'],
      ]);
      const ch = yield* ask('kazoo', '(Coqui aprieta los puños. ¿Qué le dices?)', ['"Déjalo, Coqui. No vale la pena."', '"Rómpele la cara."', '(No decir nada)']);
      if (ch === 0) { trust(6); yield* talk([['kazoo', 'Déjalo, Coqui. No vale la pena. Tú no eres como él.', 'serious'], ['coqui', '...Tienes razón. No soy como él.', 'sad']]); }
      else if (ch === 1) { trust(-3); yield* talk([['kazoo', 'Rómpele la cara, Coqui.', 'angry'], ['coqui', 'No. Eso es lo que haría él. Nosotros no somos así.', 'serious'], ['kazoo', '...Tienes razón.', 'sad']]); }
      else yield* talk([['kazoo', '...', 'normal'], ['coqui', '...', 'serious']]);
      yield* talk([
        ['coqui', 'Vámonos, Kazoo.', 'serious'],
        ['coqui', 'Tuercas. Si te vuelvo a ver... no me vas a ver tú primero.', 'angry'],
        ['tuercas', '(traga saliva)', 'shock'],
      ]);
      music(null);
      yield* fadeOut(0.8);
      cityAt(tq, 30);
      const co = ally('coqui', tq.x + 16, tq.y + 30, 'COQUI');
      co.state = 'idle';
      setClock(19, 20);
      yield* fadeIn(0.8);
      music('sad');
      yield* talk([
        ['coqui', 'No tengo nada, Kazoo. Ni lana, ni casa, ni socio.', 'sad'],
        ['kazoo', 'Tienes socio. Y casa. Bueno... tengo un cuarto. Hay un sillón.', 'normal'],
        ['kazoo', 'Bueno, no hay sillón. Hay piso. Pero es un piso muy bonito.', 'happy'],
        ['coqui', 'Suena a lujo.', 'smug'],
        ['kazoo', 'Coqui... ¿y ahora qué hacemos?', 'think'],
        ['coqui', '...', 'think'],
        ['coqui', 'Ahora... necesitamos un plan.', 'serious'],
      ]);
      music(null);
      c.removePed(co);
      yield* fadeOut(0.6);
      setDay(-17); setClock(8, 40);
      unlockZone('centro');
      lock(false);
    },
  },
];
