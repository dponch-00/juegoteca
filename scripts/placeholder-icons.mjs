// Genera iconos PROVISIONALES de la PWA (una ficha sobre fondo morado).
// Codex los reemplaza con los definitivos en T-002. Uso: node scripts/placeholder-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x1b, 0x15, 0x30]
const ACCENT = [0xff, 0xb5, 0x47]
const RING = [0xd9, 0x8a, 0x1f]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

/** size: px; inset: fracción de margen para la ficha (maskable necesita más margen). */
function icon(size, inset, rounded) {
  const SS = 4 // supermuestreo para bordes suaves
  const raw = Buffer.alloc(size * (size * 4 + 1))
  const r = size / 2
  const coin = r * (1 - inset)
  const corner = rounded ? size * 0.22 : 0
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let acc = [0, 0, 0, 0]
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS
          // fondo con esquinas redondeadas
          const qx = Math.max(corner - px, px - (size - corner), 0)
          const qy = Math.max(corner - py, py - (size - corner), 0)
          if (corner && Math.hypot(qx, qy) > corner) continue
          const d = Math.hypot(px - r, py - r)
          let col = BG
          if (d < coin) col = d > coin * 0.78 && d < coin * 0.86 ? RING : ACCENT
          if (d < coin * 0.42 && d > coin * 0.34) col = RING
          acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; acc[3] += 255
        }
      }
      const n = SS * SS
      const o = y * (size * 4 + 1) + 1 + x * 4
      const a = acc[3] / n
      raw[o] = a ? acc[0] / (acc[3] / 255) : 0
      raw[o + 1] = a ? acc[1] / (acc[3] / 255) : 0
      raw[o + 2] = a ? acc[2] / (acc[3] / 255) : 0
      raw[o + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192, 0.3, true))
writeFileSync('public/icons/icon-512.png', icon(512, 0.3, true))
writeFileSync('public/icons/icon-maskable-512.png', icon(512, 0.45, false))
writeFileSync('public/icons/apple-touch-icon.png', icon(180, 0.3, false))
writeFileSync(
  'public/icons/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1b1530"/><circle cx="32" cy="32" r="22" fill="#ffb547"/><circle cx="32" cy="32" r="18" fill="none" stroke="#d98a1f" stroke-width="2.5"/><circle cx="32" cy="32" r="8.5" fill="none" stroke="#d98a1f" stroke-width="2.5"/></svg>\n`,
)
console.log('Iconos provisionales escritos en public/icons/')
