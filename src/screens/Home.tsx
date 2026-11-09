import { useState } from 'preact/hooks'
import { navigate } from '../core/router'
import { getProfile, getStats, setProfile } from '../core/storage'
import { install, usePwa } from '../core/pwa'
import { COMING_SOON, GAMES, SOLO_GAMES } from '../games/registry'
import { getSession } from '../net/session'
import { GameIcon } from '../ui/GameIcon'
import './home.css'

export function Home() {
  const [name, setName] = useState(getProfile().name)
  const [editing, setEditing] = useState(!getProfile().name)
  const pwa = usePwa()
  const session = getSession()
  const liveRoom = session && session.status !== 'closed' && session.status !== 'error' ? session : null

  function saveName(e: Event) {
    e.preventDefault()
    const n = name.trim().slice(0, 20)
    setProfile({ name: n })
    setName(n)
    setEditing(false)
  }

  return (
    <div class="screen wide home">
      <header class="brand enter">
        <img class="brand-logo" src={`${import.meta.env.BASE_URL}assets/brand/logo-mark.svg`} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
        <h1 class="brand-name">Juegoteca</h1>
      </header>

      {editing ? (
        <form class="card stack enter" onSubmit={saveName}>
          <label for="name" class="dim">¿Cómo te llamas? Tu rival verá este nombre.</label>
          <input id="name" class="input" value={name} maxLength={20} autoComplete="nickname" placeholder="Tu nombre" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          <button class="btn btn-primary" type="submit">Listo</button>
        </form>
      ) : (
        <button class="greeting enter" onClick={() => setEditing(true)}>
          Hola, <strong>{name}</strong> <span class="dim">· cambiar</span>
        </button>
      )}

      {liveRoom && (
        <button class="btn btn-primary enter" onClick={() => navigate('sala')}>
          Volver a la sala {liveRoom.code}
        </button>
      )}

      <button class="btn join-btn enter" onClick={() => navigate('unirse')}>
        <span class="join-icon" aria-hidden="true">⌘</span>
        <span class="btn-col" style="align-items:flex-start">
          Unirme a una sala
          <span class="sub">Tengo un código de 4 letras</span>
        </span>
      </button>

      <section>
        <h2 class="section-title">Juegos</h2>
        <div class="game-grid stagger">
          {GAMES.map((g) => {
            const st = getStats(g.id)
            return (
              <button key={g.id} class="game-card" onClick={() => navigate(`g/${g.id}`)}>
                <GameIcon id={g.id} glyph={g.glyph} />
                <span class="game-name">{g.name}</span>
                <span class="game-tag">{st.played ? `${st.played} partidas` : g.tagline}</span>
              </button>
            )
          })}
          {SOLO_GAMES.map((g) => (
            <button key={g.id} class="game-card" onClick={() => navigate(`g/${g.id}`)}>
              <GameIcon id={g.id} glyph={g.glyph} />
              <span class="game-name">{g.name}</span>
              <span class="game-tag">{g.progressLabel?.() ?? g.tagline}</span>
            </button>
          ))}
          {COMING_SOON.map((g) => (
            <div key={g.id} class="game-card soon" aria-disabled="true">
              <GameIcon id={g.id} glyph={g.glyph} />
              <span class="game-name">{g.name}</span>
              <span class="game-tag">Próximamente</span>
            </div>
          ))}
        </div>
      </section>

      <footer class="home-foot">
        {pwa.canInstall && (
          <button class="btn btn-ghost btn-sm" onClick={install}>
            Instalar app
          </button>
        )}
        <a class="dim foot-link" href="#/acerca">
          v{__APP_VERSION__} · software libre
        </a>
      </footer>
    </div>
  )
}
