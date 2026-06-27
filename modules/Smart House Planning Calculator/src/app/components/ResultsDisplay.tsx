import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import type { CalculationResults, RiskLevel } from '../types';

interface ResultsDisplayProps {
  results: CalculationResults;
}

function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'Low':
      return 'bg-green-500 text-green-800 border-green-200';
    case 'Medium':
      return 'bg-yellow-500 text-yellow-900 border-yellow-200';
    case 'High':
      return 'bg-red-500 text-red-900 border-red-200';
  }
}

function getRiskWidth(risk: RiskLevel): string {
  switch (risk) {
    case 'Low':
      return '33%';
    case 'Medium':
      return '66%';
    case 'High':
      return '100%';
  }
}

function highlightImportantValue(value: string): string {
  if (value.includes('Raised RCC Foundation')) {
    return 'text-blue-700 font-bold';
  }
  if (value.includes('Outward Opening')) {
    return 'text-emerald-700 font-bold';
  }
  if (value.includes('Steel Fire-Rated Door')) {
    return 'text-red-700 font-bold';
  }
  return 'text-slate-900 font-semibold';
}

function toLabel(value: boolean): string {
  return value ? 'Required' : 'Optional';
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const sectionCardClass = 'mb-4 border border-[#e5e7eb] shadow-sm bg-white/95';

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-[#e5e7eb] bg-gradient-to-br from-white via-slate-50 to-blue-50 p-4 md:p-8 shadow-xl">
      <Card className={sectionCardClass}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl md:text-[24px] font-extrabold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
                🏠 Smart House Safety Report
              </CardTitle>
              <CardDescription className="mt-2 text-sm md:text-base text-slate-600">
                Code-Compliant Safety Analysis
              </CardDescription>
            </div>
            <Button onClick={() => window.print()} variant="outline" className="self-start">
              <Download className="h-4 w-4" />
              Download Report (PDF)
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Risk Level Overview</CardTitle>
          <CardDescription>Colorful badges show your primary hazard levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Flood', value: results.risks.floodRisk },
              { label: 'Earthquake', value: results.risks.earthquakeRisk },
              { label: 'Heat', value: results.risks.heatRisk },
            ].map((risk) => (
              <div
                key={risk.label}
                className="rounded-xl border border-[#e5e7eb] bg-slate-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{risk.label}</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${getRiskColor(
                      risk.value,
                    )}`}
                  >
                    {risk.value}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: getRiskWidth(risk.value) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-blue-700">🏗️ Foundation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                ✔ Type: <span className={highlightImportantValue(results.foundation.type)}>{results.foundation.type}</span>
              </li>
              <li>✔ Detail: <strong>{results.foundation.details}</strong></li>
              {results.foundation.raisedPlinth && (
                <li>
                  ✔ Raised Plinth: <strong className="text-blue-700">{results.foundation.raisedPlinth}</strong>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-emerald-700">🧱 Structural System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">
              ✔ <strong>{results.structural.recommendation}</strong>
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              {results.structural.details.map((detail, idx) => (
                <li key={idx}>✔ {detail}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-indigo-700">🚪 Door Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#e5e7eb] bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Opening Direction</p>
              <p className={highlightImportantValue(results.door.direction)}>{results.door.direction}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Material</p>
              <p className={highlightImportantValue(results.door.material)}>{results.door.material}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dimensions</p>
              <p className="font-semibold text-slate-900">{results.door.dimensions}</p>
            </div>
          </div>
          <p>
            ✔ <strong>Reasoning:</strong> {results.door.reasoning}
          </p>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-orange-700">🔥 Fire Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#e5e7eb] bg-orange-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Extinguishers</p>
              <p className="text-xl font-bold text-orange-700">{results.fireSafety.extinguishers}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] bg-orange-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Smoke Detectors</p>
              <p className="font-bold text-orange-700">{toLabel(results.fireSafety.smokeDetectors)}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] bg-orange-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Alarm System</p>
              <p className="font-bold text-orange-700">{toLabel(results.fireSafety.fireAlarmSystem)}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {results.fireSafety.details.map((detail, idx) => (
              <li key={idx}>✔ {detail}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {results.floodSafety.required && (
        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-cyan-700">🌊 Flood Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {results.floodSafety.equipment.map((item, idx) => (
                <li key={idx}>✔ {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-amber-700">⚡ Electrical Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <ul className="space-y-2">
            {results.electricalSafety.components.map((item, idx) => (
              <li key={idx}>
                ✔ <strong>{item}</strong>
              </li>
            ))}
          </ul>
          <ul className="space-y-2">
            {results.electricalSafety.details.map((item, idx) => (
              <li key={idx}>✔ {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-teal-700">🌡️ Heat & Ventilation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[#e5e7eb] bg-cyan-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Fans</p>
              <p className="text-xl font-bold text-teal-700">{results.ventilationHeat.fans}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7eb] bg-cyan-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Windows</p>
              <p className="text-xl font-bold text-teal-700">{results.ventilationHeat.windows}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {results.ventilationHeat.additionalRequirements.map((item, idx) => (
              <li key={idx}>✔ {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {results.earthquakeSafety.required && (
        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-violet-700">🧭 Earthquake Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <ul className="space-y-2">
              {results.earthquakeSafety.equipment.map((item, idx) => (
                <li key={idx}>✔ {item}</li>
              ))}
            </ul>
            <ul className="space-y-2">
              {results.earthquakeSafety.recommendations.map((item, idx) => (
                <li key={idx}>✔ {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-sky-700">💧 Water Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="rounded-lg border border-[#e5e7eb] bg-sky-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tap Points</p>
            <p className="text-xl font-bold text-sky-700">{results.waterRequirements.tapPoints}</p>
          </div>
          <ul className="space-y-2">
            {results.waterRequirements.details.map((item, idx) => (
              <li key={idx}>✔ {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-4 rounded-xl border border-orange-300 bg-[#fff3cd] p-4">
        <h3 className="mb-2 text-base font-bold text-orange-900">⚠️ Warnings</h3>
        {results.warnings.length > 0 ? (
          <ul className="space-y-1 text-sm text-orange-900">
            {results.warnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-orange-900">No critical warnings detected for the provided inputs.</p>
        )}
      </div>
    </div>
  );
}
