# EL PLAN — Documento de Diseño del Juego
### Precuela 8-bit de "El Escape" — GTA VI Marathon de KazooGod02

> Historia completa en [HISTORIA.md](HISTORIA.md). Este documento define **cómo se juega**.

---

## 0. PILARES
1. **Se siente GTA, se ve NES.** Vista desde arriba, mundo libre, robar carros, estrellas de búsqueda... todo en 8-bit.
2. **Cada cosa conecta con el trailer.** Quien juegue y luego vea el trailer tiene que decir "ahhh, por eso".
3. **Hecho para el marathon.** El juego es parte del rollout: promociona, cuenta los días y premia a la comunidad.
4. **Abre al instante.** Un link, sin descargas, en celular o PC.

---

## 1. FICHA TÉCNICA

| | |
|---|---|
| **Plataforma** | Navegador (GitHub Pages): PC, celular y tablet |
| **Tecnología** | HTML5 Canvas + JavaScript puro, sin frameworks ni build |
| **Resolución interna** | 320×180 px escalado con pixel-perfect (16:9, se ve nítido en cualquier pantalla) |
| **Paleta** | Estilo NES (~54 colores) con una paleta "Vice" de neón para la noche |
| **Audio** | Chiptune **generado en el navegador** (Web Audio API): música, efectos y radio, sin archivos pesados |
| **Controles** | Teclado, **control/gamepad** (Xbox/PS) y **táctil** con joystick virtual |
| **Guardado** | Automático en el navegador, 3 ranuras |
| **Idioma** | Español (tono del trailer) |
| **Peso objetivo** | < 3 MB en total |

---

## 2. MUNDO LIBRE: PUERTO VICIO

### El mapa
Una ciudad de 4 zonas conectadas (≈ 6×6 pantallas cada una) que se desbloquean con la historia, como los puentes cerrados de GTA III.

| Zona | Estética | Lugares |
|---|---|---|
| **La Colonia** | Casas de colores, cables, perros | Cuarto de Kazoo, taquería de Doña Mari, casa de Don Chuy, tiendita, canchita |
| **El Centro** | Edificios, neón, tráfico pesado | Banco Federal, bar La Última Risa, tienda de disfraces, comandancia, cine |
| **El Puerto** | Grúas, contenedores, humedad | Taller-escondite, galpón de La Tía Gris, muelle, bodegas |
| **Las Afueras** | Terracería, palmeras, nada | Penal, carretera vieja, **EL CAMPO** y su árbol solitario, gasolinera abandonada |

### Ciudad viva
- **Ciclo día/noche:** 1 día del juego dura ≈ 12 min reales. De noche se prende el neón y aumentan los peatones raros.
- **Clima:** sol, nublado, **tormenta tropical** (con charcos, lluvia en pantalla y relámpagos que iluminan el mapa).
- **Peatones con frases** (burbujas de texto): chismes de la ciudad, quejas del Marketplace y referencias al trailer.
  - *"Mi primo compró un carro en el Marketplace y se le apagó en la carretera vieja."*
  - *"Dicen que la Comandante Reyes no duerme."*
- **Tráfico con semáforos**, patrullas haciendo ronda, tamaleros y perros callejeros que te siguen si les das taco.

### El calendario: los 21 días
Arriba de la pantalla hay un contador: **"DÍA -14"**. Cada capítulo avanza el calendario. Entre capítulos, el mundo es **libre**: puedes hacer repartos, buscar coleccionables y hacer desmadre. La historia avanza cuando tú vas al marcador de misión.

---

## 3. GAMEPLAY PRINCIPAL

### A pie
- Caminar y correr (con barra de **aliento**, que en el final se vuelve clave).
- Golpes, armas (pistola, escopeta y "la del Marketplace", que se traba) y cobertura contra paredes.
- **Sigilo:** los NPCs tienen cono de visión. Te agachas, te escondes en botes de basura o te pones el disfraz de repartidor.

