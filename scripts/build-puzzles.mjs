// Selecciona los retos de ajedrez a partir de la base de problemas de Lichess (CC0).
//
//   node scripts/build-puzzles.mjs <ruta a lichess_db_puzzle.csv.zst (completo o parcial)>
//
// Fuente: https://database.lichess.org/#puzzles (licencia CC0: dominio público).
// Basta un tramo del archivo (p. ej. los primeros 25 MB): los problemas vienen en
// orden aleatorio de id, así que cualquier tramo trae todos los temas.
// Escribe src/games/chess/puzzles/puzzles.json.
import { createReadStream, openSync, readSync, closeSync, writeFileSync, mkdirSync } from 'node:fs'
import { createZstdDecompress } from 'node:zlib'
import { createInterface } from 'node:readline'

const input = process.argv[2]
if (!input) {
  console.error('Uso: node scripts/build-puzzles.mjs <archivo .csv.zst>')
  process.exit(1)
}

/** Categorías: tema de Lichess, rango de dificultad y cuántos retos. */
const CATEGORIES = [
  { id: 'mate1', name: 'Mate en 1', blurb: 'Una jugada y se acabó.', theme: 'mateIn1', min: 400, max: 1500, count: 100 },
  { id: 'mate2', name: 'Mate en 2', blurb: 'Prepara el golpe final.', theme: 'mateIn2', min: 700, max: 1900, count: 100 },
  { id: 'mate3', name: 'Mate en 3', blurb: 'Calcula una combinación completa.', theme: 'mateIn3', min: 1000, max: 2200, count: 80 },
  { id: 'hanging', name: 'Pieza colgada', blurb: 'Captura lo que quedó sin defensa.', theme: 'hangingPiece', min: 400, max: 1600, count: 70 },
  { id: 'fork', name: 'Horquilla', blurb: 'Ataca dos piezas a la vez.', theme: 'fork', min: 600, max: 1900, count: 80 },
  { id: 'pin', name: 'Clavada', blurb: 'Inmoviliza una pieza contra otra más valiosa.', theme: 'pin', min: 700, max: 2000, count: 70 },
  { id: 'skewer', name: 'Ensartada', blurb: 'Ataca una pieza para ganar la de atrás.', theme: 'skewer', min: 700, max: 2000, count: 50 },
  { id: 'discovered', name: 'Ataque descubierto', blurb: 'Mueve una pieza y destapa a otra.', theme: 'discoveredAttack', min: 800, max: 2100, count: 50 },
]

// Calidad: problemas bien valorados, con suficientes intentos y rating estable.
const MIN_POPULARITY = 80
const MIN_PLAYS = 300
const MAX_DEVIATION = 90
const MAX_MOVES = 8 // jugada inicial + hasta 7 de solución

// Los .zst de Lichess empiezan con un "skippable frame" que zlib no acepta: lo saltamos.
function dataOffset(path) {
  const fd = openSync(path, 'r')
  const head = Buffer.alloc(8)
  readSync(fd, head, 0, 8, 0)
  closeSync(fd)
  const magic = head.readUInt32LE(0)
  if ((magic & 0xfffffff0) === 0x184d2a50) return 8 + head.readUInt32LE(4)
  return 0
}

const pools = new Map(CATEGORIES.map((c) => [c.id, []]))
let read = 0

const zstd = createZstdDecompress()
const stream = createReadStream(input, { start: dataOffset(input) }).pipe(zstd)
const lines = createInterface({ input: stream, crlfDelay: Infinity })
// El formato "seekable" de Lichess intercala más skippable frames, y un archivo
// parcial termina a medias: en ambos casos paramos ahí y usamos lo ya leído.
let stopReason = ''
zstd.on('error', (e) => {
  stopReason = e.code || e.message
  lines.close()
})

{
  for await (const line of lines) {
    if (read++ === 0 || !line) continue // cabecera
    const f = line.split(',')
    if (f.length < 8) continue
    const [id, fen, moves, rating, deviation, popularity, plays, themes] = f
    const r = Number(rating)
    if (Number(popularity) < MIN_POPULARITY || Number(plays) < MIN_PLAYS || Number(deviation) > MAX_DEVIATION) continue
    const mv = moves.split(' ')
    if (mv.length < 2 || mv.length > MAX_MOVES) continue
    const t = themes.split(' ')
    for (const c of CATEGORIES) {
      if (t.includes(c.theme) && r >= c.min && r <= c.max) pools.get(c.id).push([id, fen, moves, r])
    }
  }
}

/** Toma `count` problemas repartidos de forma pareja entre el más fácil y el más difícil. */
function spread(pool, count) {
  const sorted = [...pool].sort((a, b) => a[3] - b[3])
  if (sorted.length <= count) return sorted
  const out = []
  for (let i = 0; i < count; i++) out.push(sorted[Math.round((i * (sorted.length - 1)) / (count - 1))])
  return out
}

const used = new Set()
const categories = CATEGORIES.map((c) => {
  // Evita repetir el mismo problema en dos categorías.
  const pool = pools.get(c.id).filter((p) => !used.has(p[0]))
  const picked = spread(pool, c.count)
  picked.forEach((p) => used.add(p[0]))
  return { id: c.id, name: c.name, blurb: c.blurb, puzzles: picked }
})

const out = {
  source: 'Lichess puzzle database — https://database.lichess.org/#puzzles',
  license: 'CC0-1.0',
  generated: new Date().toISOString().slice(0, 10),
  format: '[id, fen, moves (UCI; la primera es la jugada del rival), rating]',
  categories,
}

mkdirSync('src/games/chess/puzzles', { recursive: true })
writeFileSync('src/games/chess/puzzles/puzzles.json', JSON.stringify(out))
console.log(`Leídas ${read.toLocaleString('es')} líneas${stopReason ? ` (lectura detenida: ${stopReason})` : ''}.`)
for (const c of categories) {
  const r = c.puzzles.map((p) => p[3])
  console.log(`${c.name.padEnd(20)} ${String(c.puzzles.length).padStart(3)} de ${pools.get(c.id).length} · rating ${Math.min(...r)}–${Math.max(...r)}`)
}
