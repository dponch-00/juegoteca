# Estado de Juegoteca

Última actualización: 2026-11-08 · Claude Code

## Fase actual

**Fase 3 — Los cuatro juegos completos** (v0.7.0): ajedrez, damas y backgammon (pasa y juega, en línea y contra la computadora) y **sudoku** (un jugador). Sigue: lecciones de ajedrez y robustez en línea.

## Tickets

| Ticket | Para | Tema | Estado |
| --- | --- | --- | --- |
| [T-001](coordinacion/tickets/T-001-codex-identidad-y-tematica.md) | Codex | Identidad y temática: tres direcciones | cerrado: Daniel eligió **D1 · Taller de fieltro** |
| [T-002](coordinacion/tickets/T-002-codex-produccion-taller-de-fieltro.md) | Codex | Producción de Taller de fieltro: identidad, tokens, fuentes, 12 piezas, logo, iconos | revisado e integrado |
| [T-003](coordinacion/tickets/T-003-codex-pulido-piezas.md) | Codex | Pulido de piezas | cancelado: reemplazado por T-004 |
| [T-004](coordinacion/tickets/T-004-codex-piezas-3d-staunton.md) | Codex | Piezas con aspecto 3D realista, estilo Staunton | cerrado: ronda 2 (render WebP) aceptada y publicada en v0.2.1; pendiente menor T4-04 (alinear base y centrado) |
| [T-005](coordinacion/tickets/T-005-codex-fichas-damas-backgammon.md) | Codex | Fichas de damas (con dama coronada), fichas de backgammon, dados y colores del tablero de backgammon | cerrado: aceptado; damas con fichas 3D en v0.4.1; menor T5-01 (arco bajo la ficha simple) |
| [T-006](coordinacion/tickets/T-006-codex-revision-de-diseno.md) | Codex | Revisión de diseño de toda la app: auditoría con Top 10, maquetas antes/después, juego de iconos de interfaz, T4-04, T5-01 y alternativas de logo | **abierto** |

## Publicación

- Repo: https://github.com/dponch-00/juegoteca (público, rama `main`).
- App: https://dponch-00.github.io/juegoteca/ — cada push a `main` la vuelve a publicar (Actions → Pages).
- Primera publicación 2026-11-08: workflow correcto; verificado en el sitio real que carga, registra el service worker y sirve manifiesto e iconos.

## Qué existe

- PWA con Preact + TypeScript + Vite 8, instalable y offline (`vite-plugin-pwa`, aviso de "versión nueva").
- **Inicio:** nombre del jugador, unirse con código, tarjetas de los cuatro juegos.
- **Ajedrez** (`src/games/chess/`): reglas con `chess.js`; tocar o arrastrar; animación de desplazamiento por pieza (ids estables), captura, jaque, coronación, piezas capturadas y ventaja de material.
- **Pasa y juega:** se guarda sola en el dispositivo; deshacer y reiniciar.
- **En línea** (`src/net/session.ts`): código de 4 caracteres, conexión directa WebRTC con PeerJS (su servidor público solo presenta a los dos dispositivos). El anfitrión reparte colores al azar y es la autoridad. Rendirse, revancha con cambio de colores, reconexión automática y resincronización.
- **Contrato GameDef** (`src/core/types.ts`): un juego nuevo solo implementa `create/apply/turn/outcome/ply` y un `Board`; la red no cambia.
- **Identidad Taller de fieltro:** tokens en `src/styles/tokens.css` (claro por omisión, oscuro según el sistema), Fraunces + Atkinson Hyperlegible Next locales, 12 piezas Staunton renderizadas en 3D (WebP, T-004; la app acepta `.webp` o `.svg`), logo, iconos de juegos y de la PWA, marco de fieltro en el tablero y movimiento según `docs/identity.md`.
- **Contra la computadora** (`src/games/chess/cpu/`, `#/g/chess/cpu`):
  - Motor Stockfish 19 lite (un hilo) en un Web Worker (`src/games/chess/engine/`). Se copia de `node_modules` a `public/engine/` en cada dev/build (`scripts/copy-engine.mjs`), fuera de git. Queda en la caché offline (~1.8 MB).
  - 8 niveles, de Aprendiz a Gran maestro. Los bajos añaden azar entre las candidatas (MultiPV), porque el Skill 0 de Stockfish es demasiado fuerte para quien empieza.
  - Pista con flecha, deshacer, rendirse, partida guardada y estadísticas por nivel.
  - **Repaso:** evalúa cada posición (profundidad 11) y clasifica tus jugadas en buena, imprecisión, error o error grave, con flechas de lo jugado y lo mejor, en notación española.
