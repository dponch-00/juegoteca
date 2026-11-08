import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { Chess } from 'chess.js'
import { back } from '../../../core/router'
import { displayName, load, recordResult, save } from '../../../core/storage'
import type { Outcome, Seat } from '../../../core/types'
import { ConfirmButton, Match } from '../../../ui/Match'
import { ChessBoard, type ChessAnnotations } from '../ChessBoard'
import { engine as sf } from '../engine/engine'
import { getLevel, LEVELS, pickMove } from '../engine/levels'
import { scoreValue } from '../engine/uci'
import { chessBase as chessGame } from '../def'
import { apply, engine as position, outcome as chessOutcome, turn as chessTurn, type ChessState } from '../logic'
import { moveNumberLabel, toSpanishSan } from '../notation'
import { PieceArt } from '../pieces'
import { accuracy, reviewMoves, VERDICT_LABEL, type MoveReview, type PositionEval } from '../review'
import '../../../ui/match.css'
import './cpu.css'

/* ---------- Datos guardados ---------- */

interface CpuGame {
  level: number
  seat: Seat
  moves: string[]
  hints: number
  takebacks: number
  resigned: boolean
  /** Ya se sumó a las estadísticas. */
  recorded: boolean
}

type LevelStats = Record<number, { won: number; lost: number; drawn: number }>

const GAME_KEY = 'cpu:chess'
const STATS_KEY = 'cpu:chess:levels'
const LAST_LEVEL_KEY = 'cpu:chess:lastLevel'
const REVIEW_KEY = 'cpu:chess:review'
/** Tiempo mínimo antes de que responda la computadora: si contesta al instante se siente brusco. */
const MIN_THINK_MS = 450

function gameOutcome(g: CpuGame): Outcome | null {
  if (g.resigned) return { winner: g.seat === 0 ? 1 : 0, reason: 'Te rendiste' }
  return chessOutcome({ moves: g.moves })
}

/* ---------- Pantalla ---------- */

export function CpuScreen() {
  const [game, setGameRaw] = useState<CpuGame | null>(() => load<CpuGame | null>(GAME_KEY, null))
  const [phase, setPhase] = useState<'setup' | 'play' | 'review'>('setup')

  function setGame(g: CpuGame | null) {
    setGameRaw(g)
    save(GAME_KEY, g)
  }

  function start(level: number, seat: Seat) {
    save(LAST_LEVEL_KEY, level)
    sf.newGame()
    setGame({ level, seat, moves: [], hints: 0, takebacks: 0, resigned: false, recorded: false })
    setPhase('play')
  }

  if (phase === 'play' && game) {
    return (
      <CpuMatch
        game={game}
        setGame={setGame}
        onReview={() => setPhase('review')}
        onSetup={() => setPhase('setup')}
        onRematch={() => start(game.level, game.seat)}
      />
    )
  }
  if (phase === 'review' && game) return <Review game={game} onBack={() => setPhase('play')} />
  return <Setup saved={game} onStart={start} onResume={() => setPhase('play')} onReview={() => setPhase('review')} />
}

/* ---------- Elegir nivel y color ---------- */

