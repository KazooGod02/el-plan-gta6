# EL PLAN — Estado del beta y bugs conocidos

> Documento para retomar el proyecto desde cualquier dispositivo.
> Última actualización: 29 de septiembre de 2026 (arreglos: teléfono, Cap. 2 y muerte).

- **Jugar:** https://kazoogod02.github.io/el-plan-gta6/
- **Repo:** https://github.com/KazooGod02/el-plan-gta6

---

## ¿De qué trata?

**EL PLAN** es un juego 8-bit de KazooGod02 que sirve de precuela del tráiler **"El Escape"**. Se lanza como parte del rollout, después del teaser. (Dentro del juego ya no se menciona el marathon: no está confirmado hasta que salga el tráiler.)

Cuenta los **21 días antes del trailer**, en Puerto Vicio, una ciudad ficticia:

- **Kazoo** le debe $50,000 a Don Chuy.
- **Coqui** sale del penal después de que su socio lo delató.
- **Ghenghis**, ex guardia del Banco Federal, completa el equipo.

Juntos planean el atraco al banco. En el camino pasa todo lo que el trailer da por hecho:

- el Tsuru que Kazoo compra en el Marketplace ("tenía 5 estrellas");
- la paranoia de Coqui;
- la mochila del plan B enterrada en el campo;
- el vendedor que resulta ser informante de la policía.

El juego termina exactamente en el primer segundo del trailer: pantalla negra y "¡Córranle, córranle!".

**Cómo se juega:**

- **La ciudad:** mundo libre visto desde arriba, estilo GTA 1/2. Tiene manejo, tráfico, policía con estrellas de búsqueda, radio, día/noche y clima.
- **Los interiores:** en 2D de lado. Ahí están el sigilo, las coberturas y los tiroteos.
- **La historia:** prólogo + 9 capítulos, 27 misiones en total.
- **Minijuegos:** Kazoo Kart, campo de tiro, lotería, máscaras, Marketplace, taladro y repartos.
- **Extraños y locos:** 5 misiones secundarias opcionales, marcadas con un **?** rosa (El Profeta, Doña Cuca y su gato, El Místico del Barrio, La Influ, El del OVNI).
- **Negocios:** tiendas de ropa (cambian la ropa de Kazoo y quitan 1 estrella), zapaterías (tenis que te hacen correr más), restaurantes (vida) y bares (cerveza, dominó y chismes).
- **Por el mapa:** corazones rojos (+50 vida), chalecos antibalas azules y estrellas verdes de soborno (-1 estrella). Reaparecen con el tiempo.
- **El teléfono** funciona como menú: chat del grupo, Marketplace, mapa, deuda, radio, cassettes, logros, ajustes y guardar.
- **GPS y mapa:** ruta morada en el radar, distancia y una flecha alrededor de Kazoo que apunta al objetivo. El mapa completo (tecla **M**, o Cel > Mapa) se mueve, tiene zoom, waypoint e índice de lugares por categoría.
- **Extras:** coleccionables (15 cassettes, 10 estrellas doradas, 20 grafitis, 5 kazoos), 20 logros, trucos, modo streamer (censura las groserías), timer de speedrun y un cartel final de **SE BUSCA** con los stats de la run (se descarga o se comparte).
- **Final:** los créditos traen cinemáticas animadas de la historia; después, la tarjeta de "El Escape — Próximamente".

Más detalle en [HISTORIA.md](HISTORIA.md) y [DISENO.md](DISENO.md).

---

## Estado actual

| Parte | Estado |
|---|---|
| Motor, ciudad, interiores, UI, teléfono, radio, música | ✅ Hecho |
| Prólogo | ✅ Jugado a mano de principio a fin |
| Capítulos 1–9 + final + post-créditos | ⚠️ Escritos y **probados solo con bot automático**. Nadie los ha jugado a mano todavía. |
| Minijuegos | ⚠️ Funcionan, falta balancear la dificultad |
| Controles táctiles (celular) | ⚠️ Sin probar en un teléfono real |
| Fecha y link del tráiler | ❌ Pendiente: editar `js/config.js` (opcional) |

**Qué hizo el bot:** jugó las 27 misiones teletransportándose y apretando botones solo. Todas arrancan, avanzan y llegan al final **sin errores de código**. El bot **no** sabe si algo es difícil, injusto, feo o confuso. Eso es lo que falta probar a mano.

---

## ⚠️ Bugs conocidos y cosas que pueden estar rotas

