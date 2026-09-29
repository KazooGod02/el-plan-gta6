// "Extraños y locos": optional side missions marked with a pink "?" on the map.
// They go through the same mission manager as the story (fail/retry, rewards, saving).
import { G } from '../core/game.js';
import { UI } from '../ui/ui.js';
import { audio } from '../core/audio.js';
import { wait, until, say, talk, goTo, objective, toast, lock, music, fadeOut, fadeIn } from './script.js';
import { C, S, line, seat } from './missions/common.js';
import { MAP, TS, tileAt, T, isWalkway } from '../world/map.js';
import { dist, rand, pick, clamp } from '../core/util.js';

// nearest sidewalk / walkable tile to a tile coordinate, in world px
function spot(tx, ty) {
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = tx + dx, y = ty + dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (isWalkway(x, y) || tileAt(x, y) === T.COURT || tileAt(x, y) === T.FIELD || tileAt(x, y) === T.DIRT) return { x: x * TS + 8, y: y * TS + 8 };
  }
  return { x: tx * TS + 8, y: ty * TS + 8 };
}

function meet(who, at) {
  const c = C();
  const p = c.spawnPed(who, at.x, at.y - 10, { state: 'idle', mission: true });
  p.a = Math.PI / 2;
  return p;
}

export const SIDE = [
  // ------------------------------------------------------------ El Profeta
  {
    id: 's_profeta', side: true, chapter: 0, who: 'profeta', title: 'El fin del mundo (otra vez)', at: [40, 79], minChapter: 1, zone: 'colonia', reward: 300,
    rating: () => ({ by: 'El Profeta', stars: 5, text: 'Nos vemos el jueves. O no.' }),
    *run(ctx) {
      const c = C(), at = this.pos;
      lock(true);
      const pr = meet('profeta', at);
      yield* talk([
        ['profeta', '¡TÚ! ¡El de la cara de deudor! El mundo se acaba el jueves.', 'crazy'],
        ['kazoo', '...¿Este jueves?', 'think'],
        ['profeta', 'Todos los jueves, hijo. Hasta que le atine. Ayúdame a repartir estos volantes antes de que se me acabe la fe.', 'serious'],
        ['kazoo', '¿Cuánto paga el apocalipsis?', 'smug'],
        ['profeta', 'Trescientos pesos y la salvación eterna. La salvación va aparte.', 'crazy'],
      ]);
      lock(false);
      const spots = [spot(30, 64), spot(46, 91), spot(10, 77)].sort(() => Math.random() - 0.5);
      UI.timer = { label: 'EL FIN', t: 130 };
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'Se acabó el mundo. Bueno, el tiempo.' : null));
      for (let i = 0; i < spots.length; i++) {
        objective(`Reparte volantes a pie (${i}/3) — sin carro, la fe se camina`);
        yield* goTo(spots[i].x, spots[i].y, { needCar: false, r: 16, color: '#fff08c', label: 'VOLANTES', check: () => { UI.timer.t -= 1 / 60; } });
        audio.sfx('pickup');
        toast(pick(['"¡ARREPIÉNTANSE!"', '"Ya casi, ya casi"', '"El jueves, sin falta"']), '#fff08c', 1.5);
      }
      UI.timer = null;
      objective('Regresa con El Profeta');
      yield* goTo(at.x, at.y, { needCar: false, r: 18, color: '#fff08c' });
      lock(true);
      yield* talk([
        ['profeta', '¿Los repartiste todos? Entonces ya no hay marcha atrás.', 'serious'],
        ['kazoo', '¿Y si el jueves no se acaba el mundo?', 'think'],
        ['profeta', 'Pues el otro jueves. Uno tiene que tener paciencia con el fin del mundo.', 'crazy'],
      ]);
      c.removePed(pr);
      lock(false);
    },
  },
  // ------------------------------------------------------------ Doña Cuca y el gato
  {
    id: 's_gato', side: true, chapter: 0, who: 'abuela', title: 'Michi, ven para acá', at: [16, 66], minChapter: 1, zone: 'colonia', reward: 250,
    rating: () => ({ by: 'Doña Cuca', stars: 5, text: 'Te guardé tamales. De rajas, no te emociones.' }),
    *run(ctx) {
      const c = C(), at = this.pos;
      lock(true);
      const cu = meet('abuela', at);
      yield* talk([
        ['abuela', 'Mijo, ¿tú eres el muchacho de los mandados? Se me salió el Michi. Mi gato.', 'sad'],
        ['abuela', 'Es naranja, gordo y malagradecido. Como mi difunto. Tráemelo y te doy doscientos cincuenta.', 'serious'],
        ['kazoo', '¿Y si no se deja?', 'think'],
        ['abuela', 'No se deja. Nunca se deja. Por eso te pago.', 'normal'],
      ]);
      lock(false);
      // the cat hops between spots before you can grab it
      const hops = [spot(24, 86), spot(8, 90), spot(34, 88)];
      const cat = { x: hops[0].x, y: hops[0].y, tx: hops[0].x, ty: hops[0].y, a: 0, t: 0, held: false };
      c.extraDraw = (ctx2, cx, cy) => drawCat(ctx2, cat, cx, cy);
      let hop = 0;
      const m = c.addMarker({ x: cat.x, y: cat.y, r: 12, color: '#f08c28', label: 'MICHI', needCar: false });
      objective('Encuentra a Michi (el gato naranja). Sin carro: lo espantas.');
      while (true) {
        const dt = yield;
        cat.t += dt;
        const dx = cat.tx - cat.x, dy = cat.ty - cat.y, d = Math.hypot(dx, dy);
        if (d > 1) { const st = Math.min(d, 120 * dt); cat.x += dx / d * st; cat.y += dy / d * st; cat.a = Math.atan2(dy, dx); }
        m.x = cat.x; m.y = cat.y;
        const p = c.pos();
        if (!c.player.car && dist(p.x, p.y, cat.x, cat.y) < 26 && d < 2) {
          if (hop < 2) {
            hop++; cat.tx = hops[hop].x; cat.ty = hops[hop].y;
            audio.sfx('blip', { f: 1200 }); c.say(c.player, pick(['¡Michi! ¡Ven!', '¡Gato del demonio!', 'Psss psss psss...']), 1.5);
            toast('¡Se escapó! Síguelo', '#f08c28', 1.5);
          } else break;
        }
      }
      c.removeMarker(m);
      cat.held = true; audio.sfx('pickup');
      toast('¡Agarraste a Michi! (te rasguñó)', '#f08c28', 2);
      objective('Regresa a Michi con Doña Cuca');
      yield* goTo(at.x, at.y, { r: 18, color: '#a0dc50', label: 'DOÑA CUCA' });
      lock(true);
      c.extraDraw = null;
      yield* talk([
        ['abuela', '¡Michi! ¡Mi amor! ¿Dónde andabas, sinvergüenza?', 'happy'],
        ['kazoo', 'En tres lugares diferentes. Muy rápido. Ese gato entrena.', 'angry'],
        ['abuela', 'Toma, mijo. Y cámbiate esa camisa, tiene pelos.', 'happy'],
      ]);
      c.removePed(cu);
      lock(false);
      void ctx;
    },
  },
  // ------------------------------------------------------------ El Místico del Barrio
  {
    id: 's_lucha', side: true, chapter: 0, who: 'lucha', title: 'Lucha libre de banqueta', at: [54, 79], minChapter: 2, zone: 'colonia', reward: 400,
    rating: () => ({ by: 'El Místico', stars: 4, text: 'Revancha el domingo. Traigo a mi primo.' }),
    *run(ctx) {
      const c = C(), at = this.pos;
      lock(true);
      if (c.player.car) c.exitCar(true);
      const lu = meet('lucha', at);
      yield* talk([
        ['lucha', '¡ALTO AHÍ, CIUDADANO! Soy EL MÍSTICO DEL BARRIO. Invicto en esta banqueta.', 'angry'],
        ['kazoo', '¿Invicto? ¿Cuántas peleas llevas?', 'think'],
        ['lucha', 'Cero. Por eso invicto. ¡Hoy eso cambia! A puño limpio. Nada de armas, que es de mal gusto.', 'angry'],
      ]);
      lock(false);
      S().weapon = 'fists';
      Object.assign(lu, { brawler: true, state: 'brawl', hp: 140, maxHp: 140, speed: 55, punchT: 1 });
      toast('¡PELEA! Golpea con ESPACIO / B', '#c878f0', 3);
      objective('Gánale al Místico a puño limpio');
      ctx.check(() => (S().weapon !== 'fists' ? '¡Sacaste un arma! El Místico te acusó con su mamá.' : null));
      ctx.check(() => (c.player.car ? 'Te subiste a un carro. Eso es huir, no luchar.' : null));
      yield* until(() => lu.state === 'down');
      lock(true);
      audio.sfx('pass');
      lu.state = 'idle';
      yield* talk([
        ['lucha', '...Uno a cero. Bueno. Ya no soy invicto. Qué alivio, era mucha presión.', 'sad'],
        ['lucha', 'Toma, campeón. La bolsa de la pelea. Era para mis tortas.', 'normal'],
      ]);
      c.removePed(lu);
      lock(false);
    },
  },
  // ------------------------------------------------------------ La Influ
  {
    id: 's_influ', side: true, chapter: 0, who: 'influ', title: 'Contenido de calidad', at: [58, 18], minChapter: 2, zone: 'centro', reward: 500,
    rating: () => ({ by: 'La Influ', stars: 5, text: 'Te etiqueté. Bueno, a tu nuca.' }),
    *run(ctx) {
      const c = C(), at = this.pos;
      lock(true);
      const inf = meet('influ', at);
      yield* talk([
        ['influ', '¡Hola, mis vicios! Aquí su influ favorita... ¡tú! ¿Tienes carro? ¿Sí? ¡Perfecto!', 'happy'],
        ['influ', 'Necesito llegar al muelle del puerto para la foto del atardecer. Tengo que subirla YA o el algoritmo me olvida.', 'shock'],
        ['kazoo', '¿Cuánto me pagas?', 'think'],
        ['influ', 'Quinientos pesos y exposición. Mucha exposición. ...Bueno, los quinientos.', 'smug'],
      ]);
      c.removePed(inf);
      lock(false);
      let car = c.player.car;
      if (!car || car.type === 'moto') {
        objective('Consigue un carro para La Influ (en moto se despeina)');
        yield* until(() => c.player.car && c.player.car.type !== 'moto');
        car = c.player.car;
      }
      const inf2 = seat(car, 'influ', null); inf2.keep = false; inf2.sideTemp = true;
      const hp0 = car.hp;
      const dock = spot(158, 50);
      UI.timer = { label: 'ALGORITMO', t: 75 };
      UI.meter = { label: 'MAQUILLAJE', v: 1, col: '#ff7ae0' };
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'El algoritmo te olvidó' : null));
      ctx.check(() => (c.player.car !== car ? 'Dejaste a La Influ en el carro. Te va a quemar en sus historias.' : null));
      ctx.check(() => (UI.meter && UI.meter.v <= 0 ? 'Chocaste tanto que se le corrió el maquillaje' : null));
      if (!S().unlocked.puerto) { toast('El puerto está cerrado... ¡va la foto en la plaza!', '#ff7ae0', 3); }
      const goal = S().unlocked.puerto ? dock : spot(36, 12);
      objective('Lleva a La Influ a la foto del atardecer. ¡No choques!');
      yield* goTo(goal.x, goal.y, { needCar: true, r: 26, color: '#ff7ae0', label: 'LA FOTO', check: () => {
        UI.timer.t -= 1 / 60;
        UI.meter.v = clamp(1 - (hp0 - car.hp) / (car.maxHp * 0.3), 0, 1);
        if (!G.ui.dialog && Math.random() < 0.004) UI.say('influ', pick(['¡Graba, graba, graba!', 'Ay, ese bache me movió la luz.', '¿Puedes manejar más... estético?', 'Mis vicios, estamos en vivo con un chofer rarísimo.']), { auto: 3.5 });
      } });
      UI.timer = null; UI.meter = null;
      lock(true);
      const i = car.passengers.findIndex((q) => q.lookId === 'influ');
      if (i >= 0) car.passengers.splice(i, 1);
      UI.flash(0.8); audio.sfx('camera');
      yield* line('influ', '¡FOTO! ...Saliste de lado. Te corto. Nada personal, es el encuadre.');
      lock(false);
    },
  },
  // ------------------------------------------------------------ El del OVNI
  {
    id: 's_ovni', side: true, chapter: 0, who: 'ovni', title: 'Ellos están aquí', at: [104, 112], minChapter: 3, zone: 'afueras', reward: 600,
    rating: () => ({ by: 'El del OVNI', stars: 5, text: 'Te dije. TE DIJE.' }),
    *run(ctx) {
      const c = C(), at = this.pos;
      lock(true);
      const ov = meet('ovni', at);
      G.forceDark = 0.6; G.weatherLock = true;
      yield* talk([
        ['ovni', 'Shhh. Apaga las luces. ...No traes luces. Bueno, apaga la cara.', 'shock'],
        ['ovni', 'Cada noche aparecen señales en los campos. Tres. Si pasas por las tres en un vehículo... ELLOS bajan.', 'crazy'],
        ['kazoo', '¿Ellos quiénes?', 'think'],
        ['ovni', 'Los de arriba. No los del gobierno. Los de MÁS arriba. Te doy seiscientos si los grabas.', 'serious'],
      ]);
      c.removePed(ov);
      lock(false);
      const signs = [spot(120, 118), spot(150, 124), spot(60, 120)];
      if (!c.player.car) { objective('Consigue un vehículo'); yield* until(() => !!c.player.car); }
      UI.timer = { label: 'SEÑAL', t: 110 };
      ctx.check(() => (UI.timer && UI.timer.t <= 0 ? 'Se fue la señal. Ellos no esperan.' : null));
      for (let i = 0; i < signs.length; i++) {
        objective(`Pasa por las señales en los campos (${i}/3)`);
        yield* goTo(signs[i].x, signs[i].y, { needCar: true, r: 26, color: '#a0dc50', label: 'SEÑAL', check: () => { UI.timer.t -= 1 / 60; } });
        audio.sfx('blip', { f: 300 + i * 200 });
      }
      UI.timer = null;
      // they come down
      lock(true);
      if (c.player.car) { c.player.car.throttle = 0; c.player.car.handbrake = true; }
      const ufo = { t: 0 };
      c.extraDraw = (ctx2, cx, cy) => drawUfo(ctx2, c.pos().x - cx, c.pos().y - cy, ufo.t);
      music(null);
      for (let k = 0; k < 90; k++) { ufo.t += yield; if (k % 20 === 0) audio.sfx('blip', { f: 200 + k * 8 }); }
      UI.flash(1); audio.sfx('explode', { vol: 0.3 });
      yield* wait(0.6);
      c.extraDraw = null;
      yield* say('kazoo', '...¿Qué fue eso? ...¿Lo grabé? ...No lo grabé.', 'shock');
      G.forceDark = undefined; G.weatherLock = false;
      toast('El del OVNI te depositó $600 "por intentarlo"', '#a0dc50', 3);
      lock(false);
      void at; void ctx;
    },
  },
];

