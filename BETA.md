# EL PLAN — Estado del beta y bugs conocidos

> Documento para retomar el proyecto desde cualquier dispositivo.
> Última actualización: 28 de septiembre de 2026.

- **Jugar:** https://kazoogod02.github.io/el-plan-gta6/
- **Repo:** https://github.com/KazooGod02/el-plan-gta6

---

## ¿De qué trata?

**EL PLAN** es un juego 8-bit que sirve de precuela del trailer **"El Escape"**, hecho para la **GTA VI Marathon de KazooGod02**. Se lanza como parte del rollout, después del teaser.

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
- **El teléfono** funciona como menú: chat del grupo, Marketplace, mapa, deuda, radio, cassettes, logros, ajustes y guardar.
- **Extras:** coleccionables (15 cassettes, 10 estrellas doradas, 20 grafitis, 5 kazoos), 20 logros, trucos, modo streamer (censura las groserías), timer de speedrun y una tarjeta final para compartir.

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
| Fecha y link del marathon | ❌ Pendiente: editar `js/config.js` |

**Qué hizo el bot:** jugó las 27 misiones teletransportándose y apretando botones solo. Todas arrancan, avanzan y llegan al final **sin errores de código**. El bot **no** sabe si algo es difícil, injusto, feo o confuso. Eso es lo que falta probar a mano.

---

## ⚠️ Bugs conocidos y cosas que pueden estar rotas

Si te pasa algo de esto, anótalo con **capítulo, qué pasó, captura** y, si puedes, los errores en rojo de la consola (F12).

### Reportados

- [x] **"No aparece la misión del penal después del prólogo."** Era la versión vieja en caché: la primera que se subió solo traía el prólogo. **Solución:** recargar con Ctrl + Shift + R (en el celular, cerrar y volver a abrir la pestaña) y darle CONTINUAR. Ya debería arrancar el Capítulo 1.

### Por revisar (sospechosos)

1. **Dificultad del sigilo:**
   - **Cap. 1, taller del Tuercas:** el "Primo" está pegado al escritorio. Puede que no se alcance a llegar sin que te vea, aunque avientes la tuerca.
   - **Cap. 3, Bodega 7:** los tres guardias con linterna pueden estar muy duros.
   - **Cap. 8, sótano del banco:** las cámaras que giran.
2. **Sospecha en el banco (Cap. 4):** la barra puede llenarse muy rápido (fotos + plática con Reyes) o casi nunca.
3. **Rehenes (Cap. 8):** con 3 complicaciones fallas. Puede estar muy fácil o imposible.
4. **Tiroteo del banco (Cap. 8):** cantidad de policías, cuánto daño hacen y el tiempo de los refuerzos (95 s, o 150 s si aflojaste la alarma en el Cap. 4).
5. **Tiempo para llegar al banco (Cap. 8):** 2:50. Puede quedar muy justo.
6. **Compañeros que no se suben al carro:**
   - Coqui y Ghenghis tienen que estar cerca cuando te subes. Si no se suben, bájate y vuelve a subir junto a ellos.
   - Coqui no se sube a la moto a propósito (Cap. 1).
7. **Carros atorados:** tráfico o patrullas que se traban en las esquinas, o tu carro que se atasca en paredes.
8. **Guardar y cargar a media historia:** al cargar puede faltar un compañero o algo que la misión espera. Anotar en qué capítulo se cargó.
9. **Celular:** joystick, botones A/B, teléfono, pausa y el aviso de girar la pantalla. Todo sin probar en un teléfono real.
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
| `NOSEWEY` / `MARATHON` | Chistes |

---

## Cómo retomarlo en otro dispositivo

```bash
git clone https://github.com/KazooGod02/el-plan-gta6.git
```

- **Correr local:** es HTML + JavaScript sin dependencias, pero usa módulos ES, así que necesita un servidor. Cualquiera sirve, por ejemplo `npx serve .` o `python -m http.server`. Luego abrir `http://localhost:<puerto>`.
- **Publicar:** hacer push a `main`. GitHub Pages sirve la raíz del repo.
- **Configurar el marathon:** `js/config.js` (fecha, link del stream, hashtag, capítulos por fecha).

### Mapa del código

| Carpeta / archivo | Qué hay |
|---|---|
| `js/main.js` | Arranque, loop principal, trucos |
| `js/core/` | Input, audio chiptune, fuente bitmap, gráficos, guardado |
| `js/data/` | Personajes (`cast.js`), sprites procedurales, música, textos |
| `js/world/` | Mapa de Puerto Vicio, tiles, vehículos/peatones, escena de ciudad |
| `js/interior/` | Escena de lado, cuartos (`rooms.js`), muebles (`props.js`) |
| `js/ui/` | HUD y diálogos (`ui.js`), teléfono, menús |
| `js/story/` | Administrador de misiones (`story.js`), helpers de guion (`script.js`), logros, final |
| `js/story/missions/` | Una hoja por capítulo: `prologo.js`, `cap1.js` … `cap9.js` |
| `js/minigames/` | Kazoo Kart, campo de tiro, lotería, máscaras, Marketplace, taladro, repartos |

**Herramienta de pruebas:** en la consola del navegador existe `__tick(n)`, que avanza `n` frames del juego aunque la pestaña esté oculta, y `G`, que expone el estado global (por ejemplo `G.state`, `G.story.active`).
