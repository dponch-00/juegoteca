import type { PieceSymbol } from 'chess.js'
import type { Seat } from '../../core/types'
import { capturedBy, type ChessState } from './logic'
import { PieceArt } from './pieces'

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Piezas que capturó este jugador y su ventaja de material. */
export function Captured({ state, seat }: { state: ChessState; seat: Seat }) {
  const caps = capturedBy(state)
  const mine = seat === 0 ? caps.w : caps.b
  const theirs = seat === 0 ? caps.b : caps.w
  const diff = mine.reduce((a, p) => a + VALUE[p], 0) - theirs.reduce((a, p) => a + VALUE[p], 0)
  const victimColor = seat === 0 ? 'b' : 'w'
  return (
    <div class="captured">
      {mine.map((p, i) => (
        <span key={`${p}-${i}`} class="captured-piece">
          <PieceArt color={victimColor} type={p} />
        </span>
      ))}
      {diff > 0 && <span class="captured-diff">+{diff}</span>}
    </div>
  )
}
