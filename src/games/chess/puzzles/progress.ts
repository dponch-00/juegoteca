import { load, save } from '../../../core/storage'

/** clean = a la primera; helped = con error o pista; revealed = se vio la solución. */
export type Outcome = 'clean' | 'helped' | 'revealed'

export interface Progress {
  done: Record<string, Outcome>
  streak: number
  bestStreak: number
}

const KEY = 'puzzles:chess'

export function getProgress(): Progress {
  return load<Progress>(KEY, { done: {}, streak: 0, bestStreak: 0 })
}

/** Registra el resultado de un reto y actualiza la racha (solo cuenta lo resuelto a la primera). */
export function recordPuzzle(id: string, outcome: Outcome): Progress {
  const p = getProgress()
  // Si ya estaba resuelto, no empeoramos su resultado al repetirlo.
  const prev = p.done[id]
  const rank: Record<Outcome, number> = { clean: 2, helped: 1, revealed: 0 }
  if (!prev || rank[outcome] > rank[prev]) p.done[id] = outcome
  p.streak = outcome === 'clean' ? p.streak + 1 : 0
  p.bestStreak = Math.max(p.bestStreak, p.streak)
  save(KEY, p)
  return p
}

export function isSolved(p: Progress, id: string): boolean {
  return p.done[id] === 'clean' || p.done[id] === 'helped'
}
