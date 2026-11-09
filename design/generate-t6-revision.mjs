/** Genera iconos y láminas de propuesta de la revisión T-006. */
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const root = path.resolve(import.meta.dirname, '..')
const ui = path.join(root, 'public/assets/ui')
const out = path.join(root, 'design/revision/T-006')
const app = path.join(root, 'design/review/app')
fs.mkdirSync(ui, { recursive: true })
fs.mkdirSync(out, { recursive: true })

const body = {
  back: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  undo: '<path d="m9 7-5 5 5 5M5 12h9a5 5 0 0 1 0 10h-2"/>',
  restart: '<path d="M19 8V4l-3.1 3.1A8 8 0 1 0 20 12"/>',
  hint: '<path d="M9 18h6M10 21h4M8.2 14.6A6 6 0 1 1 16 14.6c-.8.8-1 1.7-1 2.4h-6c0-.7-.2-1.6-.8-2.4Z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" stroke-width="3"/>',
  erase: '<path d="m15 4 5 5-9 9H6l-2-2 11-12Z"/><path d="m4 16 2 2M13 20h7"/>',
  notes: '<path d="M5 4h10l4 4v12H5zM15 4v5h4M8 15h8M8 18h5"/><path d="m8 12 5-5 2 2-5 5-3 1z"/>',
  'auto-notes': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  prev: '<path d="M6 5v14M18 6l-8 6 8 6z"/>',
  next: '<path d="M18 5v14M6 6l8 6-8 6z"/>',
  streak: '<path d="M13 3c1 4-2 5-2 8 0 1.5 1 2.5 2.5 2.5S16 12.3 16 10c3 2 4 4.3 4 6.8A8 8 0 1 1 5.4 12c1.5.2 3-.6 3.6-2.5.5-1.8.2-4 4-6.5Z"/>',
  join: '<path d="M9 8 7 6a3 3 0 0 0-4.2 4.2l3 3A3 3 0 0 0 10 13l1-1M15 16l2 2a3 3 0 0 0 4.2-4.2l-3-3A3 3 0 0 0 14 11l-1 1M8 16l8-8"/>',
  check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
  warning: '<path d="M12 4 21 20H3zM12 9v4M12 17h.01"/>',
  flag: '<path d="M5 21V4M5 5c4-3 7 3 14 0v9c-7 3-10-3-14 0"/>',
  share: '<path d="M15 5a3 3 0 1 0 0-2 3 3 0 0 0 0 2ZM6 14a3 3 0 1 0 0-2 3 3 0 0 0 0 2ZM15 23a3 3 0 1 0 0-2 3 3 0 0 0 0 2Z"/><path d="m8.6 12.9 3.8-2.1m0 4.3-3.8-2.1"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
}
const icon = (inner, size = 24) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
for (const [name, inner] of Object.entries(body)) fs.writeFileSync(path.join(ui, `${name}.svg`), icon(inner) + '\n')

