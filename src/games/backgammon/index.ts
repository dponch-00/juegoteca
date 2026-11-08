import { h } from 'preact'
import type { GameDef } from '../../core/types'
import { backgammonAI } from './aiClient'
import { BackgammonBoard, BgChecker, BgInfo } from './BackgammonBoard'
import { apply, initialState, outcome, takeback, turn, undo, type BackgammonMove, type BackgammonState } from './logic'

export const backgammon: GameDef<BackgammonState, BackgammonMove> = {
  id: 'backgammon',
  name: 'Backgammon',
  tagline: 'Dados, carrera y estrategia.',
  glyph: '⚂',
  seatNames: ['Blancas', 'Negras'],
  create: initialState,
  apply,
  turn,
  outcome,
  ply: (s) => s.moves.length,
  undo,
  takeback,
  Board: BackgammonBoard,
  PlayerExtra: BgInfo,
  ai: backgammonAI,
  SeatIcon: ({ seat }) => h(BgChecker, { color: seat === 0 ? 'w' : 'b' }),
}
