import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Expand, X } from 'lucide-react';
import './DisasterGuidance.css';
import type { DisasterDashboardStrings } from '../../i18n/disasterDashboardStrings';
import {
  getGuidanceAudioCandidates,
  getGuidanceVideoCandidates,
  invalidateDisasterSignedVideoCache,
  loadDisasterDashboardMediaFromApi,
  loadDisasterSignedVideoPlayback,
  resolveGuidanceImagePath,
  toWebSafeUrl
} from '../../utils/guidanceVideoUrls';

type GuidanceContent = {
  before: string[];
  during: string[];
  after: string[];
};

export type GuidancePhaseItem = {
  text: string;
  image?: string;
  video?: string;
  audio?: string;
};

export type DisasterGuidanceStructured = {
  before: GuidancePhaseItem[];
  during: GuidancePhaseItem[];
  after: GuidancePhaseItem[];
};

type DisasterGuidanceProps = {
  disaster: string;
  disasterName: string;
  guidance: GuidanceContent;
  /** CMS rich guidance (per-bullet media). When set for EN, overrides list rendering. */
  guidanceStructured?: DisasterGuidanceStructured;
  /** CMS main guidance strip URLs (overrides manifest folder resolution). */
  mediaOverride?: { image?: string; video?: string; audio?: string };
  strings: DisasterDashboardStrings['guidanceUi'];
};

const FOLDER_BY_DISASTER: Record<string, string> = {
  flood: 'Flood',
  earthquake: 'Earthquake',
  'urban-fire': 'Urban fire',
  'crop-fire': 'Crop Fire',
  heatwave: 'Heatwave',
  'load-shedding': 'Loadshedding',
  'storm-cyclone': 'Storm Cyclone',
  landslide: 'Landslide',
  'cold-wave': 'Cold wave',
  smog: 'Smog'
};

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;
const SUBTITLE_OPTIONS = ['off', 'en', 'ur'] as const;
type SubtitleOption = (typeof SUBTITLE_OPTIONS)[number];

const MAX_S3_RELOAD_ATTEMPTS = 2;

function isSyntheticHazardTemplateVideo(url: string): boolean {
  const u = String(url ?? '').trim().toLowerCase()
  if (!u) return false
  return /\/resilience360\/disaster-dashboard\/[^/?#]+\/video\.mp4(?:[?#]|$)/.test(u)
}

/** Dedupe by URL path (ignore cache-bust query) while preserving order. */
function dedupeMediaCandidates(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    if (!u) continue
    const base = u.split('?')[0]
    if (seen.has(base)) continue
    seen.add(base)
    out.push(u)
  }
  return out
}

function toStructuredFromStrings(g: GuidanceContent): DisasterGuidanceStructured {
  const mapPhase = (arr: string[]) =>
    arr.map((text) => ({ text, image: '', video: '', audio: '' }));
  return {
    before: mapPhase(Array.isArray(g?.before) ? g.before : []),
    during: mapPhase(Array.isArray(g?.during) ? g.during : []),
    after: mapPhase(Array.isArray(g?.after) ? g.after : []),
  };
}