// ------------------------------------------------------------ drawing helpers
function drawCat(ctx, cat, cx, cy) {
  if (cat.held) return;
  const x = Math.round(cat.x - cx), y = Math.round(cat.y - cy);
  const run = Math.floor(cat.t * 10) % 2;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 4, y + 3, 9, 2);
  ctx.fillStyle = '#f08c28'; ctx.fillRect(x - 4, y - 2, 8, 5); ctx.fillRect(x + 2, y - 5, 4, 4);
  ctx.fillStyle = '#c86a1a'; ctx.fillRect(x - 2, y - 2, 1, 5); ctx.fillRect(x, y - 2, 1, 5);
  ctx.fillStyle = '#f08c28'; ctx.fillRect(x + 2, y - 6, 1, 1); ctx.fillRect(x + 5, y - 6, 1, 1); ctx.fillRect(x - 6, y - 4 + run, 2, 3);
  ctx.fillStyle = '#101018'; ctx.fillRect(x + 3, y - 4, 1, 1); ctx.fillRect(x + 5, y - 4, 1, 1);
}
function drawUfo(ctx, x, y, t) {
  const hy = y - 60 + Math.sin(t * 3) * 4 + Math.max(0, 30 - t * 20);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, hy, 0, y + 10);
  g.addColorStop(0, 'rgba(160,255,120,0.5)'); g.addColorStop(1, 'rgba(160,255,120,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 8, hy + 4); ctx.lineTo(x + 8, hy + 4); ctx.lineTo(x + 26, y + 12); ctx.lineTo(x - 26, y + 12); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#6a6a7a'; ctx.beginPath(); ctx.ellipse(x, hy, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a0dcf0'; ctx.beginPath(); ctx.ellipse(x, hy - 4, 9, 6, 0, Math.PI, 0); ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = (Math.floor(t * 8) + i) % 3 ? '#ffd23f' : '#ff3cc8'; ctx.fillRect(Math.round(x - 18 + i * 7), Math.round(hy), 2, 2); }
}

// ------------------------------------------------------------ availability
export function sideAvailable() {
  const s = G.state;
  return SIDE.filter((m) => !s.done.includes(m.id) && (s.freeMode || s.chapter >= m.minChapter) && (m.zone === 'colonia' || s.unlocked[m.zone]))
    .map((m) => { m.pos ||= spot(m.at[0], m.at[1]); return m; });
}
void MAP; void rand;
