# CLAUDE.md — Gresca Arcade

Juego de lucha 2D estilo recreativa de los 90 (parodia tipo «Street Voter»): los luchadores llevan la cara de amigos (foto → filtro cómic) sobre cuerpos dibujados por código. Todo en `<canvas>`, sin dependencias ni compilación.

**Idioma:** responde en español; textos de UI en español de España.

## Reglas para ahorrar tokens
- **No leas archivos enteros.** Usa la tabla de abajo y `grep -n` para saltar a la función. `js/07-drawing.js` (~1100 líneas) y `js/06-match.js` (~600) son los grandes: lee solo el rango que toques.
- No vuelvas a explorar la arquitectura: está resumida aquí. Si cambias algo estructural, **actualiza este archivo**.
- Para comprobar cambios usa `node tools/smoke.js` (una pasada). No hagas bucles de capturas.

## Arquitectura
- Scripts clásicos (no módulos) que **comparten ámbito global**. Se cargan en el orden de los `<script>` de `index.html` (orden alfabético de nombre: `01`, `02`, `03`, `03b`…). Un archivo nuevo necesita su `<script>` ahí, en el orden correcto (antes de quien lo use al cargar).
- Lógica a 60 Hz fijo (`js/11-loop.js`): `Match.step()` simula, `Match.render()` pinta. Lienzo lógico **960×540**, suelo en `GROUND=478`.
- `render()` pasa por `paint()` (`03b-stages.js`): si `PIXEL` es true dibuja a media resolución y amplía sin suavizar (look 16 bits).

| Archivo | Contiene (globales principales) |
|---|---|
| `01-constants.js` | `W,H,GROUND,GRAV,JUMPV,MAXHP`, `MOVES` (datos de cada golpe), `VIS`, `ATKS`, utilidades `rnd clamp mix` |
| `02-sound.js` | `SFX` (efectos sintetizados con WebAudio, `SFX.play(nombre)`) |
| `03-faces.js` | `makeCanvas`, `shadeColor`, `drawCartoonFace` (caras de serie), `stylize` (filtro cómic/pixel de fotos) |
| `03b-stages.js` | `STAGES`, `drawStage(c, frame, id)`, `paint`, `PIXEL` |
| `03c-scenes.js` | Pantallas entre combates (`runScene`, `drawScene`: vs/win/continue/ending), `say()` locutor, `PROJ` + `drawProj` (objetos lanzables), modo arcade (`startArcade`, `arcadeFight`) |
| `03d-music.js` | `MUSIC.start(seed)/stop()` chiptune |
| `04-roster.js` | `BUILTIN` (luchadores de serie), `LORE` (apodo, frase, grito, proyectil, escenario), `sanitizeDef`, `ROSTER`, `byId` |
| `05-fighter.js` | `class Fighter`: estados (`idle walk walkb crouch jump attack hit block kd ko`), `neutral()` lee entradas y lanza golpes, `hitbox()/hurtbox()` |
| `06-match.js` | `class Match`: rondas/tiempo, colisiones, `resolveHit`, proyectiles, efectos (`fx`→`doFx`), HUD, `pack()/apply()` para online |
| `07-drawing.js` | Escenario «bar», `pose(f)` (ángulos por animación), `OUTFITS`, `BUILDS`, `drawFighter`, `drawHead`, partículas |
| `08-input.js` | Teclado (`KEYS1`, `KEYS2`), táctil, mandos (`padIn`), `p1Local()` |
| `09-ai.js` | `makeAI(nivel 0-2)` |
| `10-screens.js` | Navegación (`show`), selección, `startFight` (lanza VS y luego Match), `onMatchEnd`, pausa |
| `12-editor.js` | Editor de luchadores (recorte de foto, campos, guardado) |
| `13-storage.js` | Guardado: `window.claude` db (compartido) o `localStorage` |
| `14-online.js` | Salas online (`net`): anfitrión simula, invitado pinta lo que recibe |

## Modelo de datos de un luchador (`def`)
`{id, name, outfit, build, gi, glove, energy, skin, band, faceImg, title, quote, special, proj, stage}`
- `outfit`: clave de `OUTFITS` (`gi tank boxer lucha calle traje uniforme`). `build`: `normal heavy slim`.
- `gi` = color principal de la ropa, `glove` = acento (cinta, vendas, guantes), `energy` = color del especial.
- `proj`: clave de `PROJ`. `stage`: clave de `STAGES` (se pelea en el escenario del jugador 2).
- Datos que vienen de db/localStorage pasan **siempre** por `sanitizeDef` (son datos no fiables). Campo nuevo ⇒ añádelo en `sanitizeDef`, en el editor (`openEditor`, `edDef`, objeto `body` al guardar) y en `index.html`.

## Recetas
- **Nuevo golpe:** entrada en `MOVES` (`st` arranque, `act` activos, `rec` recuperación, `dmg`, `hs/bs` aturdimiento, `box:[x,y,w,h]` relativo a los pies y mirando a la derecha, `lvl: low|mid|high`) → nombre al **final** de `VIS` y `ATKS` → lanzarlo en `Fighter.neutral()` con `this.startAtk(id, M)` → pose en `pose()`.
- **Nuevo luchador de serie:** objeto en `BUILTIN` + entrada en `LORE` con el mismo `id`.
- **Nuevo escenario:** clave en `STAGES`, función `buildStageX()` (fondo estático cacheado en `STAGECACHE`) y animación en `drawStage`; añadir `<option>` en `#edStage`.
- **Nuevo objeto lanzable:** clave en `PROJ`, rama en `drawProj`, `<option>` en `#edProj`.
- **Nueva ropa:** entrada en `OUTFITS` (`torso`, `legs`, `feet`, `hands`, `boot`) y las ramas correspondientes en `drawFighter`; `<option>` en `#edOutfit`.

## Trampas conocidas
- **Online:** `VIS` se envía como índice ⇒ añade valores solo al final. El estado viaja por `presence` del `room` (máx. 4 KiB): mantén `pack()` pequeño. Efectos y sonidos llegan al invitado como eventos (`fx`) — usa `this.fx()`, no `doFx()` directo.
- `window.claude` (db, room) **solo existe en claude.ai**. Fuera, `claude.use` no está y el juego cae a localStorage y oculta el online. No rompas ese camino.
- Dentro de claude.ai no funcionan `alert/confirm/prompt` ni descargas por enlace: confirmaciones dentro de la propia página.
- Al cambiar `buildStage*` o fuentes, invalida cachés (`STAGE=null; STAGECACHE={}`) — ya se hace al cargar la fuente Bungee en `99-boot.js`.
- Todo color de UI va por tokens CSS en `:root` de `css/style.css`.

## Comandos
```bash
node tools/smoke.js          # carga el juego en Chromium headless, juega combates CPU vs CPU y arcade; falla si hay errores
node tools/bundle.js         # genera dist/gresca.html (archivo único para publicar en claude.ai)
npx prettier@3.3.3 --print-width 120 --write "js/*.js" index.html css/style.css   # formato del repo
```
`smoke.js` necesita Playwright con Chromium (`npm i -D playwright && npx playwright install chromium` si no lo tienes).

## Publicar
La versión jugable con online vive como artifact en claude.ai. Para actualizarla: `node tools/bundle.js` y publicar `dist/gresca.html` en el artifact existente (mismo enlace). `dist/` no se versiona.
