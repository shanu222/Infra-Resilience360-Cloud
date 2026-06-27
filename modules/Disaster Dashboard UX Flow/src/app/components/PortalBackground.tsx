import { ReactNode, useEffect, useMemo, useState } from 'react'
import { getDisasterFolderCache, loadDisasterDashboardMediaFromApi, toWebSafeUrl } from '../../utils/guidanceVideoUrls'

type PortalBackgroundProps = {
  children: ReactNode
  /** CMS per-page background (takes precedence over portal folder image). */
  backgroundImage?: string
  backgroundVideo?: string
}

export default function PortalBackground({
  children,
  backgroundImage,
  backgroundVideo,
}: PortalBackgroundProps) {
  const [portalBgUrl, setPortalBgUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await loadDisasterDashboardMediaFromApi()
        if (cancelled) return
        const row = getDisasterFolderCache()?.['portal']
        const img = row?.image
        const raw = typeof img === 'string' ? img.trim() : ''
        setPortalBgUrl(raw ? toWebSafeUrl(raw) : undefined)
      } catch {
        if (!cancelled) setPortalBgUrl(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const resolvedImage = useMemo(() => {
    const raw = String(backgroundImage ?? '').trim()
    if (raw) return toWebSafeUrl(raw) ?? undefined
    return portalBgUrl
  }, [backgroundImage, portalBgUrl])

  const resolvedVideo = useMemo(() => {
    const raw = String(backgroundVideo ?? '').trim()
    if (!raw) return undefined
    return toWebSafeUrl(raw) ?? undefined
  }, [backgroundVideo])

  const gradientFallback = {
    background: 'linear-gradient(165deg, rgb(15 23 42) 0%, rgb(30 41 59) 55%, rgb(15 23 42) 100%)',
  } as const

  const isEmbeddedShell =
    typeof window !== 'undefined' && window.self !== window.top

  /**
   * Parent app usually provides the hero background when embedded.
   * Keep legacy transparent behavior unless this page has an explicit background media,
   * in which case render that media inside the iframe to avoid blank backgrounds.
   */
  if (isEmbeddedShell && !resolvedVideo && !resolvedImage) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden bg-transparent">{children}</div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {resolvedVideo ? (
        <video
          className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
          src={resolvedVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : null}
      <div
        className="relative z-[1] min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={
          resolvedImage && !resolvedVideo
            ? { backgroundImage: `url('${resolvedImage}')` }
            : !resolvedVideo
              ? gradientFallback
              : { background: 'transparent' }
        }
      >
        <div className="min-h-screen w-full bg-black/20">{children}</div>
      </div>
    </div>
  )
}
