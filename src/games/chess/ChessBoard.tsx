import { useMemo, useRef, useState } from 'preact/hooks'
import type { Color, PieceSymbol, Square } from 'chess.js'
import type { BoardProps } from '../../core/types'
import { engine, squareXY, toUci, track, xyToSquare, type ChessMove, type ChessState } from './logic'
import { PieceArt, pieceLabel } from './pieces'
import './chess.css'

interface Drag {
  id: string
  from: Square
  startX: number
  startY: number
  x: number
  y: number
  active: boolean
}

const PROMOS: PieceSymbol[] = ['q', 'r', 'b', 'n']

export type ArrowTone = 'best' | 'played' | 'hint'
export interface ChessAnnotations {
  arrows?: { from: string; to: string; tone: ArrowTone }[]
}

export function ChessBoard({ state, viewSeat, controls, onMove, annotations }: BoardProps<ChessState, ChessMove>) {
  const arrows = (annotations as ChessAnnotations | undefined)?.arrows ?? []
  const flipped = viewSeat === 1
  const chess = engine(state)
  const tracked = useMemo(() => track(state), [state])
  const turnColor = chess.turn()
  const turnSeat = turnColor === 'w' ? 0 : 1
  const over = chess.isGameOver()
  const canAct = !over && (controls === 'both' || controls === turnSeat)

  const [selected, setSelected] = useState<Square | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Si cambia la partida (jugada remota, deshacer) se limpia la selección.
  const plyRef = useRef(state.moves.length)
  if (plyRef.current !== state.moves.length) {
    plyRef.current = state.moves.length
    if (selected) setSelected(null)
    if (promo) setPromo(null)
  }

  const targets = useMemo(() => {
    if (!selected || !canAct) return new Map<string, boolean>()
    const m = new Map<string, boolean>()
    for (const mv of chess.moves({ square: selected, verbose: true })) m.set(mv.to, mv.isCapture())
    return m
  }, [selected, canAct, state])

  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null
    return tracked.pieces.find((p) => p.type === 'k' && p.color === turnColor)?.square ?? null
  }, [state])

  function squareFromPoint(clientX: number, clientY: number): Square | null {
    const el = boardRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const x = Math.floor(((clientX - r.left) / r.width) * 8)
    const y = Math.floor(((clientY - r.top) / r.height) * 8)
    if (x < 0 || x > 7 || y < 0 || y > 7) return null
    return xyToSquare(x, y, flipped)
  }

  function ownPieceAt(sq: Square) {
    const p = chess.get(sq)
    return p && p.color === turnColor ? p : null
  }

  function tryMove(from: Square, to: Square): boolean {
    if (!canAct) return false
    const legal = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (legal.length === 0) return false
    setSelected(null)
    if (legal.some((m) => m.isPromotion())) {
      setPromo({ from, to })
      return true
    }
    onMove(toUci(from, to))
    return true
  }

  function onPointerDown(e: PointerEvent) {
    if (promo) return
    const sq = squareFromPoint(e.clientX, e.clientY)
    if (!sq) return
    if (canAct && ownPieceAt(sq)) {
      const piece = tracked.pieces.find((p) => p.square === sq)
      setSelected(sq)
      if (piece) {
        const r = boardRef.current!.getBoundingClientRect()
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        setDrag({
          id: piece.id,
          from: sq,
          startX: e.clientX,
          startY: e.clientY,
          x: e.clientX - r.left,
          y: e.clientY - r.top,
          active: false,
        })
      }
      return
    }
    if (selected && targets.has(sq)) {
      tryMove(selected, sq)
      return
    }
    setSelected(null)
  }

  function onPointerMove(e: PointerEvent) {
    if (!drag) return
    const r = boardRef.current!.getBoundingClientRect()
    const moved = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6
    setDrag({ ...drag, x: e.clientX - r.left, y: e.clientY - r.top, active: drag.active || moved })
  }

  function onPointerUp(e: PointerEvent) {
    if (!drag) return
    const d = drag
    setDrag(null)
    if (!d.active) return // fue un toque: la selección ya quedó hecha
    const sq = squareFromPoint(e.clientX, e.clientY)
    if (sq && sq !== d.from) tryMove(d.from, sq)
  }

  const cellStyle = (sq: string) => {
    const { x, y } = squareXY(sq, flipped)
    return { transform: `translate(${x * 100}%, ${y * 100}%)` }
  }

  const boardPx = boardRef.current?.getBoundingClientRect().width ?? 0

  return (
    <div
      ref={boardRef}
      class={`chess-board${flipped ? ' flipped' : ''}${canAct ? ' can-act' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
      role="grid"
      aria-label="Tablero de ajedrez"
    >
      <Squares flipped={flipped} />

      {tracked.lastMove && (
        <>
          <div class="mark mark-last" style={cellStyle(tracked.lastMove.from)} />
          <div class="mark mark-last" style={cellStyle(tracked.lastMove.to)} />
        </>
      )}
      {checkSquare && <div class="mark mark-check" style={cellStyle(checkSquare)} />}
      {selected && <div class="mark mark-select" style={cellStyle(selected)} />}

      {tracked.lastCaptured && (
        <div
          key={`cap-${state.moves.length}`}
          class="piece piece-captured"
          style={cellStyle(tracked.lastCaptured.square)}
          aria-hidden="true"
        >
          <PieceArt color={tracked.lastCaptured.color} type={tracked.lastCaptured.type} />
        </div>
      )}

      {tracked.pieces.map((p, i) => {
        const dragging = drag?.active && drag.id === p.id
        const style = dragging
          ? {
              transform: `translate(${drag!.x - boardPx / 16}px, ${drag!.y - boardPx / 16 - boardPx / 20}px) scale(1.18)`,
              zIndex: 5,
              transition: 'none',
            }
          : { ...cellStyle(p.square), animationDelay: `${(i % 16) * 18}ms` }
        return (
          <div key={p.id} class={`piece${dragging ? ' dragging' : ''}`} style={style} aria-label={pieceLabel(p.color, p.type)}>
            <PieceArt color={p.color} type={p.type} />
          </div>
        )
      })}

      {[...targets].map(([sq, capture]) => (
        <div key={`t-${sq}`} class={`mark ${capture ? 'mark-capture' : 'mark-hint'}`} style={cellStyle(sq)} />
      ))}

      {arrows.length > 0 && <Arrows arrows={arrows} flipped={flipped} />}

      {promo && (
        <PromotionPicker
          color={turnColor}
          onPick={(t) => {
            onMove(toUci(promo.from, promo.to, t))
            setPromo(null)
          }}
          onCancel={() => setPromo(null)}
        />
      )}
    </div>
  )
}

/** Flechas de casilla a casilla (coordenadas en unidades de casilla, 8×8). */
function Arrows({ arrows, flipped }: { arrows: NonNullable<ChessAnnotations['arrows']>; flipped: boolean }) {
  return (
    <svg class="arrows" viewBox="0 0 8 8" aria-hidden="true">
      <defs>
        {(['best', 'played', 'hint'] as const).map((tone) => (
          <marker key={tone} id={`head-${tone}`} viewBox="0 0 4 4" refX="2" refY="2" markerWidth="2.6" markerHeight="2.6" orient="auto">
            <path d="M0 0 4 2 0 4z" class={`arrow-${tone}`} />
          </marker>
        ))}
      </defs>
      {arrows.map((a, i) => {
        const f = squareXY(a.from, flipped)
        const t = squareXY(a.to, flipped)
        const x1 = f.x + 0.5
        const y1 = f.y + 0.5
        // Acortamos la línea para que la punta no tape la pieza de destino.
        const dx = t.x - f.x
        const dy = t.y - f.y
        const len = Math.hypot(dx, dy) || 1
        const x2 = t.x + 0.5 - (dx / len) * 0.32
        const y2 = t.y + 0.5 - (dy / len) * 0.32
        return (
          <line
            key={`${a.from}${a.to}${i}`}
            class={`arrow arrow-${a.tone}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            marker-end={`url(#head-${a.tone})`}
          />
        )
      })}
    </svg>
  )
}

function Squares({ flipped }: { flipped: boolean }) {
  const cells = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const sq = xyToSquare(x, y, flipped)
      const dark = (x + y) % 2 === 1
      cells.push(
        <div key={sq} class={`sq ${dark ? 'dark' : 'light'}`}>
          {x === 0 && <span class="coord rank">{sq[1]}</span>}
          {y === 7 && <span class="coord file">{sq[0]}</span>}
        </div>,
      )
    }
  }
  return <div class="squares">{cells}</div>
}

function PromotionPicker({ color, onPick, onCancel }: { color: Color; onPick: (t: PieceSymbol) => void; onCancel: () => void }) {
  return (
    <div class="promo-backdrop" onPointerDown={(e) => { e.stopPropagation(); onCancel() }}>
      <div class="promo" onPointerDown={(e) => e.stopPropagation()}>
        <p>Coronar como…</p>
        <div class="promo-row">
          {PROMOS.map((t) => (
            <button key={t} class="promo-btn" onClick={() => onPick(t)} aria-label={pieceLabel(color, t)}>
              <PieceArt color={color} type={t} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
