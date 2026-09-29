// ==========================================================================
//  CONFIGURACIÓN DEL LANZAMIENTO — edita solo este archivo
// ==========================================================================
export const CONFIG = {
  // Fecha y hora del tráiler "El Escape" (ISO con zona horaria). null = no se muestra nada.
  // Ejemplo: '2026-11-19T18:00:00-06:00'
  marathonDate: null,

  // Canal y link que aparecen en la pantalla final (vacío = no se muestra)
  streamName: 'KazooGod02',
  streamUrl: '',              // ej. 'https://twitch.tv/kazoogod02'

  // Hashtag para el cartel final
  hashtag: '#ElPlanKazoo',

  // Lanzamiento por episodios: capítulos que se desbloquean por fecha real.
  // Cada entrada: { chapter: número de capítulo desde el que se bloquea, date: ISO }
  // Deja la lista vacía para lanzar todo el juego de golpe.
  episodes: [
    // { chapter: 4, date: '2026-10-15T12:00:00-06:00' },
    // { chapter: 7, date: '2026-10-29T12:00:00-06:00' },
  ],
};
