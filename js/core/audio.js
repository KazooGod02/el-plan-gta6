// Tiny chiptune engine on top of Web Audio: 2 pulse, triangle, noise + SFX.
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

function noteFreq(tok) {
  const m = /^([A-G](?:#|b)?)(-?\d)$/.exec(tok);
  if (!m) return 0;
  const midi = 12 * (Number(m[2]) + 1) + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function parseChannel(str) {
  const toks = str.replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean);
  const events = new Map();
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '-' || t === '.') continue;
    let len = 1;
    while (toks[i + len] === '-') len++;
    events.set(i, { tok: t, len, f: noteFreq(t) });
  }
  return { len: toks.length, events };
}

class Audio {
  constructor() {
    this.ctx = null;
    this.musicVol = 0.7; this.sfxVol = 0.8;
    this.song = null; this.songName = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.mus = c.createGain(); this.mus.connect(this.master);
    this.sfxG = c.createGain(); this.sfxG.connect(this.master);
    this.applyVolumes();
    this.waves = {};
    for (const d of [0.125, 0.25, 0.5]) this.waves[d] = this.pulseWave(d);
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    // engine
    this.engOsc = c.createOscillator(); this.engOsc.type = 'sawtooth'; this.engOsc.frequency.value = 50;
    this.engF = c.createBiquadFilter(); this.engF.type = 'lowpass'; this.engF.frequency.value = 400;
    this.engG = c.createGain(); this.engG.gain.value = 0;
    this.engOsc.connect(this.engF); this.engF.connect(this.engG); this.engG.connect(this.sfxG);
    this.engOsc.start();
    // siren
    this.sirOsc = c.createOscillator(); this.sirOsc.type = 'square'; this.sirOsc.frequency.value = 700;
    this.sirG = c.createGain(); this.sirG.gain.value = 0;
    this.sirOsc.connect(this.sirG); this.sirG.connect(this.sfxG); this.sirOsc.start();
    this.sirLevel = 0;
    if (this.pendingSong) { const p = this.pendingSong; this.pendingSong = null; this.play(p.name, p.songs); }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const m = this.muted ? 0 : 1;
    this.mus.gain.value = this.musicVol * m;
    this.sfxG.gain.value = this.sfxVol * m;
  }

