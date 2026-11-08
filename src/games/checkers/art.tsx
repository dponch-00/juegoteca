/**
 * Arte de las fichas de damas. Codex entrega public/assets/checkers/{w,b}{man,king}.webp
 * (o .svg); mientras no existan, se dibujan con CSS.
 */
import type { Color } from './logic'

const FORMATS = ['webp', 'svg'] as const
let format: (typeof FORMATS)[number] | null = null

const src = (color: Color, king: boolean, fmt: string) =>
  `${import.meta.env.BASE_URL}assets/checkers/${color}${king ? 'king' : 'man'}.${fmt}`

export async function probeCheckersArt(): Promise<void> {
  for (const fmt of FORMATS) {
    const ok = await new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = src('w', false, fmt)
    })
    if (ok) {
      format = fmt
      return
    }
  }
}

export function CheckerArt({ color, king }: { color: Color; king: boolean }) {
  if (format) return <img class="checker-img" src={src(color, king, format)} alt="" draggable={false} decoding="async" />
  return (
    <span class={`disc disc-${color}${king ? ' disc-king' : ''}`}>
      {king && <span class="disc-crown">♛{'︎'}</span>}
    </span>
  )
}

export const checkerLabel = (color: Color, king: boolean) => `${king ? 'dama' : 'ficha'} ${color === 'w' ? 'blanca' : 'negra'}`
