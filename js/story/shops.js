// Clothes, sneakers, restaurants and bars: what you can do inside each business.
import { G } from '../core/game.js';
import { audio } from '../core/audio.js';
import { UI } from '../ui/ui.js';
import { LOOKS } from '../data/cast.js';
import { clearLookCache } from '../data/sprites.js';
import { SHOPS, OUTFITS, SHOES, MENUS } from '../data/shops.js';
import { runner, say, ask } from './script.js';
import { pick, money } from '../core/util.js';

export const SHOP_BY_ID = Object.fromEntries(SHOPS.map((s) => [s.id, s]));
const OWNER = { moda: 'chayo', veloz: 'flash', pollos: 'donpollo', guero: 'guero', boutique: 'lulu', sushi: 'chef', sneakers: 'brayan', ancla: 'guera', sirena: 'chema' };

// Kazoo's clothes and sneakers are applied straight onto his look, so every sprite
// (city, interiors, portraits) picks them up.
const BASE = { ...LOOKS.kazoo };
export function applyOutfit() {
  const s = G.state;
  if (!s) return;
  const o = OUTFITS.find((q) => q.id === s.outfit) || OUTFITS[0];
  const sh = SHOES.find((q) => q.id === s.shoes) || SHOES[0];
  Object.assign(LOOKS.kazoo, { shirt: o.shirt, pants: o.pants, tie: o.tie || undefined, shoes: sh.color });
  if (o.id === 'normal') LOOKS.kazoo.shirt = BASE.shirt;
  clearLookCache('kazoo');
}
export function shoeSpeed() {
  const sh = SHOES.find((q) => q.id === G.state?.shoes);
  return sh ? sh.speed : 1;
}

function pay(price) {
  const s = G.state;
  if (s.money < price) { UI.toast('No te alcanza', '#d8323c', 2); audio.sfx('jam'); return false; }
  s.money -= price; audio.sfx('coin'); s.stats.shopping = (s.stats.shopping || 0) + price;
  return true;
}
function heal(n) {
  const r = G.scenes.interior;
  r.p.hp = Math.min(100, r.p.hp + n);
  UI.toast(`+${n} vida`, '#46d470', 1.5);
}

export function populateShop(r, id) {
  const sh = SHOP_BY_ID[id];
  const who = OWNER[id];
  r.addNpc({ id: who, look: who, x: 262, facing: -1, onTalk: () => { if (!G.story.active || G.story.active.m.allowShops) runner.run(menu(sh, who), 'shop'); } });
  if (sh.kind === 'restaurante') { r.addNpc({ look: 5, x: 94, facing: 1, pose: 'sit', y: 148 }); r.addNpc({ look: 22, x: 134, facing: -1, pose: 'sit', y: 148 }); }
  if (sh.kind === 'bar') { r.addNpc({ look: 11, x: 222, facing: 1 }); r.addNpc({ look: 27, x: 90, facing: -1 }); }
}

function* menu(sh, who) {
  if (sh.kind === 'ropa') yield* clothes(sh, who);
  else if (sh.kind === 'zapateria') yield* sneakers(sh, who);
  else if (sh.kind === 'restaurante') yield* food(sh, who);
  else yield* bar(sh, who);
}

function* clothes(sh, who) {
  const s = G.state;
  const list = OUTFITS.filter((o) => (!o.boutique || sh.fancy) && (!o.locked || s[o.locked]));
  const owned = s.outfits || (s.outfits = ['normal']);
  const hi = sh.fancy ? 'Bienvenido a Boutique Vicio. Aquí vestimos a gente importante. ¿Tú eres importante? ...Bueno, pásale.' : '¡Pásale, güero! Todo de temporada. De qué temporada, no te sé decir.';
  const c = yield* ask(who, hi, [...list.map((o) => `${o.name} ${s.outfit === o.id ? '(puesto)' : owned.includes(o.id) || !o.price ? '' : money(o.price)}`), 'Nada'], 'happy');
  if (c >= list.length) return;
  const o = list[c];
  if (!owned.includes(o.id) && o.price) { if (!pay(o.price)) return; owned.push(o.id); }
  s.outfit = o.id; applyOutfit();
  UI.flash(0.4); audio.sfx('select');
  // new clothes: the police have a harder time recognizing you
  const city = G.scenes.city;
  if (city.wanted > 0 && !city.wantedLocked) { city.setWanted(city.wanted - 1); UI.toast('Ropa nueva: -1 estrella', '#46d470', 2.5); }
  yield* say(who, pick(['¡Te ves otro! Literal, ni te reconozco.', 'Eso. Así sí sales en la foto.', 'Mírate nomás. Hasta pareces de dinero.']), 'happy');
}

