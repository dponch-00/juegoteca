import { describe, expect, it } from 'vitest'
import { BACKGAMMON_LEVELS, chooseSequence, evaluate, isContact } from './ai'
import { initialPos, legalSequences, type Pos } from './logic'

function empty(turn: 'w' | 'b' = 'w', dice: number[] | null = null): Pos {
  return { points: Array(26).fill(0), bar: { w: 0, b: 0 }, off: { w: 0, b: 0 }, turn, dice }
}
const key = (seq: { from: number; to: number }[]) => seq.map((s) => `${s.from}/${s.to}`).join(',')
const expert = BACKGAMMON_LEVELS[3]
const club = BACKGAMMON_LEVELS[2]

describe('motor de backgammon', () => {
  it('la posición inicial está equilibrada y hay contacto', () => {
    const p = initialPos()
    expect(evaluate(p, 'w')).toBe(evaluate(p, 'b'))
    expect(isContact(p)).toBe(true)
  })

  it('apertura 3-1: hace la punta 5 (la jugada clásica)', () => {
    const p = { ...initialPos(), dice: [3, 1] }
    expect(key(chooseSequence(p, club))).toMatch(/^(8\/5,6\/5|6\/5,8\/5)$/)
  })

  it('golpea una ficha sola cuando le conviene', () => {
    const p = empty('w', [4, 2])
    p.points[13] = 4
    p.points[6] = 5
    p.points[9] = -1 // ficha negra sola a tiro (13 → 9 con el 4)
    p.points[24] = -2
    const seq = chooseSequence(p, club)
    expect(seq.some((s) => s.to === 9)).toBe(true)
  })

  it('en carrera (sin contacto) solo cuentan los pips', () => {
    const p = empty('w')
    p.points[3] = 5
    p.points[20] = -5
    expect(isContact(p)).toBe(false)
  })

  it('el experto devuelve siempre una jugada legal', () => {
    const p = { ...initialPos(), dice: [6, 5] }
    const legal = legalSequences(p, 'w', [6, 5]).map(key)
    expect(legal).toContain(key(chooseSequence(p, expert)))
  })
})
