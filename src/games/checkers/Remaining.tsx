import type { Seat } from '../../core/types'
import { CheckerArt } from './art'
import { counts, type CheckersState } from './logic'

/** Fichas y damas que le quedan a cada jugador. */
export function Remaining({ state, seat }: { state: CheckersState; seat: Seat }) {
  const color = seat === 0 ? 'w' : 'b'
  const c = counts(state)[color]
  return (
    <div class="checker-count" aria-label={`Quedan ${c.men} fichas y ${c.kings} damas`}>
      <span class="mini">
        <CheckerArt color={color} king={false} />
      </span>
      {c.men}
      {c.kings > 0 && (
        <>
          <span class="mini">
            <CheckerArt color={color} king />
          </span>
          {c.kings}
        </>
      )}
    </div>
  )
}
