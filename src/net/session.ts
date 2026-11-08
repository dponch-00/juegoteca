import type { DataConnection, Peer } from 'peerjs'
import type { GameDef, Seat } from '../core/types'
import { getGame } from '../games/registry'
import { newCode, peerId } from './code'

/*
 * Sala en línea entre dos dispositivos.
 *
 * - El anfitrión registra el id `juegoteca-v1-<CÓDIGO>` en el servidor público
 *   de PeerJS (solo sirve para presentarse); luego la conexión es directa (WebRTC).
 * - El anfitrión es la autoridad: reparte asientos, empieza partidas y, si hay
 *   desacuerdo, su estado manda (mensaje `sync`).
 * - Solo viajan jugadas. Ambos lados las validan con game.apply().
 */

const PROTO = 1
const RETRY_MS = 2500
const GIVE_UP_MS = 3 * 60_000

type Msg =
  | { t: 'hello'; proto: number; name: string; clientId: string }
  | { t: 'start' | 'sync'; gameId: string; state: unknown; seat: Seat; names: [string, string]; matchNo: number; resigned: Seat | null }
  | { t: 'move'; matchNo: number; n: number; move: unknown }
  | { t: 'resign'; matchNo: number; seat: Seat }
  | { t: 'rematch'; matchNo: number }
  | { t: 'needsync' }
  | { t: 'full' }
  | { t: 'bye' }

export type Status = 'connecting' | 'waiting' | 'playing' | 'reconnecting' | 'closed' | 'error'

export class OnlineSession {
  role: 'host' | 'guest'
  code: string
  status: Status = 'connecting'
  error = ''
  game: GameDef | null = null
  state: unknown = null
  seat: Seat = 0
  names: [string, string] = ['', '']
  matchNo = 0
  resigned: Seat | null = null
  rematch = { me: false, them: false }
  /** Hay partida empezada (aunque la conexión esté caída). */
  get started(): boolean {
    return this.state != null
  }

  private peer: Peer | null = null
  private conn: DataConnection | null = null
  private myName: string
  private clientId = crypto.randomUUID()
  private guestClientId: string | null = null
  private listeners = new Set<() => void>()
  private retryTimer: number | undefined
  private lostAt = 0
  private disposed = false

  private constructor(role: 'host' | 'guest', code: string, myName: string, game: GameDef | null) {
    this.role = role
    this.code = code
    this.myName = myName
    this.game = game
    document.addEventListener('visibilitychange', this.onVisible)
  }

  /* ---------- API pública ---------- */

  static host(game: GameDef, myName: string): OnlineSession {
    const s = new OnlineSession('host', newCode(), myName, game)
    void s.openHost(0)
    return s
  }

