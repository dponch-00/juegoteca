import type { Outcome, Seat } from '../../core/types'

/*
 * Damas clásicas latinas (8×8):
 * - Se juega en las casillas oscuras (a1 es oscura). Empiezan las blancas, abajo.
 * - Peón: avanza una casilla en diagonal y captura SOLO hacia adelante, saltando
 *   una pieza contraria pegada a una casilla vacía.
 * - Dama: se desliza cualquier número de casillas en diagonal (dama "voladora"); captura
 *   a distancia y puede caer en cualquier casilla libre detrás de la pieza capturada.
 * - Capturar es obligatorio y hay que tomar el MÁXIMO número de piezas posible.
 * - En una captura múltiple no se puede saltar dos veces la misma pieza; las piezas
 *   capturadas se retiran al terminar la jugada.
 * - Un peón que termina su jugada en la última fila corona (se vuelve dama).
 * - Pierde quien no tiene piezas o no puede mover. Tablas: 30 jugadas seguidas
 *   (60 medias jugadas) solo de damas sin capturas.
 */

export type Color = 'w' | 'b'
export interface Piece {
  color: Color
  king: boolean
}
/** Tablero 8×8 indexado por casilla 0..63 (0 = a1, 7 = h1, 63 = h8). */
export type Board = (Piece | null)[]

/** Una jugada es la lista de casillas que recorre la pieza (inicio, aterrizajes…). */
export type CheckersMove = string // p. ej. "c3-d4" o "c3-e5-g7"

export interface CheckersState {
  moves: CheckersMove[]
}

export interface Step {
  path: number[]
  captured: number[]
}

const DRAW_PLIES = 60

/* ---------- Casillas ---------- */

export const sqName = (i: number) => 'abcdefgh'[i % 8] + (Math.floor(i / 8) + 1)
export const sqIndex = (s: string) => 'abcdefgh'.indexOf(s[0]) + (Number(s[1]) - 1) * 8
const file = (i: number) => i % 8
const rank = (i: number) => Math.floor(i / 8)
const onBoard = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8
export const isDark = (i: number) => (file(i) + rank(i)) % 2 === 0

export function moveToString(path: number[]): CheckersMove {
  return path.map(sqName).join('-')
}

/* ---------- Posición inicial ---------- */

export function initialBoard(): Board {
  const b: Board = Array(64).fill(null)
  for (let i = 0; i < 64; i++) {
    if (!isDark(i)) continue
    if (rank(i) <= 2) b[i] = { color: 'w', king: false }
    else if (rank(i) >= 5) b[i] = { color: 'b', king: false }
  }
  return b
}

export const initialState = (): CheckersState => ({ moves: [] })

/* ---------- Generación de jugadas ---------- */

const DIRS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const

const forward = (c: Color) => (c === 'w' ? 1 : -1)

/** Todas las capturas posibles desde `from` (secuencias completas, sin cortar). */
function captureSequences(board: Board, from: number): Step[] {
  const piece = board[from]!
  const out: Step[] = []

  const explore = (pos: number, path: number[], captured: number[]) => {
    let extended = false
    for (const [df, dr] of DIRS) {
      if (!piece.king && dr !== forward(piece.color)) continue // el peón captura solo hacia adelante
      let f = file(pos) + df
      let r = rank(pos) + dr
      if (piece.king) {
        // Avanza por casillas vacías hasta encontrar una pieza.
        while (onBoard(f, r) && isEmpty(board, f + r * 8, from)) {
          f += df
          r += dr
        }
      }
      if (!onBoard(f, r)) continue
      const victim = f + r * 8
      const v = board[victim]
      if (!v || v.color === piece.color || captured.includes(victim)) continue
      // Casillas de aterrizaje detrás de la víctima.
      let lf = f + df
      let lr = r + dr
      while (onBoard(lf, lr) && isEmpty(board, lf + lr * 8, from)) {
        const land = lf + lr * 8
        extended = true
        explore(land, [...path, land], [...captured, victim])
        if (!piece.king) break // el peón solo cae justo detrás
        lf += df
        lr += dr
      }
    }
    if (!extended && captured.length > 0) out.push({ path, captured })
  }

  explore(from, [from], [])
  return out
}

/** Vacía, contando como vacía la casilla de salida (la pieza ya se levantó). */
function isEmpty(board: Board, i: number, from: number): boolean {
  return i === from || board[i] === null
}

function simpleMoves(board: Board, from: number): Step[] {
  const piece = board[from]!
  const out: Step[] = []
  for (const [df, dr] of DIRS) {
    if (!piece.king && dr !== forward(piece.color)) continue
    let f = file(from) + df
    let r = rank(from) + dr
    while (onBoard(f, r) && board[f + r * 8] === null) {
      out.push({ path: [from, f + r * 8], captured: [] })
      if (!piece.king) break
      f += df
      r += dr
    }
  }
  return out
}

