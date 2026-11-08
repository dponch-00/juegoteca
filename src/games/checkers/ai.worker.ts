/// <reference lib="webworker" />
import { analyse, choose, getCheckersLevel } from './ai'
import { moveToString, position } from './logic'

/** Pide: { id, moves, level, mode: 'move' | 'hint' } → responde: { id, move } */
self.onmessage = (e: MessageEvent<{ id: number; moves: string[]; level: number; mode: 'move' | 'hint' }>) => {
  const { id, moves, level, mode } = e.data
  try {
    const pos = position({ moves })
    const lvl = getCheckersLevel(level)
    const opts = mode === 'hint' ? { maxDepth: 12, timeMs: 1200 } : { maxDepth: lvl.maxDepth, timeMs: lvl.timeMs }
    const { scored } = analyse(pos.board, pos.turn, opts)
    const step = scored.length === 0 ? null : mode === 'hint' ? scored[0].step : choose(scored, lvl)
    postMessage({ id, move: step ? moveToString(step.path) : null })
  } catch (err) {
    postMessage({ id, move: null, error: String(err) })
  }
}
