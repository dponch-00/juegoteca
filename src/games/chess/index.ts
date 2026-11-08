import type { GameDef } from '../../core/types'
import { CpuScreen } from './cpu/CpuScreen'
import { PuzzlesScreen } from './puzzles/PuzzlesScreen'
import { chessBase } from './def'
import type { ChessMove, ChessState } from './logic'

/** Ajedrez completo: la definición base más sus modos de un jugador. */
export const chess: GameDef<ChessState, ChessMove> = {
  ...chessBase,
  soloModes: [
    { id: 'cpu', label: 'Contra la computadora', sub: '8 niveles, de Aprendiz a Gran maestro' },
    { id: 'retos', label: 'Retos', sub: '600 problemas: mates en 1, 2 y 3, horquillas, clavadas…' },
  ],
  screens: { cpu: CpuScreen, retos: PuzzlesScreen },
}
