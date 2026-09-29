// Visual + voice definitions for every character.
// hair styles: curly librito side slick bun short pony cap police bald guard long mohawk beanie
// body: normal wide big fem thin
export const LOOKS = {
  kazoo:    { name: 'KAZOO', skin: '#c48a5e', hair: 'curly', hc: '#241410', shirt: '#e0a82e', pants: '#34466e', shoes: '#f0f0f0', body: 'normal', voice: 430, color: '#e0a82e' },
  coqui:    { name: 'COQUI', skin: '#e0b48c', hair: 'librito', hc: '#161010', shirt: '#3c64a0', pants: '#b49664', shoes: '#5a3218', body: 'wide', glasses: true, voice: 290, color: '#5a8ce0' },
  ghenghis: { name: 'GHENGHIS', skin: '#d29c72', hair: 'side', hc: '#3a2414', shirt: '#b8323c', pants: '#26262e', shoes: '#101010', body: 'normal', crazy: true, voice: 360, color: '#e0504a', flannel: true },
  donchuy:  { name: 'DON CHUY', skin: '#b87a4b', hair: 'slick', hc: '#9a9aa2', shirt: '#f0ece0', pants: '#3a3a44', shoes: '#101010', body: 'big', mustache: true, chain: true, voice: 170, color: '#c8a03c' },
  mari:     { name: 'DOÑA MARI', skin: '#c98c5e', hair: 'bun', hc: '#5a4a4a', shirt: '#d05a8c', pants: '#3c3c64', shoes: '#3a2418', body: 'fem', apron: true, voice: 540, color: '#f07aa8' },
  tia:      { name: 'LA TÍA GRIS', skin: '#e0b890', hair: 'short', hc: '#c8c8d0', shirt: '#5a6a3a', pants: '#4a4a32', shoes: '#2a2a1a', body: 'fem', voice: 250, color: '#a0b070', scar: true },
  tuercas:  { name: 'EL TUERCAS', skin: '#d09a6a', hair: 'cap', hc: '#2a1a10', cap: '#c83c28', shirt: '#2c4c8c', pants: '#2c4c8c', shoes: '#3a2a1a', body: 'thin', mustache: true, voice: 410, color: '#6a8cc8', grease: true },
  reyes:    { name: 'CMDTE. REYES', skin: '#b98058', hair: 'pony', hc: '#120e0e', shirt: '#1e2c50', pants: '#1e2c50', shoes: '#0a0a0a', body: 'fem', voice: 320, color: '#4a6aa8', badge: true },
  vendedor: { name: 'VendeRápido_5E', skin: '#ecc49c', hair: 'slick', hc: '#6a4424', shirt: '#e86aa0', pants: '#e8e0c8', shoes: '#8c5a32', body: 'normal', smile: true, voice: 500, color: '#f08cc0' },
  cop:      { name: 'POLICÍA', skin: '#c08a60', hair: 'police', hc: '#1a1a1a', cap: '#1e2c50', shirt: '#2a3c6e', pants: '#1e2c50', shoes: '#0a0a0a', body: 'normal', voice: 300, color: '#4a6aa8', badge: true },
  guard:    { name: 'GUARDIA', skin: '#b88058', hair: 'guard', hc: '#1a1a1a', cap: '#3a3a3a', shirt: '#8a8a94', pants: '#2a2a32', shoes: '#0a0a0a', body: 'normal', voice: 280, color: '#9a9aa8' },
  thug:     { name: 'MALANDRO', skin: '#a8704a', hair: 'beanie', hc: '#1a1a1a', cap: '#2a2a2a', shirt: '#1a1a1a', pants: '#3a3a4a', shoes: '#f0f0f0', body: 'normal', voice: 250, color: '#707070' },
  teller:   { name: 'CAJERA', skin: '#e0b088', hair: 'long', hc: '#6a3a1a', shirt: '#f0f0f0', pants: '#2a2a44', shoes: '#101010', body: 'fem', voice: 560, color: '#c0c0d0' },
  manager:  { name: 'GERENTE', skin: '#e8c8a8', hair: 'bald', hc: '#8a7a6a', shirt: '#2a2a3a', pants: '#2a2a3a', shoes: '#101010', body: 'wide', glasses: true, tie: '#c83c3c', voice: 330, color: '#8a8aa8' },
  radio:    { name: 'RADIO', skin: '#c08a60', hair: 'short', hc: '#222', shirt: '#444', pants: '#333', shoes: '#111', body: 'normal', voice: 380, color: '#ffd23f' },
  lupita:   { name: 'LUPITA', skin: '#d8a070', hair: 'long', hc: '#1a1010', shirt: '#28b4a0', pants: '#3a3a64', shoes: '#101010', body: 'fem', voice: 600, color: '#28b4a0' },
  bartender:{ name: 'EL CANTINERO', skin: '#c08858', hair: 'bald', hc: '#3a2a1a', shirt: '#f0f0f0', pants: '#1a1a1a', shoes: '#101010', body: 'big', mustache: true, voice: 220, color: '#c8c8c8' },
  clerk:    { name: 'DEPENDIENTE', skin: '#e0b890', hair: 'mohawk', hc: '#8c46c8', shirt: '#1a1a1a', pants: '#1a1a1a', shoes: '#c83c3c', body: 'thin', voice: 470, color: '#c878f0' },
  chavo:    { name: 'EL CHAVO', skin: '#c89468', hair: 'beanie', hc: '#1a1a1a', cap: '#c83c28', shirt: '#6a6a6a', pants: '#2c4c8c', shoes: '#f0f0f0', body: 'thin', voice: 480, color: '#c83c28' },
  // shop owners
  chayo:    { name: 'CHAYO', skin: '#d8a070', hair: 'bun', hc: '#6a2a1a', shirt: '#f46eaa', pants: '#3c3c64', shoes: '#101010', body: 'fem', glasses: true, voice: 520, color: '#f46eaa' },
  flash:    { name: 'EL FLASH', skin: '#c48a5e', hair: 'mohawk', hc: '#ffd23f', shirt: '#3c64dc', pants: '#26262e', shoes: '#ffd23f', body: 'thin', voice: 520, color: '#5adcf0' },
  donpollo: { name: 'DON POLLO', skin: '#e0b088', hair: 'bald', hc: '#8a7a6a', shirt: '#f4f4f0', pants: '#6e6e82', shoes: '#101010', body: 'big', mustache: true, apron: true, voice: 240, color: '#f08c28' },
  guero:    { name: 'EL GÜERO', skin: '#f0c8a0', hair: 'slick', hc: '#d8b060', shirt: '#8c5a32', pants: '#26262e', shoes: '#5a3218', body: 'wide', mustache: true, voice: 260, color: '#d8b060' },
  lulu:     { name: 'MADAME LULÚ', skin: '#e8c8a8', hair: 'long', hc: '#c878f0', shirt: '#1a1a2e', pants: '#1a1a2e', shoes: '#c83c3c', body: 'fem', shades: true, chain: true, voice: 480, color: '#c878f0' },
  chef:     { name: 'CHEF TOÑO', skin: '#d49a6a', hair: 'short', hc: '#161010', shirt: '#f4f4f0', pants: '#26262e', shoes: '#101010', body: 'normal', apron: true, voice: 380, color: '#d8323c' },
  brayan:   { name: 'BRAYAN', skin: '#b87a4b', hair: 'cap', hc: '#161010', cap: '#46b450', shirt: '#101018', pants: '#46b450', shoes: '#f4f4f0', body: 'thin', chain: true, voice: 460, color: '#46b450' },
  guera:    { name: 'LA GÜERA', skin: '#f0c8a0', hair: 'pony', hc: '#e8c040', shirt: '#28b4a0', pants: '#34466e', shoes: '#f0f0f0', body: 'fem', apron: true, voice: 560, color: '#28b4a0' },
  chema:    { name: 'CAPITÁN CHEMA', skin: '#a8704a', hair: 'cap', hc: '#c8c8d0', cap: '#1e2c78', shirt: '#f4f4f0', pants: '#1e2c78', shoes: '#101010', body: 'wide', mustache: true, voice: 200, color: '#5adcf0' },
  // strangers & freaks (side missions)
  profeta:  { name: 'EL PROFETA', skin: '#c48a5e', hair: 'long', hc: '#e8e8f0', shirt: '#f0ece0', pants: '#f0ece0', shoes: '#8c5a32', body: 'thin', crazy: true, voice: 300, color: '#fff08c' },
  lucha:    { name: 'EL MÍSTICO DEL BARRIO', skin: '#b87a4b', hair: 'bald', hc: '#161010', shirt: '#8c46c8', pants: '#ffd23f', shoes: '#8c46c8', body: 'big', mask: 'luchador', voice: 220, color: '#c878f0' },
  abuela:   { name: 'DOÑA CUCA', skin: '#d8a070', hair: 'bun', hc: '#e8e8f0', shirt: '#5a8c46', pants: '#3c3c64', shoes: '#5a3218', body: 'fem', glasses: true, voice: 620, color: '#a0dc50' },
  influ:    { name: 'LA INFLU', skin: '#e0b088', hair: 'long', hc: '#f46eaa', shirt: '#ffd23f', pants: '#f4f4f0', shoes: '#f46eaa', body: 'fem', shades: true, voice: 640, color: '#ff7ae0' },
  ovni:     { name: 'EL DEL OVNI', skin: '#c89468', hair: 'side', hc: '#5a3a1a', shirt: '#46b450', pants: '#6e6e82', shoes: '#101010', body: 'thin', glasses: true, crazy: true, voice: 450, color: '#a0dc50' },
  unknown:  { name: '???', skin: '#888', hair: 'bald', hc: '#222', shirt: '#222', pants: '#222', shoes: '#111', body: 'normal', voice: 300, color: '#666', silhouette: true },
};

