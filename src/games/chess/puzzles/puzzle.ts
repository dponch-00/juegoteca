import { Chess } from 'chess.js'
import type { Seat } from '../../../core/types'
import { apply, type ChessState } from '../logic'

/*
 * Reglas de un reto (formato de la base de Lichess):
 * - La posición FEN es ANTES de la jugada del rival; la primera jugada de la
 *   lista la hace el rival y deja el tablero listo para quien resuelve.
 * - Después se alternan: jugada correcta de quien resuelve, respuesta del rival…
 * - Como en Lichess, en la última jugada cualquier jaque mate cuenta como correcto.
 */

export type PuzzleTuple = [id: string, fen: string, moves: string, rating: number]

export interface Puzzle {
  id: string
  fen: string
  moves: string[]
  rating: number
}

export type Status = 'opponent' | 'solving' | 'solved' | 'revealed'

export interface Attempt {
  puzzle: Puzzle
  state: ChessState
  /** Índice en puzzle.moves de la próxima jugada esperada. */
  next: number
  status: Status
  mistakes: number
  hints: number
}

export function parsePuzzle([id, fen, moves, rating]: PuzzleTuple): Puzzle {
  return { id, fen, moves: moves.split(' '), rating }
}

/** Bando de quien resuelve: el contrario al que mueve en la FEN. */
export function solverSeat(p: Puzzle): Seat {
  return p.fen.split(' ')[1] === 'w' ? 1 : 0
}

export function startAttempt(p: Puzzle): Attempt {
  return { puzzle: p, state: { fen: p.fen, moves: [] }, next: 0, status: 'opponent', mistakes: 0, hints: 0 }
}

/** Juega la respuesta del rival que toca. */
export function playOpponent(a: Attempt): Attempt {
  if (a.status !== 'opponent') return a
  const move = a.puzzle.moves[a.next]
  const state = apply(a.state, move)
  if (!state) throw new Error(`Jugada inválida en el reto ${a.puzzle.id}: ${move}`)
  const next = a.next + 1
  return { ...a, state, next, status: next >= a.puzzle.moves.length ? 'solved' : 'solving' }
}

export type MoveResult = 'correct' | 'solved' | 'wrong'

/** Intenta una jugada de quien resuelve. Si es incorrecta, la posición no cambia. */
export function tryMove(a: Attempt, uci: string): { attempt: Attempt; result: MoveResult } {
  if (a.status !== 'solving') return { attempt: a, result: 'wrong' }
  const expected = a.puzzle.moves[a.next]
  const isLast = a.next === a.puzzle.moves.length - 1
  let ok = uci === expected
  if (!ok && isLast) ok = givesMate(a.state, uci)
  if (!ok) return { attempt: { ...a, mistakes: a.mistakes + 1 }, result: 'wrong' }
  const state = apply(a.state, uci)
  if (!state) return { attempt: { ...a, mistakes: a.mistakes + 1 }, result: 'wrong' }
  const next = a.next + 1
  if (next >= a.puzzle.moves.length) return { attempt: { ...a, state, next, status: 'solved' }, result: 'solved' }
  return { attempt: { ...a, state, next, status: 'opponent' }, result: 'correct' }
}

/** Avanza un paso de la solución (para "Ver solución"). */
export function revealStep(a: Attempt): Attempt {
  if (a.next >= a.puzzle.moves.length) return { ...a, status: 'revealed' }
  const state = apply(a.state, a.puzzle.moves[a.next])
  if (!state) return { ...a, status: 'revealed' }
  const next = a.next + 1
  return { ...a, state, next, status: next >= a.puzzle.moves.length ? 'revealed' : a.status }
}

/** La jugada que toca ahora (para pistas). */
export function expectedMove(a: Attempt): string | null {
  return a.status === 'solving' ? a.puzzle.moves[a.next] : null
}

function givesMate(state: ChessState, uci: string): boolean {
  const next = apply(state, uci)
  if (!next) return false
  const c = new Chess(state.fen)
  for (const m of next.moves) c.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] })
  return c.isCheckmate()
}

/** Cuántas jugadas propias tiene la solución (mate en N = N jugadas). */
export function solverMoves(p: Puzzle): number {
  return Math.floor(p.moves.length / 2)
}
