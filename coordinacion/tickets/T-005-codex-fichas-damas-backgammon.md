# T-005 — Fichas de damas y backgammon, y dados

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code (a pedido de Daniel) |
| Estado | cerrado |
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

- **Qué hice:** Produje fichas 3D de la misma familia que el ajedrez: arce marfil barnizado y nogal oscuro, luz suave desde arriba a la izquierda, veta discreta, brillo de borde y sombra de contacto. Para damas hice fichas normales y damas visibles por dos discos completos apilados y una banda coral; para backgammon, discos cenitales con surcos concéntricos; y seis dados de arce con puntos de nogal. Normalicé todas las salidas a 512 px con centro, baseline y margen comunes para no repetir T4-04.
- **Archivos:** Masters: `design/masters/checkers/{wman,bman,wking,bking}.png` y `design/masters/backgammon/{w-checker,b-checker,dice-1..6}.png`. Servidos WebP: `public/assets/checkers/*.webp` y `public/assets/backgammon/*.webp`. También `design/process-tabletop-renders.py`, `design/tokens.json`, `docs/identity.md` y `design/asset-manifest.json`.
- **Qué vi en las hojas de contacto (damas y backgammon):** `npm run pieces:sheet -- checkers` generó una hoja desde los masters PNG: a 36 px se separan arce/nogal por luminosidad y la dama se identifica por el segundo disco y la franja coral; a 64 px se distinguen los surcos. `npm run pieces:sheet -- backgammon` confirmó fichas cenitales legibles medio superpuestas y los seis dados distinguibles por los puntos ya a 32–36 px. En claro, oscuro y grises los discos mantienen borde y brillo; los dados preservan sus seis patrones de puntos.
- **Pesos:** 12 masters PNG RGBA de 512 × 512; 12 WebP RGBA de 256 × 256, máximo **21,196 bytes** (límite 30 KB). Validé 4 masters/4 WebP de damas y 8/8 de backgammon; todos tienen alfa en la esquina, dimensiones correctas y margen mínimo de **42 px** al medir alfa ≥8 %, superior al mínimo de 4 %. El manifiesto registra 24 entradas nuevas (master + servido) sin desajustes de tamaño.
- **Herramientas/modelos usados:** `image_gen` para tres hojas de renders originales con transparencia (damas, fichas de backgammon y dados); Pillow 3.14 en `design/process-tabletop-renders.py` para corte, normalización, limpieza de alfa y WebP; scripts existentes `npm run pieces:sheet -- checkers` y `-- backgammon` para revisión. Prompts resumidos constan en el manifiesto.
- **Limitaciones o bloqueos:** No hay bloqueo. Las hojas verifican los tamaños y fondos de prueba; Claude debe hacer la revisión cruzada en la interacción real cuando conecte cada juego. No modifiqué las piezas de ajedrez: T4-04 ya queda prevenido en los nuevos activos mediante normalización explícita.
- **Preguntas abiertas:** Ninguna para integrar. El tablero de backgammon puede usar directamente el objeto `backgammon` de `design/tokens.json`; sus contrastes de cara, punto y borde están documentados en `docs/identity.md`.

## Revisión

**Claude Code · 2026-11-08 · Veredicto: aceptado. Damas integradas y publicadas (v0.4.1); fichas, dados y colores de backgammon listos para cuando se programe ese juego.**

- **Verificado:**
  - Hojas de contacto de damas y backgammon a 36 y 64 px en claro, oscuro y grises.
  - Misma madera, luz y acabado que el ajedrez. La dama se distingue de inmediato (dos discos apilados).
  - Los seis dados se leen a 36 px. Las fichas cenitales de backgammon son claras.
  - Encuadre homogéneo: centros en 255–256 (los dados en 263–265 en vertical, coherente entre caras) y margen ≥ 43 px; **T4-04 no se repitió**.
  - WebP de 11–21 KB.
  - En el tablero real de damas a 375 px: la app carga los `.webp` sola (0 fichas CSS) y se leen bien sobre la casilla oscura.

- [T5-01] Severidad: baja
  Ubicación: `design/masters/checkers/{wman,bman}.png` (y sus WebP)
  Evidencia: debajo de la ficha simple aparece un arco anaranjado separado del disco, como una sombra o reflejo recortado; a 36 px se ve como una rayita bajo la ficha (fila "claro", columnas 1 y 3 de la hoja).
  Consecuencia: detalle visual menor; no afecta la lectura.
  Corrección (opcional): fundir esa sombra con la base del disco o quitarla, igual que en las damas, donde no aparece.

- **Nota (sin hallazgo):** la ficha clara de damas es más tostada que el marfil de las piezas de ajedrez; se distingue bien de la oscura, así que se acepta.
