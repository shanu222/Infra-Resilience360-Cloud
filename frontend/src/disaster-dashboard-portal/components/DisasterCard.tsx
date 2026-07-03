import { memo, useCallback } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { preloadDisasterMedia } from '@/config/disasterDashboardMedia'
import { useDisasterGuidanceMedia } from '../hooks/useDisasterGuidanceMedia'
import { resolveLucideIcon } from '../utils/lucideIcon'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { useDisasterDashboardStrings } from '@/hooks/useDisasterDashboardStrings'
import { isVideoLikeMediaUrl } from '../utils/mediaType'

interface DisasterCardProps {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export const DisasterCard = memo(function DisasterCard({ id, name, description, icon, color }: DisasterCardProps) {
  const s = useDisasterDashboardStrings()
  const IconComponent = resolveLucideIcon(icon)
  const media = useDisasterGuidanceMedia(id)
  const visualCandidates = media.imageCandidates.length > 0 ? media.imageCandidates : media.videoCandidates
  const { src, loaded, failed, onLoad, onError } = useMediaCandidates(visualCandidates, { cacheAsImage: false })
  const isVideoVisual = isVideoLikeMediaUrl(src)

  const warmMedia = useCallback(() => {
    preloadDisasterMedia(id)
  }, [id])

  return (
    <Link
      to={`/disaster/${id}`}
      className={`dd-hazard-card dd-hazard-card--${id} group`}
      onPointerEnter={warmMedia}
      onFocus={warmMedia}
      onClick={warmMedia}
    >
      <div className="dd-hazard-card__glow" aria-hidden />
      <div className="dd-hazard-card__media">
        {src && !failed ?
          (isVideoVisual ?
            <video
              src={src}
              className={`dd-hazard-card__img${loaded ? ' is-loaded' : ''}`}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              onLoadedData={onLoad}
              onError={onError}
            />
          : <img
              src={src}
              alt=""
              className={`dd-hazard-card__img${loaded ? ' is-loaded' : ''}`}
              loading="lazy"
              decoding="async"
              onLoad={onLoad}
              onError={onError}
            />)
        : (
          <div className={`dd-hazard-card__icon-badge ${color}`}>
            <IconComponent className="w-10 h-10 text-white" aria-hidden />
          </div>
        )}
        <div className="dd-hazard-card__media-fade" aria-hidden />
      </div>
      <div className="dd-hazard-card__body">
        <div className="dd-hazard-card__icon-chip">
          <IconComponent className="w-4 h-4 text-white" aria-hidden />
        </div>
        <h3 className="dd-hazard-card__title">{name}</h3>
        <p className="dd-hazard-card__desc">{description}</p>
        <span className="dd-hazard-card__cta">
          {s.guidanceUi.viewGuidance}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden />
        </span>
      </div>
    </Link>
  )
})
