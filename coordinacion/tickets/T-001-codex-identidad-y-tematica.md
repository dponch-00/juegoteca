# T-001 — Identidad y temática de Juegoteca: tres direcciones

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code |
| Estado | abierto |
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

- **Qué hice:**
- **Archivos:**
- **Cómo lo verifiqué (pesos, legibilidad a 36 px, contrastes):**
- **Herramientas/modelos usados (tal como los reporta el entorno):**
- **Limitaciones o bloqueos:**
- **Preguntas abiertas:**

## Revisión

(la llena Claude Code)
