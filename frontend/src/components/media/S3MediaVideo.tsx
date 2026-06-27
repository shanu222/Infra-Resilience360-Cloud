import { useEffect, useMemo, useState, type VideoHTMLAttributes } from 'react'
import {
  MEDIA_UNAVAILABLE_MESSAGE,
  resolveContentMediaCandidates,
  type MediaLike,
} from '../../utils/contentMediaResolver'
import './mediaLoading.css'

export type S3MediaVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  media?: string | MediaLike | null
  apiBaseHint?: string
  wrapperClassName?: string
  poster?: string
}

export function S3MediaVideo({
  media,
  apiBaseHint,
  wrapperClassName = '',
  className = '',
  poster,
  onError,
  onLoadedData,
  ...rest
}: S3MediaVideoProps) {
  const candidates = useMemo(
    () => resolveContentMediaCandidates(media, { apiBaseHint, includePlaceholder: false }),
    [media, apiBaseHint],
  )
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [candidates.join('|')])

  const src = candidates[index] ?? ''

  if (failed || !src) {
    return (
      <div className={`s3-media-unavailable ${wrapperClassName}`.trim()} role="status">
        {MEDIA_UNAVAILABLE_MESSAGE}
      </div>
    )
  }

  return (
    <div className={`s3-media-wrap ${wrapperClassName}`.trim()}>
      <video
        {...rest}
        src={src}
        poster={poster}
        className={className}
        preload={rest.preload ?? 'auto'}
        onLoadedData={(e) => {
          onLoadedData?.(e)
        }}
        onError={(e) => {
          if (index + 1 < candidates.length) {
            setIndex((i) => i + 1)
            return
          }
          setFailed(true)
          onError?.(e)
        }}
      />
    </div>
  )
}
