import { load, recordResult, save } from '../../core/storage'
import type { SudokuGame } from './play'

/* Lo que el sudoku guarda en el dispositivo. */

const GAME = 'sudoku:game'
const LEVELS = 'sudoku:levels'
const DAILY = 'sudoku:daily'

export type LevelStats = Record<number, { solved: number; best: number | null }>
/** Fecha → tiempo con que se resolvió el reto de ese día. */
export type DailyLog = Record<string, number>

export const loadGame = () => load<SudokuGame | null>(GAME, null)
export const saveGame = (g: SudokuGame) => save(GAME, g)
export const levelStats = () => load<LevelStats>(LEVELS, {})
export const dailyLog = () => load<DailyLog>(DAILY, {})

/** Anota una partida resuelta. Devuelve si fue récord del nivel. */
export function recordSolved(g: SudokuGame): boolean {
  const stats = levelStats()
  const s = stats[g.level] ?? { solved: 0, best: null }
  const record = s.best == null || g.elapsed < s.best
  s.solved++
  if (record) s.best = g.elapsed
  stats[g.level] = s
  save(LEVELS, stats)
  if (g.daily) {
    const log = dailyLog()
    if (log[g.daily] == null) {
      log[g.daily] = g.elapsed
      save(DAILY, log)
    }
  }
  recordResult('sudoku', 'won')
  return record
}

export function totalSolved(): number {
  return Object.values(levelStats()).reduce((n, s) => n + s.solved, 0)
}

/** Días seguidos con el reto resuelto, contando hasta hoy (o hasta ayer si hoy aún no). */
export function dailyStreak(today: string, log = dailyLog()): number {
  const d = new Date(`${today}T12:00:00`)
  if (log[today] == null) d.setDate(d.getDate() - 1)
  let n = 0
  for (;;) {
    const p = (x: number) => String(x).padStart(2, '0')
    const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    if (log[key] == null) return n
    n++
    d.setDate(d.getDate() - 1)
  }
}
