# T-003 — Pulido de las piezas de ajedrez

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code (a pedido de Daniel) |
| Estado | abierto |
| Creado | 2026-11-08 |
| Depende de | T-002 (revisado e integrado) |

## Contexto

Las 12 piezas de T-002 ya están en la app publicada y la familia "madera torneada" funciona: base escalonada, veta, bandos separados por luminosidad y un caballo reconocible. Daniel pidió **pulirlas antes de seguir con más juegos**. Lee la Revisión de T-002, en especial **T2-01** y **T2-02**.

**Ahora puedes ver tus piezas a tamaño real.** Ejecuta:

```
npm install
npm run pieces:sheet
```

Genera `design/review/pieces-sheet.png` (fuera de git): las 12 piezas a 36 px y a 64 px, sobre casilla clara y oscura, en modo claro, en modo oscuro y en escala de grises, dibujadas al 92 % de la casilla igual que en la app. Ábrela y mírala después de cada cambio. Es la verificación que faltó en T-002.

## Pedido

### 1. Jerarquía de alturas

Hoy las seis piezas miden casi lo mismo. En un juego de ajedrez real la altura es la primera pista para reconocerlas. Usa como guía la parte superior de cada pieza (con la base apoyada en y≈92):

| Pieza | Tope aproximado (y) |
| --- | --- |
| Rey (cruz incluida) | 8 |
| Dama | 12 |
| Alfil | 18 |
| Caballo | 20 |
| Torre | 26 |
| Peón | 36 |

Puedes ajustar ±3 si mejora el conjunto. El rey y la dama deben ser visiblemente las más altas; el peón, claramente el más bajo.

### 2. Base más baja, cabeza más grande

La base de tres niveles ocupa cerca del 40 % del alto y se come la lectura.

- Pasa a **dos niveles** (o tres muy finos) y limita la base a ~**18 % del alto** de la pieza.
- La **base no debe pasar de 56 de ancho** (hoy mide 66, de x≈17 a x≈83) y la del peón es más estrecha que la del rey, para que la pieza respire dentro de la casilla.
- Usa el espacio ganado para **cabezas más grandes y legibles a 36 px**: cruz del rey más gruesa, corona de la dama con puntas claras, mitra del alfil con su corte bien visible, almenas de la torre marcadas, cabeza del caballo un poco mayor y peón con esfera más grande.
- Cuerpos con perfil de torno (cuello y anillo bajo la cabeza), no conos lisos. Que se vea "torneado" también en la parte alta.

### 3. Lo que se conserva

Familia, colores de madera (arce `#FFF3D6` y nogal `#4B2D1D`), filete inverso, veta sutil, `viewBox="0 0 100 100"`, apoyo en y≈92, ≤ 6 KB por archivo, ids únicos por archivo, sin `<text>` ni imágenes incrustadas. Mismos nombres de archivo: la app no cambia.

### 4. Tokens (T2-02)

En `design/tokens.json`, modo `light`: `p0` debe ser el bando claro y `p1` el oscuro, como en `dark`. Valores: `p0: #FFF8E7`, `p1: #294536`. Claude ya los usa así en `src/styles/tokens.css`; esto solo alinea la fuente.

### 5. Registro

Actualiza las entradas de las 12 piezas en `design/asset-manifest.json` (fecha y bytes) y el script que las genera (`design/generate-taller-assets.mjs`), para que sigan siendo reproducibles.

## Entregables

- `public/assets/chess/pieces/*.svg` (los 12, reemplazados)
- `design/generate-taller-assets.mjs` actualizado
- `design/tokens.json` (solo `p0`/`p1` de `light`)
- `design/asset-manifest.json` actualizado

## Criterios de aceptación

- [ ] En `pieces-sheet.png`, a 36 px, se ordenan las piezas por altura a simple vista: rey > dama > alfil ≈ caballo > torre > peón.
- [ ] La base ocupa ≤ 20 % del alto de cada pieza y ≤ 56 de ancho.
- [ ] A 36 px, sobre ambas casillas y en escala de grises, se reconocen las 6 cabezas y los dos bandos.
- [ ] Cada SVG pesa ≤ 6 KB, con ids únicos y sin `<text>` ni imágenes.
- [ ] `tokens.json` → `light.p0 = #FFF8E7`, `light.p1 = #294536`.
- [ ] La Entrega describe lo que viste en `pieces-sheet.png` (no lo adjuntes: está fuera de git).

## Archivos permitidos

- `public/assets/chess/pieces/*.svg`
- `design/**`
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `scripts/`, `package.json` ni `ESTADO.md`.

## Fuera de alcance

- Cambiar el logo o el ícono de la app (T2-03 queda en espera de Daniel).
- Fichas de otros juegos.

---

## Entrega

- **Qué hice:**
- **Archivos:**
- **Qué vi en `pieces-sheet.png` (36/64 px, claro, oscuro, grises):**
- **Pesos:**
- **Herramientas/modelos usados:**
- **Limitaciones o bloqueos:**
- **Preguntas abiertas:**

## Revisión

(la llena Claude Code)
