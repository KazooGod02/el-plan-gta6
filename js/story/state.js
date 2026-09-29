// Persistent game state (what gets saved).
export function newState() {
  return {
    version: 1,
    mission: 0,            // index into MISSIONS of the next/active mission
    done: [],              // completed mission ids
    chapter: 0,
    chapterName: 'PRÓLOGO',
    day: -21,
    clock: 8 * 60 + 30,    // minutes of the day
    weather: 'sun',
    money: 120,
    debt: 50000,
    paid: 0,
    unlocked: { centro: false, puerto: false, afueras: false },
    flags: {},
    trust: 50,             // hidden "confianza de Coqui"
    collect: { cassettes: [], stars: [], graffiti: [], kazoos: [] },
    achievements: [],
    chat: [],              // group chat messages {from, text, day}
    chatPriv: [],          // private chat with Ghenghis
    notes: [],             // phone notifications
    weapons: {},           // { pistol: ammo, shotgun: ammo }
    weapon: 'fists',
    items: [],             // marketplace cosmetics
    outfit: 'normal',
    masks: { kazoo: 'luchador', coqui: 'presidente', ghenghis: 'payaso' },
    pos: { scene: 'interior', room: 'cuarto', x: 70, y: 0 },
    radio: 0,
    deliveries: 0,
    bestKart: 0,
    bestRange: 0,
    stats: { playtime: 0, deaths: 0, busted: 0, purchases: 0, peds: 0, cars: 0, crimes: 0, distance: 0, missionsFailed: 0 },
    finished: false,
    freeMode: false,
  };
}
