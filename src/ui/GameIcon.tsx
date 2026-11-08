import { useState } from 'preact/hooks'

/** Icono del juego: el SVG de Codex si existe, si no un glifo provisional. */
export function GameIcon({ id, glyph }: { id: string; glyph: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span class="game-icon" aria-hidden="true">
      {failed ? (
        <span class="game-glyph">{glyph}{'︎'}</span>
      ) : (
        <img src={`${import.meta.env.BASE_URL}assets/games/${id}.svg`} alt="" onError={() => setFailed(true)} />
      )}
    </span>
  )
}
