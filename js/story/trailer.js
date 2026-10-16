// "El Escape": the trailer, recreated in 8 bits and playable. Secret: it only opens from
// the title screen with a button combination (see menus.js).
import { G, W, H, setScene } from '../core/game.js';
import { input } from '../core/input.js';
import { audio } from '../core/audio.js';
import * as font from '../core/font.js';
import { clamp, rand, lerp } from '../core/util.js';
import { side } from '../data/sprites.js';
import { LOOKS } from '../data/cast.js';
import { SONGS } from '../data/music.js';
import { drawSky } from '../interior/interior.js';
import { drawProp } from '../interior/props.js';
import { FLOOR } from '../interior/rooms.js';
import { UI } from '../ui/ui.js';
import { runner, wait, until, say } from './script.js';

const GH_BAG = { ...LOOKS.ghenghis, bag: true, _id: 'trailer_gh_bag' };
const KZ_BAG = { ...LOOKS.kazoo, bag: true, _id: 'trailer_kz_bag' };
const autoT = (s) => 1.5 + s.length / 16;
// a film line: plays by itself, A skips it
function* ln(who, text, expr = 'normal', opts = {}) { yield* say(who, text, expr, { auto: autoT(text), ...opts }); }

// scenery along the road, in world px (props from the interiors)
const PROPS = [
  { t: 'fence', x: 0, w: 120 }, { t: 'tree', x: 150, col: '#1e3a1e' }, { t: 'bush', x: 240 }, { t: 'lightpole', x: 300 },
  { t: 'fence', x: 340, w: 90 }, { t: 'bush', x: 470 }, { t: 'tree', x: 520, col: '#1a341a' }, { t: 'bush', x: 610 },
  { t: 'bush', x: 700, cover: true }, { t: 'tree', x: 740, col: '#1e3a1e' },
  { t: 'crates', x: 852, front: true }, { t: 'bush', x: 940 }, { t: 'tree', x: 990, col: '#16301a' }, { t: 'bush', x: 1060 },
  { t: 'tree', x: 1120, col: '#1e3a1e' }, { t: 'bush', x: 1190 }, { t: 'bush', x: 1230 }, { t: 'tree', x: 1290, col: '#16301a' },
  { t: 'bush', x: 1360 }, { t: 'bush', x: 1400 }, { t: 'tree', x: 1450, col: '#1a341a' },
];
const WORLD_W = 1560;