export function DisasterGuidance({
  disaster,
  disasterName,
  guidance,
  guidanceStructured,
  mediaOverride,
  strings: ui,
}: DisasterGuidanceProps) {
  const safeGuidance = {
    before: Array.isArray(guidance?.before) ? guidance.before : [],
    during: Array.isArray(guidance?.during) ? guidance.during : [],
    after: Array.isArray(guidance?.after) ? guidance.after : [],
  };

  const structured: DisasterGuidanceStructured =
    guidanceStructured &&
    (guidanceStructured.before?.length ||
      guidanceStructured.during?.length ||
      guidanceStructured.after?.length)
      ? guidanceStructured
      : toStructuredFromStrings(safeGuidance);

  const [isOpen, setIsOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [playVideoRequested, setPlayVideoRequested] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [subtitleLang, setSubtitleLang] = useState<SubtitleOption>('en');
  const [guidanceVideoBust, setGuidanceVideoBust] = useState(() => Date.now());
  const [apiMediaGen, setApiMediaGen] = useState(0);
  const [videoCandidateIndex, setVideoCandidateIndex] = useState(0);
  const s3ReloadAttemptsRef = useRef(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const folderName = useMemo(() => FOLDER_BY_DISASTER[disaster], [disaster]);
  const videoPathKey = useMemo(() => String(disaster ?? '').trim().toLowerCase(), [disaster]);

  const media = useMemo(() => {
    const sep = (u: string) => (u.includes('?') ? '&' : '?');
    const bust = (u: string) => `${u}${sep(u)}t=${guidanceVideoBust}`;
    const videoCandidatesFromManifest = getGuidanceVideoCandidates(videoPathKey, guidanceVideoBust);
    const audioCandidatesFromManifest = getGuidanceAudioCandidates(videoPathKey, guidanceVideoBust);
    const imageFromManifest = toWebSafeUrl(resolveGuidanceImagePath(videoPathKey));

    const o = mediaOverride;
    if (o && (o.image || o.video || o.audio)) {
      const cmsImg = o.image ? toWebSafeUrl(String(o.image)) : undefined;
      const rawCmsVid = o.video ? toWebSafeUrl(String(o.video)) : undefined;
      const cmsVid = rawCmsVid && !isSyntheticHazardTemplateVideo(rawCmsVid) ? rawCmsVid : undefined;
      const cmsAud = o.audio ? toWebSafeUrl(String(o.audio)) : undefined;
      return {
        image: cmsImg || imageFromManifest,
        videoCandidates: dedupeMediaCandidates([
          ...(cmsVid ? [bust(cmsVid)] : []),
          ...videoCandidatesFromManifest,
        ]),
        audioCandidates: dedupeMediaCandidates([
          ...(cmsAud ? [bust(cmsAud)] : []),
          ...audioCandidatesFromManifest,
        ]),
        subtitleEn: undefined,
        subtitleUr: undefined,
      };
    }
    if (!folderName) {
      return {
        image: imageFromManifest,
        videoCandidates: videoCandidatesFromManifest,
        audioCandidates: audioCandidatesFromManifest,
        subtitleEn: undefined,
        subtitleUr: undefined,
      };
    }

    return {
      image: imageFromManifest,
      videoCandidates: videoCandidatesFromManifest,
      audioCandidates: audioCandidatesFromManifest,
      subtitleEn: undefined,
      subtitleUr: undefined,
    };
  }, [folderName, videoPathKey, guidanceVideoBust, apiMediaGen, mediaOverride]);

  const currentVideo = media.videoCandidates[0];
  const [videoSrc, setVideoSrc] = useState('');
  const [audioSrc, setAudioSrc] = useState('');

  useEffect(() => {
    let alive = true
    void (async () => {
      await loadDisasterDashboardMediaFromApi()
      if (!alive) return
      await loadDisasterSignedVideoPlayback(videoPathKey)
      if (!alive) return
      setApiMediaGen((n) => n + 1)
      setVideoReady(false)
      setPlayVideoRequested(false)
      setVideoError(null)
      setVideoLoadFailed(false)
      setVideoPlaying(false)
      setImageVisible(false)
      setVideoCandidateIndex(0)
      s3ReloadAttemptsRef.current = 0
      setGuidanceVideoBust(Date.now())
    })()
    return () => {
      alive = false
    }
  }, [disaster, mediaOverride, videoPathKey])

  useEffect(() => {
    setVideoSrc(media.videoCandidates[0] ?? '');
    setAudioSrc(media.audioCandidates[0] ?? '');
  }, [media.videoCandidates, media.audioCandidates]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    for (let index = 0; index < video.textTracks.length; index += 1) {
      const track = video.textTracks[index];
      const language = track.language?.toLowerCase();
      const showEnglish = subtitleLang === 'en' && Boolean(language?.startsWith('en'));
      const showUrdu = subtitleLang === 'ur' && Boolean(language?.startsWith('ur'));
      track.mode = showEnglish || showUrdu ? 'showing' : 'disabled';
    }
  }, [subtitleLang, videoReady]);

  useEffect(() => {
    if (subtitleLang === 'en' && media.subtitleEn) {
      return;
    }

    if (subtitleLang === 'ur' && media.subtitleUr) {
      return;
    }

    if (media.subtitleEn) {
      setSubtitleLang('en');
      return;
    }

    if (media.subtitleUr) {
      setSubtitleLang('ur');
      return;
    }

    setSubtitleLang('off');
  }, [media.subtitleEn, media.subtitleUr, subtitleLang]);

  useEffect(() => {
    if (!imageModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImageModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageModalOpen]);

  const openVideo = () => {
    setVideoError(null);
    setPlayVideoRequested(true);
    setVideoReady(true);
    const el = videoRef.current;
    if (!el) {
      return;
    }
    try {
      el.playbackRate = playbackRate;
    } catch {
      // ignore invalid rate on some browsers
    }
    void el.play().catch((err) => {
      console.error('Video failed:', err);
      setVideoError(ui.tapToPlay);
    });
  };

  const handleVideoPlay = () => {
    setVideoPlaying(true);
    setImageVisible(false);
  };

  const handleVideoPause = () => {
    setVideoPlaying(false);
  };

  const handleGuidanceVideoError = () => {
    const el = videoRef.current;
    const cur = el?.currentSrc || videoSrc;
    const mediaErr = el?.error ?? undefined;
    console.error('Video failed:', cur, mediaErr);

    const nextIndex = videoCandidateIndex + 1;
    if (nextIndex < media.videoCandidates.length) {
      const nextSrc = media.videoCandidates[nextIndex];
      setVideoCandidateIndex(nextIndex);
      setVideoSrc(nextSrc);
      return;
    }

    if (s3ReloadAttemptsRef.current >= MAX_S3_RELOAD_ATTEMPTS) {
      setVideoPlaying(false);
      setVideoReady(false);
      setPlayVideoRequested(false);
      setImageVisible(true);
      setVideoError(null);
      setVideoLoadFailed(true);
      return;
    }

    s3ReloadAttemptsRef.current += 1;
    invalidateDisasterSignedVideoCache(videoPathKey);
    void loadDisasterSignedVideoPlayback(videoPathKey).then(() => setApiMediaGen((n) => n + 1));
    setVideoCandidateIndex(0);
    setGuidanceVideoBust(Date.now());
  };

  const openVideoFullscreen = async () => {
    if (!videoRef.current) {
      return;
    }
    const element = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitEnterFullscreen) {
      element.webkitEnterFullscreen();
    }
  };

  const handleGuidanceToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (import.meta.env.DEV) {
      console.log('[DisasterGuidance] view guidance click (once)', { isOpenBefore: isOpen });
    }
    setIsOpen((prev) => {
      const next = !prev;
      if (import.meta.env.DEV) {
        console.log('[DisasterGuidance] isOpen state', { from: prev, to: next });
      }
      return next;
    });
  };

  return (
    <section className="dg-card" aria-label={ui.viewGuidance}>
      <button
        type="button"
        className="dg-toggle"
        onClick={handleGuidanceToggleClick}
        aria-expanded={isOpen}
        aria-controls="disaster-guidance-content"
      >
        <span className="dg-toggle-left">
          <span className="dg-toggle-icon" aria-hidden="true">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="dg-toggle-text">{ui.viewGuidance}</span>
        </span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div id="disaster-guidance-content" className="dg-content">
          <div className="dg-media-stack">
            {media.image && (
              <div className="dg-image-block">
                <button
                  type="button"
                  className="dg-image-toggle-btn"
                  onClick={() => setImageVisible((prev) => !prev)}
                  aria-expanded={imageVisible}
                  aria-controls="dg-image-container"
                >
                  {imageVisible ? ui.hideImage : ui.viewImage}
                </button>

                <div
                  id="dg-image-container"
                  className={`dg-image-collapse ${imageVisible ? 'dg-image-open' : ''}`}
                  aria-hidden={!imageVisible}
                >
                  <button
                    type="button"
                    className="dg-media-image-shell"
                    onClick={() => setImageModalOpen(true)}
                    aria-label={`Open ${disasterName} guidance image in fullscreen`}
                  >
                    <img
                      src={media.image}
                      alt={`${disasterName} guidance illustration`}
                      className="dg-media-image"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </div>

                {videoPlaying && <p className="dg-media-note">{ui.imageHiddenWhileVideo}</p>}
              </div>
            )}

            {currentVideo && !videoLoadFailed && (
              <div className="dg-media-video-shell">
                <div className="dg-video-player-wrap">
                  <video
                    key={`${videoSrc}-${videoCandidateIndex}-${guidanceVideoBust}`}
                    ref={videoRef}
                    className={`dg-video-player ${!videoReady ? 'dg-video-player--under-poster' : ''}`}
                    src={videoSrc}
                    controls
                    playsInline
                    preload="metadata"
                    poster={media.image}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onEnded={handleVideoPause}
                    onError={handleGuidanceVideoError}
                  >
                    {media.subtitleEn && (
                      <track
                        kind="subtitles"
                        srcLang="en"
                        label={ui.subtitleEnglish}
                        src={media.subtitleEn}
                        default
                      />
                    )}
                    {media.subtitleUr && (
                      <track
                        kind="subtitles"
                        srcLang="ur"
                        label={ui.subtitleUrdu}
                        src={media.subtitleUr}
                        default={false}
                      />
                    )}
                    {ui.videoUnsupported}
                  </video>

                  {!videoReady && (
                    <button
                      type="button"
                      className="dg-video-poster dg-video-poster--overlay"
                      onClick={openVideo}
                      aria-label={`${ui.ariaPlayVideo}: ${disasterName}`}
                    >
                      {media.image ? (
                        <img
                          src={media.image}
                          alt={`${disasterName} video thumbnail`}
                          className="dg-video-thumb"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="dg-video-fallback" />
                      )}
                      <span className="dg-video-overlay" />
                      <span className="dg-video-play">{ui.playVideo}</span>
                    </button>
                  )}
                </div>

                {videoReady && (
                  <>
                    <div className="dg-controls-row">
                      <label className="dg-speed-label" htmlFor="dg-video-speed">
                        {ui.speed}
                      </label>
                      <select
                        id="dg-video-speed"
                        className="dg-speed-select"
                        value={playbackRate}
                        onChange={(event) => setPlaybackRate(Number(event.target.value))}
                        aria-label={ui.speed}
                      >
                        {SPEED_OPTIONS.map((speed) => (
                          <option key={speed} value={speed}>
                            {speed}x
                          </option>
                        ))}
                      </select>

                      <label className="dg-speed-label" htmlFor="dg-subtitle-language">
                        {ui.subtitles}
                      </label>
                      <select
                        id="dg-subtitle-language"
                        className="dg-speed-select"
                        value={subtitleLang}
                        onChange={(event) => setSubtitleLang(event.target.value as SubtitleOption)}
                        aria-label={ui.subtitles}
                      >
                        <option value="off">{ui.subtitleOff}</option>
                        <option value="en" disabled={!media.subtitleEn}>{ui.subtitleEnglish}</option>
                        <option value="ur" disabled={!media.subtitleUr}>{ui.subtitleUrdu}</option>
                      </select>

                      <button
                        type="button"
                        className="dg-fullscreen-btn"
                        onClick={openVideoFullscreen}
                        aria-label={ui.ariaFullscreen}
                      >
                        <Expand className="h-4 w-4" />
                        {ui.fullscreen}
                      </button>
                    </div>

                    {!media.subtitleEn && !media.subtitleUr && (
                      <p className="dg-media-note">{ui.subtitlesUnavailable}</p>
                    )}
                  </>
                )}

                {videoError && (
                  <p className="dg-media-error dg-media-error--detail" role="status" aria-live="polite">
                    {videoError}
                  </p>
                )}
              </div>
            )}

            {(media.videoCandidates.filter(Boolean).length === 0 || videoLoadFailed) && (
              <p className="dg-media-note">{ui.videoUnavailable}</p>
            )}

            {audioSrc ? (
              <audio controls preload="metadata" className="w-full max-w-3xl">
                <source src={audioSrc} />
              </audio>
            ) : (
              <p className="dg-media-note">{ui.audioUnavailable}</p>
            )}
          </div>

          <div className="dg-guidance-section">
            <h3>{ui.beforeTitle}</h3>
            <ul>
              {structured.before.map((item, index) => (
                <li key={`before-${index}`} className="dg-guidance-li">
                  <div>{item.text}</div>
                  {item.image ? (
                    <img
                      src={toWebSafeUrl(item.image)}
                      alt=""
                      className="mt-2 max-h-48 w-full max-w-lg rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {item.video ? (
                    <video
                      src={toWebSafeUrl(item.video)}
                      className="mt-2 w-full max-w-lg rounded-lg"
                      controls
                      playsInline
                    />
                  ) : null}
                  {item.audio ? (
                    <audio src={toWebSafeUrl(item.audio)} controls preload="none" className="mt-2 w-full max-w-lg" />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="dg-guidance-section">
            <h3>{ui.duringTitle}</h3>
            <ul>
              {structured.during.map((item, index) => (
                <li key={`during-${index}`} className="dg-guidance-li">
                  <div>{item.text}</div>
                  {item.image ? (
                    <img
                      src={toWebSafeUrl(item.image)}
                      alt=""
                      className="mt-2 max-h-48 w-full max-w-lg rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {item.video ? (
                    <video
                      src={toWebSafeUrl(item.video)}
                      className="mt-2 w-full max-w-lg rounded-lg"
                      controls
                      playsInline
                    />
                  ) : null}
                  {item.audio ? (
                    <audio src={toWebSafeUrl(item.audio)} controls preload="none" className="mt-2 w-full max-w-lg" />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="dg-guidance-section">
            <h3>{ui.afterTitle}</h3>
            <ul>
              {structured.after.map((item, index) => (
                <li key={`after-${index}`} className="dg-guidance-li">
                  <div>{item.text}</div>
                  {item.image ? (
                    <img
                      src={toWebSafeUrl(item.image)}
                      alt=""
                      className="mt-2 max-h-48 w-full max-w-lg rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {item.video ? (
                    <video
                      src={toWebSafeUrl(item.video)}
                      className="mt-2 w-full max-w-lg rounded-lg"
                      controls
                      playsInline
                    />
                  ) : null}
                  {item.audio ? (
                    <audio src={toWebSafeUrl(item.audio)} controls preload="none" className="mt-2 w-full max-w-lg" />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {imageModalOpen ?
        <div
          className="dg-modal dg-modal-open"
          role="dialog"
          aria-modal="true"
          aria-label={`${disasterName} guidance image fullscreen`}
          onClick={(event) => {
            event.stopPropagation();
            setImageModalOpen(false);
          }}
        >
          <button
            type="button"
            className="dg-modal-close"
            onClick={(event) => {
              event.stopPropagation();
              setImageModalOpen(false);
            }}
            aria-label={ui.closeFullscreen}
          >
            <X className="h-5 w-5" />
          </button>

          {media.image ?
            <img
              src={media.image}
              alt={`${disasterName} guidance full preview`}
              className="dg-modal-image"
              onClick={(event) => event.stopPropagation()}
            />
          : null}
        </div>
      : null}
    </section>
  );
}
