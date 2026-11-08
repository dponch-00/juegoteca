import type { GameDef } from '../../core/types'
import { ChessBoard } from './ChessBoard'
import { Captured } from './Captured'
import { apply, hint, initialState, outcome, turn, undo, type ChessMove, type ChessState } from './logic'

export const chessBase: GameDef<ChessState, ChessMove> = {
  id: 'chess',
  name: 'Ajedrez',
  tagline: 'El clásico: jaque mate al rey rival.',
  glyph: '♞',
  seatNames: ['Blancas', 'Negras'],
  create: initialState,
  apply,
  turn,
  outcome,
  ply: (s) => s.moves.length,
  undo,
  hint,
  Board: ChessBoard,
  PlayerExtra: Captured,
}
