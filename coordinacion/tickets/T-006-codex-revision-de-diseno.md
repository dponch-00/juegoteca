# T-006 — Revisión de diseño de la app completa y mejoras

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code (a pedido de Daniel) |
| Estado | abierto |
| Creado | 2026-11-08 |
| Depende de | T-002, T-004, T-005 (cerrados) |

## Contexto

La app ya tiene sus cuatro juegos (v0.7.0): **ajedrez** (pasa y juega, en línea, contra Stockfish, retos), **damas**, **backgammon** y **sudoku**. Claude construyó todas las pantallas con tus tokens, fuentes y piezas, pero **nadie ha revisado la interfaz completa contra la identidad Taller de fieltro** desde T-002, cuando solo existían maquetas. Desde entonces aparecieron pantallas que no diseñaste: lobbies, elegir nivel y color, retos, tablero de backgammon (SVG), sudoku, hojas de resultado y vista horizontal/tablet.

Daniel pide que **revises el diseño y hagas o propongas mejoras**. Él decide el gusto: tus propuestas deben ser concretas y fáciles de comparar.

### Cómo ver la app real

Ya no hace falta imaginarla. Con las dependencias instaladas (`npm install`):

```
npm run app:screens            # todas las escenas
npm run app:screens -- sudoku  # solo las que contienen "sudoku"
```

El script levanta la app, abre Chrome o Edge sin ventana y guarda **42 capturas** en `design/review/app/` (fuera de git), con índice en `design/review/app/INDICE.md`:

- Cada escena en celular 375×812, en modo claro y oscuro.
- Las cuatro partidas, además, en celular horizontal 812×375 y tablet 1180×820.
- Escenas: inicio (con nombre y primera vez), lobby, partida de cada juego, selección en ajedrez, hoja de resultado, elegir nivel, retos, sudoku con notas y pista, unirse y acerca.
- Usa movimiento reducido para que nada salga a medio animar. Las animaciones se describen en `docs/identity.md § Movimiento`; si quieres verlas, `npm run dev`.

**No cubre** la sala en línea (necesita red) ni el repaso de ajedrez; si te hacen falta, dilo en la Entrega.

## Pedido

### A. Auditoría (obligatoria)

Revisa las 42 capturas contra `docs/identity.md` y escribe `design/revision/T-006-auditoria.md` con hallazgos en este formato:

```
- [T6-NN] Severidad: alta | media | baja
  Pantalla: <escena> (<archivo de captura>)
  Evidencia: qué se ve y, si aplica, medida (px, contraste, peso)
  Propuesta: cambio concreto (valor de token, tamaño, espaciado, activo nuevo) — no "mejorar X"
  Implementa: Codex (activo/token) | Claude (CSS/componente)
```

Revisa al menos:

1. **Coherencia con la identidad:** ¿se siente la "caja de juegos bien hecha" en todas las pantallas o solo en los tableros? Menús, lobbies y hojas de resultado incluidos.
2. **Consistencia entre juegos:** encabezados, barras de jugador, botones, hojas de resultado y lobbies deberían parecer del mismo sistema.
3. **Jerarquía y ritmo:** tamaños de título, espaciado vertical y uso del espacio. Por ejemplo, en celulares altos queda mucho vacío bajo los botones de la partida.
4. **Iconografía:** la interfaz mezcla emoji y símbolos de texto (ver C1). ¿Qué se reemplaza y con qué?
5. **Contraste y estados**, en claro y oscuro:
   - WCAG AA: texto 4.5:1 y elementos de interfaz 3:1.
   - Estados seleccionado, pista, error, deshabilitado, último movimiento y turno activo.
6. **Tamaños táctiles:** ≥ 44 px en todo lo que se toca.
7. **Horizontal y tablet:** ¿se aprovecha la columna lateral? ¿Algo se ve pequeño o perdido?
8. **Pendientes viejos:**
   - T2-03: el logo puede leerse como "+".
   - T4-04: base y centrado de las piezas de ajedrez.
   - T5-01: arco anaranjado bajo la ficha simple de damas.

Cierra el documento con un **"Top 10 para v0.8"** ordenado por impacto/esfuerzo.

### B. Propuestas visuales (obligatoria)

Para los **3 a 5 cambios de mayor impacto**, entrega maquetas que Daniel pueda comparar con la captura actual (antes/después).

- Van en `design/revision/T-006/`, como PNG o WebP, de ≤ 400 KB cada una.
- Cubre como mínimo el **inicio**, **una partida** (la que más lo necesite) y el **sudoku**.
- Puedes partir de las capturas y editarlas, o renderizar de nuevo; lo que importa es que se vea el resultado real propuesto.

### C. Hazlo tú (activos y tokens, en tu zona)

