import { useEffect, useState } from 'preact/hooks'

/** Rutas con hash (#/g/chess): funcionan en GitHub Pages sin configurar el servidor. */
export function currentPath(): string {
  return location.hash.replace(/^#\/?/, '')
}

/** Cuántas pantallas hemos apilado dentro de la app (para que "atrás" no saque de ella). */
let depth = 0

export function navigate(path: string, replace = false): void {
  const url = `#/${path}`
  if (replace) history.replaceState(null, '', url)
  else {
    history.pushState(null, '', url)
    depth++
  }
  window.dispatchEvent(new Event('juegoteca:route'))
}

export function back(fallback = ''): void {
  if (depth > 0) history.back()
  else navigate(fallback, true)
}

window.addEventListener('popstate', () => {
  depth = Math.max(0, depth - 1)
})

/** Ruta actual; los cambios se animan con View Transitions cuando el navegador lo permite. */
export function useRoute(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const update = () => {
      const next = currentPath()
      const doc = document as Document & {
        startViewTransition?: (cb: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> }
      }
      if (doc.startViewTransition && document.visibilityState === 'visible' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const vt = doc.startViewTransition(() => {
          setPath(next)
          return new Promise((r) => setTimeout(r, 0))
        })
        // Si el navegador omite la animación (pestaña oculta, navegación rápida) no es un error.
        vt.ready.catch(() => {})
        vt.finished.catch(() => {})
      } else {
        setPath(next)
      }
    }
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)
    window.addEventListener('juegoteca:route', update)
    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
      window.removeEventListener('juegoteca:route', update)
    }
  }, [])
  return path
}
