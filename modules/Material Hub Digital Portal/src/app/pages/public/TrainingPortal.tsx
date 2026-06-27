import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Clock, Images, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";
import { resolvePortalAssetCandidates } from "../../../utils/portalContentMedia";

type VideoTutorial = {
  title: string;
  duration: string;
  views: number;
  description: string;
};

const galleryCardThemes = [
  {
    shell: "from-emerald-50/95 via-teal-50/90 to-sky-100/75",
    border: "border-emerald-200/85",
    imageBorder: "border-emerald-300/70",
    title: "text-emerald-950",
    meta: "text-emerald-900/70",
    hoverGlow: "hover:shadow-emerald-200/80"
  },
  {
    shell: "from-slate-50/95 via-blue-50/90 to-sky-100/75",
    border: "border-blue-200/85",
    imageBorder: "border-blue-300/70",
    title: "text-slate-900",
    meta: "text-slate-700/80",
    hoverGlow: "hover:shadow-blue-200/80"
  },
  {
    shell: "from-amber-50/95 via-orange-50/85 to-stone-100/75",
    border: "border-amber-200/85",
    imageBorder: "border-amber-300/70",
    title: "text-amber-950",
    meta: "text-amber-900/70",
    hoverGlow: "hover:shadow-amber-200/80"
  },
  {
    shell: "from-cyan-50/95 via-teal-50/90 to-emerald-100/75",
    border: "border-teal-200/85",
    imageBorder: "border-teal-300/70",
    title: "text-teal-950",
    meta: "text-teal-900/70",
    hoverGlow: "hover:shadow-teal-200/80"
  },
  {
    shell: "from-slate-100/95 via-zinc-50/90 to-stone-100/80",
    border: "border-slate-300/75",
    imageBorder: "border-slate-300/70",
    title: "text-slate-900",
    meta: "text-slate-700/80",
    hoverGlow: "hover:shadow-slate-300/80"
  }
] as const;

const guidanceImageFiles = [
  "bamboo-installation-guide.png",
  "cgi-sheet-roofing.png",
  "disaster-resilient-rope-tying-methods.png",
  "durable-wooden-plank-assembly-guide.png",
  "eps-panel-fitting-guide.png",
  "pallet-handling-and-storage.png",
  "polythene-sheet-installation-guide.png",
  "steel-girder-placement-guide.png",
  "wooden-stick-chick-mat-application.png",
] as const;

const normalizeTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/\.png$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const scoreTitleMatch = (title: string, imageName: string): number => {
  const titleTokens = normalizeTokens(title);
  const imageTokens = normalizeTokens(imageName);
  const imageTokenSet = new Set(imageTokens);

  let score = 0;
  for (const token of titleTokens) {
    if (imageTokenSet.has(token)) {
      score += 3;
    } else if (imageTokens.some((imageToken) => imageToken.includes(token) || token.includes(imageToken))) {
      score += 1;
    }
  }

  if (imageName.includes("guide")) {
    score += 0.25;
  }

  return score;
};

const getGuidanceThumbnail = (title: string): string => {
  const bestImage = guidanceImageFiles
    .map((fileName) => ({ fileName, score: scoreTitleMatch(title, fileName) }))
    .sort((a, b) => b.score - a.score)[0]?.fileName;

  const localRef = bestImage ? `assets/guidance/${bestImage}` : "assets/guidance/bamboo-installation-guide.png";
  return resolvePortalAssetCandidates(localRef)[0] ?? resolvePortalAssetCandidates("assets/guidance/bamboo-installation-guide.png")[0] ?? "";
};

/** English titles for thumbnail matching (image filenames); display titles come from i18n. */
const GUIDANCE_THUMB_TITLES = [
  "Bamboo Installation Guide",
  "Wooden Stick Chick Mat Application",
  "Polythene Sheet Usage",
  "Cotton Rope Tying Methods",
  "Steel Girder Placement",
  "CGI Sheet Roofing",
  "Wooden Plank Assembly",
  "EPS Panel Fitting",
  "Pallet Handling and Storage",
] as const;

