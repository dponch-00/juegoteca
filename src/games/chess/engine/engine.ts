import { parseBestMove, parseInfo, type PvLine } from './uci'

/*
 * Stockfish 19 (versión lite, un hilo) corriendo en un Web Worker.
 * Licencia GPL-3: ver LICENSE y public/engine/COPYING.txt.
 *
 * - Una sola instancia para toda la app (se carga la primera vez que se usa).
 * - Las búsquedas se encadenan: nunca hay dos a la vez.
 * - `cancel()` corta la búsqueda en curso; su resultado llega igual, pero quien
 *   la pidió debe ignorarlo (ver los tokens en las pantallas).
 */

export interface SearchOptions {
  depth?: number
  movetime?: number
  multipv?: number
  /** Skill Level 0–20 (20 = fuerza completa). */
  skill?: number
  /** Cortar la búsqueda en cuanto la mejor variante ve un mate a favor (profundidad ≥ 8). */
  stopOnMate?: boolean
  /**
   * Jugadas desde la posición `fen` hasta la actual. Con ellas Stockfish conoce la historia
   * y detecta repeticiones (sin historia no ve que repetir lleva a tablas).
   */
  moves?: string[]
}

export interface SearchResult {
  best: string | null
  /** Variantes ordenadas por multipv (1 = la mejor), de la última profundidad. */
  lines: PvLine[]
}

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish.js`
const INIT_TIMEOUT_MS = 30_000

class StockfishEngine {
  status: EngineStatus = 'idle'
  private worker: Worker | null = null
  private listeners = new Set<(line: string) => void>()
  private statusListeners = new Set<() => void>()
  private ready: Promise<void> | null = null
  private chain: Promise<unknown> = Promise.resolve()
  private skill = -1
  private multipv = -1

  onStatus(fn: () => void): () => void {
    this.statusListeners.add(fn)
    return () => this.statusListeners.delete(fn)
  }

  private setStatus(s: EngineStatus) {
    this.status = s
    this.statusListeners.forEach((fn) => fn())
  }

  /** Carga el motor (idempotente). */
  start(): Promise<void> {
    if (this.ready) return this.ready
    this.setStatus('loading')
    this.ready = new Promise<void>((resolve, reject) => {
      const fail = (msg: string) => {
        this.setStatus('error')
        this.worker?.terminate()
        this.worker = null
        this.ready = null // permite reintentar
        reject(new Error(msg))
      }
      const timer = setTimeout(() => fail('El motor tardó demasiado en cargar.'), INIT_TIMEOUT_MS)
      try {
        this.worker = new Worker(ENGINE_URL)
      } catch {
        clearTimeout(timer)
        fail('Este navegador no puede cargar el motor.')
        return
      }
      this.worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : ''
        if (line) this.listeners.forEach((fn) => fn(line))
      }
      this.worker.onerror = () => {
        clearTimeout(timer)
        fail('No se pudo cargar el motor. ¿Hay conexión la primera vez?')
      }
      this.waitFor((l) => l === 'uciok')
        .then(() => {
          this.send('isready')
          return this.waitFor((l) => l === 'readyok')
        })
        .then(() => {
          clearTimeout(timer)
          this.setStatus('ready')
          resolve()
        })
      this.send('uci')
    })
    return this.ready
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  private waitFor(match: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const fn = (line: string) => {
        if (match(line)) {
          this.listeners.delete(fn)
          resolve(line)
        }
      }
      this.listeners.add(fn)
    })
  }

  /** Encola una búsqueda sobre la posición FEN dada. */
  search(fen: string, opts: SearchOptions): Promise<SearchResult> {
    const run = async (): Promise<SearchResult> => {
      await this.start()
      const skill = opts.skill ?? 20
      const multipv = opts.multipv ?? 1
      if (skill !== this.skill) {
        this.send(`setoption name Skill Level value ${skill}`)
        this.skill = skill
      }
      if (multipv !== this.multipv) {
        this.send(`setoption name MultiPV value ${multipv}`)
        this.multipv = multipv
      }
      this.send('isready')
      await this.waitFor((l) => l === 'readyok')

      const lines = new Map<number, PvLine>()
      let stopped = false
      const collect = (line: string) => {
        const info = parseInfo(line)
        if (!info) return
        lines.set(info.multipv, info)
        if (opts.stopOnMate && !stopped && info.multipv === 1 && (info.score.mate ?? 0) > 0 && info.depth >= 8) {
          stopped = true
          this.send('stop')
        }
      }
      this.listeners.add(collect)
      this.send(opts.moves?.length ? `position fen ${fen} moves ${opts.moves.join(' ')}` : `position fen ${fen}`)
      const limits = [opts.depth ? `depth ${opts.depth}` : '', opts.movetime ? `movetime ${opts.movetime}` : '']
        .filter(Boolean)
        .join(' ')
      this.send(`go ${limits || 'depth 10'}`)
      const bestLine = await this.waitFor((l) => l.startsWith('bestmove'))
      this.listeners.delete(collect)
      return {
        best: parseBestMove(bestLine),
        lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv),
      }
    }
    const p = this.chain.then(run, run)
    this.chain = p.catch(() => {})
    return p
  }

  /** Corta la búsqueda en curso (si la hay). */
  cancel() {
    this.send('stop')
  }

  newGame() {
    if (this.worker) this.send('ucinewgame')
  }
}

export const engine = new StockfishEngine()
