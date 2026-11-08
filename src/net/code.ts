/** Alfabeto sin caracteres confundibles (sin I, O, 0, 1). 32^4 ≈ 1 millón de códigos. */
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 4

/** Prefijo de los ids en el servidor público de PeerJS; la versión evita choques con protocolos viejos. */
const PEER_PREFIX = 'juegoteca-v1-'

export function newCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

/** Limpia lo que escribe la persona; devuelve null si no es un código válido. */
export function normalizeCode(input: string): string | null {
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (c.length !== CODE_LENGTH) return null
  for (const ch of c) if (!ALPHABET.includes(ch)) return null
  return c
}

export function peerId(code: string): string {
  return PEER_PREFIX + code
}
