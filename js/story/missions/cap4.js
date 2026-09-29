// CAPÍTULO 4 — "Reconocimiento" (Día -10)
import { G } from '../../core/game.js';
import { UI } from '../../ui/ui.js';
import { audio } from '../../core/audio.js';
import { wait, until, say, talk, ask, fadeOut, fadeIn, lock, objective, toast, chat, setClock, setDay, trust, music, walkNpc, walkPlayer, goTo, addMoney, pedTo } from '../script.js';
import { P, C, R, S, line, lines, ally, cityAt, roomAt, dumb } from './common.js';
import { FLOOR } from '../../interior/rooms.js';
import { rand } from '../../core/util.js';

export const CAP4 = [
  {
    id: 'c4_reco', chapter: 4, chapterStart: true, title: 'Reconocimiento', requires: ['c3_fin'], customRooms: true, lockRoom: true, failPlace: 'taqueria',
    rating: () => ({ by: 'Comandante Reyes', stars: 4, text: 'Buen taco. Chico sospechoso.' }),
    *run(ctx) {
      setDay(-10); setClock(10, 0);
      lock(true);
      roomAt('taqueria', 150);
      const r0 = R();
      r0.addNpc({ id: 'mari', look: 'mari', x: 246, facing: -1 });
      yield* fadeIn(0.4);
      yield* talk([
        ['mari', 'Kazoo, llegó un pedido raro. Quince tacos para la gerencia del Banco Federal.', 'think'],
        ['kazoo', '(¡Perfecto!) Claro, Doña Mari. Con gusto.', 'happy'],
        ['mari', '¿Con gusto? ¿Tú? ¿Estás enfermo?', 'shock'],
        ['kazoo', 'Estoy... motivado.', 'smug'],
        ['mari', 'Eso es peor.', 'serious'],
      ]);
      yield* fadeOut(0.3);
      const tq = P().taqueria, c = C();
      cityAt(tq, 6);
      if (!c.vehicles.some((v) => v.type === 'moto' && Math.hypot(v.x - tq.x, v.y - tq.y) < 120)) c.spawnVehicle('moto', tq.x + 24, tq.y + 22, 0, { mission: true, color: '#d8323c' });
      yield* fadeIn(0.3);
      lock(false);
      objective('Lleva el pedido al Banco Federal');
      const bk = P().banco;
      UI.timer = { label: 'PEDIDO', t: 120 };
      yield* goTo(bk.x, bk.y + 2, { label: 'BANCO FEDERAL', r: 16, check: () => { UI.timer.t -= 1 / 60; } });
      UI.timer = null;
      if (c.player.car) c.exitCar(true);
      lock(true);
      yield* fadeOut(0.3);

      // ------------- inside the bank
      const st = { photos: new Set(), alarmSeen: false, delivered: false, reyesDone: false, susp: 0 };
      let guards = [], teller = null, reyes = null;
      const setupBank = (x) => {
        roomAt('banco', x);
        const r = R();
        r.noExit = true;
        teller = r.addNpc({ id: 'teller', look: 'teller', x: 600, facing: -1 });
        r.addNpc({ look: 'teller', x: 560, facing: -1 });
        r.addNpc({ look: 4, x: 200, facing: 1 }); r.addNpc({ look: 14, x: 226, facing: 1 }); r.addNpc({ look: 27, x: 270, facing: 1, pose: 'sit', y: FLOOR - 2 });
        if (!st.reyesDone) reyes = r.addNpc({ id: 'reyes', look: 'reyes', x: 380, facing: 1 });
        guards = [r.addNpc({ look: 'guard', x: 140, facing: 1, patrol: [100, 460] }), r.addNpc({ look: 'guard', x: 820, facing: -1, patrol: [760, 870] })];
        for (const id of st.photos) r.prop(id).photo = true;
        if (S().flags.alarmCut) r.prop('alarm').off = true;
        let turnT = 0;
        r.onUpdate = (dt) => {
          turnT -= dt;
          for (const g of guards) {
            if (!g.goal && (g.waitT = (g.waitT || 0) - dt) <= 0) { const nx = rand(g.patrol[0], g.patrol[1]); g.goal = { x: nx, speed: 22 }; g.waitT = rand(1.5, 3.5); }
          }
          if (turnT <= 0) { teller.facing = -teller.facing; turnT = rand(2, 4); }
        };
        return r;
      };
      const seenBy = (r) => guards.some((g) => Math.abs(g.x - r.p.x) < 130 && Math.sign(r.p.x - g.x) === g.facing);
      const suspicion = (n, why) => {
        st.susp += n; UI.meter = { label: 'SOSPECHA', v: st.susp / 100, col: st.susp > 60 ? '#d8323c' : '#f08c28' };
        toast(why, '#d8323c', 2);
        if (st.susp >= 100) st.failed = 'Te sacaron del banco. Muy sospechoso.';
      };
      const addActions = (r) => {
        for (const id of ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6']) {
          const pr = r.prop(id);
          if (st.photos.has(id)) continue;
          const a = r.addAction({ x: pr.x + 5, r: 18, label: 'Foto a la cámara', fn: () => {
            if (seenBy(r)) { suspicion(30, '¡Un guardia te vio sacando fotos!'); return; }
            st.photos.add(id); pr.photo = true; a.disabled = true; audio.sfx('camera'); UI.flash(0.3);
            toast(`Cámara ${st.photos.size}/6` + (id === 'cam4' ? ' — la chueca de Ghenghis' : ''), '#46d470', 2);
          } });
        }
        if (!st.alarmSeen) {
          const a = r.addAction({ x: 644, r: 16, label: 'Revisar botón de alarma', fn: () => {
            if (teller.facing > 0 && Math.abs(teller.x - r.p.x) < 80) { suspicion(25, 'La cajera te está viendo raro...'); return; }
            if (seenBy(r)) { suspicion(25, 'El guardia te está viendo raro...'); return; }
            a.disabled = true; st.alarmSeen = true; G.story._alarmPrompt = true;
          } });
        }
        if (!st.delivered) r.addAction({ x: 730, r: 16, label: 'Entregar tacos (Gerencia)', fn: () => { G.story._toGerencia = true; } });
      };
      ctx.check(() => st.failed || null);
      let r = setupBank(40); addActions(r);
      music('tension');
      yield* fadeIn(0.3);
      lock(false);
      toast('Toma fotos de las cámaras cuando ningún guardia te vea.', '#5adcf0', 5);
      const upd = () => objective(`Fotos: ${st.photos.size}/6 · Alarma: ${st.alarmSeen ? '✓' : '?'} · Tacos: ${st.delivered ? '✓' : 'entregar'}`);
      while (!(st.photos.size === 6 && st.alarmSeen && st.delivered)) {
        yield;
        upd();
        r = R();
        // Reyes intercepts
        if (!st.reyesDone && reyes && Math.abs(r.p.x - reyes.x) < 34) {
          st.reyesDone = true;
          yield* reyesTalk(ctx, reyes, suspicion, st);
          reyes.goal = { x: 540, speed: 30 };
        }
        if (G.story._alarmPrompt) {
          G.story._alarmPrompt = false;
          lock(true);
          yield* say('kazoo', '(El botón de alarma silenciosa. Detrás del mostrador. Un cablecito rojo...)', 'think');
          const c1 = yield* ask('kazoo', '(¿Lo aflojo?)', ['Aflojar el cable (arriesgado)', 'Mejor no tocar nada']);
          if (c1 === 0) {
            if (seenBy(r) || (teller.facing > 0 && Math.abs(teller.x - r.p.x) < 80)) suspicion(40, '¡Te vieron metiendo la mano al mostrador!');
            else { S().flags.alarmCut = true; r.prop('alarm').off = true; audio.sfx('select'); toast('Cable aflojado. Eso nos dará tiempo extra.', '#46d470', 3); }
          }
          lock(false);
        }
        if (G.story._toGerencia) {
          G.story._toGerencia = false;
          lock(true);
          yield* fadeOut(0.3);
          roomAt('gerencia', 60);
          const g = R();
          g.noExit = true;
          const mgr = g.addNpc({ look: 'manager', x: 186, facing: -1, pose: 'sit', y: FLOOR - 4 });
          yield* fadeIn(0.3);
          yield* talk([
            ['manager', 'Por fin. ¿Por qué tardaste tanto?', 'angry'],
            ['kazoo', 'Había fila.', 'normal'],
            ['manager', 'Pues sí. Es un banco.', 'serious'],
            ['manager', 'Ahí déjalos en el escritorio. Toma, $50 de propina. No te lo gastes todo.', 'smug'],
          ]);
          addMoney(50);
          yield* say('narrator', 'Sobre el escritorio hay una hoja: "BLINDADO — VIERNES 29 — 10:00 AM. Bóveda al 100%."', 'normal', { name: 'LA HOJA' });
          yield* say('kazoo', '(Viernes 29. Diez de la mañana. Ya te vi, papelito.)', 'smug');
          S().flags.schedule = true;
          void mgr;
          st.delivered = true;
          yield* fadeOut(0.3);
          r = setupBank(740); addActions(r);
          r.p.facing = -1;
          yield* fadeIn(0.3);
          lock(false);
        }
      }
      objective('Sal del banco sin llamar la atención');
      r = R(); r.noExit = false;
      let out = false;
      r.onExit = () => { out = true; return false; };
      yield* until(() => out || r.p.x < 26);
      UI.meter = null;
      lock(true);
      music(null);
      yield* fadeOut(0.3);
      cityAt(bk, 18);
      const ry = C().spawnPed('reyes', bk.x + 10, bk.y + 4, { state: 'idle', mission: true });
      yield* fadeIn(0.3);
      C().say(ry, '¡Gracias por el taco, muchacho!', 3);
      yield* wait(1.5);
      // Coqui watches from across the street
      const car = C().spawnVehicle('sedan', bk.x + 70, bk.y + 48, Math.PI, { mission: true, color: '#1a1a2e' });
      car.noEnter = true;
      C().camTarget = { x: car.x, y: car.y };
      UI.letterboxTarget = 1;
      yield* wait(1.4);
      yield* say('narrator', 'Del otro lado de la calle, alguien estaba mirando.', 'normal');
      yield* say('coqui', '(...¿Qué tanto platicas con la policía, Kazoo?)', 'serious');
      C().camTarget = null;
      UI.letterboxTarget = 0;
      C().removePed(ry);
      lock(false);
    },
  },
  {
    id: 'c4_reporte', chapter: 4, title: 'El reporte', requires: ['c4_reco'], customRooms: true,
    rating: () => ({ by: 'Coqui', stars: 3, text: 'Buen trabajo. Supongo.' }),
    *run(ctx) {
      objective('Regresa al escondite con las fotos');
      const esc = P().escondite;
      yield* goTo(esc.x, esc.y, { label: 'ESCONDITE', r: 14 });
      const c = C();
      if (c.player.car) c.exitCar(true);
      lock(true);
      yield* fadeOut(0.3);
      roomAt('escondite', 120);
      const r = R();
      r.prop('plan').plan = true;
      r.addNpc({ id: 'coqui', look: 'coqui', x: 200, facing: -1 });
      const gh = r.addNpc({ id: 'ghenghis', look: 'ghenghis', x: 250, facing: -1 });
      yield* fadeIn(0.3);
      yield* talk([
        ['kazoo', 'Seis cámaras. Todas fotografiadas. Tres guardias. Y el botón de la alarma está detrás del mostrador.', 'happy'],
        ['ghenghis', '¡La cámara cuatro sigue chueca! ¡Mi legado! ¡Jajaja!', 'laugh'],
      ]);
      if (S().flags.schedule) yield* say('kazoo', 'Y el blindado llega el viernes 29, a las diez.', 'smug');
      if (S().flags.alarmCut) yield* say('kazoo', 'Ah, y le aflojé el cable a la alarma. De nada.', 'smug');
      yield* say('coqui', '...¿Qué platicaste con la policía?', 'serious');
      const ch = yield* ask('kazoo', '(Coqui no parpadea.)', ['"Nada. Me pidió un taco."', '"Me preguntó por ti, Coqui. Le dije que no te conocía."', '"¿Me estabas espiando?"']);
      if (ch === 0) { trust(-6); yield* talk([['kazoo', 'Nada. Me pidió un taco.', 'normal'], ['coqui', '...Un taco. Media hora para un taco.', 'serious']]); }
      if (ch === 1) { trust(8); yield* talk([['kazoo', 'Me preguntó por ti, Coqui. Le dije que no te conocía. Bueno, le dije que eras un perro.', 'sad'], ['coqui', '...¿Un perro?', 'shock'], ['kazoo', 'Salió así.', 'sad'], ['coqui', '...Gracias por decirme la verdad.', 'normal']]); }
      if (ch === 2) { trust(-2); yield* talk([['kazoo', '¿Me estabas espiando?', 'angry'], ['coqui', 'Te estaba cuidando.', 'serious'], ['kazoo', 'Se parece mucho.', 'serious']]); }
      yield* talk([
        ['coqui', 'Viernes 29. 10:05. Ese es el día.', 'serious'],
        ['ghenghis', 'Qué emoción. Nos van a agarrar. Jajaja.', 'laugh'],
        ['coqui', 'Kazoo. El carro.', 'serious'],
        ['kazoo', '¡Ya voy, ya voy!', 'shock'],
      ]);
      void gh;
      yield* fadeOut(0.8);
      setDay(-7); setClock(11, 0);
      lock(false);
    },
  },
];

