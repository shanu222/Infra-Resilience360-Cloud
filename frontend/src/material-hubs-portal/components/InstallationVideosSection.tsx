import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, Video, X } from 'lucide-react'
import { useInstallationVideos } from '@/hooks/useInstallationVideos'
import type { MaterialHubInstallationVideo } from '@/config/materialHubGuidance'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'

// ── Video card ────────────────────────────────────────────────────────────────

type VideoCardProps = {
  video: MaterialHubInstallationVideo
  onPlay: (video: MaterialHubInstallationVideo) => void
}

function VideoCard({ video, onPlay }: VideoCardProps) {
  const [thumbFailed, setThumbFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="mh-video-card group w-full min-w-0 max-w-full text-left"
      aria-label={`Play ${video.title}`}
    >
      {/* Thumbnail / preview area */}
      <div className="mh-video-card__thumb">
        {video.posterUrl && !thumbFailed ? (
          <img
            src={video.posterUrl}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div className="mh-video-card__thumb-placeholder">
            <Video className="h-10 w-10 opacity-60" aria-hidden />
          </div>
        )}

        {/* Play button overlay */}
        <div className="mh-video-card__play-overlay" aria-hidden>
          <div className="mh-video-card__play-btn">
            <Play className="h-7 w-7 translate-x-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="mh-video-card__body">
        <h3 className="mh-video-card__title">{video.title}</h3>
        <p className="mh-video-card__desc line-clamp-2">{video.description}</p>
      </div>
    </button>
  )
}

// ── Video lightbox ────────────────────────────────────────────────────────────

type VideoLightboxProps = {
  video: MaterialHubInstallationVideo
  onClose: () => void
}

function VideoLightbox({ video, onClose }: VideoLightboxProps) {
  const [failed, setFailed] = useState(false)

  const lightbox = (
    <div
      className="r360-fullscreen-overlay mh-video-lightbox fixed inset-0 z-[10000] flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${video.title} — installation video`}
    >
      <div
        className="mh-video-lightbox__frame"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="mh-video-lightbox__close"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
        </button>

        {failed ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-white text-center">
            <Video className="h-12 w-12 opacity-50" />
            <p className="text-sm text-slate-300">Video unavailable. Please try again later.</p>
          </div>
        ) : (
          <video
            key={video.url}
            src={video.url}
            poster={video.posterUrl}
            controls
            autoPlay
            muted
            playsInline
            preload="metadata"
            className="mh-video-lightbox__video"
            onError={() => setFailed(true)}
          />
        )}

        <div className="mh-video-lightbox__caption">
          <h3 className="text-base font-semibold text-white sm:text-lg">{video.title}</h3>
          <p className="mt-1 text-sm text-slate-300">{video.description}</p>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(lightbox, document.body) : null
}

// ── Main section ──────────────────────────────────────────────────────────────

export function InstallationVideosSection() {
  const s = useMaterialHubStrings()
  const { videos, loading } = useInstallationVideos()
  const [activeVideo, setActiveVideo] = useState<MaterialHubInstallationVideo | null>(null)

  if (loading) {
    return (
      <div className="mh-guidance-library rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Video className="h-7 w-7 mr-3 text-blue-400" />
          {s.trainInstallVideosTitle ?? 'Installation Videos'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mh-video-card mh-video-card--skeleton animate-pulse" aria-hidden>
              <div className="mh-video-card__thumb bg-white/10 rounded-xl" />
              <div className="mh-video-card__body space-y-2 mt-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (videos.length === 0) return null

  return (
    <>
      <div className="mh-guidance-library rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Video className="h-7 w-7 mr-3 text-blue-400" />
          {s.trainInstallVideosTitle ?? 'Installation Videos'}
        </h2>
        <p className="text-sm mb-6 opacity-70">
          {s.trainInstallVideosSubtitle ?? 'Step-by-step material installation videos streaming directly from R2.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onPlay={setActiveVideo} />
          ))}
        </div>
      </div>

      {activeVideo &&
        <VideoLightbox video={activeVideo} onClose={() => setActiveVideo(null)} />
      }
    </>
  )
}
