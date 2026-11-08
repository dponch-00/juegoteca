# Juegoteca — instrucciones para agentes

Fuente única de reglas compartidas. Codex la lee como instrucciones del repositorio; Claude Code la carga con el import `@AGENTS.md` de `CLAUDE.md`.

**Juegoteca** es una PWA de juegos de mesa (ajedrez, damas, backgammon, sudoku y los que se vayan sumando) para el celular y la tablet de Daniel. Funciona offline, guarda los datos en el dispositivo y permite jugar contra otra persona en el mismo aparato ("pasa y juega") o en línea con un **código de sala** (conexión directa WebRTC entre los dos dispositivos). Se publica gratis en GitHub Pages.

## Antes de trabajar

1. Lee [`ESTADO.md`](ESTADO.md): fase actual, tickets abiertos y siguiente acción.
2. Lee [`coordinacion/PROTOCOLO.md`](coordinacion/PROTOCOLO.md): cómo colaboran Daniel, Claude Code y Codex.
3. Si te asignaron un ticket (`coordinacion/tickets/T-NNN-*.md`), trabaja solo en los archivos que ese ticket permite.

## Reglas duras

- **Todo combina.** Logo, colores, tipografía, tablero, piezas, iconos y animaciones salen de una misma identidad. Nada de recursos sueltos de estilos distintos.
- **Original.** Sin copiar piezas, logos ni estilos reconocibles de otros productos (chess.com, Lichess, etc.). Sin marcas de terceros.
- **No simular.** Si no puedes generar una imagen o verificar algo, dilo en la Entrega. Nunca entregues un placeholder como si fuera final.
- **Rendimiento en el celular.** Cada activo se mide: piezas SVG ≤ 6 KB cada una, imágenes raster servidas al móvil ≤ 150 KB. Formatos web: SVG para piezas e iconografía, WebP/AVIF para ilustraciones, PNG solo donde lo exige la plataforma (iconos de la PWA).
- **Sin texto dentro de imágenes raster.** Los textos van en HTML.
- **Ningún secreto** (API keys, tokens) en el repo.
- **Idioma:** interfaz y documentos en español. Código, IDs y nombres de archivo en inglés, minúsculas y con guiones.
- **Solo Claude escribe `ESTADO.md`.** Codex reporta en la sección Entrega de su ticket.
- **Commits pequeños** con prefijo de autor: `[claude]`, `[codex]` o `[daniel]`.
- **No publicar ni desplegar** sin autorización explícita de Daniel en el chat.

## Mapa del repositorio

| Ruta | Qué contiene | Dueño |
| --- | --- | --- |
| `ESTADO.md` | Tablero vivo: fase, tickets, siguiente acción | Claude Code |
| `coordinacion/` | Protocolo y tickets entre agentes | Quien abre el ticket |
| `design/` | Identidad, direcciones visuales, briefs, masters, `asset-manifest.json` | Codex |
| `docs/identity.md` | Guía de identidad y temática (cuando exista) | Codex propone, Claude implementa |
| `public/assets/` | Activos finales que usa la app (piezas, tableros, iconos, ilustraciones) | Codex |
| `src/` | Código de la app (Preact + TypeScript + Vite) | Claude Code |
| `src/styles/tokens.css` | Tokens de diseño en CSS | Claude Code, a partir de `design/tokens.json` |

## Contrato de activos (lo que el código espera)

Rutas fijas; si un archivo no existe, la app usa un sustituto provisional.

| Activo | Ruta | Formato |
| --- | --- | --- |
| Piezas de ajedrez | `public/assets/chess/pieces/{w,b}{k,q,r,b,n,p}.svg` (ej. `wk.svg` = rey blanco) | SVG, `viewBox="0 0 100 100"`, fondo transparente, pieza centrada apoyada en y≈92 |
| Fichas de damas | `public/assets/checkers/{w,b}{man,king}.svg` | SVG, `viewBox="0 0 100 100"` |
| Fichas de backgammon | `public/assets/backgammon/{w,b}-checker.svg` | SVG |
| Iconos de juegos (menú) | `public/assets/games/{chess,checkers,backgammon,sudoku}.svg` | SVG |
| Logo | `public/assets/brand/logo.svg`, `logo-mark.svg` | SVG |
| Iconos PWA | `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180), `favicon.svg` | PNG/SVG |
| Tokens | `design/tokens.json` | JSON (colores, tipografía, radios, sombras, movimiento) |