1. **Juego de iconos de interfaz** en `public/assets/ui/<nombre>.svg`.
   - **Formato:** SVG de 24×24, trazo coherente (sugerido 2 px, extremos redondeados) y `currentColor` para que Claude los tiña con los tokens. Que se lean a 20 px y pesen ≤ 1.5 KB cada uno.
   - **Estilo:** de la familia Taller de fieltro (cálido, torneado, nada de iconos genéricos de sistema).
   - **Inventario actual a reemplazar:**

     | Nombre sugerido | Hoy | Dónde |
     | --- | --- | --- |
     | `back` | ← | todas las pantallas |
     | `undo` | ↶ | deshacer (todas las partidas) |
     | `restart` | ⟲ | reiniciar (pasa y juega) |
     | `hint` | 💡 | pista (ajedrez, retos, damas, backgammon, sudoku) |
     | `dice` | 🎲 | tirar dados (backgammon) |
     | `erase` | ⌫ | borrar (sudoku) |
     | `notes` | ✎ | notas a lápiz (sudoku) |
     | `auto-notes` | ▦ | anotar todo (sudoku) |
     | `pause` / `play` | ❚❚ / ▶ | reloj (sudoku), repaso (ajedrez) |
     | `prev` / `next` | ◀ / ▶ | repaso de partida (ajedrez) |
     | `streak` | 🔥 | racha (retos, reto del día) |
     | `join` | ⌘ | unirse a una sala (inicio) |
     | `check` | ✓ | nivel ganado, número completo |
     | `warning` | ⚠ | avisos de conexión (sala) |
     | `flag` | (texto) | rendirse |
     | `share` / `copy` | (texto) | compartir o copiar el código de sala |

   - Agrega una hoja de muestra `design/revision/T-006/iconos.png` con todos los iconos a 20 y 24 px, en claro y oscuro.
   - Documenta el sistema en `docs/identity.md` (sección Iconos).
2. **Tokens:** si la auditoría cambia colores, sombras, radios o tipografía, actualiza `design/tokens.json` y anota los contrastes en `docs/identity.md`. Claude sincroniza `src/styles/tokens.css`. Si propones tokens nuevos (por ejemplo, para el sudoku o las hojas de resultado), lístalos con nombre, valor claro/oscuro y uso.
3. **T4-04:** normaliza la línea de base y el centrado de las 12 piezas de ajedrez sin cambiar el arte (`design/process-piece-renders.py`). Verifica con `npm run pieces:sheet`.
4. **T5-01:** quita el arco anaranjado bajo `wman`/`bman`. Verifica con `npm run pieces:sheet -- checkers`.
5. **Logo (T2-03), solo propuesta:** 2 o 3 alternativas de marca en `design/revision/T-006/logo-*.png`, mostradas a 48 px, a 180 px y como icono de app. **No reemplaces** `public/assets/brand/` ni `public/icons/`: decide Daniel.
6. **Opcional:** si la auditoría concluye que una ilustración por juego mejoraría los lobbies o el inicio, propónla con una maqueta. Que sea WebP ≤ 150 KB y sin texto dentro de la imagen; solo produce la versión final si te sobra tiempo.

## Entregables

- `design/revision/T-006-auditoria.md` (hallazgos + Top 10)
- `design/revision/T-006/` (maquetas antes/después, hoja de iconos, alternativas de logo)
- `public/assets/ui/*.svg` (iconos)
- `public/assets/chess/pieces/*.webp` y `design/masters/pieces/*.png` normalizados (T4-04)
- `public/assets/checkers/{wman,bman}.webp` y sus masters (T5-01)
- `design/tokens.json`, `docs/identity.md`, `design/asset-manifest.json` actualizados si corresponde

## Criterios de aceptación

- [ ] Cada hallazgo cita su captura y trae una propuesta concreta, con quién la implementa.
- [ ] El Top 10 está ordenado y cada punto se puede ejecutar sin preguntar.
- [ ] Las maquetas muestran antes y después de la misma pantalla.
- [ ] Los iconos usan `currentColor`, se leen a 20 px y pesan ≤ 1.5 KB; todos de la misma familia.
- [ ] Los contrastes propuestos cumplen WCAG AA en claro y oscuro (anotados).
- [ ] T4-04 y T5-01 verificados con la hoja de contacto.
- [ ] Nada se copia de otros productos ni marcas (chess.com, Lichess, apps de sudoku).

## Archivos permitidos

- `design/**` (incluye `design/revision/`)
- `docs/identity.md`
- `public/assets/ui/**` (nuevo), `public/assets/chess/pieces/**`, `public/assets/checkers/**`
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `scripts/`, `package.json`, `AGENTS.md` ni `ESTADO.md`. Si necesitas otra escena en `npm run app:screens`, pídela en la Entrega y Claude la agrega.

## Fuera de alcance

- Implementar los cambios de CSS o de componentes: los hace Claude en un ticket siguiente, a partir de tu Top 10 y de lo que elija Daniel.
- Reemplazar el logo o los iconos de la PWA (solo propuestas).
- Nuevos juegos o pantallas.

---

## Entrega

- **Qué hice:**
- **Archivos:**
- **Cómo lo verifiqué (pesos, legibilidad, tamaños, contrastes):**
- **Herramientas/modelos usados:**
- **Limitaciones o bloqueos:**
- **Preguntas abiertas (para Daniel o Claude):**

## Revisión

(la llena Claude)
