import { PROLOGO } from './prologo.js';
import { CAP1 } from './cap1.js';
import { CAP2 } from './cap2.js';
import { CAP3 } from './cap3.js';
import { CAP4 } from './cap4.js';
import { CAP5 } from './cap5.js';
import { CAP6 } from './cap6.js';
import { CAP7 } from './cap7.js';
import { CAP8 } from './cap8.js';
import { CAP9 } from './cap9.js';

export const CHAPTERS = [
  { label: 'PRÓLOGO', title: 'CINCO ESTRELLAS', short: 'PRÓLOGO' },
  { label: 'CAPÍTULO 1', title: 'EL QUE SALIÓ', short: 'CAP. 1' },
  { label: 'CAPÍTULO 2', title: 'LA ÚLTIMA RISA', short: 'CAP. 2' },
  { label: 'CAPÍTULO 3', title: 'EL PLAN', short: 'CAP. 3' },
  { label: 'CAPÍTULO 4', title: 'RECONOCIMIENTO', short: 'CAP. 4' },
  { label: 'CAPÍTULO 5', title: 'MARKETPLACE', short: 'CAP. 5' },
  { label: 'CAPÍTULO 6', title: 'LA OTRA MOCHILA', short: 'CAP. 6' },
  { label: 'CAPÍTULO 7', title: 'LA NOCHE ANTES', short: 'CAP. 7' },
  { label: 'CAPÍTULO 8', title: 'EL ATRACO', short: 'CAP. 8' },
  { label: 'CAPÍTULO 9', title: 'LA HUIDA', short: 'CAP. 9' },
];

export const MISSIONS = [...PROLOGO, ...CAP1, ...CAP2, ...CAP3, ...CAP4, ...CAP5, ...CAP6, ...CAP7, ...CAP8, ...CAP9];
