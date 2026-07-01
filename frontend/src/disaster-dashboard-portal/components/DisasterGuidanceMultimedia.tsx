import { memo, useEffect } from 'react'
import { Film, ImageIcon, Volume2 } from 'lucide-react'
import { preloadDisasterMedia } from '@/config/disasterDashboardMedia'
import { DisasterMediaAudioPlayer } from './DisasterMediaAudioPlayer'
import { DisasterMediaImageViewer } from './DisasterMediaImageViewer'
import { DisasterMediaVideoPlayer } from './DisasterMediaVideoPlayer'
import { useDisasterGuidanceMedia } from '../hooks/useDisasterGuidanceMedia'

import { useDisasterDashboardStrings } from '@/hooks/useDisasterDashboardStrings'

type DisasterGuidanceMultimediaProps = {
  disasterId: string
  disasterName: string
}

export const DisasterGuidanceMultimedia = memo(function DisasterGuidanceMultimedia({
  disasterId,
  disasterName,
}: DisasterGuidanceMultimediaProps) {
  const s = useDisasterDashboardStrings()
  const media = useDisasterGuidanceMedia(disasterId)
  const poster = media.imageCandidates[0] ?? ''
  const hasImage = media.imageCandidates.length > 0
  const hasVideo = media.videoCandidates.length > 0
  const hasAudio = media.audioCandidates.length > 0

  useEffect(() => {
    preloadDisasterMedia(disasterId)
  }, [disasterId])

  if (!hasImage && !hasVideo && !hasAudio) return null

  return (
    <section className="dd-section dd-section--multimedia dd-animate-in" aria-labelledby="dd-multimedia-heading">
      <header className="dd-section__head">
        <div className="dd-section__icon dd-section__icon--indigo">
          <Film className="w-5 h-5" aria-hidden />
        </div>
        <div>
          <h2 id="dd-multimedia-heading" className="dd-section__title">
            {s.guidanceUi.viewGuidance}
          </h2>
          <p className="dd-section__subtitle">{s.guidanceUi.listenGuidance}</p>
        </div>
      </header>

      <div className="dd-multimedia-grid">
        {hasImage ? (
          <article className="dd-glass-panel dd-multimedia-tile dd-multimedia-tile--image">
            <h3 className="dd-multimedia-tile__label">
              <ImageIcon className="w-4 h-4" aria-hidden />
              {s.guidanceUi.viewImage}
            </h3>
            <DisasterMediaImageViewer candidates={media.imageCandidates} alt={`${disasterName} guidance`} />
          </article>
        ) : null}

        {hasVideo ? (
          <article className="dd-glass-panel dd-multimedia-tile dd-multimedia-tile--video">
            <h3 className="dd-multimedia-tile__label">
              <Film className="w-4 h-4" aria-hidden />
              Guidance video
            </h3>
            <DisasterMediaVideoPlayer candidates={media.videoCandidates} poster={poster} title={disasterName} />
          </article>
        ) : null}

        {hasAudio ? (
          <article className="dd-glass-panel dd-multimedia-tile dd-multimedia-tile--audio dd-multimedia-tile--full">
            <h3 className="dd-multimedia-tile__label">
              <Volume2 className="w-4 h-4" aria-hidden />
              Guidance audio
            </h3>
            <DisasterMediaAudioPlayer candidates={media.audioCandidates} title={disasterName} />
          </article>
        ) : null}
      </div>
    </section>
  )
})
