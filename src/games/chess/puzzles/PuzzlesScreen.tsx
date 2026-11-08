import { useEffect, useState } from 'preact/hooks'
import { back } from '../../../core/router'
import { ChessBoard, type ChessAnnotations } from '../ChessBoard'
import { apply, type ChessState } from '../logic'
import { PieceArt } from '../pieces'
import { getProgress, isSolved, recordPuzzle, type Progress } from './progress'
import {
  expectedMove,
  parsePuzzle,
  playOpponent,
  revealStep,
  solverMoves,
  solverSeat,
  startAttempt,
  tryMove,
  type Attempt,
  type PuzzleTuple,
} from './puzzle'
import '../../../ui/match.css'
import './puzzles.css'

/* ---------- Datos (se cargan aparte: ~27 KB comprimidos) ---------- */

interface Category {
  id: string
  name: string
  blurb: string
  puzzles: PuzzleTuple[]
}
interface PuzzleData {
  categories: Category[]
}

let cache: PuzzleData | null = null
async function loadData(): Promise<PuzzleData> {
  if (!cache) cache = (await import('./puzzles.json')).default as unknown as PuzzleData
  return cache
}

const isMateCategory = (id: string) => id.startsWith('mate')

/* ---------- Pantalla ---------- */

export function PuzzlesScreen() {
  const [data, setData] = useState<PuzzleData | null>(cache)
  const [error, setError] = useState('')
  const [catId, setCatId] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress>(getProgress)

  useEffect(() => {
    if (!data) loadData().then(setData, () => setError('No se pudieron cargar los retos.'))
  }, [])

  const category = data?.categories.find((c) => c.id === catId)
  if (category) {
    return (
      <PuzzlePlay
        category={category}
        onBack={() => {
          setProgress(getProgress())
          setCatId(null)
        }}
      />
    )
  }

  const total = data?.categories.reduce((n, c) => n + c.puzzles.length, 0) ?? 0
  const solved = data?.categories.reduce((n, c) => n + c.puzzles.filter((p) => isSolved(progress, p[0])).length, 0) ?? 0

  return (
    <div class="screen wide">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back('g/chess')} aria-label="Volver">←</button>
        <h1>Retos</h1>
      </header>

      {error && <div class="banner bad">{error}</div>}
      {!data && !error && (
        <div class="card center">
          <span class="spinner" />
        </div>
      )}

      {data && (
        <>
          <div class="card puzzle-stats enter">
            <div>
              <span class="stat-num">{solved}</span>
              <span class="dim"> de {total} resueltos</span>
            </div>
            <div class="streak" title="Retos seguidos resueltos a la primera">
              🔥 {progress.streak} <span class="dim">· mejor {progress.bestStreak}</span>
            </div>
          </div>

          <div class="cat-list stagger">
            {data.categories.map((c) => {
              const done = c.puzzles.filter((p) => isSolved(progress, p[0])).length
              const pct = Math.round((done / c.puzzles.length) * 100)
              return (
                <button key={c.id} class="cat-card" onClick={() => setCatId(c.id)}>
                  <span class="cat-head">
                    <span class="cat-name">{c.name}</span>
                    <span class="dim cat-count">
                      {done}/{c.puzzles.length}
                    </span>
                  </span>
                  <span class="cat-blurb">{c.blurb}</span>
                  <span class="progress">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </button>
              )
            })}
          </div>
          <p class="dim center credit-line">
            Problemas de la base abierta de{' '}
            <a href="https://database.lichess.org/#puzzles" target="_blank" rel="noopener">
              Lichess
            </a>{' '}
            (CC0).
          </p>
        </>
      )}
    </div>
  )
}

/* ---------- Resolver ---------- */

type Feedback = { tone: 'info' | 'good' | 'bad' | 'done'; text: string }

function firstPending(c: Category): number {
  const p = getProgress()
  const i = c.puzzles.findIndex((t) => !p.done[t[0]])
  return i === -1 ? 0 : i
}

