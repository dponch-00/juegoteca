import { scoreValue } from './uci'
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

/* ---------- Pista ----------
 * La pista debe ser MÁS fuerte que el rival, para que seguirla siempre lleve a ganar
 * o, contra los niveles más altos, al menos a no perder. Antes se cortaba en
 * profundidad 14: más débil que Maestro y Gran maestro, que piensan por tiempo y sin tope.
 * Ahora piensa sin tope de profundidad y con más tiempo que el rival (2.5×),
 * entre 1.5 y 4 s, y se detiene antes si ya encontró un mate.
 */
export function hintSearch(level: Level): { skill: number; movetime: number; stopOnMate: boolean; multipv: number } {
  const rival = level.movetime ?? 0
  return { skill: 20, movetime: Math.min(4000, Math.max(1500, Math.round(rival * 2.5))), stopOnMate: true, multipv: 3 }
}

const PROMO: Record<string, string> = { q: 'dama', r: 'torre', b: 'alfil', n: 'caballo' }

/** Qué significa la jugada sugerida, en palabras (evaluación desde quien pide la pista). */
export function hintNote(score: { cp?: number; mate?: number } | undefined, uci: string): string {
  const promo = uci.length > 4 && uci[4] !== 'q' ? ` Corona a ${PROMO[uci[4]]}.` : ''
  if (!score) return `La mejor jugada.${promo}`
  if (score.mate !== undefined) {
    if (score.mate > 0) return score.mate === 1 ? `¡Es mate!${promo}` : `Con esta jugada das mate en ${score.mate}.${promo}`
    return `La mejor defensa: el rival tiene mate, pero aguanta lo más posible.${promo}`
  }
  const cp = score.cp ?? 0
  const pawns = (Math.abs(cp) / 100).toFixed(1)
  if (cp >= 300) return `Ventaja decisiva (+${pawns}). Sigue así y ganas.${promo}`
  if (cp >= 100) return `Vas mejor (+${pawns}).${promo}`
  if (cp > -100) return `Posición pareja: la jugada más sólida.${promo}`
  return `La mejor defensa: vas peor (−${pawns}).${promo}`
}

/**
 * Elige la pista entre las variantes del motor. La mejor, salvo que repita una posición
 * ya vista (camino a tablas por repetición): entonces, si hay otra que no repite y es casi
 * igual de buena (≤ 0.5 peones peor) y no nos deja peor, se prefiere esa, para seguir
 * buscando la victoria en vez de conformarse con tablas.
 */
export function chooseHint<L extends { pv: string[]; score: { cp?: number; mate?: number } }>(lines: L[], repeats: (uci: string) => boolean): L | undefined {
  const best = lines[0]
  if (!best || !repeats(best.pv[0])) return best
  const v = (l: L) => scoreValue(l.score)
  return lines.slice(1).find((l) => l.pv[0] && !repeats(l.pv[0]) && v(l) >= v(best) - 50 && v(l) >= -30) ?? best
}
