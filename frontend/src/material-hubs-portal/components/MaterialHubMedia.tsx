import { useEffect, useState } from 'react'

export const MATERIAL_HUB_MEDIA_UNAVAILABLE = 'Media unavailable'

type MaterialHubMediaImageProps = {
  src: string | undefined
  alt: string
  className?: string
  wrapperClassName?: string
  loading?: 'lazy' | 'eager'
  fallbackSrc?: string
}

export function MaterialHubMediaImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  wrapperClassName = '',
  loading = 'lazy',
  fallbackSrc = '',
}: MaterialHubMediaImageProps) {
  const [activeSrc, setActiveSrc] = useState(() => src?.trim() || '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setActiveSrc(src?.trim() || '')
    setFailed(false)
  }, [src])

  if (!activeSrc || failed) {
    return (
      <div
        className={`mh-media-placeholder ${wrapperClassName}`.trim()}
        role="img"
        aria-label="Material hub image unavailable"
      >
        <span className="mh-media-placeholder__icon" aria-hidden>
          🏗️
        </span>
        <span className="mh-media-placeholder__text">Material hub image unavailable</span>
      </div>
    )
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={`max-w-full ${className}`}
      loading={loading}
      decoding="async"
      onError={() => {
        if (import.meta.env.DEV) {
          console.warn('[material-hubs] missing media asset', { src: activeSrc })
        }
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc)
          return
        }
        setFailed(true)
      }}
    />
  )
}

type MaterialHubMediaVideoProps = {
  src: string | undefined
  poster?: string
  className?: string
  wrapperClassName?: string
}

export function MaterialHubMediaVideo({
  src,
  poster,
  className = 'h-full w-full object-cover',
  wrapperClassName = '',
}: MaterialHubMediaVideoProps) {
  const [failed, setFailed] = useState(false)

  if (!src?.trim() || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 text-sm text-center px-3 ${wrapperClassName}`}
      >
        {MATERIAL_HUB_MEDIA_UNAVAILABLE}
      </div>
    )
  }

  return (
    <video
      src={src}
      poster={poster}
      className={className}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  )
}