- **Retos** (`src/games/chess/puzzles/`, `#/g/chess/retos`):
  - 600 problemas de la base de Lichess (CC0) en 8 categorías: mate en 1/2/3, pieza colgada, horquilla, clavada, ensartada y ataque descubierto. Cada categoría va de fácil a difícil.
  - Selección con `scripts/build-puzzles.mjs` a partir de un tramo del `.csv.zst` de Lichess (popularidad ≥ 80, ≥ 300 partidas, desviación ≤ 90). Se cargan aparte (~27 KB gzip) y quedan offline.
  - La jugada del rival se hace sola. Una jugada incorrecta se muestra en rojo con sacudida y se deshace. Pista en dos pasos (pieza y luego flecha), "Ver solución" paso a paso y "Saltar".
  - Progreso por reto (a la primera, con ayuda, solución vista) y racha "🔥" de aciertos a la primera. En la última jugada vale cualquier mate, como en Lichess.
  - `ChessState` admite una FEN inicial; el tablero admite marcas de casilla.
- **Damas** (v0.4.0, `src/games/checkers/`): reglas clásicas latinas (elegidas por Daniel).
  - Peón avanza y captura solo hacia adelante; dama voladora que captura a distancia.
  - Captura obligatoria con **ley de cantidad** (máximo de piezas), sin saltar dos veces la misma pieza; corona al terminar en la última fila.
  - Pierde quien no tiene piezas o jugadas; tablas tras 30 jugadas solo de damas sin capturas.
  - Tablero: capturas múltiples paso a paso, animación siguiendo el zigzag, anillo en las piezas obligadas a capturar y aviso "¡Captura obligatoria!".
  - Pasa y juega y en línea (mismo contrato GameDef). Fichas 3D de Codex (T-005) desde v0.4.1; el CSS queda de respaldo.
- **Backgammon** (v0.6.0, `src/games/backgammon/`): reglas estándar sin cubo de doblar.
  - Puntas 1–24 desde la vista de blancas; cada turno son dos entradas en la partida (`r:a,b` tirada, `m:24/21,…` jugadas, `m:` pasa).
  - Obliga a usar el máximo de dados (el mayor si solo cabe uno); barra primero; sacar fichas exacto o mayor sin fichas más lejos; golpe a fichas solas.
  - Al final anuncia gammon o backgammon.
  - Tablero SVG con los colores de T-005 y fichas y dados 3D de Codex. Cada ficha tiene identidad y se desliza al moverse; los dados se animan al tirar y se atenúan al usarse.
  - Las puntas posibles se iluminan; hay deshacer parcial (↶) y paso automático sin jugadas.
  - **Negras ven el tablero espejado en vertical** (casa abajo a la derecha, como blancas).
  - Pasa y juega, en línea (cada jugador tira sus dados: suficiente entre amigos) y contra la computadora: 4 niveles, heurística de pips, puntas, primas, anclas y riesgo de golpe; Experto promedia las 21 tiradas del rival. Corre en un worker.
  - Simplificación: empiezan blancas, sin tirada inicial.
- **Sudoku** (v0.7.0, `src/games/sudoku/`): juego de un jugador con su propia pantalla (contrato `SoloGameDef` en `src/core/types.ts`, lista `SOLO_GAMES` en el registro; ruta `#/g/sudoku` y `#/g/sudoku/jugar`).
  - Generador propio con semilla: llena un tablero al azar y quita pistas en pares simétricos mientras la solución siga siendo única (menos de 30 ms; no necesita worker).
  - Califica cada sudoku con un resolvedor "humano": 1 = basta con únicos, 2 = pide bloqueo de candidatos o pares/tríos, 3 = pide técnicas más avanzadas. Niveles: Fácil (únicos, ≥38 pistas), Medio (únicos, ≥30), Difícil (nivel 2), Experto (nivel 3).
  - **Reto del día:** misma semilla para la fecha (Medio entre semana, Difícil viernes a domingo), racha de días seguidos.
  - Notas a lápiz, "Anotar todo" (candidatos), deshacer, borrar; poner un número borra esa nota en su fila, columna y bloque. Los números correctos quedan fijos; los incorrectos se ven en rojo y cuentan como error.
  - **Pista que enseña:** primero señala un error; si no hay, ilumina el bloque/fila/columna y explica el "único" ("En este bloque, el 4 solo cabe aquí"); si el sudoku pide técnicas avanzadas, revela la casilla más restringida. Segundo toque o "Ponerlo" la aplica.
  - Resaltado de fila/columna/bloque y del mismo número; teclado con cuántos faltan de cada dígito; destello en onda al completar una fila, columna o bloque; ola diagonal y confeti al terminar.
  - Reloj que solo corre con la app a la vista, pausa que tapa los números, récord y resueltos por nivel; teclado físico (números, flechas, N, retroceso, Ctrl+Z).
  - Vertical: teclado de 9 bajo el tablero; horizontal: teclado 3×3 en la columna lateral.
