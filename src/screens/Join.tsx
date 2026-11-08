import { useState } from 'preact/hooks'
import { back, navigate } from '../core/router'
import { displayName } from '../core/storage'
import { CODE_LENGTH, normalizeCode } from '../net/code'
import { OnlineSession, setSession } from '../net/session'

export function Join({ initial = '' }: { initial?: string }) {
  const [code, setCode] = useState(initial.toUpperCase().slice(0, CODE_LENGTH))
  const [error, setError] = useState('')

  function submit(e: Event) {
    e.preventDefault()
    const c = normalizeCode(code)
    if (!c) {
      setError(`El código tiene ${CODE_LENGTH} caracteres (letras y números, sin O, I, 0 ni 1).`)
      return
    }
    setSession(OnlineSession.join(c, displayName()))
    navigate('sala', true)
  }

  return (
    <div class="screen">
      <header class="topbar">
        <button class="icon-btn" onClick={() => back()} aria-label="Volver">←</button>
        <h1>Unirme a una sala</h1>
      </header>

      <form class="card stack enter" onSubmit={submit}>
        <label for="code" class="dim">Escribe el código que te pasó tu rival</label>
        <input
          id="code"
          class="input code-input"
          value={code}
          maxLength={CODE_LENGTH + 1}
          autoComplete="off"
          autoCapitalize="characters"
          spellcheck={false}
          inputMode="text"
          placeholder="K7Q2"
          autoFocus
          onInput={(e) => {
            setError('')
            setCode((e.target as HTMLInputElement).value.toUpperCase())
          }}
        />
        {error && <p class="form-error">{error}</p>}
        <button class="btn btn-primary" type="submit" disabled={code.trim().length < CODE_LENGTH}>
          Entrar
        </button>
      </form>
      <p class="dim center">Necesitas internet para encontrar a tu rival; después la partida va directo entre los dos dispositivos.</p>
    </div>
  )
}