  setVolumes(music, sfx) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }

  pulseWave(d) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * d);
    return this.ctx.createPeriodicWave(real, imag);
  }

  // ---------------- music ----------------
  play(name, songs) {
    if (!this.ctx) { this.pendingSong = { name, songs }; return; }
    if (this.songName === name && this.song) return;
    const def = name && songs ? songs[name] : null;
    this.stop();
    if (!def) return;
    this.songName = name;
    const ch = {};
    for (const k in def.ch) ch[k] = parseChannel(def.ch[k]);
    this.song = { def, ch, step: 0, next: this.ctx.currentTime + 0.06, stepDur: 60 / def.bpm / 4, gain: this.ctx.createGain() };
    this.song.gain.gain.value = def.gain ?? 1;
    this.song.gain.connect(this.mus);
  }

  stop(fade = 0.15) {
    if (this.song && this.ctx) {
      const g = this.song.gain.gain;
      const t = this.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + fade);
      const old = this.song.gain; setTimeout(() => old.disconnect(), (fade + 0.4) * 1000);
    }
    this.song = null; this.songName = null;
  }

  update() {
    if (!this.ctx) return;
    const s = this.song;
    if (s) {
      const ahead = this.ctx.currentTime + 0.15;
      while (s.next < ahead) {
        this.scheduleStep(s, s.step, s.next);
        s.step++;
        s.next += s.stepDur;
        if (s.def.once && s.step >= s.def.once) { this.song = null; this.songName = null; break; }
      }
    }
    // siren warble
    if (this.sirLevel > 0.001) {
      const t = this.ctx.currentTime;
      this.sirOsc.frequency.setTargetAtTime(Math.floor(t / 0.42) % 2 ? 660 : 880, t, 0.02);
    }
  }

  scheduleStep(s, step, t) {
    const d = s.def;
    for (const k in s.ch) {
      const c = s.ch[k];
      const ev = c.events.get(step % c.len);
      if (!ev) continue;
      const dur = ev.len * s.stepDur;
      const vol = (d.vol && d.vol[k]) ?? (k === 'tr' ? 0.22 : k === 'nz' ? 0.3 : 0.1);
      if (k === 'nz') this.drum(ev.tok, t, vol, s.gain);
      else if (ev.f) this.tone(k === 'tr' ? 'triangle' : (d.duty && d.duty[k]) || 0.5, ev.f, t, dur, vol, s.gain, k !== 'tr');
    }
  }

  tone(type, f, t, dur, vol, dest, decay = true) {
    const c = this.ctx;
    const o = c.createOscillator();
    if (typeof type === 'number') o.setPeriodicWave(this.waves[type] || this.waves[0.5]);
    else o.type = type;
    o.frequency.setValueAtTime(f, t);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    if (decay) g.gain.linearRampToValueAtTime(vol * 0.55, t + Math.min(dur, 0.25));
    g.gain.setValueAtTime(decay ? vol * 0.55 : vol, t + dur * 0.9);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(t); o.stop(t + dur + 0.03);
  }

  noiseHit(t, dur, vol, ftype, freq, dest) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  drum(tok, t, vol, dest) {
    const c = this.ctx;
    if (tok === 'k') {
      const o = c.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = c.createGain(); g.gain.setValueAtTime(vol * 2.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.18);
    } else if (tok === 's') {
      this.noiseHit(t, 0.13, vol * 1.1, 'bandpass', 1800, dest);
      this.tone('triangle', 190, t, 0.06, vol * 0.8, dest);
    } else if (tok === 'h') this.noiseHit(t, 0.035, vol * 0.5, 'highpass', 7000, dest);
    else if (tok === 'o') this.noiseHit(t, 0.16, vol * 0.45, 'highpass', 6000, dest);
    else if (tok === 'g') this.noiseHit(t, 0.07, vol * 0.5, 'bandpass', 5200, dest);
    else if (tok === 'c') { this.noiseHit(t, 0.05, vol, 'bandpass', 1400, dest); this.noiseHit(t + 0.02, 0.09, vol, 'bandpass', 1300, dest); }
    else if (tok === 't') this.tone('triangle', 120, t, 0.12, vol * 1.3, dest, true);
  }

  // ---------------- sfx ----------------
  sfx(name, opt = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.001;
    const v = opt.vol ?? 1;
    const S = this;
    switch (name) {
      case 'blip': S.tone(0.5, opt.f || 520, t, 0.035, 0.05 * v); break;
      case 'select': S.tone(0.25, 880, t, 0.05, 0.08 * v); S.tone(0.25, 1320, t + 0.05, 0.06, 0.08 * v); break;
      case 'move': S.tone(0.25, 660, t, 0.03, 0.06 * v); break;
      case 'back': S.tone(0.25, 520, t, 0.05, 0.07 * v); S.tone(0.25, 330, t + 0.05, 0.06, 0.07 * v); break;
      case 'shot': S.noiseHit(t, 0.18, 0.55 * v, 'lowpass', 2600); S.tone('square', 120, t, 0.05, 0.12 * v); break;
      case 'shotgun': S.noiseHit(t, 0.35, 0.8 * v, 'lowpass', 1600); S.tone('square', 80, t, 0.1, 0.15 * v); break;
      case 'punch': S.noiseHit(t, 0.08, 0.5 * v, 'lowpass', 900); S.tone('triangle', 110, t, 0.06, 0.25 * v); break;
      case 'hit': S.tone('square', 220, t, 0.04, 0.1 * v); S.tone('square', 140, t + 0.04, 0.05, 0.1 * v); break;
      case 'hurt': S.tone(0.25, 300, t, 0.06, 0.12 * v); S.tone(0.25, 180, t + 0.06, 0.1, 0.12 * v); break;
      case 'explode': S.noiseHit(t, 0.9, 1.0 * v, 'lowpass', 700); S.tone('triangle', 60, t, 0.5, 0.4 * v); break;
      case 'crash': S.noiseHit(t, 0.25, 0.6 * v, 'lowpass', 1200); S.tone('square', 90, t, 0.08, 0.1 * v); break;
      case 'coin': S.tone(0.25, 988, t, 0.06, 0.08 * v); S.tone(0.25, 1319, t + 0.06, 0.14, 0.08 * v); break;
      case 'pickup': [523, 659, 784, 1047].forEach((f, i) => S.tone(0.25, f, t + i * 0.05, 0.06, 0.08 * v)); break;
      case 'star': [784, 988, 1175, 1568, 1976].forEach((f, i) => S.tone(0.125, f, t + i * 0.06, 0.08, 0.07 * v)); break;
      case 'door': S.noiseHit(t, 0.12, 0.3 * v, 'lowpass', 500); S.tone('triangle', 90, t, 0.08, 0.2 * v); break;
      case 'step': S.noiseHit(t, 0.03, 0.08 * v, 'lowpass', 600); break;
      case 'horn': S.tone('square', 392, t, 0.25, 0.07 * v); S.tone('square', 494, t, 0.25, 0.05 * v); break;
      case 'phone': S.tone(0.5, 1200, t, 0.05, 0.05 * v); S.tone(0.5, 1600, t + 0.07, 0.05, 0.05 * v); break;
      case 'notify': S.tone(0.25, 1047, t, 0.06, 0.07 * v); S.tone(0.25, 1568, t + 0.08, 0.12, 0.07 * v); break;
      case 'camera': S.noiseHit(t, 0.08, 0.4 * v, 'highpass', 3000); S.tone(0.5, 2000, t, 0.03, 0.05 * v); break;
      case 'bip': S.tone('sine', 1000, t, opt.dur || 0.3, 0.12 * v, null, false); break;
      case 'alarm': for (let i = 0; i < 6; i++) S.tone('square', i % 2 ? 900 : 1200, t + i * 0.2, 0.2, 0.06 * v); break;
      case 'drill': S.tone('sawtooth', 110 + Math.random() * 30, t, 0.12, 0.06 * v); break;
      case 'dig': S.noiseHit(t, 0.15, 0.3 * v, 'lowpass', 400); break;
      case 'kick': S.tone('square', 60, t, 0.1, 0.12 * v); S.noiseHit(t, 0.1, 0.3 * v, 'lowpass', 300); break;
      case 'engine_die': S.tone('sawtooth', 70, t, 0.2, 0.1 * v); S.tone('sawtooth', 50, t + 0.2, 0.3, 0.08 * v); S.tone('sawtooth', 35, t + 0.5, 0.4, 0.06 * v); break;
      case 'splash': S.noiseHit(t, 0.4, 0.4 * v, 'bandpass', 900); break;
      case 'jam': S.tone('square', 200, t, 0.03, 0.08 * v); S.noiseHit(t + 0.03, 0.03, 0.2 * v, 'highpass', 2000); break;
      case 'reload': S.noiseHit(t, 0.04, 0.3 * v, 'highpass', 2500); S.noiseHit(t + 0.12, 0.04, 0.3 * v, 'highpass', 2500); break;
      case 'pass': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => S.tone(0.25, f, t + i * 0.1, i === 5 ? 0.4 : 0.1, 0.09 * v)); break;
      case 'fail': [392, 370, 349, 262].forEach((f, i) => S.tone(0.5, f, t + i * 0.18, i === 3 ? 0.5 : 0.18, 0.09 * v)); break;
      case 'heart': S.tone('sine', 55, t, 0.1, 0.4 * v); S.tone('sine', 50, t + 0.18, 0.12, 0.3 * v); break;
      case 'type': S.tone(0.125, 1800 + Math.random() * 200, t, 0.015, 0.03 * v); break;
      case 'bang': S.noiseHit(t, 1.2, 1.2 * v, 'lowpass', 3000); S.tone('square', 70, t, 0.12, 0.25 * v); break;
      default: break;
    }
  }

  voice(pitch) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.tone(0.25, pitch * (0.9 + Math.random() * 0.25), t, 0.04, 0.035);
  }

  setEngine(on, speed = 0, kind = 'car') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const base = kind === 'moto' ? 70 : kind === 'truck' ? 38 : 48;
    this.engOsc.frequency.setTargetAtTime(base + Math.abs(speed) * 0.45, t, 0.05);
    this.engG.gain.setTargetAtTime(on ? 0.05 + Math.min(Math.abs(speed), 200) / 200 * 0.04 : 0, t, 0.08);
  }

  setSiren(level) {
    if (!this.ctx) return;
    this.sirLevel = level;
    this.sirG.gain.setTargetAtTime(level * 0.025, this.ctx.currentTime, 0.1);
  }
}

export const audio = new Audio();
