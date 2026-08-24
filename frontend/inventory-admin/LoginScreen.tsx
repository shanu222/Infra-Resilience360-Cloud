import { useState } from 'react'

type LoginScreenProps = {
  onSubmit: (password: string) => Promise<void>
}

export function LoginScreen({ onSubmit }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!password.trim() || busy) return

    setBusy(true)
    setError('')
    try {
      await onSubmit(password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="login-brand-mark">IR360</span>
          <div>
            <h1>Infra Resilience360&deg;</h1>
            <p>Live Inventory Admin</p>
          </div>
        </div>

        <label className="field">
          <span className="field-label">Administrator password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            autoFocus
            placeholder="Enter password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <p className="alert alert-error">{error}</p> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !password.trim()}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="login-footnote">
          Authorised personnel only. This portal manages Material Hub stock levels shown on the public
          Infra Resilience360&deg; website.
        </p>
      </form>
    </div>
  )
}
