/**
 * Almacenamiento local: todo vive en el dispositivo (localStorage).
 * Los datos son pequeños (perfil, partidas guardadas, estadísticas).
 */
const PREFIX = 'juegoteca:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue funcionando sin guardar */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* nada */
  }
}

/** Pide al navegador que no borre nuestros datos cuando falte espacio. */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {})
}

/* ---------- Perfil ---------- */

export interface Profile {
  name: string
}

export function getProfile(): Profile {
  return load<Profile>('profile', { name: '' })
}

export function setProfile(p: Profile): void {
  save('profile', p)
}

export function displayName(): string {
  return getProfile().name.trim() || 'Jugador'
}

/* ---------- Estadísticas ---------- */

export interface Stats {
  played: number
  won: number
  lost: number
  drawn: number
}

export function getStats(gameId: string): Stats {
  return load<Stats>(`stats:${gameId}`, { played: 0, won: 0, lost: 0, drawn: 0 })
}

export function recordResult(gameId: string, result: 'won' | 'lost' | 'drawn' | 'local'): void {
  const s = getStats(gameId)
  s.played++
  if (result !== 'local') s[result]++
  save(`stats:${gameId}`, s)
}
