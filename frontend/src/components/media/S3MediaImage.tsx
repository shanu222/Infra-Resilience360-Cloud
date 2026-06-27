import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react'
import {
  MEDIA_UNAVAILABLE_MESSAGE,
  resolveContentMediaCandidates,
  type MediaLike,
} from '../../utils/contentMediaResolver'
import './mediaLoading.css'

export type S3MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  media?: string | MediaLike | null
  apiBaseHint?: string
  wrapperClassName?: string
}

export function S3MediaImage({
  media,
  apiBaseHint,
  wrapperClassName = '',
  className = '',
  alt = '',
  onError,
  onLoad,
  ...rest
}: S3MediaImageProps) {
  const candidates = useMemo(
    () => resolveContentMediaCandidates(media, { apiBaseHint, includePlaceholder: true }),
    [media, apiBaseHint],
  )
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [candidates.join('|')])

  const src = candidates[index] ?? ''
  const loadingMode = rest.loading ?? 'lazy'
  const decodingMode = rest.decoding ?? 'async'
  const fetchPriorityMode = rest.fetchPriority ?? (loadingMode === 'eager' ? 'high' : 'auto')

  if (failed || !src) {
    return (
      <div className={`s3-media-unavailable ${wrapperClassName}`.trim()} role="status">
        {MEDIA_UNAVAILABLE_MESSAGE}
      </div>
    )
  }

  return (
    <div className={`s3-media-wrap ${wrapperClassName}`.trim()}>
      <img
        {...rest}
        src={src}
        alt={alt}
        className={`s3-media-img ${className}`.trim()}
        loading={loadingMode}
        decoding={decodingMode}
        fetchPriority={fetchPriorityMode}
        onLoad={(e) => {
          onLoad?.(e)
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
