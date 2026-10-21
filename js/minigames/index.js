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
import { roulette, blackjack, poker, horses, slots } from './casino.js';

const FACTORY = { kart, range, loteria, costume, carmarket, drill, roulette, blackjack, poker, horses, slots };

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
    // full-screen games get the whole screen: the gameplay HUD hides until they're done
    if (!mg.overlay && G.ui) { this.hudWas = G.ui.hud; G.ui.hud = false; }
    this.active = mg;
    return mg;
  },
  update(dt) {
    const a = this.active;
    if (!a) return;
    a.update(dt);
    if (a.done) { this.active = null; if (!a.overlay && G.ui && this.hudWas !== undefined) { G.ui.hud = this.hudWas; this.hudWas = undefined; } }
  },
  render(ctx) { if (this.active) this.active.render(ctx); },
  // drop whatever is running (death, mission fail, quitting) and give the HUD back
  stop() { this.active = null; if (G.ui && this.hudWas !== undefined) { G.ui.hud = this.hudWas; this.hudWas = undefined; } },
  get fullscreen() { return this.active && !this.active.overlay; },
};

export function* play(name, opts) {
  const mg = minigames.start(name, opts);
  while (mg && !mg.done) yield;
  return mg ? mg.result : null;
}
