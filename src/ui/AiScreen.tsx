import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { back } from '../core/router'
import { displayName, load, recordResult, save } from '../core/storage'
import type { GameDef, Outcome, Seat } from '../core/types'
import { ConfirmButton, Match } from './Match'
import './cpu.css'

/*
 * "Contra la computadora" genérico: sirve para cualquier juego que traiga `game.ai`.
 * (El ajedrez tiene su propia pantalla por el repaso con Stockfish.)
 */

interface SavedGame {
  level: number
  seat: Seat
  state: unknown
  hints: number
  takebacks: number
  resigned: boolean
  recorded: boolean
}
type LevelStats = Record<number, { won: number; lost: number; drawn: number }>

/** Tiempo mínimo de "pensar": si responde al instante se siente brusco. */
const MIN_THINK_MS = 500

export function AiScreen({ game }: { game: GameDef }) {
  const key = `cpu:${game.id}`
  const [saved, setSavedRaw] = useState<SavedGame | null>(() => load<SavedGame | null>(key, null))
  const [playing, setPlaying] = useState(false)

  function setSaved(g: SavedGame) {
    setSavedRaw(g)
    save(key, g)
  }

  function start(level: number, seat: Seat) {
    save(`${key}:lastLevel`, level)
    setSaved({ level, seat, state: game.create(), hints: 0, takebacks: 0, resigned: false, recorded: false })
    setPlaying(true)
  }

  if (playing && saved) {
    return <AiMatch game={game} saved={saved} setSaved={setSaved} onSetup={() => setPlaying(false)} onRematch={() => start(saved.level, saved.seat)} />
  }
  return <Setup game={game} saved={saved} onStart={start} onResume={() => setPlaying(true)} />
}

function outcomeOf(game: GameDef, g: SavedGame): Outcome | null {
  if (g.resigned) return { winner: g.seat === 0 ? 1 : 0, reason: 'Te rendiste' }
  return game.outcome(g.state)
}

/* ---------- Elegir nivel y color ---------- */

function Setup({ game, saved, onStart, onResume }: { game: GameDef; saved: SavedGame | null; onStart: (l: number, s: Seat) => void; onResume: () => void }) {
  const levels = game.ai!.levels
  const [level, setLevel] = useState(() => load<number>(`cpu:${game.id}:lastLevel`, levels[0].id))
  const [color, setColor] = useState<0 | 1 | 'r'>(0)
  const stats = load<LevelStats>(`cpu:${game.id}:levels`, {})
  const resumable = saved && game.ply(saved.state) > 0 && !outcomeOf(game, saved)
  const Icon = game.SeatIcon

  return (
    <div class="screen wide">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back(`g/${game.id}`)} aria-label="Volver">←</button>
        <h1>{game.name} · contra la computadora</h1>
      </header>

      {resumable && (
        <button class="btn btn-col enter" onClick={onResume}>
          Continuar partida
          <span class="sub">
            Nivel {saved!.level} · {levels.find((l) => l.id === saved!.level)?.name} · {game.ply(saved!.state)} jugadas
          </span>
        </button>
      )}

      <section>
        <h2 class="section-title">Nivel</h2>
        <div class="level-grid stagger" role="radiogroup" aria-label="Nivel">
          {levels.map((l) => {
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
              [0, game.seatNames[0]],
              [1, game.seatNames[1]],
              ['r', 'Al azar'],
            ] as const
          ).map(([c, label]) => (
            <button key={String(c)} role="radio" aria-checked={color === c} class={`color-opt${color === c ? ' selected' : ''}`} onClick={() => setColor(c)}>
              {Icon && (
                <span class="color-piece">
                  {c === 'r' ? (
                    <>
                      <Icon seat={0} />
                      <Icon seat={1} />
                    </>
                  ) : (
                    <Icon seat={c} />
                  )}
                </span>
              )}
              {label}
            </button>
          ))}
        </div>
      </section>

      <button class="btn btn-primary" onClick={() => onStart(level, color === 'r' ? (Math.random() < 0.5 ? 0 : 1) : color)}>
        {resumable ? 'Nueva partida' : 'Jugar'}
      </button>
    </div>
  )
}

/* ---------- Partida ---------- */

