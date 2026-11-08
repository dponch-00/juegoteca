import type { GameAI } from '../../core/types'
import { BACKGAMMON_LEVELS } from './ai'
import { position, rollDice, rollToString, type BackgammonMove, type BackgammonState } from './logic'

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

function ask(state: BackgammonState, level: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, (m) => (m ? resolve(m) : reject(new Error('El motor no encontró jugada.'))))
    getWorker().postMessage({ id, moves: state.moves, level })
  })
}

export const backgammonAI: GameAI<BackgammonState, BackgammonMove> = {
  levels: BACKGAMMON_LEVELS,
  /** Si toca tirar, la computadora tira; si ya tiró, elige su jugada. */
  move: async (state, level) => (position(state).dice ? ask(state, level) : rollToString(rollDice())),
  hint: async (state) => {
    if (!position(state).dice) throw new Error('Primero tira los dados.')
    return ask(state, 4)
  },
  /** La pista marca las puntas de salida y llegada de cada ficha. */
  hintAnnotations: (_state, move) => {
    const steps = move.slice(2).split(',').filter(Boolean)
    return { marks: steps.flatMap((s) => s.split('/').map(Number)) }
  },
}
