import { applyUpdate, usePwa } from './core/pwa'
import { useRoute } from './core/router'
import { getGame } from './games/registry'
import { GameLobby } from './screens/GameLobby'
import { Home } from './screens/Home'
import { Join } from './screens/Join'
import { LocalMatch } from './screens/LocalMatch'
import { Room } from './screens/Room'

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
    if (game) return parts[2] === 'local' ? <LocalMatch game={game} /> : <GameLobby game={game} />
  }
  if (parts[0] === 'unirse') return <Join initial={parts[1]} />
  if (parts[0] === 'sala') return <Room />
  return <Home />
}
