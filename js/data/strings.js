// Flavor text: pedestrian barks, radio, marketplace, cassettes.
export const BARKS = {
  generic: [
    '¿Viste el precio de las tortillas?', 'Mi primo compró un carro en el Marketplace y se le apagó en la carretera vieja.',
    'Dicen que la Comandante Reyes no duerme.', 'Hace un calor de la...', '¿Ya viste el teaser ese?',
    '¿Quién pone reggaetón a las 7 AM?', 'Le di cinco estrellas a mi dentista. Error.', 'No hay pedo, no hay pedo.',
    'Ese wey me debe 200 pesos desde 2019.', 'Voy tarde. Siempre voy tarde.', '¿Tú crees que llueva?',
    'Mi ex vende pasteles en el Marketplace. 5 estrellas. Increíble.', 'Nomás vine por unas papitas.',
    'En el Banco Federal te hacen fila hasta para respirar.', 'Doña Mari hace los mejores tacos de PV.',
    'Dicen que en el puerto venden de todo. DE TODO.', 'El Tuercas me arregló el carro... dos veces... la misma falla.',
    '¿Eres el de las entregas? Llegaste frío la última vez.', 'Wey, ¿ese es Kazoo? Me debe un taco.',
    'Si ves a Don Chuy, tú no me viste.', 'Aquí en PV todo tiene 5 estrellas y nada funciona.',
    'Ayer vi un Tsuru echando humo negro. Qué miedo.', 'Oh shit, here we go again.', 'Mañana empiezo el gym. Mañana.',
    '¿Me regalas un peso?', 'La neta, la neta... no sé.', 'Pa\' allá, pa\' allá.',
  ],
  night: [
    'Qué haces afuera a esta hora...', 'De noche PV es otra ciudad.', 'Shhh, no hagas ruido.', 'Los tacos de noche saben mejor.',
  ],
  afueras: ['Aquí no pasa nada. Nunca.', 'Cuidado con las víboras.', 'Allá por el campo hay un árbol bien solito.', 'La carretera vieja nadie la usa.'],
  scared: ['¡AUXILIO!', '¡Ay, no, no, no!', '¡Llamen a la policía!', '¡Está loco!', '¡Corran!', '¡Mi mamá!'],
  hit: ['¡Fíjate, wey!', '¡Aprende a manejar!', '¡Ay, mi pie!', '¡¿Qué te pasa?!', '¡Te voy a reportar en el Marketplace!'],
  cop: ['¡ALTO AHÍ!', '¡Policía! ¡No te muevas!', '¡Al suelo!', '¡Detente!', '¡Te tenemos rodeado!'],
};

export const RADIO_STATIONS = [
  { id: 'vicio', name: 'VICIO 8.8 FM', song: 'vicio', dj: 'Synthwave para manejar sin frenos.' },
  { id: 'cumbia', name: 'LA CUMBIA 16-BIT', song: 'cumbia', dj: '¡Pura cumbia pixelada, raza!' },
  { id: 'corridos', name: 'CORRIDOS DEL PUERTO', song: 'corrido', dj: 'Historias que nadie debería cantar.' },
  { id: 'news', name: 'RADIO NOTICIAS PV', song: 'news', dj: 'Noticias de Puerto Vicio.' },
  { id: 'off', name: 'RADIO APAGADO', song: null, dj: '' },
];

