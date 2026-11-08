import type { ComingSoon, GameDef } from '../core/types'
import { chess } from './chess'
import { checkers } from './checkers'
import { backgammon } from './backgammon'

/** Juegos jugables. Para sumar uno: crear src/games/<id>/ con su GameDef y agregarlo aquí. */
export const GAMES: GameDef[] = [chess, checkers, backgammon]

export const COMING_SOON: ComingSoon[] = [
  { id: 'sudoku', name: 'Sudoku', tagline: 'Lógica para un jugador.', glyph: '#', soon: true },
]

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}
