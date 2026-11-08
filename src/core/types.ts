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
  /** Marcas propias de cada juego (p. ej. flechas de pista en ajedrez). */
  annotations?: unknown
}

/** Modo extra que un juego ofrece en su lobby (p. ej. "Contra la computadora"). */
export interface GameMode {
  /** Ruta dentro del juego: #/g/<juego>/<id> */
  id: string
  label: string
  sub: string
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
  /** Modos de un jugador que se muestran en el lobby. */
  soloModes?: GameMode[]
  /** Motor para jugar contra la computadora (pantalla genérica si el juego no trae una propia). */
  ai?: GameAI<S, M>
  /** Ícono pequeño de cada bando (para elegir color contra la computadora). */
  SeatIcon?: ComponentType<{ seat: Seat }>
  /** Pantallas propias del juego, por id de modo. */
  screens?: Record<string, ComponentType>
}

export interface AiLevel {
  id: number
  name: string
  blurb: string
}

/** Contrato de un motor de juego: la pantalla genérica "contra la computadora" solo usa esto. */
export interface GameAI<S = any, M = any> {
  levels: AiLevel[]
  /** Jugada de la computadora para el bando que mueve, según el nivel. */
  move(state: S, level: number): Promise<M>
  /** Mejor jugada para quien pide la pista. */
  hint?(state: S): Promise<M>
  /** Cómo mostrar la pista sobre el tablero (se pasa como `annotations`). */
  hintAnnotations?(state: S, move: M): unknown
}

export interface ComingSoon {
  id: string
  name: string
  tagline: string
  glyph: string
  soon: true
}