/** Jugadas legales del bando `color`, aplicando captura obligatoria y ley de cantidad. */
export function legalSteps(board: Board, color: Color): Step[] {
  let captures: Step[] = []
  for (let i = 0; i < 64; i++) {
    if (board[i]?.color === color) captures.push(...captureSequences(board, i))
  }
  if (captures.length > 0) {
    const max = Math.max(...captures.map((c) => c.captured.length))
    captures = captures.filter((c) => c.captured.length === max)
    return captures
  }
  const out: Step[] = []
  for (let i = 0; i < 64; i++) {
    if (board[i]?.color === color) out.push(...simpleMoves(board, i))
  }
  return out
}

export function applyStep(board: Board, step: Step): Board {
  const b = board.slice()
  const from = step.path[0]
  const to = step.path[step.path.length - 1]
  const piece = b[from]!
  b[from] = null
  for (const c of step.captured) b[c] = null
  const promotes = !piece.king && rank(to) === (piece.color === 'w' ? 7 : 0)
  b[to] = { color: piece.color, king: piece.king || promotes }
  return b
}

/* ---------- Reproducir la partida (con memoria) ---------- */

export interface Position {
  board: Board
  turn: Color
  /** Medias jugadas seguidas solo de damas y sin capturas (para tablas). */
  quiet: number
  history: Step[]
}

let cached: { moves: string[]; pos: Position } | null = null

export function position(state: CheckersState): Position {
  const m = state.moves
  let start = 0
  let pos: Position = { board: initialBoard(), turn: 'w', quiet: 0, history: [] }
  if (cached && cached.moves.length <= m.length && cached.moves.every((x, i) => x === m[i])) {
    pos = cached.pos
    start = cached.moves.length
  }
  for (let i = start; i < m.length; i++) {
    const step = findStep(pos, m[i])
    if (!step) throw new Error(`Jugada inválida en la partida: ${m[i]}`)
    pos = advance(pos, step)
  }
  cached = { moves: m.slice(), pos }
  return pos
}

function advance(pos: Position, step: Step): Position {
  const moverWasKing = pos.board[step.path[0]]!.king
  const quiet = step.captured.length === 0 && moverWasKing ? pos.quiet + 1 : 0
  return {
    board: applyStep(pos.board, step),
    turn: pos.turn === 'w' ? 'b' : 'w',
    quiet,
    history: [...pos.history, step],
  }
}

function findStep(pos: Position, move: string): Step | null {
  return legalSteps(pos.board, pos.turn).find((s) => moveToString(s.path) === move) ?? null
}

/* ---------- Contrato GameDef ---------- */

export function apply(state: CheckersState, move: CheckersMove): CheckersState | null {
  if (typeof move !== 'string' || !/^([a-h][1-8])(-[a-h][1-8])+$/.test(move)) return null
  const pos = position(state)
  if (outcomeOf(pos)) return null
  return findStep(pos, move) ? { moves: [...state.moves, move] } : null
}

export function turn(state: CheckersState): Seat {
  return position(state).turn === 'w' ? 0 : 1
}

function outcomeOf(pos: Position): Outcome | null {
  const mine = pos.board.some((p) => p?.color === pos.turn)
  const winner: Seat = pos.turn === 'w' ? 1 : 0
  if (!mine) return { winner, reason: 'Sin piezas' }
  if (legalSteps(pos.board, pos.turn).length === 0) return { winner, reason: 'Sin jugadas posibles' }
  if (pos.quiet >= DRAW_PLIES) return { winner: null, reason: '30 jugadas sin capturas' }
  return null
}

export function outcome(state: CheckersState): Outcome | null {
  return outcomeOf(position(state))
}

export function undo(state: CheckersState): CheckersState {
  return { moves: state.moves.slice(0, -1) }
}

export function hint(state: CheckersState): string | null {
  const pos = position(state)
  const steps = legalSteps(pos.board, pos.turn)
  const n = steps[0]?.captured.length ?? 0
  if (n === 0) return null
  return n === 1 ? '¡Captura obligatoria!' : `¡Captura ${n} piezas!`
}

/* ---------- Seguimiento de fichas para animar ---------- */

export interface TrackedPiece extends Piece {
  id: string
  square: number
}

export function track(state: CheckersState): { pieces: TrackedPiece[]; last: Step | null; lastCaptured: TrackedPiece[] } {
  const pos = position(state)
  const ids = new Map<number, string>()
  initialBoard().forEach((p, i) => p && ids.set(i, `${p.color}-${sqName(i)}`))
  let board = initialBoard()
  let lastCaptured: TrackedPiece[] = []
  for (const step of pos.history) {
    lastCaptured = step.captured.map((c) => ({ ...board[c]!, id: ids.get(c)!, square: c }))
    const id = ids.get(step.path[0])!
    ids.delete(step.path[0])
    for (const c of step.captured) ids.delete(c)
    ids.set(step.path[step.path.length - 1], id)
    board = applyStep(board, step)
  }
  const pieces: TrackedPiece[] = []
  board.forEach((p, i) => p && pieces.push({ ...p, id: ids.get(i)!, square: i }))
  return { pieces, last: pos.history.at(-1) ?? null, lastCaptured }
}

/** Piezas que le quedan a cada bando. */
export function counts(state: CheckersState): Record<Color, { men: number; kings: number }> {
  const out = { w: { men: 0, kings: 0 }, b: { men: 0, kings: 0 } }
  for (const p of position(state).board) if (p) out[p.color][p.king ? 'kings' : 'men']++
  return out
}
