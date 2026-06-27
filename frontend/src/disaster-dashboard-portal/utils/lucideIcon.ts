import * as LucideIcons from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Resolve kebab-case lucide icon names (e.g. cloud-lightning → CloudLightning). */
export function resolveLucideIcon(icon: string): LucideIcon {
  const key = icon
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  const resolved = (LucideIcons as unknown as Record<string, LucideIcon | undefined>)[key]
  return resolved ?? AlertTriangle
}
