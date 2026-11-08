import { useEffect, useMemo, useState } from 'preact/hooks'
import type { BoardProps } from '../../core/types'
import {
  BAR,
  OFF,
  legalSequences,
  replay,
  rollDice,
  rollToString,
  seqToString,
  type BackgammonMove,
  type BackgammonState,
  type Color,
  type Step,
} from './logic'
import './backgammon.css'

/*
 * Geometría en "unidades" (u): el tablero mide 14u × 13u.
 * Columnas 0–5 y 7–12 son puntas; 6 es la barra; 13 es la bandeja de fichas fuera.
 * Arriba: puntas 13–24; abajo: 12–1 (vista de blancas). Para negras se espeja en vertical (ver CSS).
 */
const W = 14
const H = 13
const TOP_Y = 0.15
const BOTTOM_Y = 12.85
const POINT_H = 5.2

function colOf(p: number): number {
  if (p >= 19) return p - 19 + 7
  if (p >= 13) return p - 13
  if (p >= 7) return 12 - p
  return 6 - p + 7
}
const isTop = (p: number) => p >= 13

/** Posición (en u) de la ficha número i de una pila de n en la punta p. */
function stackXY(p: number, i: number, n: number) {
  const sp = n <= 5 ? 1 : 4 / (n - 1)
  const x = colOf(p)
  return isTop(p) ? { x, y: TOP_Y + i * sp } : { x, y: BOTTOM_Y - 1 - i * sp }
}
const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` })

/* ---------- Identidad de cada ficha (para animar) ---------- */

interface Stacks {
  points: string[][] // índice 0..25
  bar: Record<Color, string[]>
  off: Record<Color, string[]>
}

function initialStacks(): Stacks {
  const points: string[][] = Array.from({ length: 26 }, () => [])
  const add = (p: number, c: Color, n: number) => {
    for (let k = 0; k < n; k++) points[p].push(`${c}${p}-${k}`)
  }
  add(24, 'w', 2)
  add(13, 'w', 5)
  add(8, 'w', 3)
  add(6, 'w', 5)
  add(1, 'b', 2)
  add(12, 'b', 5)
  add(17, 'b', 3)
  add(19, 'b', 5)
  return { points, bar: { w: [], b: [] }, off: { w: [], b: [] } }
}

function moveIds(st: Stacks, c: Color, s: Step) {
  const o: Color = c === 'w' ? 'b' : 'w'
  const id = s.from === BAR[c] ? st.bar[c].pop()! : st.points[s.from].pop()!
  if (s.to === OFF[c]) {
    st.off[c].push(id)
    return
  }
  const dest = st.points[s.to]
  if (dest.length === 1 && dest[0][0] === o) st.bar[o].push(dest.pop()!)
  dest.push(id)
}

/* ---------- Arte (fichas y dados de Codex, con respaldo CSS) ---------- */

let art = false
export async function probeBackgammonArt(): Promise<void> {
  art = await new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = `${import.meta.env.BASE_URL}assets/backgammon/w-checker.webp`
  })
}

export function BgChecker({ color }: { color: Color }) {
  if (art) return <img class="bg-img" src={`${import.meta.env.BASE_URL}assets/backgammon/${color}-checker.webp`} alt="" draggable={false} />
  return <span class={`bg-disc bg-disc-${color}`} />
}

function Die({ value, used, rolling }: { value: number; used: boolean; rolling: boolean }) {
  return (
    <span class={`bg-die upright${used ? ' used' : ''}${rolling ? ' rolling' : ''}`} aria-label={`Dado: ${value}`}>
      {art ? <img src={`${import.meta.env.BASE_URL}assets/backgammon/dice-${value}.webp`} alt="" draggable={false} /> : <span class="bg-die-css">{value}</span>}
    </span>
  )
}

/* ---------- Tablero ---------- */

export interface BgAnnotations {
  /** Puntas a resaltar (pista). */
  marks?: number[]
}

export function BackgammonBoard({ state, viewSeat, controls, onMove, annotations }: BoardProps<BackgammonState, BackgammonMove>) {
  const { pos, hist } = replay(state)
  const c = pos.turn
  const seat = c === 'w' ? 0 : 1
  const canAct = controls === 'both' || controls === seat
  const flipped = viewSeat === 1
  const hintPoints = new Set((annotations as BgAnnotations | undefined)?.marks ?? [])

  const [partial, setPartial] = useState<Step[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  // Al cambiar la partida (tirada, jugada remota, deshacer) se reinicia la selección.
  useEffect(() => {
    setPartial([])
    setSelected(null)
  }, [state.moves.length])

  const seqs = useMemo(() => (pos.dice ? legalSequences(pos, c, pos.dice) : []), [state.moves.length])
  const needed = seqs[0]?.length ?? 0
  const noMoves = !!pos.dice && needed === 0
  const remaining = useMemo(
    () => seqs.filter((s) => partial.every((p, i) => s[i] && s[i].from === p.from && s[i].to === p.to)),
    [seqs, partial],
  )
  const nextSteps = remaining.map((s) => s[partial.length]).filter(Boolean)
  const movable = new Set(nextSteps.map((s) => s.from))
  const targets = new Set(selected !== null ? nextSteps.filter((s) => s.from === selected).map((s) => s.to) : [])

  // Con una sola pieza que se pueda mover (p. ej. desde la barra) se selecciona sola.
  useEffect(() => {
    if (canAct && selected === null && movable.size === 1) setSelected([...movable][0])
  }, [partial.length, seqs, canAct])

  // Sin jugadas posibles: se pasa solo tras un momento.
  useEffect(() => {
    if (!canAct || !noMoves) return
    const t = setTimeout(() => onMove(seqToString([])), 1600)
    return () => clearTimeout(t)
  }, [canAct, noMoves, state.moves.length])

  // Identidades de las fichas (para que se deslicen al moverse).
  const stacks = useMemo(() => {
    const st = initialStacks()
    for (const h of hist) if (h.seq) for (const s of h.seq) moveIds(st, h.color, s)
    for (const s of partial) moveIds(st, c, s)
    return st
  }, [state.moves.length, partial])

  function tapPoint(p: number) {
    if (!canAct || !pos.dice) return
    if (selected !== null && targets.has(p)) {
      const step = nextSteps.find((s) => s.from === selected && s.to === p)!
      const next = [...partial, step]
      setSelected(null)
      if (next.length === needed) onMove(seqToString(next))
      else setPartial(next)
      return
    }
    setSelected(movable.has(p) && selected !== p ? p : null)
  }

  // Dados usados (para atenuarlos).
  const usedDice = useMemo(() => {
    if (!pos.dice) return []
    const all = pos.dice[0] === pos.dice[1] ? [...pos.dice, ...pos.dice] : pos.dice.slice()
    const used = all.map(() => false)
    for (const s of partial) {
      const k = all.findIndex((d, i) => !used[i] && d === s.die)
      if (k >= 0) used[k] = true
    }
    return all.map((d, i) => ({ d, used: used[i] }))
  }, [pos.dice, partial])

  // Piezas a dibujar.
  const pieces: { id: string; color: Color; x: number; y: number; count?: number }[] = []
  for (let p = 1; p <= 24; p++) {
    const ids = stacks.points[p]
    ids.forEach((id, i) => {
      const { x, y } = stackXY(p, i, ids.length)
      pieces.push({ id, color: id[0] as Color, x, y })
    })
  }
  ;(['w', 'b'] as Color[]).forEach((col) => {
    stacks.bar[col].forEach((id, i) => {
      const y = col === 'w' ? 7.6 + i * 0.75 : 4.4 - i * 0.75
      pieces.push({ id, color: col, x: 6, y })
    })
  })

  const myBarTap = canAct && movable.has(BAR[c])
  const offTarget = selected !== null && targets.has(OFF[c])
  const lastRoll = hist.length > 0 && hist[hist.length - 1].dice ? state.moves.length : -1

  return (
    <div class={`bg-board${flipped ? ' flipped' : ''}`} role="grid" aria-label="Tablero de backgammon">
      <svg class="bg-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width={W} height={H} class="bg-felt" />
        <rect x="6" y="0" width="1" height={H} class="bg-bar" />
        <rect x="13" y="0" width="1" height={H} class="bg-tray" />
        {Array.from({ length: 24 }, (_, k) => k + 1).map((p) => {
          const x = colOf(p)
          const top = isTop(p)
          const pts = top
            ? `${x + 0.04},${TOP_Y} ${x + 0.96},${TOP_Y} ${x + 0.5},${TOP_Y + POINT_H}`
            : `${x + 0.04},${BOTTOM_Y} ${x + 0.96},${BOTTOM_Y} ${x + 0.5},${BOTTOM_Y - POINT_H}`
          const hl = targets.has(p) || hintPoints.has(p)
          return <polygon key={p} points={pts} class={`${x % 2 === 0 ? 'pt-a' : 'pt-b'}${hl ? ' pt-hl' : ''}${selected === p ? ' pt-sel' : ''}`} />
        })}
      </svg>

      {/* Zonas táctiles: una por punta (toda la mitad), la barra y la bandeja. */}
      {Array.from({ length: 24 }, (_, k) => k + 1).map((p) => (
        <button
          key={`hit-${p}`}
          class={`bg-hit${movable.has(p) && canAct ? ' can' : ''}`}
          style={{ ...pct(colOf(p), isTop(p) ? 0 : H / 2), width: `${100 / W}%`, height: '50%' }}
          onClick={() => tapPoint(p)}
          aria-label={`Punta ${p}`}
          tabIndex={-1}
        />
      ))}
      {myBarTap && <button class="bg-hit can" style={{ ...pct(6, 0), width: `${100 / W}%`, height: '100%' }} onClick={() => tapPoint(BAR[c])} aria-label="Barra" />}
      <button
        class={`bg-tray-hit${offTarget ? ' target' : ''}`}
        style={{ ...pct(13, c === 'w' ? H / 2 : 0), width: `${100 / W}%`, height: '50%' }}
        onClick={() => offTarget && tapPoint(OFF[c])}
        aria-label="Sacar ficha"
        tabIndex={-1}
      />

      {/* Fichas fuera, como láminas en la bandeja */}
      {(['w', 'b'] as Color[]).map((col) =>
        stacks.off[col].map((id, i) => (
          <span key={id} class={`bg-off bg-off-${col}`} style={{ ...pct(13.1, col === 'w' ? BOTTOM_Y - 0.3 - i * 0.32 : TOP_Y + i * 0.32), width: `${(0.8 / W) * 100}%` }} />
        )),
      )}

      {pieces.map((pc) => (
        <div
          key={pc.id}
          class={`bg-checker${selected !== null && stacks.points[selected]?.at(-1) === pc.id ? ' lifted' : ''}${selected === BAR[c] && stacks.bar[c].at(-1) === pc.id ? ' lifted' : ''}`}
          style={{ ...pct(pc.x, pc.y), width: `${100 / W}%` }}
        >
          <BgChecker color={pc.color} />
        </div>
      ))}

      {/* Contadores en pilas altas */}
      {Array.from({ length: 24 }, (_, k) => k + 1).map((p) => {
        const n = stacks.points[p].length
        if (n <= 5) return null
        const { x, y } = stackXY(p, n - 1, n)
        return (
          <span key={`n-${p}`} class="bg-count upright" style={{ ...pct(x, y), width: `${100 / W}%` }}>
            {n}
          </span>
        )
      })}

      {/* Centro: dados, botón de tirar y avisos */}
      <div class="bg-center" style={{ ...pct(7, 5.45), width: `${(6 / W) * 100}%`, height: `${(2.1 / H) * 100}%` }}>
        {pos.dice ? (
          <div class="bg-dice" key={lastRoll}>
            {usedDice.map(({ d, used }, i) => (
              <Die key={i} value={d} used={used} rolling={lastRoll === state.moves.length} />
            ))}
          </div>
        ) : (
          canAct && (
            <button class="btn btn-primary btn-sm bg-roll upright" onClick={() => onMove(rollToString(rollDice()))}>
              🎲 Tirar dados
            </button>
          )
        )}
      </div>
      <div class="bg-center bg-status upright" style={{ ...pct(0, 5.45), width: `${(6 / W) * 100}%`, height: `${(2.1 / H) * 100}%` }}>
        {noMoves ? <span>Sin jugadas posibles…</span> : pos.dice && canAct && needed > 0 ? <span>{`Mueve ${needed - partial.length} ${needed - partial.length === 1 ? 'ficha' : 'fichas'}`}</span> : null}
        {partial.length > 0 && canAct && (
          <button
            class="btn btn-sm bg-undo"
            onClick={() => {
              setPartial(partial.slice(0, -1))
              setSelected(null)
            }}
          >
            ↶
          </button>
        )}
      </div>
    </div>
  )
}

/** Pips y fichas fuera de cada jugador (junto a su nombre). */
export function BgInfo({ state, seat }: { state: BackgammonState; seat: 0 | 1 }) {
  const pos = replay(state).pos
  const col: Color = seat === 0 ? 'w' : 'b'
  let pipsLeft = pos.bar[col] * 25
  for (let i = 1; i <= 24; i++) {
    const n = Math.max(0, pos.points[i] * (col === 'w' ? 1 : -1))
    pipsLeft += n * (col === 'w' ? i : 25 - i)
  }
  return (
    <div class="bg-info" aria-label={`${pipsLeft} pips, ${pos.off[col]} fichas fuera`}>
      <span>{pipsLeft} pips</span>
      {pos.off[col] > 0 && <span>· {pos.off[col]} fuera</span>}
    </div>
  )
}
