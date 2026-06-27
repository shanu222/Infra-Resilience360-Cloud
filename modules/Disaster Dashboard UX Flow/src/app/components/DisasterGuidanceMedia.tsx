import { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useDisasterDashboardStrings } from '../../i18n/disasterDashboardStrings';
import {
  ensureFreshDisasterSignedVideoPlayback,
  getGuidanceAudioCandidates,
  getGuidanceVideoCandidates,
  invalidateDisasterSignedVideoCache,
  isAwsSigV4PresignedGetUrl,
  loadDisasterDashboardMediaFromApi,
  loadDisasterSignedVideoPlayback,
  resolveGuidanceImagePath,
  toWebSafeUrl,
} from '../../utils/guidanceVideoUrls'

function disasterVideoDebugEnabled(): boolean {
  try {
    return (
      Boolean(import.meta.env?.DEV) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('r360DisasterVideoDebug') === '1')
    )
  } catch {
    return Boolean(import.meta.env?.DEV)
  }
}

function logDisasterVideoPlayback(label: string, detail?: Record<string, unknown>): void {
  if (!disasterVideoDebugEnabled()) return
  if (detail) console.info('[disaster-dashboard][video]', label, detail)
  else console.info('[disaster-dashboard][video]', label)
}

function mediaErrorName(code: number | undefined): string {
  if (code === 1) return 'MEDIA_ERR_ABORTED'
  if (code === 2) return 'MEDIA_ERR_NETWORK'
  if (code === 3) return 'MEDIA_ERR_DECODE'
  if (code === 4) return 'MEDIA_ERR_SRC_NOT_SUPPORTED'
  return 'MEDIA_ERR_UNKNOWN'
}

