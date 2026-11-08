import type { Color, PieceSymbol } from 'chess.js'

/**
 * Arte de las piezas. Si Codex ya dejó los SVG en public/assets/chess/pieces/
 * se usan; si no, glifos Unicode provisionales (U+FE0E fuerza versión de texto,
 * no emoji, en Android/iOS).
 */
const SOLID: Record<PieceSymbol, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const OUTLINE: Record<PieceSymbol, string> = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
const NAMES: Record<PieceSymbol, string> = { k: 'rey', q: 'dama', r: 'torre', b: 'alfil', n: 'caballo', p: 'peón' }

let hasArt = false

export function pieceSrc(color: Color, type: PieceSymbol): string {
  return `${import.meta.env.BASE_URL}assets/chess/pieces/${color}${type}.svg`
}

/** Se llama una vez al arrancar: comprueba si existe el arte final. */
export function probePieceArt(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      hasArt = true
      resolve()
    }
    img.onerror = () => resolve()
    img.src = pieceSrc('w', 'k')
  })
}

export function pieceLabel(color: Color, type: PieceSymbol): string {
  return `${NAMES[type]} ${color === 'w' ? 'blanco' : 'negro'}`
}

export function PieceArt({ color, type }: { color: Color; type: PieceSymbol }) {
  if (hasArt) return <img class="piece-img" src={pieceSrc(color, type)} alt="" draggable={false} />
  // Dos capas: el glifo sólido pinta el relleno y el de contorno dibuja los bordes encima.
  return (
    <span class={`piece-glyph glyph-${color}`}>
      <span class="glyph-fill">{SOLID[type]}{'︎'}</span>
      <span class="glyph-line">{OUTLINE[type]}{'︎'}</span>
    </span>
  )
}
