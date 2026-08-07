import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { APP_BRAND_ICON_URL, APP_BRAND_ICON_URL_CANDIDATES } from '../../services/globalShellConfig'
import {
  APP_INTRO_FADE_MS,
  APP_INTRO_LOAD_TIMEOUT_MS,
  APP_INTRO_VIDEO_URL,
} from '../../config/appIntroVideo'
import { mediaManager } from '../../services/mediaManager'

export type AppIntroductionExperienceProps = {
  open: boolean
  onDismiss: () => void
  brandTitle: string
  brandSubtitle: string
  poweredBy: string
  preparingLabel: string
  skipLabel: string
  muteLabel: string
  unmuteLabel: string
  replayLabel: string
  /** Text direction for overlay content. */
  dir?: 'ltr' | 'rtl'
}

type Phase = 'loading' | 'playing' | 'ended' | 'fading'

function disposeVideoElement(video: HTMLVideoElement | null) {
  if (!video) return
  try {
    video.pause()
  } catch {
    /* ignore */
  }
  try {
    video.removeAttribute('src')
    video.load()
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen cinematic application introduction.
 * Streams the R2 demo video; does not alter navigation or module state.
 */
export function AppIntroductionExperience({
  open,
  onDismiss,
  brandTitle,
  brandSubtitle,
  poweredBy,
  preparingLabel,
  skipLabel,
  muteLabel,
  unmuteLabel,
  replayLabel,
  dir = 'ltr',
}: AppIntroductionExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const loadTimerRef = useRef<number | null>(null)
  const dismissedRef = useRef(false)
  const playStartedRef = useRef(false)

  const [phase, setPhase] = useState<Phase>('loading')
  const [muted, setMuted] = useState(true)
  const [visible, setVisible] = useState(false)
  const [logoIndex, setLogoIndex] = useState(0)
  const [sessionKey, setSessionKey] = useState(0)

  const videoSrc = mediaManager.resolveRuntimeMediaUrl(APP_INTRO_VIDEO_URL)
  const logoSrc = APP_BRAND_ICON_URL_CANDIDATES[logoIndex] ?? APP_BRAND_ICON_URL

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
  }, [])

  const beginDismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    clearTimers()
    setPhase('fading')
    setVisible(false)
    fadeTimerRef.current = window.setTimeout(() => {
      disposeVideoElement(videoRef.current)
      onDismiss()
    }, APP_INTRO_FADE_MS)
  }, [clearTimers, onDismiss])

  const tryPlay = useCallback(async (preferUnmuted: boolean) => {
    const video = videoRef.current
    if (!video) return
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')

    const attempt = async (asMuted: boolean) => {
      video.muted = asMuted
      video.defaultMuted = asMuted
      if (asMuted) video.setAttribute('muted', '')
      else video.removeAttribute('muted')
      setMuted(asMuted)
      await video.play()
    }

    try {
      await attempt(preferUnmuted ? false : true)
    } catch {
      try {
        await attempt(true)
      } catch {
        /* autoplay still blocked — user can tap Replay / wait for controls */
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      clearTimers()
      dismissedRef.current = false
      setPhase('loading')
      setVisible(false)
      setMuted(true)
      disposeVideoElement(videoRef.current)
      return
    }

    dismissedRef.current = false
    playStartedRef.current = false
    setPhase('loading')
    setMuted(true)
    setSessionKey((k) => k + 1)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('r360-app-intro-open')

    const showFrame = window.requestAnimationFrame(() => setVisible(true))

    loadTimerRef.current = window.setTimeout(() => {
      beginDismiss()
    }, APP_INTRO_LOAD_TIMEOUT_MS)

    return () => {
      window.cancelAnimationFrame(showFrame)
      clearTimers()
      disposeVideoElement(videoRef.current)
      document.body.style.overflow = previousOverflow
      document.body.classList.remove('r360-app-intro-open')
    }
  }, [open, beginDismiss, clearTimers])

  useEffect(() => {
    if (!open || phase === 'fading') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        beginDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, phase, beginDismiss])

  const handleCanPlay = () => {
    if (dismissedRef.current) return
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current)
      loadTimerRef.current = null
    }
    setPhase((prev) => (prev === 'ended' || prev === 'fading' ? prev : 'playing'))
    if (!playStartedRef.current) {
      playStartedRef.current = true
      void tryPlay(false)
    }
  }

  const handleEnded = () => {
    if (dismissedRef.current) return
    setPhase('ended')
    if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = window.setTimeout(() => {
      beginDismiss()
    }, 4500)
  }

  const handleError = () => {
    beginDismiss()
  }

  const handleReplay = () => {
    const video = videoRef.current
    if (!video) return
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
    dismissedRef.current = false
    playStartedRef.current = true
    setPhase('playing')
    try {
      video.currentTime = 0
    } catch {
      /* ignore */
    }
    void tryPlay(!muted)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const next = !muted
    video.muted = next
    video.defaultMuted = next
    if (next) video.setAttribute('muted', '')
    else video.removeAttribute('muted')
    setMuted(next)
    if (!next && video.paused) void video.play().catch(() => undefined)
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`r360-app-intro r360-fullscreen-overlay${visible ? ' is-visible' : ''}${phase === 'fading' ? ' is-fading' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={brandTitle}
      data-phase={phase}
      dir={dir}
    >
      <div className="r360-app-intro__safe">
        <button type="button" className="r360-app-intro__skip" onClick={beginDismiss}>
          {skipLabel}
        </button>

        <div className="r360-app-intro__brand" aria-hidden={phase === 'playing' || phase === 'ended' ? undefined : true}>
          <img
            className="r360-app-intro__logo"
            src={logoSrc}
            alt=""
            width={72}
            height={72}
            decoding="async"
            onError={() => {
              setLogoIndex((i) => (i + 1 < APP_BRAND_ICON_URL_CANDIDATES.length ? i + 1 : i))
            }}
          />
          <p className="r360-app-intro__title">{brandTitle}</p>
          <p className="r360-app-intro__powered">{poweredBy}</p>
          <p className="r360-app-intro__subtitle">{brandSubtitle}</p>
        </div>

        {phase === 'loading' ?
          <div className="r360-app-intro__loading" role="status" aria-live="polite">
            <div className="r360-app-intro__loading-logo-wrap">
              <img className="r360-app-intro__loading-logo" src={logoSrc} alt="" width={88} height={88} decoding="async" />
              <span className="r360-app-intro__spinner" aria-hidden />
            </div>
            <p className="r360-app-intro__loading-text">{preparingLabel}</p>
          </div>
        : null}

        <video
          key={sessionKey}
          ref={videoRef}
          className={`r360-app-intro__video${phase === 'loading' ? ' is-hidden' : ''}`}
          src={videoSrc}
          playsInline
          preload="auto"
          muted={muted}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onCanPlay={handleCanPlay}
          onLoadedData={handleCanPlay}
          onPlaying={() => {
            if (dismissedRef.current) return
            if (loadTimerRef.current !== null) {
              window.clearTimeout(loadTimerRef.current)
              loadTimerRef.current = null
            }
            setPhase((prev) => (prev === 'ended' || prev === 'fading' ? prev : 'playing'))
          }}
          onEnded={handleEnded}
          onError={handleError}
        />

        <div className="r360-app-intro__controls">
          {phase === 'ended' ?
            <button type="button" className="r360-app-intro__replay" onClick={handleReplay}>
              {replayLabel}
            </button>
          : null}
          <button
            type="button"
            className="r360-app-intro__mute"
            onClick={toggleMute}
            aria-pressed={muted}
            disabled={phase === 'loading'}
          >
            {muted ? unmuteLabel : muteLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
