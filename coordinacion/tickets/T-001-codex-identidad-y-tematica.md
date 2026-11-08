# T-001 — Identidad y temática de Juegoteca: tres direcciones

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code |
| Estado | revisado |
| Creado | 2026-11-07 |
| Depende de | — |

## Contexto

Juegoteca es una PWA de juegos de mesa para celular y tablet: ajedrez, damas, backgammon y sudoku al inicio, y más juegos después. Se juega en el mismo dispositivo ("pasa y juega") o en línea con un código de sala de 4 letras. Lee `AGENTS.md` (sobre todo el **contrato de activos**) y `coordinacion/PROTOCOLO.md`.

Daniel quiere una app **dinámica, rápida y animada**, en la que **todo combine**: cada pieza de ajedrez diseñada según la temática de la Juegoteca, y tableros, fichas, iconos, logo y animaciones de la misma familia.

Claude ya tiene una versión base funcionando, con colores y piezas provisionales (glifos Unicode). En cuanto existan los activos en las rutas del contrato, la app los usa sin cambiar código.

Este ticket es la **fase de exploración**: proponer direcciones para que Daniel elija una. La producción completa de activos va en un ticket posterior (T-002), sobre la dirección elegida.

## Pedido

1. **Tres direcciones de identidad** claramente distintas entre sí, en `design/direcciones/D1-<nombre>/`, `D2-…` y `D3-…`. Cada una con un `README.md` que incluya:
   - **Concepto y temática:** qué es "la Juegoteca" en esta dirección (por ejemplo: una ludoteca de madera y fieltro, un club nocturno de juegos con neón, un estudio de juguetes de papel recortado…; son ejemplos, no limitantes) y por qué funciona para juegos de mesa uno contra uno.
   - **Paleta** con valores hex: fondo, superficie, texto, acento principal y secundario, casillas claras y oscuras del tablero, color de cada jugador, estados de jugada (última jugada, selección, movimiento posible, jaque o peligro). Incluye **contraste calculado** del texto (≥ 4.5:1) y de los controles (≥ 3:1).
   - **Tipografía:** una para títulos y una para la interfaz, ambas con licencia libre (OFL o similar) y alojables localmente. Indica su fuente oficial.
   - **Lenguaje de las piezas:** cómo se ven, qué las hace propias de esta temática y cómo se distingue cada pieza a 36 px en el celular (el rey del alfil, el blanco del negro, sobre casillas claras y oscuras).
   - **Movimiento:** 4 o 5 principios de animación con duraciones y curvas concretas (por ejemplo, mover pieza 180 ms `cubic-bezier(...)`, captura, jaque, victoria, entrada al menú). Claude los implementa en CSS / Web Animations; deben sentirse rápidos y no estorbar el juego.
   - **Modo oscuro:** si la dirección lo admite y cómo.

2. **Muestras visuales por dirección** (en la misma carpeta):
   - `pieces-sample.svg`: rey, dama, caballo y peón, en blanco y negro (8 piezas), siguiendo el contrato (`viewBox="0 0 100 100"`, apoyadas en y≈92, fondo transparente).
   - `logo-mark.svg`: logotipo o marca de "Juegoteca".
   - `mockup-menu.png` y `mockup-chess.png`: maqueta a 360 × 780 px del menú de juegos y de una partida de ajedrez en curso (con barra de jugadores, última jugada marcada y el código de sala visible). Puedes generarlas con tu herramienta de imagen o componerlas en SVG/HTML y exportarlas; registra cuál usaste.

3. **Comparativa** en `design/direcciones/COMPARATIVA.md`: tabla de las tres direcciones (legibilidad de las piezas, coherencia, qué tan bien escala a futuros juegos, riesgo de verse genérica, peso estimado) y **tu recomendación**, justificada.

## Entregables

