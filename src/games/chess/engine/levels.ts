/**
 * Niveles contra la computadora.
 *
 * Stockfish, incluso en su "Skill Level" más bajo, es demasiado fuerte para quien
 * empieza. Por eso los primeros niveles, además de limitar profundidad, a veces
 * eligen una jugada al azar entre las candidatas (como haría un principiante).
 */
export interface Level {
  id: number
  name: string
  blurb: string
  /** Skill Level de Stockfish (0–20). */
  skill: number
  depth?: number
  movetime?: number
  /** Probabilidad de elegir una jugada al azar entre `pool` candidatas. */
  randomness: number
  /** Cuántas variantes pedir (MultiPV) para escoger con azar. */
  pool: number
}

export const LEVELS: Level[] = [
  { id: 1, name: 'Aprendiz', blurb: 'Está aprendiendo: deja piezas colgadas.', skill: 0, depth: 1, randomness: 0.55, pool: 8 },
  { id: 2, name: 'Novato', blurb: 'Conoce las reglas, se distrae seguido.', skill: 0, depth: 2, randomness: 0.3, pool: 5 },
  { id: 3, name: 'Aficionado', blurb: 'Ve las amenazas directas.', skill: 3, depth: 4, randomness: 0.15, pool: 4 },
  { id: 4, name: 'Jugador de club', blurb: 'Castiga los errores claros.', skill: 6, depth: 6, randomness: 0.06, pool: 3 },
  { id: 5, name: 'Fuerte', blurb: 'Táctica sólida y buen plan.', skill: 10, depth: 9, randomness: 0, pool: 1 },
  { id: 6, name: 'Experto', blurb: 'Difícil de sorprender.', skill: 14, depth: 12, randomness: 0, pool: 1 },
  { id: 7, name: 'Maestro', blurb: 'Casi no se equivoca.', skill: 18, movetime: 900, randomness: 0, pool: 1 },
  { id: 8, name: 'Gran maestro', blurb: 'Toda la fuerza del motor.', skill: 20, movetime: 1800, randomness: 0, pool: 1 },
]

export function getLevel(id: number): Level {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}

/**
 * Elige entre las candidatas: con probabilidad `randomness` toma una al azar
 * (sesgada hacia las mejores); si no, la mejor.
 */
export function pickMove(candidates: string[], level: Level, rand: () => number = Math.random): string {
  if (candidates.length === 0) throw new Error('sin candidatas')
  if (candidates.length === 1 || rand() >= level.randomness) return candidates[0]
  // Pesos decrecientes: la 2.ª candidata pesa más que la 8.ª.
  const weights = candidates.map((_, i) => 1 / (i + 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i]
    if (r <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}
