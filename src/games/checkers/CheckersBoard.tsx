import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { BoardProps } from '../../core/types'
import { CheckerArt, checkerLabel } from './art'
import { legalSteps, moveToString, position, sqName, track, type CheckersMove, type CheckersState } from './logic'
import '../chess/chess.css'
import './checkers.css'

/** Coordenadas visuales (0..7) de una casilla según la orientación. */
function xy(i: number, flipped: boolean) {
  const f = i % 8
  const r = Math.floor(i / 8)
  return flipped ? { x: 7 - f, y: r } : { x: f, y: 7 - r }
}
function fromXY(x: number, y: number, flipped: boolean) {
  return flipped ? 7 - x + y * 8 : x + (7 - y) * 8
}
const cell = (i: number, flipped: boolean) => {
  const { x, y } = xy(i, flipped)
  return { transform: `translate(${x * 100}%, ${y * 100}%)` }
}

/** Marcas sobre casillas (índice 0..63): pistas de la computadora, etc. */
export interface CheckersAnnotations {
  marks?: { square: number; tone: 'hint' | 'wrong' | 'good' }[]
}

export function CheckersBoard({ state, viewSeat, controls, onMove, annotations }: BoardProps<CheckersState, CheckersMove>) {
  const flipped = viewSeat === 1
  const marks = (annotations as CheckersAnnotations | undefined)?.marks ?? []
  const pos = position(state)
  const tracked = useMemo(() => track(state), [state])
  const turnSeat = pos.turn === 'w' ? 0 : 1
  const steps = useMemo(() => legalSteps(pos.board, pos.turn), [state])
  const canAct = steps.length > 0 && (controls === 'both' || controls === turnSeat)

  /** Recorrido parcial: [origen, aterrizajes ya elegidos…]. */
  const [partial, setPartial] = useState<number[]>([])
  const boardRef = useRef<HTMLDivElement>(null)

  // Si cambia la partida, se cancela lo que se estaba eligiendo.
  const plyRef = useRef(state.moves.length)
  if (plyRef.current !== state.moves.length) {
    plyRef.current = state.moves.length
    if (partial.length) setPartial([])
  }

  const candidates = useMemo(
    () => (partial.length ? steps.filter((s) => partial.every((sq, i) => s.path[i] === sq)) : []),
    [partial, steps],
  )
  const targets = useMemo(() => new Set(candidates.map((s) => s.path[partial.length]).filter((x) => x !== undefined)), [candidates, partial])
  const movable = useMemo(() => new Set(canAct ? steps.map((s) => s.path[0]) : []), [steps, canAct])
  const mustCapture = steps.length > 0 && steps[0].captured.length > 0
  const pendingCaptured = new Set(candidates[0]?.captured.slice(0, Math.max(0, partial.length - 1)) ?? [])

  function choose(sq: number) {
    if (!canAct) return
    if (partial.length === 0 || (movable.has(sq) && !targets.has(sq))) {
      setPartial(movable.has(sq) ? [sq] : [])
      return
    }
    if (!targets.has(sq)) {
      setPartial([])
      return
    }
    const next = [...partial, sq]
    const done = candidates.find((s) => s.path.length === next.length && s.path.every((x, i) => x === next[i]))
    if (done) {
      setPartial([])
      onMove(moveToString(done.path))
    } else setPartial(next)
  }

  function squareAt(e: PointerEvent): number | null {
    const r = boardRef.current!.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * 8)
    const y = Math.floor(((e.clientY - r.top) / r.height) * 8)
    if (x < 0 || x > 7 || y < 0 || y > 7) return null
    return fromXY(x, y, flipped)
  }

  // Animación por el camino en zigzag de una captura múltiple.
  const pieceEls = useRef(new Map<string, HTMLElement>())
  useEffect(() => {
    const last = tracked.last
    if (!last || last.path.length < 3) return
    const moved = tracked.pieces.find((p) => p.square === last.path[last.path.length - 1])
    const el = moved && pieceEls.current.get(moved.id)
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const frames = last.path.map((sq) => {
      const { x, y } = xy(sq, flipped)
      return { transform: `translate(${x * 100}%, ${y * 100}%)` }
    })
    el.animate(frames, { duration: 220 * (last.path.length - 1), easing: 'ease-in-out' })
  }, [state.moves.length])

  // Pieza seleccionada: se dibuja donde va el recorrido parcial.
  const lifted = partial.length ? tracked.pieces.find((p) => p.square === partial[0]) : null

  return (
    <div
      ref={boardRef}
      class={`chess-board checkers-board${flipped ? ' flipped' : ''}${canAct ? ' can-act' : ''}`}
      onPointerDown={(e) => {
        const sq = squareAt(e)
        if (sq !== null) choose(sq)
      }}
      role="grid"
      aria-label="Tablero de damas"
    >
      <Squares flipped={flipped} />

      {tracked.last && (
        <>
          <div class="mark mark-last" style={cell(tracked.last.path[0], flipped)} />
          <div class="mark mark-last" style={cell(tracked.last.path[tracked.last.path.length - 1], flipped)} />
        </>
      )}
      {mustCapture && canAct && partial.length === 0 &&
        [...movable].map((sq) => <div key={`must-${sq}`} class="mark mark-tone-hint" style={cell(sq, flipped)} />)}
      {marks.map((m) => (
        <div key={`am-${m.square}-${m.tone}`} class={`mark mark-tone-${m.tone}`} style={cell(m.square, flipped)} />
      ))}
      {partial.map((sq, i) => (
        <div key={`p-${sq}-${i}`} class="mark mark-select" style={cell(sq, flipped)} />
      ))}

      {tracked.lastCaptured.map((p) => (
        <div key={`cap-${state.moves.length}-${p.id}`} class="piece piece-captured" style={cell(p.square, flipped)} aria-hidden="true">
          <CheckerArt color={p.color} king={p.king} />
        </div>
      ))}

      {tracked.pieces.map((p, i) => {
        const at = lifted && p.id === lifted.id ? partial[partial.length - 1] : p.square
        return (
          <div
            key={p.id}
            ref={(el) => {
              if (el) pieceEls.current.set(p.id, el)
              else pieceEls.current.delete(p.id)
            }}
            class={`piece checker${pendingCaptured.has(p.square) ? ' pending-capture' : ''}`}
            style={{ ...cell(at, flipped), animationDelay: `${(i % 12) * 18}ms` }}
            aria-label={`${checkerLabel(p.color, p.king)} en ${sqName(p.square)}`}
          >
            <CheckerArt color={p.color} king={p.king} />
          </div>
        )
      })}

      {[...targets].map((sq) => (
        <div key={`t-${sq}`} class={`mark ${mustCapture ? 'mark-capture-landing' : 'mark-hint'}`} style={cell(sq, flipped)} />
      ))}
    </div>
  )
}

function Squares({ flipped }: { flipped: boolean }) {
  const cells = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = fromXY(x, y, flipped)
      const dark = ((i % 8) + Math.floor(i / 8)) % 2 === 0
      const name = sqName(i)
      cells.push(
        <div key={i} class={`sq ${dark ? 'dark' : 'light'}`}>
          {x === 0 && <span class="coord rank">{name[1]}</span>}
          {y === 7 && <span class="coord file">{name[0]}</span>}
        </div>,
      )
    }
  }
  return <div class="squares">{cells}</div>
}

