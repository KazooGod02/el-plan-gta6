// Repartos de Doña Mari (side activity + prologue tutorial).
import { G, setScene } from '../core/game.js';
import { UI } from '../ui/ui.js';
import { audio } from '../core/audio.js';
import { MAP, TS, zoneOf } from '../world/map.js';
import { pick, dist } from '../core/util.js';
import { wait, goTo, say, objective, addMoney } from '../story/script.js';
import { unlock } from '../story/achievements.js';

const CUSTOMERS = [
  'Sr. Pérez', 'La Güera', 'Don Toño', 'Familia López', 'El Profe', 'Doña Chela', 'Los del taller', 'La vecina del perro',
  'Un tal "Pancho"', 'El gym de la esquina', 'Oficina 3B', 'Los gemelos', 'La tía de alguien',
];
const COMPLAINTS = ['¡Llegó frío!', '¿Esto es un taco o una cobija?', 'Le voy a dejar 2 estrellas.', 'Tarde. Como siempre.'];
const THANKS = ['¡Gracias, Kazoo!', 'Quédate con el cambio. Ah, no hay cambio.', '¡5 estrellas!', 'Huele increíble.', '¿Me traes otro mañana?'];

export function randomDestination(from) {
  const s = G.state;
  const ok = (b) => b.generic && b.door && (zoneOf(b.door.x, b.door.y) === 'colonia' || (s.unlocked.centro && zoneOf(b.door.x, b.door.y) === 'centro'));
  const cands = MAP.buildings.filter((b) => ok(b) && tileFree(b.door.x, b.door.y + 1));
  const far = cands.filter((b) => { const d = dist(b.door.x * TS, b.door.y * TS, from.x, from.y); return d > 350 && d < 1400; });
  const b = pick(far.length ? far : cands);
  return { x: b.door.x * TS + 8, y: (b.door.y + 1) * TS + 8, name: pick(CUSTOMERS) };
}
function tileFree(x, y) { const t = MAP.tiles[y * 176 + x]; return t === 2 || t === 14 || t === 0; }

// one delivery; returns {ok, pay}
export function* deliverOne(opts = {}) {
  const c = G.scenes.city;
  const from = c.pos();
  const d = randomDestination(from);
  const secs = Math.round(dist(from.x, from.y, d.x, d.y) / 85 + (opts.bonusTime ?? 18));
  UI.timer = { label: 'REPARTO', t: secs };
  objective(`Lleva los tacos con ${d.name}`);
  let late = false;
  yield* goTo(d.x, d.y, { label: d.name, color: '#46d470', check: () => { if (!G.paused) UI.timer.t -= 1 / 60; if (UI.timer.t <= 0) late = true; } });
  const left = Math.max(0, UI.timer.t);
  UI.timer = null;
  const pay = late ? 15 : 35 + Math.round(left * 1.5);
  if (late) UI.toast(pick(COMPLAINTS), '#d8323c', 2.5); else UI.toast(pick(THANKS), '#46d470', 2.5);
  addMoney(pay);
  G.state.deliveries++; G.state.stats.delivered = G.state.deliveries;
  if (G.state.deliveries >= 15) unlock('repartidor');
  return { ok: !late, pay };
}

// free-roam delivery session: 3 deliveries
export function* deliverySession() {
  const c = G.scenes.city;
  const tq = MAP.places.taqueria;
  setScene('city', { x: tq.x, y: tq.y + 6, a: Math.PI / 2 });
  const hasCar = c.vehicles.some((v) => !v.dead && dist(v.x, v.y, tq.x, tq.y) < 60 && v.type === 'moto');
  if (!hasCar) { const m = c.spawnVehicle('moto', tq.x + 22, tq.y + 20, 0, { color: '#d8323c' }); m.label = 'MOTO'; setTimeout(() => (m.label = null), 6000); }
  UI.toast('Repartos: 3 pedidos. ¡Rápido que se enfrían!', '#ffd23f', 3);
  let total = 0;
  for (let i = 0; i < 3; i++) {
    const r = yield* deliverOne();
    total += r.pay;
    if (!r.ok) break;
    if (i < 2) { UI.toast(`Siguiente pedido (${i + 2}/3)...`, '#f4f4f0', 2); yield* wait(1.5); }
  }
  objective('');
  UI.toast(`Repartos terminados: ${'$' + total}`, '#46d470', 3);
  audio.sfx('pass');
}
