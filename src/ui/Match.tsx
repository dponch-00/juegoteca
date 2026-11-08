import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import type { GameDef, Outcome, Seat } from '../core/types'
import './match.css'

interface MatchProps {
  game: GameDef
  state: unknown
  names: [string, string]
  viewSeat: Seat
  controls: Seat | 'both' | null
  onMove: (m: unknown) => void
  /** Resultado forzado (rendición) que tiene prioridad sobre el del juego. */
  outcome: Outcome | null
  /** Asiento de "este dispositivo" para decir "Ganaste/Perdiste"; null en pasa-y-juega. */
  me: Seat | null
  title: ComponentChildren
  onBack: () => void
  banner?: ComponentChildren
  actions?: ComponentChildren
  resultActions: ComponentChildren
  /** Marcas del juego sobre el tablero (flechas de pista, etc.). */
  annotations?: unknown
  /** Asiento que está "pensando" (la computadora): muestra puntos animados. */
  thinkingSeat?: Seat | null
}

export function Match(p: MatchProps) {
  const { game, state, viewSeat } = p
  const Board = game.Board
  const turn = game.turn(state)
  const hint = !p.outcome ? (game.hint?.(state) ?? null) : null
  const top: Seat = viewSeat === 0 ? 1 : 0

  return (
    <div class="screen match">
      <header class="topbar">
        <button class="icon-btn" onClick={p.onBack} aria-label="Volver">←</button>
        <h1>{p.title}</h1>
      </header>

      {p.banner}

      <PlayerBar game={game} state={state} seat={top} name={p.names[top]} active={!p.outcome && turn === top} isMe={p.me === top} thinking={p.thinkingSeat === top} />

      <div class="board-wrap">
        <Board state={state} viewSeat={viewSeat} controls={p.outcome ? null : p.controls} onMove={p.onMove} annotations={p.annotations} />
        {hint && (
          <div key={`${hint}-${game.ply(state)}`} class="board-hint">
            {hint}
          </div>
        )}
      </div>

      <PlayerBar game={game} state={state} seat={viewSeat} name={p.names[viewSeat]} active={!p.outcome && turn === viewSeat} isMe={p.me === viewSeat} thinking={p.thinkingSeat === viewSeat} />

      {p.actions && <div class="row match-actions">{p.actions}</div>}

      {p.outcome && <ResultSheet outcome={p.outcome} game={game} names={p.names} me={p.me} actions={p.resultActions} />}
    </div>
  )
}

function PlayerBar({ game, state, seat, name, active, isMe, thinking }: { game: GameDef; state: unknown; seat: Seat; name: string; active: boolean; isMe: boolean; thinking?: boolean }) {
  const Extra = game.PlayerExtra
  return (
    <div class={`player-bar seat-${seat}${active ? ' active' : ''}`}>
      <div class="avatar" aria-hidden="true">{(name || '?').slice(0, 1).toUpperCase()}</div>
      <div class="player-info">
        <div class="player-name">
          {name || '…'}
          {isMe && <span class="me-tag">tú</span>}
        </div>
        {name !== game.seatNames[seat] && <div class="player-seat">{game.seatNames[seat]}</div>}
      </div>
      {Extra && <Extra state={state} seat={seat} />}
      {thinking ? (
        <div class="thinking" aria-label="Pensando">
          <i />
          <i />
          <i />
        </div>
      ) : (
        active && <div class="turn-dot" aria-label="Su turno" />
      )}
    </div>
  )
}

function ResultSheet({ outcome, game, names, me, actions }: { outcome: Outcome; game: GameDef; names: [string, string]; me: Seat | null; actions: ComponentChildren }) {
  const [hidden, setHidden] = useState(false)
  let title: string
  let celebrate = false
  if (outcome.winner == null) title = 'Tablas'
  else if (me == null) {
    title = `¡Gana ${names[outcome.winner] || game.seatNames[outcome.winner]}!`
    celebrate = true
  } else if (outcome.winner === me) {
    title = '¡Ganaste!'
    celebrate = true
  } else title = 'Perdiste'

  if (hidden) {
    return (
      <button class="btn btn-sm result-reopen" onClick={() => setHidden(false)}>
        Ver resultado
      </button>
    )
  }

  return (
    <div class="result-backdrop">
      {celebrate && <Confetti />}
      <div class="result card">
        <h2>{title}</h2>
        <p class="dim">{outcome.reason}</p>
        <div class="stack">{actions}</div>
        <button class="btn btn-ghost btn-sm" onClick={() => setHidden(true)}>
          Ver el tablero
        </button>
      </div>
    </div>
  )
}

function Confetti() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const colors = ['var(--c-accent)', 'var(--c-accent-2)', 'var(--c-danger)', 'var(--c-p0)']
    for (let i = 0; i < 46; i++) {
      const s = document.createElement('i')
      const angle = Math.random() * Math.PI * 2
      const dist = 120 + Math.random() * 220
      s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
      s.style.setProperty('--dy', `${Math.sin(angle) * dist - 120}px`)
      s.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`)
      s.style.background = colors[i % colors.length]
      s.style.animationDelay = `${Math.random() * 120}ms`
      el.appendChild(s)
    }
  }, [])
  return <div ref={ref} class="confetti" aria-hidden="true" />
}

/** Botón que pide un segundo toque para acciones destructivas (rendirse, salir). */
export function ConfirmButton({ label, confirmLabel, onConfirm, class: cls = '' }: { label: string; confirmLabel: string; onConfirm: () => void; class?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button class={`btn btn-sm ${armed ? 'btn-danger' : ''} ${cls}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirmLabel : label}
    </button>
  )
}
