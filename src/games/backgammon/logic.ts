import type { Outcome, Seat } from '../../core/types'

/*
 * Backgammon (reglas estándar, sin cubo de doblar).
 *
 * Puntas 1..24 numeradas desde el punto de vista de BLANCAS:
 * - Blancas mueven de 24 hacia 1; su casa es 1..6. Barra = 25, fuera = 0.
 * - Negras mueven de 1 hacia 24; su casa es 19..24. Barra = 0, fuera = 25.
 * `points[p]` > 0 = fichas blancas, < 0 = fichas negras.
 *
 * Cada turno son dos entradas en la partida:
 *   "r:3,5"           → tirada de dados
 *   "m:24/21,13/8"    → jugadas (vacío "m:" si no hay ninguna posible)
 * Hay que usar el máximo de dados posible; si solo cabe uno, el mayor.
 * Empiezan las blancas (simplificación: sin tirada inicial).
 */

export type Color = 'w' | 'b'
export type BackgammonMove = string
export interface BackgammonState {
  moves: BackgammonMove[]
}

export interface Pos {
  points: number[] // índice 0..25; se usan 1..24
  bar: Record<Color, number>
  off: Record<Color, number>
  turn: Color
  /** Dados de la tirada actual (null = toca tirar). */
  dice: number[] | null
}

export interface Step {
  from: number
  to: number
  die: number
}

export const BAR: Record<Color, number> = { w: 25, b: 0 }
export const OFF: Record<Color, number> = { w: 0, b: 25 }
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w')
const sign = (c: Color) => (c === 'w' ? 1 : -1)

export function initialPos(): Pos {
  const points = Array(26).fill(0)
  points[24] = 2
  points[13] = 5
  points[8] = 3
  points[6] = 5
  points[1] = -2
  points[12] = -5
  points[17] = -3
  points[19] = -5
  return { points, bar: { w: 0, b: 0 }, off: { w: 0, b: 0 }, turn: 'w', dice: null }
}

export const initialState = (): BackgammonState => ({ moves: [] })

function clone(p: Pos): Pos {
  return { points: p.points.slice(), bar: { ...p.bar }, off: { ...p.off }, turn: p.turn, dice: p.dice && p.dice.slice() }
}

export const countAt = (p: Pos, point: number, c: Color) => Math.max(0, p.points[point] * sign(c))

/** ¿Están todas las fichas de `c` en su casa (o ya fuera)? */
export function allHome(p: Pos, c: Color): boolean {
  if (p.bar[c] > 0) return false
  for (let i = 1; i <= 24; i++) {
    if (countAt(p, i, c) > 0 && !(c === 'w' ? i <= 6 : i >= 19)) return false
  }
  return true
}

/** Jugadas simples de una ficha con un dado. */
export function singleSteps(p: Pos, c: Color, die: number): Step[] {
  const out: Step[] = []
  const dir = c === 'w' ? -1 : 1
  const open = (to: number) => p.points[to] * sign(c) >= -1 // vacía, propia o una sola rival
  if (p.bar[c] > 0) {
    const to = BAR[c] + dir * die
    if (open(to)) out.push({ from: BAR[c], to, die })
    return out // con fichas en la barra no se mueve nada más
  }
  const home = allHome(p, c)
  for (let from = 1; from <= 24; from++) {
    if (countAt(p, from, c) === 0) continue
    const to = from + dir * die
    if (to >= 1 && to <= 24) {
      if (open(to)) out.push({ from, to, die })
    } else if (home) {
      // Sacar ficha: con el número exacto, o con uno mayor si no hay fichas más lejos.
      const exact = to === OFF[c]
      const farther = c === 'w' ? [...range(from + 1, 6)] : [...range(19, from - 1)]
      if (exact || farther.every((q) => countAt(p, q, c) === 0)) out.push({ from, to: OFF[c], die })
    }
  }
  return out
}

function* range(a: number, b: number) {
  for (let i = a; i <= b; i++) yield i
}

export function applyStep(p: Pos, c: Color, s: Step): Pos {
  const q = clone(p)
  if (s.from === BAR[c]) q.bar[c]--
  else q.points[s.from] -= sign(c)
  if (s.to === OFF[c]) q.off[c]++
  else {
    if (q.points[s.to] * sign(c) === -1) {
      // Golpe: la ficha rival va a la barra.
      q.points[s.to] = 0
      q.bar[other(c)]++
    }
    q.points[s.to] += sign(c)
  }
  return q
}

const seqKey = (seq: Step[]) => seq.map((s) => `${s.from}/${s.to}`).join(',')

/**
 * Todas las secuencias legales para la tirada (ordenadas como se juegan).
 * Aplica: máximo de dados posible y, si solo se puede usar uno, el mayor.
 */
export function legalSequences(p: Pos, c: Color, dice: number[]): Step[][] {
  const all = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : dice.slice()
  const found = new Map<string, Step[]>()
  let maxLen = 0

  const dfs = (pos: Pos, remaining: number[], seq: Step[]) => {
    let moved = false
    const tried = new Set<number>()
    for (let i = 0; i < remaining.length; i++) {
      const d = remaining[i]
      if (tried.has(d)) continue
      tried.add(d)
      for (const s of singleSteps(pos, c, d)) {
        moved = true
        dfs(applyStep(pos, c, s), [...remaining.slice(0, i), ...remaining.slice(i + 1)], [...seq, s])
      }
    }
    if (!moved) {
      if (seq.length > maxLen) {
        maxLen = seq.length
        found.clear()
      }
      if (seq.length === maxLen) found.set(seqKey(seq), seq)
    }
  }
  dfs(p, all, [])

  let seqs = [...found.values()]
  if (maxLen === 1 && dice[0] !== dice[1]) {
    const big = Math.max(...dice)
    if (seqs.some((s) => s[0].die === big)) seqs = seqs.filter((s) => s[0].die === big)
  }
  return maxLen === 0 ? [[]] : seqs
}

