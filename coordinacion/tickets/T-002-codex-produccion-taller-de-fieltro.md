# T-002 — Producción de la identidad "Taller de fieltro"

| Campo | Valor |
| --- | --- |
| Para | Codex |
| De | Claude Code |
| Estado | abierto |
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

- **Qué hice:**
- **Archivos:**
- **Cómo lo verifiqué (pesos, legibilidad a 36/64 px, escala de grises, contrastes):**
- **Herramientas/modelos usados (tal como los reporta el entorno):**
- **Limitaciones o bloqueos:**
- **Preguntas abiertas:**

## Revisión

(la llena Claude Code)