### Vehículos
- **Robar cualquier carro** de la calle, estilo GTA 1/2, con vista cenital y derrapes.
- Cada vehículo tiene **"personalidad"**: velocidad, frenado, aguante y un **rating de Marketplace**.
  - Los carros comprados en el Marketplace tienen fallas aleatorias (se apagan, echan humo, se les cae la defensa).
- Tipos: moto de reparto, Tsuru, vocho, pickup, patrulla, camión de basura, carrito de golf y **el blindado del banco** (secreto).
- **"Pinta y Olvida":** taller para cambiar el color del carro y perder las estrellas de búsqueda.

### Estrellas de búsqueda ⭐
El mismo ícono que las estrellas del Marketplace. Es un chiste visual que se paga en el post-créditos.

| Nivel | Qué pasa |
|---|---|
| ⭐ | Un policía a pie te persigue |
| ⭐⭐ | Patrullas |
| ⭐⭐⭐ | Retenes en las calles |
| ⭐⭐⭐⭐ | La **Comandante Reyes** en persona, con una patrulla más rápida que tú |
| ⭐⭐⭐⭐⭐ | Helicóptero con reflector y pantalla con viñeta roja. Tu "reseña" como criminal: *"5 estrellas, excelente servicio"* |

### Muerte / Arresto
Pantalla estilo GTA con un letrero 8-bit **"TE MORISTE WEY"** o **"TE AGARRARON"**. Reapareces en la clínica o en la comandancia, y Don Chuy te cobra "comisión".

---

## 4. EL TELÉFONO DE KAZOO (menú principal del juego)
Se abre con una tecla o botón. Es un celular pixelado con la pantalla estrellada.

| App | Función |
|---|---|
| 💬 **Chat "LOS DEL PLAN"** | Grupo de WhatsApp-parodia entre Kazoo, Coqui y Ghenghis que **avanza con la historia**: memes, stickers 8-bit, planes y pistas. Coqui escribe cada vez menos conforme crece su paranoia. En el Cap. 6 Ghenghis abre un **chat privado** con Kazoo ("no le digas a Coqui"). |
| 🛒 **Marketplace** | Comprar objetos absurdos y vehículos, y leer reseñas. Aquí está el perfil de **VendeRápido_5E** (con reseñas que, leídas con atención, dan miedo). |
| 🗺️ **Mapa** | Mapa de la ciudad con marcadores. |
| 📷 **Cámara** | Para el reconocimiento del banco y para el modo foto. |
| 💸 **Deuda** | Contador de lo que le debes a Don Chuy, con cuenta regresiva. |
| 📻 **Radio** | Cambiar la estación dentro del carro. |
| 🏆 **Logros** | Lista de logros. |
| ⚙️ **Ajustes** | Volumen, controles, modo streamer y subtítulos. |

---

## 5. RADIO (dentro de los carros)
Chiptune generado en vivo, con varias estaciones:

| Estación | Contenido |
|---|---|
| **Vicio 8.8 FM** | Synthwave 8-bit, la estación "oficial" |
| **La Cumbia 16-Bit** | Cumbia en chiptune, y ruidosa |
| **Corridos del Puerto** | Corridos 8-bit sobre... ¿Coqui? (cuentan su historia del penal) |
| **Radio Noticias PV** | Locutor en texto que **comenta lo que hiciste**: *"Un sujeto en moto de reparto causó caos en el Centro..."*. Da conferencias de la Comandante Reyes que cambian con la historia y **anuncios de la GTA VI Marathon** como comerciales dentro del juego. |
| **Silencio** | Para los valientes |

---

## 6. MINIJUEGOS

