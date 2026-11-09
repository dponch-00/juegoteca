# T-006 — Auditoría de diseño v0.7

Revisión visual de las 42 capturas producidas con `npm run app:screens` el 2026-11-09. La base está muy lograda: el nogal, el fieltro, las piezas y las tarjetas hacen que la app se sienta como una caja de juegos cuidada, no como cuatro minijuegos inconexos. Los hallazgos se concentran en los controles que aún usan símbolos de sistema, el uso de la pantalla ancha y algunos ritmos verticales. No se revisó la sala WebRTC ni el repaso de ajedrez porque el capturador no los cubre.

- [T6-01] Severidad: alta
  Pantalla: partida de backgammon en tableta (`backgammon-partida--tablet-claro.png`, `backgammon-partida--tablet-oscuro.png`)
  Evidencia: el tablero ocupa aproximadamente los primeros 760 px de los 1180 px disponibles; entre las dos tarjetas de jugador del extremo derecho queda una zona vacía de unas 420 × 330 px. La acción "Mueve 2 fichas" queda dentro del tablero y los botones secundarios quedan aislados abajo.
  Propuesta: a partir de 900 px, convertir la zona lateral en el panel de turno de 280 px: título `Tu jugada`, texto de estado, dados/CTA principal y lista de movimientos posibles; mantener las tarjetas de jugador arriba y abajo. Véase `T-006/backgammon-panel.png`.
  Implementa: Claude (CSS/componente)

- [T6-02] Severidad: alta
  Pantalla: partida de sudoku (`sudoku-partida--movil-claro.png`, `sudoku-partida--movil-oscuro.png`)
  Evidencia: deshacer (`↶`), borrar (`⌫`), notas (`✎`), auto-notas (`▦`) y pista (bombillo emoji) mezclan cinco lenguajes de iconografía. El estado de Notas se expresa con una pequeña cápsula `No` encima del símbolo, fácil de perder en móvil.
  Propuesta: sustituirlos por `undo`, `erase`, `notes`, `auto-notes` y `hint`; ubicarlos en una sola bandeja de 70 px con círculos de 36 px, etiqueta corta y estado activo verde/fondo verde pálido. La maqueta está en `T-006/sudoku-acciones.png`.
  Implementa: Codex (activo) | Claude (CSS/componente)

- [T6-03] Severidad: media
  Pantalla: inicio (`inicio--movil-claro.png`, `inicio--movil-oscuro.png`)
  Evidencia: después de las cuatro tarjetas hay cerca de 160 px de vacío antes del pie en el móvil de 812 px; el bloque de unirse usa el glifo `⌘`, que parece un símbolo de teclado ajeno al resto de la marca.
  Propuesta: conservar el pie abajo y usar ese hueco para una tarjeta de 84 px `Mesa de hoy`, con acceso a una partida rápida o a continuar la última; reemplazar `⌘` por `join`. Véase `T-006/inicio-ritmo.png`.
  Implementa: Codex (activo) | Claude (CSS/componente)

- [T6-04] Severidad: media
  Pantalla: lobbies de ajedrez y damas (`ajedrez-lobby--movil-claro.png`, `damas-lobby--movil-claro.png`)
  Evidencia: las elecciones de modo, color y nivel usan tarjetas correctas pero la selección se reconoce principalmente por el relleno coral/verde. En oscuro el borde de una tarjeta no seleccionada se acerca visualmente al de una seleccionada.
  Propuesta: añadir `check` a la opción elegida, un borde de 2 px `accent` y texto de estado explícito (`Seleccionado`) en la tarjeta; dejar el color como apoyo, no señal única. Usar `text` sobre `surface` (13.1:1 claro; 15.5:1 oscuro) y `accent` solo con `accent-ink`.
  Implementa: Codex (activo) | Claude (CSS/componente)

- [T6-05] Severidad: media
  Pantalla: partida y resultado de ajedrez (`ajedrez-partida--movil-claro.png`, `ajedrez-resultado--movil-claro.png`, y equivalentes oscuros)
  Evidencia: la hoja de resultado tiene una jerarquía excelente, pero las acciones de volver, compartir y revisar siguen dependiendo de texto o flechas de fuente, mientras los demás juegos muestran combinaciones distintas de símbolos.
  Propuesta: usar `back`, `share`, `copy`, `prev` y `next` con etiqueta HTML; reservar `flag` para rendirse y `warning` para pérdida de conexión. Mantener botones de icono en caja de 44 × 44 px y acciones destructivas en coral.
  Implementa: Codex (activo) | Claude (CSS/componente)