function Setup({
  saved,
  onStart,
  onResume,
  onReview,
}: {
  saved: CpuGame | null
  onStart: (level: number, seat: Seat) => void
  onResume: () => void
  onReview: () => void
}) {
  const [level, setLevel] = useState(() => load<number>(LAST_LEVEL_KEY, 1))
  const [color, setColor] = useState<'w' | 'b' | 'r'>('w')
  const stats = load<LevelStats>(STATS_KEY, {})
  const resumable = saved && saved.moves.length > 0 && !gameOutcome(saved)
  const reviewable = saved && saved.moves.length > 1 && !!gameOutcome(saved)

  // Precarga el motor mientras la persona elige (≈1.8 MB la primera vez).
  useEffect(() => {
    sf.start().catch(() => {})
  }, [])

  function play() {
    const seat: Seat = color === 'w' ? 0 : color === 'b' ? 1 : Math.random() < 0.5 ? 0 : 1
    onStart(level, seat)
  }

  return (
    <div class="screen wide">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back('g/chess')} aria-label="Volver">←</button>
        <h1>Contra la computadora</h1>
      </header>

      {resumable && (
        <button class="btn btn-col enter" onClick={onResume}>
          Continuar partida
          <span class="sub">
            Nivel {saved!.level} · {getLevel(saved!.level).name} · {saved!.moves.length} jugadas
          </span>
        </button>
      )}

      {reviewable && (
        <button class="btn btn-ghost btn-col enter" onClick={onReview}>
          Repaso de la última partida
          <span class="sub">
            Nivel {saved!.level} · {getLevel(saved!.level).name} · {saved!.moves.length} jugadas
          </span>
        </button>
      )}

      <section>
        <h2 class="section-title">Nivel</h2>
        <div class="level-grid stagger" role="radiogroup" aria-label="Nivel">
          {LEVELS.map((l) => {
            const s = stats[l.id]
            return (
              <button key={l.id} role="radio" aria-checked={level === l.id} class={`level-card${level === l.id ? ' selected' : ''}`} onClick={() => setLevel(l.id)}>
                <span class="level-num">{l.id}</span>
                <span class="level-name">
                  {l.name}
                  {s?.won ? <span class="level-won" title={`${s.won} victorias`}>✓</span> : null}
                </span>
                <span class="level-blurb">{l.blurb}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 class="section-title">Juegas con</h2>
        <div class="color-pick" role="radiogroup" aria-label="Color">
          {(
            [
              ['w', 'Blancas'],
              ['b', 'Negras'],
              ['r', 'Al azar'],
            ] as const
          ).map(([c, label]) => (
            <button key={c} role="radio" aria-checked={color === c} class={`color-opt${color === c ? ' selected' : ''}`} onClick={() => setColor(c)}>
              <span class="color-piece">
                {c === 'r' ? (
                  <>
                    <PieceArt color="w" type="k" />
                    <PieceArt color="b" type="k" />
                  </>
                ) : (
                  <PieceArt color={c} type="k" />
                )}
              </span>
              {label}
            </button>
          ))}
        </div>
      </section>

      <button class="btn btn-primary" onClick={play}>
        {resumable ? 'Nueva partida' : 'Jugar'}
      </button>
    </div>
  )
}

/* ---------- Partida ---------- */

function useEngineStatus() {
  const [status, setStatus] = useState(sf.status)
  useEffect(() => sf.onStatus(() => setStatus(sf.status)), [])
  return status
}

function CpuMatch({
  game,
  setGame,
  onReview,
  onSetup,
  onRematch,
}: {
  game: CpuGame
  setGame: (g: CpuGame) => void
  onReview: () => void
  onSetup: () => void
  onRematch: () => void
}) {
  const level = getLevel(game.level)
  const state: ChessState = useMemo(() => ({ moves: game.moves }), [game.moves])
  const outcome = gameOutcome(game)
  const toMove = chessTurn(state)
  const cpuSeat: Seat = game.seat === 0 ? 1 : 0
  const cpuTurn = !outcome && toMove === cpuSeat
  const status = useEngineStatus()

  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState<{ ply: number; from: string; to: string } | null>(null)
  const [hintBusy, setHintBusy] = useState(false)
  const token = useRef(0)
  const gameRef = useRef(game)
  gameRef.current = game

  // Turno de la computadora.
  useEffect(() => {
    if (!cpuTurn) return
    const my = ++token.current
    const started = performance.now()
    setThinking(true)
    setError('')
    sf.search(position(state).fen(), {
      skill: level.skill,
      depth: level.depth,
      movetime: level.movetime,
      multipv: level.pool,
    })
      .then((res) => {
        if (my !== token.current) return
        const candidates = res.lines.map((l) => l.pv[0]).filter(Boolean)
        if (candidates.length === 0 && res.best) candidates.push(res.best)
        if (candidates.length === 0) return
        const move = pickMove(candidates, level)
        const wait = Math.max(0, MIN_THINK_MS - (performance.now() - started))
        setTimeout(() => {
          if (my !== token.current) return
          const g = gameRef.current
          const next = apply({ moves: g.moves }, move)
          setThinking(false)
          if (next) setGame({ ...g, moves: next.moves })
        }, wait)
      })
      .catch((e: Error) => {
        if (my !== token.current) return
        setThinking(false)
        setError(e.message)
      })
    return () => {
      token.current++
      sf.cancel()
      setThinking(false)
    }
  }, [cpuTurn, game.moves.length, error === '' ? 0 : 1])

  // Estadísticas: una vez por partida.
  useEffect(() => {
    if (!outcome || game.recorded) return
    const stats = load<LevelStats>(STATS_KEY, {})
    const s = stats[game.level] ?? { won: 0, lost: 0, drawn: 0 }
    const r = outcome.winner == null ? 'drawn' : outcome.winner === game.seat ? 'won' : 'lost'
    s[r]++
    stats[game.level] = s
    save(STATS_KEY, stats)
    recordResult('chess', r)
    setGame({ ...game, recorded: true })
  }, [!!outcome])

  function onMove(m: unknown) {
    const next = apply(state, m as string)
    if (next) {
      setHint(null)
      setGame({ ...game, moves: next.moves })
    }
  }

  function takeback() {
    token.current++
    sf.cancel()
    setThinking(false)
    setHint(null)
    // Volver al último turno propio: quitar la respuesta de la computadora y nuestra jugada.
    const n = game.moves.length
    const cut = toMove === game.seat ? n - 2 : n - 1
    const moves = game.moves.slice(0, Math.max(0, cut))
    setGame({ ...game, moves, takebacks: game.takebacks + 1, resigned: false, recorded: false })
  }

  async function askHint() {
    if (hintBusy || cpuTurn || outcome) return
    setHintBusy(true)
    const ply = game.moves.length
    try {
      const res = await sf.search(position(state).fen(), { skill: 20, depth: 14, movetime: 1200 })
      if (res.best && gameRef.current.moves.length === ply) {
        setHint({ ply, from: res.best.slice(0, 2), to: res.best.slice(2, 4) })
        setGame({ ...gameRef.current, hints: gameRef.current.hints + 1 })
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setHintBusy(false)
    }
  }

  const myMoves = Math.floor((game.moves.length + (game.seat === 0 ? 1 : 0)) / 2)
  const canTakeBack = myMoves > 0 && !game.resigned
  const annotations: ChessAnnotations | undefined =
    hint && hint.ply === game.moves.length ? { arrows: [{ from: hint.from, to: hint.to, tone: 'hint' }] } : undefined

  const names: [string, string] = game.seat === 0 ? [displayName(), level.name] : [level.name, displayName()]

  let banner = null
  if (error) {
    banner = (
      <div class="banner bad">
        {error}
        <button class="btn btn-sm" onClick={() => setError('')}>
          Reintentar
        </button>
      </div>
    )
  } else if (status === 'loading') {
    banner = (
      <div class="banner">
        <span class="spinner" /> Preparando a la computadora…
      </div>
    )
  }

  return (
    <Match
      game={chessGame}
      state={state}
      names={names}
      viewSeat={game.seat}
      controls={cpuTurn || thinking ? null : game.seat}
      onMove={onMove}
      outcome={outcome}
      me={game.seat}
      title={
        <>
          Nivel {level.id} <span class="dim title-sub">· {level.name}</span>
        </>
      }
      onBack={() => back('g/chess')}
      banner={banner}
      annotations={annotations}
      thinkingSeat={thinking ? cpuSeat : null}
      actions={
        <>
          <button class="btn btn-sm" disabled={hintBusy || cpuTurn || !!outcome} onClick={askHint}>
            {hintBusy ? <span class="spinner" /> : '💡'} Pista
          </button>
          <button class="btn btn-sm" disabled={!canTakeBack} onClick={takeback}>
            ↶ Deshacer
          </button>
          <ConfirmButton label="Rendirme" confirmLabel="¿Seguro?" onConfirm={() => setGame({ ...game, resigned: true })} />
        </>
      }
      resultActions={
        <>
          <button class="btn btn-primary" onClick={onReview}>
            Ver el repaso
          </button>
          <div class="row">
            <button class="btn btn-ghost" onClick={onRematch}>
              Otra partida
            </button>
            <button class="btn btn-ghost" onClick={onSetup}>
              Cambiar nivel
            </button>
          </div>
          {helpNote(game) && <p class="dim result-note">{helpNote(game)}</p>}
        </>
      }
    />
  )
}

/* ---------- Repaso ---------- */

interface ReviewCache {
  key: string
  evals: PositionEval[]
}

function Review({ game, onBack }: { game: CpuGame; onBack: () => void }) {
  const key = game.moves.join(' ')
  const cached = load<ReviewCache | null>(REVIEW_KEY, null)
  const [evals, setEvals] = useState<PositionEval[] | null>(cached?.key === key ? cached.evals : null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)

  // Posiciones (FEN) y notación de cada jugada.
  const replay = useMemo(() => {
    const c = new Chess()
    const fens = [c.fen()]
    const sans: string[] = []
    for (const u of game.moves) {
      const mv = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
      sans.push(toSpanishSan(mv.san))
      fens.push(c.fen())
    }
    return { fens, sans }
  }, [key])

  useEffect(() => {
    if (evals) return
    let alive = true
    ;(async () => {
      const out: PositionEval[] = []
      for (let k = 0; k < replay.fens.length; k++) {
        const pos = new Chess(replay.fens[k])
        if (pos.isCheckmate()) out.push({ value: pos.turn() === 'w' ? -10000 : 10000, best: null })
        else if (pos.isGameOver()) out.push({ value: 0, best: null })
        else {
          const r = await sf.search(replay.fens[k], { skill: 20, depth: 11, movetime: 700 })
          if (!alive) return
          const top = r.lines[0]
          const v = top ? scoreValue(top.score) : 0
          out.push({ value: pos.turn() === 'w' ? v : -v, best: r.best })
        }
        setProgress((k + 1) / replay.fens.length)
      }
      if (!alive) return
      save(REVIEW_KEY, { key, evals: out } satisfies ReviewCache)
      setEvals(out)
    })().catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
      sf.cancel()
    }
  }, [key])

  const reviews = useMemo(() => (evals ? reviewMoves(game.moves, evals, game.seat) : []), [evals])
  const flagged = reviews.filter((r) => r.verdict === 'inaccuracy' || r.verdict === 'mistake' || r.verdict === 'blunder')
  const counts = (v: MoveReview['verdict']) => reviews.filter((r) => r.verdict === v).length

  const topbar = (
    <header class="topbar">
      <button class="icon-btn" onClick={onBack} aria-label="Volver">←</button>
      <h1>Repaso de la partida</h1>
    </header>
  )

  if (error) {
    return (
      <div class="screen">
        {topbar}
        <div class="banner bad">{error}</div>
      </div>
    )
  }

  if (!evals) {
    return (
      <div class="screen">
        {topbar}
        <div class="card stack center enter">
          <p>La computadora está revisando tus jugadas…</p>
          <div class="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <p class="dim">{Math.round(progress * 100)} %</p>
        </div>
      </div>
    )
  }

  const current = flagged[Math.min(index, flagged.length - 1)]
  const reviewState: ChessState = current ? { moves: game.moves.slice(0, current.ply) } : { moves: game.moves }
  const bestSan = current ? sanOf(replay.fens[current.ply], current.best) : ''
  const annotations: ChessAnnotations | undefined = current
    ? {
        arrows: [
          { from: current.played.slice(0, 2), to: current.played.slice(2, 4), tone: 'played' },
          ...(current.best !== current.played ? [{ from: current.best.slice(0, 2), to: current.best.slice(2, 4), tone: 'best' as const }] : []),
        ],
      }
    : undefined

  return (
    <div class="screen match">
      {topbar}

      <div class="board-wrap">
        <ChessBoard state={reviewState} viewSeat={game.seat} controls={null} onMove={() => {}} annotations={annotations} />
      </div>

      <div class="match-side">
        <div class="review-summary card pre enter">
          <div class="accuracy">
            <span class="accuracy-num">{accuracy(reviews)}%</span>
            <span class="dim">precisión</span>
          </div>
          <ul class="verdicts">
            <li class="v-best">{plural(counts('best') + counts('good'), 'buena', 'buenas')}</li>
            <li class="v-inaccuracy">{plural(counts('inaccuracy'), 'imprecisión', 'imprecisiones')}</li>
            <li class="v-mistake">{plural(counts('mistake'), 'error', 'errores')}</li>
            <li class="v-blunder">{plural(counts('blunder'), 'error grave', 'errores graves')}</li>
          </ul>
        </div>

        <div class="side-spacer" />
        {current ? (
          <div class={`review-note card v-${current.verdict}`} key={current.ply}>
            <p class="review-title">
              <strong>{VERDICT_LABEL[current.verdict]}</strong> en la jugada {moveNumberLabel(current.ply)}
            </p>
            <p>
              Jugaste <span class="san played">{replay.sans[current.ply]}</span>
              {current.best !== current.played && (
                <>
                  {' '}
                  y era mejor <span class="san best">{bestSan}</span>
                </>
              )}
              . {lossText(current.loss)}
            </p>
            <div class="row">
              <button class="btn btn-sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                ◀ Anterior
              </button>
              <span class="dim review-count">
                {index + 1} de {flagged.length}
              </span>
              <button class="btn btn-sm" disabled={index >= flagged.length - 1} onClick={() => setIndex(index + 1)}>
                Siguiente ▶
              </button>
            </div>
          </div>
        ) : (
          <div class="card center enter">
            <p>
              <strong>¡Sin errores!</strong> Todas tus jugadas fueron buenas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** "Usaste 2 pistas y deshiciste 1 vez." (solo lo que ocurrió). */
function helpNote(g: CpuGame): string {
  const parts: string[] = []
  if (g.hints) parts.push(`usaste ${g.hints} ${g.hints === 1 ? 'pista' : 'pistas'}`)
  if (g.takebacks) parts.push(`deshiciste ${g.takebacks} ${g.takebacks === 1 ? 'jugada' : 'jugadas'}`)
  if (!parts.length) return ''
  const text = parts.join(' y ')
  return text[0].toUpperCase() + text.slice(1) + '.'
}

function sanOf(fen: string, uci: string): string {
  try {
    const c = new Chess(fen)
    return toSpanishSan(c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san)
  } catch {
    return uci
  }
}

function lossText(loss: number): string {
  if (loss >= 900) return 'Cambió el resultado de la partida.'
  const pawns = (loss / 100).toFixed(1).replace('.', ',')
  return `Perdiste unos ${pawns} peones de ventaja.`
}