function* sneakers(sh, who) {
  const s = G.state;
  const owned = s.shoesOwned || (s.shoesOwned = ['normal']);
  const hi = sh.id === 'sneakers' ? 'Qué onda, bro. Aquí puro tenis de colección. Unos son originales.' : '¡Tenis El Veloz! Con estos corres más que tu casero. Garantizado o no.';
  const c = yield* ask(who, hi, [...SHOES.map((o) => `${o.name} ${s.shoes === o.id || (!s.shoes && o.id === 'normal') ? '(puestos)' : owned.includes(o.id) ? '' : money(o.price)}`), 'Nada'], 'happy');
  if (c >= SHOES.length) return;
  const o = SHOES[c];
  if (!owned.includes(o.id) && o.price) { if (!pay(o.price)) return; owned.push(o.id); }
  s.shoes = o.id; applyOutfit();
  audio.sfx('select');
  if (o.speed > 1) UI.toast(`Corres ${Math.round((o.speed - 1) * 100)}% más rápido`, '#5adcf0', 3);
  yield* say(who, o.id === 'pro' ? 'Esos los usó un futbolista. O su primo. Alguien famoso.' : 'Ándale, pruébalos. Si te quedan chicos, se aflojan.', 'happy');
}

function* food(sh, who) {
  const s = G.state;
  const items = MENUS[sh.menu];
  const hi = { pollo: '¡Pollos El Alegre! El pollo más feliz de PV. Bueno, estaba.', sushi: 'Irasshaimase. Así se dice. Creo. ¿Qué vas a querer?', mariscos: '¡Pásale, mijo! Todo fresco. Lo pescó mi compadre. Ayer. O antier.' }[sh.menu];
  const c = yield* ask(who, hi, [...items.map(([n, p]) => `${n} (${money(p)})`), 'Nada'], 'happy');
  if (c >= items.length) return;
  const [n, p, hp] = items[c];
  if (!pay(p)) return;
  heal(hp);
  s.stats.meals = (s.stats.meals || 0) + 1;
  yield* say('kazoo', pick(['Mmm. Esto sí es vida.', 'Con esto aguanto otro día sin pagarle a Don Chuy.', `${n}... cinco estrellas. No, cuatro. No soy fácil.`]), 'happy');
}

function* bar(sh, who) {
  const s = G.state;
  const c = yield* ask(who, sh.id === 'sirena' ? 'Bienvenido a bordo, marinero. Aquí el que no toma, se hunde.' : '¿Qué te sirvo? La primera es cara, las demás también.', ['Una cerveza ($40)', 'Jugar dominó ($50)', 'Un chisme', 'Nada'], 'normal');
  if (c === 0) {
    if (!pay(40)) return;
    heal(10);
    G.drunkT = Math.min(60, (G.drunkT || 0) + 25);
    yield* say('kazoo', pick(['Salud. Por el plan.', '...Está tibia. Como mis decisiones.', 'Una y ya. Bueno, una y media.']), 'happy');
  } else if (c === 1) {
    if (!pay(50)) return;
    const win = Math.random() < 0.45;
    if (win) { s.money += 110; audio.sfx('pass'); yield* say(who, '¡Capicúa! Ganaste $110. Ni modo. Llévatelos antes de que me arrepienta.', 'shock'); }
    else yield* say(who, 'Zapatero. Perdiste. El dominó no perdona, y yo tampoco.', 'smug');
  } else if (c === 2) {
    yield* say(who, pick(TIPS), 'normal');
  }
}

const TIPS = [
  'Por la ciudad hay corazones tirados. No preguntes. Te curan.',
  'Dicen que alguien deja chalecos antibalas en callejones. Si ves uno azul, agárralo.',
  'Si traes a la tira atrás, busca una estrella verde. Es un "arreglo" con un policía. No te dije nada.',
  'Hay un señor en la plaza que dice que el mundo se acaba. Lleva diciendo eso desde 1999.',
  'Una señora de La Colonia anda buscando su gato. Paga bien. El gato no.',
  'Un wey con máscara de luchador reta a todo el que pasa. Nunca ha ganado.',
  'Cambiarte de ropa confunde a la policía. De verdad. Son así de listos.',
  'Unos tenis buenos te hacen correr más. Me lo dijo mi primo, que corre de todo.',
];
