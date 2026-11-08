/** Notación algebraica en español: R rey, D dama, T torre, A alfil, C caballo. */
const ES: Record<string, string> = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' }

export function toSpanishSan(san: string): string {
  // En SAN las mayúsculas K Q R B N solo nombran piezas (las columnas van en minúscula
  // y el enroque usa la letra O, que no se traduce).
  return san.replace(/[KQRBN]/g, (c) => ES[c])
}

/** "12." para blancas, "12…" para negras, a partir del índice de media jugada. */
export function moveNumberLabel(ply: number): string {
  const n = Math.floor(ply / 2) + 1
  return ply % 2 === 0 ? `${n}.` : `${n}…`
}