- **Contra la computadora genérico** (v0.5.0, `src/ui/AiScreen.tsx`): cualquier juego con `game.ai` (contrato `GameAI` en `src/core/types.ts`: niveles, `move`, `hint`, `hintAnnotations`) obtiene sin código extra el modo en el lobby, la elección de nivel y color, la partida con "pensando…", pista, deshacer, rendirse, partida guardada y estadísticas por nivel. **Regla de Daniel: todo juego de dos tiene modo contra la computadora** (también en `AGENTS.md`). El ajedrez conserva su pantalla propia (Stockfish y repaso).
- **Damas contra la computadora** (`src/games/checkers/ai.ts`): negamax con alfa-beta y profundización iterativa. Evalúa material, avance, fila de atrás, bordes y damas al centro; no corta la búsqueda a mitad de una captura. Corre en un Web Worker (`ai.worker.ts`, 4.6 KB, offline). Seis niveles, de Aprendiz (azar 60 %, profundidad 1) a Experto (profundidad 14, 2 s).
- **Pista de ajedrez más fuerte** (v0.7.2, `hintSearch`/`chooseHint`/`hintNote` en `src/games/chess/engine/levels.ts`):
  - Antes se cortaba en profundidad 14 (más débil que Maestro y Gran maestro) y Stockfish recibía solo la FEN, sin historia: no veía las repeticiones y caía en tablas.
  - Ahora piensa sin tope de profundidad, 2.5× el tiempo del rival (entre 1.5 y 4 s), se detiene al encontrar mate y recibe la partida completa (`moves` en `SearchOptions`; la computadora también).
  - MultiPV 3: si la mejor repite una posición ya vista, prefiere otra que no repita y sea casi igual de buena (≤ 0.5 peones peor y no peor que −0.3), para buscar ganar en vez de tablas.
  - Bajo el tablero explica la jugada: "Con esta jugada das mate en 3", "Ventaja decisiva (+3.2)", "Posición pareja", "La mejor defensa", corona a caballo…
- **Botón de orientación** (v0.7.1, `src/ui/OrientationButton.tsx`): círculo fijo arriba a la derecha en celulares y tablets (`pointer: coarse` y `screen.orientation.lock`). Cambia Automático → Horizontal (H) → Vertical (V) y lo recuerda; al abrir la app lo vuelve a aplicar. Motivo: Android fija la orientación del manifiesto al instalar, y quien instaló cuando estaba en vertical se quedaba así. En el navegador sin instalar pide pantalla completa (con límite de 1.5 s); si no se puede, avisa "Instala la app para fijar la orientación". Los `.topbar` reservan 52 px. Ícono provisional dibujado por Claude (falta `rotate.svg` en el set de Codex).
- **Celular y tablet, vertical y horizontal** (v0.3.1):
  - El manifiesto ya no fija la orientación (`any`).
  - Las pantallas de partida (Match, retos, repaso) tienen `.board-wrap` y `.match-side`. En vertical el panel se disuelve (`display: contents`) y se ordena alrededor del tablero (`.pre` = arriba). En horizontal el tablero ocupa toda la altura a la izquierda; a la derecha van el título, el rival arriba y tú con los botones abajo.
  - Los menús (`.screen.wide`) se ensanchan a 1000 px en tablet, con rejillas automáticas; el lobby se reparte en tres columnas.
