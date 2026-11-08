import { useEffect, useRef, useState } from 'preact/hooks'
import { back } from '../core/router'
import { load, recordResult, save } from '../core/storage'
import type { GameDef } from '../core/types'
import { Match } from '../ui/Match'

/** Pasa y juega: dos personas en el mismo dispositivo. La partida se guarda sola. */
export function LocalMatch({ game }: { game: GameDef }) {
  const key = `local:${game.id}`
  const [state, setState] = useState<unknown>(() => load(key, null) ?? game.create())
  const outcome = game.outcome(state)
  const recorded = useRef(false)

  useEffect(() => {
    save(key, state)
  }, [state])

  useEffect(() => {
    if (outcome && !recorded.current) {
      recorded.current = true
      recordResult(game.id, 'local')
    }
    if (!outcome) recorded.current = false
  }, [!!outcome])

  function onMove(m: unknown) {
    const next = game.apply(state, m)
    if (next) setState(next)
  }

  return (
    <Match
      game={game}
      state={state}
      names={[game.seatNames[0], game.seatNames[1]]}
      viewSeat={0}
      controls="both"
      onMove={onMove}
      outcome={outcome}
      me={null}
      title={`${game.name} · pasa y juega`}
      onBack={() => back(`g/${game.id}`)}
      actions={
        <>
          {game.undo && (
            <button class="btn btn-sm" disabled={game.ply(state) === 0} onClick={() => setState(game.undo!(state))}>
              ↶ Deshacer
            </button>
          )}
          <button class="btn btn-sm" disabled={game.ply(state) === 0} onClick={() => setState(game.create())}>
            ⟲ Reiniciar
          </button>
        </>
      }
      resultActions={
        <>
          <button class="btn btn-primary" onClick={() => setState(game.create())}>
            Otra partida
          </button>
          <button class="btn" onClick={() => back(`g/${game.id}`)}>
            Salir
          </button>
        </>
      }
    />
  )
}
