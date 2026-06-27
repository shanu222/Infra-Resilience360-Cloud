import { useEffect, useRef, type ReactNode } from 'react'
import type { SectionKey } from '../../types/sectionKeys'

type PersistentSectionHostProps = {
  activeSection: SectionKey | null
  visitedSections: ReadonlySet<SectionKey>
  renderSection: (section: SectionKey) => ReactNode
}

/** Keeps visited module panes mounted so navigation does not reload iframes, globes, or media players. */
export function PersistentSectionHost({ activeSection, visitedSections, renderSection }: PersistentSectionHostProps) {
  const paneRefs = useRef<Map<SectionKey, HTMLDivElement>>(new Map())

  useEffect(() => {
    for (const section of visitedSections) {
      const pane = paneRefs.current.get(section)
      if (!pane) continue
      const isActive = section === activeSection
      pane.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
        if (isActive) return
        try {
          video.pause()
        } catch {
          /* ignore */
        }
      })
      pane.querySelectorAll<HTMLAudioElement>('audio').forEach((audio) => {
        if (isActive) return
        try {
          audio.pause()
        } catch {
          /* ignore */
        }
      })
    }
  }, [activeSection, visitedSections])

  if (visitedSections.size === 0) return null

  return (
    <div className="r360-section-host">
      {[...visitedSections].map((section) => {
        const isActive = section === activeSection
        return (
          <div
            key={section}
            ref={(node) => {
              if (node) paneRefs.current.set(section, node)
              else paneRefs.current.delete(section)
            }}
            className={`r360-section-pane${isActive ? ' is-active' : ''}`}
            data-section={section}
            hidden={!isActive}
            aria-hidden={!isActive}
          >
            {renderSection(section)}
          </div>
        )
      })}
    </div>
  )
}
