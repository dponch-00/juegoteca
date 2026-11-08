import { describe, expect, it } from 'vitest'
import { apply, applyStep, initialPos, legalSequences, outcome, outcomeOf, pips, position, rollToString, seqToString, singleSteps, takeback, turn, undo, type BackgammonState, type Pos } from './logic'

function empty(): Pos {
  return { points: Array(26).fill(0), bar: { w: 0, b: 0 }, off: { w: 0, b: 0 }, turn: 'w', dice: null }
}
const keys = (seqs: ReturnType<typeof legalSequences>) => seqs.map((s) => s.map((x) => `${x.from}/${x.to}`).join(',')).sort()

function play(...m: string[]): BackgammonState {
  let s: BackgammonState = { moves: [] }
  for (const x of m) {
    const n = apply(s, x)
    if (!n) throw new Error(`ilegal: ${x}`)
    s = n
  }
  return s
}

describe('backgammon', () => {
  it('posición inicial: 15 fichas por bando y 167 pips', () => {
    const p = initialPos()
    expect(p.points.filter((x) => x > 0).reduce((a, b) => a + b, 0)).toBe(15)
    expect(-p.points.filter((x) => x < 0).reduce((a, b) => a + b, 0)).toBe(15)
    expect(pips(p, 'w')).toBe(167)
    expect(pips(p, 'b')).toBe(167)
  })

  it('primero se tira y luego se mueve; luego le toca al otro', () => {
    let s = play('r:3,1')
    expect(turn(s)).toBe(0)
    s = play('r:3,1', 'm:8/5,6/5')
    expect(turn(s)).toBe(1)
    expect(position(s).points[5]).toBe(2)
  })

  it('no se puede mover sin tirar ni tirar dos veces', () => {
    expect(apply({ moves: [] }, 'm:8/5,6/5')).toBeNull()
    expect(apply(play('r:3,1'), 'r:2,2')).toBeNull()
    expect(apply({ moves: [] }, 'r:7,1')).toBeNull()
    expect(rollToString([4, 2])).toBe('r:4,2')
  })

  it('dobles: cuatro jugadas', () => {
    const seqs = legalSequences(initialPos(), 'w', [6, 6])
    expect(seqs.every((s) => s.length === 4)).toBe(true)
  })

  it('no se puede caer en una punta con dos o más rivales', () => {
    // Blancas en 24 con un 5: 19 tiene 5 negras.
    expect(singleSteps(initialPos(), 'w', 5).some((s) => s.from === 24 && s.to === 19)).toBe(false)
  })

  it('golpear una ficha sola la manda a la barra', () => {
    const p = empty()
    p.points[10] = 1
    p.points[7] = -1
    const after = applyStep(p, 'w', { from: 10, to: 7, die: 3 })
    expect(after.points[7]).toBe(1)
    expect(after.bar.b).toBe(1)
    expect(keys(legalSequences(p, 'w', [3, 1]))).toContain('10/7,7/6')
  })

  it('con fichas en la barra hay que entrar primero', () => {
    const p = empty()
    p.bar.w = 1
    p.points[13] = 2
    const steps = singleSteps(p, 'w', 3)
    expect(steps).toEqual([{ from: 25, to: 22, die: 3 }])
  })

  it('si solo se puede usar un dado, debe ser el mayor', () => {
    const p = empty()
    p.points[3] = 1 // blancas: con 6 y 2 no pueden usar ambos (bloqueos)
    p.points[1] = -2 // 3-2 = 1 bloqueado
    // Todas en casa → con 6 saca la ficha; con 2 cae en 1 (bloqueado).
    const seqs = legalSequences(p, 'w', [6, 2])
    expect(keys(seqs)).toEqual(['3/0'])
  })

  it('sacar fichas: exacto, o mayor si no hay fichas más lejos', () => {
    const p = empty()
    p.points[4] = 1
    p.points[2] = 1
    expect(singleSteps(p, 'w', 6).map((s) => `${s.from}/${s.to}`)).toEqual(['4/0'])
    expect(singleSteps(p, 'w', 2).map((s) => `${s.from}/${s.to}`).sort()).toEqual(['2/0', '4/2'])
  })

  it('no se sacan fichas si alguna está fuera de casa', () => {
    const p = empty()
    p.points[2] = 1
    p.points[9] = 1
    expect(singleSteps(p, 'w', 2).some((s) => s.to === 0)).toBe(false)
  })

  it('sin jugadas posibles se pasa con "m:"', () => {
    const p = empty()
    p.bar.w = 1
    for (const i of [19, 20, 21, 22, 23, 24]) p.points[i] = -2
    expect(legalSequences(p, 'w', [3, 4])).toEqual([[]])
    expect(seqToString([])).toBe('m:')
  })

  it('deshacer quita la jugada pero conserva los dados; takeback vuelve a mi tirada', () => {
    const s = play('r:3,1', 'm:8/5,6/5', 'r:6,4')
    expect(undo(s).moves).toEqual(['r:3,1'])
    expect(takeback(s, 0).moves).toEqual(['r:3,1'])
  })

  it('gana quien saca sus 15 fichas: normal, gammon y backgammon', () => {
    expect(outcome({ moves: [] })).toBeNull()
    const p = empty()
    p.off.w = 15
    p.off.b = 3
    p.points[20] = -12
    expect(outcomeOf(p)).toEqual({ winner: 0, reason: 'Todas sus fichas fuera' })
    p.off.b = 0
    p.points[20] = -15
    expect(outcomeOf(p)?.reason).toMatch(/^Gammon/)
    p.points[20] = -14
    p.points[3] = -1 // una negra en la casa de blancas
    expect(outcomeOf(p)?.reason).toMatch(/^Backgammon/)
  })
})
