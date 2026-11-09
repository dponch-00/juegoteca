/*
 * Sudoku: generador con solución única, calificador por técnicas humanas y pistas que explican.
 * El tablero es un arreglo de 81 números (0 = vacía), fila por fila.
 */

/* ---------- Geometría ---------- */

export const rowOf = (i: number) => (i / 9) | 0
export const colOf = (i: number) => i % 9
export const boxOf = (i: number) => ((i / 27) | 0) * 3 + (((i % 9) / 3) | 0)

/** 27 unidades: filas 0–8, columnas 9–17, bloques 18–26. */
export const UNITS: number[][] = []
for (let r = 0; r < 9; r++) UNITS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c))
for (let c = 0; c < 9; c++) UNITS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c))
for (let b = 0; b < 9; b++) {
  const r0 = ((b / 3) | 0) * 3
  const c0 = (b % 3) * 3
  UNITS.push(Array.from({ length: 9 }, (_, k) => (r0 + ((k / 3) | 0)) * 9 + c0 + (k % 3)))
}
export type UnitKind = 'row' | 'col' | 'box'
export const unitKind = (u: number): UnitKind => (u < 9 ? 'row' : u < 18 ? 'col' : 'box')
/** Unidades de cada casilla: [fila, columna, bloque]. */
export const UNITS_OF: number[][] = Array.from({ length: 81 }, (_, i) => [rowOf(i), 9 + colOf(i), 18 + boxOf(i)])
/** Las 20 casillas que comparten fila, columna o bloque con cada una. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const set = new Set<number>()
  for (const u of UNITS_OF[i]) for (const j of UNITS[u]) if (j !== i) set.add(j)
  return [...set]
})

/* ---------- Máscaras de candidatos (bit d-1 = dígito d) ---------- */

export const ALL = 0x1ff
export const bit = (d: number) => 1 << (d - 1)
export function popcount(m: number): number {
  let n = 0
  while (m) {
    m &= m - 1
    n++
  }
  return n
}
export function digitsOf(m: number): number[] {
  const out: number[] = []
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d)
  return out
}
const lowDigit = (m: number) => 31 - Math.clz32(m & -m) + 1

export function parse(s: string): number[] {
  return Array.from(s, (ch) => (ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0))
}
export function stringify(g: number[]): string {
  return g.join('')
}

/* ---------- Azar con semilla (el reto del día debe salir igual en todos lados) ---------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/* ---------- Resolver por fuerza bruta (unicidad y tablero lleno) ---------- */

/**
 * Busca soluciones con máscaras y "casilla más restringida primero".
 * Devuelve cuántas encontró (hasta `limit`) y la primera.
 */
function search(grid: number[], limit: number, rng?: () => number): { count: number; first: number[] | null } {
  const g = grid.slice()
  const rows = new Array(9).fill(0)
  const cols = new Array(9).fill(0)
  const boxes = new Array(9).fill(0)
  for (let i = 0; i < 81; i++) {
    const d = g[i]
    if (!d) continue
    const b = bit(d)
    const r = rowOf(i)
    const c = colOf(i)
    const x = boxOf(i)
    if (rows[r] & b || cols[c] & b || boxes[x] & b) return { count: 0, first: null }
    rows[r] |= b
    cols[c] |= b
    boxes[x] |= b
  }
  let count = 0
  let first: number[] | null = null

  const rec = (): boolean => {
    let best = -1
    let bestMask = 0
    let bestN = 10
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue
      const m = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)])
      const n = popcount(m)
      if (n === 0) return false
      if (n < bestN) {
        best = i
        bestMask = m
        bestN = n
        if (n === 1) break
      }
    }
    if (best < 0) {
      count++
      if (!first) first = g.slice()
      return count >= limit
    }
    const r = rowOf(best)
    const c = colOf(best)
    const x = boxOf(best)
    const ds = digitsOf(bestMask)
    if (rng) shuffle(ds, rng)
    for (const d of ds) {
      const b = bit(d)
      g[best] = d
      rows[r] |= b
      cols[c] |= b
      boxes[x] |= b
      const stop = rec()
      g[best] = 0
      rows[r] &= ~b
      cols[c] &= ~b
      boxes[x] &= ~b
      if (stop) return true
    }
    return false
  }
  rec()
  return { count, first }
}

