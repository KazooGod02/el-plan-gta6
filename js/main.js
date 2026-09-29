// EL PLAN — boot + main loop.
import { G, W, H, setScene } from './core/game.js';
import { input } from './core/input.js';
import { audio } from './core/audio.js';
import * as font from './core/font.js';
import { loadSettings, loadGlobal, saveSettings } from './core/save.js';
import { city } from './world/city.js';
import { interior } from './interior/interior.js';
import { UI } from './ui/ui.js';
import { phone } from './ui/phone.js';
import { bigmap } from './ui/bigmap.js';
import { title, pause, credits } from './ui/menus.js';
import { story, radioNext } from './story/story.js';
import { runner } from './story/script.js';
import { minigames } from './minigames/index.js';
import { unlock } from './story/achievements.js';
import { RADIO_STATIONS, NEWS } from './data/strings.js';
import { MAP } from './world/map.js';
import { pick } from './core/util.js';
import { finale } from './story/finale.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
G.canvas = canvas; G.ctx = ctx;
G.settings = loadSettings();
G.global = loadGlobal();
G.ui = UI; G.story = story; G.phone = phone; G.bigmap = bigmap; G.radioNext = radioNext; G.minigames = minigames;
G.scenes = { title, city, interior, credits, finale };
audio.setVolumes(G.settings.music, G.settings.sfx);

// The game is laid out in 320x180 logical pixels but drawn at a higher internal
// resolution (G.res = 2..4) so text and sprites stay crisp at any screen size.
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const s = Math.min(vw / W, vh / H);
  const dpr = window.devicePixelRatio || 1;
  const res = Math.max(2, Math.min(4, Math.ceil(s * dpr - 0.05)));
  if (res !== G.res) { G.res = res; canvas.width = W * res; canvas.height = H * res; }
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  // shrinking a bigger buffer looks best smoothed; growing it looks best as crisp pixels
  canvas.style.imageRendering = res > s * dpr + 0.01 ? 'auto' : 'pixelated';
  const rot = document.getElementById('rotate');
  if (rot) rot.hidden = !(input.isTouch && vh > vw);
}
window.addEventListener('resize', resize);

// ------------------------------------------------------------------ flow
G.startNew = (free = false) => {
  story.init();
  story.newGame(free);
  if (free) {
    const s = G.state;
    s.unlocked = { centro: true, puerto: true, afueras: true }; city.setUnlocked(s.unlocked);
    s.done = []; s.chapter = 9; s.chapterName = 'MODO LIBRE'; s.day = -1; s.money = 2000; s.weapons = { pistol: 60 }; s.flags.free = true;
    const p = MAP.places.pension;
    setScene('city', { x: p.x, y: p.y + 8, a: Math.PI / 2 });
    UI.hud = true; UI.fade = 1; UI.fadeTarget = 0;
    story.refreshTriggers(false);
    UI.toast('MODO LIBRE: toda la ciudad abierta', '#ffd23f', 4);
    return;
  }
  UI.hud = true;
  story.refreshTriggers(true);
};
G.startLoad = (slot) => {
  story.init();
  UI.hud = true;
  if (!story.loadGame(slot)) { UI.toast('No se pudo cargar', '#d8323c', 2); }
};
G.quitToTitle = () => {
  runner.cancelWhere(() => true);
  story.active = null;
  minigames.active = null;
  G.lockInput = 0; G.paused = false; G.musicOverride = null; G.forceDark = undefined; G.drunkT = 0;
  UI.dialog = null; UI.timer = null; UI.meter = null; UI.card = null; UI.letterboxTarget = 0; UI.letterbox = 0; UI.objective = '';
  setScene('title');
};

// ------------------------------------------------------------------ cheats
const CHEATS = {
  CINCOESTRELLAS: () => { city.wanted = 5; city.evadeT = 0; },
  TSURITO: () => { const p = city.pos(); const v = city.spawnVehicle('tsuru', p.x + 30, p.y, 0, { color: '#d8d8d0' }); v.hp = v.maxHp = 999; },
  NOSEWEY: () => { G.cheatNoSe = !G.cheatNoSe; },
  PAALLA: () => { if (!G.state.unlocked.afueras) return 'Todavía no puedes ir pa\' allá'; const a = MAP.places.campo; if (city.player.car) city.exitCar(true); city.teleport(a.x, a.y); },
  KAZOOGOD: () => { G.cheatGod = !G.cheatGod; },
  BALAS: () => { G.cheatAmmo = true; G.state.weapons.pistol ??= 0; G.state.weapons.shotgun ??= 0; },
  SINPOLICIA: () => { city.wanted = 0; city.noPolice = !city.noPolice; },
  VOLADOR: () => { G.cheatFast = !G.cheatFast; },
};
function checkCheats() {
  const t = input.typed;
  if (!t || !G.state || G.scene !== city) return;
  for (const code in CHEATS) {
    if (t.endsWith(code)) {
      input.clearTyped();
      const err = CHEATS[code]();
      if (typeof err === 'string') { UI.toast(err, '#d8323c', 2); return; }
      G.cheatsUsed = true; G.state.flags.cheats = true;
      UI.toast('TRUCO ACTIVADO: ' + code, '#ff3cc8', 2.5); audio.sfx('star');
      unlock('tramposo');
      return;
    }
  }
}