export const NEWS = {
  always: [
    'El clima: calor. Mañana: más calor. Pasado mañana: consulte a su santo de confianza.',
    'El Marketplace de Puerto Vicio rompió récord: 10 mil ventas y cero devoluciones. "Nadie regresa a quejarse", dijo un vendedor.',
    'COMERCIAL: ¿Aburrido? KazooGod02 prepara algo. Nadie sabe qué es. Ni él. No se lo pierda.',
    'La Comandante Reyes declaró: "En Puerto Vicio no hay crimen que no se pague". Luego se fue a comprar una torta.',
    'Tacos El Compa fue nombrada "La taquería más responsable de la ciudad" por tercer año consecutivo.',
    'Vecinos de La Colonia reportan a un sujeto que canta con un kazoo a las 3 AM. La policía no ha intervenido.',
    'COMERCIAL: Pinta y Olvida. ¿Tu carro tiene un pasado? Nosotros lo pintamos. Tú lo olvidas.',
    'Se registra tráfico en El Centro. También en el resto de la ciudad. Siempre.',
    'Banco Federal anuncia nuevas medidas de seguridad: una cámara más. La número 7. La 4 sigue chueca.',
    'COMERCIAL: Abarrotes Lupita. Si no lo tenemos, es porque no existe. O porque se acabó.',
    'La carretera vieja cumple 30 años sin mantenimiento. El gobierno promete arreglarla "pronto".',
    'Un hombre en El Puerto asegura haber visto un ovni. Resultó ser un dron del Marketplace.',
  ],
  wanted: [
    'ÚLTIMA HORA: Persecución en curso en Puerto Vicio. Se recomienda no salir... ni entrar.',
    'Reportan a un sujeto causando desmadre en la ciudad. La policía ya va en camino. Tarde, pero va.',
  ],
  bychapter: {
    1: ['Hoy fue liberado del penal un reo conocido como "Coqui". Las autoridades dicen que "se portó bien". Él dice "ni modo".'],
    2: ['Se reporta una pelea en el bar La Última Risa. Nadie se rió.'],
    3: ['Robo reportado en la Bodega 7 del puerto: se llevaron un taladro industrial. La policía sospecha de "alguien con taladro".'],
    4: ['La Comandante Reyes fue vista en el Banco Federal comiendo una torta. "Estaba rica", declaró.'],
    5: ['Usuario VendeRápido_5E del Marketplace recibe su reseña cinco estrellas número 500. "Soy muy honesto", dice.'],
    8: ['ÚLTIMA HORA: Asalto en curso en el Banco Federal. Tres sujetos enmascarados. Uno trae máscara de luchador.'],
  },
};

// Marketplace: cosmetic items that decorate Kazoo's room
export const MARKET_ITEMS = [
  { id: 'pan', name: 'Almohada con forma de pan', price: 180, stars: 5, desc: 'Suave. Huele a bolillo. No se come.' },
  { id: 'lava', name: 'Lámpara de lava', price: 350, stars: 4, desc: 'Para el ambiente. Un poco de lava real.' },
  { id: 'poster', name: 'Póster "VICE CITY"', price: 120, stars: 5, desc: 'Original. Probablemente.' },
  { id: 'planta', name: 'Planta de plástico', price: 90, stars: 5, desc: 'No se muere. Ya está muerta por dentro.' },
  { id: 'kazoo', name: 'Kazoo dorado', price: 999, stars: 5, desc: 'El instrumento de los dioses.' },
  { id: 'tele', name: 'Tele de bulbo', price: 600, stars: 3, desc: 'Solo agarra un canal. Es de cocina.' },
  { id: 'sillon', name: 'Sillón "casi nuevo"', price: 800, stars: 2, desc: 'Tiene una mancha. No preguntes.' },
  { id: 'disco', name: 'Bola disco', price: 450, stars: 5, desc: 'Cualquier cuarto es antro si crees.' },
  { id: 'pato', name: 'Pato de hule gigante', price: 250, stars: 4, desc: 'Mide 1.20 m. No cabe en la regadera.' },
  { id: 'arcade', name: 'Maquinita "Kazoo Kart"', price: 2500, stars: 5, desc: 'Juega Kazoo Kart en tu cuarto.' },
  { id: 'trofeo', name: 'Trofeo de "Mejor Vendedor"', price: 300, stars: 5, desc: 'Nadie sabe de qué. Brilla.' },
  { id: 'cuadro', name: 'Cuadro de un tigre en la luna', price: 400, stars: 5, desc: 'Arte.' },
];

