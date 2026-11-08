# T-004 — Piezas de ajedrez con aspecto 3D realista

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code (a pedido de Daniel) |
| Estado | entregado |
| Creado | 2026-11-08 |
| Depende de | T-002 (identidad Taller de fieltro). **Reemplaza a T-003**, que queda cancelado. |

## Contexto

Daniel probó las piezas de T-002 y le resultan **confusas**: cuesta distinguir la torre del alfil, la dama del rey, etc. Quiere piezas que **se vean realistas, con volumen 3D**, y que **se identifiquen de inmediato**. Lee la Revisión de T-002 (T2-01) y el pedido de T-003, que este ticket amplía.

Diagnóstico de Claude: el problema no se arregla con ajustes. Las seis piezas comparten el mismo cuerpo cónico y la misma base, y solo cambia un detalle pequeño arriba. Hay que **rediseñar desde la silueta**.

La app ya acepta **dos formatos**, y tú eliges el que dé el mejor resultado (detalles en el Pedido, punto 4):

- **SVG** con sombreado volumétrico, en `public/assets/chess/pieces/{w,b}{k,q,r,b,n,p}.svg`.
- **Render raster** en WebP, en `public/assets/chess/pieces/{w,b}{k,q,r,b,n,p}.webp`.

La app detecta sola cuál existe (prefiere `.webp` si lo hay).

## Pedido

### 1. Silueta: estilo Staunton

Usa el **patrón Staunton** (diseño de 1849, de dominio público), que es el que cualquier persona reconoce como "piezas de ajedrez". Dibújalo tú, sin calcar ni derivar de juegos existentes de apps o webs (chess.com, Lichess/cburnett, etc.) ni de modelos 3D con licencia.

| Pieza | Rasgo que la identifica sin dudar | Tope aproximado (y, con base en y≈92) |
| --- | --- | --- |
| Rey | La más alta; corona con **cruz** clara | 8 |
| Dama | Segunda más alta; **corona de bolitas** en círculo | 12 |
| Alfil | **Mitra** ovalada con **corte diagonal** y bolita arriba | 18 |
| Caballo | **Cabeza de caballo** tallada (hocico, ojo, oreja, crin), mirando a un lado | 20 |
| Torre | **Torreta** cilíndrica con almenas; ancha y baja | 26 |
| Peón | El más bajo; **bola** sobre un collarín | 36 |

- Los cuerpos son torneados, con cuello, anillos y collarines distintos por pieza, no un mismo cono para todas.
- La base es de dos niveles, baja (≤ 18 % del alto) y de ≤ 56 de ancho. La del peón, más estrecha.
- Si una pieza solo se reconoce por un detalle pequeño, la silueta no funciona.

### 2. Volumen y material (dentro de Taller de fieltro)

- **Luz única para las 12 piezas**, desde arriba a la izquierda: sombreado cilíndrico, brillo especular suave, oclusión en las uniones y una sombra de contacto tenue bajo la base.
- **Blancas:** arce o marfil barnizado, crema cálido. **Negras:** nogal o ébano, marrón casi negro. Que se separen por **luminosidad** y se lean también en escala de grises.
- **Contorno o luz de borde** que despegue cada pieza de las dos casillas: las negras necesitan un filo de luz sobre casilla oscura y las blancas un borde oscuro sobre casilla clara.
- **Opcional, recomendado:** un fieltro verde (`#2E6B52`) bajo la base, como en un juego real. Ata las piezas a la identidad.
- La veta de madera se insinúa; nunca compite con la silueta.

### 3. Encuadre (igual para todas)

- Vista frontal con una ligera elevación (≈10°), la misma cámara para las 12 piezas.
- Pieza centrada en horizontal y apoyada en el 92 % del alto del lienzo.
- La app dibuja cada pieza al 92 % de la casilla; en el celular la casilla mide 36–48 px.

### 4. Formato: elige uno

**Ruta A · SVG con volumen (recomendada para empezar)**

- Degradados lineales y radiales para el volumen. Evita filtros pesados (`feGaussianBlur` grandes, `feTurbulence`): las piezas se animan y en celulares viejos los filtros cuestan.
- `viewBox="0 0 100 100"`, fondo transparente, ids únicos por archivo (prefijo `wk-` etc.), sin `<text>` ni imágenes incrustadas.
- **≤ 15 KB por archivo.**

**Ruta B · Render raster (si logras más realismo)**

- Puedes renderizar como quieras: un renderizador propio de sólidos de revolución, Blender si está disponible, o la herramienta de imagen **solo si** las 12 piezas salen coherentes en cámara, luz, escala y línea de apoyo.
- **Masters** PNG de 512×512 con transparencia real (verifica el canal alfa) en `design/masters/pieces/{w,b}{k,q,r,b,n,p}.png`. La hoja de contacto los usa.
- **Servidos** en WebP de 256×256 con transparencia en `public/assets/chess/pieces/{w,b}{k,q,r,b,n,p}.webp`, **≤ 30 KB cada uno**.
- Borra los `.svg` de esa carpeta para que no quede un juego mezclado.

### 5. Verifica con la hoja de contacto

```
npm install
npm run pieces:sheet
```

Genera `design/review/pieces-sheet.png`: las 12 piezas a 36 y 64 px sobre ambas casillas, en modo claro, oscuro y grises, al 92 % de la casilla como en la app. Revísala después de cada cambio.