export function TrainingPortal() {
  const t = useMaterialHubStrings();

  const videos: VideoTutorial[] = useMemo(
    () => [
      { title: t.train1Title, duration: t.train1Dur, views: 1234, description: t.train1Desc },
      { title: t.train2Title, duration: t.train2Dur, views: 987, description: t.train2Desc },
      { title: t.train3Title, duration: t.train3Dur, views: 1543, description: t.train3Desc },
      { title: t.train4Title, duration: t.train4Dur, views: 876, description: t.train4Desc },
      { title: t.train5Title, duration: t.train5Dur, views: 1102, description: t.train5Desc },
      { title: t.train6Title, duration: t.train6Dur, views: 2341, description: t.train6Desc },
      { title: t.train7Title, duration: t.train7Dur, views: 765, description: t.train7Desc },
      { title: t.train8Title, duration: t.train8Dur, views: 1320, description: t.train8Desc },
      { title: t.train9Title, duration: t.train9Dur, views: 642, description: t.train9Desc },
    ],
    [t],
  );

  const videosWithThumbnails = useMemo(
    () =>
      videos.map((video, index) => ({
        ...video,
        thumbnail: getGuidanceThumbnail(GUIDANCE_THUMB_TITLES[index] ?? GUIDANCE_THUMB_TITLES[0]),
      })),
    [videos],
  );

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % videosWithThumbnails.length);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + videosWithThumbnails.length) % videosWithThumbnails.length);
  };

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
      if (event.key === "ArrowLeft") {
        goPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, videosWithThumbnails.length]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const current = videosWithThumbnails[activeIndex]?.thumbnail;
    const prev = videosWithThumbnails[(activeIndex - 1 + videosWithThumbnails.length) % videosWithThumbnails.length]?.thumbnail;
    const next = videosWithThumbnails[(activeIndex + 1) % videosWithThumbnails.length]?.thumbnail;

    [current, prev, next].forEach((src) => {
      if (!src) {
        return;
      }
      const img = new Image();
      img.src = src;
    });
  }, [activeIndex, lightboxOpen, videosWithThumbnails]);

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
    setTouchEndX(null);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(event.changedTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) {
      return;
    }

    const swipeDistance = touchStartX - touchEndX;
    const minSwipe = 45;

    if (swipeDistance > minSwipe) {
      goNext();
    } else if (swipeDistance < -minSwipe) {
      goPrev();
    }
  };

  const totalViews = videosWithThumbnails.reduce((sum, video) => sum + video.views, 0);

  const activeItem = videosWithThumbnails[activeIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.trainTitle}</h1>
        <p className="text-xl text-gray-600">{t.trainSubtitle}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <GraduationCap className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">3</div>
          <div className="text-emerald-100">{t.trainActiveHubs}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <Images className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">{videosWithThumbnails.length}</div>
          <div className="text-blue-100">{t.trainGuidanceImages}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <Clock className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">{totalViews.toLocaleString()}</div>
          <div className="text-purple-100">{t.trainTotalViews}</div>
        </div>
      </div>

      {/* Guidance Gallery Section */}
      <div className="bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50/90 rounded-2xl p-8 mb-12 border border-slate-200/80 shadow-sm shadow-slate-200/70">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Images className="h-7 w-7 mr-3 text-emerald-600" />
          {t.trainGuidanceLibrary}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videosWithThumbnails.map((video, idx) => {
            const theme = galleryCardThemes[idx % galleryCardThemes.length];

            return (
            <button
              key={idx}
              type="button"
              onClick={() => openLightbox(idx)}
              className={`
                group w-full text-left rounded-2xl border ${theme.border}
                bg-gradient-to-br ${theme.shell} p-4 shadow-md shadow-slate-200/65
                transition-all duration-300 cursor-pointer
                hover:-translate-y-1 hover:shadow-xl ${theme.hoverGlow}
              `}
            >
              <div className={`rounded-xl h-40 mb-4 overflow-hidden border ${theme.imageBorder} bg-white/70`}>
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className={`font-bold mb-2 ${theme.title}`}>{video.title}</h3>
              <div className={`flex items-center justify-between text-sm ${theme.meta}`}>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {video.duration}
                </span>
                <span>
                  {video.views.toLocaleString()} {t.trainViewsSuffix}
                </span>
              </div>
            </button>
            );
          })}
        </div>
      </div>

      {lightboxOpen && activeItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm p-3 sm:p-6"
          onClick={closeLightbox}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-2 top-2 z-20 rounded-full bg-white/12 p-2 text-white hover:bg-white/20 transition-colors sm:right-4 sm:top-4"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={goPrev}
              className="absolute left-1 z-20 rounded-full bg-white/12 p-2 text-white hover:bg-white/20 transition-colors sm:left-4"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-1 z-20 rounded-full bg-white/12 p-2 text-white hover:bg-white/20 transition-colors sm:right-4"
              aria-label="Next image"
            >
              <ChevronRight className="h-7 w-7" />
            </button>

            <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-slate-950/60 shadow-2xl ring-1 ring-white/15">
              <div
                className="relative flex items-center justify-center bg-black/50 px-2 py-4 sm:px-6 sm:py-6"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  key={activeItem.thumbnail}
                  src={activeItem.thumbnail}
                  alt={activeItem.title}
                  className="max-h-[62vh] w-full rounded-lg object-contain transition-all duration-300"
                  loading="eager"
                  decoding="async"
                />
              </div>

              <div className="border-t border-white/10 bg-slate-900/80 px-4 py-4 sm:px-6">
                <div className="mb-1 text-base font-semibold text-white sm:text-lg">{activeItem.title}</div>
                <p className="text-sm text-slate-200 sm:text-base">{activeItem.description}</p>
                <div className="mt-2 text-xs text-slate-400 sm:text-sm">
                  {activeIndex + 1} / {videosWithThumbnails.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