| Minijuego | Dónde | Descripción |
|---|---|---|
| **Repartos de Doña Mari** | La Colonia | Entregas contrarreloj; si llega fría, te bajan estrellas |
| **Marketplace** | Teléfono / Cap. 5 | Navegar anuncios, regatear y comprar |
| **Kazoo Kart** | Bar La Última Risa | Arcade de carreras jugable dentro del juego |
| **Pelea de bar** | Bar | Beat 'em up corto (como Ghenghis) |
| **Campo de tiro** | Galpón de La Tía Gris | Galería de tiro con puntaje y medallas |
| **Disfraces** | Tienda de disfraces | Armar la máscara más fea posible |
| **Atender a Reyes** | Cap. 4 | Diálogo con barra de sospecha, estilo interrogatorio |
| **El taladro** | Cap. 8 | Ritmo + temperatura: si lo sobrecalientas, se rompe la broca |
| **Control de rehenes** | Cap. 8 | Mantener a todos agachados mientras avanza el tiempo |
| **Cartas con Doña Mari** | Taquería | Lotería mexicana 8-bit (apuestas pequeñas) |

---

## 7. PROGRESIÓN Y ECONOMÍA
- **Dinero:** repartos, minijuegos y robos pequeños. Se usa para abonar la deuda, comprar armas, ropa y cosas del Marketplace.
- **Deuda de Don Chuy ($50,000):** si la pagas **completa** antes del atraco, Don Chuy aparece en el Cap. 7 y te devuelve un objeto ("pal viaje"). Final alternativo mínimo sin romper la historia.
- **Guardarropa de Kazoo:** outfits desbloqueables (incluido **el outfit exacto del trailer**, que se desbloquea al pasar el Cap. 8).
- **Cuarto de Kazoo:** se va llenando con lo que compres en el Marketplace (almohada de pan, lámpara de lava, un kazoo dorado...).

### Confianza de Coqui (medidor oculto)
Tus decisiones pequeñas (llegar tarde, mentir, platicar con la policía, cumplir encargos) suben o bajan un medidor que **nunca se muestra**. No cambia el final, porque el trailer es canon, pero cambia:
- Lo que Coqui dice en la azotea (Cap. 7).
- Cuánto escribe en el chat del grupo.
- Una línea final antes del "¡Córranle!".

Es un detalle para que la gente comente en redes: *"¿a ti qué te dijo Coqui?"*.

---

## 8. COLECCIONABLES

| Coleccionable | Cantidad | Recompensa |
|---|---|---|
| **Cassettes perdidos** | 15 | Lore en audio-texto: el pasado de Coqui, el despido de Ghenghis, las víctimas del Vendedor... |
| **Estrellas doradas** | 10 | Todas desbloquean una escena extra que revela el rastreador **antes** del final (logro: "LO SABÍA") |
| **Grafitis de KazooGod02** | 20 | Rociar tags por la ciudad; completarlos desbloquea el outfit "Marathon" |
| **Kazoos escondidos** | 5 | Cada uno toca una nota; juntos tocan **el sting de la Marathon** |

---

## 9. IDEAS CHINGONAS 🔥

### 🕐 Cuenta regresiva REAL del marathon
Hay un **espectacular gigante** en El Centro con un contador **en tiempo real** hasta el marathon, que usa la hora del jugador. El día del marathon el espectacular cambia a **"EN VIVO AHORA"** con el link al stream.

### 📼 Lanzamiento por episodios (sincronizado con el rollout)
El juego se lanza completo en el repo, pero **los capítulos se desbloquean por fecha real**:
- **Día del teaser:** Prólogo – Cap. 3
- **+X días:** Cap. 4 – 6
- **Día del full trailer:** Cap. 7 – 9 (el final conecta justo con el trailer que acaban de ver)

Así la gente regresa varias veces antes del marathon y el trailer "completa" la historia. *(Opcional: se puede lanzar todo de golpe.)*

### 🎬 Cinemáticas 8-bit con letterbox
Barras negras, subtítulos con efecto máquina de escribir, zoom de cámara y sprites grandes para los momentos clave (la azotea, el Tsuru muriendo, el post-créditos).

### 🆚 Pantallas "MISIÓN SUPERADA"
Estilo GTA clásico, pero con **reseña de Marketplace**: *"MISIÓN SUPERADA — Coqui te calificó con ⭐⭐⭐☆☆: llegaste tarde otra vez."*

