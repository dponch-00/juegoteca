# Estado de Juegoteca

Última actualización: 2026-11-08 · Claude Code

## Fase actual

**Fase 2 — Ajedrez para aprender.** Hecho: contra la computadora (Stockfish) con 8 niveles, pistas, deshacer y repaso de errores; **retos** (600 problemas de Lichess en 8 categorías). Sigue: lecciones.

## Tickets

| Ticket | Para | Tema | Estado |
| --- | --- | --- | --- |
| [T-001](coordinacion/tickets/T-001-codex-identidad-y-tematica.md) | Codex | Identidad y temática: tres direcciones | cerrado: Daniel eligió **D1 · Taller de fieltro** |
| [T-002](coordinacion/tickets/T-002-codex-produccion-taller-de-fieltro.md) | Codex | Producción de Taller de fieltro: identidad, tokens, fuentes, 12 piezas, logo, iconos | revisado e integrado |
| [T-003](coordinacion/tickets/T-003-codex-pulido-piezas.md) | Codex | Pulido de piezas | cancelado: reemplazado por T-004 |
| [T-004](coordinacion/tickets/T-004-codex-piezas-3d-staunton.md) | Codex | Piezas con aspecto 3D realista, estilo Staunton | cerrado: ronda 2 (render WebP) aceptada y publicada en v0.2.1; pendiente menor T4-04 (alinear base y centrado) |
| [T-005](coordinacion/tickets/T-005-codex-fichas-damas-backgammon.md) | Codex | Fichas de damas (con dama coronada), fichas de backgammon, dados y colores del tablero de backgammon | abierto |

## Publicación

- Repo: https://github.com/dponch-00/juegoteca (público, rama `main`).
- App: https://dponch-00.github.io/juegoteca/ — cada push a `main` la vuelve a publicar (Actions → Pages).
- Primera publicación 2026-11-08: workflow correcto; verificado en el sitio real que carga, registra el service worker y sirve manifiesto e iconos.

## Qué existe

- PWA con Preact + TypeScript + Vite 8, instalable y offline (`vite-plugin-pwa`, aviso de "versión nueva").
- **Inicio:** nombre del jugador, unirse con código, tarjetas de juegos (damas, backgammon y sudoku como "Próximamente").
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
- **Celular y tablet, vertical y horizontal** (v0.3.1):
  - El manifiesto ya no fija la orientación (`any`).
  - Las pantallas de partida (Match, retos, repaso) tienen `.board-wrap` y `.match-side`. En vertical el panel se disuelve (`display: contents`) y se ordena alrededor del tablero (`.pre` = arriba). En horizontal el tablero ocupa toda la altura a la izquierda; a la derecha van el título, el rival arriba y tú con los botones abajo.
  - Los menús (`.screen.wide`) se ensanchan a 1000 px en tablet, con rejillas automáticas; el lobby se reparte en tres columnas.
- **Licencia GPL-3.0-or-later** (por Stockfish). Créditos y enlace al código en `#/acerca`.
- Estadísticas por juego en `localStorage`.
- `npm run pieces:sheet`: hoja de contacto PNG de las 12 piezas a 36/64 px en claro, oscuro y grises (`design/review/`, fuera de git), para revisar sin navegador.
- Deploy automático a GitHub Pages (`.github/workflows/deploy.yml`), base `/juegoteca/`.

## Cómo se verificó

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

1. **Daniel:** ver las piezas 3D en su teléfono (v0.2.1). Probar en línea entre dos teléfonos (misma Wi-Fi y con datos móviles).
2. **Codex (opcional):** normalizar línea de base y centrado de las piezas (T4-04).
3. **Claude:** **lecciones** interactivas de ajedrez (texto de Claude, ilustraciones de Codex), reutilizando el motor de retos.
4. Después: damas, reanudar la sala tras recargar.