function* reyesTalk(ctx, reyes, suspicion, st) {
  lock(true);
  reyes.facing = -1;
  music(null);
  const Q = [
    ['¿No te he visto antes?', [['Probablemente. Reparto en toda la ciudad. Tengo 4.9 estrellas.', 0], ['¡No! ¡Nunca! ¡Jamás he estado en ningún lado!', 35], ['¿Usted es la de la torta?', 15, true]]],
    ['¿Qué traes ahí?', [['Tacos al pastor para la gerencia.', 0], ['Nada. Digo, tacos. Digo... ¿nada de tacos?', 30, true], ['Pruebas... ¡de tacos! Pruebas de tacos.', 20, true]]],
    ['Huele bien. ¿Me vendes uno? No he desayunado.', [['Claro, jefa. Invita la casa.', 0], ['No se puede, son contados.', 12], ['Son $15. Más propina.', 5]]],
    ['(mastica) Mmm. Oye... ¿conoces a un tal Coqui? Salió del penal hace poco.', [['¿Coqui? ¿Como la rana?', 5, true], ['Nunca he oído ese nombre en mi vida. Jamás. Qué nombre tan raro.', 25], ['Sí, es mi mejor amigo.', 45, true]]],
  ];
  yield* talk([
    ['reyes', 'Oye tú. El de los tacos.', 'serious'],
    ['kazoo', '(Es ella. La Comandante Reyes. La que agarró a Coqui.)', 'shock'],
  ]);
  UI.meter = { label: 'SOSPECHA', v: st.susp / 100, col: '#f08c28' };
  for (let i = 0; i < Q.length; i++) {
    const [q, opts] = Q[i];
    const ch = yield* ask('reyes', q, opts.map((o) => o[0]), 'serious');
    const [, pts, silly] = opts[ch];
    if (silly) dumb();
    if (pts) suspicion(pts, 'Reyes entrecierra los ojos...');
    if (i === 2 && ch === 0) yield* say('reyes', '(Muerde el taco) ...Está bueno. Muy bueno. Dile a Doña Mari que la Comandante Reyes la saluda.', 'happy');
    if (i === 3 && ch === 2) yield* talk([['kazoo', '...Digo. Mi mejor amigo se llama Coqui. Es un perro. Un chihuahua. Muy leal.', 'shock'], ['reyes', 'Hm.', 'serious']]);
  }
  yield* talk([
    ['reyes', 'Bueno. Si lo ves, dile que lo estoy vigilando.', 'smug'],
    ['kazoo', '¿Al perro?', 'think'],
    ['reyes', 'Al perro.', 'serious'],
  ]);
  music('tension');
  lock(false);
}
