import { describe, expect, it } from 'vitest'
import { parseBestMove, parseInfo, scoreValue } from './uci'
import { LEVELS, pickMove } from './levels'
import { accuracy, classify, reviewMoves } from '../review'
import { toSpanishSan, moveNumberLabel } from '../notation'

describe('UCI', () => {
  it('lee profundidad, multipv, puntuación y variante', () => {
    const l = parseInfo('info depth 12 seldepth 18 multipv 2 score cp -34 nodes 9000 nps 1 pv e7e5 g1f3 b8c6')
    expect(l).toEqual({ depth: 12, multipv: 2, score: { cp: -34 }, pv: ['e7e5', 'g1f3', 'b8c6'] })
  })
  it('lee mates y cotas', () => {
    expect(parseInfo('info depth 5 score mate 3 pv d1h5')?.score).toEqual({ mate: 3 })
    expect(parseInfo('info depth 5 score cp 20 lowerbound pv e2e4')?.score).toEqual({ cp: 20 })
  })
  it('ignora líneas sin variante', () => {
    expect(parseInfo('info string NNUE evaluation enabled')).toBeNull()
    expect(parseInfo('info depth 1 currmove e2e4 currmovenumber 1')).toBeNull()
  })
  it('lee bestmove', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4')
    expect(parseBestMove('bestmove (none)')).toBeNull()
  })
  it('ordena mates por encima de cualquier ventaja material', () => {
    expect(scoreValue({ mate: 2 })).toBeGreaterThan(scoreValue({ mate: 5 }))
    expect(scoreValue({ mate: 5 })).toBeGreaterThan(scoreValue({ cp: 3000 }))
    expect(scoreValue({ mate: -1 })).toBeLessThan(scoreValue({ cp: -3000 }))
  })
})

describe('niveles', () => {
  it('van del 1 al 8 con fuerza creciente', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].skill).toBeGreaterThanOrEqual(LEVELS[i - 1].skill)
  })
  it('sin azar elige la mejor; con azar puede elegir otra', () => {
    const c = ['a', 'b', 'c']
    expect(pickMove(c, LEVELS[7])).toBe('a')
    expect(pickMove(c, LEVELS[0], () => 0)).toBe('a') // rand=0 < randomness → azar, primer peso
    const seq = [0, 0.99]
    expect(pickMove(c, LEVELS[0], () => seq.shift()!)).toBe('c')
  })
})

describe('repaso', () => {
  it('clasifica por pérdida', () => {
    expect(classify(0, false)).toBe('best')
    expect(classify(40, false)).toBe('good')
    expect(classify(100, false)).toBe('inaccuracy')
    expect(classify(200, false)).toBe('mistake')
    expect(classify(500, false)).toBe('blunder')
    expect(classify(500, true)).toBe('best')
  })
  it('revisa solo las jugadas del asiento pedido y con su signo', () => {
    // Blancas: +30 → juega → +20 (pierde 10); Negras: +20 → juega → +400 (pierden 380)
    const evals = [
      { value: 30, best: 'e2e4' },
      { value: 20, best: 'e7e5' },
      { value: 400, best: 'g1f3' },
    ]
    const w = reviewMoves(['d2d4', 'f7f6'], evals, 0)
    expect(w).toHaveLength(1)
    expect(w[0]).toMatchObject({ ply: 0, loss: 10, verdict: 'best' })
    const b = reviewMoves(['d2d4', 'f7f6'], evals, 1)
    expect(b[0]).toMatchObject({ ply: 1, loss: 380, verdict: 'blunder', best: 'e7e5' })
    expect(accuracy(w)).toBeGreaterThan(accuracy(b))
  })
})

describe('notación', () => {
  it('traduce piezas al español', () => {
    expect(toSpanishSan('Nf3')).toBe('Cf3')
    expect(toSpanishSan('Bxe5+')).toBe('Axe5+')
    expect(toSpanishSan('exd8=Q#')).toBe('exd8=D#')
    expect(toSpanishSan('O-O-O')).toBe('O-O-O')
    expect(toSpanishSan('Kxh2')).toBe('Rxh2')
    expect(toSpanishSan('Rae1')).toBe('Tae1')
  })
  it('numera jugadas', () => {
    expect(moveNumberLabel(0)).toBe('1.')
    expect(moveNumberLabel(1)).toBe('1…')
    expect(moveNumberLabel(4)).toBe('3.')
  })
})
