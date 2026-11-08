// Hoja de contacto de las piezas de ajedrez, renderizada a tamaño real.
// Sirve para que Codex y Claude verifiquen la legibilidad sin navegador.
//
//   npm run pieces:sheet            → design/review/pieces-sheet.png
//
// Filas: modo claro, modo oscuro y modo claro en escala de grises.
// En cada fila: las 6 piezas blancas y las 6 negras a 36 px y a 64 px,
// alternando casilla clara y oscura (como en un tablero real).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const PIECES = ['k', 'q', 'r', 'b', 'n', 'p']
const THEMES = [
  { name: 'claro', bg: '#F5F0E5', light: '#E9D9BB', dark: '#967253', ink: '#1F2A22', gray: false },
  { name: 'oscuro', bg: '#18221B', light: '#B99470', dark: '#5D432E', ink: '#FFF8E7', gray: false },
  { name: 'claro · grises', bg: '#F5F0E5', light: '#E9D9BB', dark: '#967253', ink: '#1F2A22', gray: true },
]
const SIZES = [36, 64]
const PAD = 16
const LABEL_W = 120
const GAP = 24
const FILL = 0.92 // la app dibuja la pieza al 92 % de la casilla

// Acepta el juego en SVG o como render raster, igual que la app.
// resvg no decodifica WebP: para el render se usan los masters PNG de Codex
// (design/masters/pieces/*.png), de los que sale el WebP que sirve la app.
const DIR = 'public/assets/chess/pieces'
const MASTERS = 'design/masters/pieces'
const RASTER = existsSync(`${DIR}/wk.webp`)
if (RASTER && !existsSync(`${MASTERS}/wk.png`)) {
  console.error(`Hay piezas WebP pero faltan los masters PNG en ${MASTERS}/`)
  process.exit(1)
}
const FORMAT = RASTER ? 'png (masters del webp)' : 'svg'
const uri = (color, type) => {
  const file = RASTER ? `${MASTERS}/${color}${type}.png` : `${DIR}/${color}${type}.svg`
  const mime = RASTER ? 'image/png' : 'image/svg+xml'
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`
}

// Ancho: etiqueta + por cada tamaño 12 casillas (6 blancas + 6 negras) + separación
const rowWidth = SIZES.reduce((w, s) => w + s * 12 + GAP, 0)
const width = PAD * 2 + LABEL_W + rowWidth
const rowH = Math.max(...SIZES) * 2 + 12
const height = PAD * 2 + THEMES.length * (rowH + GAP)

let body = ''
THEMES.forEach((t, ti) => {
  const y0 = PAD + ti * (rowH + GAP)
  let g = `<rect x="0" y="${y0 - 8}" width="${width}" height="${rowH + 16}" fill="${t.bg}"/>`
  g += `<text x="${PAD}" y="${y0 + 24}" font-family="sans-serif" font-size="15" fill="${t.ink}">${t.name}</text>`
  let x = PAD + LABEL_W
  for (const s of SIZES) {
    ;['w', 'b'].forEach((color, ci) => {
      PIECES.forEach((type, i) => {
        // Cada pieza sobre casilla clara (fila 1) y oscura (fila 2)
        ;[t.light, t.dark].forEach((sq, row) => {
          const cx = x + (ci * 6 + i) * s
          const cy = y0 + row * s
          const inset = (s * (1 - FILL)) / 2
          g += `<rect x="${cx}" y="${cy}" width="${s}" height="${s}" fill="${(i + row) % 2 ? t.dark : t.light}"/>`
          g += `<image x="${cx + inset}" y="${cy + inset}" width="${s * FILL}" height="${s * FILL}" href="${uri(color, type)}"/>`
        })
      })
    })
    x += s * 12 + GAP
  }
  body += t.gray ? `<g filter="url(#gray)">${g}</g>` : g
})

const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>
<rect width="100%" height="100%" fill="#777"/>${body}</svg>`

mkdirSync('design/review', { recursive: true })
const png = new Resvg(sheet, { fitTo: { mode: 'original' }, font: { loadSystemFonts: true } }).render().asPng()
writeFileSync('design/review/pieces-sheet.png', png)
console.log(`design/review/pieces-sheet.png (${FORMAT}, ${width}×${height}, ${png.length} bytes)`)