// ------------------------------------------------------------------ radio overlay
let tickerX = W, tickerText = '';
function drawRadio(c) {
  if (G.scene !== city || !city.player.car || !G.state) return;
  const st = RADIO_STATIONS[G.state.radio % RADIO_STATIONS.length];
  if (G.radioShowT > 0) {
    G.radioShowT -= 1 / 60;
    const a = Math.min(1, G.radioShowT * 2);
    c.globalAlpha = a;
    font.text(c, '♪ ' + st.name, 190, H - 62, '#ffd23f', { align: 'center', outline: '#101018' });
    if (st.dj) font.text(c, st.dj, 190, H - 52, '#f4f4f0', { align: 'center', outline: '#101018' });
    c.globalAlpha = 1;
  }
  if (st.id === 'news' && !UI.dialog) {
    if (!tickerText || tickerX < -font.measure(tickerText)) {
      const pool = [...NEWS.always, ...(NEWS.bychapter[G.state.chapter] || []), ...(NEWS.bychapter[G.state.chapter] || []), ...(city.wanted ? NEWS.wanted : [])];
      tickerText = '📻 RADIO NOTICIAS PV — '.replace('📻 ', '') + pick(pool); tickerX = W;
    }
    tickerX -= 0.7;
    c.save(); c.beginPath(); c.rect(64, H - 34, W - 64, 11); c.clip();
    c.fillStyle = 'rgba(10,10,20,0.8)'; c.fillRect(64, H - 34, W - 64, 11);
    font.text(c, tickerText, Math.round(tickerX), H - 32, '#fff08c');
    c.restore();
  }
}

// ------------------------------------------------------------------ loop
let last = performance.now(), acc = 0;
const STEP = 1 / 60;

function tick(dt) {
  input.update();
  const inGame = G.scene === city || G.scene === interior;
  if (minigames.fullscreen) { minigames.update(dt); runner.update(dt); story.update(dt); return; }
  if (bigmap.open) { bigmap.update(dt); return; }
  if (inGame && !minigames.active && !pause.open && !phone.open && !UI.dialog && input.pressed('map') && !G.lockInput) { bigmap.show(); return; }
  if (inGame && !minigames.active && !pause.open && !UI.dialog && input.pressed('phone') && !G.lockInput) { phone.toggle(); input.consume('phone'); input.consume('a'); return; }
  if (inGame && !phone.open && input.pressed('pause')) { pause.toggle(); input.consume('pause'); return; }
  if (phone.open) { phone.update(dt); return; }
  if (pause.open) { pause.update(dt); return; }
  if (inGame && G.scene === city && city.player.car && input.pressed('weapon') && !G.lockInput) radioNext();
  if (G.drunkT > 0) G.drunkT -= dt;
  const sdt = G.slowmo ? dt * G.slowmo : dt;
  if (G.scene) G.scene.update(sdt);
  if (minigames.active) minigames.update(dt);
  UI.update(dt);
  runner.update(dt);
  story.update(dt);
  checkCheats();
}

function render() {
  ctx.setTransform(G.res, 0, 0, G.res, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (minigames.fullscreen) { minigames.render(ctx); UI.render(ctx); return; }
  // a couple of beers at the cantina: the world sways a little
  const drunk = G.drunkT > 0 && (G.scene === city || G.scene === interior) ? Math.min(1, G.drunkT / 8) : 0;
  if (drunk) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(G.time * 1.3) * 0.025 * drunk); ctx.translate(-W / 2 + Math.sin(G.time * 2.1) * 3 * drunk, -H / 2 + Math.cos(G.time * 1.7) * 2 * drunk); }
  if (G.scene) G.scene.render(ctx);
  if (drunk) ctx.restore();
  if (minigames.active) minigames.render(ctx);
  if (G.scene === city || G.scene === interior || G.scene === finale) { UI.render(ctx); drawRadio(ctx); }
  else if (UI.fade > 0.001) { ctx.fillStyle = `rgba(0,0,0,${UI.fade})`; ctx.fillRect(0, 0, W, H); }
  phone.render(ctx);
  bigmap.render(ctx);
  pause.render(ctx);
}

function loop(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 5) { tick(STEP); G.time += STEP; G.frame++; acc -= STEP; steps++; }
  if (steps >= 5) acc = 0;
  audio.update();
  render();
  requestAnimationFrame(loop);
}

// pause when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if ((G.scene === city || G.scene === interior) && !pause.open && !phone.open && !minigames.fullscreen) pause.toggle(); if (audio.ctx) audio.ctx.suspend(); }
  else if (audio.ctx) audio.ctx.resume();
});
window.addEventListener('beforeunload', () => saveSettings(G.settings));

input.init();
input.onFirstGesture = () => audio.init();
resize();
story.init();
setScene('title');
requestAnimationFrame(loop);
window.G = G; // handy for debugging from the console
// deterministic stepping for automated tests: __tick(frames)
window.__tick = (n = 1) => { for (let i = 0; i < n; i++) { tick(STEP); G.time += STEP; G.frame++; audio.update(); } render(); };
