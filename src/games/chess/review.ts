import type { Seat } from '../../core/types'

/** Calidad de una jugada según cuánto empeoró la posición (en centipeones). */
export type Verdict = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export const VERDICT_LABEL: Record<Verdict, string> = {
  best: 'La mejor',
  good: 'Buena',
  inaccuracy: 'Imprecisión',
  mistake: 'Error',
  blunder: 'Error grave',
}

export interface MoveReview {
  ply: number
  played: string
  best: string
  /** Pérdida en centipeones desde el punto de vista de quien movió (≥ 0). */
  loss: number
  verdict: Verdict
}

/**
 * Evaluaciones de cada posición de la partida desde el punto de vista de BLANCAS
 * (índice k = posición antes de la jugada k; la última es la final).
 */
export interface PositionEval {
  value: number
  best: string | null
}

/** Pérdidas recortadas: más allá de ~10 peones da igual (ya estaba ganado o perdido). */
const CAP = 1000

export function classify(loss: number, playedIsBest: boolean): Verdict {
  if (playedIsBest || loss <= 10) return 'best'
  if (loss < 60) return 'good'
  if (loss < 140) return 'inaccuracy'
  if (loss < 300) return 'mistake'
  return 'blunder'
}

/**
 * Revisa las jugadas de `seat` comparando la evaluación antes y después de cada una.
 * evals.length debe ser moves.length + 1.
 */
export function reviewMoves(moves: string[], evals: PositionEval[], seat: Seat): MoveReview[] {
  const out: MoveReview[] = []
  const sign = seat === 0 ? 1 : -1
  for (let k = 0; k < moves.length; k++) {
    if (k % 2 !== seat) continue
    const before = clamp(evals[k].value * sign)
    const after = clamp(evals[k + 1].value * sign)
    const loss = Math.max(0, before - after)
    const best = evals[k].best ?? moves[k]
    out.push({ ply: k, played: moves[k], best, loss, verdict: classify(loss, best === moves[k]) })
  }
  return out
}

function clamp(v: number): number {
  return Math.max(-CAP, Math.min(CAP, v))
}

/** Porcentaje aproximado de precisión (100 = sin pérdidas). Fórmula simple y estable. */
export function accuracy(reviews: MoveReview[]): number {
  if (reviews.length === 0) return 100
  const avgLoss = reviews.reduce((a, r) => a + Math.min(r.loss, 400), 0) / reviews.length
  return Math.round(Math.max(0, 100 - avgLoss / 4))
}