Si te pasa algo de esto, anótalo con **capítulo, qué pasó, captura** y, si puedes, los errores en rojo de la consola (F12).

### Reportados

- [x] **Policía demasiado agresiva** (salían de la nada, atravesaban casas, embestían). Ahora aparecen más lejos y fuera de pantalla, son un poco más lentas, las estrellas suben por "calor" acumulado con pausa entre estrellas, y con 1–3 estrellas te siguen en lugar de embestirte. Ya no te suben estrellas por choques que provoca la patrulla. Los choques ya no empujan carros a través de las paredes.
- [x] **Arrestado y encerrado en El Centro al principio.** Si El Centro sigue cerrado, la patrulla te deja en La Colonia.
- [x] **La misión de la azotea no decía dónde era.** Era un bug: el marcador nunca aparecía. Ya sale en la Pensión, el objetivo dice a dónde ir y el GPS te lleva.
- [x] **Textos poco legibles / spacings de la UI.** El juego se dibuja a mayor resolución interna, la fuente se ve más nítida, el HUD tiene márgenes fijos y los avisos ya no tapan el dinero, las estrellas ni la vida.
- [x] **Diálogos en el camino que se cortaban.** Duran más, salen en un cuadro compacto que no tapa el radar, y si llegas antes, la escena espera a que terminen.
- [x] **Carros que se chocaban entre sí.** El tráfico respeta los cruces y el daño por choque es menor.
- [x] **Rehenes del banco (Cap. 8).** Se levantan más despacio, nunca más de dos a la vez, traen una barra de cuánto les falta y el grito alcanza más lejos. También hay 20 s más para llegar al banco.
- [x] **HUD:** cuadrito con el arma que traes (y las balas), barra de chaleco, y barra de vida sobre lo que golpeas.
- [x] **"Revisa tu teléfono" no avanzaba (prólogo).** Los scripts de misión se pausan con el teléfono abierto, así que la misión nunca lo "veía" abierto y se quedaba esperando hasta 20 s. Ahora avanza en cuanto cierras el teléfono.
- [x] **Cap. 2: no dejaba salir del cuarto para ir al bar.** El sigilo del taller del Tuercas (Cap. 1) bloqueaba la salida y el bloqueo se quedaba pegado al siguiente cuarto. Ahora cada cuarto limpia esos bloqueos al entrar (también el "ya te vieron" del sigilo, que hacía que la Bodega 7 y la bóveda no fallaran).
- [x] **Al morir no te podías mover (softlock).** Si te mataban mientras la misión tenía los controles bloqueados (diálogo, cinemática), el bloqueo se quedaba para siempre. Ahora morir, fallar o reiniciar limpia todo el estado de la misión (controles, cámara, barras de cine, reglas de la ciudad) y quita a Coqui/Ghenghis duplicados.
- [x] **Nueva app "Misión" en el teléfono** (widget arriba en la pantalla de inicio): capítulo, misión en curso y objetivo actual, o la lista de misiones siguientes. **A: Reiniciar misión** si algo se traba, o **A: Marcar en el GPS** si no hay misión activa (vuelve a poner los marcadores si se perdieron).
- [x] **"REINICIAR MISIÓN" en el menú de pausa.** La pausa se abre aunque los controles estén bloqueados, así que siempre hay salida.
- [x] **"No aparece la misión del penal después del prólogo."** Era la versión vieja en caché: la primera que se subió solo traía el prólogo. **Solución:** recargar con Ctrl + Shift + R (en el celular, cerrar y volver a abrir la pestaña) y darle CONTINUAR. Ya debería arrancar el Capítulo 1.

### Por revisar (sospechosos)

0. **Cosas nuevas sin probar a mano:** las 5 misiones de extraños y locos, las tiendas, los pickups, el GPS en misiones con varios marcadores, y el cartel de SE BUSCA en iPhone.
1. **Dificultad del sigilo:**
   - **Cap. 1, taller del Tuercas:** el "Primo" está pegado al escritorio. Puede que no se alcance a llegar sin que te vea, aunque avientes la tuerca.
   - **Cap. 3, Bodega 7:** los tres guardias con linterna pueden estar muy duros.
   - **Cap. 8, sótano del banco:** las cámaras que giran.