export const trailer = {
  name: 'trailer', song: null,

  enter() {
    this.t = 0; this.mode = 'road'; this.cam = 0; this.camTarget = null; this.shake = 0;
    this.control = null; this.prompt = null; this.lights = 0; this.bullets = []; this.fx = []; this.flash = 0;
    this.k = { look: 'kazoo', x: 40, facing: 1, pose: null, moving: false, anim: 0, crouch: false, hurt: 0 };
    this.g = { look: GH_BAG, x: 62, facing: 1, pose: null, moving: false, anim: 0 };
    this.c = { look: 'coqui', x: 86, facing: 1, pose: null, moving: false, anim: 0 };
    this.bag = null; this.field = null; this.end = null; this.song = null;
    UI.hud = false; UI.dialog = null; UI.card = null; UI.objective = ''; UI.letterbox = 1; UI.letterboxTarget = 1;
    UI.fade = 1; UI.fadeTarget = 1; UI.subtitle = null;
    G.lockInput = 0; G.paused = false;
    runner.cancelWhere((t) => t.name === 'trailer');
    runner.run(this.script(), 'trailer');
  },
  exit() { this.cleanup(); },
  cleanup() {
    runner.cancelWhere((t) => t.name === 'trailer');
    UI.dialog = null; UI.subtitle = null; UI.letterboxTarget = 0; UI.letterbox = 0; UI.fadeTarget = 0; UI.fade = 0; UI.card = null;
    audio.setSiren(0);
  },
  quit() { this.cleanup(); setScene('title'); },

  // ------------------------------------------------------------ script
  *script() {
    const k = this.k, g = this.g, c = this.c;
    // [00:00] black. breathing, steps, a backpack, sirens
    yield* wait(1);
    audio.setSiren(0.15);
    UI.subtitle = '*respiraciones fuertes*'; yield* wait(2);
    UI.subtitle = '*pasos apresurados*'; for (let i = 0; i < 4; i++) { audio.sfx('step'); yield* wait(0.3); } yield* wait(0.6);
    UI.subtitle = '*una mochila moviéndose*'; yield* wait(1.8);
    audio.setSiren(0.4);
    UI.subtitle = '*sirenas, cada vez más perceptibles*'; yield* wait(2);
    UI.subtitle = null;
    yield* say('ghenghis', '¡Córranle, córranle!', 'shock', { portrait: false, name: 'GHENGHIS (FUERA DE CUADRO)', auto: 2.2 });
    // [00:10] hard cut: the escape
    audio.sfx('bang', { vol: 0.5 });
    UI.fade = 0; UI.fadeTarget = 0;
    UI.showCard('EL ESCAPE', '', 2.2, 'big');
    this.control = 'walk'; this.prompt = '→ CAMINA'; this.walkMax = 600;
    yield* until(() => k.x > 110);
    this.prompt = null;
    const walkLines = [
      ['coqui', '¡Te dije que ese carro no iba a aguantar!', 'angry'],
      ['kazoo', '¡Wey, hace diez minutos dijiste que estaba bien!', 'angry'],
      ['coqui', '¡ANTES DE QUE EMPEZARA A ECHAR HUMO!', 'angry'],
      ['kazoo', '...Callado, vale.', 'sad'],
      ['ghenghis', '¡Cállense, loco! ¡Concéntrense!', 'angry'],
    ];
    for (const l of walkLines) yield* ln(...l);
    yield* wait(1.2);
    c.facing = -1; yield* wait(0.4);
    yield* ln('coqui', 'Ya vienen.', 'serious');
    c.facing = 1;
    yield* ln('kazoo', 'Pues hay que seguir caminando.', 'normal');
    yield* ln('ghenghis', '¿A dónde?', 'think');
    k.point = 1.6;
    yield* ln('kazoo', 'Pa\'llá.', 'normal');
    yield* ln('ghenghis', '¿Y qué hay allá?', 'think');
    yield* ln('kazoo', 'No sé, we, la neta. *medio riéndose*', 'happy');
    k.facing = -1; k.point = 1.6;
    yield* ln('kazoo', 'Pero como acá está la poli... tendríamos que ir pa\'llá.', 'normal');
    k.facing = 1;
    yield* ln('ghenghis', '...Ta bien, pues.', 'normal');
    this.walkMax = 660;
    yield* until(() => k.x > 640);
    // [00:30] the car
    this.control = null;
    c.stop = true;
    yield* ln('coqui', 'Espera.', 'serious');
    g.stop = true;
    c.facing = -1;
    yield* ln('coqui', '¿A quién le tocaba el carro?', 'serious');
    yield* this.walk(k, 812, 40);
    yield* ln('coqui', '¿Kazoo?', 'serious');
    yield* ln('kazoo', '¿Qué? *no voltea*', 'normal');
    yield* ln('coqui', '¿Quién fue el que compró el carro?', 'serious');
    UI.subtitle = '(Silencio. Ghenghis mira a Kazoo.)'; yield* wait(1.6); UI.subtitle = null;
    g.facing = 1;
    yield* ln('ghenghis', 'Wey...', 'serious');
    k.facing = -1;
    yield* ln('kazoo', 'Estaba en oferta...', 'sad');
    yield* ln('coqui', '¿De dónde lo habías sacado?', 'serious');
    yield* wait(0.6);
    yield* ln('kazoo', '...Del Marketplace.', 'sad');
    UI.subtitle = '(Silencio. Ghenghis baja lentamente la cabeza.)'; yield* wait(1.6); UI.subtitle = null;
    yield* ln('ghenghis', 'Hijo de tu puta madre...', 'serious');
    yield* ln('kazoo', 'Wey, el vendedor tenía cinco estrellas.', 'sad');
    yield* ln('coqui', '¿PERO Y EL PUTO CARRO?', 'angry');
    yield* ln('kazoo', 'Pues por algo tendría cinco... yo confié...', 'sad');
    yield* ln('coqui', '¡Y aparte es un puto Tsuru viejísimo, PENDEJO!', 'angry');
    audio.setSiren(0.6);
    UI.subtitle = '(Sirenas. Ahora más fuertes.)'; yield* wait(1.2); UI.subtitle = null;
    g.look = 'ghenghis'; this.bag = { x: g.x + 10 }; audio.sfx('dig');
    yield* ln('ghenghis', 'Pues ya valimos verga. Es mejor separarnos con nuestras partes.', 'serious');
    yield* ln('kazoo', 'Wey, hay que seguir caminando. Si nos separamos orita, nos van a agarrar.', 'shock');
    // [00:48] the backpack
    this.camTarget = this.bag.x;
    yield* wait(1);
    yield* ln('coqui', 'Dame mi parte.', 'serious');
    yield* ln('kazoo', '¿Qué?', 'shock');
    yield* ln('coqui', 'Mi parte, verga... ¡YA!', 'angry');
    yield* ln('kazoo', '*decepcionado* No lo puedo creer, we.', 'sad');
    yield* ln('ghenghis', 'Pues ya qué... *puta madre*', 'sad');
    yield* ln('kazoo', 'Wey, nos está buscando la policía.', 'shock');
    yield* ln('ghenghis', 'Y luego, ¿qué quieres que haga, cabrón?', 'angry');
    yield* this.walk(g, Math.round((c.x + k.x) / 2) + 6, 30);
    g.look = GH_BAG; this.bag = null;
    yield* ln('kazoo', 'Dame la mochila.', 'serious');
    UI.subtitle = '(Kazoo agarra la mochila de un tirante.)'; yield* wait(1.4); UI.subtitle = null;
    yield* ln('coqui', 'Don\'t do this, bro.', 'serious');
    yield* ln('ghenghis', '*se ríe* Wey, qué PENDEJOS están.', 'laugh');
    yield* ln('kazoo', '*irritado* ¿Tú de qué te ríes, pendejo? Se te hace tan gracioso que estemos a punto de ser arrestados y no quieras seguir con el puto plan.', 'angry');
    yield* ln('ghenghis', '*serio* De todos modos esto iba a pasar.', 'serious');
    yield* ln('kazoo', 'Bueno.', 'normal');
    k.facing = 1; yield* wait(1);
    this.camTarget = null;
    // [01:08] paranoia
    yield* ln('coqui', '¿Saben qué?', 'serious');
    k.facing = -1;
    yield* ln('kazoo', '¿Qué?', 'normal');
    yield* ln('coqui', 'Desde antes que saliéramos estaban actuando raro...', 'serious');
    yield* ln('kazoo', 'Wey, hoy robamos un puto banco. ¿Cómo no íbamos a actuar raro, cabrón?', 'angry');
    c.point = 3;
    yield* ln('coqui', 'No. Ustedes dos.', 'serious');
    yield* ln('ghenghis', '¿Nosotros dos qué?', 'think');
    yield* ln('coqui', '¿Lo planearon, verdad, putos?', 'angry');
    g.facing = 1; yield* wait(1); g.facing = -1;
    yield* ln('coqui', 'Se iban a ir con el dinero.', 'angry');
    yield* ln('kazoo', '¿De qué putas estás hablando?', 'angry');
    UI.subtitle = '(Ghenghis casi se ríe.)'; yield* wait(1.2); UI.subtitle = null;
    yield* ln('coqui', 'No estoy jugando.', 'serious');
    yield* ln('kazoo', 'Yo tampoco, wey. ¿Me crees más inteligente de lo que soy? Todo ha salido mal... y te JURO que si yo hubiera querido esto, los tres ya estaríamos muertos desde antes de salir del banco...', 'angry');
    UI.subtitle = '(Silencio. Kuiss estira la mano lentamente hacia su arma. Kazoo lo nota.)'; yield* wait(2.6); UI.subtitle = null;
    // [01:27] standoff
    c.pose = 'aim'; audio.sfx('reload');
    yield* wait(0.25);
    g.pose = 'aim'; audio.sfx('reload');
    yield* wait(0.25);
    k.pose = 'aim'; audio.sfx('reload');
    this.song = 'tension';
    audio.setSiren(0.25);
    UI.subtitle = '(Los tres se apuntan. Silencio total.)'; yield* wait(2.2); UI.subtitle = null;
    yield* ln('ghenghis', 'Bájala.', 'serious');
    yield* ln('coqui', 'Dame la mochila.', 'angry');
    yield* ln('ghenghis', 'Baja el arma primero.', 'serious');
    yield* ln('coqui', 'Dame mi dinero, primero.', 'angry');
    yield* ln('kazoo', 'No tenemos cuatro brazos para hacer dos cosas al mismo tiempo. ¿Eres tonto?', 'serious');
    c.facing = 1; yield* wait(0.8);
    yield* ln('kazoo', 'O sea, real question.', 'normal');
    yield* ln('coqui', 'Cállate.', 'angry');
    // [01:43] it gets worse
    yield* ln('ghenghis', 'Wey... Kuiss.', 'serious');
    yield* ln('ghenghis', 'Nadie te va a quitar nada.', 'serious');
    yield* ln('coqui', 'Entonces suelta la mochila.', 'angry');
    yield* ln('ghenghis', 'No.', 'serious');
    yield* ln('coqui', '¿Por qué?', 'angry');
    yield* ln('ghenghis', 'Wey, me estás apuntando.', 'serious');
    yield* ln('coqui', '¡Pues dame la puta mochila si no quieres que te apunte!', 'angry');
    yield* ln('kazoo', '*al fondo* Oh shit, here we go again.', 'sad');
    yield* ln('ghenghis', '¡Ey, KAZOO, ya CÁLLATE!', 'angry');
    yield* ln('kazoo', '¡DEJA DE GRITARME, PENDEJO, NO ANDO GRITANDO!', 'angry');
    // Ghenghis turns the gun on Kazoo
    g.facing = 1; audio.sfx('reload');
    this.song = null;
    yield* say('ghenghis', '...', 'crazy', { auto: 1.2 });
    // [01:59] the shot: you have a moment to pull the trigger
    this.prompt = '¡DISPARA! (B / ESPACIO)';
    let t = 0, shot = false;
    while (t < 2.6) { t += yield; if (input.pressed('b')) { shot = true; break; } }
    this.prompt = null;
    k.pose = 'shoot'; audio.sfx('bang'); this.flash = 0.8; this.shake = 4;
    audio.setSiren(0);
    yield* wait(0.2);
    k.pose = 'aim';
    if (!shot) UI.subtitle = '"Si te apuntan, tú disparas primero." — La Tía Gris';
    yield* wait(1.6);
    UI.subtitle = null;
    yield* wait(0.6);
    c.facing = 1;
    yield* ln('coqui', '....', 'shock');
    g.pose = 'down'; g.look = 'ghenghis'; g.down = true; this.bag = { x: g.x - 14 }; audio.sfx('hit');
    yield* wait(1.4);
    // [02:03] everything breaks
    c.facing = 1;
    yield* ln('coqui', '¡¿QUÉ VERGA HICISTE?!', 'angry');
    this.control = 'cover'; this.prompt = '→ ¡CÚBRETE DETRÁS DE LAS CAJAS! (ABAJO)';
    yield* until(() => k.x > 888 && k.crouch);
    this.prompt = null;
    this.control = 'hide';
    const shout = [
      ['kazoo', '*gritando, escondido* ¡ME IBA A DISPARAR!', 'angry'],
      ['coqui', '¡¿ÉL TE IBA A DISPARAR?!', 'angry'],
      ['kazoo', '¡ME ESTABA APUNTANDO!', 'angry'],
      ['coqui', '¡TODOS NOS ESTÁBAMOS APUNTANDO, LOCO!', 'angry'],
    ];
    for (const l of shout) yield* ln(...l);
    UI.subtitle = '(Kazoo procesa eso.)'; yield* wait(1.4); UI.subtitle = null;
    yield* ln('kazoo', '... PUES ME APUNTÓ MUY FEO, WE.', 'sad');
    yield* ln('coqui', '¡SAL DE AHÍ Y VEN A PELEAR, CABRÓN!', 'angry');
    yield* ln('kazoo', '¡NI DE PEDO! ¿CREES QUE SOY PENDEJO?', 'angry');
    this.coquiShoot(); yield* wait(0.6);
    yield* ln('kazoo', '¡Cálmate, verga!', 'shock');
    yield* ln('coqui', '¡SAL!', 'angry');
    this.coquiShoot(); yield* wait(0.5);
    yield* ln('kazoo', '¡WEY, AHORA SÍ ME DISPARASTE, PENDEJO!', 'angry');
    yield* ln('coqui', '¡TÚ LE ACABAS DE DISPARAR A ÉL!', 'angry');
    yield* ln('kazoo', '¡SÍ, pero... ÉL SE LO BUSCÓ!', 'angry');
    yield* ln('coqui', '¡¿Qué?!', 'angry');
    yield* ln('kazoo', '¡NO SÉ, NO SÉ NADA, PUTA MADRE!', 'angry');
    // [02:17] firefight: playable
    this.song = 'chase';
    this.control = 'fight'; this.prompt = 'ABAJO: CUBRIRTE  ·  B: DISPARAR';
    this.shots = 0;
    let ft = 0;
    while (ft < 20 && !(ft > 11 && this.shots >= 3)) {
      ft += yield;
      this.coquiAI(ft);
      if (ft > 9) this.lights = Math.min(1, this.lights + 1 / 60 / 3);
    }
    this.prompt = null; this.control = 'hide';
    this.lights = 1; audio.setSiren(0.7);
    yield* say('narrator', '¡POLICÍA!', 'normal', { name: 'VOZ POLICIAL LEJANA', auto: 1.8 });
    this.song = null;
    UI.subtitle = '(Los disparos paran. Silencio.)'; yield* wait(2); UI.subtitle = null;
    // [02:32] "run"
    yield* ln('kazoo', '¿Kuiss?', 'sad');
    UI.subtitle = '(Nada.)'; yield* wait(1.4); UI.subtitle = null;
    k.crouch = false; this.control = null; k.pose = null;
    c.pose = 'aim'; c.facing = -1; c.x = 744;
    UI.subtitle = '(Kuiss sigue de pie. Ya no le apunta a Kazoo. Mira hacia algo atrás.)'; yield* wait(2.4); UI.subtitle = null;
    yield* say('narrator', '¡SUELTEN LAS ARMAS!', 'normal', { name: 'VOZ POLICIAL', auto: 1.8 });
    c.facing = 1;
    UI.subtitle = '(Por un segundo desaparece todo el conflicto entre ellos. Los dos saben lo que está pasando.)'; yield* wait(3); UI.subtitle = null;
    c.pose = null;
    yield* ln('coqui', '... Corre.', 'sad');
    yield* wait(0.4);
    yield* ln('coqui', '¡CORRE!', 'angry');
    audio.sfx('bang'); this.shake = 3; this.flash = 0.3;
    // [02:46] the field
    this.song = 'night';
    this.control = 'run'; this.prompt = '→ ¡CORRE! (MANTÉN SHIFT)';
    let farShot = false;
    yield* until(() => { if (!farShot && k.x > 1150) { farShot = true; audio.sfx('shot', { vol: 0.25 }); } if (k.x > 1000) this.prompt = null; return k.x >= WORLD_W - 70; });
    this.control = null;
    audio.setSiren(0.15);
    this.mode = 'field'; this.field = { t: 0 };
    this.song = 'title';
    yield* wait(7);
    // cut to black, a second of silence, the sting
    UI.fade = 1; UI.fadeTarget = 1;
    this.song = null; audio.setSiren(0);
    yield* wait(1.2);
    this.song = 'sting';
    this.mode = 'end'; this.end = { t: 0 };
    UI.letterboxTarget = 0;
    UI.fade = 0; UI.fadeTarget = 0;
    yield* wait(2);
    while (!input.pressed('a')) yield;
    this.quit();
  },

  // walk a character to x (scripted)
  *walk(ch, x, speed = 40) {
    while (Math.abs(ch.x - x) > 1.5) {
      const dt = yield;
      ch.facing = Math.sign(x - ch.x); ch.moving = true; ch.anim += dt;
      ch.x += Math.sign(x - ch.x) * Math.min(Math.abs(x - ch.x), speed * dt);
    }
    ch.moving = false;
  },

  coquiShoot() {
    const c = this.c;
    c.pose = 'shoot'; c.poseT = 0.15; c.facing = 1;
    this.bullets.push({ x: c.x + 12, y: FLOOR - 15, vx: 340, owner: 'coqui' });
    audio.sfx('shot');
  },
  // Kuiss moves between his two covers and fires at Kazoo
  coquiAI(ft) {
    const c = this.c;
    c.cdT = (c.cdT ?? 1.4) - 1 / 60;
    if (c.goal !== undefined) {
      const d = c.goal - c.x;
      if (Math.abs(d) > 2) { c.x += Math.sign(d) * 90 / 60; c.moving = true; c.facing = Math.sign(d); c.anim += 1 / 60; return; }
      c.goal = undefined; c.moving = false; c.facing = 1;
    }
    if (c.cdT <= 0) {
      c.cdT = rand(1.1, 1.7);
      if (Math.random() < 0.3) { c.goal = c.x < 730 ? 762 : 714; c.crouch = false; }
      else this.coquiShoot();
    }
    c.crouch = c.goal === undefined && c.cdT > 0.8;
    void ft;
  },

  // ------------------------------------------------------------ update
  update(dt) {
    this.t += dt;
    if (input.pressed('pause') || input.pressed('back')) { this.quit(); return; }
    if (audio.songName !== this.song) { if (this.song) audio.play(this.song, SONGS); else audio.stop(); }
    const k = this.k, g = this.g, c = this.c;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 10);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
    for (const ch of [k, g, c]) { if (ch.point > 0) ch.point -= dt; if (ch.poseT > 0) { ch.poseT -= dt; if (ch.poseT <= 0) ch.pose = 'aim'; } }
    const dlg = !!UI.dialog && !UI.dialog.auto;
    const ctl = this.control;
    k.moving = false;
    if (ctl === 'walk' || ctl === 'cover' || ctl === 'run') {
      const run = ctl === 'run' || input.down('run');
      const sp = ctl === 'run' ? (input.down('run') ? 110 : 80) : run ? 70 : 46;
      const ax = input.ax;
      k.crouch = ctl === 'cover' && input.down('down') && Math.abs(ax) < 0.3;
      if (Math.abs(ax) > 0.2 && !k.crouch && !dlg) {
        const nx = clamp(k.x + Math.sign(ax) * sp * dt, ctl === 'walk' ? 20 : ctl === 'cover' ? 800 : k.x - 1, ctl === 'walk' ? this.walkMax : WORLD_W - 40);
        k.facing = Math.sign(ax); k.x = nx; k.moving = true; k.anim += dt * (sp > 60 ? 1.6 : 1);
        k.stepT = (k.stepT || 0) - dt; if (k.stepT <= 0) { k.stepT = sp > 60 ? 0.22 : 0.32; audio.sfx('step', { vol: 0.35 }); }
      }
      if (ctl === 'walk') {
        // Kuiss leads, Ghenghis carries the bag, Kazoo keeps looking back
        for (const [ch, off] of [[g, 22], [c, 46]]) {
          if (ch.stop) continue;
          const tx = k.x + off, d = tx - ch.x;
          if (Math.abs(d) > 3) { ch.x += Math.sign(d) * Math.min(Math.abs(d), 60 * dt); ch.moving = true; ch.facing = 1; ch.anim += dt; } else ch.moving = false;
        }
        if (!k.moving && Math.floor(this.t * 0.7) % 3 === 2) k.facing = -1;
      }
    }
    if (ctl === 'fight' || ctl === 'hide') {
      k.crouch = ctl === 'hide' ? true : input.down('down');
      k.facing = -1;
      if (ctl === 'fight' && !k.crouch && input.pressed('b')) {
        k.pose = 'shoot'; k.poseT = 0.12;
        this.bullets.push({ x: k.x - 12, y: FLOOR - 15, vx: -380, owner: 'kazoo' });
        audio.sfx('shot'); this.shots++;
      }
      if (k.pose !== 'shoot') k.pose = k.crouch ? null : 'aim';
    }
    if (k.hurt > 0) k.hurt -= dt;
    // bullets: nobody dies in this firefight, they only scare each other
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      if (b.owner === 'coqui') {
        if (b.x > 852 && b.x < 884 && k.crouch) { b.dead = true; this.spark(b.x, b.y); }
        else if (Math.abs(b.x - k.x) < 6) { b.dead = true; if (!k.crouch) { k.hurt = 0.4; this.shake = 2; audio.sfx('hurt'); } }
      } else if (b.owner === 'kazoo') {
        if (Math.abs(b.x - c.x) < 8) { b.dead = true; this.spark(b.x + 4, b.y - (c.crouch ? 6 : 0)); }
      }
      if (b.x < this.cam - 40 || b.x > this.cam + W + 40) b.dead = true;
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 140 * dt; f.life -= dt; }
    this.fx = this.fx.filter((f) => f.life > 0);
    // camera
    const target = this.camTarget ?? (this.mode === 'road' ? (k.x + (g.down ? c.x : Math.max(g.x, c.x))) / 2 + 10 : k.x);
    this.cam = lerp(this.cam, clamp(target - W / 2, 0, WORLD_W - W), Math.min(1, dt * 3));
    if (this.field) this.field.t += dt;
    if (this.end) this.end.t += dt;
  },
  spark(x, y) { for (let i = 0; i < 5; i++) this.fx.push({ x, y, vx: rand(-50, 50), vy: rand(-60, 0), life: 0.25, col: '#fff08c' }); },

  // ------------------------------------------------------------ render
  render(ctx) {
    const t = this.t;
    if (this.mode === 'field') { this.renderField(ctx, t); return; }
    if (this.mode === 'end') { this.renderEnd(ctx, t); return; }
    const sh = this.shake ? rand(-this.shake, this.shake) : 0;
    const cx = Math.round(this.cam + sh);
    drawSky(ctx, 'dusk', t);
    // far tree line (parallax)
    ctx.fillStyle = '#26203a';
    for (let i = -1; i < 14; i++) { const x = Math.round(i * 34 - (cx * 0.3) % 34); ctx.beginPath(); ctx.ellipse(x, 122, 22, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#1e2a1c'; ctx.fillRect(0, 124, W, FLOOR - 124);
    // road
    ctx.fillStyle = '#7a5a36'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = '#5e4428'; for (let i = 0; i < 70; i++) ctx.fillRect(((i * 37 - cx) % W + W) % W, FLOOR + 3 + ((i * 11) % 24), 2, 1);
    ctx.fillStyle = '#4a6a2a'; ctx.fillRect(0, FLOOR - 2, W, 3);
    const X = (x) => Math.round(x - cx);
    for (const p of PROPS) if (!p.front && X(p.x) > -80 && X(p.x) < W + 20) drawProp(ctx, p, X(p.x), FLOOR, t, {});
    if (this.bag) drawProp(ctx, { t: 'bag' }, X(this.bag.x), FLOOR, t, {});
    const k = this.k, g = this.g, c = this.c;
    for (const ch of [g, c, k]) this.drawChar(ctx, ch, X(ch.x));
    for (const p of PROPS) if (p.front && X(p.x) > -80 && X(p.x) < W + 20) drawProp(ctx, p, X(p.x), FLOOR, t, {});
    drawProp(ctx, { t: 'grassfg', w: W + 20 }, -((cx) % 3), FLOOR + 4, t, {});
    for (const b of this.bullets) { ctx.fillStyle = '#fff08c'; ctx.fillRect(X(b.x) - 1, Math.round(b.y), 3, 1); }
    for (const f of this.fx) { ctx.fillStyle = f.col; ctx.fillRect(X(f.x), Math.round(f.y), 1, 1); }
    // police lights sweeping over trees, walls and faces
    if (this.lights > 0) {
      const red = Math.floor(t * 5) % 2 === 0;
      const gr = ctx.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, red ? `rgba(255,40,40,${0.45 * this.lights})` : `rgba(40,90,255,${0.45 * this.lights})`);
      gr.addColorStop(0.7, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (k.hurt > 0) { ctx.fillStyle = `rgba(216,50,60,${k.hurt * 0.6})`; ctx.fillRect(0, 0, W, H); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }
    if (this.prompt && Math.floor(t * 3) % 3 !== 0) {
      const w = font.measure(this.prompt) + 12;
      ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fillRect(Math.round(W / 2 - w / 2), 24, w, 12);
      font.text(ctx, this.prompt, W / 2, 26, '#ffd23f', { align: 'center' });
    }
    font.text(ctx, 'ESC: SALIR', W - 4, H - 10, 'rgba(160,160,180,0.5)', { align: 'right' });
  },

  drawChar(ctx, ch, x) {
    let frame = ch.pose || 'idle';
    if (ch.down) frame = 'down';
    else if (ch === this.k && ch.crouch && !ch.pose) frame = 'crouch';
    else if (ch.crouch && ch !== this.k) frame = 'crouch';
    else if (ch.point > 0 && !ch.pose) frame = 'punch';
    else if (!ch.pose && ch.moving) frame = ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(ch.anim * 9) % 4];
    const s = side(ch.look, frame, ch.facing);
    const y = FLOOR;
    if (frame !== 'down') { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 6, y - 1, 12, 2); }
    ctx.drawImage(s, frame === 'down' ? x - 12 : x - 10, frame === 'down' ? y - 12 : y - 24);
    if (this.lights > 0) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * this.lights;
      ctx.fillStyle = Math.floor(this.t * 5) % 2 ? '#ff2828' : '#2850ff'; ctx.fillRect(x - 8, y - 24, 16, 24);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  },

  // wide shot: Kazoo runs into a huge field and shrinks toward the horizon
  renderField(ctx, t) {
    const f = this.field, k = clamp(f.t / 6.5, 0, 1);
    drawSky(ctx, 'dusk', t);
    const hz = 96;
    ctx.fillStyle = '#8a9a3a'; ctx.fillRect(0, hz, W, H - hz);
    ctx.fillStyle = '#7a8a2c';
    for (let i = 0; i < 18; i++) { const yy = hz + Math.pow(i / 18, 2) * (H - hz); ctx.fillRect(0, Math.round(yy), W, 1); }
    ctx.fillStyle = '#a8b84a';
    for (let i = 0; i < 60; i++) { const yy = hz + 2 + ((i * 29) % (H - hz - 2)), xx = (i * 53) % W; ctx.fillRect(xx, yy, 1, 2 + Math.floor((yy - hz) / 20)); }
    ctx.save(); ctx.translate(250, hz); ctx.scale(0.35, 0.35); drawProp(ctx, { t: 'bigtree', col: '#24401e' }, -35, 0, t, {}); ctx.restore();
    // Kazoo, smaller and smaller
    const sc = lerp(3, 0.18, Math.pow(k, 0.7));
    const px = lerp(140, 196, k), py = lerp(H + 12, hz + 3, Math.pow(k, 0.8));
    const s = side('kazoo', ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(t * 12) % 4], 1);
    ctx.save(); ctx.translate(Math.round(px), Math.round(py)); ctx.scale(sc, sc); ctx.drawImage(s, -10, -24); ctx.restore();
    // faint lights far behind
    const red = Math.floor(t * 4) % 2 === 0;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = red ? 'rgba(255,40,40,0.12)' : 'rgba(40,90,255,0.12)'; ctx.fillRect(0, 0, 60, H); ctx.globalCompositeOperation = 'source-over';
  },

  renderEnd(ctx, t) {
    const e = this.end;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.min(1, e.t / 1.2);
    font.text(ctx, 'EL ESCAPE', W / 2 + 2, 52 + 2, '#3a0a3a', { align: 'center', scale: 4 });
    font.text(ctx, 'EL ESCAPE', W / 2, 52, '#ffd23f', { align: 'center', scale: 4, outline: '#3a1a00' });
    font.text(ctx, 'UN FILM ORIGINAL DE KAZOOGOD02', W / 2, 96, '#f4f4f0', { align: 'center' });
    font.text(ctx, 'RECREADO EN 8 BITS', W / 2, 108, '#a8a8b8', { align: 'center' });
    ctx.globalAlpha = 1;
    if (e.t > 2 && Math.floor(t * 2) % 2 === 0) font.text(ctx, 'A: SALIR', W / 2, 150, '#5adcf0', { align: 'center' });
  },
};

// the secret: hashed so the combination doesn't show up in plain text
export function trailerCode(seq) {
  let x = 0x811c9dc5;
  const s = 'elplan:' + seq;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193); }
  return (x >>> 0) === 1369436352;
}
