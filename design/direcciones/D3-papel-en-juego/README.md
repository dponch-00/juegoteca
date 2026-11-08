# D3 — Papel en juego

## Concepto y temática

**Juegoteca es un estudio editorial de juegos recortables:** capas de papel cálido, tinta azul y colores de imprenta. Tiene el orden de un libro bien diseñado y el tacto imaginario de fichas que se encajan; por eso sirve tanto para una sesión tranquila de sudoku como para una partida competitiva a distancia. Es la dirección más expresiva sin recurrir a personajes ni a nostalgia de una marca existente.

## Paleta y contraste

| Uso | Color | Contraste calculado |
| --- | --- | --- |
| Fondo | `#FFF9EE` | — |
| Superficie | `#F5ECD8` | — |
| Texto/tinta | `#243B53` | 11.0:1 sobre fondo; 9.8:1 sobre superficie |
| Acento principal (terracota) | `#B84A3D` | 4.9:1 sobre fondo (control) |
| Acento secundario (azul) | `#2D6F9D` | 5.2:1 sobre fondo (control) |
| Casilla clara | `#F2D5A5` | — |
| Casilla oscura | `#B87854` | — |
| Jugador claro | `#FFF9EE` | contorno tinta: 11.0:1 |
| Jugador oscuro | `#294E6C` | 8.4:1 contra fondo |
| Última jugada | `#E2B64B` | 1.8:1 sobre clara; se usa con trama y borde |
| Selección | `#B84A3D` | 5.1:1 sobre fondo |
| Movimiento posible | `#5C9B75` | 3.1:1 sobre fondo |
| Jaque/peligro | `#A93232` | 6.3:1 sobre fondo |

Las relaciones se calcularon con luminancia sRGB. La tinta sirve para todo texto normal; los estados de bajo contraste nunca llevan texto y se duplican con forma/contorno.

## Tipografía

- **Títulos:** [DM Serif Display](https://github.com/googlefonts/dm-fonts), SIL Open Font License 1.1. Da un tono editorial memorable a una palabra o resultado, no a controles largos.
- **Interfaz:** [Manrope](https://github.com/sharanda/manrope), SIL Open Font License 1.1. Sus números son claros para reloj, coordenadas y códigos de sala.

Se autoalojan en WOFF2 para funcionamiento offline.

## Lenguaje de las piezas

Figuras de papel apilado con borde de tinta y una sombra recortada corta. Rey: cruz recortada sobre un octágono; dama: abanico de cinco puntas; caballo: cabeza tipo marcador con hocico recto; peón: círculo recortado sobre cono. Alfil sería una gota dividida por corte diagonal y torre un bloque almenado. El claro es crema con borde azul; el oscuro es azul tinta con borde crema. A 36 px, silueta, borde y la capa de sombra separan todas las piezas en casillas claras y oscuras.

## Movimiento

1. **Tocar/seleccionar:** la capa superior se desplaza -2 px en 110 ms `cubic-bezier(.2,.85,.2,1)`.
2. **Mover pieza:** 190 ms `cubic-bezier(.18,.8,.25,1)`, manteniendo sombra desplazada durante el viaje.
3. **Captura:** la pieza tomada gira 4° y se hunde 3 px en 130 ms, después se desvanece.
4. **Jaque:** dos bandas terracota atraviesan el borde en 150 ms, con pausa de 70 ms.
5. **Entrada al menú:** capas de tarjetas aparecen en 210 ms con un retraso escalonado de 40 ms.

Con movimiento reducido, capas y bandas se sustituyen por cambios de color de 80 ms.

## Modo oscuro

Sí, como papel de noche: fondo `#1D2B36`, superficie `#263946`, tinta `#FFF4D8`, terracota `#E57866` y azul `#78B5DE`. El tablero pasa a arena apagada y arcilla para mantener su identidad de impresión.

## Muestras

Las ocho muestras SVG comparten símbolos originales y línea de base y=92. `mockup-menu.png` y `mockup-chess.png` se renderizan de composición vectorial local; la referencia de papel inicial se generó con `image_gen`, pero no se entrega como activo final.
