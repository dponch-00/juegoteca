# D2 — Club de medianoche

## Concepto y temática

**Juegoteca es un club de juegos abierto de noche:** paneles de índigo, tableros luminosos y fichas translúcidas de precisión. No imita una sala arcade; toma su energía de señalética y luz eléctrica para que las jugadas en línea se sientan vivas y las presenciales, nítidas. Cada juego puede adoptar una familia geométrica sin perder el lenguaje común de bordes de luz.

## Paleta y contraste

| Uso | Color | Contraste calculado |
| --- | --- | --- |
| Fondo | `#0D1020` | — |
| Superficie | `#171C33` | — |
| Texto | `#F5F7FF` | 17.7:1 sobre fondo; 15.7:1 sobre superficie |
| Acento principal (cian) | `#36D5C6` | 10.7:1 sobre fondo (control) |
| Acento secundario (magenta) | `#F05A9B` | 5.7:1 sobre fondo (control) |
| Casilla clara | `#333A68` | — |
| Casilla oscura | `#1B2146` | — |
| Jugador claro | `#F4F7FF` | 16.5:1 contra jugador oscuro |
| Jugador oscuro | `#10182D` | contorno cian: 9.7:1 |
| Última jugada | `#F6B84B` | 10.7:1 sobre fondo; se usa como velo, no texto |
| Selección | `#36D5C6` | 10.7:1 sobre fondo |
| Movimiento posible | `#A68CFF` | 7.0:1 sobre fondo |
| Jaque/peligro | `#FF6A6A` | 6.8:1 sobre fondo |

Los controles rellenos se validan frente al fondo oscuro; todo texto es blanco sobre fondo/superficie. Sobre el tablero, los estados son borde y transparencia, nunca texto pequeño.

## Tipografía

- **Títulos:** [Space Grotesk](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1. Técnica pero amable, sin caer en estética de marca ajena.
- **Interfaz:** [Inter](https://github.com/rsms/inter), SIL Open Font License 1.1. Muy clara para temporizadores, código de sala y estadísticas.

Las familias se descargan y alojan localmente en formato WOFF2.

## Lenguaje de las piezas

Son fichas de cristal opaco con núcleo luminoso y corte geométrico. Rey: corona de cuatro picos rectos; dama: diamante suspendido; caballo: perfil angular con dos muescas; peón: orbe dentro de columna. Alfil tendría una ranura diagonal con luz; torre, tres bloques escalonados. Cada una tiene una silueta exterior distinta y un borde de 3 px: blanco hielo y azul noche se sostienen sobre las dos casillas incluso a 36 px, sin depender solo del brillo.

## Movimiento

1. **Tocar/seleccionar:** halo cian se enciende en 100 ms `cubic-bezier(.2,.9,.2,1)`.
2. **Mover pieza:** 160 ms `cubic-bezier(.15,.8,.25,1)`, con rastro de 70 ms que se apaga antes del siguiente turno.
3. **Captura:** destello magenta de 90 ms, contracción a 0.82 y fundido de 100 ms; sin sacudida de tablero.
4. **Jaque:** marco rojo hace dos cortes de luz de 120 ms separados por 90 ms.
5. **Victoria:** contador de partículas geométricas asciende 400 ms, una vez y sin bloquear la revancha.

Con movimiento reducido se eliminan rastro y partículas; estados cambian con opacidad en 80 ms.

## Modo oscuro

Es la dirección nativa. Un modo claro no es prioritario: si se añade, usa papel azul `#EEF2FF`, tinta `#141936` y conserva cian/magenta para identidad sin simular el brillo.

## Muestras

`pieces-sample.svg` define las ocho siluetas en una retícula de muestra y mantiene la base de cada una en y=92. Las maquetas se compusieron localmente; la exploración inicial de atmósfera se hizo con `image_gen` y quedó fuera de los activos finales.
