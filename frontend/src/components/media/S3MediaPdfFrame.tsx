import { useEffect, useMemo, useState } from 'react'
import {
  MEDIA_UNAVAILABLE_MESSAGE,
  resolveContentMediaCandidates,
  type MediaLike,
} from '../../utils/contentMediaResolver'
import './mediaLoading.css'

export type S3MediaPdfFrameProps = {
  media?: string | MediaLike | null
  apiBaseHint?: string
  title?: string
  className?: string
  height?: number | string
}

export function S3MediaPdfFrame({
  media,
  apiBaseHint,
  title = 'PDF document',
  className = '',
  height = 480,
}: S3MediaPdfFrameProps) {
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
      <div className={`s3-media-unavailable ${className}`.trim()} role="status">
        {MEDIA_UNAVAILABLE_MESSAGE}
      </div>
    )
  }

  return (
    <div className={`s3-media-wrap ${className}`.trim()} style={{ minHeight: height }}>
      <embed
        title={title}
        src={src}
        type="application/pdf"
        style={{ width: '100%', height, border: 0, display: 'block' }}
        onError={() => {
          if (index + 1 < candidates.length) {
            setIndex((i) => i + 1)
            return
          }
          setFailed(true)
        }}
      />
    </div>
  )
}
