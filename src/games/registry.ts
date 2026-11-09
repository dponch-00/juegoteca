import type { ComingSoon, GameDef, SoloGameDef } from '../core/types'
import { chess } from './chess'
import { checkers } from './checkers'
import { backgammon } from './backgammon'
import { sudoku } from './sudoku'

/** Juegos de dos. Para sumar uno: crear src/games/<id>/ con su GameDef y agregarlo aquí. */
export const GAMES: GameDef[] = [chess, checkers, backgammon]

/** Juegos de un jugador: traen su propia pantalla. */
export const SOLO_GAMES: SoloGameDef[] = [sudoku]

export const COMING_SOON: ComingSoon[] = []

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}

export function getSoloGame(id: string): SoloGameDef | undefined {
  return SOLO_GAMES.find((g) => g.id === id)
}
