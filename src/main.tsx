// Primero los estilos base: así el CSS de cada pantalla (importado por App) puede sobrescribirlos.
import './styles/tokens.css'
import './styles/base.css'
import { render } from 'preact'
import { App } from './app'
import { initPwa } from './core/pwa'
import { requestPersistence } from './core/storage'
import { probePieceArt } from './games/chess/pieces'
import { probeCheckersArt } from './games/checkers/art'

initPwa()
requestPersistence()

// Esperamos a saber si existe el arte final de las piezas (máx. ~1 ms si está en caché).
void Promise.all([probePieceArt(), probeCheckersArt()]).then(() => {
  render(<App />, document.getElementById('app')!)
})