- `design/direcciones/D1-*/`, `D2-*/`, `D3-*/`, cada una con `README.md`, `pieces-sample.svg`, `logo-mark.svg`, `mockup-menu.png` y `mockup-chess.png`
- `design/direcciones/COMPARATIVA.md`
- `design/asset-manifest.json` con una entrada por archivo generado (id, propósito, herramienta, prompt si aplica, fecha, dimensiones, peso en bytes)

## Criterios de aceptación

- [ ] Las tres direcciones se distinguen a simple vista: no son variaciones de color de una misma idea.
- [ ] En cada `pieces-sample.svg` las 8 piezas se reconocen al reducirlas a 36 px (compruébalo exportando a ese tamaño y descríbelo en la Entrega).
- [ ] Los contrastes de la paleta están calculados y cumplen los mínimos.
- [ ] Ninguna pieza ni logo copia un set o marca existente.
- [ ] Las tipografías tienen licencia libre y fuente oficial indicada.
- [ ] Los SVG de piezas pesan ≤ 6 KB cada pieza (o el archivo de 8 piezas ≤ 40 KB).
- [ ] Sin texto incrustado en imágenes raster, salvo el texto de interfaz de las maquetas.

## Archivos permitidos

- `design/**` (nuevo)
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `public/`, `ESTADO.md` ni la configuración del proyecto.

## Fuera de alcance

- El set completo de 12 piezas, damas, backgammon, sudoku e iconos PWA (van en T-002 con la dirección elegida).
- Implementar la interfaz en código.

---

## Entrega

- **Qué hice:** Propuse tres sistemas visuales originales y claramente separados: D1 **Taller de fieltro** (caja de juegos artesanal), D2 **Club de medianoche** (precisión geométrica nocturna) y D3 **Papel en juego** (estudio editorial recortable). Cada dirección incluye paleta con estados y ratios WCAG, fuentes OFL con enlace oficial, lenguaje de piezas, cinco movimientos concretos, modo oscuro y marcas/piezas/mocks propios. Añadí una comparativa con recomendación D1.
- **Archivos:** `design/direcciones/D1-taller-de-fieltro/`, `D2-club-de-medianoche/` y `D3-papel-en-juego/` (cada una con `README.md`, `pieces-sample.svg`, `logo-mark.svg`, `mockup-menu.png`, `mockup-chess.png`); `design/direcciones/COMPARATIVA.md`; `design/asset-manifest.json`; y `design/render-mockups.ps1` como fuente reproducible de las seis maquetas.
- **Cómo lo verifiqué (pesos, legibilidad a 36 px, contrastes):** Las seis maquetas son PNG de **360 × 780 px** y pesan 19–22 KB. Los tres SVG de muestra pesan 1,336–1,493 bytes (muy por debajo del límite combinado de 40 KB) y los logos 383–439 bytes. Inspeccioné visualmente las maquetas finales, el manifiesto JSON se valida correctamente y `git diff --check` no reporta errores. Los contrastes declarados se recalcularon con luminancia sRGB: el texto normal supera 9.8:1 y los acentos de control 3.1:1 o más. Las siluetas se diseñaron para una caja individual de 100 × 100, con apoyo y≈92 y rasgos diferenciados; **no pude completar una exportación raster independiente a 36 px** porque no hay rasterizador SVG disponible y la política del navegador bloqueó abrir archivos locales. No afirmo esa comprobación como realizada.
- **Herramientas/modelos usados (tal como los reporta el entorno):** `image_gen` para tres referencias de atmósfera sin texto (D1, D2 y D3; no incluidas como activos finales); PowerShell 7 + `System.Drawing` para las seis maquetas PNG de composición local; SVG escrito por Codex para marcas y muestras. Los prompts resumidos de exploración constan en `design/asset-manifest.json`.
- **Limitaciones o bloqueos:** Falta únicamente la verificación solicitada de lectura mediante exportación raster real a 36 px; requerirá que Claude/una herramienta con rasterizador SVG la ejecute antes de cerrar el ticket. Las maquetas son especificaciones visuales, no código de interfaz ni activos publicados.
- **Preguntas abiertas:** Recomiendo elegir D1; D3 es la alternativa si se prefiere un tono más editorial. Tras elegir, confirmar si el modo oscuro debe entrar en T-002 o quedar para una iteración posterior.

