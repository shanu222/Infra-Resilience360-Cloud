import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";

type HubSlide = {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
};

type HubCarouselProps = {
  slides: HubSlide[];
  intervalMs?: number;
};

export function HubCarousel({ slides, intervalMs = 4000 }: HubCarouselProps) {
  const t = useMaterialHubStrings();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length, intervalMs]);

  if (slides.length === 0) {
    return (
      <div className="h-full min-h-[280px] rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-fuchsia-100/70 flex items-center justify-center text-slate-600 shadow-md">
        {t.hubImagesUnavailable}
      </div>
    );
  }

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className="group relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${isActive ? "opacity-100" : "opacity-0"}`}
            aria-hidden={!isActive}
          >
            <img
              src={slide.imageUrl}
              alt={`${slide.name} hub`}
              className="h-full w-full object-cover"
              loading={isActive ? "eager" : "lazy"}
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">{t.carouselBadge}</p>
              <h3 className="text-xl font-bold text-white">{slide.name}</h3>
              <p className="text-sm text-emerald-50">{slide.location}</p>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur transition-all hover:bg-white"
            aria-label="Previous hub"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur transition-all hover:bg-white"
            aria-label="Next hub"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-6 bg-emerald-300" : "w-2.5 bg-white/70"}`}
                aria-label={`Go to ${slide.name}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
