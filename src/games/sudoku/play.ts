import { ALL, PEERS, UNITS, UNITS_OF, bit, candidates, findSingle, parse, popcount, type Single } from './logic'

/*
 * Estado de una partida de sudoku. Funciones puras: cada acción devuelve un estado nuevo
 * (o null si no cambia nada) y guarda en `history` lo necesario para deshacer.
 */

/** [casilla, valor anterior, notas anteriores] */
type Change = [number, number, number]

export interface SudokuGame {
  level: number
  /** Fecha del reto del día (YYYY-MM-DD), si lo es. */
  daily?: string
  puzzle: string
  solution: string
  values: number[]
  /** Notas a lápiz: máscara de dígitos por casilla. */
  notes: number[]
  /** Tiempo jugado (ms); solo corre con la app a la vista. */
  elapsed: number
  errors: number
  hints: number
  history: Change[][]
  done: boolean
  /** Ya se anotó en las estadísticas. */
  recorded?: boolean
}

export function newGame(level: number, puzzle: string, solution: string, daily?: string): SudokuGame {
  return { level, daily, puzzle, solution, values: parse(puzzle), notes: new Array(81).fill(0), elapsed: 0, errors: 0, hints: 0, history: [], done: false }
}

export const isGiven = (g: SudokuGame, i: number) => g.puzzle[i] !== '0'
export const answer = (g: SudokuGame, i: number) => g.solution.charCodeAt(i) - 48
export const isWrong = (g: SudokuGame, i: number) => g.values[i] !== 0 && g.values[i] !== answer(g, i)
export const isSolved = (g: SudokuGame) => g.values.every((v, i) => v === answer(g, i))
/** Se puede escribir en la casilla: no es pista inicial ni tiene ya el número correcto. */
export const isEditable = (g: SudokuGame, i: number) => !g.done && !isGiven(g, i) && (g.values[i] === 0 || isWrong(g, i))

function commit(g: SudokuGame, values: number[], notes: number[], extra: Partial<SudokuGame> = {}): SudokuGame {
  const changes: Change[] = []
  for (let i = 0; i < 81; i++) if (values[i] !== g.values[i] || notes[i] !== g.notes[i]) changes.push([i, g.values[i], g.notes[i]])
  const next = { ...g, values, notes, history: [...g.history, changes], ...extra }
  next.done = isSolved(next)
  return next
}

/** Pone un número. Si ya estaba ese mismo número, lo quita. Borra esa nota en filas, columnas y bloque. */
export function placeDigit(g: SudokuGame, i: number, d: number): SudokuGame | null {
  if (!isEditable(g, i)) return null
  if (g.values[i] === d) return eraseCell(g, i)
  const values = g.values.slice()
  const notes = g.notes.slice()
  values[i] = d
  notes[i] = 0
  for (const p of PEERS[i]) notes[p] &= ~bit(d)
  return commit(g, values, notes, { errors: g.errors + (d !== answer(g, i) ? 1 : 0) })
}

export function toggleNote(g: SudokuGame, i: number, d: number): SudokuGame | null {
  if (!isEditable(g, i) || g.values[i]) return null
  const notes = g.notes.slice()
  notes[i] ^= bit(d)
  return commit(g, g.values, notes)
}

export function eraseCell(g: SudokuGame, i: number): SudokuGame | null {
  if (!isEditable(g, i) || (!g.values[i] && !g.notes[i])) return null
  const values = g.values.slice()
  const notes = g.notes.slice()
  values[i] = 0
  notes[i] = 0
  return commit(g, values, notes)
}

/** Llena las notas de todas las casillas vacías con los candidatos posibles (según los números correctos). */
export function fillNotes(g: SudokuGame): SudokuGame | null {
  if (g.done) return null
  const cand = candidates(g.values.map((v, i) => (isWrong(g, i) ? 0 : v)))
  const notes = g.notes.map((n, i) => (g.values[i] ? n : cand[i]))
  if (notes.every((n, i) => n === g.notes[i])) return null
  return commit(g, g.values, notes)
}

export function undo(g: SudokuGame): SudokuGame | null {
  if (g.done || g.history.length === 0) return null
  const last = g.history[g.history.length - 1]
  const values = g.values.slice()
  const notes = g.notes.slice()
  for (const [i, v, n] of last) {
    values[i] = v
    notes[i] = n
  }
  return { ...g, values, notes, history: g.history.slice(0, -1) }
}

/** Cuántas veces falta poner cada dígito (contando los que ya están, aunque estén mal). */
export function remainingByDigit(g: SudokuGame): number[] {
  const left = new Array(10).fill(9)
  for (const v of g.values) if (v) left[v]--
  return left
}

/** Unidades (filas, columnas, bloques) de la casilla que quedaron completas y correctas. */
export function completedUnits(g: SudokuGame, i: number): number[] {
  return UNITS_OF[i].filter((u) => UNITS[u].every((j) => g.values[j] === answer(g, j)))
}

/* ---------- Pistas ---------- */

export type Hint =
  | { kind: 'wrong'; cell: number }
  | { kind: 'single'; cell: number; digit: number; how: Single['kind'] }
  | { kind: 'reveal'; cell: number; digit: number }

/**
 * Pista que enseña: primero avisa de un error; si no hay, muestra un paso lógico ("único")
 * con su explicación; si el sudoku pide técnicas avanzadas, revela la casilla más restringida.
 */
export function findHint(g: SudokuGame, prefer?: number): Hint | null {
  if (g.done) return null
  const wrong = g.values.findIndex((_, i) => isWrong(g, i))
  if (wrong >= 0) return { kind: 'wrong', cell: wrong }
  const cand = candidates(g.values)
  const s = findSingle(g.values, cand)
  if (s) return { kind: 'single', cell: s.cell, digit: s.digit, how: s.kind }
  let cell = prefer != null && !g.values[prefer] ? prefer : -1
  if (cell < 0) {
    let best = 10
    for (let i = 0; i < 81; i++) {
      if (g.values[i]) continue
      const n = popcount(cand[i] & ALL)
      if (n < best) {
        best = n
        cell = i
      }
    }
  }
  return cell < 0 ? null : { kind: 'reveal', cell, digit: answer(g, cell) }
}

export function hintText(h: Hint): string {
  if (h.kind === 'wrong') return 'Este número no va aquí. Revisa su fila, su columna y su bloque.'
  if (h.kind === 'reveal') return `Aquí va el ${h.digit}. (Este sudoku pide técnicas avanzadas; te lo revelé).`
  switch (h.how) {
    case 'box':
      return `En este bloque, el ${h.digit} solo cabe en esta casilla.`
    case 'row':
      return `En esta fila, el ${h.digit} solo cabe en esta casilla.`
    case 'col':
      return `En esta columna, el ${h.digit} solo cabe en esta casilla.`
    default:
      return `A esta casilla solo le queda un número posible: el ${h.digit}.`
  }
}

/** Las casillas de la unidad que explica la pista (para iluminarlas). */
export function hintArea(h: Hint): number[] {
  if (h.kind !== 'single' || h.how === 'naked') return [h.cell]
  const u = UNITS_OF[h.cell][h.how === 'row' ? 0 : h.how === 'col' ? 1 : 2]
  return UNITS[u]
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const p = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${m}:${p(s % 60)}`
}