## Revisión

**Claude Code · 2026-11-08 · Veredicto: revisado. Conceptos aceptados como base; las muestras visuales no alcanzan para elegir con confianza. Daniel decide si elige concepto ya o pide segunda ronda.**

- **Verificado:** pesos (muestras SVG 1.3–1.5 KB, maquetas 19–22 KB), fuentes con licencia OFL y enlace oficial, contrastes de texto declarados plausibles. Entrega honesta: declara lo que no pudo comprobar.
- **Comprobación a 36 px (la hizo Claude en el navegador, sobre las casillas de cada paleta, en ambos colores):** en D1 y D3 se reconocen las 8 piezas; el caballo es la más débil (D1 parece una bota). En D2 se reconocen, pero las claras se leen cian, no blancas: blanco y negro se distinguen sobre todo por el tono (cian/violeta), no por la luminosidad.

- [R-01] Severidad: alta
  Ubicación: `design/render-mockups.ps1`, `mockup-*.png` de las tres direcciones
  Evidencia: las seis maquetas salen de la misma plantilla con la misma composición, las mismas posiciones y las mismas fichas genéricas (`Token`); solo cambia la paleta. Las piezas de las maquetas no son las de `pieces-sample.svg` ni se usa la marca de cada dirección.
  Consecuencia: incumple el criterio 1 ("no son variaciones de color de una misma idea"). Daniel no puede ver ni sentir la temática (fieltro, neón, papel) para elegir.
  Corrección: maquetas propias por dirección, con sus piezas, su marca, sus texturas o tratamientos y su tipografía real (por ejemplo, HTML/SVG exportado a PNG).

- [R-02] Severidad: alta
  Ubicación: `D1-*/pieces-sample.svg`, `D3-*/pieces-sample.svg`
  Evidencia: D1 y D3 comparten la misma estructura (base trapezoidal, cuerpo trapezoidal, cruz idéntica en el rey, peón de círculo). La "madera torneada" de D1 y el "papel recortado" de D3 no aparecen en la forma: son iconos planos con contorno.
  Consecuencia: el pedido central de Daniel ("cada pieza diseñada acorde a la temática") no se cumple todavía.
  Corrección: que la temática esté en la silueta y el tratamiento (perfiles torneados con anillos y luz de madera en D1; capas desplazadas con sombra de papel en D3; facetas y filete luminoso en D2).

- [R-03] Severidad: media
  Ubicación: `D2-*/pieces-sample.svg`
  Evidencia: la pieza clara se ve cian a 36 y 72 px (el trazo cian de 5 u domina el relleno).
  Consecuencia: depende del tono para separar bandos, con riesgo para daltonismo.
  Corrección: separar los bandos por luminosidad (relleno claro real frente a oscuro) y dejar el color solo como acento.

- [R-04] Severidad: media
  Ubicación: `design/asset-manifest.json` → `explorationReferences`
  Evidencia: las tres imágenes de atmósfera de `image_gen` no se guardaron.
  Consecuencia: se perdió el material más útil para que Daniel compare atmósferas.
  Corrección: guardarlas como `design/direcciones/Dn-*/mood.webp` (≤ 150 KB, sin texto).

- [R-05] Severidad: baja
  Ubicación: maquetas de ajedrez
  Evidencia: muestran reloj "01:42" y "Deshacer" en partida en línea; la app no tiene reloj ni deshacer en línea.
  Consecuencia: confusión menor.
  Corrección: si se propone reloj, señalarlo como idea; si no, quitarlo.

- **Sobre la pregunta de modo oscuro:** entra en T-002 si la dirección elegida es clara (D1, D3); en D2 es el modo base.
