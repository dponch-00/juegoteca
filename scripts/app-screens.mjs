// Capturas de la app real para revisar el diseño sin tocar un teléfono.
//
//   npm run app:screens               → todas
//   npm run app:screens -- sudoku     → solo las que contienen "sudoku" en el nombre
//
// Levanta Vite en el puerto 5199, abre Chrome o Edge sin ventana (protocolo DevTools,
// sin dependencias extra), siembra localStorage para cada escena y guarda PNG en
// design/review/app/ (fuera de git). Movimiento reducido para que nada salga a medio animar.
// Otro navegador: variable de entorno CHROME_PATH.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const OUT = 'design/review/app'
const PORT = 5199
const DEBUG_PORT = 9339
const filter = process.argv[2]

/* ---------- Tamaños ---------- */
const PHONE = { id: 'movil', width: 375, height: 812 }
const PHONE_LAND = { id: 'movil-horizontal', width: 812, height: 375 }
const TABLET = { id: 'tablet', width: 1180, height: 820 }

/* ---------- Escenas ---------- */
const profile = { 'juegoteca:profile': { name: 'Daniel' } }
const local = (game, moves) => ({ ...profile, [`juegoteca:local:${game}`]: { moves } })

// Pasos dentro de la página (async, con `sleep` y `click(selector)` disponibles).
const sudokuStart = `
  click('.btn-primary'); await sleep(900)
  const empty = () => [...document.querySelectorAll('.sd-cell')].filter((c) => c.getAttribute('aria-label').endsWith('vacía'))
  empty()[0].click(); await sleep(80)
  click('.sd-tool[aria-pressed]'); await sleep(80)
  for (const d of [1, 2, 5]) { document.querySelectorAll('.sd-key')[d - 1].click(); await sleep(60) }
  click('.sd-tool[aria-pressed]'); await sleep(80)
  empty()[3].click(); await sleep(80)
  document.querySelectorAll('.sd-key')[6].click(); await sleep(80)
  empty()[5].click(); await sleep(80)
`

const SCENES = [
  { name: 'inicio', route: '', seed: profile, desc: 'Inicio: saludo, unirse con código y los cuatro juegos' },
  { name: 'inicio-primera-vez', route: '', seed: {}, desc: 'Inicio la primera vez (pide el nombre)' },
  { name: 'ajedrez-lobby', route: 'g/chess', seed: profile, desc: 'Lobby de ajedrez: un jugador, en línea, este dispositivo' },
  { name: 'ajedrez-partida', route: 'g/chess/local', seed: local('chess', ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6']), sizes: 'all', desc: 'Ajedrez pasa y juega, apertura' },
  {
    name: 'ajedrez-seleccion',
    route: 'g/chess/local',
    seed: local('chess', ['e2e4', 'e7e5', 'g1f3', 'b8c6']),
    // Toque real (eventos de puntero) en f1: devuelve el punto en coordenadas CSS.
    taps: `const r = document.querySelector('[aria-label="Tablero de ajedrez"]').getBoundingClientRect(); return [[r.left + r.width * 5.5 / 8, r.top + r.height * 7.5 / 8]]`,
    desc: 'Ajedrez con un alfil seleccionado (destinos marcados)',
  },
  { name: 'ajedrez-resultado', route: 'g/chess/local', seed: local('chess', ['f2f3', 'e7e5', 'g2g4', 'd8h4']), desc: 'Hoja de resultado (mate) con confeti' },
  { name: 'ajedrez-cpu-niveles', route: 'g/chess/cpu', seed: profile, desc: 'Contra la computadora: niveles y color' },
  { name: 'ajedrez-retos', route: 'g/chess/retos', seed: profile, desc: 'Retos: categorías' },
  { name: 'damas-partida', route: 'g/checkers/local', seed: local('checkers', ['c3-d4', 'f6-e5']), sizes: 'all', desc: 'Damas con captura obligatoria (anillo y aviso)' },
  { name: 'damas-cpu-niveles', route: 'g/checkers/cpu', seed: profile, desc: 'Damas contra la computadora: niveles y color' },
  { name: 'backgammon-partida', route: 'g/backgammon/local', seed: local('backgammon', ['r:3,1', 'm:8/5,6/5', 'r:6,4']), sizes: 'all', desc: 'Backgammon: turno de negras con dados (en pasa y juega se ve desde blancas)' },
  { name: 'backgammon-inicio', route: 'g/backgammon/local', seed: local('backgammon', []), desc: 'Backgammon: posición inicial con botón de tirar' },
  { name: 'sudoku-lobby', route: 'g/sudoku', seed: profile, desc: 'Sudoku: reto del día y niveles' },
  { name: 'sudoku-partida', route: 'g/sudoku', seed: profile, steps: sudokuStart, sizes: 'all', desc: 'Sudoku: notas, un número puesto y casilla seleccionada' },
  { name: 'sudoku-pista', route: 'g/sudoku', seed: profile, steps: `${sudokuStart} click('.sd-tool:last-child'); await sleep(300)`, desc: 'Sudoku: pista (si hay un número equivocado lo señala; si no, explica el paso)' },
  { name: 'unirse', route: 'unirse', seed: profile, desc: 'Unirse con código' },
  { name: 'acerca', route: 'acerca', seed: profile, desc: 'Acerca de y créditos' },
]

/* ---------- Navegador ---------- */
function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
  const found = candidates.find((p) => p && existsSync(p))
  if (!found) throw new Error('No encontré Chrome ni Edge. Define CHROME_PATH.')
  return found
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch {
      /* aún no arranca */
    }
    await sleep(150)
  }
  throw new Error(`No respondió ${url}`)
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id) {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) p?.rej(new Error(msg.error.message))
      else p?.res(msg.result)
    } else for (const l of listeners) l(msg)
  }
  const ready = new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })
  return {
    ready,
    close: () => ws.close(),
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        const i = ++id
        pending.set(i, { res, rej })
        ws.send(JSON.stringify({ id: i, method, params }))
      }),
    once: (name, timeout = 20000) =>
      new Promise((res, rej) => {
        const f = (m) => {
          if (m.method !== name) return
          clearTimeout(t)
          listeners.delete(f)
          res(m.params)
        }
        const t = setTimeout(() => {
          listeners.delete(f)
          rej(new Error(`Tiempo agotado esperando ${name}`))
        }, timeout)
        listeners.add(f)
      }),
  }
}

