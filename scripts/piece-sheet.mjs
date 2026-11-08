// Hoja de contacto de piezas, renderizada a tamaño real (36 y 64 px).
// Sirve para que Codex y Claude verifiquen la legibilidad sin navegador.
//
//   npm run pieces:sheet                 → ajedrez     → design/review/pieces-sheet.png
//   npm run pieces:sheet -- checkers     → damas       → design/review/checkers-sheet.png
//   npm run pieces:sheet -- backgammon   → backgammon  → design/review/backgammon-sheet.png
//
// Filas: modo claro, modo oscuro y modo claro en escala de grises. Cada pieza se
// dibuja sobre casilla clara (arriba) y oscura (abajo), al 92 % de la casilla.
//
// Acepta piezas SVG o raster: resvg no decodifica WebP, así que para los WebP se
// usan los masters PNG de Codex (design/masters/<set>/), de los que salen.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const SETS = {
  chess: {
    dir: 'public/assets/chess/pieces',
    masters: 'design/masters/pieces',
    names: ['wk', 'wq', 'wr', 'wb', 'wn', 'wp', 'bk', 'bq', 'br', 'bb', 'bn', 'bp'],
    out: 'pieces-sheet.png',
  },
  checkers: {
    dir: 'public/assets/checkers',
    masters: 'design/masters/checkers',
    names: ['wman', 'wking', 'bman', 'bking'],
    out: 'checkers-sheet.png',
  },
  backgammon: {
    dir: 'public/assets/backgammon',
    masters: 'design/masters/backgammon',
    names: ['w-checker', 'b-checker', 'dice-1', 'dice-2', 'dice-3', 'dice-4', 'dice-5', 'dice-6'],
    out: 'backgammon-sheet.png',
  },
}

const setName = process.argv[2] ?? 'chess'
const SET = SETS[setName]
if (!SET) {
  console.error(`Juego desconocido: ${setName}. Usa: ${Object.keys(SETS).join(', ')}`)
  process.exit(1)
}

const THEMES = [
  { name: 'claro', bg: '#F5F0E5', light: '#E9D9BB', dark: '#967253', ink: '#1F2A22', gray: false },
  { name: 'oscuro', bg: '#18221B', light: '#B99470', dark: '#5D432E', ink: '#FFF8E7', gray: false },
  { name: 'claro · grises', bg: '#F5F0E5', light: '#E9D9BB', dark: '#967253', ink: '#1F2A22', gray: true },
]
const SIZES = [36, 64]
const PAD = 16
const LABEL_W = 120
const GAP = 24
const FILL = 0.92

const first = SET.names[0]
const RASTER = existsSync(`${SET.dir}/${first}.webp`)
if (!RASTER && !existsSync(`${SET.dir}/${first}.svg`)) {
  console.error(`No hay piezas en ${SET.dir}/ (${first}.webp o ${first}.svg)`)
  process.exit(1)
}
if (RASTER && !existsSync(`${SET.masters}/${first}.png`)) {
  console.error(`Hay piezas WebP pero faltan los masters PNG en ${SET.masters}/`)
  process.exit(1)
}
const FORMAT = RASTER ? 'png (masters del webp)' : 'svg'
const uri = (name) => {
  const file = RASTER ? `${SET.masters}/${name}.png` : `${SET.dir}/${name}.svg`
  const mime = RASTER ? 'image/png' : 'image/svg+xml'
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`
}

const N = SET.names.length
const rowWidth = SIZES.reduce((w, s) => w + s * N + GAP, 0)
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
    SET.names.forEach((name, i) => {
      ;[0, 1].forEach((row) => {
        const cx = x + i * s
        const cy = y0 + row * s
        const inset = (s * (1 - FILL)) / 2
        g += `<rect x="${cx}" y="${cy}" width="${s}" height="${s}" fill="${(i + row) % 2 ? t.dark : t.light}"/>`
        g += `<image x="${cx + inset}" y="${cy + inset}" width="${s * FILL}" height="${s * FILL}" href="${uri(name)}"/>`
      })
    })
    x += s * N + GAP
  }
  body += t.gray ? `<g filter="url(#gray)">${g}</g>` : g
})

const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><filter id="gray"><feColorMatrix type="saturate" values="0"/></filter></defs>
<rect width="100%" height="100%" fill="#777"/>${body}</svg>`

mkdirSync('design/review', { recursive: true })
const png = new Resvg(sheet, { fitTo: { mode: 'original' }, font: { loadSystemFonts: true } }).render().asPng()
writeFileSync(`design/review/${SET.out}`, png)
console.log(`design/review/${SET.out} (${setName}, ${FORMAT}, ${width}×${height}, ${png.length} bytes)`)