function PuzzlePlay({ category, onBack }: { category: Category; onBack: () => void }) {
  const [index, setIndex] = useState(() => firstPending(category))
  const [attempt, setAttempt] = useState<Attempt>(() => startAttempt(parsePuzzle(category.puzzles[index])))
  const [preview, setPreview] = useState<{ state: ChessState; to: string } | null>(null)
  const [good, setGood] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [streak, setStreak] = useState(getProgress().streak)

  const p = attempt.puzzle
  const seat = solverSeat(p)
  const side = seat === 0 ? 'blancas' : 'negras'
  const n = solverMoves(p)
  const goal = isMateCategory(category.id) ? `Da mate en ${n}` : n === 1 ? 'Encuentra la mejor jugada' : `Encuentra la mejor secuencia (${n} jugadas)`
  const finished = attempt.status === 'solved' || attempt.status === 'revealed'

  // Respuesta automática del rival (y la primera jugada del reto).
  useEffect(() => {
    if (attempt.status !== 'opponent' || revealing) return
    const t = setTimeout(() => setAttempt((a) => playOpponent(a)), attempt.next === 0 ? 700 : 450)
    return () => clearTimeout(t)
  }, [attempt.status, attempt.next, revealing])

  // "Ver solución": juega la solución paso a paso.
  useEffect(() => {
    if (!revealing) return
    if (attempt.status === 'revealed') {
      setRevealing(false)
      return
    }
    const t = setTimeout(() => setAttempt((a) => revealStep(a)), 650)
    return () => clearTimeout(t)
  }, [revealing, attempt.next, attempt.status])

  function load(i: number) {
    const k = (i + category.puzzles.length) % category.puzzles.length
    setIndex(k)
    setAttempt(startAttempt(parsePuzzle(category.puzzles[k])))
    setPreview(null)
    setGood(null)
    setRevealing(false)
    setFeedback(null)
  }

  function finish(a: Attempt, revealed: boolean) {
    const outcome = revealed ? 'revealed' : a.mistakes === 0 && a.hints === 0 ? 'clean' : 'helped'
    const prog = recordPuzzle(a.puzzle.id, outcome)
    setStreak(prog.streak)
    if (revealed) setFeedback({ tone: 'info', text: 'Esta era la solución. ¡La próxima sale!' })
    else if (outcome === 'clean') setFeedback({ tone: 'done', text: prog.streak > 1 ? `¡Resuelto! Llevas ${prog.streak} seguidos.` : '¡Resuelto a la primera!' })
    else setFeedback({ tone: 'done', text: '¡Resuelto!' })
  }

  function onMove(uci: unknown) {
    if (attempt.status !== 'solving' || preview) return
    const move = uci as string
    const r = tryMove(attempt, move)
    if (r.result === 'wrong') {
      setStreak(0)
      const shown = apply(attempt.state, move)
      setAttempt(r.attempt)
      setFeedback({ tone: 'bad', text: 'Esa no es. Mira bien e inténtalo otra vez.' })
      if (shown) {
        setPreview({ state: shown, to: move.slice(2, 4) })
        setTimeout(() => setPreview(null), 750)
      }
      return
    }
    setGood(move.slice(2, 4))
    setAttempt(r.attempt)
    if (r.result === 'solved') finish(r.attempt, false)
    else setFeedback({ tone: 'good', text: '¡Bien! Sigue…' })
  }

  function hint() {
    if (attempt.status !== 'solving') return
    setAttempt({ ...attempt, hints: attempt.hints + 1 })
    setFeedback({ tone: 'info', text: attempt.hints === 0 ? 'Mueve la pieza marcada.' : 'Esta es la jugada.' })
  }

  function reveal() {
    if (finished || revealing) return
    setRevealing(true)
    setFeedback({ tone: 'info', text: 'Mira la solución…' })
    // Se registra al terminar de mostrarla (ver efecto de abajo).
  }

  useEffect(() => {
    if (attempt.status === 'revealed') finish(attempt, true)
  }, [attempt.status === 'revealed'])

  const exp = expectedMove(attempt)
  const annotations: ChessAnnotations = { marks: [], arrows: [] }
  if (preview) annotations.marks!.push({ square: preview.to, tone: 'wrong' })
  else if (good && attempt.status !== 'solving') annotations.marks!.push({ square: good, tone: 'good' })
  if (exp && attempt.hints >= 1 && !preview) annotations.marks!.push({ square: exp.slice(0, 2), tone: 'hint' })
  if (exp && attempt.hints >= 2 && !preview) annotations.arrows!.push({ from: exp.slice(0, 2), to: exp.slice(2, 4), tone: 'hint' })

  return (
    <div class="screen match">
      <header class="topbar">
        <button class="icon-btn" onClick={onBack} aria-label="Volver">←</button>
        <h1>
          {category.name}{' '}
          <span class="dim title-sub">
            · {index + 1}/{category.puzzles.length}
          </span>
        </h1>
        <span class="streak-chip" title="Racha a la primera">
          🔥 {streak}
        </span>
      </header>

      <div class={`board-wrap${feedback?.tone === 'bad' && preview ? ' shake' : ''}`}>
        <ChessBoard
          state={preview?.state ?? attempt.state}
          viewSeat={seat}
          controls={attempt.status === 'solving' && !preview && !revealing ? seat : null}
          onMove={onMove}
          annotations={annotations}
        />
      </div>

      <div class="match-side">
        <div class={`puzzle-goal card pre seat-${seat}`}>
          <span class="goal-piece">
            <PieceArt color={seat === 0 ? 'w' : 'b'} type="k" />
          </span>
          <span>
            <strong>Juegan {side}.</strong> {goal}.
            <span class="dim goal-rating"> Dificultad {p.rating}</span>
          </span>
        </div>

        <div class="side-spacer" />
        <p class={`puzzle-feedback tone-${feedback?.tone ?? 'info'}`} key={feedback?.text} role="status">
          {feedback?.text ?? (attempt.status === 'opponent' ? 'Mira la jugada de tu rival…' : 'Tu turno.')}
        </p>

        {finished ? (
          <div class="stack">
            <button class="btn btn-primary" onClick={() => load(index + 1)}>
              Siguiente reto →
            </button>
            <div class="row">
              <button class="btn btn-ghost btn-sm" onClick={() => load(index)}>
                Repetir
              </button>
              <a class="btn btn-ghost btn-sm" href={`https://lichess.org/training/${p.id}`} target="_blank" rel="noopener">
                Ver en Lichess
              </a>
            </div>
          </div>
        ) : (
          <div class="row match-actions">
            <button class="btn btn-sm" disabled={attempt.status !== 'solving' || attempt.hints >= 2} onClick={hint}>
              💡 Pista
            </button>
            <button class="btn btn-sm" disabled={revealing} onClick={reveal}>
              Ver solución
            </button>
            <button class="btn btn-sm" onClick={() => load(index + 1)}>
              Saltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