- **Licencia GPL-3.0-or-later** (por Stockfish). Créditos y enlace al código en `#/acerca`.
- Estadísticas por juego en `localStorage`.
- `npm run app:screens [-- filtro]` (`scripts/app-screens.mjs`): levanta Vite, abre Chrome/Edge sin ventana por el protocolo DevTools (sin dependencias nuevas), siembra `localStorage` por escena y guarda 42 capturas en `design/review/app/` (fuera de git): 17 escenas en celular claro y oscuro, y las cuatro partidas también en horizontal y tablet. Movimiento reducido para no capturar a medio animar. Sirve para que Codex revise la app real.
- `npm run pieces:sheet`: hoja de contacto PNG de las 12 piezas a 36/64 px en claro, oscuro y grises (`design/review/`, fuera de git), para revisar sin navegador.
- Deploy automático a GitHub Pages (`.github/workflows/deploy.yml`), base `/juegoteca/`.

## Cómo se verificó

**2026-11-11 (pista de ajedrez):** 83/83 pruebas (6 nuevas de la pista). Simulación con Stockfish en Node jugando SOLO las pistas contra cada nivel de la app (tiempos ÷4 para emular el celular), 4 partidas por nivel alternando color, 96 en total: **ninguna derrota**. Niveles 1–5: siempre gana. Pista nueva: nivel 7 4/4 (antes 3/4); niveles 6 y 8 casi siempre tablas, todas en posiciones iguales (evaluación 0). Contra Gran maestro no se puede garantizar ganar: es el mismo motor. En el navegador: la pista responde en ~1.6 s con flecha y texto.

**2026-11-10 (orientación):** en el navegador con emulación táctil: el botón aparece en vertical y horizontal sin tapar el título ni el panel; en escritorio (sin bloqueo) muestra el aviso de instalar. **No verificado en la tablet real**: el bloqueo solo funciona en Android con la app instalada o en pantalla completa.

**2026-11-08 (capturas para T-006):** `npm run app:screens` generó las 42 capturas sin fallos; revisé cuatro a mano: selección de alfil con destinos, backgammon oscuro con dados, sudoku con pista de error y hoja de resultado oscura con confeti.

**2026-11-08 (sudoku):** 78/78 pruebas; 12 de sudoku (resolver, unicidad, cada nivel genera la dificultad pedida con solución única, misma semilla = mismo reto, notas, deshacer, errores, la pista de "único" lleva a resolver el clásico sin errores). Generación medida: Fácil/Medio ≤3 ms, Difícil ≤22 ms, Experto ≤6 ms en escritorio. En el navegador:
- 375×812 oscuro: lobby, partida Fácil, notas, número incorrecto en rojo con contador, pista que señala el error, "Borrarlo", pista de único con su bloque iluminado, y partida completa hasta "¡Resuelto!" con récord guardado y "1 resuelto" en el inicio.
- 360×640 claro (celular chico): todo cabe sin desplazar; seleccionar un 1 ilumina todos los 1 y su fila, columna y bloque.
- 812×375 y 1180×820: tablero a toda la altura y teclado 3×3 al lado.
- El panel del navegador reportaba la página como oculta, así que **no se vio correr el reloj ni las animaciones en vivo**; el reloj se comprobó por código.

**2026-11-08 (backgammon):** 66/66 pruebas; 13 de reglas y 5 del motor, que en la apertura 3-1 elige solo 8/5 6/5. En el navegador:
- Posición inicial correcta (8 pilas, 167 pips).
- Turno completo tocando las puntas: tirar, elegir y mover; las puntas destino se iluminan y los pips bajan.
- Contra Experto: la computadora tira y mueve sola en 0.7 s; deshacer vuelve a mi tirada sin volver a tirar; la pista marca 13→11→8.
- Con negras en tablet horizontal: tablero espejado, toques correctos y la computadora golpea una ficha sola.
- En línea no se probó aparte: usa el mismo camino genérico que ajedrez y damas.

**2026-11-08 (damas contra la computadora):** 48/48 pruebas; 6 del motor: posición equilibrada, jugada legal, no regala una ficha, prefiere coronar, respeta el límite de tiempo y azar por nivel. En el navegador a 375 px:
- El lobby de damas muestra el modo solo; la selección de nivel y color usa las fichas 3D.
- Con negras en nivel 5, el worker juega primero (e3-f4) con los puntos de "pensando" y el tablero girado.
- La respuesta llega tras mi jugada; la pista marca origen y destino; deshacer vuelve a mi turno.
- El ajedrez sigue con su pantalla propia.