2. **Sospecha en el banco (Cap. 4):** la barra puede llenarse muy rápido (fotos + plática con Reyes) o casi nunca.
3. **Rehenes (Cap. 8):** ya se ajustaron; confirmar que no quedó demasiado fácil.
4. **Tiroteo del banco (Cap. 8):** cantidad de policías, cuánto daño hacen y el tiempo de los refuerzos (95 s, o 150 s si aflojaste la alarma en el Cap. 4).
5. **Tiempo para llegar al banco (Cap. 8):** 2:50. Puede quedar muy justo.
6. **Compañeros que no se suben al carro:**
   - Coqui y Ghenghis tienen que estar cerca cuando te subes. Si no se suben, bájate y vuelve a subir junto a ellos.
   - Coqui no se sube a la moto a propósito (Cap. 1).
7. **Carros atorados:** tráfico o patrullas que se traban en las esquinas, o tu carro que se atasca en paredes.
8. **Guardar y cargar a media historia:** al cargar puede faltar un compañero o algo que la misión espera. Anotar en qué capítulo se cargó.
9. **Celular:** joystick, botones A/B, teléfono, pausa y el aviso de girar la pantalla. Los botones de teléfono/arma/pausa ahora van en columna a la izquierda. Falta probar en un teléfono real.
10. **Texto:** diálogos que se corten, acentos raros o cosas tapadas por el HUD.
11. **Coleccionables:** algún cassette, estrella o grafiti puede quedar en un lugar inalcanzable. Se colocan al azar (con semilla fija).
12. **Audio:** la música empieza hasta el primer toque o tecla. Es a propósito, porque el navegador lo exige. Revisar volumen y que no se encimen canciones.
13. **Persecución final (Cap. 9):**
    - El Tsuru pierde vida solo con el tiempo y la policía siempre sabe dónde estás. Eso es a propósito por el rastreador del vendedor.
    - Si se siente injusto, se ajusta.
14. **Caché de GitHub Pages:** después de cada actualización puede tardar hasta unos 10 minutos en verse. Recargar con Ctrl + Shift + R.

---

## Trucos útiles para probar (se escriben en la ciudad)

| Código | Efecto |
|---|---|
| `KAZOOGOD` | Invencible |
| `TSURITO` | Aparece un Tsuru |
| `SINPOLICIA` | Quita a la policía |
| `CINCOESTRELLAS` | 5 estrellas de búsqueda |
| `PAALLA` | Te teletransporta al campo (si Las Afueras ya están abiertas) |
| `BALAS` | Balas infinitas |
| `VOLADOR` | Caminas más rápido |
| `NOSEWEY` | Chiste |

---

## Cómo retomarlo en otro dispositivo

```bash
git clone https://github.com/KazooGod02/el-plan-gta6.git
```

- **Correr local:** es HTML + JavaScript sin dependencias, pero usa módulos ES, así que necesita un servidor. Cualquiera sirve, por ejemplo `npx serve .` o `python -m http.server`. Luego abrir `http://localhost:<puerto>`.
- **Publicar:** hacer push a `main`. GitHub Pages sirve la raíz del repo.
- **Configurar el lanzamiento:** `js/config.js` (fecha del tráiler, link del canal, hashtag, capítulos por fecha). Si no hay fecha, no se muestra ninguna cuenta regresiva.

### Mapa del código

| Carpeta / archivo | Qué hay |
|---|---|
| `js/main.js` | Arranque, loop principal, trucos |
| `js/core/` | Input, audio chiptune, fuente bitmap, gráficos, guardado |
| `js/data/` | Personajes (`cast.js`), sprites procedurales, música, textos, tiendas/ropa/tenis (`shops.js`) |
| `js/world/` | Mapa de Puerto Vicio, tiles, vehículos/peatones, escena de ciudad |
| `js/interior/` | Escena de lado, cuartos (`rooms.js`), muebles (`props.js`) |
| `js/ui/` | HUD y diálogos (`ui.js`), teléfono, mapa completo (`bigmap.js`), menús |
| `js/story/` | Administrador de misiones (`story.js`), helpers de guion (`script.js`), logros, final, misiones secundarias (`side.js`), tiendas (`shops.js`), cinemáticas de créditos (`cinematics.js`) |
| `js/story/missions/` | Una hoja por capítulo: `prologo.js`, `cap1.js` … `cap9.js` |
| `js/minigames/` | Kazoo Kart, campo de tiro, lotería, máscaras, Marketplace, taladro, repartos |

**Herramienta de pruebas:** en la consola del navegador existe `__tick(n)`, que avanza `n` frames del juego aunque la pestaña esté oculta, y `G`, que expone el estado global (por ejemplo `G.state`, `G.story.active`).
