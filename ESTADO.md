# Estado de Juegoteca

Última actualización: 2026-11-08 · Claude Code

## Fase actual

**Fase 1 — Base jugable con identidad.** Ajedrez pasa y juega y en línea con código de sala, ya con la identidad **Taller de fieltro** (T-002) integrada y publicada.

## Tickets

| Ticket | Para | Tema | Estado |
| --- | --- | --- | --- |
| [T-001](coordinacion/tickets/T-001-codex-identidad-y-tematica.md) | Codex | Identidad y temática: tres direcciones | cerrado: Daniel eligió **D1 · Taller de fieltro** |
| [T-002](coordinacion/tickets/T-002-codex-produccion-taller-de-fieltro.md) | Codex | Producción de Taller de fieltro: identidad, tokens, fuentes, 12 piezas, logo, iconos | revisado e integrado; pulido opcional de piezas (T2-01) a decisión de Daniel |

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
- **Identidad Taller de fieltro:** tokens en `src/styles/tokens.css` (claro por omisión, oscuro según el sistema), Fraunces + Atkinson Hyperlegible Next locales, 12 piezas de madera torneada, logo, iconos de juegos y de la PWA, marco de fieltro en el tablero y movimiento según `docs/identity.md`.
- Estadísticas por juego en `localStorage`.
- Deploy automático a GitHub Pages (`.github/workflows/deploy.yml`), base `/juegoteca/`.

## Cómo se verificó

**2026-11-08 (T-002):** piezas a 36/64 px sobre ambas casillas en claro, oscuro y gris; app a 375 px en claro y oscuro; build con fuentes en `/juegoteca/fonts/`; caché offline de 54 entradas con piezas, fuentes e iconos; 11/11 pruebas.

**2026-11-07:**

- `npm test`: 11/11 (reglas, seguimiento de piezas en enroque, al paso y coronación; códigos de sala).
- `npm run build` correcto. Primera carga: ~29 KB gzip de app + 4 KB CSS; PeerJS (~23 KB) solo se descarga al abrir una sala.
- En el navegador a 375×812: mate del pastor pasa y juega (toque y arrastre), pantalla de resultado y confeti.
- En línea con dos pestañas a través del servidor público real de PeerJS: crear sala, entrar por enlace `#/unirse/CÓDIGO`, jugadas en ambos sentidos, tablero girado para negras, rendición, revancha con cambio de colores y **reconexión tras cortar la conexión** (vuelve sola en <7 s y sigue sincronizada).

## No verificado / riesgos conocidos

- **Aún no se prueba en dos teléfonos reales.** En la misma Wi-Fi debería conectar; con datos móviles algunas operadoras bloquean conexiones directas (NAT simétrico) y haría falta un servidor TURN. Si pasa, se añade uno.
- Si se recarga la página o el sistema cierra la app durante una partida en línea, la sala se pierde (falta reanudar desde `sessionStorage`).
- Las piezas tienen casi la misma altura (T2-01): se distinguen, pero una jerarquía de alturas las haría más rápidas de leer. Decide Daniel al verlas en su teléfono.
- Avisos de `npm audit` (6, moderados/bajos): están en dependencias de compilación de Workbox (glob/minimatch); no llegan a la app publicada.

## Siguiente acción

1. **Daniel:** abrir la app publicada en el teléfono, ver las piezas y decidir si pide el pulido T2-01; probar en línea entre dos teléfonos (misma Wi-Fi y con datos móviles).
2. **Claude:** damas (mismo contrato GameDef) y su ticket de fichas para Codex; reanudar la sala tras recargar.