function shortUrlFingerprint(url: string): string {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

type DisasterGuidanceMediaProps = {
  disasterId: string;
  disasterName: string;
};

const MAX_S3_RELOAD_ATTEMPTS = 2;
const SIGNED_REFRESH_LOOP_MS = 45_000;

export function DisasterGuidanceMedia({ disasterId, disasterName }: DisasterGuidanceMediaProps) {
  const { guidanceUi: ui } = useDisasterDashboardStrings();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [guidanceVideoBust, setGuidanceVideoBust] = useState(() => Date.now());
  const [apiMediaGen, setApiMediaGen] = useState(0);
  const [videoCandidateIndex, setVideoCandidateIndex] = useState(0);
  const s3ReloadAttemptsRef = useRef(0);
  const resumeAfterRefreshAtRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoPathKey = String(disasterId ?? '').trim().toLowerCase();

  const videoCandidates = useMemo(() => {
    void apiMediaGen
    return getGuidanceVideoCandidates(videoPathKey, guidanceVideoBust)
  }, [videoPathKey, guidanceVideoBust, apiMediaGen])

  const audioCandidates = useMemo(() => {
    void apiMediaGen
    return getGuidanceAudioCandidates(videoPathKey, guidanceVideoBust)
  }, [videoPathKey, guidanceVideoBust, apiMediaGen])

  const image = useMemo(() => {
    void apiMediaGen
    return toWebSafeUrl(resolveGuidanceImagePath(videoPathKey))
  }, [videoPathKey, apiMediaGen])

  const currentVideo = videoCandidates[0];
  const [videoSrc, setVideoSrc] = useState('');
  const [audioSrc, setAudioSrc] = useState('');

  useEffect(() => {
    let alive = true
    void (async () => {
      await loadDisasterDashboardMediaFromApi()
      if (!alive) return
      await loadDisasterSignedVideoPlayback(videoPathKey)
      if (!alive) return
      setVideoLoadFailed(false)
      setVideoError(null)
      setShowVideoPlayer(false)
      setVideoCandidateIndex(0)
      s3ReloadAttemptsRef.current = 0
      resumeAfterRefreshAtRef.current = null
      setGuidanceVideoBust(Date.now())
      setApiMediaGen((n) => n + 1)
    })()
    return () => {
      alive = false
    }
  }, [disasterId, videoPathKey])

  useEffect(() => {
    queueMicrotask(() => {
      setVideoSrc(videoCandidates[0] ?? '')
      setAudioSrc(audioCandidates[0] ?? '')
    })
  }, [videoCandidates, audioCandidates])

  useEffect(() => {
    if (!videoSrc) return
    const presigned = isAwsSigV4PresignedGetUrl(videoSrc)
    const hasExtraQuery =
      presigned && (/[?&]t=\d+/.test(videoSrc) || /[?&]cv=/.test(videoSrc) || /[?&]r360cb=/.test(videoSrc))
    if (disasterVideoDebugEnabled()) {
      console.info('[disaster-dashboard][video] src before render', {
        disasterId: videoPathKey,
        length: videoSrc.length,
        presigned,
        hasDisallowedExtraQuery: hasExtraQuery,
        head: videoSrc.slice(0, 120),
      })
    }
    if (hasExtraQuery) {
      console.warn(
        '[disaster-dashboard][video] presigned URL has unexpected extra query params — playback may fail',
      )
    }
  }, [videoSrc, videoPathKey])

  useEffect(() => {
    if (!showVideoPlayer || !isAwsSigV4PresignedGetUrl(videoSrc)) return
    let disposed = false
    const timer = window.setInterval(() => {
      void ensureFreshDisasterSignedVideoPlayback(videoPathKey).then(() => {
        if (disposed) return
        setApiMediaGen((n) => n + 1)
      })
    }, SIGNED_REFRESH_LOOP_MS)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [showVideoPlayer, videoSrc, videoPathKey])

  const handleGuidanceVideoError = () => {
    const el = videoRef.current
    const cur = el?.currentSrc || videoSrc
    const mediaErr = el?.error ?? undefined
    const code = mediaErr?.code
    console.error('[disaster-dashboard][video] error', {
      currentSrc: cur,
      mediaErrorCode: code,
      mediaErrorName: mediaErrorName(code),
      message: mediaErr?.message,
    })

    const nextIndex = videoCandidateIndex + 1
    if (nextIndex < videoCandidates.length) {
      const nextSrc = videoCandidates[nextIndex];
      setVideoCandidateIndex(nextIndex);
      setVideoSrc(nextSrc);
      return;
    }

    if (s3ReloadAttemptsRef.current >= MAX_S3_RELOAD_ATTEMPTS) {
      setVideoLoadFailed(true);
      setVideoError(null);
      setShowVideoPlayer(false);
      return;
    }

    s3ReloadAttemptsRef.current += 1;
    const resumeAtSeconds = Number.isFinite(el?.currentTime ?? NaN) ? Number(el?.currentTime ?? 0) : 0
    resumeAfterRefreshAtRef.current = resumeAtSeconds > 0 ? resumeAtSeconds : null
    invalidateDisasterSignedVideoCache(videoPathKey);
    void loadDisasterSignedVideoPlayback(videoPathKey).then(() => {
      setApiMediaGen((n) => n + 1)
    });
    setVideoCandidateIndex(0);
    setGuidanceVideoBust(Date.now());
  };

  const hasAudio = audioCandidates.length > 0;
  if (!image && !currentVideo && !hasAudio) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/75 backdrop-blur-sm p-4 sm:p-6 mb-6">
      {image && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white relative min-h-[13rem]">
          <img
            src={image}
            alt={`${disasterName} guidance`}
            className="w-full h-52 sm:h-64 md:h-72 object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              const parent = el.parentElement
              if (parent && !parent.querySelector('[data-media-unavailable]')) {
                const note = document.createElement('p')
                note.dataset.mediaUnavailable = '1'
                note.className = 's3-media-unavailable p-4 text-sm text-slate-600 text-center'
                note.textContent = ui.videoUnavailable
                parent.appendChild(note)
              }
            }}
          />
        </div>
      )}

      {currentVideo && !videoLoadFailed && (
        <div className="relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950/90 h-52 sm:h-64 md:h-72">
          <video
            key={`dd-video-${videoPathKey}-${videoCandidateIndex}-${shortUrlFingerprint(videoSrc || '')}`}
            ref={videoRef}
            className={
              showVideoPlayer
                ? 'relative z-10 h-full w-full object-cover'
                : 'pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-0'
            }
            src={videoSrc}
            controls
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onLoadedMetadata={() => {
              const el = videoRef.current
              const resumeAt = resumeAfterRefreshAtRef.current
              if (el && Number.isFinite(resumeAt ?? NaN) && Number(resumeAt) > 0) {
                try {
                  el.currentTime = Number(resumeAt)
                  void el.play().catch(() => {
                    /* autoplay may be blocked by browser policy */
                  })
                } catch {
                  /* ignore seek/play failure */
                }
              }
              resumeAfterRefreshAtRef.current = null
              logDisasterVideoPlayback('loadedmetadata', {
                duration: el?.duration,
                videoWidth: el?.videoWidth,
                videoHeight: el?.videoHeight,
              })
            }}
            onStalled={() => {
              console.warn('[disaster-dashboard][video] stalled', { src: videoRef.current?.currentSrc })
            }}
            onAbort={() => {
              console.warn('[disaster-dashboard][video] abort', { src: videoRef.current?.currentSrc })
            }}
            onError={handleGuidanceVideoError}
          />
          {!showVideoPlayer && (
            <button
              type="button"
              onClick={() => {
                setVideoError(null);
                setShowVideoPlayer(true);
                const el = videoRef.current;
                if (!el) {
                  return;
                }
                void el.play().catch((err) => {
                  console.error('[disaster-dashboard][video] play() rejected', err)
                  setVideoError(ui.tapToPlay)
                })
              }}
              className="absolute inset-0 z-20 w-full"
              aria-label={`Play ${disasterName} guidance video`}
            >
              {image ? (
                <img src={image} alt={`${disasterName} video thumbnail`} className="h-full w-full object-cover opacity-90" />
              ) : (
                <div className="h-full w-full bg-slate-900" />
              )}
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 rounded-full px-5 py-3 bg-white/92 text-slate-900 font-semibold shadow-lg">
                  <Play className="h-5 w-5 fill-current" />
                  Play Video
                </span>
              </div>
            </button>
          )}
        </div>
      )}
      {videoError && (
        <p className="text-sm font-medium text-red-700 mb-4 whitespace-pre-line leading-relaxed">{videoError}</p>
      )}

      {currentVideo && videoLoadFailed && (
        <p className="text-sm font-medium text-slate-600 mb-4">{ui.videoUnavailable}</p>
      )}

      {(audioSrc || audioCandidates[0]) ? (
        <audio controls preload="none" className="w-full mt-4">
          <source src={audioSrc || audioCandidates[0]} />
        </audio>
      ) : null}
    </div>
  );
}
