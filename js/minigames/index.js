// Minigame host. Full-screen games replace the scene; overlays draw on top.
import { G } from '../core/game.js';
import { runner } from '../story/script.js';
import { kart } from './kart.js';
import { range } from './range.js';
import { loteria } from './loteria.js';
import { costume } from './costume.js';
import { carmarket } from './carmarket.js';
import { drill } from './drill.js';
import { deliverySession } from './delivery.js';

const FACTORY = { kart, range, loteria, costume, carmarket, drill };

export const minigames = {
  active: null,
  start(name, opts = {}) {
    if (name === 'delivery') {
      if (G.story?.active) { G.ui?.toast('Termina lo que estás haciendo primero', '#f4f4f0', 2); return null; }
      if (G.deliveryTask && !G.deliveryTask.done) return null;
      G.deliveryTask = runner.run(deliverySession(), 'delivery');
      return G.deliveryTask;
    }
    const mg = FACTORY[name](opts);
    mg.name = name;
    this.active = mg;
    return mg;
  },
  update(dt) {
    const a = this.active;
    if (!a) return;
    a.update(dt);
    if (a.done) this.active = null;
  },
  render(ctx) { if (this.active) this.active.render(ctx); },
  get fullscreen() { return this.active && !this.active.overlay; },
};

export function* play(name, opts) {
  const mg = minigames.start(name, opts);
  while (mg && !mg.done) yield;
  return mg ? mg.result : null;
}
