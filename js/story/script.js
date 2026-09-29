// Coroutine runner + scripting helpers used by every mission.
import { G, setScene, emit } from '../core/game.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { UI } from '../ui/ui.js';
import { dist } from '../core/util.js';

export class MissionFail extends Error { constructor(reason) { super(reason); this.reason = reason; } }

export const runner = {
  tasks: [],
  run(it, name = '') { const t = { it, name, done: false }; this.tasks.push(t); return t; },
  update(dt) {
    for (const t of this.tasks.slice()) {
      if (t.done) continue;
      try {
        const r = t.it.next(dt);
        if (r.done) { t.done = true; t.result = r.value; if (t.onDone) t.onDone(r.value); }
      } catch (e) {
        t.done = true; t.error = e;
        if (!(e instanceof MissionFail)) console.error('[script]', t.name, e);
        if (t.onError) t.onError(e);
      }
    }
    this.tasks = this.tasks.filter((t) => !t.done);
  },
  cancel(t) { if (!t || t.done) return; t.done = true; try { t.it.return(); } catch { /* ignore */ } },
  cancelWhere(fn) { for (const t of this.tasks) if (fn(t)) this.cancel(t); },
};

// ------------------------------------------------------------------ helpers (generators)
export function* wait(sec) { let t = 0; while (t < sec) t += yield; }
export function* until(pred, timeout = Infinity) { let t = 0; while (!pred()) { t += yield; if (t > timeout) return false; } return true; }
export function* frame() { yield; }

export function* say(who, text, expr = 'normal', opts = {}) {
  UI.say(who, text, { expr, ...opts });
  const d = UI.dialog;
  while (UI.dialog === d) yield;
}
// multiple lines: talk([['kazoo','hola','happy'], ...])
export function* talk(lines) { for (const l of lines) yield* say(l[0], l[1], l[2] || 'normal', l[3] || {}); }
export function* narr(text, name = '') { yield* say('narrator', text, 'normal', { name }); }
export function* ask(who, text, choices, expr = 'normal') {
  UI.say(who, text, { expr, choices });
  const d = UI.dialog;
  while (UI.dialog === d) yield;
  return UI.lastChoice;
}
export function* fadeOut(t = 0.6) { UI.fadeSpeed = 1 / t; UI.fadeTarget = 1; while (UI.fade < 0.99) yield; }
export function* fadeIn(t = 0.6) { UI.fadeSpeed = 1 / t; UI.fadeTarget = 0; while (UI.fade > 0.01) yield; }
export function cutscene(on) {
  UI.letterboxTarget = on ? 1 : 0;
  if (on) G.lockInput = (G.lockInput || 0) + 1; else G.lockInput = Math.max(0, (G.lockInput || 0) - 1);
}
export function lock(on) { if (on) G.lockInput = (G.lockInput || 0) + 1; else G.lockInput = Math.max(0, (G.lockInput || 0) - 1); }
export function* card(title, sub, t = 3, style = 'pass') { UI.showCard(title, sub, t, style); yield* wait(t); }
export function* chapterCard(sub, title) {
  UI.showCard(title, sub, 4, 'chapter'); audio.sfx('star'); yield* wait(4);
}
export function objective(text) { UI.setObjective(text); }
export function toast(text, col, t) { UI.toast(text, col, t); }

export function toCity(opts) { setScene('city', opts); }
export function toRoom(room, opts = {}) { setScene('interior', { room, ...opts }); }

export function city() { return G.scenes.city; }
export function room() { return G.scenes.interior; }

// Place a GTA-style marker and wait until the player reaches it.
export function* goTo(x, y, opts = {}) {
  const c = city();
  const m = c.addMarker({ x, y, r: opts.r || (opts.needCar ? 22 : 14), color: opts.color || '#ffd23f', label: opts.label, needCar: opts.needCar, letter: opts.letter });
  if (opts.objective) objective(opts.objective);
  try {
    while (!m.inside || G.scene !== c) {
      yield;
      if (opts.check) opts.check();
    }
  } finally { c.removeMarker(m); }
  return true;
}

export function* walkNpc(n, x, speed = 40) {
  n.goal = { x, speed };
  while (n.goal) yield;
}
export function* walkPlayer(x, speed = 50) {
  const p = room().p; p.goal = { x, speed };
  while (p.goal) yield;
}
// city ped walking (top-down)
export function* pedTo(ped, x, y, speed = 45) {
  let arrived = false;
  ped.state = 'goto'; ped.goal = { x, y, speed, onArrive: () => { arrived = true; } };
  let t = 0;
  while (!arrived) { t += yield; if (t > 20) { ped.x = x; ped.y = y; ped.state = 'idle'; break; } }
}

export function music(name) { G.musicOverride = name; }
export function sfx(name, o) { audio.sfx(name, o); }

// Phone: group chat + notifications
export function chat(from, text, priv = false) {
  const s = G.state;
  (priv ? s.chatPriv : s.chat).push({ from, text, day: s.day });
  audio.sfx('notify');
  G.phoneBadge = (G.phoneBadge || 0) + 1;
  UI.toast('✉ ' + (priv ? 'PRIVADO' : 'LOS DEL PLAN') + ': ' + from.toUpperCase(), '#5adcf0', 2.5);
}
export function notify(title, text) {
  G.state.notes.push({ title, text, day: G.state.day });
  audio.sfx('phone');
  UI.toast('✉ ' + title, '#5adcf0', 3);
}

export function setClock(h, m = 0) { G.state.clock = h * 60 + m; }
export function setDay(d) { G.state.day = d; }
export function addMoney(n) { G.state.money = Math.max(0, G.state.money + n); if (n > 0) audio.sfx('coin'); UI.toast((n >= 0 ? '+$' : '-$') + Math.abs(n), n >= 0 ? '#46d470' : '#d8323c', 1.5); }
export function trust(n) { G.state.trust = Math.max(0, Math.min(100, G.state.trust + n)); }
export function flag(k, v = true) { G.state.flags[k] = v; }
export function has(k) { return !!G.state.flags[k]; }

// wait while player is within distance of a point in city (for escort etc.)
export function nearPlayer(x, y, r) { const p = city().pos(); return dist(p.x, p.y, x, y) < r; }

export function* waitKey() { while (!input.pressed('a')) yield; input.consume('a'); }

export function emitStory(ev, ...a) { emit(ev, ...a); }
