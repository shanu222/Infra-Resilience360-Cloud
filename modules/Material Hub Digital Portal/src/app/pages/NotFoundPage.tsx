import { Link } from "react-router";
import { useMaterialHubStrings } from "../../i18n/materialHubStrings";

export function NotFoundPage() {
  const t = useMaterialHubStrings();
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.notFoundTitle}</h1>
      <p className="text-gray-600 mb-8">{t.notFoundBody}</p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        {t.notFoundHome}
      </Link>
    </div>
  );
}