// Random civilian generator (deterministic by seed index)
const SKINS = ['#f0c8a0', '#e0b088', '#d49a6a', '#c48a5e', '#b87a4b', '#a06a40', '#8c5530'];
const HAIRS = ['short', 'long', 'bald', 'slick', 'cap', 'curly', 'side', 'bun', 'beanie', 'pony'];
const HCS = ['#161010', '#2a1a10', '#5a3a1a', '#8a6a3a', '#c8c8d0', '#d8b060', '#6a2a1a'];
const SHIRTS = ['#d8323c', '#3c64dc', '#46b450', '#ffd23f', '#f08c28', '#8c46c8', '#f46eaa', '#28b4a0', '#f4f4f0', '#6e6e82', '#1a1a2e', '#a0dc50', '#5adcf0'];
const PANTS = ['#34466e', '#26262e', '#6e6e82', '#b49664', '#1e2c78', '#5a3218', '#3c3c64'];

export function civilianLook(i) {
  const r = (n) => {
    let h = Math.imul(i + 17, 2654435761) ^ Math.imul(n + 3, 40503);
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return ((h ^ (h >>> 13)) >>> 0) % 1000 / 1000;
  };
  const p = (arr, n) => arr[Math.floor(r(n) * arr.length)];
  const hair = p(HAIRS, 2);
  const fem = hair === 'long' || hair === 'bun' || hair === 'pony' || r(9) < 0.25;
  return {
    name: 'CIVIL', skin: p(SKINS, 1), hair, hc: p(HCS, 3), cap: p(SHIRTS, 8), shirt: p(SHIRTS, 4), pants: p(PANTS, 5),
    shoes: r(6) < 0.5 ? '#101010' : '#f0f0f0', body: fem ? 'fem' : r(7) < 0.2 ? 'wide' : 'normal', glasses: r(10) < 0.15, mustache: !fem && r(11) < 0.2,
    voice: 250 + Math.floor(r(12) * 300), color: '#888',
  };
}
export const CIVILIAN_TYPES = 40;
