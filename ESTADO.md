# Estado de Juegoteca

Última actualización: 2026-11-07 · Claude Code

## Fase actual

**Fase 1 — Base jugable.** App funcionando con ajedrez (pasa y juega + en línea con código de sala). Identidad visual provisional, en espera de Codex.

## Tickets

| Ticket | Para | Tema | Estado |
| --- | --- | --- | --- |
| [T-001](coordinacion/tickets/T-001-codex-identidad-y-tematica.md) | Codex | Identidad y temática: tres direcciones | revisado: conceptos válidos; maquetas = misma plantilla recoloreada y piezas sin temática (R-01…R-05). Daniel decide: elegir concepto o segunda ronda |

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
- Estadísticas por juego en `localStorage`.
- Deploy automático a GitHub Pages (`.github/workflows/deploy.yml`), base `/juegoteca/`.

## Cómo se verificó (2026-11-07)

- `npm test`: 11/11 (reglas, seguimiento de piezas en enroque, al paso y coronación; códigos de sala).
- `npm run build` correcto. Primera carga: ~29 KB gzip de app + 4 KB CSS; PeerJS (~23 KB) solo se descarga al abrir una sala.
- En el navegador a 375×812: mate del pastor pasa y juega (toque y arrastre), pantalla de resultado y confeti.
- En línea con dos pestañas a través del servidor público real de PeerJS: crear sala, entrar por enlace `#/unirse/CÓDIGO`, jugadas en ambos sentidos, tablero girado para negras, rendición, revancha con cambio de colores y **reconexión tras cortar la conexión** (vuelve sola en <7 s y sigue sincronizada).

## No verificado / riesgos conocidos

- **Aún no se prueba en dos teléfonos reales.** En la misma Wi-Fi debería conectar; con datos móviles algunas operadoras bloquean conexiones directas (NAT simétrico) y haría falta un servidor TURN. Si pasa, se añade uno.
- Si se recarga la página o el sistema cierra la app durante una partida en línea, la sala se pierde (falta reanudar desde `sessionStorage`).
- Piezas, colores, iconos y logo son **provisionales** (glifos Unicode y `scripts/placeholder-icons.mjs`) hasta T-001/T-002.
- Avisos de `npm audit` (6, moderados/bajos): están en dependencias de compilación de Workbox (glob/minimatch); no llegan a la app publicada.

## Siguiente acción

1. **Daniel:** elegir concepto (D1 fieltro, D2 medianoche, D3 papel) o pedir segunda ronda de las tres.
2. **Claude:** abrir T-002 según esa decisión, exigiendo piezas con la temática en la silueta y maquetas propias; después integrar tokens y fuentes.
3. **Daniel:** probar en dos teléfonos con la URL publicada (misma Wi-Fi y con datos móviles).
3. **Claude (en paralelo):** damas (mismo contrato GameDef), reanudar sala tras recarga, prueba en dos teléfonos.
