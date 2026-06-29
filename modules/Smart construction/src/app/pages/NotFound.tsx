import { Link } from 'react-router';
import { Home } from 'lucide-react';
import ModuleBackground from '../components/ModuleBackground';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';

export default function NotFound() {
  const t = useSmartConstructionStrings();
  return (
    <ModuleBackground>
    <div className="min-h-0 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">{t.notFound.code}</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t.notFound.title}</h2>
        <p className="text-gray-600 mb-8">
          {t.notFound.body}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          <Home className="w-5 h-5" />
          {t.notFound.home}
        </Link>
      </div>
    </div>
    </ModuleBackground>
  );
}
