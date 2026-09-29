// Global game singleton shared by every module.
export const W = 320;
export const H = 180;
export const TS = 16;

export const G = {
  canvas: null,
  ctx: null,
  time: 0,          // seconds since boot
  frame: 0,
  scene: null,      // active scene { enter, exit, update, render, name }
  scenes: {},       // registered scenes
  state: null,      // persistent story state (see story/state.js)
  settings: null,
  lockInput: 0,     // >0 when cutscene/dialog blocks player control
  paused: false,
  cheatsUsed: false,
  res: 1,           // internal resolution multiplier of the main canvas
};

export function setScene(name, arg) {
  const next = G.scenes[name];
  if (!next) throw new Error('Unknown scene ' + name);
  if (G.scene && G.scene.exit) G.scene.exit(next);
  G.scene = next;
  if (next.enter) next.enter(arg);
}

// simple pub/sub for decoupled systems
const listeners = {};
export function on(ev, fn) { (listeners[ev] ||= []).push(fn); }
export function emit(ev, ...args) { (listeners[ev] || []).forEach((f) => f(...args)); }
