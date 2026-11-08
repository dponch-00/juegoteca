import type { ComingSoon, GameDef } from '../core/types'
import { chess } from './chess'

/** Juegos jugables. Para sumar uno: crear src/games/<id>/ con su GameDef y agregarlo aquí. */
export const GAMES: GameDef[] = [chess]

export const COMING_SOON: ComingSoon[] = [
  { id: 'checkers', name: 'Damas', tagline: 'Salta, captura y corona.', glyph: '⛀', soon: true },
  { id: 'backgammon', name: 'Backgammon', tagline: 'Dados, carrera y estrategia.', glyph: '⚂', soon: true },
  { id: 'sudoku', name: 'Sudoku', tagline: 'Lógica para un jugador.', glyph: '#', soon: true },
]

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id)
}
