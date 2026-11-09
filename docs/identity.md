# Identidad — Taller de fieltro

## Idea y personalidad

Juegoteca se siente como abrir una caja de juegos bien hecha: nogal cálido, fieltro verde profundo, piezas de arce y detalles coral pintados a mano. Es serena, táctil y contemporánea; invita a concentrarse en la partida y en la otra persona, no a competir con la interfaz.

## Paleta y accesibilidad

| Rol | Claro | Oscuro | Contraste relevante |
| --- | --- | --- | --- |
| Fondo | `#F5F0E5` | `#18221B` | — |
| Superficie | `#FFFDF6` | `#263329` | — |
| Texto | `#1F2A22` | `#FFF8E7` | 13.1:1 sobre fondo claro; 15.5:1 sobre fondo oscuro |
| Texto secundario | `#526056` | `#CAD4C7` | 5.8:1 sobre fondo claro; 10.7:1 sobre fondo oscuro |
| Botón coral | `#B9473B` | `#EA7464` | 4.9:1 / 6.0:1 con `accent-ink` |
| Botón verde | `#2E6B52` | `#78B991` | 5.9:1 / 7.1:1 con el color de tinta correspondiente |
| Peligro | `#9E2F2F` | `#FF9088` | 6.4:1 / 7.5:1 sobre fondo |
| Casilla clara / oscura | `#E9D9BB` / `#967253` | `#B99470` / `#5D432E` | Las piezas añaden filete para ambas. |

Los ratios se calcularon con luminancia relativa sRGB y redondeo a una decimal. El texto siempre usa `text` o `text-dim`; las capas de estado del tablero son señales sin texto y no son el único indicador de una acción.

## Tipografía

- **Fraunces** es la voz de los títulos y resultados: amable, ligeramente expresiva y propia de una caja editorial. Fuente oficial: [undercasetype/Fraunces](https://github.com/undercasetype/Fraunces), SIL Open Font License 1.1.
- **Atkinson Hyperlegible Next** es la interfaz: formas distintivas para código de sala, turnos y controles compactos. Fuente oficial: [googlefonts/atkinson-hyperlegible-next](https://github.com/googlefonts/atkinson-hyperlegible-next), SIL Open Font License 1.1.

Se sirven localmente y contienen el conjunto latino necesario para español: á, é, í, ó, ú, ñ, ü, ¿ y ¡.

## Piezas y fichas

Las piezas no son iconos dibujados encima de un tablero: son pequeños objetos torneados. Comparten base escalonada, anillos, cuello y una veta mínima vectorial. La silueta superior es funcional: cruz ancha (rey), corona de cinco puntas (dama), mitra con corte diagonal (alfil), almenas (torre), cabeza esférica (peón) y un caballo con oreja, hocico y crin separados. Arce marfil y nogal oscuro se distinguen por luminosidad incluso en escala de grises; el filete inverso las mantiene legibles sobre ambas casillas.

Las fichas futuras siguen el mismo principio: discos con canto torneado y anillo de fieltro, nunca plástico brillante ni ilustración plana.

## Iconos

Los controles usan los SVG de `public/assets/ui/`, nunca emoji ni glifos de la fuente. Cada icono es un lienzo de 24 × 24, usa `currentColor`, trazo de 2 px con extremos y uniones redondeados, y se dibuja a 20 o 24 px dentro de un botón con área táctil mínima de 44 × 44 px. La familia es deliberadamente sobria: líneas suaves y abiertas, como las marcas funcionales de una caja de juegos bien hecha; el color procede del estado del control, no del archivo.

`design/revision/T-006/iconos.png` documenta los veinte iconos en claro y oscuro, a ambos tamaños. Los nombres funcionales son `back`, `undo`, `restart`, `hint`, `dice`, `erase`, `notes`, `auto-notes`, `pause`, `play`, `prev`, `next`, `streak`, `join`, `check`, `warning`, `flag`, `share` y `copy`. Si un control necesita explicación, conserva una etiqueta HTML accesible: la silueta no sustituye al nombre en acciones ambiguas.

## Movimiento

- Selección: aro coral de 120 ms, `cubic-bezier(.2,.8,.2,1)`.
- Movimiento: 180 ms, `cubic-bezier(.2,.75,.25,1)`, directo y sin rebote.
- Captura: la pieza tomada baja 3 px, encoge a 0.7 y desvanece en 110 ms.
- Jaque: borde coral, dos pulsos de 140 ms separados 80 ms.
- Entrada: tarjetas ascienden 12 px en 220 ms, retraso de 45 ms, `cubic-bezier(.16,1,.3,1)`.

Con `prefers-reduced-motion`, todo queda en fundidos de 80 ms y se eliminan pulsos y desplazamientos.

## Texturas

La textura se sugiere, no se fotografía en la interfaz: veta muy tenue en piezas, paño plano verde en grandes superficies y sombras suaves. Las texturas no deben reducir contraste, competir con estados ni añadirse a texto o controles.

## Backgammon

El tablero de backgammon conserva el fieltro como campo y suma un marco de nogal. Las puntas alternan arcilla y verde para no competir con las fichas; la barra de arce es el ancla central. Las fichas son arce claro (`#F6E9CB` aproximado en la cara iluminada) y nogal oscuro (`#2B1810` aproximado en la cara sombreada), con borde inverso y brillo de barniz, por lo que su lectura no depende de un único ratio de relleno.

| Fondo | Claro: arce | Oscuro: nogal | Tratamiento de separación |
| --- | ---: | ---: | --- |
| `light.board` `#477D62` | 4.0:1 | 3.5:1 | Filete carbón del arce; luz cálida de borde del nogal. |
| `light.point-a` `#8F5A3B` | 4.7:1 | 3.0:1 | Los surcos y borde inverso mantienen ambos discos. |
| `light.point-b` `#5D8A70` | 3.3:1 | 4.3:1 | La luminancia favorece el nogal; arce usa el filete oscuro. |
| `dark.board` `#385E4B` | 6.1:1 | 2.3:1 | El nogal queda definido por el brillo de borde, no por una masa plana. |
| `dark.point-a` `#B76C4C` | 3.3:1 | 4.2:1 | Borde inverso y surcos concéntricos. |
| `dark.point-b` `#6F987E` | 2.7:1 | 5.2:1 | El arce conserva contorno carbón; el nogal, luminancia. |

Los ratios son de colores de cara frente al fondo y se calculan con luminancia sRGB. Las fichas reales tienen además rim-light y contorno de material: los estados de juego nunca se codifican solo con color.

## Sí / no

**Sí:** perfiles torneados, esquinas suaves, verde fieltro como ancla, coral para acción puntual, sombras cortas y materiales mate.

**No:** vetas raster repetidas, madera brillante de lujo, neón, piezas históricas copiadas, marrones sin contraste, ornamento que afecte la lectura, ni imágenes con texto.
