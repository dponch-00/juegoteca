import { useEffect, useReducer, useRef, useState } from 'preact/hooks'
import { navigate } from '../core/router'
import { recordResult } from '../core/storage'
import type { Outcome, Seat } from '../core/types'
import { getSession, setSession, type OnlineSession } from '../net/session'
import { ConfirmButton, Match } from '../ui/Match'
import './room.css'

function useSessionUpdates(s: OnlineSession | null) {
  const [, force] = useReducer((n: number) => n + 1, 0)
  useEffect(() => (s ? s.subscribe(() => force(undefined)) : undefined), [s])
}

/** Pantalla de sala en línea: espera, partida y revancha. */
export function Room() {
  const session = getSession()
  useSessionUpdates(session)

  useEffect(() => {
    if (!session) navigate('', true)
  }, [session])
  if (!session) return null

  function exit() {
    setSession(null)
    navigate('', true)
  }

  if (session.status === 'error') {
    return (
      <div class="screen">
        <header class="topbar">
          <button class="icon-btn" onClick={exit} aria-label="Volver">←</button>
          <h1>Sala</h1>
        </header>
        <div class="card stack enter center">
          <div class="big-emoji" aria-hidden="true">⚠︎</div>
          <p>{session.error}</p>
          <button class="btn btn-primary" onClick={exit}>Volver al inicio</button>
        </div>
      </div>
    )
  }

  if (!session.started || !session.game) return <Waiting session={session} onExit={exit} />
  return <OnlineMatch session={session} onExit={exit} />
}

function Waiting({ session, onExit }: { session: OnlineSession; onExit: () => void }) {
  const [copied, setCopied] = useState(false)
  const connecting = session.status === 'connecting'
  const isHost = session.role === 'host'
  const link = `${location.origin}${location.pathname}#/unirse/${session.code}`

  async function share() {
    const text = `¡Juguemos ${session.game?.name.toLowerCase() ?? ''} en Juegoteca! Código de sala: ${session.code}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Juegoteca', text, url: link })
        return
      }
      await navigator.clipboard.writeText(`${text}\n${link}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* la persona canceló */
    }
  }

  return (
    <div class="screen">
      <header class="topbar">
        <button class="icon-btn" onClick={onExit} aria-label="Salir">←</button>
        <h1>{isHost ? `Sala de ${session.game?.name ?? ''}` : 'Entrando a la sala'}</h1>
      </header>

      {isHost && !connecting ? (
        <div class="card stack center enter">
          <p class="dim">Pásale este código a tu rival</p>
          <div class="room-code" aria-label={`Código ${session.code.split('').join(' ')}`}>
            {session.code.split('').map((ch, i) => (
              <span key={`${session.code}-${i}`} style={{ animationDelay: `${i * 70}ms` }}>
                {ch}
              </span>
            ))}
          </div>
          <button class="btn btn-primary" onClick={share}>
            {copied ? '¡Copiado!' : 'Compartir invitación'}
          </button>
          <p class="waiting dim">
            Esperando rival<span class="dots"><i>.</i><i>.</i><i>.</i></span>
          </p>
        </div>
      ) : (
        <div class="card stack center enter">
          <div class="spinner big" />
          <p>{isHost ? 'Abriendo sala…' : `Buscando la sala ${session.code}…`}</p>
        </div>
      )}

      <button class="btn btn-ghost" onClick={onExit}>Cancelar</button>
    </div>
  )
}

function OnlineMatch({ session, onExit }: { session: OnlineSession; onExit: () => void }) {
  const game = session.game!
  const state = session.state
  const me = session.seat
  const other: Seat = me === 0 ? 1 : 0
  const live = session.status === 'playing'

  let outcome: Outcome | null = game.outcome(state)
  if (!outcome && session.resigned != null) {
    const loser = session.resigned
    outcome = {
      winner: loser === 0 ? 1 : 0,
      reason: loser === me ? 'Te rendiste' : `${session.names[loser] || 'Tu rival'} se rindió`,
    }
  }

  // Guardar estadística una sola vez por partida.
  const recordedMatch = useRef(0)
  useEffect(() => {
    if (outcome && recordedMatch.current !== session.matchNo) {
      recordedMatch.current = session.matchNo
      recordResult(game.id, outcome.winner == null ? 'drawn' : outcome.winner === me ? 'won' : 'lost')
    }
  }, [!!outcome, session.matchNo])

  let banner = null
  if (session.status === 'reconnecting') {
    banner = (
      <div class="banner">
        <span class="spinner" />
        {session.role === 'host' ? `Esperando a que vuelva ${session.names[other] || 'tu rival'}…` : 'Reconectando…'}
      </div>
    )
  } else if (session.status === 'closed') {
    banner = <div class="banner bad">{session.error || 'La sala se cerró.'}</div>
  }

  const rematchLabel = session.rematch.me ? 'Esperando a tu rival…' : session.rematch.them ? '¡Acepta la revancha!' : 'Revancha (cambian colores)'

  return (
    <Match
      game={game}
      state={state}
      names={session.names}
      viewSeat={me}
      controls={live ? me : null}
      onMove={(m) => session.move(m)}
      outcome={outcome}
      me={me}
      title={
        <>
          {game.name} <span class="room-chip">{session.code}</span>
        </>
      }
      onBack={() => navigate('', false)}
      banner={banner}
      actions={
        <>
          <ConfirmButton label="Rendirme" confirmLabel="¿Seguro? Toca otra vez" onConfirm={() => session.resign()} />
          <ConfirmButton label="Salir de la sala" confirmLabel="¿Salir? Toca otra vez" onConfirm={onExit} />
        </>
      }
      resultActions={
        <>
          <button class="btn btn-primary" disabled={!live || session.rematch.me} onClick={() => session.requestRematch()}>
            {rematchLabel}
          </button>
          <button class="btn" onClick={onExit}>
            Salir de la sala
          </button>
        </>
      }
    />
  )
}
