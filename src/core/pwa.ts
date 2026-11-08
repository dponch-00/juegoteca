import { useEffect, useState } from 'preact/hooks'
import { registerSW } from 'virtual:pwa-register'

/* Estado global pequeño: instalación y actualización de la PWA. */

interface PwaState {
  canInstall: boolean
  needRefresh: boolean
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let state: PwaState = { canInstall: false, needRefresh: false }
let installEvent: InstallEvent | null = null
let updateSW: ((reload?: boolean) => Promise<void>) | null = null
const listeners = new Set<() => void>()

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  listeners.forEach((fn) => fn())
}

export function initPwa(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as InstallEvent
    set({ canInstall: true })
  })
  window.addEventListener('appinstalled', () => set({ canInstall: false }))
  updateSW = registerSW({
    onNeedRefresh: () => set({ needRefresh: true }),
  })
}

export async function install(): Promise<void> {
  if (!installEvent) return
  await installEvent.prompt()
  installEvent = null
  set({ canInstall: false })
}

export function applyUpdate(): void {
  void updateSW?.(true)
}

export function usePwa(): PwaState {
  const [s, setS] = useState(state)
  useEffect(() => {
    const fn = () => setS(state)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return s
}