/* ---------- Texto de las jugadas ---------- */

export const rollToString = (d: number[]) => `r:${d[0]},${d[1]}`
export const seqToString = (seq: Step[]) => `m:${seqKey(seq)}`

/* ---------- Reproducir la partida ---------- */

let cached: { moves: string[]; pos: Pos; hist: HistEntry[] } | null = null

export interface HistEntry {
  color: Color
  dice?: number[]
  seq?: Step[]
  /** Posición antes de esta entrada. */
  before: Pos
}

export function replay(state: BackgammonState): { pos: Pos; hist: HistEntry[] } {
  const m = state.moves
  let start = 0
  let pos = initialPos()
  let hist: HistEntry[] = []
  if (cached && cached.moves.length <= m.length && cached.moves.every((x, i) => x === m[i])) {
    start = cached.moves.length
    pos = cached.pos
    hist = cached.hist
  }
  for (let i = start; i < m.length; i++) {
    const next = step(pos, m[i])
    if (!next) throw new Error(`Jugada inválida: ${m[i]}`)
    hist = [...hist, { color: pos.turn, before: pos, ...next.entry }]
    pos = next.pos
  }
  cached = { moves: m.slice(), pos, hist }
  return { pos, hist }
}

export const position = (s: BackgammonState) => replay(s).pos

function step(pos: Pos, move: string): { pos: Pos; entry: { dice?: number[]; seq?: Step[] } } | null {
  if (typeof move !== 'string') return null
  if (move.startsWith('r:')) {
    if (pos.dice) return null
    const d = move.slice(2).split(',').map(Number)
    if (d.length !== 2 || !d.every((x) => Number.isInteger(x) && x >= 1 && x <= 6)) return null
    return { pos: { ...clone(pos), dice: d }, entry: { dice: d } }
  }
  if (move.startsWith('m:')) {
    if (!pos.dice) return null
    const seqs = legalSequences(pos, pos.turn, pos.dice)
    const key = move.slice(2)
    const seq = seqs.find((s) => seqKey(s) === key)
    if (!seq) return null
    let p = pos
    for (const s of seq) p = applyStep(p, pos.turn, s)
    p = { ...clone(p), dice: null, turn: other(pos.turn) }
    return { pos: p, entry: { seq } }
  }
  return null
}

/* ---------- Contrato GameDef ---------- */

export function apply(state: BackgammonState, move: BackgammonMove): BackgammonState | null {
  const { pos } = replay(state)
  if (outcomeOf(pos)) return null
  return step(pos, move) ? { moves: [...state.moves, move] } : null
}

export function turn(state: BackgammonState): Seat {
  return position(state).turn === 'w' ? 0 : 1
}

export function outcomeOf(p: Pos): Outcome | null {
  for (const c of ['w', 'b'] as Color[]) {
    if (p.off[c] < 15) continue
    const loser = other(c)
    const winner: Seat = c === 'w' ? 0 : 1
    if (p.off[loser] > 0) return { winner, reason: 'Todas sus fichas fuera' }
    const inWinnersHome = c === 'w' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24]
    const backgammon = p.bar[loser] > 0 || inWinnersHome.some((i) => countAt(p, i, loser) > 0)
    return { winner, reason: backgammon ? 'Backgammon (victoria triple)' : 'Gammon (victoria doble)' }
  }
  return null
}

export const outcome = (s: BackgammonState) => outcomeOf(position(s))

/**
 * Deshacer: quita la última jugada de fichas sin volver a tirar.
 * Si lo último fue una tirada, vuelve a la elección de jugadas del turno anterior.
 */
export function undo(state: BackgammonState): BackgammonState {
  const m = state.moves.slice()
  if (m.length === 0) return state
  if (m[m.length - 1].startsWith('r:')) m.pop()
  if (m.length && m[m.length - 1].startsWith('m:')) m.pop()
  return { moves: m }
}

/** Contra la computadora: vuelve a la tirada propia más reciente (conservando los dados). */
export function takeback(state: BackgammonState, seat: Seat): BackgammonState {
  const { hist } = replay(state)
  const me: Color = seat === 0 ? 'w' : 'b'
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].color === me && hist[i].dice && i < hist.length - 1) return { moves: state.moves.slice(0, i + 1) }
  }
  return state
}

/** Pips: lo que le falta a cada bando para sacar todas sus fichas. */
export function pips(p: Pos, c: Color): number {
  let total = p.bar[c] * 25
  for (let i = 1; i <= 24; i++) total += countAt(p, i, c) * (c === 'w' ? i : 25 - i)
  return total
}

export function rollDice(rand: () => number = secureRandom): number[] {
  return [1 + Math.floor(rand() * 6), 1 + Math.floor(rand() * 6)]
}

function secureRandom(): number {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] / 2 ** 32
}
