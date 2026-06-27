import type { ReactNode } from 'react'

type AppShellProps = {
  className?: string
  style?: React.CSSProperties
  header: ReactNode
  children: ReactNode
}

/** Permanent application shell — header stays mounted; only children (page content) swap. */
export function AppShell({ className = '', style, header, children }: AppShellProps) {
  return (
    <div className={`app-shell r360-app-shell ${className}`.trim()} style={style}>
      {header}
      {children}
    </div>
  )
}
