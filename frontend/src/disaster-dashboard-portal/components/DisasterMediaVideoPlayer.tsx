import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { DisasterMediaPlaybackRateSelect } from './DisasterMediaPlaybackRates'
import { isVideoLikeMediaUrl } from '../utils/mediaType'

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
  const [metadataReady, setMetadataReady] = useState(false)
  const [posterLoaded, setPosterLoaded] = useState(false)
  const safePoster = poster && !isVideoLikeMediaUrl(poster) ? poster : ''

  useEffect(() => {
    setMetadataReady(false)
    setPosterLoaded(false)
  }, [src])

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
        {!metadataReady ? <div className="dd-skeleton dd-skeleton--video dd-skeleton--fill dd-skeleton--overlay" aria-hidden /> : null}
        {safePoster ?
          <img
            src={safePoster}
            alt=""
            className={`dd-media-video__poster${posterLoaded ? ' is-loaded' : ''}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setPosterLoaded(true)}
          />
        : null}
        {src ? (
          <video
            key={src}
            ref={videoRef}
            className={`dd-media-video__el${loaded ? ' is-loaded' : ''}`}
            src={src}
            poster={safePoster}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={() => setMetadataReady(true)}
            onLoadedData={onLoad}
            onError={onError}
            aria-label={`${title} guidance video`}
          />
        ) : null}
        {!metadataReady ? <div className="dd-media-video__loading">Loading video...</div> : null}
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
