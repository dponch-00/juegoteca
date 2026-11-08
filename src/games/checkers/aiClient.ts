import type { GameAI } from '../../core/types'
import { CHECKERS_LEVELS } from './ai'
import { sqIndex, type CheckersMove, type CheckersState } from './logic'

/* Cliente del motor de damas: un único worker para toda la app, cargado al primer uso. */

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, (move: string | null) => void>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ id: number; move: string | null }>) => {
      pending.get(e.data.id)?.(e.data.move)
      pending.delete(e.data.id)
    }
  }
  return worker
}

function ask(state: CheckersState, level: number, mode: 'move' | 'hint'): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, (move) => (move ? resolve(move) : reject(new Error('El motor no encontró jugada.'))))
    getWorker().postMessage({ id, moves: state.moves, level, mode })
  })
}

export const checkersAI: GameAI<CheckersState, CheckersMove> = {
  levels: CHECKERS_LEVELS,
  move: (state, level) => ask(state, level, 'move'),
  hint: (state) => ask(state, 6, 'hint'),
  /** La pista marca la ficha y la casilla final. */
  hintAnnotations: (_state, move) => {
    const path = move.split('-')
    return {
      marks: [
        { square: sqIndex(path[0]), tone: 'hint' },
        { square: sqIndex(path[path.length - 1]), tone: 'hint' },
      ],
    }
  },
}
