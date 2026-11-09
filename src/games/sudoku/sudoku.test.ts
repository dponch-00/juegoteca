import { describe, expect, it } from 'vitest'
import { countSolutions, dailyLevel, dailySeed, generate, grade, parse, PEERS, SUDOKU_LEVELS, solve } from './logic'
import { answer, eraseCell, fillNotes, findHint, newGame, placeDigit, remainingByDigit, toggleNote, undo, completedUnits, formatTime } from './play'

// Sudoku clásico conocido (solución única).
const CLASSIC = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
const CLASSIC_SOL = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

describe('lógica de sudoku', () => {
  it('cada casilla tiene 20 vecinas', () => {
    expect(PEERS.every((p) => p.length === 20)).toBe(true)
  })

  it('resuelve un sudoku conocido y detecta que es único', () => {
    expect(solve(parse(CLASSIC))!.join('')).toBe(CLASSIC_SOL)
    expect(countSolutions(parse(CLASSIC))).toBe(1)
    const vacio = new Array(81).fill(0)
    expect(countSolutions(vacio)).toBe(2)
  })

  it('el clásico se resuelve solo con "únicos"', () => {
    expect(grade(parse(CLASSIC))).toBe(1)
  })

  it('genera sudokus con solución única, del nivel pedido y consistentes', () => {
    for (const level of SUDOKU_LEVELS) {
      for (const seed of [1, 2, 3]) {
        const g = generate(level.id, seed * 1000 + level.id)
        const p = parse(g.puzzle)
        expect(countSolutions(p)).toBe(1)
        expect(solve(p)!.join('')).toBe(g.solution)
        expect(grade(p)).toBe(level.tier)
        // Las pistas son parte de la solución.
        expect(p.every((v, i) => v === 0 || String(v) === g.solution[i])).toBe(true)
        if (level.minGivens) expect(p.filter(Boolean).length).toBeGreaterThanOrEqual(level.minGivens)
      }
    }
  })

  it('la misma semilla da el mismo sudoku (reto del día)', () => {
    const s = dailySeed('2026-11-08')
    expect(generate(2, s)).toEqual(generate(2, s))
    expect(dailySeed('2026-11-08')).not.toBe(dailySeed('2026-11-09'))
    expect(dailyLevel('2026-11-08')).toBe(3) // domingo
    expect(dailyLevel('2026-11-10')).toBe(2) // martes
  })
})

describe('partida de sudoku', () => {
  const start = () => newGame(2, CLASSIC, CLASSIC_SOL)

  it('no deja tocar las pistas iniciales', () => {
    expect(placeDigit(start(), 0, 1)).toBeNull()
  })

  it('poner un número borra esa nota en su fila, columna y bloque, y se puede deshacer', () => {
    let g = start()
    g = toggleNote(g, 2, 4)! // fila 0
    g = toggleNote(g, 18, 4)! // mismo bloque
    g = toggleNote(g, 78, 4)! // lejos
    g = placeDigit(g, 3, 6)! // la casilla (0,3) es un 6
    expect(g.errors).toBe(0)
    g = placeDigit(g, 2, 4)! // correcto
    expect(g.notes[18]).toBe(0)
    expect(g.notes[78]).not.toBe(0)
    const back = undo(g)!
    expect(back.values[2]).toBe(0)
    expect(back.notes[2]).not.toBe(0)
    expect(back.notes[18]).not.toBe(0)
  })

  it('cuenta los errores y la pista los señala primero', () => {
    let g = start()
    g = placeDigit(g, 2, 1)! // va un 4
    expect(g.errors).toBe(1)
    expect(findHint(g)).toEqual({ kind: 'wrong', cell: 2 })
    g = eraseCell(g, 2)!
    expect(findHint(g)!.kind).toBe('single')
  })

  it('la pista de "único" siempre es correcta', () => {
    let g = start()
    for (let k = 0; k < 81 && !g.done; k++) {
      const h = findHint(g)!
      expect(h.kind).not.toBe('wrong')
      if (h.kind === 'wrong') break
      expect(h.digit).toBe(answer(g, h.cell))
      g = placeDigit(g, h.cell, h.digit)!
    }
    expect(g.done).toBe(true)
    expect(g.errors).toBe(0)
  })

  it('anotar todo pone solo candidatos posibles', () => {
    const g = fillNotes(start())!
    for (let i = 0; i < 81; i++) if (!g.values[i]) expect(g.notes[i] & (1 << (answer(g, i) - 1))).not.toBe(0)
  })

  it('detecta fila completa y cuenta lo que falta', () => {
    let g = start()
    const row0 = [2, 3, 5, 6, 7, 8]
    for (const i of row0) g = placeDigit(g, i, answer(g, i))!
    expect(completedUnits(g, 8)).toContain(0)
    expect(remainingByDigit(newGame(1, CLASSIC, CLASSIC_SOL))[5]).toBe(9 - [...CLASSIC].filter((c) => c === '5').length)
  })

  it('formatea el tiempo', () => {
    expect(formatTime(65_000)).toBe('1:05')
    expect(formatTime(3_725_000)).toBe('1:02:05')
  })
})