/* ---------- Programa ---------- */
await import('./copy-engine.mjs')
mkdirSync(OUT, { recursive: true })

const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const base = `http://127.0.0.1:${PORT}/`

const userDir = mkdtempSync(join(tmpdir(), 'juegoteca-capturas-'))
const browser = spawn(
  findBrowser(),
  ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${userDir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'],
  { stdio: 'ignore' },
)

const index = ['# Capturas de la app', '', `Generadas con \`npm run app:screens\` · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, '', '| Archivo | Escena |', '| --- | --- |']
let count = 0
let failed = 0
try {
  await waitJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`)
  const page = (await waitJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).find((t) => t.type === 'page')
  const c = cdp(page.webSocketDebuggerUrl)
  await c.ready
  await c.send('Page.enable')
  const evaluate = async (expression) => {
    const r = await c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }
  const go = async (url) => {
    const loaded = c.once('Page.loadEventFired')
    await c.send('Page.navigate', { url })
    await loaded
  }

  for (const scene of SCENES) {
    if (filter && !scene.name.includes(filter)) continue
    const shots = [
      [PHONE, 'light'],
      [PHONE, 'dark'],
    ]
    if (scene.sizes === 'all') shots.push([PHONE_LAND, 'light'], [TABLET, 'light'])
    for (const [size, theme] of shots) {
      const file = `${scene.name}--${size.id}-${theme === 'light' ? 'claro' : 'oscuro'}.png`
      try {
        await c.send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: 2, mobile: size.width < 900 })
        await c.send('Emulation.setEmulatedMedia', {
          features: [
            { name: 'prefers-color-scheme', value: theme },
            { name: 'prefers-reduced-motion', value: 'reduce' },
          ],
        })
        // Primero el origen, luego sembrar, luego la ruta con recarga completa.
        await go(`${base}?siembra=${count}`)
        const seed = Object.entries(scene.seed)
          .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(JSON.stringify(v))});`)
          .join('')
        await evaluate(`localStorage.clear(); ${seed} true`)
        await go(`${base}?escena=${count}#/${scene.route}`)
        await evaluate('document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 900)))')
        if (scene.steps) {
          await evaluate(`(async () => {
            const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
            const click = (sel) => { const el = document.querySelector(sel); if (!el) throw new Error('No existe ' + sel); el.click() }
            ${scene.steps}
          })()`)
        }
        if (scene.taps) {
          const points = await evaluate(`(() => { ${scene.taps} })()`)
          for (const [x, y] of points) {
            await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
            await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
            await sleep(250)
          }
        }
        await sleep(400)
        const { data } = await c.send('Page.captureScreenshot', { format: 'png' })
        writeFileSync(join(OUT, file), Buffer.from(data, 'base64'))
        index.push(`| ${file} | ${scene.desc} |`)
        console.log(`✓ ${file}`)
        count++
      } catch (e) {
        failed++
        console.error(`✗ ${file}: ${e.message}`)
      }
    }
  }
  c.close()
} finally {
  browser.kill()
  await server.close()
  await sleep(300)
  try {
    rmSync(userDir, { recursive: true, force: true })
  } catch {
    /* Windows a veces retiene el perfil unos segundos; es temporal */
  }
}

writeFileSync(join(OUT, 'INDICE.md'), index.join('\n') + '\n')
console.log(`\n${count} capturas en ${OUT}/ (índice: INDICE.md)${failed ? ` · ${failed} fallaron` : ''}`)
process.exit(failed ? 1 : 0)