function AiMatch({
  game,
  saved,
  setSaved,
  onSetup,
  onRematch,
}: {
  game: GameDef
  saved: SavedGame
  setSaved: (g: SavedGame) => void
  onSetup: () => void
  onRematch: () => void
}) {
  const ai = game.ai!
  const level = ai.levels.find((l) => l.id === saved.level) ?? ai.levels[0]
  const outcome = outcomeOf(game, saved)
  const toMove = game.turn(saved.state)
  const cpuSeat: Seat = saved.seat === 0 ? 1 : 0
  const cpuTurn = !outcome && toMove === cpuSeat

  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState<{ ply: number; move: unknown } | null>(null)
  const [hintBusy, setHintBusy] = useState(false)
  const token = useRef(0)
  const savedRef = useRef(saved)
  savedRef.current = saved
  const ply = game.ply(saved.state)

  // Turno de la computadora.
  useEffect(() => {
    if (!cpuTurn) return
    const my = ++token.current
    const started = performance.now()
    setThinking(true)
    setError('')
    ai.move(saved.state, saved.level)
      .then((move) => {
        if (my !== token.current) return
        const wait = Math.max(0, MIN_THINK_MS - (performance.now() - started))
        setTimeout(() => {
          if (my !== token.current) return
          const g = savedRef.current
          const next = game.apply(g.state, move)
          setThinking(false)
          if (next) setSaved({ ...g, state: next })
          else setError('La computadora intentó una jugada inválida.')
        }, wait)
      })
      .catch((e: Error) => {
        if (my !== token.current) return
        setThinking(false)
        setError(e.message)
      })
    return () => {
      token.current++
      setThinking(false)
    }
  }, [cpuTurn, ply, error === '' ? 0 : 1])

  // Estadísticas: una vez por partida.
  useEffect(() => {
    if (!outcome || saved.recorded) return
    const stats = load<LevelStats>(`cpu:${game.id}:levels`, {})
    const s = stats[saved.level] ?? { won: 0, lost: 0, drawn: 0 }
    const r = outcome.winner == null ? 'drawn' : outcome.winner === saved.seat ? 'won' : 'lost'
    s[r]++
    stats[saved.level] = s
    save(`cpu:${game.id}:levels`, stats)
    recordResult(game.id, r)
    setSaved({ ...saved, recorded: true })
  }, [!!outcome])

  function onMove(m: unknown) {
    const next = game.apply(saved.state, m)
    if (next) {
      setHint(null)
      setSaved({ ...saved, state: next })
    }
  }

  function takeback() {
    if (!game.undo && !game.takeback) return
    token.current++
    setThinking(false)
    setHint(null)
    let s = saved.state
    if (game.takeback) s = game.takeback(s, saved.seat)
    else {
      // Quitar la respuesta de la computadora y nuestra jugada.
      const times = toMove === saved.seat ? 2 : 1
      for (let i = 0; i < times && game.ply(s) > 0; i++) s = game.undo!(s)
    }
    setSaved({ ...saved, state: s, takebacks: saved.takebacks + 1, resigned: false, recorded: false })
  }

  async function askHint() {
    if (!ai.hint || hintBusy || cpuTurn || outcome) return
    setHintBusy(true)
    try {
      const move = await ai.hint(saved.state)
      if (game.ply(savedRef.current.state) === ply) {
        setHint({ ply, move })
        setSaved({ ...savedRef.current, hints: savedRef.current.hints + 1 })
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setHintBusy(false)
    }
  }

  const annotations = useMemo(
    () => (hint && hint.ply === ply && ai.hintAnnotations ? ai.hintAnnotations(saved.state, hint.move) : undefined),
    [hint, ply],
  )
  const myMoves = Math.floor((ply + (saved.seat === 0 ? 1 : 0)) / 2)
  const names: [string, string] = saved.seat === 0 ? [displayName(), level.name] : [level.name, displayName()]

  return (
    <Match
      game={game}
      state={saved.state}
      names={names}
      viewSeat={saved.seat}
      controls={cpuTurn || thinking ? null : saved.seat}
      onMove={onMove}
      outcome={outcome}
      me={saved.seat}
      title={
        <>
          {game.name} <span class="dim title-sub">· nivel {level.id}</span>
        </>
      }
      onBack={() => back(`g/${game.id}`)}
      banner={
        error ? (
          <div class="banner bad">
            {error}
            <button class="btn btn-sm" onClick={() => setError('')}>
              Reintentar
            </button>
          </div>
        ) : undefined
      }
      annotations={annotations}
      thinkingSeat={thinking ? cpuSeat : null}
      actions={
        <>
          {ai.hint && (
            <button class="btn btn-sm" disabled={hintBusy || cpuTurn || !!outcome} onClick={askHint}>
              {hintBusy ? <span class="spinner" /> : '💡'} Pista
            </button>
          )}
          {(game.undo || game.takeback) && (
            <button class="btn btn-sm" disabled={myMoves === 0 || saved.resigned} onClick={takeback}>
              ↶ Deshacer
            </button>
          )}
          <ConfirmButton label="Rendirme" confirmLabel="¿Seguro?" onConfirm={() => setSaved({ ...saved, resigned: true })} />
        </>
      }
      resultActions={
        <>
          <button class="btn btn-primary" onClick={onRematch}>
            Otra partida
          </button>
          <button class="btn btn-ghost" onClick={onSetup}>
            Cambiar nivel
          </button>
        </>
      }
    />
  )
}
