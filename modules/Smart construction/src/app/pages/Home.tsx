import { Link } from 'react-router';
import { Building2, Shield, Calculator, Map, HardHat, Lightbulb } from 'lucide-react';
import ModuleBackground from '../components/ModuleBackground';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';

export default function Home() {
  const t = useSmartConstructionStrings();
  return (
    <ModuleBackground>
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {t.title}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-xl p-6 border border-indigo-400/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-[0_10px_24px_rgba(30,41,59,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(79,70,229,0.38)] hover:border-indigo-300/50">
            <div className="w-12 h-12 bg-indigo-400/20 rounded-lg border border-indigo-300/35 flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6 text-indigo-200" />
            </div>
            <h3 className="font-semibold text-white mb-2">{t.f1h}</h3>
            <p className="text-indigo-100/90 text-sm">
              {t.f1p}
            </p>
          </div>

          <div className="rounded-xl p-6 border border-emerald-400/30 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-[0_10px_24px_rgba(30,41,59,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(16,185,129,0.35)] hover:border-emerald-300/50">
            <div className="w-12 h-12 bg-emerald-400/20 rounded-lg border border-emerald-300/35 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-emerald-200" />
            </div>
            <h3 className="font-semibold text-white mb-2">{t.f2h}</h3>
            <p className="text-emerald-100/90 text-sm">
              {t.f2p}
            </p>
          </div>

          <div className="rounded-xl p-6 border border-amber-400/30 bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 text-white shadow-[0_10px_24px_rgba(30,41,59,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(249,115,22,0.34)] hover:border-amber-300/50">
            <div className="w-12 h-12 bg-amber-400/20 rounded-lg border border-amber-300/35 flex items-center justify-center mb-4">
              <HardHat className="w-6 h-6 text-amber-200" />
            </div>
            <h3 className="font-semibold text-white mb-2">{t.f3h}</h3>
            <p className="text-amber-100/90 text-sm">
              {t.f3p}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mb-12">
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Building2 className="w-6 h-6" />
            {t.cta}
          </Link>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.howTitle}</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.s1h}</h3>
              <p className="text-gray-600 text-sm">
                {t.s1p}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.s2h}</h3>
              <p className="text-gray-600 text-sm">
                {t.s2p}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.s3h}</h3>
              <p className="text-gray-600 text-sm">
                {t.s3p}
              </p>
            </div>
          </div>
        </div>

        {/* Key Differentiator */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">{t.diffTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-semibold mb-1">{t.d1h}</p>
              <p className="text-sm text-indigo-100">{t.d1p}</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🛡️</div>
              <p className="font-semibold mb-1">{t.d2h}</p>
              <p className="text-sm text-indigo-100">{t.d2p}</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🏗️</div>
              <p className="font-semibold mb-1">{t.d3h}</p>
              <p className="text-sm text-indigo-100">{t.d3p}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ModuleBackground>
  );
}