const png = (svg, target) => fs.writeFileSync(target, new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: true } }).render().asPng())
const esc = value => value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const data = file => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`
const iconNodes = (color, y) => Object.keys(body).map((name, index) => {
  const x = 45 + (index % 5) * 176; const row = Math.floor(index / 5)
  return `<g transform="translate(${x} ${y + row * 110})" color="${color}"><g transform="translate(0 2)">${icon(body[name], 20)}</g><g transform="translate(38 0)">${icon(body[name], 24)}</g><text x="0" y="58" font-family="Atkinson Hyperlegible, sans-serif" font-size="14" fill="${color}">${esc(name)}</text><text x="0" y="79" font-family="Atkinson Hyperlegible, sans-serif" font-size="11" fill="${color}" opacity=".72">20 px · 24 px</text></g>`
}).join('')
png(`<svg xmlns="http://www.w3.org/2000/svg" width="940" height="1040"><rect width="940" height="520" fill="#fffdf6"/><rect y="520" width="940" height="520" fill="#18221b"/><text x="40" y="42" font-family="Fraunces,serif" font-size="25" fill="#1f2a22">Iconos de interfaz · Taller de fieltro</text><text x="40" y="562" font-family="Fraunces,serif" font-size="25" fill="#fff8e7">Misma familia en modo oscuro</text>${iconNodes('#2e6b52', 76)}${iconNodes('#d8eadb', 596)}</svg>`, path.join(out, 'iconos.png'))

function compare(name, input, width, height, overlay) {
  const encoded = data(path.join(app, input)); const gap = 30; const label = 38
  const afterX = width + gap
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2 + gap}" height="${height + label}"><rect width="100%" height="100%" fill="#d9d3c6"/><text x="10" y="25" font-family="Atkinson Hyperlegible,sans-serif" font-size="16" font-weight="700" fill="#29352c">ACTUAL</text><text x="${afterX + 10}" y="25" font-family="Atkinson Hyperlegible,sans-serif" font-size="16" font-weight="700" fill="#29352c">PROPUESTA</text><image href="${encoded}" x="0" y="${label}" width="${width}" height="${height}"/><image href="${encoded}" x="${afterX}" y="${label}" width="${width}" height="${height}"/>${overlay(afterX, label)}</svg>`
  png(svg, path.join(out, `${name}.png`))
}
compare('inicio-ritmo', 'inicio--movil-claro.png', 375, 812, (x, y) => `<g><rect x="${x + 20}" y="${y + 628}" width="335" height="84" rx="16" fill="#e5eee4" stroke="#c8dac9"/><circle cx="${x + 49}" cy="${y + 658}" r="14" fill="#2e6b52"/><path d="M${x + 43} ${y + 658}h12M${x + 49} ${y + 652}v12" stroke="#fff8e7" stroke-width="2" stroke-linecap="round"/><text x="${x + 74}" y="${y + 657}" font-family="Fraunces,serif" font-size="18" fill="#1f2a22">Mesa de hoy</text><text x="${x + 74}" y="${y + 680}" font-family="Atkinson Hyperlegible,sans-serif" font-size="13" fill="#526056">Elige un juego y empieza una partida</text></g>`)
compare('backgammon-panel', 'backgammon-partida--tablet-claro.png', 590, 410, (x, y) => `<g transform="translate(${x} ${y})"><rect x="360" y="132" width="205" height="182" rx="14" fill="#fffdf6" stroke="#d7c9ae"/><text x="382" y="162" font-family="Fraunces,serif" font-size="20" fill="#1f2a22">Tu jugada</text><text x="382" y="187" font-family="Atkinson Hyperlegible,sans-serif" font-size="12" fill="#526056">Tira los dados para comenzar</text><rect x="382" y="208" width="65" height="65" rx="12" fill="#f4e8cc" stroke="#b78d58"/><circle cx="403" cy="229" r="4" fill="#513725"/><circle cx="427" cy="253" r="4" fill="#513725"/><rect x="459" y="225" width="84" height="38" rx="10" fill="#2e6b52"/><text x="476" y="249" font-family="Atkinson Hyperlegible,sans-serif" font-size="13" font-weight="700" fill="#fff8e7">Tirar</text><path d="M382 291h160" stroke="#ded5c5"/><text x="382" y="305" font-family="Atkinson Hyperlegible,sans-serif" font-size="11" fill="#526056">Movimientos posibles aparecerán aquí</text></g>`)
compare('sudoku-acciones', 'sudoku-partida--movil-claro.png', 375, 812, (x, y) => `<g transform="translate(${x} ${y})"><rect x="18" y="462" width="339" height="70" rx="14" fill="#fffdf6" stroke="#d7c9ae"/>${[['↶','Deshacer'],['⌫','Borrar'],['✎','Notas'],['▦','Auto'],['?','Pista']].map((p,i)=>`<g transform="translate(${30+i*66} 472)"><circle cx="22" cy="20" r="18" fill="${i===4?'#f8e5a3':'#e8f0e7'}"/><text x="22" y="27" text-anchor="middle" font-family="Atkinson Hyperlegible,sans-serif" font-size="21" font-weight="700" fill="#2e6b52">${p[0]}</text><text x="22" y="55" text-anchor="middle" font-family="Atkinson Hyperlegible,sans-serif" font-size="10" fill="#526056">${p[1]}</text></g>`).join('')}</g>`)

function logo(name, mark, detail) {
  const samples = [[70, 76, 48], [250, 104, 180]]
  const sample = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 100})">${mark}</g>${s === 48 ? `<text x="${x + 61}" y="${y + 30}" font-family="Fraunces,serif" font-size="22" font-weight="650" fill="#fff8e7">Juegoteca</text>` : ''}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="360"><rect width="560" height="360" fill="#18221b"/><text x="28" y="34" font-family="Atkinson Hyperlegible,sans-serif" font-size="14" font-weight="700" fill="#d8eadb">PROPUESTA · ${detail}</text>${sample(...samples[0])}${sample(...samples[1])}<rect x="28" y="240" width="92" height="92" rx="22" fill="#2e6b52"/><g transform="translate(42 254) scale(.56)">${mark}</g><text x="142" y="293" font-family="Atkinson Hyperlegible,sans-serif" font-size="13" fill="#d8eadb">48 px · 180 px · icono de app</text></svg>`
  png(svg, path.join(out, name))
}
logo('logo-ribete.png', '<rect x="5" y="5" width="100" height="100" rx="24" fill="#2e6b52"/><path d="M23 71 55 26l32 45H23Z" fill="none" stroke="#fff8e7" stroke-width="8" stroke-linejoin="round"/><circle cx="55" cy="63" r="9" fill="#e47762"/>', 'la caja enmarca la mesa; evita la lectura de +')
logo('logo-ficha.png', '<circle cx="55" cy="55" r="48" fill="#2e6b52"/><circle cx="55" cy="55" r="30" fill="none" stroke="#fff8e7" stroke-width="7"/><path d="M39 55h32M55 39v32" stroke="#e47762" stroke-width="7" stroke-linecap="round"/>', 'ficha torneada y unión: señal más legible a tamaño mínimo')

const manifestPath = path.join(root, 'design/asset-manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const ids = new Set(Object.keys(body).map(name => `ui-${name}`))
manifest.assets = manifest.assets.filter(asset => !ids.has(asset.id))
for (const name of Object.keys(body)) {
  const file = path.join(ui, `${name}.svg`)
  manifest.assets.push({ id: `ui-${name}`, path: `public/assets/ui/${name}.svg`, purpose: `Icono de interfaz ${name} de Taller de fieltro`, tool: 'SVG escrito por Codex', prompt: null, date: '2026-11-08', dimensions: '24x24; currentColor; trazo 2 px', bytes: fs.statSync(file).size })
}
manifest.generatedAt = '2026-11-08'
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
