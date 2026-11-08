import { applyStep, legalSteps, type Board, type Color, type Step } from './logic'

/*
 * Motor de damas: negamax con poda alfa-beta y profundización iterativa.
 * Corre en un Web Worker (ver ai.worker.ts) para no congelar la pantalla.
 */

const MAN = 100
const KING = 320
const WIN = 100_000

/** Evaluación desde el punto de vista de `color` (positivo = mejor para `color`). */
export function evaluate(board: Board, color: Color): number {
  let score = 0
  for (let i = 0; i < 64; i++) {
    const p = board[i]
    if (!p) continue
    const f = i % 8
    const r = Math.floor(i / 8)
    let v: number
    if (p.king) {
      // Las damas valen más en el centro (más diagonales largas).
      const center = 3.5 - Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5))
      v = KING + center * 4
    } else {
      const advance = p.color === 'w' ? r : 7 - r // 0..7 hacia la coronación
      v = MAN + advance * advance * 1.5
      // Guardar la fila de atrás retrasa la coronación rival.
      if (advance === 0) v += 12
      // Fichas en los bordes son más difíciles de capturar.
      if (f === 0 || f === 7) v += 6
    }
    score += p.color === color ? v : -v
  }
  return score
}

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w')

/** Ordena para podar antes: más capturas primero, luego coronaciones. */
function ordered(board: Board, steps: Step[]): Step[] {
  const promoRank = (c: Color) => (c === 'w' ? 7 : 0)
  return steps
    .map((s) => {
      const p = board[s.path[0]]!
      const to = s.path[s.path.length - 1]
      const promotes = !p.king && Math.floor(to / 8) === promoRank(p.color)
      return { s, k: s.captured.length * 10 + (promotes ? 5 : 0) }
    })
    .sort((a, b) => b.k - a.k)
    .map((x) => x.s)
}

class Timeout extends Error {}

function negamax(board: Board, color: Color, depth: number, alpha: number, beta: number, ply: number, deadline: number, nodes: { n: number }): number {
  if ((++nodes.n & 1023) === 0 && performance.now() > deadline) throw new Timeout()
  const steps = legalSteps(board, color)
  if (steps.length === 0) return -WIN + ply // sin jugadas: pierde (preferimos perder lo más tarde posible)
  // Las capturas obligatorias no cuentan como "fin de búsqueda": evita cortar a mitad de un intercambio.
  if (depth <= 0 && steps[0].captured.length === 0) return evaluate(board, color)
  let best = -Infinity
  for (const s of ordered(board, steps)) {
    const v = -negamax(applyStep(board, s), other(color), depth - 1, -beta, -alpha, ply + 1, deadline, nodes)
    if (v > best) best = v
    if (v > alpha) alpha = v
    if (alpha >= beta) break
  }
  return best
}

export interface ScoredStep {
  step: Step
  score: number
}

export interface SearchOptions {
  maxDepth: number
  /** Tiempo máximo en ms (la profundidad alcanzada puede ser menor). */
  timeMs: number
}

/**
 * Evalúa todas las jugadas de `color` con profundización iterativa.
 * Devuelve las jugadas ordenadas de mejor a peor según la última profundidad completa.
 */
export function analyse(board: Board, color: Color, opts: SearchOptions): { scored: ScoredStep[]; depth: number } {
  const steps = legalSteps(board, color)
  if (steps.length <= 1) return { scored: steps.map((step) => ({ step, score: 0 })), depth: 0 }
  const deadline = performance.now() + opts.timeMs
  let result: ScoredStep[] = ordered(board, steps).map((step) => ({ step, score: 0 }))
  let reached = 0
  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    const nodes = { n: 0 }
    try {
      const scored: ScoredStep[] = []
      // Las mejores de la iteración anterior primero: poda más.
      for (const { step } of result) {
        const v = -negamax(applyStep(board, step), other(color), depth - 1, -Infinity, Infinity, 1, deadline, nodes)
        scored.push({ step, score: v })
      }
      scored.sort((a, b) => b.score - a.score)
      result = scored
      reached = depth
      if (Math.abs(scored[0].score) > WIN / 2) break // mate encontrado
    } catch (e) {
      if (e instanceof Timeout) break
      throw e
    }
  }
  return { scored: result, depth: reached }
}

/* ---------- Niveles ---------- */

export interface CheckersLevel {
  id: number
  name: string
  blurb: string
  maxDepth: number
  timeMs: number
  /** Probabilidad de no jugar la mejor y elegir entre las `pool` primeras. */
  randomness: number
  pool: number
}

export const CHECKERS_LEVELS: CheckersLevel[] = [
  { id: 1, name: 'Aprendiz', blurb: 'Mueve casi al azar.', maxDepth: 1, timeMs: 200, randomness: 0.6, pool: 6 },
  { id: 2, name: 'Novato', blurb: 'Ve lo que tiene enfrente.', maxDepth: 2, timeMs: 300, randomness: 0.3, pool: 4 },
  { id: 3, name: 'Aficionado', blurb: 'Evita perder fichas fáciles.', maxDepth: 4, timeMs: 500, randomness: 0.12, pool: 3 },
  { id: 4, name: 'Jugador de club', blurb: 'Prepara capturas dobles.', maxDepth: 6, timeMs: 800, randomness: 0.04, pool: 2 },
  { id: 5, name: 'Fuerte', blurb: 'Calcula varias jugadas.', maxDepth: 9, timeMs: 1200, randomness: 0, pool: 1 },
  { id: 6, name: 'Experto', blurb: 'Muy difícil de engañar.', maxDepth: 14, timeMs: 2000, randomness: 0, pool: 1 },
]

export function getCheckersLevel(id: number): CheckersLevel {
  return CHECKERS_LEVELS.find((l) => l.id === id) ?? CHECKERS_LEVELS[0]
}

/** Elige jugada según el nivel (con azar en los niveles bajos). */
export function choose(scored: ScoredStep[], level: CheckersLevel, rand: () => number = Math.random): Step {
  if (scored.length === 1 || rand() >= level.randomness) return scored[0].step
  const pool = scored.slice(0, Math.max(1, Math.min(level.pool, scored.length)))
  return pool[Math.floor(rand() * pool.length)].step
}
