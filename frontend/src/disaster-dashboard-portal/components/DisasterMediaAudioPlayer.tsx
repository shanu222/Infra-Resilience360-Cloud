import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Download, Volume2 } from 'lucide-react'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { DisasterMediaPlaybackRateSelect } from './DisasterMediaPlaybackRates'

type DisasterMediaAudioPlayerProps = {
  candidates: string[]
  title: string
}

type AudioTrackProps = {
  candidates: string[]
  title: string
  playbackRate: number
  volume: number
  onReadyChange: (ready: boolean) => void
}

const DisasterMediaAudioTrack = memo(function DisasterMediaAudioTrack({
  candidates,
  title,
  playbackRate,
  volume,
  onReadyChange,
}: AudioTrackProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { src, loaded, failed, onLoad, onError } = useMediaCandidates(candidates, { cacheAsImage: false })

  useEffect(() => {
    onReadyChange(loaded && Boolean(src))
  }, [loaded, src, onReadyChange])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.playbackRate = playbackRate
  }, [playbackRate, src])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.volume = volume
  }, [volume, src])

  if (failed) return null

  return (
    <>
      {src ? (
        <audio
          key={src}
          ref={audioRef}
          className={`dd-media-audio__el${loaded ? ' is-loaded' : ''}`}
          src={src}
          controls
          preload="metadata"
          onLoadedData={onLoad}
          onError={onError}
          aria-label={`${title} guidance audio`}
        />
      ) : null}
    </>
  )
})

export const DisasterMediaAudioPlayer = memo(function DisasterMediaAudioPlayer({
  candidates,
  title,
}: DisasterMediaAudioPlayerProps) {
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [trackReady, setTrackReady] = useState(false)
  const hasCandidates = candidates.length > 0

  const onPlaybackRateChange = useCallback((rate: number) => setPlaybackRate(rate), [])
  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }, [])
  const onReadyChange = useCallback((ready: boolean) => setTrackReady(ready), [])

  if (!hasCandidates) return null

  return (
    <div className="dd-glass-media-card dd-media-audio">
      <div className="dd-media-audio__track">
        <DisasterMediaAudioTrack
          candidates={candidates}
          title={title}
          playbackRate={playbackRate}
          volume={volume}
          onReadyChange={onReadyChange}
        />
      </div>
      <div className="dd-media-controls-row">
        <DisasterMediaPlaybackRateSelect
          id={`dd-audio-rate-${title.replace(/\s+/g, '-')}`}
          value={playbackRate}
          onChange={onPlaybackRateChange}
        />
        <label className="dd-media-volume">
          <Volume2 className="w-4 h-4 shrink-0" aria-hidden />
          <span className="sr-only">Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={onVolumeChange} />
        </label>
        {trackReady && candidates[0] ? (
          <a href={candidates[0]} download className="dd-media-audio__download" rel="noopener noreferrer">
            <Download className="w-4 h-4 shrink-0" aria-hidden />
            Download
          </a>
        ) : null}
      </div>
    </div>
  )
})
