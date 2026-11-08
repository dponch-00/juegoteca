import { describe, expect, it } from 'vitest'
import { ALPHABET, CODE_LENGTH, newCode, normalizeCode } from './code'

describe('códigos de sala', () => {
  it('genera códigos válidos', () => {
    for (let i = 0; i < 200; i++) {
      const c = newCode()
      expect(c).toHaveLength(CODE_LENGTH)
      expect(normalizeCode(c)).toBe(c)
      for (const ch of c) expect(ALPHABET).toContain(ch)
    }
  })

  it('acepta minúsculas, espacios y guiones', () => {
    expect(normalizeCode(' k7q-2 ')).toBe('K7Q2')
  })

  it('rechaza longitud incorrecta y caracteres confundibles', () => {
    expect(normalizeCode('K7Q')).toBeNull()
    expect(normalizeCode('K7Q22')).toBeNull()
    expect(normalizeCode('KOQ2')).toBeNull()
    expect(normalizeCode('K1Q2')).toBeNull()
  })
})
