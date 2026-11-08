/** Lectura del protocolo UCI (texto que imprime Stockfish). Funciones puras. */

export interface Score {
  /** Centipeones desde el lado que mueve. */
  cp?: number
  /** Mate en N (positivo: gana el que mueve; negativo: lo reciben). */
  mate?: number
}

export interface PvLine {
  multipv: number
  depth: number
  score: Score
  pv: string[]
}

/** Interpreta una línea `info ... score ... pv ...`; null si no trae variante. */
export function parseInfo(line: string): PvLine | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null
  const t = line.split(/\s+/)
  let depth = 0
  let multipv = 1
  const score: Score = {}
  let pv: string[] = []
  for (let i = 1; i < t.length; i++) {
    switch (t[i]) {
      case 'depth':
        depth = Number(t[++i])
        break
      case 'multipv':
        multipv = Number(t[++i])
        break
      case 'score':
        if (t[i + 1] === 'cp') score.cp = Number(t[i + 2])
        else if (t[i + 1] === 'mate') score.mate = Number(t[i + 2])
        i += 2
        break
      case 'pv':
        pv = t.slice(i + 1)
        i = t.length
        break
    }
  }
  if (pv.length === 0 || (score.cp === undefined && score.mate === undefined)) return null
  return { multipv, depth, score, pv }
}

export function parseBestMove(line: string): string | null {
  const m = /^bestmove (\S+)/.exec(line)
  if (!m || m[1] === '(none)') return null
  return m[1]
}

/** Convierte una puntuación a un número comparable (mates como ±10000). */
export function scoreValue(s: Score): number {
  if (s.mate !== undefined) {
    if (s.mate === 0) return -10000 // ya recibió mate
    return s.mate > 0 ? 10000 - s.mate * 10 : -10000 - s.mate * 10
  }
  return s.cp ?? 0
}
