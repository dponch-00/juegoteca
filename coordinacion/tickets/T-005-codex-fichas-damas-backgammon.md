# T-005 — Fichas de damas y backgammon, y dados

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code (a pedido de Daniel) |
| Estado | abierto |
| Creado | 2026-11-08 |
| Depende de | T-004 (piezas de ajedrez 3D, cerrado) |

## Contexto

Juegoteca suma sus siguientes juegos. Claude ya está programando **damas** (reglas clásicas latinas) y después hará **backgammon**. Mientras no existan tus activos, la app dibuja fichas provisionales con CSS.

Daniel aprobó las piezas de ajedrez de T-004 ronda 2: render 3D en WebP, arce marfil contra nogal oscuro, misma luz desde arriba a la izquierda. **Las fichas nuevas deben verse de la misma familia**, como si salieran de la misma caja de juegos de Taller de fieltro.

Lee la revisión de T-004 (sobre todo **T4-04**, encuadre desigual) para no repetirlo aquí.

## Pedido

### 1. Damas — 4 fichas

| Archivo | Qué es |
| --- | --- |
| `wman` | Ficha clara (arce o marfil) |
| `bman` | Ficha oscura (nogal) |
| `wking` | Dama clara: ficha coronada |
| `bking` | Dama oscura: ficha coronada |

- Fichas torneadas de madera: disco con canto redondeado y uno o dos surcos concéntricos en la cara.
- Vista desde arriba con ligera inclinación (≈ 30–40°): en damas se ven más la cara que el perfil.
- La **dama** debe distinguirse de inmediato a 36 px: dos fichas apiladas, o una ficha con corona tallada o incrustada (por ejemplo, coral `#B9473B`). No basta con un detalle pequeño.
- Mismo tamaño y encuadre para las 4: centradas, ocupando ~84 % del ancho del lienzo, con una sombra de contacto suave que **no toque los bordes**.

### 2. Backgammon — 2 fichas y 6 caras de dado

| Archivo | Qué es |
| --- | --- |
| `w-checker`, `b-checker` | Fichas de backgammon claras y oscuras |
| `dice-1` … `dice-6` | Caras de dado de 1 a 6 |

- **Fichas:** vista **cenital** (desde arriba, sin perspectiva), porque se apilan en fila sobre las puntas del tablero. Disco con surcos concéntricos y la misma madera y luz. Deben leerse bien medio superpuestas.
- **Dados:** marfil con puntos de nogal (o al revés si se lee mejor), con aristas redondeadas, vista frontal con un leve 3D. La app los anima girando, así que cada cara debe verse completa y centrada.

### 3. Colores del tablero de backgammon

Agrega a `design/tokens.json` un objeto `backgammon` con `light` y `dark`, con estas claves:

| Clave | Uso |
| --- | --- |
| `board` | Fondo del tablero (fieltro) |
| `frame` | Marco de madera |
| `bar` | Barra central |
| `point-a` | Punta A (alternan) |
| `point-b` | Punta B (alternan) |
| `point-highlight` | Punta con movimiento posible |

Calcula el contraste de las fichas clara y oscura sobre `board`, `point-a` y `point-b` y anótalo en `docs/identity.md`. Claude dibuja el tablero con CSS y SVG usando esos colores.

### 4. Formato (igual que T-004 ronda 2)

- **Masters** PNG de 512×512 con transparencia real:
  - `design/masters/checkers/{wman,wking,bman,bking}.png`
  - `design/masters/backgammon/{w-checker,b-checker,dice-1,…,dice-6}.png`
- **Servidos** en WebP de 256×256 con transparencia, ≤ 30 KB cada uno:
  - `public/assets/checkers/*.webp`
  - `public/assets/backgammon/*.webp`
- **Encuadre homogéneo** (T4-04): misma escala y centro en todas las de un mismo juego, con un margen libre de ≥ 4 % en los cuatro bordes y alfa limpio (< 8 % → 0).

### 5. Verifica con la hoja de contacto

```
npm run pieces:sheet -- checkers
npm run pieces:sheet -- backgammon
```

Generan `design/review/checkers-sheet.png` y `design/review/backgammon-sheet.png` (a 36 y 64 px, modo claro, oscuro y grises). Revisa después de cada cambio y describe en la Entrega lo que ves.

### 6. Opcional, si te sobra tiempo: piezas de ajedrez (T4-04)

Normaliza la línea de base y el centrado de las 12 piezas de ajedrez con tu `design/process-piece-renders.py`, sin cambiar el arte. Verifica con `npm run pieces:sheet`.

## Entregables

- `public/assets/checkers/*.webp` (4) y `design/masters/checkers/*.png` (4)
- `public/assets/backgammon/*.webp` (8) y `design/masters/backgammon/*.png` (8)
- `design/tokens.json` → objeto `backgammon` (light/dark) y sus contrastes en `docs/identity.md`
- `design/asset-manifest.json` actualizado; scripts o prompts reproducibles en `design/`
- (Opcional) piezas de ajedrez normalizadas

## Criterios de aceptación

- [ ] Las fichas parecen de la misma caja que las piezas de ajedrez (madera, luz, acabado).
- [ ] A 36 px, la dama de damas se distingue de la ficha normal en ambos colores y en escala de grises.
- [ ] Las fichas clara y oscura se separan por luminosidad sobre casillas y puntas.
- [ ] Las caras del dado se leen a 32 px.
- [ ] Encuadre homogéneo, margen ≥ 4 % y alfa limpio.
- [ ] WebP ≤ 30 KB cada uno, 256×256 con transparencia.
- [ ] Diseño original; sin copiar juegos ni marcas existentes.

## Archivos permitidos

- `public/assets/checkers/**`, `public/assets/backgammon/**`
- `public/assets/chess/pieces/**` (solo el opcional 6)
- `design/**`, `docs/identity.md`
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `scripts/`, `package.json` ni `ESTADO.md`.

## Fuera de alcance

- Dibujar los tableros completos (los hace Claude con CSS/SVG).
- Sudoku (usa la tipografía y los colores de la identidad; no necesita arte).

---

## Entrega

- **Qué hice:**
- **Archivos:**
- **Qué vi en las hojas de contacto (damas y backgammon):**
- **Pesos:**
- **Herramientas/modelos usados:**
- **Limitaciones o bloqueos:**
- **Preguntas abiertas:**

## Revisión

(la llena Claude Code)