**2026-11-08 (damas):** 42/42 pruebas; 12 de damas (inicio, solo hacia adelante, captura obligatoria, ley de cantidad, dama voladora, sin doble salto, coronación, bloqueo, seguimiento). En el navegador a 375 px:
- Fichas sobre casillas oscuras (comprobado pintándolas de rojo).
- c3-d4, f6-e5: aviso, anillo en d4 y captura d4×f6; el contador baja a 11.
- **En línea con dos pestañas:** jugadas en ambos sentidos; la sesión rechaza una jugada ilegal y una no captura cuando hay captura obligatoria.

**2026-11-08 (horizontal/tablet):** medidas en el navegador, sin desplazamiento en ningún caso:

| Pantalla | Tablero |
| --- | --- |
| Celular vertical 375×812 | igual que antes |
| Celular horizontal 812×375 | 347 px (antes 271) |
| Tablet horizontal 1180×820 | 740 px |
| Tablet vertical 820×1180 | 748 px |

Lobby en tres columnas, retos y partida con panel lateral, inicio con los cuatro juegos en fila.

**2026-11-08 (retos):** 30/30 pruebas, incluida una que reproduce los 600 retos completos sin jugadas inválidas y comprueba el orden de dificultad. En el navegador a 375 px:
- Mate en 1: el rival juega solo; una jugada incorrecta se ve en rojo, sacude el tablero y se deshace; la pista marca la pieza; al resolver se guarda "con ayuda".
- Mate en 2 con negras: tablero girado, respuesta automática del rival y coronación con selector; se guarda "a la primera" y la racha sube a 1.
- "Ver solución" la reproduce, se guarda como vista y reinicia la racha.

**2026-11-08 (contra la computadora):** 22/22 pruebas (parser UCI, niveles, clasificación del repaso, notación). En el navegador a 375 px: Stockfish carga en el worker y responde, aparecen los puntos de "pensando", la pista dibuja su flecha, el mate detecta victoria y suma estadística, y el repaso de una partida con errores marca "Imprecisión" (Dh5, mejor Cf3) y "Error grave" (Dxf7+, mejor Ac4) con ambas flechas. El build precachea `engine/stockfish.{js,wasm}`.

**2026-11-08 (T-002):** piezas a 36/64 px sobre ambas casillas en claro, oscuro y gris; app a 375 px en claro y oscuro; build con fuentes en `/juegoteca/fonts/`; caché offline de 54 entradas con piezas, fuentes e iconos; 11/11 pruebas.

**2026-11-07:**

- `npm test`: 11/11 (reglas, seguimiento de piezas en enroque, al paso y coronación; códigos de sala).
- `npm run build` correcto. Primera carga: ~29 KB gzip de app + 4 KB CSS; PeerJS (~23 KB) solo se descarga al abrir una sala.
- En el navegador a 375×812: mate del pastor pasa y juega (toque y arrastre), pantalla de resultado y confeti.
- En línea con dos pestañas a través del servidor público real de PeerJS: crear sala, entrar por enlace `#/unirse/CÓDIGO`, jugadas en ambos sentidos, tablero girado para negras, rendición, revancha con cambio de colores y **reconexión tras cortar la conexión** (vuelve sola en <7 s y sigue sincronizada).

## No verificado / riesgos conocidos

- **Aún no se prueba en dos teléfonos reales.** En la misma Wi-Fi debería conectar; con datos móviles algunas operadoras bloquean conexiones directas (NAT simétrico) y haría falta un servidor TURN. Si pasa, se añade uno.
- Si se recarga la página o el sistema cierra la app durante una partida en línea, la sala se pierde (falta reanudar desde `sessionStorage`).
- Avisos de `npm audit` (6, moderados/bajos): están en dependencias de compilación de Workbox (glob/minimatch); no llegan a la app publicada.

## Siguiente acción

0. **Codex: T-006** (revisión de diseño). Daniel le pasa el prompt; al entregar, Claude revisa y Daniel elige qué cambios del Top 10 se implementan.
1. **Daniel:** ver las piezas 3D en su teléfono (v0.2.1). Probar en línea entre dos teléfonos (misma Wi-Fi y con datos móviles).
2. **Codex (opcional):** normalizar línea de base y centrado de las piezas (T4-04).
3. **Claude:** lecciones de ajedrez (textos de Claude, ilustraciones de Codex). Reanudar la sala en línea tras recargar. Pendiente de backgammon: tirada inicial y, si Daniel lo pide, cubo de doblar.
4. **Daniel:** probar el sudoku en el celular (v0.7.0): reloj, pausa y reto del día.
