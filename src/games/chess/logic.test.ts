import { describe, expect, it } from 'vitest'
import { apply, initialState, outcome, track, turn, undo, type ChessState } from './logic'

function play(...moves: string[]): ChessState {
  let s = initialState()
  for (const m of moves) {
    const next = apply(s, m)
    if (!next) throw new Error(`ilegal: ${m}`)
    s = next
  }
  return s
}

describe('ajedrez', () => {
  it('empiezan blancas y alterna el turno', () => {
    expect(turn(initialState())).toBe(0)
    expect(turn(play('e2e4'))).toBe(1)
  })

  it('rechaza jugadas ilegales y basura', () => {
    expect(apply(initialState(), 'e2e5')).toBeNull()
    expect(apply(initialState(), 'hola')).toBeNull()
    expect(apply(initialState(), 42 as unknown as string)).toBeNull()
  })

  it('detecta mate del pastor', () => {
    const s = play('e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7')
    expect(outcome(s)).toEqual({ winner: 0, reason: 'Jaque mate' })
  })

  it('deshacer quita la última jugada', () => {
    expect(undo(play('e2e4', 'e7e5')).moves).toEqual(['e2e4'])
  })

  it('el seguimiento conserva el id de la pieza y mueve la torre al enrocar', () => {
    const s = play('e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1')
    const t = track(s)
    const king = t.pieces.find((p) => p.id === 'wk-e1')
    const rook = t.pieces.find((p) => p.id === 'wr-h1')
    expect(king?.square).toBe('g1')
    expect(rook?.square).toBe('f1')
    expect(t.pieces).toHaveLength(32)
  })

  it('registra la captura al paso', () => {
    const s = play('e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6')
    const t = track(s)
    expect(t.lastCaptured?.id).toBe('bp-d7')
    expect(t.pieces).toHaveLength(31)
  })

  it('la coronación cambia el tipo pero no el id', () => {
    const s = play('h2h4', 'g7g5', 'h4g5', 'h7h6', 'g5h6', 'f8g7', 'h6g7', 'a7a6', 'g7h8q')
    const promoted = track(s).pieces.find((p) => p.id === 'wp-h2')
    expect(promoted).toMatchObject({ type: 'q', square: 'h8' })
  })

  it('la caché se recupera al volver a una partida anterior', () => {
    play('e2e4', 'e7e5', 'g1f3')
    const other = play('d2d4')
    expect(turn(other)).toBe(1)
    expect(apply(other, 'd7d5')).not.toBeNull()
  })
})
