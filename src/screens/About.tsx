import { back } from '../core/router'

const REPO = 'https://github.com/dponch-00/juegoteca'

/** Créditos y licencias (requisito de la GPL: decir dónde está el código fuente). */
export function About() {
  return (
    <div class="screen">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back()} aria-label="Volver">←</button>
        <h1>Acerca de Juegoteca</h1>
      </header>

      <div class="card stack enter">
        <p>
          Juegoteca es <strong>software libre</strong> bajo la licencia GPL-3.0: puedes usarla, estudiarla, modificarla y compartirla,
          siempre con la misma licencia.
        </p>
        <a class="btn btn-sm" href={REPO} target="_blank" rel="noopener">
          Código fuente en GitHub
        </a>
      </div>

      <section class="stack stagger">
        <h2 class="section-title">Hecha con</h2>
        <Credit name="Stockfish 19" what="El motor de ajedrez de la computadora (stockfish.js, versión lite)." license="GPL-3.0" href="https://github.com/nmrugg/stockfish.js" />
        <Credit name="Lichess" what="Los retos de ajedrez vienen de su base de problemas abierta." license="CC0" href="https://database.lichess.org/#puzzles" />
        <Credit name="chess.js" what="Reglas del ajedrez." license="BSD-2-Clause" href="https://github.com/jhlywa/chess.js" />
        <Credit name="PeerJS" what="Conexión directa entre dispositivos para las salas." license="MIT" href="https://github.com/peers/peerjs" />
        <Credit name="Preact" what="La interfaz." license="MIT" href="https://github.com/preactjs/preact" />
        <Credit name="Fraunces y Atkinson Hyperlegible Next" what="Tipografías." license="SIL OFL 1.1" href="https://github.com/undercasetype/Fraunces" />
      </section>
    </div>
  )
}

function Credit({ name, what, license, href }: { name: string; what: string; license: string; href: string }) {
  return (
    <a class="card credit" href={href} target="_blank" rel="noopener">
      <strong>{name}</strong>
      <span class="dim">{what}</span>
      <span class="credit-license">{license}</span>
    </a>
  )
}
