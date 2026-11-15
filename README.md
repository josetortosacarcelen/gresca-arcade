# Gresca Arcade

Juego de lucha 2D estilo arcade con luchadores personalizables: subes una foto y se convierte en la cara del luchador.

Tiene modo arcade, combate libre, 2 jugadores y online, con pantallas de VS y de victoria, escenarios, música y locutor.

Sin dependencias ni compilación: HTML, CSS y JavaScript a pelo, dibujado en `<canvas>`.

## Jugar

Abre `index.html` en el navegador.

| | Jugador 1 | Jugador 2 |
|---|---|---|
| Moverse / saltar / agacharse | A D W S | Flechas |
| Puño · Patada · Especial | F G H | K L Ñ |

- Bola de energía: Especial
- Gancho volador: Abajo + Especial
- Súper (barra llena): Especial
- Bloquear: mantener hacia atrás
- Mandos: X puño · A patada · B especial

## Dónde tocar cada cosa

| Quiero cambiar… | Archivo | Qué buscar |
|---|---|---|
| Daño, velocidad y alcance de los golpes | `js/01-constants.js` | `MOVES` |
| Vida, gravedad, altura de salto | `js/01-constants.js` | `MAXHP`, `GRAV`, `JUMPV` |
| Luchadores de serie (nombre, colores, ropa, complexión) | `js/04-roster.js` | `BUILTIN` |
| Movimiento, estados y nuevos ataques | `js/05-fighter.js` | `class Fighter` |
| Rondas, tiempo, golpes, proyectiles, marcador | `js/06-match.js` | `class Match` |
| Poses y animaciones | `js/07-drawing.js` | `pose` |
| Ropa y complexiones | `js/07-drawing.js` | `OUTFITS`, `BUILDS`, `drawFighter` |
| Escenarios | `js/03b-stages.js` | `STAGES`, `buildStage…`, `drawStage` |
| Pantallas de VS, victoria, continuar y final | `js/03c-scenes.js` | `drawScene` |
| Modo arcade (orden y dificultad de rivales) | `js/03c-scenes.js` | `startArcade`, `arcadeFight` |
| Objetos que se lanzan (chancla, jamón…) | `js/03c-scenes.js` | `PROJ`, `drawProj` |
| Apodos, frases y gritos de los luchadores de serie | `js/04-roster.js` | `LORE` |
| Música | `js/03d-music.js` | `MUSIC.pump` |
| Teclas y mandos | `js/08-input.js` | `KEYS1`, `KEYS2`, `padIn` |
| Dificultad de la CPU | `js/09-ai.js` | `makeAI` |
| Sonidos | `js/02-sound.js` | `SFX.play` |
| Filtro de la foto (cómic, pixel) | `js/03-faces.js` | `stylize` |
| Menús y pantallas | `index.html`, `css/style.css`, `js/10-screens.js` | |
| Editor de luchadores | `js/12-editor.js` | |

Los scripts son clásicos (no módulos) y comparten ámbito global; se cargan en el orden numérico de `index.html`. Si añades un archivo, añade su `<script>` ahí.

### Añadir un golpe

1. Añade su entrada en `MOVES` (`st` arranque, `act` fotogramas activos, `rec` recuperación, `dmg` daño, `box` caja de golpe `[x, y, ancho, alto]` relativa a los pies).
2. Añade su nombre a `VIS` y `ATKS` (al final, para no descolocar el modo online).
3. Lánzalo desde `Fighter.neutral()` con `this.startAtk("nombre", M)`.
4. Dibuja su pose en `pose()`.

### Añadir un luchador de serie

Añade un objeto a `BUILTIN` con `outfit` (uno de `OUTFITS`) y `build` (`normal`, `heavy`, `slim`).

## Online y luchadores compartidos

Las salas online y el guardado compartido de luchadores usan los servicios de claude.ai (`window.claude`), así que solo funcionan en la versión publicada allí como artifact. Abriendo `index.html` directamente, esos botones avisan de que no están disponibles y los luchadores creados se guardan en el navegador.

Para comprobar que todo sigue funcionando (necesita Playwright):

```bash
node tools/smoke.js
```

Para generar el archivo único que se publica en claude.ai:

```bash
node tools/bundle.js
```

Genera `dist/gresca.html`.
