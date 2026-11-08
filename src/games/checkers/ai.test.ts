import { describe, expect, it } from 'vitest'
import { analyse, choose, CHECKERS_LEVELS, evaluate } from './ai'
import { initialBoard, legalSteps, moveToString, sqIndex, type Board } from './logic'

function empty(): Board {
  return Array(64).fill(null)
}
function put(b: Board, sq: string, color: 'w' | 'b', king = false) {
  b[sqIndex(sq)] = { color, king }
}
const best = (b: Board, c: 'w' | 'b', depth = 4) => moveToString(analyse(b, c, { maxDepth: depth, timeMs: 2000 }).scored[0].step.path)

describe('motor de damas', () => {
  it('la posición inicial está equilibrada', () => {
    expect(evaluate(initialBoard(), 'w')).toBe(0)
  })

  it('siempre devuelve una jugada legal', () => {
    const b = initialBoard()
    const legal = legalSteps(b, 'w').map((s) => moveToString(s.path))
    expect(legal).toContain(best(b, 'w'))
  })

  it('no regala una ficha: evita la casilla donde la capturan', () => {
    const b = empty()
    put(b, 'c3', 'w')
    put(b, 'a1', 'w')
    put(b, 'e5', 'b')
    // c3-d4 deja la ficha a tiro de e5 (e5×c3). c3-b4 es segura.
    expect(best(b, 'w')).toBe('c3-b4')
  })

  it('prefiere coronar cuando puede', () => {
    const b = empty()
    put(b, 'b7', 'w')
    put(b, 'h2', 'w')
    put(b, 'h8', 'b')
    expect(best(b, 'w')).toBe('b7-a8')
  })

  it('respeta el límite de tiempo aunque se pida mucha profundidad', () => {
    const t0 = performance.now()
    const r = analyse(initialBoard(), 'w', { maxDepth: 30, timeMs: 300 })
    expect(performance.now() - t0).toBeLessThan(1500)
    expect(r.depth).toBeGreaterThanOrEqual(3)
  })

  it('los niveles altos no usan azar y el aprendiz sí', () => {
    const scored = [{ step: { path: [1, 2], captured: [] }, score: 10 }, { step: { path: [3, 4], captured: [] }, score: 0 }]
    expect(choose(scored, CHECKERS_LEVELS[5], () => 0)).toBe(scored[0].step)
    expect(choose(scored, CHECKERS_LEVELS[0], () => 0.9)).toBe(scored[0].step) // 0.9 ≥ 0.6: juega la mejor
    const seq = [0.1, 0.99]
    expect(choose(scored, CHECKERS_LEVELS[0], () => seq.shift()!)).toBe(scored[1].step)
  })
})
