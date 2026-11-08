import { describe, expect, it } from 'vitest'
import { applyStep, initialBoard, legalSteps, moveToString, outcome, apply, sqIndex, track, turn, type Board, type CheckersState } from './logic'

function empty(): Board {
  return Array(64).fill(null)
}
function put(b: Board, sq: string, color: 'w' | 'b', king = false) {
  b[sqIndex(sq)] = { color, king }
}
const moves = (b: Board, c: 'w' | 'b') => legalSteps(b, c).map((s) => moveToString(s.path)).sort()

function play(...m: string[]): CheckersState {
  let s: CheckersState = { moves: [] }
  for (const x of m) {
    const n = apply(s, x)
    if (!n) throw new Error(`ilegal: ${x}`)
    s = n
  }
  return s
}

describe('damas clásicas', () => {
  it('posición inicial: 12 fichas por bando en casillas oscuras y 7 jugadas para blancas', () => {
    const b = initialBoard()
    expect(b.filter((p) => p?.color === 'w')).toHaveLength(12)
    expect(b.filter((p) => p?.color === 'b')).toHaveLength(12)
    expect(legalSteps(b, 'w')).toHaveLength(7)
  })

  it('alterna el turno', () => {
    expect(turn(play('c3-d4'))).toBe(1)
  })

  it('el peón solo avanza y no captura hacia atrás', () => {
    const b = empty()
    put(b, 'd4', 'w')
    put(b, 'c3', 'b') // detrás del peón blanco
    expect(moves(b, 'w')).toEqual(['d4-c5', 'd4-e5'])
  })

  it('la captura es obligatoria', () => {
    const b = empty()
    put(b, 'd4', 'w')
    put(b, 'a1', 'w')
    put(b, 'e5', 'b')
    expect(moves(b, 'w')).toEqual(['d4-f6'])
  })

  it('captura múltiple y ley de cantidad: obliga a la que captura más', () => {
    const b = empty()
    put(b, 'a3', 'w') // puede capturar 1
    put(b, 'b4', 'b')
    put(b, 'e3', 'w') // puede capturar 2: f4 y luego f6
    put(b, 'f4', 'b')
    put(b, 'f6', 'b')
    expect(moves(b, 'w')).toEqual(['e3-g5-e7'])
  })

  it('la dama vuela y captura a distancia, cayendo en cualquier casilla libre', () => {
    const b = empty()
    put(b, 'a1', 'w', true)
    put(b, 'd4', 'b')
    expect(moves(b, 'w')).toEqual(['a1-e5', 'a1-f6', 'a1-g7', 'a1-h8'])
  })

  it('no se salta dos veces la misma pieza', () => {
    const b = empty()
    put(b, 'a1', 'w', true)
    put(b, 'c3', 'b')
    const steps = legalSteps(b, 'w')
    for (const s of steps) expect(new Set(s.captured).size).toBe(s.captured.length)
  })

  it('el peón corona al llegar a la última fila', () => {
    const b = empty()
    put(b, 'b7', 'w')
    const after = applyStep(b, { path: [sqIndex('b7'), sqIndex('a8')], captured: [] })
    expect(after[sqIndex('a8')]).toEqual({ color: 'w', king: true })
  })

  it('una partida con capturas de ambos bandos se reproduce entera y sigue en juego', () => {
    const s = play('c3-d4', 'f6-e5', 'd4-f6', 'g7-e5', 'g3-f4', 'e5-g3', 'h2-f4')
    expect(s.moves).toHaveLength(7)
    expect(outcome(s)).toBeNull()
  })

  it('sin jugadas posibles: una ficha bloqueada no tiene movimientos', () => {
    const b = empty()
    put(b, 'a1', 'w')
    put(b, 'b2', 'b')
    put(b, 'c3', 'b') // b2 no se puede capturar porque c3 está ocupada
    expect(legalSteps(b, 'w')).toHaveLength(0)
  })

  it('rechaza jugadas ilegales y basura', () => {
    expect(apply({ moves: [] }, 'c3-c4')).toBeNull()
    expect(apply({ moves: [] }, 'hola')).toBeNull()
  })

  it('el seguimiento mantiene el id de la ficha y registra las capturas', () => {
    const s = play('c3-d4', 'f6-e5', 'd4-f6')
    const t = track(s)
    expect(t.pieces.find((p) => p.id === 'w-c3')?.square).toBe(sqIndex('f6'))
    expect(t.lastCaptured.map((p) => p.id)).toEqual(['b-f6'])
    expect(t.pieces.filter((p) => p.color === 'b')).toHaveLength(11)
  })
})