Te recomiendo empezar por **rey y caballo** en ambos colores, verlos en la hoja y luego hacer el resto.

### 6. Tokens (pendiente de T-003)

En `design/tokens.json`, modo `light`: `p0: #FFF8E7` y `p1: #294536` (p0 = bando claro).

### 7. Registro

Una entrada por archivo en `design/asset-manifest.json` (herramienta, prompt si aplica, fecha, dimensiones y bytes). Guarda el script o la fuente que genera las piezas en `design/` para que sean reproducibles.

## Entregables

- 12 piezas en `public/assets/chess/pieces/` (todas `.svg` o todas `.webp`)
- Ruta B: 12 masters en `design/masters/pieces/*.png`
- Script o fuente generadora en `design/`
- `design/tokens.json` (`p0`/`p1` de `light`)
- `design/asset-manifest.json` actualizado

## Criterios de aceptación

- [ ] En `pieces-sheet.png`, a **36 px**, cada pieza se reconoce **por su silueta** (sin depender de un detalle chico) y en escala de grises.
- [ ] Las alturas siguen el orden rey > dama > alfil ≈ caballo > torre > peón.
- [ ] Se percibe volumen: la misma luz y sombreado en las 12 piezas.
- [ ] Blancas y negras se separan sobre las dos casillas, en modo claro y oscuro.
- [ ] Mismo encuadre y línea de apoyo en las 12 piezas.
- [ ] Pesos: SVG ≤ 15 KB o WebP ≤ 30 KB cada pieza; un solo formato en la carpeta.
- [ ] Diseño original estilo Staunton; ninguna pieza calcada de juegos o modelos existentes.
- [ ] La Entrega describe lo que viste en `pieces-sheet.png` (está fuera de git: no la adjuntes).

## Archivos permitidos

- `public/assets/chess/pieces/**` (reemplazar o borrar)
- `design/**`
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `scripts/`, `package.json` ni `ESTADO.md`.

## Fuera de alcance

- Logo, iconos y fichas de otros juegos.
- Cambiar el tablero (si crees que el tablero también debería cambiar para combinar con piezas 3D, propónlo en la Entrega).

---

## Entrega

- **Ruta elegida (A SVG / B raster) y por qué:** **Ruta A, SVG volumétrico.** Permite transparencia real, mantiene el coste de animación y descarga bajo, y conserva la nitidez de los contornos a 36 px. Los degradados y trazos vectoriales dan volumen suficiente sin filtros pesados ni una familia de renders inconsistente.
- **Qué hice:** Rediseñé las 12 piezas desde la silueta con una familia Staunton original, no a partir del cuerpo cónico previo. El rey empieza en y=8 con cruz grande; la dama en y=12 con cinco bolitas de corona; alfil y caballo comienzan alrededor de y=15–20; torre desde y=27; y el peón desde y=30 con bola dominante. Cada una tiene cuerpo propio, base baja de dos niveles, collarín de fieltro, sombra de contacto, veta tenue y sombreado cilíndrico con la misma luz desde arriba a la izquierda. El caballo ahora muestra oreja, hocico, cuello y crin en la silueta. Corregí además `light.p0` = `#FFF8E7` y `light.p1` = `#294536` (T2-02).
- **Archivos:** 12 SVG reemplazados en `public/assets/chess/pieces/`; `design/generate-staunton-pieces.mjs` como fuente reproducible; `design/tokens.json`; y `design/asset-manifest.json` con 12 entradas `staunton-piece-*` actualizadas. `design/review/pieces-sheet.png` se generó para la revisión y queda ignorado por Git, como exige el ticket.
- **Qué vi en `pieces-sheet.png` (36/64 px, claro, oscuro, grises):** Ejecuté primero la hoja con el set anterior y comprobé las alturas casi iguales y cabezas diminutas. Tras el rediseño, revisé la hoja final generada: a 36 px se mantiene la jerarquía rey > dama > alfil/caballo > torre > peón; cruz, corona de bolitas, mitra cortada, cabeza de caballo, almenas y bola se leen por contorno. A 64 px se distinguen collarines, veta y luz. En modo claro, oscuro y escala de grises los bandos siguen separados por luminosidad y por filete inverso; no dependen del verde o marrón para reconocerse.
- **Pesos:** 12/12 piezas SVG: **1,464–1,746 bytes** (límite 15 KB). Validé 24 ids internos únicos, `viewBox="0 0 100 100"`, y ausencia de `<text>` e imágenes incrustadas. La hoja final mide 1,400 × 524 px y 184,101 bytes; no se adjunta ni se versiona.
- **Herramientas/modelos usados:** Node.js 24 y SVG procedimental escrito por Codex (`design/generate-staunton-pieces.mjs`); `npm install` y `npm run pieces:sheet` (script existente de Claude) para la hoja de contacto. No se usó modelo de imagen ni activos externos.
- **Limitaciones o bloqueos:** No hay masters raster porque corresponde a la ruta A. La vista es frontal/elevada sugerida por el sombreado y sombra de contacto, no un modelo 3D físico; se eligió así para proteger la lectura y el rendimiento móvil. Claude deberá dar la revisión cruzada en la interacción real, aunque la hoja replica sus tamaños, tableros y escala de grises.
- **Preguntas abiertas:** Ninguna. No propongo cambiar el tablero: el fieltro bajo las bases conecta las piezas nuevas con el marco actual sin perder contraste.

## Revisión

(la llena Claude Code)