  static join(code: string, myName: string): OnlineSession {
    const s = new OnlineSession('guest', code, myName, null)
    void s.openGuest()
    return s
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /** Jugada local: se aplica aquí y se envía. */
  move(move: unknown): boolean {
    const g = this.game
    if (!g || this.state == null || this.resigned != null || g.outcome(this.state)) return false
    if (g.turn(this.state) !== this.seat) return false
    const n = g.ply(this.state)
    const next = g.apply(this.state, move)
    if (next == null) return false
    this.state = next
    this.send({ t: 'move', matchNo: this.matchNo, n, move })
    this.emit()
    return true
  }

  resign(): void {
    if (this.state == null || this.resigned != null) return
    this.resigned = this.seat
    this.send({ t: 'resign', matchNo: this.matchNo, seat: this.seat })
    this.emit()
  }

  requestRematch(): void {
    this.rematch.me = true
    this.send({ t: 'rematch', matchNo: this.matchNo })
    this.maybeStartRematch()
    this.emit()
  }

  leave(): void {
    this.send({ t: 'bye' })
    this.dispose()
  }

  /* ---------- Anfitrión ---------- */

  private async openHost(attempt: number): Promise<void> {
    const { Peer } = await import('peerjs')
    if (this.disposed) return
    const peer = new Peer(peerId(this.code), { debug: 0 })
    this.peer = peer
    peer.on('open', () => {
      if (this.status === 'connecting') this.setStatus('waiting')
    })
    peer.on('connection', (conn) => this.acceptGuest(conn))
    peer.on('disconnected', () => this.reconnectSignal())
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && attempt < 5 && !this.started) {
        peer.destroy()
        this.code = newCode()
        this.emit()
        void this.openHost(attempt + 1)
        return
      }
      this.handlePeerError(err.type)
    })
  }

  private acceptGuest(conn: DataConnection): void {
    conn.on('data', (raw) => {
      const msg = raw as Msg
      if (msg?.t !== 'hello') {
        if (conn === this.conn) this.onMessage(msg)
        return
      }
      if (msg.proto !== PROTO) {
        conn.send({ t: 'full' } satisfies Msg)
        return
      }
      const known = this.guestClientId
      if (known && known !== msg.clientId && this.conn?.open) {
        conn.send({ t: 'full' } satisfies Msg)
        setTimeout(() => conn.close(), 500)
        return
      }
      // Nuevo rival o el mismo que vuelve: esta pasa a ser la conexión activa.
      if (this.conn && this.conn !== conn) this.conn.close()
      this.conn = conn
      this.guestClientId = msg.clientId
      this.stopRetry()
      if (!this.started || known !== msg.clientId) {
        const hostSeat: Seat = Math.random() < 0.5 ? 0 : 1
        this.names = hostSeat === 0 ? [this.myName, msg.name] : [msg.name, this.myName]
        this.startMatch(hostSeat)
      } else {
        this.names[this.seat === 0 ? 1 : 0] = msg.name
        this.setStatus('playing')
        this.sendState('sync')
      }
    })
    conn.on('close', () => {
      if (conn === this.conn) this.connectionLost()
    })
    conn.on('error', () => {
      if (conn === this.conn) this.connectionLost()
    })
  }

  private startMatch(hostSeat: Seat): void {
    this.matchNo++
    this.seat = hostSeat
    this.state = this.game!.create()
    this.resigned = null
    this.rematch = { me: false, them: false }
    this.setStatus('playing')
    this.sendState('start')
  }

  private sendState(t: 'start' | 'sync'): void {
    this.send({
      t,
      gameId: this.game!.id,
      state: this.state,
      seat: this.seat === 0 ? 1 : 0, // asiento del que recibe
      names: this.names,
      matchNo: this.matchNo,
      resigned: this.resigned,
    })
  }

  private maybeStartRematch(): void {
    if (this.role === 'host' && this.rematch.me && this.rematch.them) {
      // Revancha: se intercambian los colores.
      const newSeat: Seat = this.seat === 0 ? 1 : 0
      this.names = [this.names[1], this.names[0]]
      this.startMatch(newSeat)
    }
  }

  /* ---------- Invitado ---------- */

  private async openGuest(): Promise<void> {
    const { Peer } = await import('peerjs')
    if (this.disposed) return
    const peer = new Peer({ debug: 0 })
    this.peer = peer
    peer.on('open', () => this.dialHost())
    peer.on('disconnected', () => this.reconnectSignal())
    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') {
        if (this.started) return // el anfitrión se fue un momento: seguimos reintentando
        this.fail(`No encontramos la sala ${this.code}. Revisa el código o pide uno nuevo.`)
        return
      }
      this.handlePeerError(err.type)
    })
  }

  private dialHost(): void {
    if (!this.peer || this.peer.destroyed || this.disposed) return
    const conn = this.peer.connect(peerId(this.code), { reliable: true })
    conn.on('open', () => {
      this.conn = conn
      this.stopRetry()
      conn.send({ t: 'hello', proto: PROTO, name: this.myName, clientId: this.clientId } satisfies Msg)
    })
    conn.on('data', (raw) => {
      if (conn === this.conn) this.onMessage(raw as Msg)
    })
    conn.on('close', () => {
      if (conn === this.conn) this.connectionLost()
    })
    conn.on('error', () => {
      if (conn === this.conn) this.connectionLost()
    })
  }

  /* ---------- Mensajes ---------- */

  private onMessage(msg: Msg): void {
    switch (msg.t) {
      case 'start':
      case 'sync': {
        const g = getGame(msg.gameId)
        if (!g) return this.fail('Tu rival usa un juego que esta versión no tiene. Actualicen la app.')
        this.game = g
        this.state = msg.state
        this.seat = msg.seat
        this.names = msg.names
        this.matchNo = msg.matchNo
        this.resigned = msg.resigned
        if (msg.t === 'start') this.rematch = { me: false, them: false }
        this.setStatus('playing')
        return
      }
      case 'move': {
        const g = this.game
        if (!g || this.state == null || msg.matchNo !== this.matchNo) return
        if (msg.n !== g.ply(this.state)) return this.desync()
        const next = g.apply(this.state, msg.move)
        if (next == null) return this.desync()
        this.state = next
        this.emit()
        return
      }
      case 'resign':
        if (msg.matchNo === this.matchNo) {
          this.resigned = msg.seat
          this.emit()
        }
        return
      case 'rematch':
        if (msg.matchNo === this.matchNo) {
          this.rematch.them = true
          this.maybeStartRematch()
          this.emit()
        }
        return
      case 'needsync':
        if (this.role === 'host') this.sendState('sync')
        return
      case 'full':
        return this.fail('Esa sala ya tiene dos jugadores.')
      case 'bye':
        this.conn = null
        this.stopRetry()
        this.error = 'Tu rival salió de la sala.'
        this.setStatus('closed')
        return
    }
  }

  private desync(): void {
    if (this.role === 'host') this.sendState('sync')
    else this.send({ t: 'needsync' })
  }

  /* ---------- Conexión ---------- */

  private send(msg: Msg): void {
    if (this.conn?.open) this.conn.send(msg)
  }

  private connectionLost(): void {
    if (this.disposed || this.status === 'closed' || this.status === 'error') return
    this.conn = null
    if (!this.started) {
      if (this.role === 'host') this.setStatus('waiting')
      return
    }
    this.setStatus('reconnecting')
    this.lostAt = Date.now()
    if (this.role === 'guest') this.scheduleRetry()
  }

  private scheduleRetry(): void {
    this.stopRetry()
    this.retryTimer = window.setTimeout(() => {
      if (this.disposed || this.conn?.open) return
      if (Date.now() - this.lostAt > GIVE_UP_MS) {
        this.error = 'Se perdió la conexión con tu rival.'
        this.setStatus('closed')
        return
      }
      if (this.peer?.disconnected) this.peer.reconnect()
      else this.dialHost()
      this.scheduleRetry()
    }, RETRY_MS)
  }

  private stopRetry(): void {
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }

  /** Se perdió el contacto con el servidor de presentación (p. ej. pantalla bloqueada). */
  private reconnectSignal(): void {
    if (this.disposed || !this.peer || this.peer.destroyed) return
    setTimeout(() => {
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) this.peer.reconnect()
    }, 1000)
  }

  private onVisible = (): void => {
    if (document.visibilityState !== 'visible' || this.disposed) return
    if (this.peer?.disconnected && !this.peer.destroyed) this.peer.reconnect()
    if (this.role === 'guest' && this.started && !this.conn?.open && this.status !== 'closed') {
      this.lostAt = Date.now()
      this.dialHost()
      this.scheduleRetry()
    }
  }

  private handlePeerError(type: string): void {
    if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') {
      if (this.started) {
        this.setStatus('reconnecting')
        return
      }
      return this.fail('No hay conexión con el servidor de salas. Revisa tu internet e inténtalo de nuevo.')
    }
    if (type === 'browser-incompatible' || type === 'webrtc') {
      return this.fail('Este navegador no permite conexiones directas (WebRTC).')
    }
    if (!this.started) this.fail('No se pudo abrir la sala. Inténtalo de nuevo.')
  }

  private fail(message: string): void {
    this.error = message
    this.setStatus('error')
    this.stopRetry()
  }

  private setStatus(s: Status): void {
    this.status = s
    this.emit()
  }

  private emit(): void {
    for (const fn of this.listeners) fn()
  }

  dispose(): void {
    this.disposed = true
    this.stopRetry()
    document.removeEventListener('visibilitychange', this.onVisible)
    this.conn?.close()
    this.peer?.destroy()
    this.conn = null
    this.peer = null
    this.listeners.clear()
  }
}

/* La sala activa vive fuera de las pantallas para sobrevivir a la navegación. */
let current: OnlineSession | null = null

export function getSession(): OnlineSession | null {
  return current
}

export function setSession(s: OnlineSession | null): void {
  if (current && current !== s) current.leave()
  current = s
  if (import.meta.env.DEV) (window as unknown as { __session: unknown }).__session = s
}
