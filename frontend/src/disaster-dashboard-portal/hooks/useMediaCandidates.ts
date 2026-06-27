import { useCallback, useEffect, useMemo, useState } from 'react'
import { isDisasterImageLoaded, markDisasterImageLoaded } from '../utils/disasterMediaCache'

type UseMediaCandidatesOptions = {
  /** When false, successful loads are not stored in the image warm-cache (video/audio). */
  cacheAsImage?: boolean
}

export function useMediaCandidates(candidates: string[], options?: UseMediaCandidatesOptions) {
  const cacheAsImage = options?.cacheAsImage !== false
  const key = useMemo(() => candidates.join('|'), [candidates])
  const [index, setIndex] = useState(0)
  const src = candidates[index] ?? ''
  const [loaded, setLoaded] = useState(() => isDisasterImageLoaded(src))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
    const first = candidates[0] ?? ''
    setLoaded(isDisasterImageLoaded(first))
  }, [key, candidates])

  useEffect(() => {
    if (src && isDisasterImageLoaded(src)) {
      setLoaded(true)
      setFailed(false)
    }
  }, [src])

  const onLoad = useCallback(() => {
    if (cacheAsImage && src) markDisasterImageLoaded(src)
    setLoaded(true)
    setFailed(false)
  }, [src, cacheAsImage])

  const onError = useCallback(() => {
    if (index + 1 < candidates.length) {
      setIndex((i) => i + 1)
      setLoaded(false)
      return
    }
    setFailed(true)
    setLoaded(false)
  }, [index, candidates.length])

  return {
    src,
    loaded,
    failed: failed || !src,
    pending: false,
    onLoad,
    onError,
  }
}
