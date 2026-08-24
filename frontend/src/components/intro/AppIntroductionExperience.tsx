import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  APP_INTRO_FADE_MS,
  APP_INTRO_LOAD_TIMEOUT_MS,
  APP_INTRO_VIDEO_URL,
} from '../../config/appIntroVideo'
import { mediaManager } from '../../services/mediaManager'
import {
  isLandscapeViewport,
  lockLandscape,
  onOrientationChange,
  unlockOrientation,
} from '../../capacitor/screenOrientation'

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
  slideHint: string
  slideAriaLabel: string
  rotateTitle?: string
  rotateText?: string
  rotateLandscapeLabel?: string
  rotatePortraitLabel?: string
  /** Text direction for overlay content. */
  dir?: 'ltr' | 'rtl'
}

type Phase = 'gate' | 'rotate' | 'loading' | 'playing' | 'ended' | 'fading'

const SLIDE_COMPLETE_RATIO = 0.86

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
 * Shows a slide-to-start gate first; video streams from R2 only after the user slides.
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
  slideHint,
  slideAriaLabel,
  rotateTitle = 'Best viewed in landscape',
  rotateText = 'Turn your device sideways to watch the introduction full screen.',
  rotateLandscapeLabel = 'Watch in landscape',
  rotatePortraitLabel = 'Continue in portrait',
  dir = 'ltr',
}: AppIntroductionExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const loadTimerRef = useRef<number | null>(null)
  const dismissedRef = useRef(false)
  const playStartedRef = useRef(false)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startOffsetRef = useRef(0)
  const slideOffsetRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('gate')
  const [muted, setMuted] = useState(true)
  const [visible, setVisible] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [slideOffset, setSlideOffset] = useState(0)
  const [slideMax, setSlideMax] = useState(220)
  const [slideComplete, setSlideComplete] = useState(false)

  const isRtl = dir === 'rtl'
  const videoSrc = mediaManager.resolveRuntimeMediaUrl(APP_INTRO_VIDEO_URL)
  const showVideo = phase === 'loading' || phase === 'playing' || phase === 'ended'

  const updateSlideOffset = useCallback((value: number) => {
    slideOffsetRef.current = value
    setSlideOffset(value)
  }, [])

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

  const measureSlideTrack = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const knob = 52
    const max = Math.max(120, track.clientWidth - knob - 8)
    setSlideMax(max)
  }, [])

  const beginDismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    clearTimers()
    // Release before the fade so Home is already upright when it is revealed.
    void unlockOrientation()
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
        /* autoplay may still be blocked after gesture; unmute control remains available */
      }
    }
  }, [])

  const beginPlayback = useCallback(() => {
    if (dismissedRef.current) return
    playStartedRef.current = false
    setPhase('loading')
    setSessionKey((k) => k + 1)
    if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current)
    loadTimerRef.current = window.setTimeout(() => {
      beginDismiss()
    }, APP_INTRO_LOAD_TIMEOUT_MS)
  }, [beginDismiss])

  /**
   * The intro is a widescreen film, so it only fills the screen in landscape.
   * A device already held sideways goes straight to playback; otherwise the user
   * is asked, because silently rotating the screen under them is disorienting.
   */
  const startVideoFromGate = useCallback(() => {
    if (dismissedRef.current || slideComplete) return
    setSlideComplete(true)
    updateSlideOffset(slideMax)
    if (isLandscapeViewport()) {
      beginPlayback()
      return
    }
    setPhase('rotate')
  }, [beginPlayback, slideComplete, slideMax, updateSlideOffset])

  const playInLandscape = useCallback(() => {
    void lockLandscape().then((locked) => {
      if (dismissedRef.current) return
      // When the lock is refused we stay on the prompt and wait for the user to
      // turn the device; the orientation watcher below starts playback then.
      if (locked || isLandscapeViewport()) beginPlayback()
    })
  }, [beginPlayback])

  // Turning the device while the prompt is up is an implicit "yes".
  useEffect(() => {
    if (phase !== 'rotate') return
    return onOrientationChange((landscape) => {
      if (landscape) beginPlayback()
    })
  }, [phase, beginPlayback])

  useEffect(() => {
    if (!open) {
      clearTimers()
      dismissedRef.current = false
      playStartedRef.current = false
      setPhase('gate')
      setVisible(false)
      setMuted(true)
      updateSlideOffset(0)
      setSlideComplete(false)
      disposeVideoElement(videoRef.current)
      return
    }

    dismissedRef.current = false
    playStartedRef.current = false
    setPhase('gate')
    setMuted(true)
    updateSlideOffset(0)
    setSlideComplete(false)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('r360-app-intro-open')

    const showFrame = window.requestAnimationFrame(() => {
      setVisible(true)
      measureSlideTrack()
    })

    const onResize = () => measureSlideTrack()
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(showFrame)
      window.removeEventListener('resize', onResize)
      clearTimers()
      disposeVideoElement(videoRef.current)
      void unlockOrientation()
      document.body.style.overflow = previousOverflow
      document.body.classList.remove('r360-app-intro-open')
    }
  }, [open, clearTimers, measureSlideTrack, updateSlideOffset])

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

  const clampSlide = (value: number) => Math.max(0, Math.min(slideMax, value))

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (slideComplete || phase !== 'gate') return
    draggingRef.current = true
    startXRef.current = event.clientX
    startOffsetRef.current = slideOffsetRef.current
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current || slideComplete) return
    const delta = event.clientX - startXRef.current
    const directed = isRtl ? -delta : delta
    updateSlideOffset(clampSlide(startOffsetRef.current + directed))
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    const next = clampSlide(slideOffsetRef.current)
    if (next / slideMax >= SLIDE_COMPLETE_RATIO) {
      startVideoFromGate()
    } else {
      updateSlideOffset(0)
    }
  }

  const handleCanPlay = () => {
    if (dismissedRef.current || phase === 'gate' || phase === 'fading') return
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
    if (phase === 'gate') return
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

  const knobTransform = isRtl ? `translateX(-${slideOffset}px)` : `translateX(${slideOffset}px)`
  const fillWidth = `${Math.min(100, (slideOffset / Math.max(1, slideMax)) * 100)}%`

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

        {phase === 'gate' ?
          <div className="r360-app-intro__gate">
            <div className="r360-app-intro__gate-glow" aria-hidden />
            <p className="r360-app-intro__gate-kicker">{poweredBy}</p>
            <h2 className="r360-app-intro__gate-title">{brandTitle}</h2>
            <p className="r360-app-intro__gate-subtitle">{brandSubtitle}</p>

            <div className="r360-app-intro__slide" ref={trackRef}>
              <div className="r360-app-intro__slide-fill" style={{ width: fillWidth }} aria-hidden />
              <p className="r360-app-intro__slide-hint">{slideHint}</p>
              <button
                type="button"
                className={`r360-app-intro__slide-knob${slideComplete ? ' is-complete' : ''}`}
                style={{ transform: knobTransform }}
                aria-label={slideAriaLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((slideOffset / Math.max(1, slideMax)) * 100)}
                role="slider"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    startVideoFromGate()
                  } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    const forward = isRtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight'
                    const next = clampSlide(slideOffsetRef.current + (forward ? slideMax * 0.2 : -slideMax * 0.2))
                    updateSlideOffset(next)
                    if (next / slideMax >= SLIDE_COMPLETE_RATIO) startVideoFromGate()
                  }
                }}
              >
                <span aria-hidden>{isRtl ? '‹' : '›'}</span>
              </button>
            </div>
          </div>
        : null}

        {phase === 'rotate' ?
          <div className="r360-app-intro__rotate" role="dialog" aria-live="polite">
            <span className="r360-app-intro__rotate-icon" aria-hidden>
              <svg viewBox="0 0 120 120" width="132" height="132" fill="none">
                {/* Circular sweep arrow showing the direction to turn */}
                <g className="r360-app-intro__rotate-sweep">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="46 20"
                    opacity="0.32"
                  />
                  <path
                    d="M60 10a50 50 0 0 1 44 26"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M96 38l9-3-3-9"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
                {/* Phone that tips from portrait to landscape */}
                <g className="r360-app-intro__rotate-phone">
                  <rect
                    x="45"
                    y="33"
                    width="30"
                    height="54"
                    rx="6"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="rgba(125, 211, 252, 0.12)"
                  />
                  <line
                    x1="55"
                    y1="39"
                    x2="65"
                    y2="39"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <circle cx="60" cy="80" r="2.4" fill="currentColor" />
                </g>
              </svg>
            </span>
            <h3 className="r360-app-intro__rotate-title">{rotateTitle}</h3>
            <p className="r360-app-intro__rotate-text">{rotateText}</p>
            <div className="r360-app-intro__rotate-actions">
              <button type="button" className="r360-app-intro__rotate-primary" onClick={playInLandscape}>
                {rotateLandscapeLabel}
              </button>
              <button type="button" className="r360-app-intro__rotate-secondary" onClick={beginPlayback}>
                {rotatePortraitLabel}
              </button>
            </div>
          </div>
        : null}

        {phase === 'loading' ?
          <div className="r360-app-intro__loading" role="status" aria-live="polite">
            <div className="r360-app-intro__loading-spinner-wrap" aria-hidden>
              <span className="r360-app-intro__spinner" />
            </div>
            <p className="r360-app-intro__loading-text">{preparingLabel}</p>
          </div>
        : null}

        {showVideo ?
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
              setPhase((prev) => (prev === 'ended' || prev === 'fading' || prev === 'gate' ? prev : 'playing'))
            }}
            onEnded={handleEnded}
            onError={handleError}
          />
        : null}

        {phase === 'playing' || phase === 'ended' ?
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
            >
              {muted ? unmuteLabel : muteLabel}
            </button>
          </div>
        : null}
      </div>
    </div>,
    document.body,
  )
}
