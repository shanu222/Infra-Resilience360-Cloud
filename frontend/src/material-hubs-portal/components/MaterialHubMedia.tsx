import { useState } from 'react'

export const MATERIAL_HUB_MEDIA_UNAVAILABLE = 'Media unavailable'

type MaterialHubMediaImageProps = {
  src: string | undefined
  alt: string
  className?: string
  wrapperClassName?: string
  loading?: 'lazy' | 'eager'
}

export function MaterialHubMediaImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  wrapperClassName = '',
  loading = 'lazy',
}: MaterialHubMediaImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src?.trim() || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 text-sm text-center px-3 ${wrapperClassName}`}
        role="img"
        aria-label={MATERIAL_HUB_MEDIA_UNAVAILABLE}
      >
        {MATERIAL_HUB_MEDIA_UNAVAILABLE}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`max-w-full ${className}`}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
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
