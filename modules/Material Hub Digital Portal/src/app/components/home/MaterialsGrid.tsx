import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";

type MaterialCard = {
  id: string;
  name: string;
  imageUrl: string;
  quantity?: number;
};

type MaterialsGridProps = {
  materials: MaterialCard[];
};

export function MaterialsGrid({ materials }: MaterialsGridProps) {
  const t = useMaterialHubStrings();
  return (
    <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 to-green-100/75 p-5 shadow-md shadow-emerald-500/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.materialsTitle}</h2>
          <p className="text-sm text-slate-600">{t.materialsSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {materials.map((material) => (
          <article
            key={material.id}
            className="group overflow-hidden rounded-2xl border border-emerald-200/70 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20"
          >
            <img
              src={material.imageUrl}
              alt={material.name}
              className="h-28 w-full object-cover sm:h-32"
              loading="lazy"
              decoding="async"
            />
            <div className="space-y-1 p-3">
              <p className="text-sm font-semibold text-slate-900">{material.name}</p>
              {typeof material.quantity === "number" && (
                <p className="text-xs text-emerald-800/90">
                  {t.quantity}: {material.quantity.toLocaleString()}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
