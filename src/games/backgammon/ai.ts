import { applyStep, countAt, legalSequences, pips, type Color, type Pos, type Step } from './logic'

/*
 * Motor de backgammon: evaluación heurística de la posición tras la jugada y,
 * en el nivel más alto, media sobre las 21 tiradas posibles del rival (expectimax de 1 capa).
 */

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w')

/** Probabilidad (×36) de acertar una ficha sola a distancia d (1..12) con una tirada. */
const HIT_36 = [0, 11, 12, 14, 15, 15, 17, 6, 6, 5, 3, 2, 3]

/** Hay contacto si todavía pueden cruzarse fichas de ambos bandos. */
export function isContact(p: Pos): boolean {
  let maxW = p.bar.w > 0 ? 25 : 0
  let minB = p.bar.b > 0 ? 0 : 25
  for (let i = 1; i <= 24; i++) {
    if (p.points[i] > 0) maxW = Math.max(maxW, i)
    if (p.points[i] < 0) minB = Math.min(minB, i)
  }
  return maxW > minB
}

const isHome = (i: number, c: Color) => (c === 'w' ? i <= 6 : i >= 19)
const BAR_OF: Record<Color, number> = { w: 25, b: 0 }

/** Puntuación de la posición desde el punto de vista de `c` (mayor = mejor para `c`). */
export function evaluate(p: Pos, c: Color): number {
  const o = other(c)
  let score = (pips(p, o) - pips(p, c)) * 1.0
  score += (p.off[c] - p.off[o]) * 4
  score += (p.bar[o] - p.bar[c]) * 12

  if (!isContact(p)) return score

  // Puntas hechas (2+ fichas) y primas.
  let run = 0
  for (let k = 1; k <= 24; k++) {
    const i = c === 'w' ? k : 25 - k // recorrer en el sentido en que bloquea al rival
    const n = countAt(p, i, c)
    if (n >= 2) {
      score += isHome(i, c) ? 6 : 3
      run++
      if (run >= 3) score += run * 2
    } else run = 0
  }
  // Ancla en la casa rival: buena defensa.
  for (let i = 1; i <= 24; i++) if (isHome(i, o) && countAt(p, i, c) >= 2) score += 4

  // Fichas solas expuestas a un golpe.
  for (let i = 1; i <= 24; i++) {
    if (countAt(p, i, c) !== 1) continue
    let prob = 0
    for (let d = 1; d <= 12; d++) {
      // El rival se mueve hacia su casa: llega a i desde j (su barra cuenta como 25 o 0).
      const j = o === 'w' ? i + d : i - d
      const attackers = j === BAR_OF[o] ? p.bar[o] : j >= 1 && j <= 24 ? countAt(p, j, o) : 0
      if (attackers > 0) prob += HIT_36[d] / 36
    }
    if (prob > 0) {
      const lost = c === 'w' ? i : 25 - i // pips que se pierden si nos golpean
      score -= Math.min(1, prob) * (lost * 0.6 + 8)
    }
  }
  return score
}

const posKey = (p: Pos) => p.points.join(',') + `|${p.bar.w},${p.bar.b}|${p.off.w},${p.off.b}`

function applySeq(p: Pos, c: Color, seq: Step[]): Pos {
  let q = p
  for (const s of seq) q = applyStep(q, c, s)
  return q
}

/** Secuencias distintas por posición resultante (muchas llevan al mismo lugar). */
function candidates(p: Pos, c: Color, dice: number[]): { seq: Step[]; after: Pos }[] {
  const out = new Map<string, { seq: Step[]; after: Pos }>()
  for (const seq of legalSequences(p, c, dice)) {
    const after = applySeq(p, c, seq)
    const k = posKey(after)
    if (!out.has(k)) out.set(k, { seq, after })
  }
  return [...out.values()]
}

const ROLLS: [number, number, number][] = []
for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) ROLLS.push([a, b, a === b ? 1 : 2])

/** Mejor valor que el rival obtiene con su tirada (desde su punto de vista). */
function bestReply(p: Pos, o: Color, dice: number[]): number {
  let best = -Infinity
  for (const { after } of candidates(p, o, dice)) best = Math.max(best, evaluate(after, o))
  return best
}

export interface BgLevel {
  id: number
  name: string
  blurb: string
  randomness: number
  pool: number
  lookahead: boolean
}

export const BACKGAMMON_LEVELS: BgLevel[] = [
  { id: 1, name: 'Aprendiz', blurb: 'Mueve casi al azar.', randomness: 0.7, pool: 99, lookahead: false },
  { id: 2, name: 'Novato', blurb: 'Golpea cuando puede, se arriesga.', randomness: 0.3, pool: 4, lookahead: false },
  { id: 3, name: 'Aficionado', blurb: 'Cuida sus fichas y hace puntas.', randomness: 0, pool: 1, lookahead: false },
  { id: 4, name: 'Experto', blurb: 'Piensa en todas tus tiradas posibles.', randomness: 0, pool: 1, lookahead: true },
]

export function getBgLevel(id: number): BgLevel {
  return BACKGAMMON_LEVELS.find((l) => l.id === id) ?? BACKGAMMON_LEVELS[0]
}

/** Elige la jugada para `p.turn` con los dados `p.dice`. */
export function chooseSequence(p: Pos, level: BgLevel, rand: () => number = Math.random): Step[] {
  const c = p.turn
  const dice = p.dice!
  const cands = candidates(p, c, dice)
  if (cands.length === 1) return cands[0].seq
  const scored = cands.map((x) => ({ ...x, score: evaluate(x.after, c) })).sort((a, b) => b.score - a.score)

  if (level.lookahead) {
    const o = other(c)
    const top = scored.slice(0, 8)
    let best = top[0]
    let bestVal = -Infinity
    for (const cand of top) {
      let sum = 0
      for (const [a, b, w] of ROLLS) sum -= bestReply(cand.after, o, [a, b]) * w
      const v = sum / 36
      if (v > bestVal) {
        bestVal = v
        best = cand
      }
    }
    return best.seq
  }

  if (rand() < level.randomness) {
    const pool = scored.slice(0, Math.min(level.pool, scored.length))
    return pool[Math.floor(rand() * pool.length)].seq
  }
  return scored[0].seq
}