### ⌨️ Trucos / cheats (tradición GTA)
Escribir códigos durante el juego:

| Código | Efecto |
|---|---|
| `CINCOESTRELLAS` | Búsqueda al máximo |
| `TSURITO` | Aparece el Tsuru del trailer (indestructible... casi) |
| `NOSEWEY` | Todos los NPCs dicen "no sé we la neta" |
| `PAALLA` | Te teletransporta a EL CAMPO |
| `MARATHON` | Música del marathon en todas las estaciones |
| `KAZOOGOD` | Modo cabezón (sprites con cabeza gigante) |

Los códigos se pueden **filtrar en el stream o en redes** como parte del rollout.

### 🎙️ Modo Streamer
Un switch que **censura las groserías con un "bip" chiptune** y oculta textos sensibles. Sirve para que otros streamers lo jueguen sin broncas en Twitch o YouTube.

### ⏱️ Modo Speedrun
Se desbloquea al terminar el juego: timer en pantalla y splits por capítulo. Es ideal para un reto en vivo durante el marathon ("¿quién lo pasa más rápido?").

### 📸 Tarjeta final para compartir
Al terminar, el juego genera una **imagen descargable** con tus estadísticas:
> Tiempo: 2:07:33 · Muertes: 14 · Veces que compraste en Marketplace: 23 · Confianza de Coqui: ??? · Cassettes: 12/15
> **#KazooGTA6Marathon**

Así la comunidad lo comparte solo.

### 📺 El teaser dentro del juego
En el bar y en la tiendita hay teles que pasan una **versión 8-bit del teaser real**. Si te quedas viéndolo 10 segundos, sale un logro.

### 🌾 El árbol del campo
Desde el Cap. 6, el árbol solitario del campo se ve desde casi cualquier punto alto del mapa. Después de terminar el juego, si vas ahí, la mochila ya no está... *(gancho para lo que venga después del marathon).*

### 🏆 Logros con nombres del guion

| Logro | Cómo |
|---|---|
| **"Estaba en oferta"** | Comprar el Tsuru |
| **"Real question"** | Elegir la opción de diálogo más tonta 10 veces |
| **"Pues me apuntó muy feo"** | Ganar el campo de tiro con puntaje perfecto |
| **"Oh shit here we go again"** | Morir 3 veces en la misma misión |
| **"Dont do this bro"** | Recibir 5 estrellas de búsqueda |
| **"Pa' allá"** | Visitar EL CAMPO antes del Cap. 6 |
| **"El carro no tenía estrellas"** | Terminar el juego |
| **"Lo sabía"** | Descubrir el rastreador antes del final |

---

## 10. DATOS PENDIENTES DE CONFIRMAR
- [ ] Fecha y hora del marathon (para el contador y la pantalla final)
- [ ] Plataforma y link del stream (Twitch / YouTube / Kick)
- [ ] Fechas del teaser y del full trailer (si usamos el lanzamiento por episodios)
- [ ] Nombre del repo / usuario de GitHub
- [ ] ¿Logo del marathon en imagen para ponerlo en la pantalla final?
- [ ] ¿Cheats: los publicamos o los dejamos secretos?

---

## 11. PLAN DE CONSTRUCCIÓN (cuando se apruebe)

| Fase | Contenido |
|---|---|
| **1. Motor** | Render 8-bit, tilemap, colisiones, cámara, controles (teclado/gamepad/táctil), audio chiptune, guardado |
| **2. Mundo** | Puerto Vicio (4 zonas), tráfico, peatones, día/noche, clima, estrellas de búsqueda |
| **3. Sistemas** | Teléfono, Marketplace, radio, chat del grupo, dinero y deuda, coleccionables |
| **4. Historia** | Prólogo → Cap. 9 + post-créditos, con cinemáticas y minijuegos |
| **5. Extras** | Cheats, logros, speedrun, tarjeta final, modo streamer, contador real |
| **6. Publicación** | Repo público + GitHub Pages + pruebas en celular |
