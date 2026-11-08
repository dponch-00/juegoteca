import { describe, expect, it } from 'vitest'
import data from './puzzles.json'
import { parsePuzzle, playOpponent, revealStep, solverMoves, solverSeat, startAttempt, tryMove, type PuzzleTuple } from './puzzle'
import { apply } from '../logic'

// Reto real de la base de Lichess (CC0): mate en 1 para negras tras Dh5.
const MATE1: PuzzleTuple = ['0000H', 'r4rk1/pp3ppp/8/2bqp2b/3N4/P2Bn2P/1PPN1P2/R1BQ1RK1 w - - 1 15', 'd1h5 d5g2', 1032]

describe('retos', () => {
  it('resuelve quien NO mueve en la FEN', () => {
    expect(solverSeat(parsePuzzle(MATE1))).toBe(1)
  })

  it('la primera jugada es del rival y luego toca resolver', () => {
    const a = playOpponent(startAttempt(parsePuzzle(MATE1)))
    expect(a.status).toBe('solving')
    expect(a.state.moves).toEqual(['d1h5'])
  })

  it('una jugada incorrecta no cambia la posición y suma un error', () => {
    const a = playOpponent(startAttempt(parsePuzzle(MATE1)))
    const r = tryMove(a, 'a7a6')
    expect(r.result).toBe('wrong')
    expect(r.attempt.state.moves).toEqual(['d1h5'])
    expect(r.attempt.mistakes).toBe(1)
  })

  it('la jugada correcta resuelve el mate en 1', () => {
    const a = playOpponent(startAttempt(parsePuzzle(MATE1)))
    const r = tryMove(a, 'd5g2')
    expect(r.result).toBe('solved')
    expect(r.attempt.status).toBe('solved')
  })

  it('ver la solución la juega entera', () => {
    let a = playOpponent(startAttempt(parsePuzzle(MATE1)))
    while (a.status !== 'revealed') a = revealStep(a)
    expect(a.state.moves).toEqual(['d1h5', 'd5g2'])
  })

  it('cuenta las jugadas propias', () => {
    expect(solverMoves(parsePuzzle(MATE1))).toBe(1)
    expect(solverMoves(parsePuzzle(['x', MATE1[1], 'a b c d', 1]))).toBe(2)
  })

  it('todos los retos incluidos son jugables de principio a fin', () => {
    let total = 0
    for (const cat of data.categories) {
      for (const t of cat.puzzles as PuzzleTuple[]) {
        const p = parsePuzzle(t)
        let state: ReturnType<typeof apply> = { fen: p.fen, moves: [] }
        for (const m of p.moves) {
          state = apply(state!, m)
          expect(state, `${p.id}: ${m}`).not.toBeNull()
        }
        total++
      }
    }
    expect(total).toBe(600)
  })

  it('cada categoría va de fácil a difícil', () => {
    for (const cat of data.categories) {
      const r = (cat.puzzles as PuzzleTuple[]).map((p) => p[3])
      expect([...r].sort((a, b) => a - b)).toEqual(r)
    }
  })
})