export function countSolutions(grid: number[], limit = 2): number {
  return search(grid, limit).count
}
export function solve(grid: number[]): number[] | null {
  return search(grid, 1).first
}
function fillRandom(rng: () => number): number[] {
  return search(new Array(81).fill(0), 1, rng).first!
}

/* ---------- Resolver "humano": candidatos y técnicas ---------- */

export function candidates(values: number[]): number[] {
  return values.map((v, i) => {
    if (v) return 0
    let m = ALL
    for (const p of PEERS[i]) if (values[p]) m &= ~bit(values[p])
    return m
  })
}

export interface Single {
  cell: number
  digit: number
  /** 'naked': a la casilla solo le queda ese número. Si no, la unidad donde el número solo cabe ahí. */
  kind: UnitKind | 'naked'
}

/** El siguiente "único" más fácil de ver: primero en bloques, luego filas y columnas, luego casilla. */
export function findSingle(values: number[], cand: number[]): Single | null {
  for (const order of [18, 0, 9]) {
    for (let u = order; u < order + 9; u++) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d)
        let at = -1
        let n = 0
        for (const i of UNITS[u]) {
          if (values[i] === d) {
            n = 2
            break
          }
          if (cand[i] & b) {
            at = i
            n++
          }
        }
        if (n === 1) return { cell: at, digit: d, kind: unitKind(u) }
      }
    }
  }
  for (let i = 0; i < 81; i++) if (!values[i] && popcount(cand[i]) === 1) return { cell: i, digit: lowDigit(cand[i]), kind: 'naked' }
  return null
}

function place(values: number[], cand: number[], i: number, d: number) {
  values[i] = d
  cand[i] = 0
  for (const p of PEERS[i]) cand[p] &= ~bit(d)
}

/** Técnicas de nivel 2: bloqueo de candidatos, pares/tríos desnudos y pares ocultos. Devuelve si quitó algo. */
function eliminate(cand: number[], values: number[]): boolean {
  // Bloqueo: en un bloque el dígito solo está en una fila/columna (o al revés).
  for (let u = 0; u < 27; u++) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d)
      const at = UNITS[u].filter((i) => cand[i] & b)
      if (at.length < 2) continue
      const targets: number[] = []
      if (u >= 18) {
        if (at.every((i) => rowOf(i) === rowOf(at[0]))) targets.push(rowOf(at[0]))
        if (at.every((i) => colOf(i) === colOf(at[0]))) targets.push(9 + colOf(at[0]))
      } else if (at.every((i) => boxOf(i) === boxOf(at[0]))) targets.push(18 + boxOf(at[0]))
      let changed = false
      for (const t of targets)
        for (const i of UNITS[t])
          if (!UNITS[u].includes(i) && cand[i] & b) {
            cand[i] &= ~b
            changed = true
          }
      if (changed) return true
    }
  }
  // Pares y tríos desnudos.
  for (let u = 0; u < 27; u++) {
    const open = UNITS[u].filter((i) => !values[i] && popcount(cand[i]) <= 3)
    for (let a = 0; a < open.length; a++) {
      for (let b2 = a + 1; b2 < open.length; b2++) {
        const pair = cand[open[a]] | cand[open[b2]]
        if (popcount(pair) === 2 && strip(cand, UNITS[u], [open[a], open[b2]], pair)) return true
        for (let c = b2 + 1; c < open.length; c++) {
          const tri = pair | cand[open[c]]
          if (popcount(tri) === 3 && strip(cand, UNITS[u], [open[a], open[b2], open[c]], tri)) return true
        }
      }
    }
  }
  // Pares ocultos: dos dígitos que solo caben en las mismas dos casillas.
  for (let u = 0; u < 27; u++) {
    const where: number[][] = [[]]
    for (let d = 1; d <= 9; d++) where.push(UNITS[u].filter((i) => cand[i] & bit(d)))
    for (let d1 = 1; d1 <= 9; d1++) {
      if (where[d1].length !== 2) continue
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const w = where[d2]
        if (w.length === 2 && w[0] === where[d1][0] && w[1] === where[d1][1]) {
          const keep = bit(d1) | bit(d2)
          let changed = false
          for (const i of w)
            if (cand[i] & ~keep) {
              cand[i] &= keep
              changed = true
            }
          if (changed) return true
        }
      }
    }
  }
  return false
}
function strip(cand: number[], unit: number[], keep: number[], mask: number): boolean {
  let changed = false
  for (const i of unit)
    if (!keep.includes(i) && cand[i] & mask) {
      cand[i] &= ~mask
      changed = true
    }
  return changed
}

