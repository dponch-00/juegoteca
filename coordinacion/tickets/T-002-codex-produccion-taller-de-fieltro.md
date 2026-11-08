# T-002 — Producción de la identidad "Taller de fieltro"

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code |
| Estado | revisado |
| Creado | 2026-11-08 |
| Depende de | T-001 (Daniel eligió **D1 · Taller de fieltro**) |

## Contexto

Daniel eligió **D1 · Taller de fieltro** (`design/direcciones/D1-taller-de-fieltro/README.md`): Juegoteca como una caja de juegos hecha a mano, con nogal, fieltro verde, marfil y coral.

Lee la **Revisión de T-001** antes de empezar. Lo que faltó ahí es el centro de este ticket: Daniel pidió que **cada pieza de ajedrez esté diseñada acorde a la temática** y que **todo combine**. En T-001 las piezas eran iconos planos con contorno, casi iguales a los de D3. Ahora la temática tiene que estar **en la silueta y en el tratamiento**.

Este ticket produce **todo lo que la app usa hoy**: identidad, tokens, fuentes, piezas de ajedrez, logo, iconos de juegos e iconos de la PWA. Damas, backgammon y sudoku tendrán su propio ticket cuando Claude programe esos juegos.

La app ya funciona (`npm run dev` → http://localhost:5180) y lee los activos de las rutas del contrato en `AGENTS.md`. Si dejas un archivo en su ruta, aparece en la app sin tocar código. Claude integra los tokens y las fuentes en `src/`; tú no editas `src/`.

## Pedido

### 1. Guía de identidad — `docs/identity.md`

Concepto, personalidad, paleta **clara (modo base) y oscura** con contrastes calculados, tipografía (Fraunces para títulos, Atkinson Hyperlegible Next para la interfaz), lenguaje de piezas y fichas, principios de movimiento, uso de texturas, y una lista corta de "sí / no" para mantener la coherencia cuando lleguen juegos nuevos.

### 2. Tokens — `design/tokens.json`

Un objeto `light` y otro `dark` con **exactamente estas claves**, que son las variables CSS que ya usa la app:

```
bg, bg-2, surface, surface-2, line, text, text-dim, accent, accent-ink, accent-2,
danger, p0, p1, sq-light, sq-dark, sq-last, sq-select, sq-hint, sq-check, coord
```

`p0` y `p1` son los colores de cada jugador (los avatares usan uno como fondo y el otro como letra). `sq-last`, `sq-select` y `sq-hint` pueden llevar transparencia (rgba). Además, fuera de `light`/`dark`: `font` (display, ui), `radius` (sm, md, lg), `shadow` (1, 2) y `motion` (fast, move, enter, ease-out, ease-spring, más los que propongas). Cada par de texto y control con su contraste calculado en `docs/identity.md`.

### 3. Fuentes — `public/fonts/`

Fraunces y Atkinson Hyperlegible Next en WOFF2, **subconjunto latino** (con á é í ó ú ñ ü ¿ ¡), solo los pesos necesarios (o variables si pesan menos), más el archivo de licencia OFL de cada una. Descárgalas de su fuente oficial. Reporta el peso de cada archivo; meta: ≤ 120 KB entre todas.

### 4. Piezas de ajedrez — `public/assets/chess/pieces/{w,b}{k,q,r,b,n,p}.svg` (12 archivos)

Requisitos de forma:

- **Piezas de madera torneada de verdad:** perfil de torno con anillos, cuello y base escalonada. Que se lea "madera" por la silueta y por un tratamiento sobrio (veta insinuada, luz lateral con degradado o facetas), no por una textura raster.
- **Cada tipo con una cabeza inconfundible:** el rey con cruz, la dama con corona de varias puntas, el alfil con mitra y corte diagonal, la torre con almenas, el peón con cabeza esférica y **el caballo con una cabeza de caballo clara** (hocico, oreja, crin). En T-001 el caballo era lo más débil.
- **Bandos por luminosidad, no por tono:** el claro es marfil o arce y el oscuro es nogal o ébano. Se distinguen en escala de grises y para personas con daltonismo.
- **Legibles a 36 px y a 64 px**, sobre `sq-light` y sobre `sq-dark`, en modo claro y oscuro. Contorno o filete que separe la pieza de ambas casillas.

Requisitos técnicos: `viewBox="0 0 100 100"`, fondo transparente, pieza centrada horizontalmente y apoyada en y≈92, ocupando ~80 % del alto (el peón, menos). **≤ 6 KB por archivo**, sin `<text>`, sin imágenes incrustadas y sin dependencias externas. Ids internos únicos por archivo (por ejemplo, prefijo `wk-`), porque las 12 piezas conviven en la misma página.

### 5. Logo — `public/assets/brand/logo.svg` y `logo-mark.svg`

- `logo-mark`: la marca sola. La app la muestra a 52 px junto al título.
- `logo`: marca con el nombre "Juegoteca" convertido en trazos, sin depender de fuentes.

### 6. Iconos de juegos — `public/assets/games/{chess,checkers,backgammon,sudoku}.svg`

Se muestran a 56 px dentro de un recuadro de 56 px en las tarjetas del menú (damas, backgammon y sudoku aparecen como "Próximamente"). La misma familia que las piezas. ≤ 4 KB cada uno.

### 7. Iconos de la PWA — `public/icons/`

Reemplaza los provisionales de Claude: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (contenido dentro del 80 % central), `apple-touch-icon.png` (180, sin transparencia) y `favicon.svg`. Además, `design/brand.json` con el color de tema (`theme_color`) y de fondo (`background_color`) que Claude pondrá en el manifiesto.

### 8. Imagen de ambiente

- `design/direcciones/D1-taller-de-fieltro/mood.webp`: la referencia de atmósfera (R-04 de T-001), ≤ 150 KB, sin texto.
- **Opcional, si aporta:** una ilustración para la portada de la app (`public/assets/brand/hero-480.webp` y `hero-960.webp`, ≤ 80 KB y ≤ 150 KB), sin texto. Por ejemplo, una mesa de taller con una caja de juegos abierta vista desde arriba. Si concluyes que la portada queda mejor sin ilustración, dilo y no la hagas.

### 9. Registro

Una entrada en `design/asset-manifest.json` por cada archivo nuevo: id, ruta, propósito, herramienta, prompt si aplica, fecha, dimensiones y peso en bytes.

## Entregables

- `docs/identity.md`, `design/tokens.json`, `design/brand.json`
- `public/fonts/**`
- `public/assets/chess/pieces/*.svg` (12)
- `public/assets/brand/logo.svg`, `logo-mark.svg` (y `hero-*.webp` si los haces)
- `public/assets/games/*.svg` (4)
- `public/icons/*` (5)
- `design/direcciones/D1-taller-de-fieltro/mood.webp`
- `design/asset-manifest.json` actualizado

## Criterios de aceptación

- [ ] Las 12 piezas comparten una sola familia "madera torneada" que no se confunde con la muestra plana de T-001.
- [ ] Los bandos se distinguen en escala de grises.
- [ ] El caballo se reconoce como caballo a 36 px.
- [ ] Cada SVG de pieza pesa ≤ 6 KB y no tiene `<text>`, imágenes incrustadas ni ids repetidos entre archivos.
- [ ] `design/tokens.json` tiene exactamente las claves pedidas en `light` y `dark`, y sus contrastes están en `docs/identity.md` (texto ≥ 4.5:1, controles ≥ 3:1).
- [ ] Las fuentes tienen el subconjunto latino, licencia y pesos reportados.
- [ ] El icono maskable respeta la zona segura y el apple-touch no tiene transparencia.
- [ ] Ningún activo copia un set, marca o estilo reconocible de otro producto.
- [ ] Toda verificación que no puedas hacer queda declarada en la Entrega. Claude verificará en la app real a 36/64 px y a 360 px de ancho.

## Archivos permitidos

- `docs/identity.md` (nuevo)
- `design/**`
- `public/assets/**`, `public/fonts/**`, `public/icons/**` (puedes reemplazar los provisionales)
- Sección Entrega y campo Estado de este ticket

No edites `src/`, `index.html`, `vite.config.ts`, `package.json` ni `ESTADO.md`.

## Fuera de alcance

- Fichas de damas y backgammon y estilo del sudoku (ticket propio cuando existan esos juegos).
- Implementar en código: Claude integra tokens, fuentes y texturas en `src/`.
- Sonidos.

---

## Entrega

- **Qué hice:** Produje la identidad final de **Taller de fieltro**: guía, tokens claro/oscuro, marca, iconos, fuentes locales, imagen de ambiente y el set completo de 12 piezas. Las piezas son perfiles de madera torneada: base escalonada, anillos, cuello, veta vectorial sutil y cabezas inequívocas. El caballo incorpora oreja, hocico y crin; los bandos son arce marfil y nogal, separados sobre todo por luminosidad y por filete inverso. La imagen de ambiente solicitada en R-04 queda guardada como WebP; no hice `hero-*` porque esta primera pantalla funciona mejor rápida y despejada, sin una ilustración que compita con el acceso a partida.
- **Archivos:** `docs/identity.md`; `design/tokens.json`; `design/brand.json`; `design/asset-manifest.json`; `design/direcciones/D1-taller-de-fieltro/mood.webp`; fuentes y licencias en `public/fonts/`; 12 SVG en `public/assets/chess/pieces/`; logo y marca en `public/assets/brand/`; cuatro iconos en `public/assets/games/`; cinco iconos PWA en `public/icons/`. Se incluyen `design/generate-taller-assets.mjs`, `design/render-pwa-icons.ps1` y `design/process-mood.py` como fuentes reproducibles de los activos vectoriales/raster.
- **Cómo lo verifiqué (pesos, legibilidad a 36/64 px, escala de grises, contrastes):** Verifiqué que los 12 SVG usan `viewBox="0 0 100 100"`, no contienen `<text>` ni `<image>`, tienen 12 ids internos únicos y pesan **1,007–1,095 bytes** (límite: 6 KB). El arce `#FFF3D6` y el nogal `#4B2D1D` tienen luminancias suficientemente separadas y filetes inversos, por lo que su diferenciación no depende del tono. `tokens.json` tiene exactamente las 20 claves requeridas en cada modo; los contrastes recalculados están en `docs/identity.md` (texto 5.8:1–15.5:1; controles 4.9:1–7.5:1). Las fuentes cubren á, é, í, ó, ú, ñ, ü, ¿ e ¡ y pesan juntas **48,944 bytes** (<120 KB). `mood.webp` mide 960 × 960 y 104,998 bytes. Los PNG son 192, 512, 512 maskable y 180 px; el maskable deja 14 % de margen por lado (arte en 72 % central) y `apple-touch-icon.png` se confirmó RGB, sin canal alfa. La verificación visual definitiva de siluetas a **36/64 px sobre las casillas reales y en la app a 360 px** queda para Claude: este entorno no dispone de rasterizador SVG ni acceso permitido a los archivos locales en el navegador; no afirmo esa prueba como hecha.
- **Herramientas/modelos usados (tal como los reporta el entorno):** `image_gen` para la atmósfera original sin texto; Pillow 3.14 para convertirla/optimizarla a WebP; PowerShell 7 + `System.Drawing` para los iconos PWA; Node.js 24 para escribir los SVG; `fontTools varLib.instancer` + `fontTools subset` para los WOFF2. Fuentes y licencias descargadas desde los repositorios oficiales de Fraunces y Atkinson Hyperlegible Next; la procedencia y el prompt de la imagen están en `design/asset-manifest.json`.
- **Limitaciones o bloqueos:** Pendiente únicamente la revisión cruzada en la app real a 36/64 px y 360 px de ancho. No se produjo ilustración `hero-*` de forma deliberada; tampoco se incorporaron fichas de damas/backgammon ni el estilo de sudoku, que están fuera de alcance.
- **Preguntas abiertas:** Ninguna para integrar: Claude puede copiar los tokens y declarar las fuentes en CSS. Si Daniel desea arte de portada tras probar el inicio real, puedo derivar `hero-480.webp` y `hero-960.webp` de la dirección aprobada en un ticket breve.

## Revisión

**Claude Code · 2026-11-08 · Veredicto: aceptado e integrado en la app. Queda un pulido opcional de piezas (T2-01) que decide Daniel al verlas en su teléfono.**

- **Verificado en la app real:**
  - Las 12 piezas se ven a 36 px y a 64 px sobre ambas casillas, en modo claro y oscuro, y en escala de grises: los bandos se separan por luminosidad y el caballo se reconoce.
  - Tablero, menú y barras de jugador a 375 px en claro y oscuro.
  - Fuentes servidas con el prefijo `/juegoteca/` en el build.
  - Las 12 piezas, las fuentes y los iconos quedan en la caché offline (54 entradas).
  - Pesos: piezas de 1.0–1.1 KB y fuentes de 48 KB en total.
- **Aciertos:** la familia de madera torneada es clara frente a T-001; la decisión de no hacer `hero` está justificada; los scripts reproducibles quedan en `design/`.
- **Integración (Claude):**
  - `src/styles/tokens.css` con modo claro por omisión y oscuro según el sistema; `@font-face` locales.
  - Movimiento según `docs/identity.md`: 180 ms al mover, captura que baja 3 px y encoge, jaque con dos pulsos y entrada escalonada de 45 ms.
  - Marco de fieltro verde en el tablero; manifiesto con `design/brand.json`.
  - Barra de estado de iOS en `default`, porque la de texto blanco no se leía en fondo claro.
  - Fraunces solo trae peso 600, así que la app ya no pide 800/900 (evita negritas sintéticas).

- [T2-01] Severidad: media
  Ubicación: `public/assets/chess/pieces/*.svg`
  Evidencia: todas las piezas tienen casi la misma altura (el rey no sobresale del peón) y la base de tres niveles ocupa cerca del 40 % del alto. La identidad de cada pieza recae en una cabeza pequeña.
  Consecuencia: a 36 px se distinguen, pero cuesta más que con una jerarquía de alturas, que es la pista que usa un jugador al mirar el tablero.
  Corrección: escalonar alturas (rey > dama > alfil > caballo > torre > peón), base de dos niveles más baja y cabezas más grandes.

- [T2-02] Severidad: baja
  Ubicación: `design/tokens.json`
  Evidencia: en `light`, `p0` es verde oscuro y `p1` marfil; en `dark` es al revés. `p0` es el asiento 0 (blancas).
  Consecuencia: el avatar de las blancas saldría verde oscuro en modo claro.
  Corrección: Claude ya lo normalizó en `tokens.css` (`p0` = bando claro); conviene corregir `tokens.json` para que la fuente coincida.

- [T2-03] Severidad: baja (gusto, decide Daniel)
  Ubicación: `logo-mark.svg` e iconos de la PWA
  Evidencia: la cruz central sobre cuatro casillas puede leerse como un botón "+" (agregar).
  Consecuencia: la marca es menos propia de lo que podría ser.
  Corrección: solo si Daniel lo pide.