// Joke listings that appear in chapter 5's car search
export const CAR_LISTINGS = [
  { id: 'lambo', name: 'Lamborghini réplica', price: 7000, stars: 3, seller: 'ElPepe_Motors', desc: 'Es un Tsuru con cartón. Pero se ve cabrón.' },
  { id: 'golf', name: 'Carrito de golf', price: 3000, stars: 4, seller: 'ClubCampestrePV', desc: 'Perfecto para huir... lento.' },
  { id: 'vocho', name: 'Vocho sin puertas', price: 5500, stars: 2, seller: 'Vochos_Don_Beto', desc: 'Más aerodinámico. Más fresco.' },
  { id: 'patrulla', name: 'Patrulla "retirada"', price: 6000, stars: 1, seller: 'NoPreguntes22', desc: 'Todavía suena la sirena. No se apaga.' },
  { id: 'camion', name: 'Camión de basura', price: 8000, stars: 4, seller: 'Municipio_PV_Oficial', desc: 'Huele a... éxito.' },
  { id: 'tsuru', name: 'Tsuru 2003 — OFERTA — como nuevo', price: 8499, stars: 5, seller: 'VendeRápido_5E', desc: 'Muy confiable. Nunca nadie ha regresado a quejarse. Trato directo.' },
];

export const CASSETTES = [
  { t: 'Cassette 1 — "Coqui, 2019"', b: 'Voz de Coqui: "Regla del plan: nadie improvisa. NADIE. Si alguien improvisa, se cae todo." (se escucha a Kazoo al fondo: "¿y si improviso bien?")' },
  { t: 'Cassette 2 — "El Tuercas"', b: 'El Tuercas, nervioso: "Me ofrecieron 2 años menos. DOS. Coqui entendería... ¿verdad? ...¿verdad?"' },
  { t: 'Cassette 3 — "Despido"', b: 'Gerente del Banco Federal: "Señor Ghenghis, lo encontramos dormido en la caseta." Ghenghis: "Estaba meditando." "Estaba roncando." "Medito fuerte."' },
  { t: 'Cassette 4 — "Kazoo\'s Tacos Gourmet"', b: 'Kazoo en un comercial casero: "¡Tacos gourmet! ¡Con queso de cabra y mango! ¡A $180 el taco!" Día 9: cerrado.' },
  { t: 'Cassette 5 — "Reyes"', b: 'Grabación policial: "Tres años persiguiendo a ese tal Coqui. Salió. Lo quiero vigilado. Si respira raro, me avisan."' },
  { t: 'Cassette 6 — "Reseña #1"', b: 'Cliente de VendeRápido_5E: "Me vendió un vocho. A la semana me detuvo la policía en la carretera. ¿Casualidad?" (la reseña fue borrada)' },
  { t: 'Cassette 7 — "Doña Mari"', b: 'Doña Mari a Kazoo: "Mijo, tú no naciste para meterte en broncas. Naciste para llegar tarde con los tacos fríos. Y así te quiero."' },
  { t: 'Cassette 8 — "La Tía Gris"', b: 'La Tía Gris: "Yo tuve un socio que dudó. Una vez. Ahora le llevo flores los domingos."' },
  { t: 'Cassette 9 — "Ghenghis, niño"', b: 'Mamá de Ghenghis: "¡Ese niño se ríe de todo! Se cayó de la bici y se rió. Le salió un diente y se rió. Es un peligro."' },
  { t: 'Cassette 10 — "Don Chuy"', b: 'Don Chuy por teléfono: "No, yo no mato a nadie. Yo nomás cobro. La gente sola se asusta... y eso es bien barato."' },
  { t: 'Cassette 11 — "Coqui, penal"', b: 'Coqui escribiendo una carta que nunca mandó: "Kazoo: cuando salga, ¿me vas a ir a recoger? No llegues tarde. (Vas a llegar tarde.)"' },
  { t: 'Cassette 12 — "Reseña #2"', b: 'Otro cliente de VendeRápido_5E: "El carro traía una cajita rara abajo del tablero. El vendedor dijo que era el estéreo." (reseña borrada)' },
  { t: 'Cassette 13 — "El escape"', b: 'Voz misteriosa: "Todo el mundo recuerda cómo terminó. Nadie sabe cómo empezó." (se escucha un kazoo desafinado)' },
  { t: 'Cassette 14 — "El campo"', b: 'Ghenghis, solo: "Si todo sale mal... ahí va a estar. El árbol. La mochila. Por si acaso. Siempre hay que tener un por si acaso."' },
  { t: 'Cassette 15 — "Comandancia"', b: 'Reyes: "¿El vendedor del Marketplace? Sí. Nos ayuda. Cinco estrellas. Muy cooperativo." (click)' },
];
