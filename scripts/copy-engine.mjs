// Copia el motor Stockfish (versión lite, un solo hilo) a public/engine/.
// No se guarda en git: se copia desde node_modules en cada dev/build.
// Licencia del motor: GPL-3 (se copia también su texto).
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'

const SRC = 'node_modules/stockfish'
const OUT = 'public/engine'
const FILES = [
  ['bin/stockfish-19-lite-single.js', 'stockfish.js'],
  ['bin/stockfish-19-lite-single.wasm', 'stockfish.wasm'],
  ['Copying.txt', 'COPYING.txt'],
]

if (!existsSync(SRC)) {
  console.error('Falta node_modules/stockfish: ejecuta npm install')
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })
for (const [from, to] of FILES) copyFileSync(`${SRC}/${from}`, `${OUT}/${to}`)
console.log('Motor copiado a public/engine/')
