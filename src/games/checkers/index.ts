import type { GameDef } from '../../core/types'
import { CheckersBoard } from './CheckersBoard'
import { Remaining } from './Remaining'
import { checkersAI } from './aiClient'
import { CheckerArt } from './art'
import { h } from 'preact'
import { apply, hint, initialState, outcome, turn, undo, type CheckersMove, type CheckersState } from './logic'

export const checkers: GameDef<CheckersState, CheckersMove> = {
  id: 'checkers',
  name: 'Damas',
  tagline: 'Salta, captura y corona. Reglas clásicas.',
  glyph: '⛀',
  seatNames: ['Blancas', 'Negras'],
  create: initialState,
  apply,
  turn,
  outcome,
  ply: (s) => s.moves.length,
  undo,
  hint,
  Board: CheckersBoard,
  PlayerExtra: Remaining,
  ai: checkersAI,
  SeatIcon: ({ seat }) => h(CheckerArt, { color: seat === 0 ? 'w' : 'b', king: false }),
}
