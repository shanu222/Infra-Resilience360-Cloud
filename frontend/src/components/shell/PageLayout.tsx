import type { ReactNode } from 'react'

/** Content column below the permanent application header. */
export function PageLayout({ children }: { children: ReactNode }) {
  return <main className="r360-page-layout">{children}</main>
}
