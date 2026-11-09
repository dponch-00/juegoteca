import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { back, navigate } from '../../core/router'
import { load, save } from '../../core/storage'
import { GameIcon } from '../../ui/GameIcon'
import { Confetti } from '../../ui/Match'
import { SUDOKU_LEVELS, UNITS, bit, boxOf, colOf, dailyLevel, dailySeed, generate, getLevel, rowOf, todayKey } from './logic'
import {
  completedUnits,
  eraseCell,
  fillNotes,
  findHint,
  formatTime,
  hintArea,
  hintText,
  isEditable,
  isGiven,
  isWrong,
  newGame,
  placeDigit,
  remainingByDigit,
  toggleNote,
  undo,
  type Hint,
  type SudokuGame,
} from './play'
import { dailyLog, dailyStreak, levelStats, loadGame, recordSolved, saveGame } from './store'
import '../../ui/match.css'
import '../../ui/cpu.css'
import '../../screens/room.css'
import './sudoku.css'

export function SudokuScreen({ sub }: { sub?: string }) {
  return sub === 'jugar' ? <PlayGate /> : <Lobby />
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]
}

/** Genera (menos de 30 ms) y guarda una partida nueva. */
function startGame(level: number, daily?: string): SudokuGame {
  const { puzzle, solution } = generate(level, daily ? dailySeed(daily) : randomSeed())
  const g = newGame(level, puzzle, solution, daily)
  saveGame(g)
  return g
}

/* ---------- Inicio del sudoku ---------- */

function Lobby() {
  const saved = loadGame()
  const today = todayKey()
  const log = dailyLog()
  const stats = levelStats()
  const streak = dailyStreak(today, log)
  const todayLevel = getLevel(dailyLevel(today))
  const doneToday = log[today]
  const [level, setLevel] = useState(() => load<number>('sudoku:lastLevel', 1))
  const resumable = saved && !saved.done && saved.history.length > 0
  const givens = saved ? [...saved.puzzle].filter((c) => c !== '0').length : 0
  const progress = saved ? Math.round((100 * saved.values.filter((v, i) => v && !isWrong(saved, i) && !isGiven(saved, i)).length) / (81 - givens)) : 0

  function playDaily() {
    if (!(saved?.daily === today && !saved.done)) startGame(todayLevel.id, today)
    navigate('g/sudoku/jugar')
  }
  function playLevel() {
    save('sudoku:lastLevel', level)
    startGame(level)
    navigate('g/sudoku/jugar')
  }

  return (
    <div class="screen wide">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back()} aria-label="Volver">←</button>
        <h1>Sudoku</h1>
      </header>

      <div class="lobby-hero enter">
        <GameIcon id="sudoku" glyph="#" />
        <p class="dim">Llena cada fila, columna y bloque con los números del 1 al 9, sin repetir.</p>
      </div>

      {resumable && (
        <button class="btn btn-col enter" onClick={() => navigate('g/sudoku/jugar')}>
          Continuar partida
          <span class="sub">
            {saved!.daily ? 'Reto del día' : getLevel(saved!.level).name} · {formatTime(saved!.elapsed)} · {progress}% hecho
          </span>
        </button>
      )}

      <section class="stack stagger">
        <h2 class="section-title">Reto del día</h2>
        <button class="btn btn-col btn-solo" onClick={playDaily} disabled={doneToday != null}>
          {doneToday != null ? `Resuelto en ${formatTime(doneToday)} ✓` : `Sudoku de hoy · ${todayLevel.name}`}
          <span class="sub">
            {doneToday != null ? 'Mañana hay otro' : 'El mismo para todos, cambia cada día'}
            {streak > 0 ? ` · racha de ${streak} ${streak === 1 ? 'día' : 'días'}` : ''}
          </span>
        </button>
      </section>

      <section class="stack">
        <h2 class="section-title">Nivel</h2>
        <div class="level-grid stagger" role="radiogroup" aria-label="Nivel">
          {SUDOKU_LEVELS.map((l) => {
            const s = stats[l.id]
            return (
              <button key={l.id} role="radio" aria-checked={level === l.id} class={`level-card${level === l.id ? ' selected' : ''}`} onClick={() => setLevel(l.id)}>
                <span class="level-num">{l.id}</span>
                <span class="level-name">
                  {l.name}
                  {s?.solved ? <span class="level-won">✓</span> : null}
                </span>
                <span class="level-blurb">
                  {s?.solved ? `Récord ${formatTime(s.best!)} · ${s.solved} ${s.solved === 1 ? 'resuelto' : 'resueltos'}` : l.blurb}
                </span>
              </button>
            )
          })}
        </div>
        <button class="btn btn-primary" onClick={playLevel}>
          {resumable ? 'Nueva partida' : 'Jugar'}
        </button>
      </section>
    </div>
  )
}

