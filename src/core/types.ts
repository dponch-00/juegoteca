import type { ComponentType } from 'preact'

/** Asiento de un jugador: 0 = el que empieza (blancas en ajedrez), 1 = el otro. */
export type Seat = 0 | 1

export interface Outcome {
  /** null = empate */
  winner: Seat | null
  reason: string
}

export interface BoardProps<S, M> {
  state: S
  /** Desde qué asiento se ve el tablero (abajo). */
  viewSeat: Seat
  /** Qué asientos puede mover este dispositivo: 'both' en pasa-y-juega. */
  controls: Seat | 'both' | null
  onMove: (move: M) => void
}

/**
 * Contrato de un juego de turnos para dos.
 * La red solo transporta jugadas: ambos dispositivos validan con `apply`,
 * así que un juego nuevo no necesita tocar el código de red.
 */
export interface GameDef<S = any, M = any> {
  id: string
  name: string
  tagline: string
  /** Glifo provisional mientras no exista public/assets/games/<id>.svg */
  glyph: string
  seatNames: [string, string]
  create(): S
  /** Devuelve el estado nuevo, o null si la jugada no es legal. */
  apply(state: S, move: M): S | null
  turn(state: S): Seat
  outcome(state: S): Outcome | null
  /** Número de jugadas hechas; sirve para ordenar y detectar desincronía. */
  ply(state: S): number
  undo?(state: S): S
  /** Texto corto de estado ("Jaque", etc.) o null. */
  hint?(state: S): string | null
  Board: ComponentType<BoardProps<S, M>>
  /** Detalle opcional junto al nombre de cada jugador (p. ej. piezas capturadas). */
  PlayerExtra?: ComponentType<{ state: S; seat: Seat }>
}

export interface ComingSoon {
  id: string
  name: string
  tagline: string
  glyph: string
  soon: true
}
