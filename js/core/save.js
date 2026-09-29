// localStorage wrappers (always guarded — storage can be unavailable).
const PREFIX = 'elplan_v1_';

function get(key) {
  try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function set(key, val) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; } catch { return false; }
}
function del(key) { try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ } }

export const SLOTS = 3;

export function saveSlot(slot, state) {
  const meta = { t: Date.now(), mission: state.mission, chapter: state.chapterName || '', play: state.stats.playtime, money: state.money };
  return set('slot' + slot, { meta, state });
}
export function loadSlot(slot) { return get('slot' + slot); }
export function deleteSlot(slot) { del('slot' + slot); }
export function listSlots() {
  const out = [];
  for (let i = 0; i < SLOTS; i++) { const s = get('slot' + i); out.push(s ? s.meta : null); }
  return out;
}
export function latestSlot() {
  let best = -1, bt = 0;
  listSlots().forEach((m, i) => { if (m && m.t > bt) { bt = m.t; best = i; } });
  return best;
}

export const DEFAULT_SETTINGS = { music: 0.7, sfx: 0.8, streamer: false, subtitles: true, speedrun: false, shake: true, lastSlot: 0 };
export function loadSettings() { return { ...DEFAULT_SETTINGS, ...(get('settings') || {}) }; }
export function saveSettings(s) { set('settings', s); }

export function loadGlobal() { return get('global') || { finished: false, achievements: [], bestTime: 0 }; }
export function saveGlobal(g) { set('global', g); }