/* ---------- Partida ---------- */

function PlayGate() {
  const [g] = useState(loadGame)
  useEffect(() => {
    if (!g) navigate('g/sudoku', true)
  }, [])
  return g ? <Play initial={g} /> : null
}

type Result = 'none' | 'pending' | 'shown' | 'hidden'

function Play({ initial }: { initial: SudokuGame }) {
  const [g, setGRaw] = useState(initial)
  const gRef = useRef(g)
  gRef.current = g
  const [selected, setSel] = useState<number | null>(null)
  const [padFocus, setPadFocus] = useState<number | null>(null)
  const [notesMode, setNotesMode] = useState(false)
  const [hint, setHint] = useState<Hint | null>(null)
  const [flash, setFlash] = useState<{ cells: Set<number>; key: number } | null>(null)
  const [shake, setShake] = useState<{ cell: number; key: number } | null>(null)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<Result>(initial.done ? 'shown' : 'none')
  const [record, setRecord] = useState(false)
  const level = getLevel(g.level)
  // Al terminar no queda nada seleccionado: solo la ola.
  const sel = g.done ? null : selected

  function setG(next: SudokuGame) {
    gRef.current = next
    setGRaw(next)
    saveGame(next)
  }

  // Reloj: solo cuenta con la app a la vista y sin pausa.
  useEffect(() => {
    if (g.done || paused) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const delta = now - last
      last = now
      if (document.visibilityState !== 'visible' || delta > 5000) return
      const cur = gRef.current
      setG({ ...cur, elapsed: cur.elapsed + delta })
    }, 1000)
    const onVis = () => {
      if (document.visibilityState === 'visible') last = performance.now()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [g.done, paused])

  // Resuelto: anotar una vez y mostrar el resultado después de la ola.
  useEffect(() => {
    if (!g.done || g.recorded) return
    setRecord(recordSolved(g))
    setG({ ...g, recorded: true })
    setSel(null)
    setHint(null)
    setResult('pending')
    const t = setTimeout(() => setResult('shown'), 1300)
    return () => clearTimeout(t)
  }, [g.done])

  function select(i: number) {
    if (paused) return
    setSel(i)
    setPadFocus(null)
    if (hint && hint.cell !== i) setHint(null)
  }

  function after(next: SudokuGame | null, i: number, d?: number) {
    if (!next) return
    setG(next)
    setHint(null)
    if (d && next.values[i] === d) {
      if (isWrong(next, i)) setShake({ cell: i, key: Date.now() })
      else {
        const units = completedUnits(next, i)
        if (units.length && !next.done) {
          const cells = new Set(units.flatMap((u) => UNITS[u]))
          const key = Date.now()
          setFlash({ cells, key })
          setTimeout(() => setFlash((f) => (f?.key === key ? null : f)), 900)
        }
      }
    }
  }

  function input(d: number) {
    const cur = gRef.current
    if (paused || cur.done) return
    if (sel == null || !isEditable(cur, sel)) {
      setPadFocus((f) => (f === d ? null : d))
      return
    }
    if (notesMode) after(toggleNote(cur, sel, d), sel)
    else after(placeDigit(cur, sel, d), sel, d)
  }

  function erase() {
    if (sel != null && !paused) after(eraseCell(gRef.current, sel), sel)
  }
  function doUndo() {
    if (!paused) after(undo(gRef.current), -1)
  }
  function autoNotes() {
    if (!paused) after(fillNotes(gRef.current), -1)
  }

  function askHint() {
    const cur = gRef.current
    if (paused || cur.done) return
    // Segundo toque sobre la misma pista: aplicarla.
    if (hint) return applyHint()
    const h = findHint(cur, sel ?? undefined)
    if (!h) return
    setHint(h)
    setSel(h.cell)
    setPadFocus(null)
    setG({ ...cur, hints: cur.hints + 1 })
  }
  function applyHint() {
    if (!hint) return
    const cur = gRef.current
    if (hint.kind === 'wrong') after(eraseCell(cur, hint.cell), hint.cell)
    else after(placeDigit(cur, hint.cell, hint.digit), hint.cell, hint.digit)
  }

  function another() {
    const next = startGame(g.level)
    gRef.current = next
    setGRaw(next)
    setSel(null)
    setHint(null)
    setPadFocus(null)
    setNotesMode(false)
    setRecord(false)
    setResult('none')
  }

  // Teclado (computadora o tablet con teclado).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        doUndo()
        e.preventDefault()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const move: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
      if (/^[1-9]$/.test(e.key)) input(Number(e.key))
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') erase()
      else if (e.key === 'n' || e.key === 'N') setNotesMode((m) => !m)
      else if (move[e.key]) {
        const [dr, dc] = move[e.key]
        const i = sel ?? 40
        const r = (rowOf(i) + dr + 9) % 9
        const c = (colOf(i) + dc + 9) % 9
        select(r * 9 + c)
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const left = remainingByDigit(g)
  const focus = g.done ? null : sel != null && g.values[sel] && !isWrong(g, sel) ? g.values[sel] : padFocus
  const area = useMemo(() => new Set(hint ? hintArea(hint) : []), [hint])

  return (
    <div class="screen match sudoku">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back('g/sudoku')} aria-label="Volver">←</button>
        <h1>
          Sudoku <span class="dim title-sub">· {g.daily ? 'reto del día' : level.name.toLowerCase()}</span>
        </h1>
      </header>

      <div class="board-wrap">
        <div class={`sd-board${paused ? ' paused' : ''}${g.done ? ' won' : ''}`} role="grid" aria-label="Tablero de sudoku">
          {Array.from({ length: 9 }, (_, b) => (
            <div class="sd-box" key={b}>
              {UNITS[18 + b].map((i) => {
                const v = g.values[i]
                const given = isGiven(g, i)
                const wrong = isWrong(g, i)
                const cls = ['sd-cell']
                if (given) cls.push('given')
                else if (v) cls.push(wrong ? 'wrong' : 'mine')
                if (sel === i) cls.push('sel')
                else if (sel != null && (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel))) cls.push('peer')
                if (focus && v === focus && !wrong) cls.push('same')
                if (area.has(i)) cls.push(hint!.cell === i ? 'hint-cell' : 'hint-area')
                if (flash?.cells.has(i)) cls.push('flash')
                if (shake?.cell === i) cls.push('shake')
                const delay = flash && sel != null ? Math.abs(rowOf(i) - rowOf(sel)) + Math.abs(colOf(i) - colOf(sel)) : 0
                return (
                  <button
                    key={i}
                    class={cls.join(' ')}
                    style={`--d:${delay};--w:${rowOf(i) + colOf(i)}`}
                    onClick={() => select(i)}
                    aria-label={`Fila ${rowOf(i) + 1}, columna ${colOf(i) + 1}${v ? `: ${v}` : ', vacía'}`}
                  >
                    {v ? (
                      <span class="sd-val" key={`${v}-${shake?.cell === i ? shake.key : 0}`}>
                        {v}
                      </span>
                    ) : g.notes[i] ? (
                      <span class="sd-notes">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                          <i key={d} class={g.notes[i] & bit(d) && focus === d ? 'hl' : ''}>
                            {g.notes[i] & bit(d) ? d : ''}
                          </i>
                        ))}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        {paused && (
          <button class="sd-paused" onClick={() => setPaused(false)}>
            En pausa
            <span class="dim">Toca para seguir</span>
          </button>
        )}
      </div>

      <div class="match-side">
        <div class="sd-status pre">
          <span>{g.daily ? 'Reto del día' : level.name}</span>
          <span class={g.errors ? 'sd-err' : ''}>
            {g.errors} {g.errors === 1 ? 'error' : 'errores'}
          </span>
          <button class="sd-time" onClick={() => setPaused((p) => !p)} disabled={g.done} aria-label={paused ? 'Seguir' : 'Pausa'}>
            <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span> {formatTime(g.elapsed)}
          </button>
        </div>

        {hint && (
          <div class="banner sd-hint" role="status">
            <span>{hintText(hint)}</span>
            <button class="btn btn-sm" onClick={applyHint}>
              {hint.kind === 'wrong' ? 'Borrarlo' : 'Ponerlo'}
            </button>
          </div>
        )}

        <div class="sd-tools">
          <button class="sd-tool" onClick={doUndo} disabled={g.done || g.history.length === 0}>
            <span class="sd-tool-i" aria-hidden="true">↶</span>Deshacer
          </button>
          <button class="sd-tool" onClick={erase} disabled={g.done || sel == null || !isEditable(g, sel)}>
            <span class="sd-tool-i" aria-hidden="true">⌫</span>Borrar
          </button>
          <button class={`sd-tool${notesMode ? ' on' : ''}`} aria-pressed={notesMode} onClick={() => setNotesMode((m) => !m)} disabled={g.done}>
            <span class="sd-tool-i" aria-hidden="true">✎</span>Notas
            <span class="sd-badge">{notesMode ? 'Sí' : 'No'}</span>
          </button>
          <button class="sd-tool" onClick={autoNotes} disabled={g.done}>
            <span class="sd-tool-i" aria-hidden="true">▦</span>Anotar todo
          </button>
          <button class="sd-tool" onClick={askHint} disabled={g.done}>
            <span class="sd-tool-i" aria-hidden="true">💡</span>Pista
          </button>
        </div>

        <div class={`sd-pad${notesMode ? ' notes' : ''}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button key={d} class={`sd-key${left[d] <= 0 ? ' done' : ''}${focus === d ? ' focus' : ''}`} onClick={() => input(d)} disabled={g.done}>
              <span class="sd-key-d">{d}</span>
              <span class="sd-key-n">{left[d] > 0 ? left[d] : '✓'}</span>
            </button>
          ))}
        </div>
        <div class="side-spacer" />
      </div>

      {result === 'shown' && (
        <div class="result-backdrop">
          <Confetti />
          <div class="result card">
            <h2>¡Resuelto!</h2>
            {record && <p class="sd-record">Nuevo récord en {level.name}</p>}
            <div class="sd-summary">
              <div>
                <b>{formatTime(g.elapsed)}</b>
                <span>tiempo</span>
              </div>
              <div>
                <b>{g.errors}</b>
                <span>{g.errors === 1 ? 'error' : 'errores'}</span>
              </div>
              <div>
                <b>{g.hints}</b>
                <span>{g.hints === 1 ? 'pista' : 'pistas'}</span>
              </div>
            </div>
            <div class="stack">
              <button class="btn btn-primary" onClick={another}>
                Otro sudoku {level.name.toLowerCase()}
              </button>
              <button class="btn btn-ghost" onClick={() => back('g/sudoku')}>
                Cambiar nivel
              </button>
            </div>
            <button class="btn btn-ghost btn-sm" onClick={() => setResult('hidden')}>
              Ver el tablero
            </button>
          </div>
        </div>
      )}
      {result === 'hidden' && (
        <button class="btn btn-sm result-reopen" onClick={() => setResult('shown')}>
          Ver resultado
        </button>
      )}
    </div>
  )
}