/** 1 = se resuelve solo con "únicos"; 2 = necesita bloqueos o pares; 3 = necesita técnicas más avanzadas. */
export type Tier = 1 | 2 | 3
export function grade(puzzle: number[]): Tier {
  const values = puzzle.slice()
  const cand = candidates(values)
  let tier: Tier = 1
  for (;;) {
    if (!values.includes(0)) return tier
    const s = findSingle(values, cand)
    if (s) {
      place(values, cand, s.cell, s.digit)
      continue
    }
    if (eliminate(cand, values)) {
      tier = 2
      continue
    }
    return 3
  }
}

/* ---------- Niveles y generador ---------- */

export interface SudokuLevel {
  id: number
  name: string
  blurb: string
  tier: Tier
  /** No quitar más pistas que esto (0 = quitar todas las que se pueda). */
  minGivens: number
}

export const SUDOKU_LEVELS: SudokuLevel[] = [
  { id: 1, name: 'Fácil', blurb: 'Muchas pistas. Para calentar.', tier: 1, minGivens: 38 },
  { id: 2, name: 'Medio', blurb: 'Menos pistas, pero sin trucos.', tier: 1, minGivens: 30 },
  { id: 3, name: 'Difícil', blurb: 'Pide descartar con pares y bloques.', tier: 2, minGivens: 0 },
  { id: 4, name: 'Experto', blurb: 'Para quien domina las técnicas.', tier: 3, minGivens: 0 },
]
export const getLevel = (id: number) => SUDOKU_LEVELS.find((l) => l.id === id) ?? SUDOKU_LEVELS[0]

/** Quita pistas en pares simétricos mientras la solución siga siendo única. */
function carve(solution: number[], rng: () => number, minGivens: number): number[] {
  const g = solution.slice()
  let givens = 81
  for (const i of shuffle(Array.from({ length: 41 }, (_, k) => k), rng)) {
    const j = 80 - i
    const cost = i === j ? 1 : 2
    if (givens - cost < minGivens) continue
    const a = g[i]
    const b = g[j]
    g[i] = 0
    g[j] = 0
    if (countSolutions(g) === 1) givens -= cost
    else {
      g[i] = a
      g[j] = b
    }
  }
  return g
}

export interface Generated {
  puzzle: string
  solution: string
}

/** Genera un sudoku del nivel pedido. Con la misma semilla sale el mismo. */
export function generate(levelId: number, seed: number): Generated {
  const level = getLevel(levelId)
  const rng = mulberry32(seed)
  let fallback: { g: number[]; s: number[]; tier: Tier } | null = null
  for (let attempt = 0; attempt < 400; attempt++) {
    const s = fillRandom(rng)
    const g = carve(s, rng, level.minGivens)
    const tier = grade(g)
    if (tier === level.tier) return { puzzle: stringify(g), solution: stringify(s) }
    // Si el nivel exacto tarda demasiado, nos quedamos con el más parecido (nunca uno más difícil).
    if (tier < level.tier && (!fallback || tier > fallback.tier)) fallback = { g, s, tier }
  }
  return { puzzle: stringify(fallback!.g), solution: stringify(fallback!.s) }
}

/** Semilla del reto del día (YYYY-MM-DD en hora local). */
export function dailySeed(date: string): number {
  let h = 2166136261
  for (const ch of `juegoteca-sudoku-${date}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
/** Nivel del reto del día: Medio entre semana, Difícil el fin de semana. */
export function dailyLevel(date: string): number {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day === 0 || day === 5 || day === 6 ? 3 : 2
}
export function todayKey(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}
