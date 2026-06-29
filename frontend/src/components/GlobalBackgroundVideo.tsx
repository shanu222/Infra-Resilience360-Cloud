import { useEffect, useRef } from 'react'
import { BUNDLED_BACKGROUND_VIDEO_URL } from '../config/localAssets'

const LOCAL_BACKGROUND_VIDEO_URL = BUNDLED_BACKGROUND_VIDEO_URL

export function GlobalBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const play = () => {
      void video.play().catch(() => {
        /* ignore autoplay policy transient failures */
      })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        video.pause()
        return
      }
      play()
    }

    play()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="global-bg-root" aria-hidden>
      <video
        ref={videoRef}
        className="global-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      >
        <source src={LOCAL_BACKGROUND_VIDEO_URL} type="video/mp4" />
      </video>
      <div className="global-bg-overlay" />
    </div>
  )
}
