import { useEffect, useRef } from 'react'

type ShellBackgroundVideoProps = {
  src: string
  poster: string
  onReady: () => void
  onError?: () => void
  unsupportedLabel: string
}

function inferVideoMime(src: string): string | undefined {
  const p = src.split(/[?#]/)[0].toLowerCase()
  if (p.endsWith('.webm')) return 'video/webm'
  if (p.endsWith('.mp4') || p.endsWith('.m4v')) return 'video/mp4'
  if (p.endsWith('.mov')) return 'video/quicktime'
  if (p.endsWith('.ogg') || p.endsWith('.ogv')) return 'video/ogg'
  return undefined
}

/**
 * Full-bleed shell background video with cross-device playback hardening:
 * muted + inline + explicit `play()` after `load()` (iOS / WebView / Chrome autoplay policies),
 * `preload="auto"` so mobile actually buffers, remount via `key`, retry when tab becomes visible.
 */
export function ShellBackgroundVideo({ src, poster, onReady, onError, unsupportedLabel }: ShellBackgroundVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef<ShellBackgroundVideoProps['onError']>(onError)
  onReadyRef.current = onReady
  onErrorRef.current = onError

  useEffect(() => {
    if (!src) return
    const v = ref.current
    if (!v) return
    let cancelled = false
    let readyReported = false
    const markReady = () => {
      if (cancelled || readyReported) return
      readyReported = true
      onReadyRef.current()
    }
    const tryPlay = () => {
      if (cancelled || !ref.current) return
      const el = ref.current
      el.muted = true
      el.defaultMuted = true
      el.setAttribute('muted', '')
      el.playsInline = true
      const p = el.play()
      if (p !== undefined) {
        void p.catch(() => {
          /* Autoplay blocked or decode race — still unblock shell overlay */
          markReady()
        })
      }
    }
    const onMediaError = () => {
      if (cancelled) return
      onErrorRef.current?.()
    }
    v.muted = true
    v.defaultMuted = true
    v.setAttribute('muted', '')
    v.playsInline = true
    v.addEventListener('canplay', markReady)
    v.addEventListener('loadeddata', markReady)
    v.addEventListener('playing', markReady)
    v.addEventListener('waiting', tryPlay)
    v.addEventListener('stalled', tryPlay)
    v.addEventListener('error', onMediaError)
    try {
      v.load()
    } catch {
      /* ignore */
    }
    tryPlay()
    const raf = window.requestAnimationFrame(() => {
      tryPlay()
    })
    const onVis = () => {
      if (document.visibilityState === 'visible') tryPlay()
    }
    document.addEventListener('visibilitychange', onVis)
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) tryPlay()
    }
    window.addEventListener('pageshow', onPageShow)
    const watchdog = window.setTimeout(markReady, 14_000)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(watchdog)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pageshow', onPageShow)
      v.removeEventListener('canplay', markReady)
      v.removeEventListener('loadeddata', markReady)
      v.removeEventListener('playing', markReady)
      v.removeEventListener('waiting', tryPlay)
      v.removeEventListener('stalled', tryPlay)
      v.removeEventListener('error', onMediaError)
    }
  }, [src])

  const mime = inferVideoMime(src)
  const webkitPlaysInline = { 'webkit-playsinline': '' } as const

  return (
    <video
      ref={ref}
      key={src}
      {...webkitPlaysInline}
      className="background-media background-video"
      poster={poster}
      preload="auto"
      muted
      playsInline
      loop
      autoPlay
      controls={false}
    >
      {mime ? <source src={src} type={mime} /> : <source src={src} />}
      {unsupportedLabel}
    </video>
  )
}
