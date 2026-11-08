import { applyUpdate, usePwa } from './core/pwa'
import { useRoute } from './core/router'
import { getGame } from './games/registry'
import { GameLobby } from './screens/GameLobby'
import { Home } from './screens/Home'
import { Join } from './screens/Join'
import { LocalMatch } from './screens/LocalMatch'
import { Room } from './screens/Room'
import { About } from './screens/About'

export function App() {
  const path = useRoute()
  const pwa = usePwa()
  return (
    <>
      <Screen key={path} path={path} />
      {pwa.needRefresh && (
        <div class="toast" role="status">
          Hay una versión nueva
          <button class="btn btn-primary btn-sm" onClick={applyUpdate}>
            Actualizar
          </button>
        </div>
      )}
    </>
  )
}

function Screen({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'g' && parts[1]) {
    const game = getGame(parts[1])
    if (game) {
      if (parts[2] === 'local') return <LocalMatch game={game} />
      const Extra = parts[2] ? game.screens?.[parts[2]] : undefined
      if (Extra) return <Extra />
      return <GameLobby game={game} />
    }
  }
  if (parts[0] === 'unirse') return <Join initial={parts[1]} />
  if (parts[0] === 'sala') return <Room />
  if (parts[0] === 'acerca') return <About />
  return <Home />
}
