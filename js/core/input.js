// Keyboard + gamepad + touch → abstract actions.
// Actions: up down left right a b run phone weapon pause back
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyE: 'a', Enter: 'a', NumpadEnter: 'a',
  Space: 'b', KeyJ: 'b', KeyK: 'b',
  ShiftLeft: 'run', ShiftRight: 'run',
  Tab: 'phone', KeyT: 'phone',
  KeyQ: 'weapon',
  KeyM: 'map',
  Escape: 'pause', KeyP: 'pause',
  Backspace: 'back',
};

const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b', 'run', 'phone', 'weapon', 'pause', 'back', 'map'];

class Input {
  constructor() {
    this.keys = {};       // physical key states by action
    this.touch = {};      // touch button states
    this.pad = {};        // gamepad states
    this.cur = {};
    this.prev = {};
    this.ax = 0; this.ay = 0;          // analog movement vector
    this.stick = { x: 0, y: 0, on: false };
    this.typed = '';
    this.lastDevice = 'keyboard';
    this.anyPressed = false;
    this.onFirstGesture = null;
    this.isTouch = false;
    ACTIONS.forEach((a) => { this.cur[a] = false; this.prev[a] = false; });
  }

  init() {
    window.addEventListener('keydown', (e) => {
      const act = KEYMAP[e.code];
      if (act) { this.keys[act] = true; e.preventDefault(); }
      if (e.key && e.key.length === 1 && /[a-zA-Z0-9ñÑ]/.test(e.key)) {
        this.typed = (this.typed + e.key.toUpperCase()).slice(-24);
      }
      this.lastDevice = 'keyboard';
      this.gesture();
    });
    window.addEventListener('keyup', (e) => {
      const act = KEYMAP[e.code];
      if (act) { this.keys[act] = false; e.preventDefault(); }
    });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('pointerdown', () => this.gesture());
    this.setupTouch();
  }

  gesture() {
    this.anyPressed = true;
    if (this.onFirstGesture) { const f = this.onFirstGesture; this.onFirstGesture = null; f(); }
  }

  setupTouch() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.isTouch = isTouch;
    const root = document.getElementById('touch');
    if (!isTouch || !root) return;
    root.hidden = false;
    const stick = document.getElementById('stick');
    const knob = document.getElementById('knob');
    let sid = null;
    const moveStick = (t) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      this.stick.x = dx; this.stick.y = dy; this.stick.on = true;
      knob.style.transform = `translate(${dx * 70}%, ${dy * 70}%)`;
    };
    stick.addEventListener('touchstart', (e) => {
      e.preventDefault(); this.gesture(); this.lastDevice = 'touch';
      const t = e.changedTouches[0]; sid = t.identifier; moveStick(t);
    }, { passive: false });
    stick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === sid) moveStick(t);
    }, { passive: false });
    const endStick = (e) => {
      for (const t of e.changedTouches) if (t.identifier === sid) {
        sid = null; this.stick.x = 0; this.stick.y = 0; this.stick.on = false; knob.style.transform = '';
      }
    };
    stick.addEventListener('touchend', endStick);
    stick.addEventListener('touchcancel', endStick);

    root.querySelectorAll('button[data-k]').forEach((b) => {
      const k = b.dataset.k;
      const down = (e) => { e.preventDefault(); this.gesture(); this.lastDevice = 'touch'; this.touch[k] = true; b.classList.add('on'); };
      const up = (e) => { e.preventDefault(); this.touch[k] = false; b.classList.remove('on'); };
      b.addEventListener('touchstart', down, { passive: false });
      b.addEventListener('touchend', up, { passive: false });
      b.addEventListener('touchcancel', up, { passive: false });
    });
  }

  pollPad() {
    this.pad = {};
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let px = 0, py = 0;
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.25) px = ax;
      if (Math.abs(ay) > 0.25) py = ay;
      const map = {
        a: b(0), b: b(2) || b(7), back: b(1), phone: b(3), pause: b(9), weapon: b(5) || b(4), run: b(6) || b(10), map: b(8),
        up: b(12) || ay < -0.5, down: b(13) || ay > 0.5, left: b(14) || ax < -0.5, right: b(15) || ax > 0.5,
      };
      for (const k in map) if (map[k]) { this.pad[k] = true; this.lastDevice = 'pad'; this.gesture(); }
    }
    return { px, py };
  }

  update() {
    const { px, py } = this.pollPad();
    for (const a of ACTIONS) {
      this.prev[a] = this.cur[a];
      this.cur[a] = !!(this.keys[a] || this.touch[a] || this.pad[a]);
    }
    // touch stick → directions
    if (this.stick.on) {
      const s = this.stick;
      if (s.y < -0.4) this.cur.up = true;
      if (s.y > 0.4) this.cur.down = true;
      if (s.x < -0.4) this.cur.left = true;
      if (s.x > 0.4) this.cur.right = true;
      if (Math.hypot(s.x, s.y) > 0.92) this.cur.run = true;
    }
    // analog vector
    let ax = 0, ay = 0;
    if (this.stick.on && Math.hypot(this.stick.x, this.stick.y) > 0.2) { ax = this.stick.x; ay = this.stick.y; }
    else if (px || py) { ax = px; ay = py; }
    else {
      ax = (this.cur.right ? 1 : 0) - (this.cur.left ? 1 : 0);
      ay = (this.cur.down ? 1 : 0) - (this.cur.up ? 1 : 0);
      const m = Math.hypot(ax, ay); if (m > 1) { ax /= m; ay /= m; }
    }
    this.ax = ax; this.ay = ay;
  }

  down(a) { return this.cur[a]; }
  pressed(a) { return this.cur[a] && !this.prev[a]; }
  released(a) { return !this.cur[a] && this.prev[a]; }
  // confirm / cancel helpers for menus
  ok() { return this.pressed('a'); }
  cancel() { return this.pressed('back') || this.pressed('b') || this.pressed('pause'); }
  consume(a) { this.prev[a] = true; this.cur[a] = true; }
  clearTyped() { this.typed = ''; }
}

export const input = new Input();
