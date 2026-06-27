import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { DisasterMediaPlaybackRateSelect } from './DisasterMediaPlaybackRates'
import { isDisasterImageLoaded, markDisasterImageLoaded } from '../utils/disasterMediaCache'

type DisasterMediaVideoPlayerProps = {
  candidates: string[]
  poster?: string
  title: string
}

export const DisasterMediaVideoPlayer = memo(function DisasterMediaVideoPlayer({
  candidates,
  poster,
  title,
}: DisasterMediaVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { src, loaded, failed, onLoad, onError } = useMediaCandidates(candidates, { cacheAsImage: false })
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [posterReady, setPosterReady] = useState(() => (poster ? isDisasterImageLoaded(poster) : false))

  useEffect(() => {
    if (!poster) {
      setPosterReady(false)
      return
    }
    if (isDisasterImageLoaded(poster)) {
      setPosterReady(true)
      return
    }
    setPosterReady(false)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      markDisasterImageLoaded(poster)
      setPosterReady(true)
    }
    img.src = poster
  }, [poster])

  useEffect(() => {
    const el = videoRef.current
    if (el) el.playbackRate = playbackRate
  }, [playbackRate, src])

  useEffect(() => {
    const el = videoRef.current
    if (el) el.volume = volume
  }, [volume, src])

  const onPlaybackRateChange = useCallback((rate: number) => setPlaybackRate(rate), [])
  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }, [])

  if (failed) return null

  return (
    <div className="dd-glass-media-card dd-media-video">
      <div className="dd-media-video__stage">
        {poster ? (
          <img
            src={poster}
            alt=""
            className={`dd-media-video__poster${posterReady ? ' is-loaded' : ''}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            aria-hidden
          />
        ) : null}
        {src ? (
          <video
            key={src}
            ref={videoRef}
            className={`dd-media-video__el${loaded ? ' is-loaded' : ''}`}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            onLoadedData={onLoad}
            onError={onError}
            aria-label={`${title} guidance video`}
          />
        ) : null}
      </div>
      <div className="dd-media-controls-row">
        <DisasterMediaPlaybackRateSelect
          id={`dd-video-rate-${title.replace(/\s+/g, '-')}`}
          value={playbackRate}
          onChange={onPlaybackRateChange}
        />
        <label className="dd-media-volume">
          <Volume2 className="w-4 h-4 shrink-0" aria-hidden />
          <span className="sr-only">Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={onVolumeChange} />
        </label>
      </div>
    </div>
  )
})
