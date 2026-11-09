import type { SoloGameDef } from '../../core/types'
import { SudokuScreen } from './SudokuScreen'
import { totalSolved } from './store'

export const sudoku: SoloGameDef = {
  id: 'sudoku',
  name: 'Sudoku',
  tagline: 'Lógica para un jugador.',
  glyph: '#',
  Screen: SudokuScreen,
  progressLabel: () => {
    const n = totalSolved()
    return n ? `${n} ${n === 1 ? 'resuelto' : 'resueltos'}` : null
  },
}
