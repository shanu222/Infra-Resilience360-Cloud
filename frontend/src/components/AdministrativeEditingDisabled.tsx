import { ADMINISTRATIVE_EDITING_DISABLED_MESSAGE } from '../constants/readOnlyPlatform'

export function AdministrativeEditingDisabled() {
  return (
    <div
      className="administrative-editing-disabled"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
      }}
      role="status"
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Infra Resilience360</h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.55, margin: 0 }}>{ADMINISTRATIVE_EDITING_DISABLED_MESSAGE}</p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', opacity: 0.85 }}>
          <a href="/" style={{ color: '#7dd3fc', textDecoration: 'underline' }}>
            Return to the public application
          </a>
        </p>
      </div>
    </div>
  )
}
