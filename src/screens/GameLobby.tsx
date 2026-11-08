import { back, navigate } from '../core/router'
import { displayName, getStats, load, remove } from '../core/storage'
import type { GameDef } from '../core/types'
import { OnlineSession, setSession } from '../net/session'
import { GameIcon } from '../ui/GameIcon'

export function GameLobby({ game }: { game: GameDef }) {
  const saved = load<unknown>(`local:${game.id}`, null)
  const savedPly = saved != null ? game.ply(saved) : 0
  const resumable = saved != null && savedPly > 0 && !game.outcome(saved)
  const st = getStats(game.id)

  function newLocal() {
    remove(`local:${game.id}`)
    navigate(`g/${game.id}/local`)
  }

  function createRoom() {
    setSession(OnlineSession.host(game, displayName()))
    navigate('sala')
  }

  return (
    <div class="screen">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back()} aria-label="Volver">←</button>
        <h1>{game.name}</h1>
      </header>

      <div class="lobby-hero enter">
        <GameIcon id={game.id} glyph={game.glyph} />
        <p class="dim">{game.tagline}</p>
      </div>

      <section class="stack stagger">
        <h2 class="section-title">En línea</h2>
        <button class="btn btn-primary btn-col" onClick={createRoom}>
          Crear sala
          <span class="sub">Te damos un código para tu rival</span>
        </button>
        <button class="btn btn-col" onClick={() => navigate('unirse')}>
          Unirme con código
          <span class="sub">Tu rival ya creó la sala</span>
        </button>
      </section>

      <section class="stack stagger">
        <h2 class="section-title">En este dispositivo</h2>
        {resumable && (
          <button class="btn btn-col" onClick={() => navigate(`g/${game.id}/local`)}>
            Continuar partida
            <span class="sub">{savedPly} jugadas hechas</span>
          </button>
        )}
        <button class="btn btn-col" onClick={newLocal}>
          {resumable ? 'Nueva partida (pasa y juega)' : 'Pasa y juega'}
          <span class="sub">Dos personas, un mismo tablero</span>
        </button>
      </section>

      {st.played > 0 && (
        <p class="dim center enter">
          {st.played} partidas · {st.won} ganadas · {st.lost} perdidas · {st.drawn} tablas en línea
        </p>
      )}
    </div>
  )
}
