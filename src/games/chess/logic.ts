import { Chess, type Move, type Square, type PieceSymbol, type Color } from 'chess.js'
import type { Outcome, Seat } from '../../core/types'

/** Estado serializable: solo la lista de jugadas en notación UCI (e2e4, e7e8q). */
export interface ChessState {
  moves: string[]
}

export type ChessMove = string // UCI

export const initialState = (): ChessState => ({ moves: [] })

/* ---------- Motor con memoria ----------
 * Reconstruir la partida desde cero en cada render sería un desperdicio.
 * Guardamos la última instancia y, si el estado nuevo la extiende, solo
 * aplicamos las jugadas que faltan.
 */
let cached: { chess: Chess; moves: string[] } | null = null

function sameMoves(a: string[], b: string[], n: number): boolean {
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false
  return true
}

export function engine(state: ChessState): Chess {
  const m = state.moves
  if (cached && cached.moves.length <= m.length && sameMoves(cached.moves, m, cached.moves.length)) {
    if (cached.moves.length === m.length) return cached.chess
    const chess = cached.chess
    for (let i = cached.moves.length; i < m.length; i++) playUci(chess, m[i])
    cached = { chess, moves: m.slice() }
    return chess
  }
  const chess = new Chess()
  for (const uci of m) playUci(chess, uci)
  cached = { chess, moves: m.slice() }
  return chess
}

function playUci(chess: Chess, uci: string): Move {
  return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}

export function toUci(from: string, to: string, promotion?: string): string {
  return from + to + (promotion ?? '')
}

/* ---------- Contrato GameDef ---------- */

export function apply(state: ChessState, move: ChessMove): ChessState | null {
  if (typeof move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return null
  // Validamos sobre una copia para no ensuciar la caché con una jugada ilegal.
  const probe = new Chess(engine(state).fen())
  try {
    playUci(probe, move)
  } catch {
    return null
  }
  return { moves: [...state.moves, move] }
}

export function turn(state: ChessState): Seat {
  return engine(state).turn() === 'w' ? 0 : 1
}

export function outcome(state: ChessState): Outcome | null {
  const c = engine(state)
  if (c.isCheckmate()) return { winner: c.turn() === 'w' ? 1 : 0, reason: 'Jaque mate' }
  if (c.isStalemate()) return { winner: null, reason: 'Rey ahogado' }
  if (c.isInsufficientMaterial()) return { winner: null, reason: 'Material insuficiente' }
  if (c.isThreefoldRepetition()) return { winner: null, reason: 'Triple repetición' }
  if (c.isDrawByFiftyMoves()) return { winner: null, reason: 'Regla de 50 jugadas' }
  return null
}

export function undo(state: ChessState): ChessState {
  return { moves: state.moves.slice(0, -1) }
}

export function hint(state: ChessState): string | null {
  const c = engine(state)
  return c.inCheck() && !c.isCheckmate() ? '¡Jaque!' : null
}

/* ---------- Seguimiento de piezas para animar ----------
 * Cada pieza recibe un id estable desde la posición inicial. Al reproducir
 * las jugadas, el id viaja con la pieza; así el tablero puede animar el
 * desplazamiento en lugar de "teletransportar" piezas.
 */
export interface TrackedPiece {
  id: string
  type: PieceSymbol
  color: Color
  square: Square
}

export interface Tracked {
  pieces: TrackedPiece[]
  /** Pieza capturada en la última jugada (para animar su salida). */
  lastCaptured: TrackedPiece | null
  lastMove: { from: Square; to: Square } | null
}

const FILES = 'abcdefgh'

export function track(state: ChessState): Tracked {
  const history = engine(state).history({ verbose: true })
  const bySquare = new Map<string, TrackedPiece>()
  const start = new Chess()
  for (const row of start.board()) {
    for (const p of row) {
      if (p) bySquare.set(p.square, { id: `${p.color}${p.type}-${p.square}`, type: p.type, color: p.color, square: p.square })
    }
  }
  let lastCaptured: TrackedPiece | null = null
  let lastMove: Tracked['lastMove'] = null

  for (const mv of history) {
    lastCaptured = null
    const piece = bySquare.get(mv.from)
    if (!piece) continue // no debería pasar
    let capSq: string = mv.to
    if (mv.isEnPassant()) capSq = mv.to[0] + mv.from[1]
    const cap = bySquare.get(capSq)
    if (cap && cap !== piece) {
      lastCaptured = { ...cap }
      bySquare.delete(capSq)
    }
    bySquare.delete(mv.from)
    bySquare.set(mv.to, { ...piece, square: mv.to, type: mv.promotion ?? piece.type })

    if (mv.isKingsideCastle() || mv.isQueensideCastle()) {
      const rank = mv.from[1]
      const rookFrom = (mv.isKingsideCastle() ? 'h' : 'a') + rank
      const rookTo = (mv.isKingsideCastle() ? 'f' : 'd') + rank
      const rook = bySquare.get(rookFrom)
      if (rook) {
        bySquare.delete(rookFrom)
        bySquare.set(rookTo, { ...rook, square: rookTo as Square })
      }
    }
    lastMove = { from: mv.from, to: mv.to }
  }

  return { pieces: [...bySquare.values()], lastCaptured, lastMove }
}

/** Piezas capturadas por cada bando, para mostrarlas junto al nombre. */
export function capturedBy(state: ChessState): Record<Color, PieceSymbol[]> {
  const out: Record<Color, PieceSymbol[]> = { w: [], b: [] }
  for (const mv of engine(state).history({ verbose: true })) {
    if (mv.captured) out[mv.color].push(mv.captured)
  }
  const order: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']
  out.w.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  out.b.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return out
}

export function squareXY(square: string, flipped: boolean): { x: number; y: number } {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  return flipped ? { x: 7 - file, y: rank } : { x: file, y: 7 - rank }
}

export function xyToSquare(x: number, y: number, flipped: boolean): Square {
  const file = flipped ? 7 - x : x
  const rank = flipped ? y : 7 - y
  return (FILES[file] + (rank + 1)) as Square
}
