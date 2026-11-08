# D1 — Taller de fieltro

## Concepto y temática

**Juegoteca es una caja de juegos hecha a mano:** madera de nogal, paño de fieltro verde y detalles pintados con coral. Es cálida sin ser infantil y convierte una partida cara a cara en el ritual de abrir una buena caja de mesa. La superficie despejada, las fichas sólidas y el acento coral hacen que el turno y el rival sean evidentes en una pantalla pequeña.

## Paleta y contraste

| Uso | Color | Contraste calculado |
| --- | --- | --- |
| Fondo | `#F5F0E5` | — |
| Superficie | `#FFFDF6` | — |
| Texto/tinta | `#1F2A22` | 13.1:1 sobre fondo; 14.6:1 sobre superficie |
| Acento principal (coral) | `#B9473B` | 4.6:1 sobre fondo (control) |
| Acento secundario (verde) | `#2E6B52` | 5.6:1 sobre fondo (control) |
| Casilla clara | `#E9D9BB` | — |
| Casilla oscura | `#967253` | — |
| Jugador claro | `#FFF8E7` | contorno tinta: 14.0:1 |
| Jugador oscuro | `#294536` | 9.9:1 contra jugador claro |
| Última jugada | `#EEC968` | 1.4:1 sobre clara; se usa con borde coral, no como texto |
| Selección | `#B9473B` | 4.6:1 sobre fondo |
| Movimiento posible | `#4C9874` | 3.2:1 sobre casilla clara |
| Jaque/peligro | `#9E2F2F` | 6.4:1 sobre fondo |

Los valores son ratios WCAG relativos calculados con luminancia sRGB. Texto normal usa únicamente tinta sobre fondo/superficie; controles rellenos usan coral o verde con texto claro, ambos por encima de 3:1 para componentes.

## Tipografía

- **Títulos:** [Fraunces](https://github.com/undercasetype/Fraunces), SIL Open Font License 1.1. Sus remates suaves recuerdan el rótulo impreso de una caja de juegos.
- **Interfaz:** [Atkinson Hyperlegible Next](https://github.com/googlefonts/atkinson-hyperlegible-next), SIL Open Font License 1.1. Sus formas abiertas priorizan nombres, código de sala y controles pequeños.

Ambas se alojan localmente como WOFF2 en la integración; no se requieren fuentes remotas.

## Lenguaje de las piezas

Piezas de madera torneada, no figuritas históricas. Base ovalada de dos niveles, cuerpo macizo y una silueta superior propia: cruz corta y ancha para rey, corona de tres remates para dama, crin triangular para caballo y cabeza redonda para peón. El alfil se resolvería con una hendidura diagonal muy ancha y la torre con almenas bajas. A 36 px la silueta superior sigue siendo la lectura principal y el doble contorno de tinta separa la pieza de ambas casillas. Claro usa marfil con sombra verde; oscuro usa nogal/verde profundo con filete crema.

## Movimiento

1. **Tocar/seleccionar:** aro coral escala de 0.92 a 1 en 120 ms, `cubic-bezier(.2,.8,.2,1)`.
2. **Mover pieza:** traslación directa de 180 ms, `cubic-bezier(.2,.75,.25,1)`; sin rebote para conservar precisión.
3. **Captura:** la pieza tomada se encoge a 0.7 y desvanece en 110 ms; la atacante llega 50 ms después.
4. **Jaque:** borde coral pulsa dos veces (140 ms + 140 ms, pausa 80 ms) y queda estático.
5. **Entrada al menú:** tarjetas suben 12 px y aparecen escalonadas cada 45 ms; 220 ms `cubic-bezier(.16,1,.3,1)`.

`prefers-reduced-motion` reduce todos los desplazamientos a fundidos de 80 ms y anula pulsos.

## Modo oscuro

Sí. Conserva el taller al anochecer: fondo `#19221C`, superficie `#243229`, tinta `#F8F2E6`, fieltro `#2E6B52` y coral ligeramente claro `#EA7464`. Los tableros mantienen madera clara/oscura para que las piezas de marfil y nogal no pierdan contraste.

## Muestras

`pieces-sample.svg` contiene ocho símbolos originales (rey, dama, caballo y peón en ambos colores), todos con su línea de apoyo en y=92. `mockup-*.png` se compuso con el renderizador local de maquetas; la referencia visual de exploración se generó con `image_gen` y no se incorpora como activo final.
