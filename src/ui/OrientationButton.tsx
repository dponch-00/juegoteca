import { useEffect, useState } from 'preact/hooks'
import { load, save } from '../core/storage'

/*
 * Botón de orientación, siempre visible en celulares y tablets.
 * Cambia entre Automático → Horizontal → Vertical y lo recuerda.
 *
 * Por qué hace falta: Android guarda la orientación del manifiesto al INSTALAR la app.
 * Quien la instaló cuando estaba fija en vertical se queda así aunque el manifiesto ya
 * diga "any". `screen.orientation.lock` lo corrige sin reinstalar. En una pestaña del
 * navegador (no instalada) el bloqueo exige pantalla completa, así que la pedimos.
 */

type Mode = 'auto' | 'landscape' | 'portrait'
const KEY = 'orientation'
const NEXT: Record<Mode, Mode> = { auto: 'landscape', landscape: 'portrait', portrait: 'auto' }
const LABEL: Record<Mode, string> = { auto: 'Automático', landscape: 'Horizontal', portrait: 'Vertical' }

type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void }
const orientation = (): LockableOrientation | undefined => (screen as Screen & { orientation?: LockableOrientation }).orientation

export function canLockOrientation(): boolean {
  return typeof orientation()?.lock === 'function' && matchMedia('(pointer: coarse)').matches
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
}

async function apply(mode: Mode, interactive: boolean): Promise<boolean> {
  const o = orientation()
  if (!o?.lock) return false
  if (mode === 'auto') {
    try {
      o.unlock?.()
    } catch {
      /* nada que soltar */
    }
    return true
  }
  try {
    await o.lock(mode)
    return true
  } catch {
    // En el navegador (sin instalar) solo se puede con pantalla completa.
    if (!interactive || document.fullscreenElement) return false
    try {
      // Algunos navegadores nunca resuelven la petición: no esperar más de 1.5 s.
      await withTimeout(document.documentElement.requestFullscreen({ navigationUI: 'hide' }), 1500)
      await withTimeout(o.lock(mode), 1500)
      return true
    } catch {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      return false
    }
  }
}

/** Al abrir la app, vuelve a aplicar la orientación elegida (si el sistema lo permite sin tocar). */
export function restoreOrientation(): void {
  const mode = load<Mode>(KEY, 'auto')
  if (mode !== 'auto' && canLockOrientation()) void apply(mode, false)
}

export function OrientationButton() {
  const [mode, setMode] = useState<Mode>(() => load<Mode>(KEY, 'auto'))
  const [note, setNote] = useState('')
  const supported = canLockOrientation()

  useEffect(() => {
    document.documentElement.classList.toggle('has-orient', supported)
  }, [supported])

  useEffect(() => {
    if (!note) return
    const t = setTimeout(() => setNote(''), 2600)
    return () => clearTimeout(t)
  }, [note])

  if (!supported) return null

  async function cycle() {
    const next = NEXT[mode]
    const ok = await apply(next, true)
    if (ok) {
      setMode(next)
      save(KEY, next)
      setNote(LABEL[next])
    } else {
      setNote('Instala la app para fijar la orientación')
    }
  }

  return (
    <>
      <button class={`orient-btn orient-${mode}`} onClick={cycle} aria-label={`Orientación: ${LABEL[mode]}. Toca para cambiar`} title={`Orientación: ${LABEL[mode]}`}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          {/* Tableta y flecha de giro */}
          <rect class="orient-device" x="8" y="3" width="8" height="13" rx="1.6" />
          <path d="M4 14a8 8 0 0 0 8 7" />
          <path d="M4 18v-4h4" />
        </svg>
        {mode !== 'auto' && <span class="orient-badge">{mode === 'landscape' ? 'H' : 'V'}</span>}
      </button>
      {note && (
        <div class="orient-note" role="status">
          {note}
        </div>
      )}
    </>
  )
}
