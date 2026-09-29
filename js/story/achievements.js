import { G } from '../core/game.js';
import { audio } from '../core/audio.js';
import { saveGlobal } from '../core/save.js';

export const ACHIEVEMENTS = [
  { id: 'oferta', name: 'Estaba en oferta', desc: 'Compra el Tsuru en el Marketplace.' },
  { id: 'realq', name: 'Real question', desc: 'Elige la opción más tonta 10 veces.' },
  { id: 'feo', name: 'Pues me apuntó muy feo', desc: 'Puntaje perfecto en el campo de tiro.' },
  { id: 'again', name: 'Oh shit here we go again', desc: 'Falla la misma misión 3 veces.' },
  { id: 'bro', name: 'Dont do this bro', desc: 'Llega a 5 estrellas de búsqueda.' },
  { id: 'paalla', name: "Pa' allá", desc: 'Visita EL CAMPO antes del capítulo 6.' },
  { id: 'fin', name: 'El carro no tenía estrellas', desc: 'Termina la historia.' },
  { id: 'losabia', name: 'Lo sabía', desc: 'Junta las 10 estrellas doradas.' },
  { id: 'repartidor', name: 'Repartidor del mes', desc: 'Completa 15 repartos para Doña Mari.' },
  { id: 'deuda', name: 'Libre de Don Chuy', desc: 'Paga toda la deuda.' },
  { id: 'tags', name: 'KazooGod02 estuvo aquí', desc: 'Pinta los 20 grafitis.' },
  { id: 'cassettes', name: 'Melómano', desc: 'Encuentra los 15 cassettes.' },
  { id: 'kazoos', name: 'Sinfonía', desc: 'Encuentra los 5 kazoos.' },
  { id: 'teaser', name: 'Ya vi el teaser', desc: 'Mira la tele del bar o la taquería 10 segundos.' },
  { id: 'kart', name: 'Piloto de Kazoo Kart', desc: 'Haz 5,000 puntos en Kazoo Kart.' },
  { id: 'tramposo', name: 'Tramposo', desc: 'Usa un truco.' },
  { id: 'pinta', name: 'Pinta y olvida', desc: 'Pierde a la policía en un Pinta y Olvida.' },
  { id: 'shopper', name: 'Adicto al Marketplace', desc: 'Compra 10 cosas en el Marketplace.' },
  { id: 'lotería', name: '¡Lotería!', desc: 'Gana una partida de lotería con Doña Mari.' },
  { id: 'speed', name: 'Speedrunner', desc: 'Termina la historia en menos de 1:30:00.' },
];

export function unlock(id) {
  const s = G.state;
  if (!s || s.achievements.includes(id)) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  s.achievements.push(id);
  if (G.global && !G.global.achievements.includes(id)) { G.global.achievements.push(id); saveGlobal(G.global); }
  audio.sfx('star');
  G.ui?.toast('★ LOGRO: ' + a.name, '#ffd23f', 4);
}