- [T6-06] Severidad: media
  Pantalla: partidas horizontales (`ajedrez-partida--horizontal-claro.png`, `damas-partida--horizontal-claro.png`, `sudoku-partida--horizontal-claro.png`)
  Evidencia: el tablero conserva una lectura muy buena, pero los controles auxiliares quedan comprimidos en columnas estrechas y con rótulos de una línea pequeña; el peso visual del tablero no se acompaña de una barra de turno igualmente clara.
  Propuesta: en 812 × 375 usar una barra lateral fija de 168 px con jugador activo, una sola acción primaria y acciones secundarias con icono/etiqueta; ocultar descripciones redundantes, no reducir el objetivo táctil por debajo de 44 px.
  Implementa: Claude (CSS/componente)

- [T6-07] Severidad: media
  Pantalla: sudoku con error y pista (`sudoku-pista--movil-claro.png`, `sudoku-pista--movil-oscuro.png`)
  Evidencia: el error se distingue en rojo y la pista por color de casilla, pero al reducir saturación la diferencia de intención se pierde; el contador `1 error` no explica qué celda es el problema.
  Propuesta: para error, añadir borde doble fino y el icono `warning` en el mensaje de estado; para pista, aro de 2 px verde y etiqueta `Pista aplicada` durante 2.5 s. No usar solo relleno. `text`/`text-dim` ya cumplen AA según `identity.md`; validar los nuevos bordes a 3:1 contra `surface`.
  Implementa: Codex (activo) | Claude (CSS/componente)

- [T6-08] Severidad: baja
  Pantalla: inicio y encabezados (`inicio--movil-claro.png`, `ajedrez-lobby--movil-claro.png`)
  Evidencia: el símbolo actual de Juegoteca puede leerse como un `+` a 48 px por el cruce coral centrado; el nombre completo sí mantiene una lectura clara.
  Propuesta: no reemplazar todavía. Daniel puede escoger entre la variante `logo-ribete.png` (mesa dentro de una caja) y `logo-ficha.png` (ficha y unión); ambas se muestran a 48 px, 180 px y en caja de icono. La primera es la recomendada: conserva el gesto de mesa y elimina el cruce central.
  Implementa: Codex (propuesta; decisión de Daniel)

- [T6-09] Severidad: baja — resuelto en este ticket
  Pantalla: hoja de piezas (`design/review/pieces-sheet.png`)
  Evidencia: la revisión T4-04 detectó bases entre y≈495–511, rey blanco desplazado y alfa tenue arriba. Tras normalizar, las 12 siluetas con alfa ≥20 terminan en y=470 y sus centros quedan entre x=255 y x=256; ya no hay alfa de borde en y=0.
  Propuesta: conservar `normalize_position()` de `design/process-piece-renders.py` como única ruta de exportación de las piezas Staunton.
  Implementa: Codex (activo)

- [T6-10] Severidad: baja — resuelto en este ticket
  Pantalla: hoja de fichas (`design/review/checkers-sheet.png`)
  Evidencia: T5-01 señaló un arco/reflejo anaranjado desprendido bajo las fichas simples. El nuevo master conserva la ficha hasta y=421/425 y elimina el componente separado que empezaba tras un hueco de 18 px; la hoja ya no muestra ese arco.
  Propuesta: aplicar `remove_detached_floor_reflection()` solo a `wman` y `bman`, sin afectar las fichas coronadas ni backgammon.
  Implementa: Codex (activo)

## Top 10 para v0.8

| Orden | Cambio ejecutable | Impacto | Esfuerzo | Responsable |
| ---: | --- | --- | --- | --- |
| 1 | Convertir el vacío de backgammon en tableta a panel de turno de 280 px. | Alto | Medio | Claude |
| 2 | Sustituir emoji/símbolos de Sudoku por los cinco SVG y bandeja de acciones. | Alto | Medio | Claude + Codex listo |
| 3 | Conectar todos los controles compartidos a `public/assets/ui/` y retirar glifos de fuente. | Alto | Medio | Claude + Codex listo |
| 4 | Hacer todas las opciones seleccionadas con check, borde de 2 px y texto de estado. | Alto | Bajo | Claude |
| 5 | Garantizar cajas táctiles de 44 × 44 px en barras horizontal, resultado y Sudoku. | Alto | Bajo | Claude |
| 6 | Unificar barra lateral horizontal (168 px, jugador/acción/auxiliares). | Medio | Medio | Claude |
| 7 | Añadir señales no cromáticas para error, pista, turno y conexión. | Medio | Medio | Claude + Codex listo |
| 8 | Añadir `Mesa de hoy` en el vacío de Inicio y usar `join` para salas. | Medio | Bajo | Claude + Codex listo |
| 9 | Probar la alternativa `logo-ribete` a 48 px antes de cambiar la marca actual. | Medio | Bajo | Daniel + Claude |
| 10 | Mantener el procesado normalizado de piezas y fichas sin reflejo al regenerar activos. | Bajo | Bajo | Codex |
