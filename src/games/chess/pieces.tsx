import type { Color, PieceSymbol } from 'chess.js'

/**
 * Arte de las piezas. Codex entrega el juego en public/assets/chess/pieces/
 * como SVG (vectorial) o como WebP (render 3D); la app detecta cuál existe.
 * Si no hay ninguno, usa glifos Unicode provisionales (U+FE0E fuerza versión
 * de texto, no emoji, en Android/iOS).
 */
const SOLID: Record<PieceSymbol, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const OUTLINE: Record<PieceSymbol, string> = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
const NAMES: Record<PieceSymbol, string> = { k: 'rey', q: 'dama', r: 'torre', b: 'alfil', n: 'caballo', p: 'peón' }

/** Formatos aceptados, en orden de preferencia. */
const FORMATS = ['webp', 'svg'] as const
type Format = (typeof FORMATS)[number]

let format: Format | null = null

export function pieceSrc(color: Color, type: PieceSymbol, fmt: Format = format ?? 'svg'): string {
  return `${import.meta.env.BASE_URL}assets/chess/pieces/${color}${type}.${fmt}`
}

function exists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/** Se llama una vez al arrancar: comprueba qué arte existe (máx. ~1 ms si está en caché). */
export async function probePieceArt(): Promise<void> {
  for (const fmt of FORMATS) {
    if (await exists(pieceSrc('w', 'k', fmt))) {
      format = fmt
      return
    }
  }
}

export function pieceLabel(color: Color, type: PieceSymbol): string {
  return `${NAMES[type]} ${color === 'w' ? 'blanco' : 'negro'}`
}

export function PieceArt({ color, type }: { color: Color; type: PieceSymbol }) {
  if (format) return <img class="piece-img" src={pieceSrc(color, type)} alt="" draggable={false} decoding="async" />
  // Dos capas: el glifo sólido pinta el relleno y el de contorno dibuja los bordes encima.
  return (
    <span class={`piece-glyph glyph-${color}`}>
      <span class="glyph-fill">{SOLID[type]}{'︎'}</span>
      <span class="glyph-line">{OUTLINE[type]}{'︎'}</span>
    </span>
  )
}
